import 'react-native-gesture-handler';
import React, { useState, useCallback } from "react";
import { View, StyleSheet, Platform, Keyboard } from "react-native";
import { api } from '@/lib/api';
import { Stack, useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { AnimatedSplashScreen } from "@/components/AnimatedSplashScreen";


import { BottomNav } from "@/components/BottomNav";

import { MiniPlayer } from "@/components/MiniPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

import { registerPlayback } from "@/services/playbackService";
import { auth } from "@/lib/firebase";
import { onIdTokenChanged } from "firebase/auth";
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { authRedirect } from "@/lib/authRoute";
import { useAlertTheme } from '@/hooks/useAlertTheme';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { listenForPushNotifications, refreshPushRegistration, restorePushNotifications } from '@/services/pushNotifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

registerPlayback();

export default function RootLayout() {
  const alertTheme = useAlertTheme();
  const insets = useSafeAreaInsets();
  // Initialize audio player
  useAudioPlayer();
  const router = useRouter();
  const segments = useSegments();
  React.useEffect(() => { Keyboard.dismiss(); }, [segments]);
  const [pendingPlay, setPendingPlay] = useState<{ id: string; source: string } | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const finishSplash = useCallback(() => setIsAnimationComplete(true), []);
  const showCustomSplash = useCallback(() => { void SplashScreen.hideAsync().catch(() => {}); }, []);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const emailVerified = useAuthStore((state) => state.emailVerified);
  const profileError = useAuthStore((state) => state.profileError);
  const syncUser = useAuthStore((state) => state.syncUser);
  const hasSeenOnboarding = useSettingsStore((state) => state.hasSeenOnboarding);
  const firebaseUid = useAuthStore((state) => state.firebaseUser?.uid || null);
  const pushEnabled = useSettingsStore((state) => state.pushNotifications);
  React.useEffect(() => listenForPushNotifications(() => router.navigate('/notifications')), [router]);
  React.useEffect(() => {
    void useNotificationStore.getState().load(firebaseUid).then(() => restorePushNotifications(() => router.navigate('/notifications'))).catch(() => {});
  }, [firebaseUid, router]);
  React.useEffect(() => {
    if (firebaseUid && emailVerified && pushEnabled) void refreshPushRegistration().catch(() => {});
  }, [firebaseUid, emailVerified, pushEnabled]);




  const togglePlay = usePlayerStore((s) => s.togglePlay);

  React.useEffect(() => {
    if (profileError) Toast.show({ type: "error", text1: "Couldn't refresh your account", text2: "Please try again shortly." });
  }, [profileError]);

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
    const unsubscribe = onIdTokenChanged(auth, firebaseUser => {
      void syncUser(firebaseUser).catch(error => { console.error('Account restore failed', error); });
    });
    return unsubscribe;
  }, [syncUser]);

  // Deep Linking Handler
  React.useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      try {
        const parsedUrl = Linking.parse(url);
        // Example: soundwave://play?id=123&type=track
        const playId = parsedUrl.queryParams?.play || parsedUrl.queryParams?.id;
        if (typeof playId === "string") {
          setPendingPlay({ id: playId, source: typeof parsedUrl.queryParams?.source === "string" ? parsedUrl.queryParams.source : "jiosaavn" });
        }
      } catch (e) {
        console.error("Failed to parse deep link", e);
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") void handleDeepLink(window.location.href);
    else Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }: any) => handleDeepLink(url));

    return () => {
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!pendingPlay || isLoading || !isLoggedIn || !emailVerified) return;
    let cancelled = false;
    void api.getTrackById(pendingPlay.id, pendingPlay.source).then(track => {
      if (cancelled) return;
      if (!track) throw new Error("Track unavailable");
      usePlayerStore.getState().setQueue([track]);
      usePlayerStore.getState().setTrack(track);
      setPendingPlay(null);
    }).catch(() => {
      if (cancelled) return;
      Toast.show({ type: "error", text1: "Shared song unavailable" });
      setPendingPlay(null);
    });
    return () => { cancelled = true; };
  }, [pendingPlay, isLoading, isLoggedIn, emailVerified]);

  React.useEffect(() => {
    if (isLoading) return;

    const destination = authRedirect({ isLoggedIn, emailVerified, hasSeenOnboarding }, segments);
    if (destination) router.replace(destination as Parameters<typeof router.replace>[0]);
  }, [isLoggedIn, isLoading, emailVerified, segments, hasSeenOnboarding, isAnimationComplete, router]);

  // Detect if we're on the Now Playing, Onboarding, or Auth screens
  const isNowPlaying = segments.includes("player" as never);
  const isOnboarding = segments.includes("onboarding" as never);
  const isAuth = segments[0] === '(auth)';

  const handleTabChange = useCallback(
    (index: number) => {
      if (index === activeTab && ['(home)', '(search)', '(library)', '(premium)'].includes(segments[0] || '')) return;
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
    [router, activeTab, segments]
  );

  // Sync activeTab with current segment
  React.useEffect(() => {
    const segment = segments[0];
    if (segment === '(home)') setActiveTab(0);
    else if (segment === '(search)') setActiveTab(1);
    else if (segment === '(library)') setActiveTab(2);
    else if (segment === '(premium)' || segment === '(settings)') setActiveTab(3);
  }, [segments]);


  React.useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);


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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          freezeOnBlur: true,
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

      {/* Custom floating UI — hidden during Now Playing, Onboarding, or Auth */}
      {!isNowPlaying && !isOnboarding && !isAuth && (
        <>
          <MiniPlayer />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}

      {(isLoading || !isAnimationComplete) && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 100 }]}>
          <AnimatedSplashScreen
            ready={!isLoading && authRedirect({ isLoggedIn, emailVerified, hasSeenOnboarding }, segments) === null}
            onFinish={finishSplash}
            onLayout={showCustomSplash}
            onRetry={() => { void syncUser(auth.currentUser).catch(error => { console.error('Account restore failed', error); }); }}
          />
        </View>
      )}
      <View pointerEvents="none" style={{position:"absolute",top:0,left:0,right:0,height:insets.top,backgroundColor:"#170B2E",zIndex:110}} />
      {/* Global Toast Notification */}
      <Toast
        position="bottom"
        bottomOffset={insets.bottom + 170}
        visibilityTime={2500}
        config={{
          success: (props) => (
            <BaseToast
              {...props}
              style={{ borderLeftColor: alertTheme.accent, backgroundColor: alertTheme.background }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{ fontSize: 16, fontWeight: '700', color: alertTheme.text }}
              text2Style={{ fontSize: 13, color: alertTheme.secondaryText }}
            />
          ),
          error: (props) => (
            <ErrorToast
              {...props}
              style={{ borderLeftColor: alertTheme.danger, backgroundColor: alertTheme.background }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{ fontSize: 16, fontWeight: '700', color: alertTheme.text }}
              text2Style={{ fontSize: 13, color: alertTheme.secondaryText }}
            />
          ),
          info: (props) => (
            <BaseToast
              {...props}
              style={{ borderLeftColor: alertTheme.accent, backgroundColor: alertTheme.background }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{ fontSize: 16, fontWeight: '700', color: alertTheme.text }}
              text2Style={{ fontSize: 13, color: alertTheme.secondaryText }}
            />
          ),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#170B2E",
  },
});
