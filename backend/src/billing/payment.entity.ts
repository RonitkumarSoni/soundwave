import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('payment_orders')
export class PaymentOrder {
  @PrimaryColumn() id: string;
  @Column() user_id: string;
  @Column() amount: number;
  @Column({ default: 'created' }) status: string;
  @Column({ nullable: true, unique: true }) payment_id: string;
  @CreateDateColumn() created_at: Date;
}
