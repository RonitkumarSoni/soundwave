import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function Skeleton({ 
  style, 
  width, 
  height, 
  borderRadius = 8 
}: { 
  style?: StyleProp<ViewStyle>; 
  width?: number | string; 
  height?: number | string; 
  borderRadius?: number; 
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.2, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
}

export function TrackRowSkeleton() {
  return (
    <View style={styles.trackRow}>
      <Skeleton width={48} height={48} borderRadius={8} />
      <View style={styles.trackInfo}>
        <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={20} height={20} borderRadius={10} />
    </View>
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={140} height={140} borderRadius={12} style={{ marginBottom: 8 }} />
      <Skeleton width={120} height={14} style={{ marginBottom: 4 }} />
      <Skeleton width={80} height={12} />
    </View>
  );
}

export function PlaylistHeaderSkeleton() {
  return (
    <View style={styles.header}>
      <Skeleton width={200} height={200} borderRadius={20} style={{ marginBottom: spacing.lg }} />
      <Skeleton width={250} height={28} style={{ marginBottom: spacing.md }} />
      <Skeleton width={150} height={16} style={{ marginBottom: spacing.lg }} />
      <View style={styles.headerActions}>
        <Skeleton width={140} height={48} borderRadius={24} />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  trackInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  card: {
    width: 140,
    marginRight: spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
  }
});
