import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import type { Request, Response } from 'express';
import { pipeline } from 'node:stream';
import { YoutubeAudioService } from './youtube-audio.service';

@Controller('youtube')
export class YoutubeController {
  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly audio: YoutubeAudioService,
  ) {}

  @Get('tracks/:id')
  getTrack(@Param('id') id: string) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(id))
      throw new HttpException('Invalid video ID', HttpStatus.BAD_REQUEST);
    return this.youtubeService.getTrackById(id);
  }

  /**
   * GET /api/youtube/tracks?q=&limit=
   */
  @Get('tracks')
  async getTracks(@Query('q') query?: string, @Query('limit') limit?: string) {
    const parsed = Number(limit || 20);
    const lim = Number.isInteger(parsed)
      ? Math.max(1, Math.min(parsed, 50))
      : 20;

    if (query) {
      return this.youtubeService.searchTracks(query, lim);
    }

    return this.youtubeService.getTrendingTracks(lim);
  }

  @Get('stream/:id')
  async streamAudio(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const upstream = await this.audio.open(
      id,
      req.headers.range,
      controller.signal,
    );
    res.status(upstream.status);
    for (const header of [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
    ]) {
      const value = upstream.headers[header] as string | undefined;
      if (value) res.setHeader(header, value);
    }
    if (req.method === 'HEAD' || upstream.status === 416) {
      if (upstream.status === 416) res.removeHeader('Content-Length');
      upstream.data.destroy();
      res.end();
      return;
    }
    pipeline(upstream.data, res, (error) => {
      if (error && !controller.signal.aborted)
        console.warn('YouTube audio connection closed');
    });
  }
}
