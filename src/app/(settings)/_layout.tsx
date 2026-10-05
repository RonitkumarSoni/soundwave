import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', freezeOnBlur: true }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
