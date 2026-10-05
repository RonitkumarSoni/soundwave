import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useAlertTheme() {
  const preference = useSettingsStore((state) => state.theme);
  const systemTheme = useColorScheme();
  const isDark = preference === 'system' ? systemTheme === 'dark' : preference === 'dark';
  return {
    isDark,
    background: isDark ? '#1E1432' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#21152F',
    secondaryText: isDark ? '#B9A9D9' : '#60546D',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(33,21,47,0.12)',
    button: isDark ? 'rgba(255,255,255,0.10)' : '#F0EBF5',
    accent: isDark ? '#B88AFF' : '#7131C5',
    danger: isDark ? '#FF8198' : '#B51F40',
  };
}
