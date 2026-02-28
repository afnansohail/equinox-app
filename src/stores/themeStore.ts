import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { THEME_PRESETS, type ThemePreset } from "../constants/theme";

const STORAGE_KEY = "equinox_accent_theme";

interface ThemeState {
  accentPreset: ThemePreset;
  accentColor: string;
  accentGradient: [string, string];
  setAccent: (preset: ThemePreset) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  accentPreset: "teal",
  accentColor: THEME_PRESETS.teal.color,
  accentGradient: THEME_PRESETS.teal.gradient,

  setAccent: async (preset: ThemePreset) => {
    const p = THEME_PRESETS[preset];
    set({
      accentPreset: preset,
      accentColor: p.color,
      accentGradient: p.gradient,
    });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, preset);
    } catch (_) {}
  },

  loadSavedTheme: async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved && saved in THEME_PRESETS) {
        const preset = saved as ThemePreset;
        const p = THEME_PRESETS[preset];
        set({
          accentPreset: preset,
          accentColor: p.color,
          accentGradient: p.gradient,
        });
      }
    } catch (_) {}
  },
}));
