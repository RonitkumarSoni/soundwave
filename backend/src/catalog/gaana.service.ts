import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class GaanaService {
  private readonly baseUrl = 'https://gaana.com/apiv2';
  private readonly aesKey = Buffer.from('gy1t#b@jl(b$wtme', 'utf-8');

  private decryptLink(encryptedData: string): string {
    try {
      encryptedData = encryptedData.trim();
      const offset = parseInt(encryptedData[0], 10);
      
      const iv = Buffer.from(encryptedData.substring(offset, offset + 16), 'utf-8');
      const cipherTextB64 = encryptedData.substring(offset + 16);
      
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.aesKey, iv);
      decipher.setAutoPadding(true);
      
      let decrypted = decipher.update(cipherTextB64, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (err) {
      return '';
    }
  }

  async searchTracks(query: string, limit: number = 10) {
    try {
      // 1. Search for tracks to get seokeys
      const searchUrl = `${this.baseUrl}?country=IN&page=0&secType=track&type=search&keyword=${encodeURIComponent(query)}`;
      const searchRes = await axios.get(searchUrl);
      
      const gr = searchRes.data?.gr || [];
      const gd = (gr.length > 0 && gr[0].gd) ? gr[0].gd : [];
      
      const seokeys: string[] = [];
      for (let i = 0; i < Math.min(limit, gd.length); i++) {
        const seo = gd[i]?.seo;
        if (seo) seokeys.push(seo);
      }
      
      if (seokeys.length === 0) return { results: [] };
      
      // 2. Fetch track info for each seokey
      const trackPromises = seokeys.map(seo => 
        axios.get(`${this.baseUrl}?type=songDetail&seokey=${seo}`).catch(() => null)
      );
      
      const detailsRes = await Promise.all(trackPromises);
      
      const results = [];
      
      for (const res of detailsRes) {
        if (!res || !res.data || !res.data.tracks || res.data.tracks.length === 0) continue;
        
        const track = res.data.tracks[0];
        
        let artistNames = '';
        if (track.artist && Array.isArray(track.artist)) {
          artistNames = track.artist.map((a: any) => a.name).join(', ');
        }
        
        let audioUrl = '';
        const medium = track.urls?.medium;
        if (medium && medium.message) {
          const decrypted = this.decryptLink(medium.message);
          if (decrypted) {
            audioUrl = decrypted.replace('64.mp4', '320.mp4'); // Get high quality
            if (!audioUrl) audioUrl = decrypted;
          }
        }
        
        results.push({
          id: track.track_id || track.seokey,
          name: track.track_title,
          album_name: track.album_title || '',
          artist_name: artistNames,
          image: track.artwork_large || track.artwork || track.artwork_web,
          duration: parseInt(track.duration || '0', 10),
          audio: audioUrl,
          source: 'gaana'
        });
      }
      
      return { results };
    } catch (e) {
      console.error('Gaana search error', e);
      return { results: [] };
    }
  }
}
