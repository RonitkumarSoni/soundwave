import { Controller, Get, Param, Res, Req, Headers, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { JamendoService } from '../jamendo/jamendo.service';
import axios from 'axios';

@Controller('stream')
export class StreamController {
  private readonly logger = new Logger(StreamController.name);

  constructor(private readonly jamendo: JamendoService) {}

  @Get('jamendo/:id')
  async streamJamendo(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
    @Headers('range') rangeHeader?: string,
  ) {
    try {
      // 1. Get the direct audio URL from Jamendo API
      const track = await this.jamendo.getTrackById(id);
      if (!track || !track.audio) {
        throw new HttpException('Audio not found', HttpStatus.NOT_FOUND);
      }

      const audioUrl = track.audio;
      
      // 2. Proxy the request to bypass CORS
      const axiosConfig: any = {
        method: 'get',
        url: audioUrl,
        responseType: 'stream',
        headers: {},
      };

      if (rangeHeader) {
        axiosConfig.headers['Range'] = rangeHeader;
      }

      const response = await axios(axiosConfig);

      // 3. Forward the headers from Jamendo's server to the client
      const headersToForward = [
        'content-type',
        'content-length',
        'accept-ranges',
        'content-range',
      ];

      headersToForward.forEach(header => {
        if (response.headers[header]) {
          res.setHeader(header, response.headers[header]);
        }
      });

      // Explicitly set CORS for the stream since piping can sometimes bypass NestJS global CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range');

      res.status(response.status);

      // 4. Pipe the audio stream directly to the client
      response.data.pipe(res);

    } catch (error: any) {
      this.logger.error(`Failed to stream track ${id}:`, error.message);
      if (!res.headersSent) {
        res.status(error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR).send('Stream error');
      }
    }
  }
}
