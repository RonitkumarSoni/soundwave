import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable for API URL in production, fallback to localhost for development
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Interceptor to attach token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { data } = await apiClient.post('/auth/login', { email, password });
      return data;
    },
    signup: async (email: string, password: string, display_name: string) => {
      const { data } = await apiClient.post('/auth/signup', { email, password, display_name });
      return data;
    },
    googleLogin: async (id_token: string) => {
      const { data } = await apiClient.post('/auth/google', { id_token });
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
