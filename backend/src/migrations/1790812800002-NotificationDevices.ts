import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class NotificationDevices1790812800002 implements MigrationInterface {
  async up(query: QueryRunner) {
    if (await query.hasTable('notification_devices')) return;
    await query.createTable(
      new Table({
        name: 'notification_devices',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'token', type: 'text' },
          {
            name: 'user_id',
            type:
              query.connection.options.type === 'postgres' ? 'uuid' : 'varchar',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );
  }
  async down(query: QueryRunner) {
    await query.dropTable('notification_devices');
  }
}
