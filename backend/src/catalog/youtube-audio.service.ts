import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import axios from 'axios';
import type { Readable } from 'node:stream';
import type { YoutubeSong } from './provider-types';

const execute = promisify(execFile);
interface AudioInfo {
  url: string;
  http_headers?: { 'User-Agent'?: string };
}
@Injectable()
export class YoutubeAudioService {
  private readonly logger = new Logger(YoutubeAudioService.name);
  private cache = new Map<string, { until: number; info: AudioInfo }>();
  private pending = new Map<string, Promise<AudioInfo>>();
  private podcastRequests = new Map<string, Promise<YoutubeSong[]>>();
  async searchPodcasts(query: string, limit: number): Promise<YoutubeSong[]> {
    const count = Math.max(1, Math.min(limit, 20));
    const search = query.trim().slice(0, 200);
    const key = `${count}:${search}`;
    const pending = this.podcastRequests.get(key);
    if (pending) return pending;
    if (this.podcastRequests.size >= 2)
      throw new ServiceUnavailableException(
        'Podcast search is busy. Please retry.',
      );
    const request = (async () => {
      const python = process.env.YTDLP_PYTHON;
      const command =
        python ||
        process.env.YTDLP_BINARY ||
        resolve(
          process.cwd(),
          'bin',
          process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
        );
      const { stdout } = await execute(
        command,
        [
          ...(python ? ['-m', 'yt_dlp'] : []),
          '--ignore-config',
          '--flat-playlist',
          '--dump-single-json',
          '--no-warnings',
          '--socket-timeout',
          '10',
          '--retries',
          '0',
          `ytsearch${count}:${search}`,
        ],
        { timeout: 30000, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      );
      const response = JSON.parse(stdout) as {
        entries?: {
          id: string;
          title: string;
          duration?: number;
          channel?: string;
          uploader?: string;
          thumbnails?: { url: string }[];
        }[];
      };
      return (response.entries || [])
        .filter((item) => /^[A-Za-z0-9_-]{11}$/.test(item.id))
        .map((item) => ({
          videoId: item.id,
          name: item.title,
          duration: item.duration,
          artist: { name: item.channel || item.uploader || 'Podcast' },
          thumbnails: item.thumbnails || [
            { url: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg` },
          ],
        }));
    })()
      .catch(() => {
        throw new ServiceUnavailableException(
          'Podcast search could not connect. Please retry.',
        );
      })
      .finally(() => this.podcastRequests.delete(key));
    this.podcastRequests.set(key, request);
    return request;
  }
  private async extract(id: string): Promise<AudioInfo> {
    const cached = this.cache.get(id);
    if (cached && cached.until > Date.now()) return cached.info;
    const pending = this.pending.get(id);
    if (pending) return pending;
    if (this.pending.size >= 2) {
      throw new ServiceUnavailableException(
        'Audio service is busy. Please retry.',
      );
    }
    const request = (async () => {
      const python = process.env.YTDLP_PYTHON;
      const command =
        python ||
        process.env.YTDLP_BINARY ||
        resolve(
          process.cwd(),
          'bin',
          process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
        );
      const args = [
        ...(python ? ['-m', 'yt_dlp'] : []),
        '--ignore-config',
        '--no-cache-dir',
        '--no-playlist',
        '--no-warnings',
        '--skip-download',
        '--dump-single-json',
        '--format',
        'bestaudio[ext=m4a]/bestaudio',
        '--socket-timeout',
        '10',
        '--retries',
        '0',
        '--extractor-retries',
        '0',
        '--js-runtimes',
        'node',
        `https://www.youtube.com/watch?v=${id}`,
      ];
      const { stdout } = await execute(command, args, {
        timeout: 30000,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
      });
      const info = JSON.parse(stdout) as AudioInfo;
      const url = new URL(info.url);
      if (
        url.protocol !== 'https:' ||
        !url.hostname.endsWith('.googlevideo.com')
      )
        throw new Error('Invalid audio host');
      if (this.cache.size >= 100) {
        const oldest = this.cache.keys().next();
        if (!oldest.done) this.cache.delete(oldest.value);
      }
      this.cache.set(id, { until: Date.now() + 120000, info });
      return info;
    })().finally(() => this.pending.delete(id));
    this.pending.set(id, request);
    return request;
  }
  async open(id: string, range: string | undefined, signal: AbortSignal) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(id))
      throw new BadRequestException('Invalid video ID');
    if (range && !/^bytes=(\d+-\d*|-\d+)$/.test(range))
      throw new BadRequestException('Invalid audio range');
    try {
      const fetchAudio = async () => {
        const info = await this.extract(id);
        return axios.get<Readable>(info.url, {
          responseType: 'stream',
          timeout: 20000,
          signal,
          maxRedirects: 0,
          headers: {
            'User-Agent': info.http_headers?.['User-Agent'] || 'Mozilla/5.0',
            ...(range ? { Range: range } : {}),
          },
          validateStatus: (status) => [200, 206, 416].includes(status),
        });
      };
      try {
        return await fetchAudio();
      } catch (error) {
        // A cached signed URL can expire before its local cache TTL.
        // Resolve once again only for rejected media URLs, never for sign-in failures.
        if (
          signal.aborted ||
          !axios.isAxiosError(error) ||
          ![403, 410].includes(error.response?.status || 0)
        )
          throw error;
        error.response?.data?.destroy?.();
        this.cache.delete(id);
        return await fetchAudio();
      }
    } catch (error: unknown) {
      this.cache.delete(id);
      const detail = error as {
        code?: string;
        stderr?: string;
        response?: { status?: number };
      };
      const reason =
        detail.code === 'ENOENT'
          ? 'extractor-not-installed'
          : /sign in|not a bot|login required/i.test(detail.stderr || '')
            ? 'upstream-sign-in-required'
            : detail.response?.status
              ? `upstream-http-${detail.response.status}`
              : detail.code === 'ETIMEDOUT' || detail.code === 'ECONNABORTED'
                ? 'upstream-timeout'
                : 'extraction-failed';
      // Never log signed media URLs, cookies or extractor output.
      this.logger.warn(`Audio request failed: ${reason}; video=${id}`);
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'YouTube audio could not be loaded. Please retry.',
        code: reason,
      });
    }
  }
}
