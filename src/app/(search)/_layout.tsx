import { Stack } from "expo-router";

export default function SearchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', freezeOnBlur: true }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
