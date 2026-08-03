import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';

// Use environment variable for API URL in production, fallback to Render backend
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://soundwave-backend-p4y0.onrender.com/api";

// Helper for bypassing CORS on Web
const getProxiedUrl = (url: string) => {
  if (Platform.OS === 'web') {
    return `${API_BASE}/catalog/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

const formatImageUrl = (url?: string) => {
  if (!url || url.includes('placeholder') || url.includes('via.placeholder')) {
    return 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80';
  }
  let clean = url.replace('http:', 'https:');
  return clean.replace('150x150', '500x500').replace('50x50', '500x500').replace('80x80', '500x500');
};

const applyQuality = (url: string) => {
  const quality = useSettingsStore.getState().audioQuality; // 'low', 'medium', 'high'
  let target = '_320.mp4';
  if (quality === 'low') target = '_96.mp4';
  else if (quality === 'medium') target = '_160.mp4';
  return url.replace('_96.mp4', target).replace('_160.mp4', target).replace('_320.mp4', target);
};

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
        
        // Reset auth store state to trigger redirect to login
        try {
          const { useAuthStore } = require('@/stores/useAuthStore');
          if (useAuthStore && useAuthStore.getState) {
            useAuthStore.getState().logout();
          }
        } catch (e) {
          console.error('Failed to reset auth store', e);
        }
        
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
    firebaseLogin: async (id_token: string) => {
      return withRetry(async () => {
        const { data } = await apiClient.post('/auth/firebase', { id_token });
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
      // 1. Fetch from YouTube Music (for original global songs, like Spotify but with audio)
      const ytPromise = apiClient.get(`/youtube/tracks?q=${encodeURIComponent(query)}&limit=15`)
        .then(res => res.data.results || [])
        .catch(() => []);

      // 2. Fetch from JioSaavn (for Indian content / Bollywood)
      const jioPromise = (async () => {
        try {
          const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(query)}&n=15&p=1&_format=json&_marker=0&ctx=android`;
          const { data } = await axios.get(getProxiedUrl(url));
          return (data.results || []).map((song: any) => {
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
            } catch (e) {}
            return {
              id: song.id,
              name: song.song || song.title,
              artist_name: song.primary_artists || song.singers || 'Unknown Artist',
              album_name: song.album || '',
              image: formatImageUrl(song.image),
              audio: mediaUrl,
              duration: song.duration ? parseInt(song.duration, 10) : 0,
              source: 'jiosaavn'
            };
          });
        } catch (e) {
          return [];
        }
      })();

      // 3. Fetch from Spotify API via backend
      const spPromise = apiClient.get(`/catalog/tracks?q=${encodeURIComponent(query)}&limit=10`)
        .then(res => res.data.results || [])
        .catch(() => []);

      const [ytTracks, jioTracks, spTracks] = await Promise.all([ytPromise, jioPromise, spPromise]);

      // Interleave results: YT (Originals), Spotify, JioSaavn (Bollywood)
      const combined = [];
      const maxLength = Math.max(ytTracks.length, jioTracks.length, spTracks.length);
      for (let i = 0; i < maxLength; i++) {
        if (ytTracks[i]) combined.push(ytTracks[i]);
        if (spTracks[i]) combined.push(spTracks[i]);
        if (jioTracks[i]) combined.push(jioTracks[i]);
      }

      // Remove duplicates by name and artist to keep it clean
      const uniqueTracks = combined.filter((track, index, self) =>
        index === self.findIndex((t) => (
          t.name.toLowerCase() === track.name.toLowerCase() &&
          t.artist_name.toLowerCase() === track.artist_name.toLowerCase()
        ))
      );

      return { tracks: uniqueTracks, artists: [], albums: [] };
    } catch (error) {
      console.error('Search API error:', error);
      return { tracks: [], artists: [], albums: [] };
    }
  },

  getTracks: async () => {
    try {
      // Use verified official artist IDs
      const artistIds = ["459320", "456323", "456269", "568565", "461645", "4179092", "467129", "455120", "468241", "482914"];
      const artistId = artistIds[Math.floor(Math.random() * artistIds.length)];
      const url = `https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${artistId}&_format=json&_marker=0&ctx=android`;
      const { data } = await axios.get(getProxiedUrl(url));
      
      const tracks = (data.topSongs?.songs || []).slice(0, 20).map((song: any) => {
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
          image: formatImageUrl(song.image),
          audio: mediaUrl,
          duration: song.duration ? parseInt(song.duration, 10) : 0,
          artist_id: artistId,
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

  getPopular: async (limit = 10, offset = 0, order = 'popularity_week', country = 'India') => {
    try {
      const diverseTracks: any[] = [];
      const usedImages = new Set<string>();
      
      const page = Math.floor(offset / limit) + 1;
      let query = "Top Hits";
      if (order === "releasedate") query = "New Releases";
      if (order === "popularity_total") query = `Trending in ${country}`;

      const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(query)}&n=30&p=${page}&_format=json&_marker=0&ctx=android`;
      
      try {
        const { data } = await axios.get(getProxiedUrl(url));
        
        (data.results || []).forEach((song: any) => {
          const image = formatImageUrl(song.image);
          if (!usedImages.has(image) && diverseTracks.length < limit) {
            usedImages.add(image);

            let mediaUrl = "";
            try {
              if (song.encrypted_media_url) {
                const key = CryptoJS.enc.Utf8.parse("38346591");
                const decrypted = CryptoJS.DES.decrypt(
                    { ciphertext: CryptoJS.enc.Base64.parse(song.encrypted_media_url) } as any,
                    key,
                    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
                );
                mediaUrl = applyQuality(decrypted.toString(CryptoJS.enc.Utf8));
              } else if (song.media_preview_url) {
                mediaUrl = song.media_preview_url.replace('preview.saavncdn.com', 'aac.saavncdn.com').replace('_96_p', '_320');
              }
            } catch (e) {}

            diverseTracks.push({
              id: song.id,
              name: song.song || song.title,
              artist_name: song.primary_artists || song.singers || 'Unknown Artist',
              album_name: song.album || '',
              image: image,
              audio: mediaUrl,
              duration: song.duration ? parseInt(song.duration, 10) : 0,
              artist_id: song.primary_artists_id?.split(',')[0] || '',
              source: 'jiosaavn'
            });
          }
        });
      } catch (e) {
        console.error(`Failed to fetch popular tracks for ${query}`, e);
      }

      return diverseTracks;
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
      // Curated list of top global/Indian artist IDs on JioSaavn
      const topArtistIds = [
        "459320", // Arijit Singh
        "456323", // Shreya Ghoshal
        "459633", // Atif Aslam
        "456269", // AR Rahman
        "568565", // Neha Kakkar
        "461645", // Badshah
        "455120", // The Weeknd
        "468241", // Taylor Swift
        "467129", // Ed Sheeran
        "482914", // Billie Eilish
        "4179092", // Justin Bieber
        "1084252" // BTS
      ];
      
      const selectedIds = topArtistIds.slice(offset, offset + limit);
      if (selectedIds.length === 0) return [];

      const artists = await Promise.all(
        selectedIds.map(id => api.getArtistById(id))
      );
      
      return artists.filter(Boolean);
    } catch (error: any) {
      console.warn('GetArtists API error:', error.message);
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
        image: formatImageUrl(data.image),
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
            mediaUrl = applyQuality(decrypted.toString(CryptoJS.enc.Utf8));
          }
        } catch (e) {
          console.error("Failed to decrypt media url", e);
        }

        return {
          id: song.id,
          name: song.song || song.title,
          artist_name: song.primary_artists || song.singers || data.name,
          album_name: song.album || '',
          image: formatImageUrl(song.image),
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
        image: formatImageUrl(data.image),
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
          image: formatImageUrl(song.image),
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
        return await withRetry(async () => {
          const { data } = await apiClient.get('/playlists');
          return data;
        });
      } catch (error) {
        console.log('getPlaylists API error:', error);
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
  
  getLyrics: async (trackId: string, artist: string, title: string) => {
    try {
      const cleanArtist = (artist || '').split(',')[0].split('&')[0].trim();
      const cleanTitle = (title || '').split('(')[0].split('-')[0].trim();
      const headers = { 'User-Agent': 'Soundwave/1.0 (https://github.com/soundwave)' };

      // Helper to clean HTML entities from JioSaavn
      const cleanHtmlLyrics = (html: string) => {
        if (!html) return '';
        return html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
      };

      // 1. Try LRCLIB Exact Match first (100% accurate for Hollywood & Global tracks)
      try {
        const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
        const { data: exactData } = await axios.get(getUrl, { headers, timeout: 8000 });
        if (exactData && (exactData.syncedLyrics || exactData.plainLyrics)) {
          return {
            syncedLyrics: exactData.syncedLyrics || null,
            plainLyrics: exactData.plainLyrics || null,
          };
        }
      } catch (e) {
        // Continue to JioSaavn if exact LRCLIB fails
      }

      // 2. Try JioSaavn for Bollywood/Indian tracks (if trackId exists and is valid)
      if (trackId && !trackId.toString().includes('.')) {
        try {
          const jioUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&lyrics_id=${trackId}&ctx=web6dot0&api_version=4&_format=json&_marker=0`;
          const { data: jioData } = await axios.get(getProxiedUrl(jioUrl), { timeout: 8000 });
          
          let lyricsText = "";
          if (jioData?.lyrics_cdn_uri) {
            try {
              const { data: lrcData } = await axios.get(getProxiedUrl(jioData.lyrics_cdn_uri), { timeout: 8000 });
              if (typeof lrcData === 'string' && lrcData.length > 20) {
                lyricsText = lrcData;
              }
            } catch (lrcErr) {}
          }
          
          if (!lyricsText && jioData?.lyrics) {
            lyricsText = cleanHtmlLyrics(jioData.lyrics);
          }

          if (lyricsText && lyricsText.length > 20 && !lyricsText.toLowerCase().includes('not available')) {
            return {
              syncedLyrics: lyricsText.includes('[00:') ? lyricsText : null,
              plainLyrics: lyricsText.replace(/\[\d+:\d+\.\d+\]/g, '').trim(),
            };
          }
        } catch (e) {
          // Fallthrough
        }
      }

      // 3. Fallback to LRCLIB Search with strict verification
      try {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle + ' ' + cleanArtist)}`;
        const { data } = await axios.get(getProxiedUrl(searchUrl), { headers, timeout: 8000 });
        
        if (data && data.length > 0) {
          // Find match that contains both track title and artist name to avoid wrong lyrics
          const verifiedMatch = data.find((t: any) => {
            const tMatch = t.trackName.toLowerCase().includes(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase().includes(t.trackName.toLowerCase());
            const aMatch = t.artistName.toLowerCase().includes(cleanArtist.toLowerCase()) || cleanArtist.toLowerCase().includes(t.artistName.toLowerCase());
            return tMatch && aMatch;
          });

          if (verifiedMatch && (verifiedMatch.syncedLyrics || verifiedMatch.plainLyrics)) {
            return {
              syncedLyrics: verifiedMatch.syncedLyrics || null,
              plainLyrics: verifiedMatch.plainLyrics || null,
            };
          }
        }
      } catch (e) {
        // Fallthrough
      }

      return null;
    } catch (error) {
      console.log('getLyrics API error:', error);
      return null;
    }
  },

  translateLyrics: async (text: string, targetLang: string = 'hi') => {
    try {
      const { data } = await apiClient.post('/catalog/translate-lyrics', {
        text,
        lang: targetLang
      });
      return data.translatedText || null;
    } catch (error) {
      console.error('Translation failed', error);
      return null;
    }
  },

  getPreviews: async () => {
    try {
      // Fetching popular songs with 30-sec previews from iTunes API because Spotify requires a Premium dev account
      const url = `https://itunes.apple.com/search?term=pop+hits&limit=15&entity=song`;
      const { data } = await axios.get(url);
      
      const tracks = (data.results || []).map((song: any) => ({
        id: song.trackId?.toString() || Math.random().toString(),
        name: song.trackName || 'Unknown Title',
        artist_name: song.artistName || 'Unknown Artist',
        album_name: song.collectionName || '',
        image: song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '500x500bb') : 'https://via.placeholder.com/150',
        audio: song.previewUrl || '', // 30-sec preview
        duration: 30, // Previews are 30 secs
        source: 'itunes'
      })).filter((t: any) => t.audio); // Only keep those with previews
      
      return tracks;
    } catch (error) {
      console.log('getPreviews API error:', error);
      return [];
    }
  },

  getYoutubeHits: async () => {
    try {
      // Calls the new backend YouTube Music service
      const { data } = await apiClient.get('/youtube/tracks?limit=15');
      return data.results || [];
    } catch (error) {
      console.log('getYoutubeHits API error:', error);
      return [];
    }
  },
  importSpotify: async (url: string) => {
    try {
      const { data } = await apiClient.get(`/catalog/import-spotify?url=${encodeURIComponent(url)}`);
      return data;
    } catch (error) {
      console.error('importSpotify API error:', error);
      return null;
    }
  }
};
