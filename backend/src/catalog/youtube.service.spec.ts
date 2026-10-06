import { YoutubeService } from './youtube.service';
import { YoutubeAudioService } from './youtube-audio.service';

jest.mock('ytmusic-api', () =>
  jest.fn(() => ({ initialize: jest.fn(), searchSongs: jest.fn() })),
);

describe('Podcast catalog routing', () => {
  it('uses direct podcast search and returns episodes through the audio stream route', async () => {
    const searchPodcasts = jest.fn().mockResolvedValue([
      {
        videoId: 'Pmd6knanPKw',
        name: 'Huberman Lab Essentials',
        duration: 1913,
        artist: { name: 'Huberman Lab' },
        thumbnails: [
          { url: 'https://i.ytimg.com/vi/Pmd6knanPKw/hqdefault.jpg' },
        ],
      },
    ]);
    const service = new YoutubeService({
      searchPodcasts,
    } as unknown as YoutubeAudioService);
    const result = await service.searchTracks('Huberman Lab podcast', 5);
    expect(searchPodcasts).toHaveBeenCalledWith('Huberman Lab podcast', 5);
    expect(result.results[0]).toMatchObject({
      name: 'Huberman Lab Essentials',
      source: 'youtube',
      audio: '/api/youtube/stream/Pmd6knanPKw',
    });
  });
});
