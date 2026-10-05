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
import ytdl from '@distube/ytdl-core';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

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

  /**
   * GET /api/youtube/stream/:id
   * Streams YouTube audio back to the client
   */
  @Get('stream/:id')
  async streamAudio(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
      throw new HttpException('Missing video ID', HttpStatus.BAD_REQUEST);
    }

    try {
      const url = `https://www.youtube.com/watch?v=${id}`;
      const info = await ytdl.getInfo(url);
      const format = ytdl.chooseFormat(info.formats, {
        filter: 'audioonly',
        quality: 'highestaudio',
      });
      const total = Number(format.contentLength);
      let range: { start: number; end: number } | undefined;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range));
        if (
          !match ||
          (!match[1] && !match[2]) ||
          !Number.isSafeInteger(total) ||
          total <= 0
        ) {
          res
            .status(416)
            .setHeader('Content-Range', 'bytes */' + (total || '*'));
          res.end();
          return;
        }
        const start = match[1]
          ? Number(match[1])
          : Math.max(0, total - Number(match[2]));
        const end =
          match[1] && match[2]
            ? Math.min(Number(match[2]), total - 1)
            : total - 1;
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start > end ||
          start >= total
        ) {
          res.status(416).setHeader('Content-Range', 'bytes */' + total);
          res.end();
          return;
        }
        range = { start, end };
        res
          .status(206)
          .setHeader(
            'Content-Range',
            'bytes ' + start + '-' + end + '/' + total,
          );
        res.setHeader('Content-Length', end - start + 1);
      } else if (Number.isSafeInteger(total) && total > 0)
        res.setHeader('Content-Length', total);
      res.setHeader('Accept-Ranges', 'bytes');
      const stream = ytdl.downloadFromInfo(info, {
        range,
        format,
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 19,
      });

      res.setHeader(
        'Content-Type',
        format.mimeType?.split(';')[0] || 'application/octet-stream',
      );
      if (req.method === 'HEAD') {
        stream.destroy();
        res.end();
        return;
      }
      res.on('close', () => stream.destroy());

      stream.on('error', (err) => {
        console.error(`ytdl stream error for ${id}:`, err);
        if (!res.headersSent) {
          res.status(503).send('YouTube audio is unavailable from this server');
        } else {
          res.end();
        }
      });

      stream.pipe(res);
    } catch (err) {
      console.error(
        `Error streaming YouTube video ${id}:`,
        err instanceof Error ? err.message : 'Stream unavailable',
      );
      if (!res.headersSent) {
        throw new HttpException(
          'YouTube audio is unavailable from this server. Open the song in YouTube or choose another audio source.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }
}
