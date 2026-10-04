import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrder } from './payment.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrder])],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
