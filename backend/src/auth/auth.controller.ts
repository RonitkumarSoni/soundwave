import { Controller, Post, Patch, Delete, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  display_name?: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class RefreshDto {
  @IsString()
  refresh_token: string;
}

class GoogleLoginDto {
  @IsString()
  id_token: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}

class ChangePasswordDto {
  @IsString()
  old_password: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.email, dto.password, dto.display_name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto.id_token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto.display_name, dto.avatar_url);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto.old_password, dto.new_password);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Request() req: any) {
    return this.authService.deleteAccount(req.user.userId);
  }
}
