import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const { data } = await apiClient.get('/catalog/search', { params: { q: query } });
      // The backend returns { tracks: [], artists: [], albums: [] }
      return data.tracks || [];
    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  },

  getTracks: async () => {
    try {
      // Get trending tracks
      const { data } = await apiClient.get('/catalog/tracks', { params: { limit: 10 } });
      return data.results || [];
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
};
