import { DataSource } from 'typeorm';
import { ApplicationSchema1790812800000 } from './1790812800000-ApplicationSchema';

describe('legacy database migration', () => {
  it('preserves existing users and tracks and remains safe to run again', async () => {
    const db = await new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
    }).initialize();
    const runner = db.createQueryRunner();
    try {
      await runner.query(
        'CREATE TABLE users (id varchar PRIMARY KEY, email varchar UNIQUE)',
      );
      await runner.query(
        "INSERT INTO users VALUES ('owner', 'owner@example.test')",
      );
      await runner.query(
        'CREATE TABLE playlist_tracks (playlist_id varchar, track_id varchar, position integer, added_at datetime, PRIMARY KEY (playlist_id, track_id))',
      );
      const migration = new ApplicationSchema1790812800000();
      await migration.up(runner);
      await runner.query(
        "INSERT INTO playlists (id,user_id,title) VALUES ('list','owner','Existing playlist')",
      );
      await runner.query(
        "INSERT INTO playlist_tracks (playlist_id,track_id,position) VALUES ('list','123',0)",
      );
      await migration.up(runner);
      const users: unknown = await runner.query(
        'SELECT email,firebase_uid FROM users',
      );
      const tracks: unknown = await runner.query(
        'SELECT track_id,source FROM playlist_tracks',
      );
      expect(users).toEqual([
        { email: 'owner@example.test', firebase_uid: null },
      ]);
      expect(tracks).toEqual([{ track_id: '123', source: 'jamendo' }]);
      await runner.query("DELETE FROM users WHERE id='owner'");
      expect(await runner.query('SELECT * FROM playlist_tracks')).toEqual([]);
    } finally {
      await runner.release();
      await db.destroy();
    }
  });
});
