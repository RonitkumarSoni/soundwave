import { publicData } from './publicData';
import { jioTrack } from './jiosaavn';
import { normalizeTrack } from './tracks';
import axios, { create } from 'axios';


import { Platform } from 'react-native';

import { API_BASE } from './config';
import { auth } from './firebase';

// Use environment variable for API URL in production, fallback to Render backend

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

const apiClient = create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Interceptor to attach token
apiClient.interceptors.request.use(async (config) => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.warn("Failed to get Firebase token", e);
  }
  return config;
});

// No custom response interceptor needed for refreshing tokens.
// Firebase SDK automatically refreshes ID tokens behind the scenes when auth.currentUser.getIdToken() is called.

export const api = {
  auth: {
    me: async () => {
      const { data } = await apiClient.get('/users/me');
      return data;
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
  search: async (query: string, signal?: AbortSignal) => {
    const jioUrl = getProxiedUrl('https://www.jiosaavn.com/api.php?__call=search.getResults&q=' + encodeURIComponent(query) + '&n=15&p=1&_format=json&_marker=0&ctx=android');
    const responses = await Promise.allSettled([
      apiClient.get('/youtube/tracks', { params: { q: query, limit: 15 }, signal }),
      publicData(jioUrl, signal),
      apiClient.get('/catalog/search', { params: { q: query, limit: 10 }, signal }),
    ]);
    if (signal?.aborted) throw new Error('Search cancelled');
    if (responses.every(response => response.status === 'rejected')) throw new Error('Search is unavailable. Check your connection and try again.');
    const youtube = responses[0].status === 'fulfilled' ? responses[0].value.data.results || [] : [];
    const jio = responses[1].status === 'fulfilled' ? (responses[1].value.results || []).map(jioTrack) : [];
    const catalog = responses[2].status === 'fulfilled' ? responses[2].value.data : {};
    const seen = new Set<string>();
    const tracks = [...youtube, ...jio, ...(catalog.tracks || [])].map(normalizeTrack).map(track => track.source === 'youtube' ? { ...track, audio: API_BASE + '/youtube/stream/' + encodeURIComponent(track.id) } : track).filter(track => {
      const key = track.name.toLowerCase() + '|' + track.artist_name.toLowerCase();
      if (!track.name || seen.has(key)) return false; seen.add(key); return true;
    });
    return { tracks, artists: catalog.artists || [], albums: catalog.albums || [],
      partial: Boolean(catalog.partial) || responses.some(response => response.status === 'rejected') };
  },

  getTracks: async () => {
    return api.getPopular(20);
  },

  getTrackById: async (id: string, source = 'jiosaavn') => {
    if (source === 'jiosaavn') {
      const data = await publicData(getProxiedUrl('https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=' + encodeURIComponent(id) + '&_format=json&_marker=0&ctx=android'));
      const raw = data[id] || data.songs?.[0];
      if (!raw) throw new Error('Track not found');
      return jioTrack(raw);
    }
    if (!["youtube", "jamendo", "spotify"].includes(source)) throw new Error("This provider does not support shared-track lookup yet");
    const route = source === 'youtube' ? '/youtube/tracks/' : source === 'jamendo' ? '/catalog/jamendo/' : '/catalog/tracks/';
    const { data } = await apiClient.get(route + encodeURIComponent(id));
    if (!data || data.error) throw new Error('Track not found');
    return normalizeTrack(source === 'youtube' ? { ...data, audio: API_BASE + '/youtube/stream/' + encodeURIComponent(id) } : data);
  },

  getPopular: async (limit = 10, offset = 0, order = 'popularity_week', country = 'India') => {
    const query = order === 'releasedate' ? 'New Releases' : order === 'popularity_total' ? 'Trending in ' + country : 'Top Hits';
    const page = Math.floor(offset / limit) + 1;
    const data = await publicData(getProxiedUrl('https://www.jiosaavn.com/api.php?__call=search.getResults&q=' + encodeURIComponent(query) + '&n=' + limit + '&p=' + page + '&_format=json&_marker=0&ctx=android'));
    return (data.results || []).map(jioTrack);
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

  getArtistById: async (id: string, source = "jiosaavn") => {
    if (!["spotify", "jiosaavn"].includes(source)) throw new Error("This provider does not support these details");
    if (source === "spotify") return (await apiClient.get("/catalog/artists/" + encodeURIComponent(id))).data;
    try {
      const url = `https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${id}&_format=json&_marker=0&ctx=android`;
      const data = await publicData(getProxiedUrl(url));
      return {
        id: data.artistId, source: "jiosaavn",
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

  getArtistTracks: async (id: string, source = 'jiosaavn') => {
    if (!["spotify", "jiosaavn"].includes(source)) throw new Error("This provider does not support these details");
    if (source === 'spotify') return (await apiClient.get('/catalog/artists/' + encodeURIComponent(id) + '/tracks')).data.results || [];
    const data = await publicData(getProxiedUrl('https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=' + encodeURIComponent(id) + '&_format=json&_marker=0&ctx=android'));
    return (data.topSongs?.songs || []).map(jioTrack);
  },

  getAlbumById: async (id: string, source = "jiosaavn") => {
    if (!["spotify", "jiosaavn"].includes(source)) throw new Error("This provider does not support these details");
    if (source === "spotify") return (await apiClient.get("/catalog/albums/" + encodeURIComponent(id))).data;
    try {
      const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=${id}&_format=json&_marker=0&ctx=android`;
      const data = await publicData(getProxiedUrl(url));
      return {
        id: data.albumid,
        name: data.title || data.name, title: data.title || data.name, source: "jiosaavn",
        artist: data.primary_artists,
        image: formatImageUrl(data.image),
        year: data.year
      };
    } catch (error) {
      console.error('getAlbumById API error:', error);
      return null;
    }
  },

  getAlbumTracks: async (id: string, source = 'jiosaavn') => {
    if (!["spotify", "jiosaavn"].includes(source)) throw new Error("This provider does not support these details");
    if (source === 'spotify') return (await apiClient.get('/catalog/albums/' + encodeURIComponent(id) + '/tracks')).data.results || [];
    const data = await publicData(getProxiedUrl('https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=' + encodeURIComponent(id) + '&_format=json&_marker=0&ctx=android'));
    return (data.songs || []).map(jioTrack);
  },

  playlists: {
    create: async (title: string, cover_url?: string) => {
      const { data } = await apiClient.post('/playlists', { title, cover_url });
      return data;
    },
    getAll: async () => {
      return withRetry(async () => (await apiClient.get("/playlists")).data);
    },
    getById: async (id: string) => {
      const { data } = await apiClient.get(`/playlists/${id}`);
      return data;
    },
    addTrack: async (id: string, track_id: string, track?: any) => {
      const { data } = await apiClient.post(`/playlists/${id}/tracks`, { track_id, source: track?.source, track });
      return data;
    },
    removeTrack: async (id: string, trackId: string, source?: string) => {
      const key = source ? source + ':' + trackId : trackId;
      const { data } = await apiClient.delete('/playlists/' + encodeURIComponent(id) + '/tracks/' + encodeURIComponent(key));
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
      } catch {
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
            } catch {}
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
        } catch {
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
      } catch {
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
