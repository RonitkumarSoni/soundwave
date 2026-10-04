import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseIdentityService } from './firebase-identity.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly identity: FirebaseIdentityService,
  ) {}
  async firebaseLogin(token: string) {
    const decoded = await this.identity.verify(token);
    const user = await this.users.findOrCreateByFirebase(decoded);
    return this.users.getProfile(user.id);
  }
  async updateProfile(
    userId: string,
    displayName?: string,
    avatarUrl?: string,
  ) {
    await this.users.updateProfile(userId, displayName, avatarUrl);
    return this.users.getProfile(userId);
  }
  async deleteAccount(userId: string, uid: string, authTime: number) {
    if (Date.now() / 1000 - authTime > 300)
      throw new UnauthorizedException(
        'Sign in again before deleting your account',
      );
    // Remove owned SQL records before removing the identity. Failure is retryable.
    await this.users.deleteAccount(userId);
    try {
      await this.identity.adminAuth.deleteUser(uid);
    } catch (error) {
      if ((error as { code?: string }).code !== 'auth/user-not-found')
        throw error;
    }
    return { success: true };
  }
}
