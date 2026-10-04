import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import axios from 'axios';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { PaymentOrder } from './payment.entity';
import { User } from '../user/user.entity';
interface Payment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
}
@Injectable()
export class BillingService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PaymentOrder)
    private readonly orders: Repository<PaymentOrder>,
    private readonly db: DataSource,
  ) {}
  private credentials() {
    const username = this.config.get<string>('RAZORPAY_KEY_ID', '');
    const password = this.config.get<string>('RAZORPAY_KEY_SECRET', '');
    if (
      this.config.get('NODE_ENV') === 'production' ||
      !username.startsWith('rzp_test_') ||
      !password
    )
      throw new ServiceUnavailableException(
        'Test billing is not configured on this server',
      );
    return { username, password };
  }
  availability() {
    try {
      this.credentials();
      return {
        enabled: true,
        mode: 'test',
        amount: 9900,
        currency: 'INR',
        days: 30,
      };
    } catch {
      return {
        enabled: false,
        mode: 'test',
        amount: 9900,
        currency: 'INR',
        days: 30,
      };
    }
  }
  async create(userId: string) {
    const auth = this.credentials();
    try {
      const { data } = await axios.post<{
        id: string;
        amount: number;
        currency: string;
      }>(
        'https://api.razorpay.com/v1/orders',
        {
          amount: 9900,
          currency: 'INR',
          receipt: randomUUID(),
          notes: { user_id: userId, plan: 'premium_30_days_test' },
        },
        { auth, timeout: 15000, maxRedirects: 0 },
      );
      if (
        !/^order_[A-Za-z0-9]+$/.test(data.id) ||
        data.amount !== 9900 ||
        data.currency !== 'INR'
      )
        throw new Error('Invalid provider order');
      await this.orders.save(
        this.orders.create({
          id: data.id,
          user_id: userId,
          amount: data.amount,
          status: 'created',
        }),
      );
      return {
        order_id: data.id,
        key_id: auth.username,
        amount: data.amount,
        currency: 'INR',
        days: 30,
        mode: 'test',
      };
    } catch {
      throw new ServiceUnavailableException(
        'Could not create payment order. Please retry.',
      );
    }
  }
  async verify(
    userId: string,
    orderId: string,
    paymentId: string,
    signature: string,
  ) {
    const auth = this.credentials();
    const order = await this.orders.findOneBy({ id: orderId, user_id: userId });
    if (!order) throw new NotFoundException('Order not found');
    const expected = createHmac('sha256', auth.password)
      .update(order.id + '|' + paymentId)
      .digest();
    const actual = Buffer.from(signature, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new BadRequestException('Invalid payment signature');
    let payment: Payment;
    try {
      payment = (
        await axios.get<Payment>(
          'https://api.razorpay.com/v1/payments/' +
            encodeURIComponent(paymentId),
          { auth, timeout: 15000, maxRedirects: 0 },
        )
      ).data;
    } catch {
      throw new ServiceUnavailableException(
        'Payment status could not be checked. Retry verification.',
      );
    }
    if (
      payment.id !== paymentId ||
      payment.order_id !== order.id ||
      payment.amount !== order.amount ||
      payment.currency !== 'INR' ||
      payment.status !== 'captured'
    )
      throw new BadRequestException(
        'Payment is not captured or does not match this order',
      );
    await this.db.transaction(async (manager) => {
      const claimed = await manager.update(
        PaymentOrder,
        { id: order.id, user_id: userId, status: 'created' },
        { status: 'paid', payment_id: paymentId },
      );
      if (!claimed.affected) return;
      const user = await manager.findOneByOrFail(User, { id: userId });
      const baseline = Math.max(
        Date.now(),
        user.premium_expires_at
          ? new Date(user.premium_expires_at).getTime()
          : 0,
      );
      await manager.update(User, userId, {
        is_premium: true,
        premium_expires_at: new Date(baseline + 30 * 86400000),
      });
    });
    return { verified: true, mode: 'test' };
  }
}
