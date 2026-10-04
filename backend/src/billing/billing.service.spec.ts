import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import axios from 'axios';
import { BillingService } from './billing.service';
import { PaymentOrder } from './payment.entity';
import { User } from '../user/user.entity';
import { ApplicationSchema1790812800000 } from '../migrations/1790812800000-ApplicationSchema';
import { TestBilling1790812800001 } from '../migrations/1790812800001-TestBilling';

describe('test payment entitlement security', () => {
  let db: DataSource;
  let service: BillingService;
  let getPayment: jest.SpyInstance;
  const signature = createHmac('sha256', 'unit-test-secret')
    .update('order_one|pay_one')
    .digest('hex');
  beforeEach(async () => {
    db = await new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [User, PaymentOrder],
      migrations: [ApplicationSchema1790812800000, TestBilling1790812800001],
      migrationsRun: true,
    }).initialize();
    await db
      .getRepository(User)
      .save({ id: 'owner', email: 'owner@example.test', is_premium: false });
    await db.getRepository(PaymentOrder).save({
      id: 'order_one',
      user_id: 'owner',
      amount: 9900,
      status: 'created',
    });
    service = new BillingService(
      new ConfigService({
        NODE_ENV: 'test',
        RAZORPAY_KEY_ID: 'rzp_test_unit',
        RAZORPAY_KEY_SECRET: 'unit-test-secret',
      }),
      db.getRepository(PaymentOrder),
      db,
    );
    getPayment = jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        id: 'pay_one',
        order_id: 'order_one',
        amount: 9900,
        currency: 'INR',
        status: 'captured',
      },
    });
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await db.destroy();
  });
  it('rejects another account and invalid signatures before contacting the provider', async () => {
    await expect(
      service.verify('attacker', 'order_one', 'pay_one', signature),
    ).rejects.toThrow('Order not found');
    await expect(
      service.verify('owner', 'order_one', 'pay_one', '00'),
    ).rejects.toThrow('Invalid payment signature');
    expect(getPayment).not.toHaveBeenCalled();
  });
  it('requires captured payment with the exact server-side amount', async () => {
    getPayment.mockResolvedValueOnce({
      data: {
        id: 'pay_one',
        order_id: 'order_one',
        amount: 1,
        currency: 'INR',
        status: 'captured',
      },
    });
    await expect(
      service.verify('owner', 'order_one', 'pay_one', signature),
    ).rejects.toThrow('does not match');
    expect(
      (await db.getRepository(User).findOneByOrFail({ id: 'owner' }))
        .is_premium,
    ).toBe(false);
  });
  it('grants 30 days once; replay does not extend expiry', async () => {
    await service.verify('owner', 'order_one', 'pay_one', signature);
    const first = await db.getRepository(User).findOneByOrFail({ id: 'owner' });
    expect(first.is_premium).toBe(true);
    expect(first.premium_expires_at!.getTime() - Date.now()).toBeGreaterThan(
      29 * 86400000,
    );
    await service.verify('owner', 'order_one', 'pay_one', signature);
    expect(
      (await db.getRepository(User).findOneByOrFail({ id: 'owner' }))
        .premium_expires_at,
    ).toEqual(first.premium_expires_at);
  });
  it('disables test billing on production servers', () => {
    const production = new BillingService(
      new ConfigService({
        NODE_ENV: 'production',
        RAZORPAY_KEY_ID: 'rzp_test_unit',
        RAZORPAY_KEY_SECRET: 'unit-test-secret',
      }),
      db.getRepository(PaymentOrder),
      db,
    );
    expect(production.availability().enabled).toBe(false);
  });
});
