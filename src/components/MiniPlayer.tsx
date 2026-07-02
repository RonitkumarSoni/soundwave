import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { colors, spacing, borderRadius } from "@/theme/colors";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useRouter } from "expo-router";

export function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const router = useRouter();

  if (!currentTrack) return null;

  const handlePress = () => {
    router.push("/player/now-playing");
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={styles.wrapper}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <BlurView intensity={50} tint="dark" style={styles.blurBg}>
          <View style={styles.content}>
            {/* Cover Art */}
            <Image
              source={{ uri: currentTrack.image }}
              style={styles.coverArt}
            />

            {/* Track Info */}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {currentTrack.name}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {currentTrack.artist_name}
              </Text>
            </View>

            {/* Controls */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              style={styles.controlButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={22}
                color={colors.label}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
              style={styles.controlButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="play-forward"
                size={20}
                color={colors.label}
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 96, // above BottomNav
    left: 16,
    right: 16,
    zIndex: 99,
  },
  container: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
  },
  blurBg: {
    overflow: "hidden",
    borderRadius: borderRadius.xl,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  coverArt: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.label,
  },
  artist: {
    fontSize: 12,
    color: colors.secondaryLabel,
  },
  controlButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
