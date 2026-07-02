import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { Track } from "@/stores/usePlayerStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

interface TrackRowProps {
  track: Track;
  index: number;
  showDuration?: boolean;
  contextQueue?: Track[];
}

export function TrackRow({ track, index, showDuration = true, contextQueue }: TrackRowProps) {
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = async () => {
    setTrack(track);
    if (contextQueue && contextQueue.length > 1) {
      setQueue(contextQueue);
    } else {
      // Auto-populate queue with popular tracks so Up Next has content
      try {
        const { api } = require('@/lib/api');
        const popular = await api.getPopular(20, 0);
        if (popular.length > 0) {
          // Put current track first, then fill with popular tracks (excluding duplicates)
          const others = popular.filter((t: Track) => t.id !== track.id);
          setQueue([track, ...others]);
        } else {
          setQueue([track]);
        }
      } catch {
        setQueue([track]);
      }
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePlay}
        activeOpacity={0.7}
      >
        {/* Cover Art */}
        <Image source={{ uri: track.image }} style={styles.coverArt} />

        {/* Track Info */}
        <View style={styles.info}>
          <Text
            style={[
              styles.title,
              isCurrentTrack && { color: colors.accentSolid },
            ]}
            numberOfLines={1}
          >
            {track.name}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist_name}
          </Text>
        </View>

        {/* Duration */}
        {showDuration && (
          <Text style={styles.duration}>
            {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
          </Text>
        )}

        {/* Play Button */}
        <TouchableOpacity onPress={handlePlay} activeOpacity={0.7}>
          <LinearGradient
            colors={[gradients.primary[0], gradients.primary[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playButton}
          >
            <Ionicons
              name={isCurrentTrack && isPlaying ? "pause" : "play"}
              size={16}
              color={colors.label}
              style={isCurrentTrack && isPlaying ? undefined : { marginLeft: 2 }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  coverArt: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.label,
  },
  artist: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.secondaryLabel,
  },
  duration: {
    fontSize: 13,
    color: colors.tertiaryLabel,
    marginRight: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
