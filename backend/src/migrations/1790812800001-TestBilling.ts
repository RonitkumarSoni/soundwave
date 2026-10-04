import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';
export class TestBilling1790812800001 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    if (!(await q.hasColumn('users', 'premium_expires_at')))
      await q.addColumn(
        'users',
        new TableColumn({
          name: 'premium_expires_at',
          type:
            q.connection.options.type === 'postgres' ? 'timestamp' : 'datetime',
          isNullable: true,
        }),
      );
    if (!(await q.hasTable('payment_orders')))
      await q.createTable(
        new Table({
          name: 'payment_orders',
          columns: [
            { name: 'id', type: 'varchar', isPrimary: true },
            {
              name: 'user_id',
              type:
                q.connection.options.type === 'postgres' ? 'uuid' : 'varchar',
            },
            { name: 'amount', type: 'integer' },
            { name: 'status', type: 'varchar', default: "'created'" },
            {
              name: 'payment_id',
              type: 'varchar',
              isNullable: true,
              isUnique: true,
            },
            {
              name: 'created_at',
              type:
                q.connection.options.type === 'postgres'
                  ? 'timestamp'
                  : 'datetime',
              default: 'CURRENT_TIMESTAMP',
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
  down(): Promise<void> {
    throw new Error(
      'Use a reviewed forward migration to preserve payment records',
    );
  }
}
