import { Controller, Get, Query, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import type { Response } from 'express';
import ytdl from '@distube/ytdl-core';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  /**
   * GET /api/youtube/tracks?q=&limit=
   */
  @Get('tracks')
  async getTracks(
    @Query('q') query?: string,
    @Query('limit') limit?: string,
  ) {
    const lim = Math.min(parseInt(limit || '20', 10), 50);

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
  async streamAudio(@Param('id') id: string, @Res() res: Response) {
    if (!id) {
      throw new HttpException('Missing video ID', HttpStatus.BAD_REQUEST);
    }

    try {
      const url = `https://www.youtube.com/watch?v=${id}`;
      const stream = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25, // 32MB buffer
      });

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Transfer-Encoding', 'chunked');

      stream.on('error', (err) => {
        console.error(`ytdl stream error for ${id}:`, err);
        if (!res.headersSent) {
          res.status(500).send('Stream error');
        } else {
          res.end();
        }
      });

      stream.pipe(res);
    } catch (err: any) {
      console.error(`Error streaming YouTube video ${id}:`, err.message);
      if (!res.headersSent) {
        throw new HttpException('Could not start stream', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
