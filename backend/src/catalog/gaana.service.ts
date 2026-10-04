import { BadGatewayException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'node:crypto';
interface GaanaTrack {
  track_id?: string;
  seokey: string;
  track_title: string;
  album_title?: string;
  artist?: { name: string }[];
  urls?: { medium?: { message?: string } };
  artwork_large?: string;
  artwork?: string;
  artwork_web?: string;
  duration?: string;
}
interface GaanaResponse {
  gr?: { gd?: { seo?: string }[] }[];
  tracks?: GaanaTrack[];
}
@Injectable()
export class GaanaService {
  private readonly baseUrl = 'https://gaana.com/apiv2';
  private readonly aesKey = Buffer.from('gy1t#b@jl(b$wtme', 'utf-8');
  private decryptLink(value: string): string {
    try {
      const encrypted = value.trim(),
        offset = Number(encrypted[0]);
      const decipher = crypto.createDecipheriv(
        'aes-128-cbc',
        this.aesKey,
        Buffer.from(encrypted.substring(offset, offset + 16)),
      );
      return (
        decipher.update(encrypted.substring(offset + 16), 'base64', 'utf8') +
        decipher.final('utf8')
      );
    } catch {
      return '';
    }
  }
  async searchTracks(query: string, limit = 10) {
    try {
      const response = await axios.get<GaanaResponse>(this.baseUrl, {
        timeout: 10000,
        params: {
          country: 'IN',
          page: 0,
          secType: 'track',
          type: 'search',
          keyword: query,
        },
      });
      const keys = (response.data.gr?.[0]?.gd || [])
        .map((item) => item.seo)
        .filter((key): key is string => !!key)
        .slice(0, Math.min(limit, 5));
      const responses = await Promise.all(
        keys.map((seokey) =>
          axios
            .get<GaanaResponse>(this.baseUrl, {
              timeout: 10000,
              params: { type: 'songDetail', seokey },
            })
            .catch(() => null),
        ),
      );
      const results = responses.flatMap((item) => {
        const track = item?.data.tracks?.[0];
        if (!track) return [];
        return [
          {
            id: track.track_id || track.seokey,
            name: track.track_title,
            album_name: track.album_title || '',
            artist_name: (track.artist || [])
              .map((artist) => artist.name)
              .join(', '),
            image:
              track.artwork_large || track.artwork || track.artwork_web || '',
            duration: Number(track.duration) || 0,
            audio: track.urls?.medium?.message
              ? this.decryptLink(track.urls.medium.message)
              : '',
            source: 'gaana',
          },
        ];
      });
      return { results };
    } catch {
      throw new BadGatewayException('Gaana is currently unavailable');
    }
  }
}
