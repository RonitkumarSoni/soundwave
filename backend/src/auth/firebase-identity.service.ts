import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { ServiceAccount } from 'firebase-admin/app';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

@Injectable()
export class FirebaseIdentityService {
  private readonly logger = new Logger(FirebaseIdentityService.name);
  constructor(private readonly config: ConfigService) {}
  get adminAuth() {
    try {
      if (!getApps().length) {
        const json = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
        const file = resolve(process.cwd(), 'firebase-service-account.json');
        const account: ServiceAccount | undefined = json
          ? (JSON.parse(json) as ServiceAccount)
          : existsSync(file)
            ? (JSON.parse(readFileSync(file, 'utf8')) as ServiceAccount)
            : undefined;
        initializeApp({
          credential: account ? cert(account) : applicationDefault(),
          projectId: this.config.get<string>(
            'FIREBASE_PROJECT_ID',
            'music-app-92cbb',
          ),
        });
      }
      return getAuth();
    } catch {
      throw new ServiceUnavailableException(
        'Authentication service is not configured',
      );
    }
  }
  async verify(token: string) {
    try {
      const identity = await this.adminAuth.verifyIdToken(token, true);
      if (!identity.email || !identity.email_verified)
        throw new UnauthorizedException(
          'Verify your email before using your account',
        );
      return identity;
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof UnauthorizedException
      )
        throw error;
      const code = (error as { code?: string })?.code;
      // Never log the token or raw SDK error: either can contain account data.
      this.logger.warn({
        event: 'firebase-session-rejected',
        code: typeof code === 'string' && /^(auth|app)\/[a-z-]+$/.test(code) ? code : 'unknown',
      });
      if (
        code &&
        [
          'app/network-error',
          'app/invalid-credential',
          'auth/invalid-credential',
          'auth/insufficient-permission',
          'auth/internal-error',
        ].includes(code)
      ) {
        throw new ServiceUnavailableException(
          'Backend authentication service could not verify your session',
        );
      }
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
