import { Global, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseIdentityService } from './firebase-identity.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, FirebaseIdentityService, JwtAuthGuard],
  exports: [FirebaseIdentityService, JwtAuthGuard, UserModule],
})
export class AuthModule {}
