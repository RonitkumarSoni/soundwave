import { create } from "zustand";
import { accountStorage as AsyncStorage, getStorageAccount } from "@/lib/accountStorage";

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
  hasSeenOnboarding: boolean;
  dataSaver: boolean;
  canvasEnabled: boolean;
  carMode: boolean;
  offlineMode: boolean;

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
  hasSeenOnboarding: false,
  dataSaver: false,
  canvasEnabled: true,
  carMode: false,
  offlineMode: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  updateSetting: (key, value) => {
    if (!(key in defaultSettings)) return;
    set({ [key]: value } as any);
    AsyncStorage.setItem("user_settings", JSON.stringify(get())).catch(console.error);
  },

  resetToDefaults: () => {
    const settings = { ...defaultSettings, hasSeenOnboarding: get().hasSeenOnboarding };
    set(settings);
    AsyncStorage.setItem("user_settings", JSON.stringify(settings)).catch(console.error);
  },

  loadFromStorage: async () => {
    const uid = getStorageAccount();
    const allowed: Record<string, unknown> = {};
    try {
      const saved = await AsyncStorage.getItem("user_settings");
      if (saved && uid === getStorageAccount()) {
        const parsed = JSON.parse(saved);
        for (const [key, initial] of Object.entries(defaultSettings)) {
          const value = parsed?.[key];
          if (typeof value !== typeof initial) continue;
          if (typeof value === "number" && (!Number.isFinite(value) || value < 0 || value > 12)) continue;
          const choices: Record<string, string[]> = { audioQuality: ["auto", "low", "normal", "high"], downloadQuality: ["normal", "high"], theme: ["dark", "light", "system"], language: ["en", "hi", "auto"] };
          if (choices[key] && !choices[key].includes(value)) continue;
          allowed[key] = value;
        }
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    if (uid === getStorageAccount()) set({ ...defaultSettings, ...allowed });
  },
}));
