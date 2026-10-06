import { BadRequestException } from '@nestjs/common';
import { YoutubeAudioService } from './youtube-audio.service';

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
