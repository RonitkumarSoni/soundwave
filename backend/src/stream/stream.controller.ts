import type { Request, Response } from 'express';
import type { Readable } from 'node:stream';
import type { AxiosRequestConfig } from 'axios';
import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  Headers,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { JamendoService } from '../jamendo/jamendo.service';
import axios from 'axios';
import { Agent } from 'node:https';
import { validateRemoteUrl, publicLookup } from '../security/remote-fetch';

@Controller('stream')
export class StreamController {
  private readonly logger = new Logger(StreamController.name);

  constructor(private readonly jamendo: JamendoService) {}

  @Get('jamendo/:id')
  async streamJamendo(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('range') rangeHeader?: string,
  ) {
    try {
      // 1. Get the direct audio URL from Jamendo API
      const track = await this.jamendo.getTrackById(id);
      if (!track || !track.audio) {
        throw new HttpException('Audio not found', HttpStatus.NOT_FOUND);
      }

      const audioUrl = validateRemoteUrl(track.audio).toString();

      // 2. Proxy the request to bypass CORS
      const axiosConfig: AxiosRequestConfig = {
        method: 'get',
        url: audioUrl,
        responseType: 'stream',
        timeout: 15000,
        maxRedirects: 0,
        proxy: false,
        httpsAgent: new Agent({ lookup: publicLookup }),
        headers: {},
      };

      if (rangeHeader) {
        if (!/^bytes=\d*-\d*$/.test(rangeHeader))
          throw new HttpException('Invalid range', HttpStatus.BAD_REQUEST);
        axiosConfig.headers = { Range: rangeHeader };
      }

      const response = await axios.request<Readable>(axiosConfig);

      // 3. Forward the headers from Jamendo's server to the client
      const headersToForward = [
        'content-type',
        'content-length',
        'accept-ranges',
        'content-range',
      ];

      headersToForward.forEach((header) => {
        if (response.headers[header]) {
          res.setHeader(header, String(response.headers[header]));
        }
      });

      // Explicitly set CORS for the stream since piping can sometimes bypass NestJS global CORS

      res.status(response.status);

      // 4. Pipe the audio stream directly to the client
      res.on('close', () => response.data.destroy());
      response.data.on('error', () => {
        if (!res.headersSent) res.status(502).send('Stream interrupted');
        else res.destroy();
      });
      if (req.method === 'HEAD') {
        response.data.destroy();
        res.end();
        return;
      }
      response.data.pipe(res);
    } catch (error) {
      this.logger.error(
        `Failed to stream track ${id}:`,
        error instanceof Error ? error.message : 'Stream unavailable',
      );
      if (!res.headersSent) {
        res
          .status(
            error instanceof HttpException
              ? error.getStatus()
              : HttpStatus.BAD_GATEWAY,
          )
          .send('Stream error');
      }
    }
  }
}
