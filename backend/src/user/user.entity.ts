import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @CreateDateColumn()
  created_at: Date;
}
