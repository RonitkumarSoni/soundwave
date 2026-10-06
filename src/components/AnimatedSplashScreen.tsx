import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  ready: boolean;
  onFinish: () => void;
  onLayout: () => void;
  onRetry: () => void;
}

export function AnimatedSplashScreen({ ready, onFinish, onLayout, onRetry }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(1));
  const [pulse] = useState(() => new Animated.Value(0));
  const [imageReady, setImageReady] = useState(false);
  const [takingLonger, setTakingLonger] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const artworkWidth = width;
  const artworkHeight = height;
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setTakingLonger(true), 15000);
    return () => clearTimeout(timer);
  }, [ready, attempt]);

  useEffect(() => {
    const loading = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loading.start();
    return () => loading.stop();
  }, [pulse]);

  useEffect(() => {
    if (!ready || !imageReady) return;
    const fade = Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true });
    fade.start(({ finished }) => { if (finished) onFinish(); });
    return () => fade.stop();
  }, [ready, imageReady, opacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity }]} onLayout={onLayout} accessibilityLabel="Soundwave is loading" accessibilityState={{ busy: !ready }}>
      <StatusBar style="light" />
      <View style={{ width: artworkWidth, height: artworkHeight }}>
        <Image
          source={require('../../assets/images/soundwave-logo-transparent.png')}
          style={{ width: Math.min(width * 0.44, 200), height: Math.min(width * 0.44, 200), alignSelf: 'center', marginTop: Math.max(insets.top + 24, height * 0.30) }}
          resizeMode="contain"
          accessible
          accessibilityLabel="Soundwave. Your music. Your moment."
          onLoadEnd={() => setImageReady(true)}
        />
        <Text style={{ color: '#FFF', textAlign: 'center', fontSize: 28, letterSpacing: 5, marginTop: 24 }}>SOUNDWAVE</Text>
        <Text style={{ color: '#AC8EC7', textAlign: 'center', fontSize: 16, marginTop: 12 }}>Your music. Your moment.</Text>
        <View style={[styles.loading, { bottom: insets.bottom + 40 }]}>
          <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Loading your music">
            <Animated.View style={{ width: '68%', height: '100%', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }}>
              <LinearGradient colors={['#8A3FFC', '#DF8AFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill} />
            </Animated.View>
          </View>
          {takingLonger && !ready ? (
            <Pressable accessibilityRole="button" onPress={() => { setTakingLonger(false); setAttempt(value => value + 1); onRetry(); }} hitSlop={12}>
              <Text style={styles.caption}>Taking a little longer. Tap to retry</Text>
            </Pressable>
          ) : <Text style={styles.caption}>Loading your music</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13071F', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  loading: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingTop: 8 },
  track: { width: '57%', height: 3, borderRadius: 3, overflow: 'hidden', backgroundColor: '#362043' },
  fill: { flex: 1, borderRadius: 3 },
  caption: { color: '#AC8EC7', fontSize: 12, letterSpacing: 1, marginTop: 16 },
});
