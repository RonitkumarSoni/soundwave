import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { BillingService } from './billing.service';
export class VerifyPaymentDto {
  @IsString() @Matches(/^order_[a-zA-Z0-9]+$/) order_id: string;
  @IsString() @Matches(/^pay_[a-zA-Z0-9]+$/) payment_id: string;
  @IsString() @Matches(/^[a-fA-F0-9]{64}$/) signature: string;
}
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get('config') config() {
    return this.billing.availability();
  }
  @Post('orders')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Req() req: AuthenticatedRequest) {
    return this.billing.create(req.user.id);
  }
  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verify(@Req() req: AuthenticatedRequest, @Body() dto: VerifyPaymentDto) {
    return this.billing.verify(
      req.user.id,
      dto.order_id,
      dto.payment_id,
      dto.signature,
    );
  }
}
