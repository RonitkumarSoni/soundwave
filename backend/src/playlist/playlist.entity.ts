import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  cover_url: string;

  @Column({ default: true })
  is_public: boolean;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('playlist_tracks')
export class PlaylistTrack {
  @Column({ primary: true })
  playlist_id: string;

  @ManyToOne(() => Playlist)
  @JoinColumn({ name: 'playlist_id' })
  playlist: Playlist;

  @Column({ primary: true })
  track_id: string; // Jamendo track ID

  @Column()
  position: number;

  @CreateDateColumn()
  added_at: Date;
}

@Entity('liked_tracks')
export class LikedTrack {
  @Column({ primary: true })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ primary: true })
  track_id: string; // Jamendo track ID

  @CreateDateColumn()
  liked_at: Date;
}
