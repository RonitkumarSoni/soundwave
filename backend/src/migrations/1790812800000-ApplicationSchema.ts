import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

// Establish the baseline without rewriting existing users or library data.
export class ApplicationSchema1790812800000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    const pg = q.connection.options.type === 'postgres';
    const id = () => ({
      name: 'id',
      type: pg ? 'uuid' : 'varchar',
      isPrimary: true,
      default: pg ? 'gen_random_uuid()' : undefined,
    });
    const timestamp = (name: string) => ({
      name,
      type: pg ? 'timestamp' : 'datetime',
      default: 'CURRENT_TIMESTAMP',
    });
    const text = (name: string, nullable = false) => ({
      name,
      type: 'varchar',
      isNullable: nullable,
    });
    if (!(await q.hasTable('users')))
      await q.createTable(
        new Table({
          name: 'users',
          columns: [
            id(),
            { ...text('email'), isUnique: true },
            text('password_hash', true),
            text('oauth_provider', true),
            text('display_name', true),
            text('avatar_url', true),
            {
              name: 'is_premium',
              type: 'boolean',
              default: pg ? 'false' : '0',
            },
            timestamp('created_at'),
          ],
        }),
      );
    if (!(await q.hasColumn('users', 'firebase_uid')))
      await q.addColumn(
        'users',
        new TableColumn({
          name: 'firebase_uid',
          type: 'varchar',
          isNullable: true,
          isUnique: true,
        }),
      );
    if (!(await q.hasTable('playlists')))
      await q.createTable(
        new Table({
          name: 'playlists',
          columns: [
            id(),
            { name: 'user_id', type: pg ? 'uuid' : 'varchar' },
            text('title'),
            text('cover_url', true),
            { name: 'is_public', type: 'boolean', default: pg ? 'true' : '1' },
            timestamp('created_at'),
          ],
        }),
      );
    if (!(await q.hasTable('playlist_tracks')))
      await q.createTable(
        new Table({
          name: 'playlist_tracks',
          columns: [
            {
              name: 'playlist_id',
              type: pg ? 'uuid' : 'varchar',
              isPrimary: true,
            },
            { ...text('track_id'), isPrimary: true },
            { name: 'position', type: 'integer' },
            timestamp('added_at'),
          ],
        }),
      );
    for (const column of [
      new TableColumn({
        name: 'source',
        type: 'varchar',
        default: "'jamendo'",
      }),
      new TableColumn({
        name: 'provider_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({ name: 'metadata', type: 'text', isNullable: true }),
    ])
      if (!(await q.hasColumn('playlist_tracks', column.name)))
        await q.addColumn('playlist_tracks', column);
    if (!(await q.hasTable('liked_tracks')))
      await q.createTable(
        new Table({
          name: 'liked_tracks',
          columns: [
            { name: 'user_id', type: pg ? 'uuid' : 'varchar', isPrimary: true },
            { ...text('track_id'), isPrimary: true },
            timestamp('liked_at'),
          ],
        }),
      );
    for (const [table, column, parent] of [
      ['playlists', 'user_id', 'users'],
      ['playlist_tracks', 'playlist_id', 'playlists'],
      ['liked_tracks', 'user_id', 'users'],
    ]) {
      const schema = await q.getTable(table);
      if (!schema?.foreignKeys.some((fk) => fk.columnNames.includes(column)))
        await q.createForeignKey(
          table,
          new TableForeignKey({
            columnNames: [column],
            referencedTableName: parent,
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
    }
  }
  down(): Promise<void> {
    throw new Error(
      'This baseline contains user data; use a reviewed forward migration to roll back.',
    );
  }
}
