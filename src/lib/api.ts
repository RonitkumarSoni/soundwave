import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

// Helper for bypassing CORS on Web
const getProxiedUrl = (url: string) => {
  if (Platform.OS === 'web') {
    // We use the local backend as a proxy because public ones get blocked by JioSaavn
    return `http://localhost:3000/api/catalog/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

// Use environment variable for API URL in production, fallback to Render backend
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://soundwave-backend-p4y0.onrender.com/api";

// Retry helper for Render cold start
const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isLastAttempt = i === retries;
      const isNetworkError = !err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK';
      if (isLastAttempt || !isNetworkError) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Request failed after retries');
};

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // Increased to 60 seconds for Render free tier cold start
});

// Interceptor to attach token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh endpoint directly using axios to avoid interceptor loop
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
        
        // Save new access token
        await AsyncStorage.setItem('access_token', data.access_token);
        
        // Update authorization header for retry
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth state so user can log in again
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('user_profile');
        // Let the application layer handle the logout (e.g. useAuthStore)
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      return withRetry(async () => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        return data;
      });
    },
    signup: async (email: string, password: string, display_name: string) => {
      return withRetry(async () => {
        const { data } = await apiClient.post('/auth/signup', { email, password, display_name });
        return data;
      });
    },
    googleLogin: async (id_token: string) => {
      return withRetry(async () => {
        const { data } = await apiClient.post('/auth/google', { id_token });
        return data;
      });
    },
    updateProfile: async (display_name?: string, avatar_url?: string) => {
      const { data } = await apiClient.patch('/auth/profile', { display_name, avatar_url });
      return data;
    },
    deleteAccount: async () => {
      const { data } = await apiClient.delete('/auth/account');
      return data;
    }
  },
  search: async (query: string) => {
    try {
      // Use official JioSaavn API for Search
      const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(query)}&n=20&p=1&_format=json&_marker=0&ctx=android`;
      const { data } = await axios.get(getProxiedUrl(url));
      
      const tracks = (data.results || []).map((song: any) => {
        // Decrypt the media url using JioSaavn's DES-ECB cipher
        let mediaUrl = "";
        try {
          if (song.encrypted_media_url) {
            const key = CryptoJS.enc.Utf8.parse("38346591");
            const decrypted = CryptoJS.DES.decrypt(
                { ciphertext: CryptoJS.enc.Base64.parse(song.encrypted_media_url) } as any,
                key,
                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
            );
            mediaUrl = decrypted.toString(CryptoJS.enc.Utf8);
            // Saavn provides mp4, convert to mp3 if needed or keep mp4 (expo-av supports mp4)
            mediaUrl = mediaUrl.replace('_96.mp4', '_320.mp4');
          }
        } catch (e) {
          console.error("Failed to decrypt media url", e);
        }

        return {
          id: song.id,
          name: song.song || song.title,
          artist_name: song.primary_artists || song.singers || 'Unknown Artist',
          album_name: song.album || '',
          image: song.image ? song.image.replace('150x150', '500x500') : 'https://via.placeholder.com/150',
          audio: mediaUrl,
          duration: song.duration ? parseInt(song.duration, 10) : 0,
          source: 'jiosaavn'
        };
      });

      return { tracks, artists: [], albums: [] };
    } catch (error) {
      console.error('Search API error:', error);
      return { tracks: [], artists: [], albums: [] };
    }
  },

  getTracks: async () => {
    try {
      // Get trending tracks using a generic popular query on JioSaavn
      const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=top&n=20&p=1&_format=json&_marker=0&ctx=android`;
      const { data } = await axios.get(getProxiedUrl(url));
      
      const tracks = (data.results || []).map((song: any) => {
        let mediaUrl = "";
        try {
          if (song.encrypted_media_url) {
            const key = CryptoJS.enc.Utf8.parse("38346591");
            const decrypted = CryptoJS.DES.decrypt(
                { ciphertext: CryptoJS.enc.Base64.parse(song.encrypted_media_url) } as any,
                key,
                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
            );
            mediaUrl = decrypted.toString(CryptoJS.enc.Utf8).replace('_96.mp4', '_320.mp4');
          }
        } catch (e) {
          console.error("Failed to decrypt media url", e);
        }

        return {
          id: song.id,
          name: song.song || song.title,
          artist_name: song.primary_artists || song.singers || 'Unknown Artist',
          album_name: song.album || '',
          image: song.image ? song.image.replace('150x150', '500x500') : 'https://via.placeholder.com/150',
          audio: mediaUrl,
          duration: song.duration ? parseInt(song.duration, 10) : 0,
          source: 'jiosaavn'
        };
      });

      return tracks;
    } catch (error) {
      console.error('GetTracks API error:', error);
      return [];
    }
  },

  getTrackById: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/catalog/tracks/${id}`);
      return data;
    } catch (error) {
      console.error('getTrackById API error:', error);
      return null;
    }
  },

  getPopular: async (limit = 10, offset = 0, order = 'popularity_week') => {
    try {
      const { data } = await apiClient.get('/catalog/tracks', { 
        params: { order, limit, offset } 
      });
      return data.results || [];
    } catch (error) {
      console.error('GetPopular API error:', error);
      return [];
    }
  },

  getLibrary: async () => {
    try {
      // We will fetch liked tracks here later, for now just fetch some random tracks
      const { data } = await apiClient.get('/catalog/tracks', { params: { limit: 5, offset: 20 } });
      return data.results || [];
    } catch (error) {
      console.error('GetLibrary API error:', error);
      return [];
    }
  },

  getArtists: async (limit = 10, offset = 0) => {
    try {
      const { data } = await apiClient.get('/catalog/artists', { params: { limit, offset } });
      return data.results || [];
    } catch (error) {
      console.error('GetArtists API error:', error);
      return [];
    }
  },

  getArtistById: async (id: string) => {
    try {
      const url = `https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${id}&_format=json&_marker=0&ctx=android`;
      const { data } = await axios.get(getProxiedUrl(url));
      return {
        id: data.artistId,
        name: data.name,
        bio: data.subtitle,
        image: data.image ? data.image.replace('150x150', '500x500') : '',
        follower_count: data.follower_count
      };
    } catch (error) {
      console.error('getArtistById API error:', error);
      return null;
    }
  },

  getArtistTracks: async (id: string) => {
    try {
      const url = `https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${id}&_format=json&_marker=0&ctx=android`;
      const { data } = await axios.get(getProxiedUrl(url));
      
      const tracks = (data.topSongs?.songs || []).map((song: any) => {
        let mediaUrl = "";
        try {
          if (song.encrypted_media_url) {
            const key = CryptoJS.enc.Utf8.parse("38346591");
            const decrypted = CryptoJS.DES.decrypt(
                { ciphertext: CryptoJS.enc.Base64.parse(song.encrypted_media_url) } as any,
                key,
                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
            );
            mediaUrl = decrypted.toString(CryptoJS.enc.Utf8).replace('_96.mp4', '_320.mp4');
          }
        } catch (e) {
          console.error("Failed to decrypt media url", e);
        }

        return {
          id: song.id,
          name: song.song || song.title,
          artist_name: song.primary_artists || song.singers || data.name,
          album_name: song.album || '',
          image: song.image ? song.image.replace('150x150', '500x500') : 'https://via.placeholder.com/150',
          audio: mediaUrl,
          duration: song.duration ? parseInt(song.duration, 10) : 0,
          source: 'jiosaavn'
        };
      });

      return tracks;
    } catch (error) {
      console.error('getArtistTracks API error:', error);
      return [];
    }
  },

  getAlbumById: async (id: string) => {
    try {
      const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=${id}&_format=json&_marker=0&ctx=android`;
      const { data } = await axios.get(getProxiedUrl(url));
      return {
        id: data.albumid,
        title: data.title || data.name,
        artist: data.primary_artists,
        image: data.image ? data.image.replace('150x150', '500x500') : '',
        year: data.year
      };
    } catch (error) {
      console.error('getAlbumById API error:', error);
      return null;
    }
  },

  getAlbumTracks: async (id: string) => {
    try {
      const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=${id}&_format=json&_marker=0&ctx=android`;
      const { data } = await axios.get(getProxiedUrl(url));
      
      const tracks = (data.songs || []).map((song: any) => {
        let mediaUrl = "";
        try {
          if (song.encrypted_media_url) {
            const key = CryptoJS.enc.Utf8.parse("38346591");
            const decrypted = CryptoJS.DES.decrypt(
                { ciphertext: CryptoJS.enc.Base64.parse(song.encrypted_media_url) } as any,
                key,
                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
            );
            mediaUrl = decrypted.toString(CryptoJS.enc.Utf8).replace('_96.mp4', '_320.mp4');
          }
        } catch (e) {
          console.error("Failed to decrypt media url", e);
        }

        return {
          id: song.id,
          name: song.song || song.title,
          artist_name: song.primary_artists || song.singers || 'Unknown Artist',
          album_name: song.album || data.title || data.name || '',
          image: song.image ? song.image.replace('150x150', '500x500') : 'https://via.placeholder.com/150',
          audio: mediaUrl,
          duration: song.duration ? parseInt(song.duration, 10) : 0,
          source: 'jiosaavn'
        };
      });

      return tracks;
    } catch (error) {
      console.error('getAlbumTracks API error:', error);
      return [];
    }
  },

  playlists: {
    create: async (title: string, cover_url?: string) => {
      const { data } = await apiClient.post('/playlists', { title, cover_url });
      return data;
    },
    getAll: async () => {
      try {
        const { data } = await apiClient.get('/playlists');
        return data;
      } catch (error) {
        console.error('getPlaylists API error:', error);
        return [];
      }
    },
    getById: async (id: string) => {
      const { data } = await apiClient.get(`/playlists/${id}`);
      return data;
    },
    addTrack: async (id: string, track_id: string) => {
      const { data } = await apiClient.post(`/playlists/${id}/tracks`, { track_id });
      return data;
    },
    removeTrack: async (id: string, trackId: string) => {
      const { data } = await apiClient.delete(`/playlists/${id}/tracks/${trackId}`);
      return data;
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete(`/playlists/${id}`);
      return data;
    },
    update: async (id: string, title?: string, cover_url?: string) => {
      const { data } = await apiClient.patch(`/playlists/${id}`, { title, cover_url });
      return data;
    }
  },
  
  getLyrics: async (artist: string, title: string) => {
    try {
      // lyrics.ovh expects format: /v1/artist/title
      // We will clean the strings slightly for better matching
      const cleanArtist = artist.split(',')[0].trim(); // take first artist if multiple
      const cleanTitle = title.split('(')[0].trim(); // remove (feat. ...) or (Remix)
      
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
      const { data } = await axios.get(url);
      
      return data.lyrics || null;
    } catch (error) {
      console.log('getLyrics API error:', error);
      return null;
    }
  },

  translateLyrics: async (text: string, targetLang: string = 'HI') => {
    try {
      const apiKey = 'cd1d2337-4561-4dd4-b102-fd4931c08d55:fx';
      const url = 'https://api-free.deepl.com/v2/translate';
      
      const { data } = await axios.post(url, {
        text: [text],
        target_lang: targetLang
      }, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return data.translations?.[0]?.text || null;
    } catch (error) {
      console.log('translateLyrics API error:', error);
      return null;
    }
  }
};
