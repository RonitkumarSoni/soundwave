import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('database readiness', () => {
  it('reports ready only after a successful database query', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = new HealthController({ query } as unknown as DataSource);
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });
  it('returns a safe 503 instead of exposing database errors', async () => {
    const query = jest
      .fn()
      .mockRejectedValue(new Error('private connection detail'));
    const controller = new HealthController({ query } as unknown as DataSource);
    await expect(controller.ready()).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(controller.ready()).rejects.toThrow(
      'Service temporarily unavailable',
    );
  });
});
