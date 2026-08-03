import React, { useState, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import { BottomNav } from "@/components/BottomNav";
import { Ionicons } from "@expo/vector-icons";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

export default function RootLayout() {
  // Initialize audio player
  useAudioPlayer();
  const router = useRouter();
  const segments = useSegments();
  const [activeTab, setActiveTab] = useState(0);

  const { isLoggedIn, isLoading, loadFromStorage: loadAuthFromStorage } = useAuthStore();
  const { hasSeenOnboarding, loadFromStorage: loadSettingsFromStorage } = useSettingsStore();
  const initLikedTracks = usePlayerStore((s) => s.initLikedTracks);
  const initDownloadedTracks = usePlayerStore((s) => s.initDownloadedTracks);
  const initFollowedAndSaved = usePlayerStore((s) => s.initFollowedAndSaved);
  const initCustomPlaylists = usePlayerStore((s) => s.initCustomPlaylists);
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
    // Configure audio to play in background
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn("Failed to set audio mode", e);
      }
    };
    configureAudio();
    
    loadSettingsFromStorage();
    initLikedTracks();
    initDownloadedTracks();
    initFollowedAndSaved();
    initCustomPlaylists();
  }, []);

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const playId = url.searchParams.get('play');
      if (playId) {
        AsyncStorage.setItem('pending_play_id', playId);
      }
    }
    loadAuthFromStorage();
  }, [loadAuthFromStorage]);

  // Deep Linking Handler
  React.useEffect(() => {
    const Linking = require('expo-linking');
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      try {
        const parsedUrl = Linking.parse(url);
        // Example: soundwave://play?id=123&type=track
        if (parsedUrl.queryParams?.id) {
          const id = parsedUrl.queryParams.id as string;
          // Here we would fetch track details from API and play it
          // For now we log it since we need full track object to play
          console.log("Deep link request to play:", id);
        }
      } catch (e) {
        console.error("Failed to parse deep link", e);
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }: any) => handleDeepLink(url));
    
    return () => {
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    
    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to welcome if not logged in
      router.replace('/(auth)/welcome');
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect to home if logged in but trying to access auth screens
      router.replace('/(home)');
    } else if (isLoggedIn && !hasSeenOnboarding && !inOnboarding) {
      // Show onboarding for first-time users
      router.replace('/onboarding');
    }
  }, [isLoggedIn, isLoading, segments, hasSeenOnboarding]);

  // Detect if we're on the Now Playing or Onboarding screen
  const isNowPlaying = segments.includes("player" as never);
  const isOnboarding = segments.includes("onboarding" as never);

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
          router.navigate("/(premium)");
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
    else if (segment === '(premium)' || segment === '(settings)') setActiveTab(3);
  }, [segments]);


  if (isLoading) {
    return <View style={styles.container} />;
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

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <style dangerouslySetInnerHTML={{ __html: globalCss }} />}
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(search)" />
        <Stack.Screen name="(library)" />
        <Stack.Screen name="(settings)" />
        <Stack.Screen name="(premium)" />
        <Stack.Screen
          name="player/now-playing"
          options={{ presentation: 'modal' }}
        />
      </Stack>

      {/* Custom floating UI — hidden during Now Playing or Onboarding */}
      {!isNowPlaying && !isOnboarding && (
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
