import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs';
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
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Firebase Admin
    if (!getApps().length) {
      try {
        const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          initializeApp({
            credential: cert(serviceAccount),
          });
        } else {
          console.warn('Firebase Service Account file missing at', serviceAccountPath);
        }
      } catch (err) {
        console.error('Failed to initialize Firebase Admin:', err);
      }
    }
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
   * Login/Signup with Firebase
   */
  async firebaseLogin(firebaseIdToken: string): Promise<AuthTokens> {
    try {
      if (!getApps().length) {
        throw new Error('Firebase Admin not initialized');
      }

      // Verify the Firebase ID token
      const decodedToken = await getAuth().verifyIdToken(firebaseIdToken);
      
      if (!decodedToken || !decodedToken.email) {
        throw new UnauthorizedException('Invalid Firebase token');
      }

      const user = await this.userService.findOrCreateByGoogle(
        decodedToken.email,
        decodedToken.name || decodedToken.email.split('@')[0],
        decodedToken.picture || '',
      );

      return this.generateTokens(user);
    } catch (err) {
      console.error('Firebase auth error:', err);
      throw new UnauthorizedException('Invalid Firebase token');
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
