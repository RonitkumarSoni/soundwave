import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  Playlist,
  PlaylistTrack,
  LikedTrack,
} from '../playlist/playlist.entity';

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

  async findOrCreateByFirebase(identity: DecodedIdToken): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { firebase_uid: identity.uid },
    });
    if (existing) return existing;
    const email = identity.email!.toLowerCase();
    const byEmail = await this.findByEmail(email);
    if (byEmail) {
      if (byEmail.firebase_uid && byEmail.firebase_uid !== identity.uid)
        throw new ConflictException('Account identity mismatch');
      await this.update(byEmail.id, { firebase_uid: identity.uid });
      return (await this.findById(byEmail.id))!;
    }
    try {
      return await this.create({
        firebase_uid: identity.uid,
        email,
        display_name:
          typeof identity.name === 'string'
            ? identity.name
            : email.split('@')[0],
        avatar_url:
          typeof identity.picture === 'string' ? identity.picture : '',
        oauth_provider: identity.firebase.sign_in_provider,
      });
    } catch (error) {
      const winner = await this.userRepo.findOne({
        where: { firebase_uid: identity.uid },
      });
      if (winner) return winner;
      throw error;
    }
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.userRepo.update(id, data);
    return this.findById(id);
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    if (!user) return null;
    // Don't return password hash
    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      is_premium:
        user.is_premium &&
        (!user.premium_expires_at ||
          new Date(user.premium_expires_at).getTime() > Date.now()),
      premium_expires_at: user.premium_expires_at,
      oauth_provider: user.oauth_provider,
      created_at: user.created_at,
    };
  }

  async updateProfile(
    id: string,
    displayName?: string,
    avatarUrl?: string,
  ): Promise<User | null> {
    const updates: Partial<User> = {};
    if (displayName !== undefined) updates.display_name = displayName.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    if (Object.keys(updates).length > 0) {
      await this.update(id, updates);
    }
    return this.findById(id);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.userRepo.manager.transaction(async (manager) => {
      const playlists = await manager.find(Playlist, {
        where: { user_id: id },
      });
      for (const playlist of playlists)
        await manager.delete(PlaylistTrack, { playlist_id: playlist.id });
      await manager.delete(Playlist, { user_id: id });
      await manager.delete(LikedTrack, { user_id: id });
      await manager.delete(User, id);
    });
  }
}
