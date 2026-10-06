import { ConfigService } from '@nestjs/config';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Auth } from 'firebase-admin/auth';
import { FirebaseIdentityService } from './firebase-identity.service';
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(),
  initializeApp: jest.fn(),
  cert: jest.fn(),
  applicationDefault: jest.fn(),
}));

describe('Firebase session verification errors', () => {
  const serviceFor = (code: string) => {
    const service = new FirebaseIdentityService(new ConfigService());
    jest.spyOn(service, 'adminAuth', 'get').mockReturnValue({
      verifyIdToken: jest.fn().mockRejectedValue({ code }),
    } as unknown as Auth);
    return service;
  };
  it('reports server credentials and upstream network failures as unavailable', async () => {
    for (const code of [
      'app/network-error',
      'app/invalid-credential',
      'auth/insufficient-permission',
    ]) {
      await expect(
        serviceFor(code).verify('test-token'),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    }
  });
  it('still rejects expired user tokens as unauthorized', async () => {
    await expect(
      serviceFor('auth/id-token-expired').verify('test-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
