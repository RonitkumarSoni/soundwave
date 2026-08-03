import { Controller, Post, Patch, Delete, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';



class RefreshDto {
  @IsString()
  refresh_token: string;
}

class FirebaseLoginDto {
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



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}



  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseLogin(@Body() dto: FirebaseLoginDto) {
    return this.authService.firebaseLogin(dto.id_token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto.display_name, dto.avatar_url);
  }



  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Request() req: any) {
    return this.authService.deleteAccount(req.user.userId);
  }
}
