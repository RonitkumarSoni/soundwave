import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('notification_devices')
export class DeviceToken {
  @PrimaryColumn() id: string;
  @Column({ type: 'text' }) token: string;
  @Column() user_id: string;
}
