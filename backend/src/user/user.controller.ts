import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(
    @Request() req: any,
    @Body() body: { display_name?: string; avatar_url?: string },
  ) {
    return this.userService.update(req.user.id, body);
  }
}
