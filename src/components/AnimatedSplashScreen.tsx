import React, { useEffect, useRef, useState } from 'react';
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
  const opacity = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [imageReady, setImageReady] = useState(false);
  const [takingLonger, setTakingLonger] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const artworkWidth = Math.min(width, height * 851 / 1849);
  const artworkHeight = artworkWidth * 1849 / 851;
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
          source={require('../../assets/images/soundwave-splash-v3.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="contain"
          accessible
          accessibilityLabel="Soundwave. Your music. Your moment."
          onLoadEnd={() => setImageReady(true)}
        />
        <View style={[styles.loading, { bottom: Math.max(artworkHeight * 0.047, insets.bottom + 16), height: artworkHeight * 0.065 }]}>
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
  container: { flex: 1, backgroundColor: '#13071F', alignItems: 'center', justifyContent: 'center' },
  loading: { position: 'absolute', left: 0, right: 0, alignItems: 'center', backgroundColor: '#13071F', paddingTop: 8 },
  track: { width: '57%', height: 3, borderRadius: 3, overflow: 'hidden', backgroundColor: '#362043' },
  fill: { flex: 1, borderRadius: 3 },
  caption: { color: '#AC8EC7', fontSize: 12, letterSpacing: 1, marginTop: 16 },
});
