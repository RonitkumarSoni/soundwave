import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DataSource) {}

  @Get()
  async ready() {
    try {
      await this.database.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Service temporarily unavailable');
    }
  }
}
