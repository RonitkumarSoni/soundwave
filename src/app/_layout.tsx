import React, { useState, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuthStore } from "@/stores/useAuthStore";

export default function RootLayout() {
  // Initialize audio player
  useAudioPlayer();
  const router = useRouter();
  const segments = useSegments();
  const [activeTab, setActiveTab] = useState(0);

  const { isLoggedIn, isLoading, loadFromStorage } = useAuthStore();

  React.useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to login if not logged in
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect to home if logged in but trying to access auth screens
      router.replace('/(home)');
    }
  }, [isLoggedIn, isLoading, segments]);

  // Detect if we're on the Now Playing screen
  const isNowPlaying = segments.includes("player" as never);

  const handleTabChange = useCallback(
    (index: number) => {
      setActiveTab(index);
      switch (index) {
        case 0:
          router.navigate("/(home)");
          break;
        case 1:
          router.navigate("/(library)");
          break;
        case 2:
          router.navigate("/(settings)");
          break;
      }
    },
    [router]
  );

  // If loading auth state, we can return null or a splash screen
  if (isLoading) return <View style={styles.container} />;

  const globalCss = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
      transition: background-color 5000s ease-in-out 0s;
      -webkit-text-fill-color: #fff !important;
    }
  `;

  // If not logged in, just render the stack so (auth) routes work without BottomNav
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        {Platform.OS === 'web' && <style dangerouslySetInnerHTML={{ __html: globalCss }} />}
        <StatusBar style="light" />
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
          <Tabs.Screen name="(auth)" options={{ title: "Auth" }} />
        </Tabs>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <style dangerouslySetInnerHTML={{ __html: globalCss }} />}
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="(home)" options={{ title: "Home" }} />
        <Tabs.Screen name="(search)" options={{ title: "Search" }} />
        <Tabs.Screen name="(library)" options={{ title: "Library" }} />
        <Tabs.Screen name="(settings)" options={{ title: "Settings" }} />
        <Tabs.Screen
          name="player/now-playing"
          options={{ title: "Now Playing" }}
        />
      </Tabs>

      {/* Custom floating UI — hidden during Now Playing */}
      {!isNowPlaying && (
        <>
          <MiniPlayer />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#170B2E",
  },
});
