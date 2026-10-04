import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  firebase_uid: string | null;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column({ nullable: true })
  oauth_provider: string;

  @Column({ nullable: true })
  display_name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: false })
  is_premium: boolean;

  @Column({ type: Date, nullable: true })
  premium_expires_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
