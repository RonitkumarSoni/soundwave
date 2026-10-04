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
    set(defaultSettings);
    AsyncStorage.setItem("user_settings", JSON.stringify(defaultSettings)).catch(console.error);
  },

  loadFromStorage: async () => {
    const uid = getStorageAccount();
    set(defaultSettings);
    try {
      const saved = await AsyncStorage.getItem("user_settings");
      if (saved && uid === getStorageAccount()) {
        const parsed = JSON.parse(saved);
        const allowed: Record<string, unknown> = {};
        for (const [key, initial] of Object.entries(defaultSettings)) {
          const value = parsed?.[key];
          if (typeof value !== typeof initial) continue;
          if (typeof value === "number" && (!Number.isFinite(value) || value < 0 || value > 12)) continue;
          const choices: Record<string, string[]> = { audioQuality: ["auto", "low", "normal", "high"], downloadQuality: ["normal", "high"], theme: ["dark", "light", "system"], language: ["en", "hi", "auto"] };
          if (choices[key] && !choices[key].includes(value)) continue;
          allowed[key] = value;
        }
        set(allowed);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  },
}));
