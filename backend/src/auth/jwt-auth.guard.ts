import type { AuthenticatedRequest } from './authenticated-request';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseIdentityService } from './firebase-identity.service';
import { UserService } from '../user/user.service';

// Existing route imports keep their name; sessions now use Firebase exclusively.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly identity: FirebaseIdentityService,
    private readonly users: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
    if (!match) throw new UnauthorizedException('Sign in to continue');
    const decoded = await this.identity.verify(match[1]);
    const user = await this.users.findOrCreateByFirebase(decoded);
    req.user = {
      id: user.id,
      uid: decoded.uid,
      email: user.email,
      is_premium:
        user.is_premium &&
        (!user.premium_expires_at ||
          new Date(user.premium_expires_at).getTime() > Date.now()),
      auth_time: decoded.auth_time,
    };
    return true;
  }
}
