import React, { useState, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BottomNav } from "@/components/BottomNav";
import { Ionicons } from "@expo/vector-icons";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

export default function RootLayout() {
  // Initialize audio player
  useAudioPlayer();
  const router = useRouter();
  const segments = useSegments();
  const [activeTab, setActiveTab] = useState(0);

  const { isLoggedIn, isLoading, loadFromStorage } = useAuthStore();
  const initSettings = useSettingsStore((s) => s.initSettings);
  const initLikedTracks = usePlayerStore((s) => s.initLikedTracks);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  // Keyboard shortcuts (web only)
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  React.useEffect(() => {
    initSettings();
    initLikedTracks();
  }, []);

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const playId = url.searchParams.get('play');
      if (playId) {
        AsyncStorage.setItem('pending_play_id', playId);
      }
    }
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
          router.navigate("/(search)");
          break;
        case 2:
          router.navigate("/(library)");
          break;
        case 3:
          router.navigate("/(settings)");
          break;
      }
    },
    [router]
  );

  // Sync activeTab with current segment
  React.useEffect(() => {
    const segment = segments[0];
    if (segment === '(home)') setActiveTab(0);
    else if (segment === '(search)') setActiveTab(1);
    else if (segment === '(library)') setActiveTab(2);
    else if (segment === '(settings)') setActiveTab(3);
  }, [segments]);


  // If loading auth state, we can return null or a splash screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0514', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="musical-notes" size={80} color="#B06AB3" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 40, letterSpacing: 2 }}>SOUNDWAVE</Text>
        <ActivityIndicator size="large" color="#B06AB3" />
      </View>
    );
  }

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
