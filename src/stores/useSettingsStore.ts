import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SettingsState {
  audioQuality: "auto" | "low" | "normal" | "high";
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  gaplessPlayback: boolean;
  normalizeVolume: boolean;
  downloadQuality: "normal" | "high";
  downloadWifiOnly: boolean;
  theme: "dark" | "light" | "system";
  language: "en" | "hi" | "auto";
  pushNotifications: boolean;
  newMusicAlerts: boolean;

  updateSetting: <K extends keyof Omit<SettingsState, "updateSetting" | "resetToDefaults" | "loadFromStorage">>(
    key: K,
    value: SettingsState[K]
  ) => void;
  resetToDefaults: () => void;
  loadFromStorage: () => Promise<void>;
}

const defaultSettings = {
  audioQuality: "auto" as const,
  crossfadeEnabled: false,
  crossfadeDuration: 3,
  gaplessPlayback: true,
  normalizeVolume: true,
  downloadQuality: "normal" as const,
  downloadWifiOnly: true,
  theme: "dark" as const,
  language: "en" as const,
  pushNotifications: true,
  newMusicAlerts: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  updateSetting: (key, value) => {
    set({ [key]: value } as any);
    AsyncStorage.setItem("user_settings", JSON.stringify(get())).catch(console.error);
  },

  resetToDefaults: () => {
    set(defaultSettings);
    AsyncStorage.setItem("user_settings", JSON.stringify(defaultSettings)).catch(console.error);
  },

  loadFromStorage: async () => {
    try {
      const saved = await AsyncStorage.getItem("user_settings");
      if (saved) {
        set(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  },
}));
