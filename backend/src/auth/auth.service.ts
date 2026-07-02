import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

export interface TokenPayload {
  sub: string; // user id
  email: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: Omit<User, 'password_hash'>;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  /**
   * Register a new user with email + password
   */
  async signup(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthTokens> {
    // Check if user already exists
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with bcrypt (per 06-AUTH.md)
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.userService.create({
      email,
      password_hash,
      display_name: displayName || email.split('@')[0],
    });

    return this.generateTokens(user);
  }

  /**
   * Login with email + password
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user);
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const access_token = this.generateAccessToken(user);
      return { access_token };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Login/Signup with Google
   */
  async googleLogin(idToken: string): Promise<AuthTokens> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const user = await this.userService.findOrCreateByGoogle(
        payload.email,
        payload.name || payload.email.split('@')[0],
        payload.picture || '',
      );

      return this.generateTokens(user);
    } catch (err) {
      console.error('Google auth error:', err);
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  /**
   * Update Profile
   */
  async updateProfile(userId: string, displayName?: string, avatarUrl?: string) {
    const user = await this.userService.updateProfile(userId, displayName, avatarUrl);
    if (!user) throw new UnauthorizedException('User not found');
    const { password_hash, ...userProfile } = user;
    return userProfile;
  }

  /**
   * Change Password
   */
  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.userService.findById(userId);
    if (!user || !user.password_hash) {
      throw new ConflictException('Cannot change password for OAuth accounts');
    }

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid old password');
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPass, salt);
    await this.userService.update(userId, { password_hash: newHash });
    return { success: true };
  }

  /**
   * Delete Account
   */
  async deleteAccount(userId: string) {
    await this.userService.deleteAccount(userId);
    return { success: true };
  }

  /**
   * Generate both access and refresh tokens
   */
  private generateTokens(user: User): AuthTokens {
    const access_token = this.generateAccessToken(user);

    // Refresh token: 30 days per 06-AUTH.md
    const refresh_token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '30d') as any,
      },
    );

    const { password_hash, ...userProfile } = user;
    return { access_token, refresh_token, user: userProfile as any };
  }

  private generateAccessToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }
}
