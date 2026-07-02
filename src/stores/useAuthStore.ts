import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  is_premium: boolean;
  oauth_provider: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  setAuthData: (data: { user: UserProfile; access_token: string; refresh_token: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoggedIn: false,
  isLoading: true, // true until we load from storage

  setAuthData: async (data) => {
    try {
      await AsyncStorage.multiSet([
        ["access_token", data.access_token],
        ["refresh_token", data.refresh_token],
        ["user_profile", JSON.stringify(data.user)],
      ]);
      set({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        isLoggedIn: true,
      });
    } catch (e) {
      console.error("Failed to save auth data", e);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove(["access_token", "refresh_token", "user_profile"]);
      set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false });
    } catch (e) {
      console.error("Failed to clear auth data", e);
    }
  },

  loadFromStorage: async () => {
    try {
      const [[, accessToken], [, refreshToken], [, userStr]] = await AsyncStorage.multiGet([
        "access_token",
        "refresh_token",
        "user_profile",
      ]);

      if (accessToken && userStr) {
        set({
          accessToken,
          refreshToken,
          user: JSON.parse(userStr),
          isLoggedIn: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error("Failed to load auth data", e);
      set({ isLoading: false });
    }
  },

  updateProfile: (profile) => {
    const { user } = get();
    if (!user) return;
    const updatedUser = { ...user, ...profile };
    AsyncStorage.setItem("user_profile", JSON.stringify(updatedUser)).catch(console.error);
    set({ user: updatedUser });
  },
}));
