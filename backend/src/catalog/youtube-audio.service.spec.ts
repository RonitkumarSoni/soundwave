import { BadRequestException } from '@nestjs/common';
import { YoutubeAudioService } from './youtube-audio.service';
import axios, { AxiosError } from 'axios';

describe('YouTube audio request validation', () => {
  it('rejects shell-like IDs and invalid or multiple ranges before extraction', async () => {
    const service = new YoutubeAudioService();
    const signal = new AbortController().signal;
    await expect(
      service.open('id; command', undefined, signal),
    ).rejects.toBeInstanceOf(BadRequestException);
    for (const range of ['bytes=0-10,20-30', 'bytes=-', 'something']) {
      await expect(
        service.open('PA5ElGNLeoA', range, signal),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });
});

describe('YouTube expired stream recovery', () => {
  afterEach(() => jest.restoreAllMocks());

  it('resolves a fresh URL once after the audio host rejects the old URL', async () => {
    const service = new YoutubeAudioService();
    const extract = jest
      .spyOn(service as any, 'extract')
      .mockResolvedValueOnce({ url: 'https://old.googlevideo.com/audio' })
      .mockResolvedValueOnce({ url: 'https://new.googlevideo.com/audio' });
    const rejected = new AxiosError('Forbidden');
    rejected.response = { status: 403, data: { destroy: jest.fn() } } as any;
    const response = { status: 206, data: {} };
    const get = jest
      .spyOn(axios, 'get')
      .mockRejectedValueOnce(rejected)
      .mockResolvedValueOnce(response);
    await expect(
      service.open('x--zeOqqeFc', 'bytes=0-1023', new AbortController().signal),
    ).resolves.toBe(response);
    expect(extract).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1][0]).toBe('https://new.googlevideo.com/audio');
  });

  it('does not repeat extraction when YouTube requires sign-in', async () => {
    const service = new YoutubeAudioService();
    const extract = jest
      .spyOn(service as any, 'extract')
      .mockRejectedValue({ stderr: 'Sign in to confirm you are not a bot' });
    try {
      await service.open(
        'x--zeOqqeFc',
        undefined,
        new AbortController().signal,
      );
      throw new Error('Expected rejection');
    } catch (error) {
      expect((error as any).getResponse()).toMatchObject({
        code: 'upstream-sign-in-required',
      });
    }
    expect(extract).toHaveBeenCalledTimes(1);
  });
});
