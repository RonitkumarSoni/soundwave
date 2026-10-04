import type { AuthenticatedRequest } from './authenticated-request';
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { UpdateProfileDto } from '../user/profile.dto';
class FirebaseLoginDto {
  @IsString()
  @MaxLength(8192)
  id_token: string;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  firebaseLogin(@Body() dto: FirebaseLoginDto) {
    return this.authService.firebaseLogin(dto.id_token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(
      req.user.id,
      dto.display_name,
      dto.avatar_url,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Request() req: AuthenticatedRequest) {
    return this.authService.deleteAccount(
      req.user.id,
      req.user.uid,
      req.user.auth_time,
    );
  }
}
