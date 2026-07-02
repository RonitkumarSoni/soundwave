import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.userRepo.update(id, data);
    return this.findById(id);
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    if (!user) return null;
    // Don't return password hash
    const { password_hash, ...profile } = user;
    return profile;
  }

  async findOrCreateByGoogle(email: string, displayName: string, avatarUrl: string): Promise<User> {
    let user = await this.findByEmail(email);
    if (!user) {
      user = await this.create({
        email,
        display_name: displayName,
        avatar_url: avatarUrl,
        oauth_provider: 'google',
      });
    } else if (!user.oauth_provider) {
      // Link Google if they signed up with email first
      await this.update(user.id, {
        oauth_provider: 'google',
        avatar_url: user.avatar_url || avatarUrl,
      });
      user = await this.findById(user.id) as User;
    }
    return user;
  }

  async updateProfile(id: string, displayName?: string, avatarUrl?: string): Promise<User | null> {
    const updates: Partial<User> = {};
    if (displayName) updates.display_name = displayName;
    if (avatarUrl) updates.avatar_url = avatarUrl;
    
    if (Object.keys(updates).length > 0) {
      await this.update(id, updates);
    }
    return this.findById(id);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }
}
