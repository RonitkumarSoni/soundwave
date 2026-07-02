import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Modal,
  ScrollView,
  Share,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { Waveform } from "@/components/Waveform";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { seekGlobalAudio } from "@/hooks/useAudioPlayer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const COVER_SIZE = Math.min(SCREEN_WIDTH * 0.7, 320);
const SIDE_COVER_SIZE = COVER_SIZE * 0.7;

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const likedTracks = usePlayerStore((s) => s.likedTracks);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const progress = usePlayerStore((s) => s.progress);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const queue = usePlayerStore((s) => s.queue);
  const setTrack = usePlayerStore((s) => s.setTrack);

  const [isQueueVisible, setQueueVisible] = useState(false);

  // Heart animation
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!currentTrack) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", backgroundColor: "#0A0514" }]}>
        <Text style={{ color: "white", fontSize: 16 }}>No track selected</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const track = currentTrack;
  const currentIdx = queue.findIndex((t) => t.id === track.id);

  // Get prev/next tracks for the carousel
  const prevTrackData = queue.length > 1 ? queue[(currentIdx - 1 + queue.length) % queue.length] : null;
  const nextTrackData = queue.length > 1 ? queue[(currentIdx + 1) % queue.length] : null;

  const isLiked = likedTracks.some(t => t.id === track.id);

  const handleLike = () => {
    heartScale.value = withSpring(1.3, { damping: 5, stiffness: 200 });
    setTimeout(() => {
      heartScale.value = withSpring(1);
    }, 150);
    toggleLike(track);
  };

  const handleShare = async () => {
    try {
      const url = `https://soundwave-studio-app.vercel.app/?play=${track.id}`;
      const message = `Listen to "${track.name}" by ${track.artist_name} on Soundwave! 🎵\n${url}`;
      await Share.share({ message, url, title: "Share Song" });
    } catch (error: any) {
      console.error("Error sharing:", error.message);
    }
  };

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms) || !isFinite(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const durationMs = (track.duration > 0 ? track.duration : 0) * 1000;
  const currentTime = formatTime(progress * durationMs);
  const totalTime = track.duration > 0
    ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, "0")}`
    : "0:00";

  return (
    <View style={styles.container}>
      {/* Background: Blurred album art */}
      <Image
        source={{ uri: track.image }}
        style={[StyleSheet.absoluteFillObject, { width: "100%", height: "100%" }]}
        blurRadius={Platform.OS === "web" ? 60 : 30}
        resizeMode="cover"
      />
      {/* Dark overlay for readability */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]} />
      {/* Subtle gradient overlay at top & bottom */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.7)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.innerContainer, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Now Playing</Text>
          <TouchableOpacity style={styles.topBarButton} activeOpacity={0.7} onPress={handleShare}>
            <Feather name="share" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Cover Art Carousel */}
        <View style={styles.coverCarousel}>
          {/* Previous track (small, faded) */}
          {prevTrackData && (
            <TouchableOpacity
              style={styles.sideCoverWrapper}
              activeOpacity={0.7}
              onPress={prevTrack}
            >
              <Image source={{ uri: prevTrackData.image }} style={styles.sideCover} />
            </TouchableOpacity>
          )}

          {/* Current track (large, center) */}
          <View style={styles.mainCoverWrapper}>
            <Image source={{ uri: track.image }} style={styles.mainCover} />
          </View>

          {/* Next track (small, faded) */}
          {nextTrackData && (
            <TouchableOpacity
              style={styles.sideCoverWrapper}
              activeOpacity={0.7}
              onPress={nextTrack}
            >
              <Image source={{ uri: nextTrackData.image }} style={styles.sideCover} />
            </TouchableOpacity>
          )}
        </View>

        {/* Track Info + Like */}
        <View style={styles.trackInfoRow}>
          <View style={styles.trackInfoText}>
            <Text style={styles.trackArtist}>{track.artist_name}</Text>
            <Text style={styles.trackTitle} numberOfLines={1}>{track.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLike} activeOpacity={0.7} style={styles.heartButton}>
            <Animated.View style={heartStyle}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? "#FF3B30" : "rgba(255,255,255,0.8)"}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Waveform Seek Bar */}
        <View style={styles.waveformContainer}>
          <Waveform
            progress={progress}
            currentTime={currentTime}
            totalTime={totalTime}
            onSeek={seekGlobalAudio}
          />
        </View>

        {/* Transport Controls */}
        <View style={styles.transportRow}>
          <TouchableOpacity onPress={toggleRepeat} activeOpacity={0.7} style={styles.transportSideButton}>
            <Feather
              name="repeat"
              size={22}
              color={repeatMode !== "off" ? "#FFF" : "rgba(255,255,255,0.5)"}
            />
            {repeatMode === "one" && (
              <View style={styles.repeatOneBadge}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={prevTrack} activeOpacity={0.7} style={styles.transportButton}>
            <Ionicons name="play-skip-back" size={26} color="#FFF" />
          </TouchableOpacity>

          {/* Big Center Play/Pause — Glassmorphic Circle */}
          <TouchableOpacity
            style={styles.bigPlayButton}
            onPress={togglePlay}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={30}
              color="#FFF"
              style={isPlaying ? undefined : { marginLeft: 3 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={nextTrack} activeOpacity={0.7} style={styles.transportButton}>
            <Ionicons name="play-skip-forward" size={26} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleShuffle} activeOpacity={0.7} style={styles.transportSideButton}>
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffled ? "#FFF" : "rgba(255,255,255,0.5)"}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Actions Row */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setQueueVisible(true)} style={styles.queueButton}>
            <Feather name="list" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.queueButtonText}>Up Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Queue Modal */}
      <Modal
        visible={isQueueVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQueueVisible(false)}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[styles.queueContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.queueHeader}>
            <TouchableOpacity onPress={() => setQueueVisible(false)} style={styles.closeButton}>
              <Feather name="chevron-down" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.queueTitle}>Up Next</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.queueList}>
            {queue.map((qTrack, idx) => {
              const isCurrent = currentTrack?.id === qTrack.id;
              return (
                <TouchableOpacity 
                  key={`${qTrack.id}-${idx}`} 
                  style={[styles.queueItem, isCurrent && styles.queueItemActive]}
                  onPress={() => {
                    setTrack(qTrack);
                    setQueueVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: qTrack.image }} style={styles.queueItemImage} />
                  <View style={styles.queueItemInfo}>
                    <Text style={[styles.queueItemTitle, isCurrent && { color: "#B06AB3" }]} numberOfLines={1}>
                      {qTrack.name}
                    </Text>
                    <Text style={styles.queueItemArtist} numberOfLines={1}>
                      {qTrack.artist_name}
                    </Text>
                  </View>
                  {isCurrent && (
                    <Ionicons name="volume-medium" size={20} color="#B06AB3" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.5,
  },
  // Cover carousel
  coverCarousel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  sideCoverWrapper: {
    width: SIDE_COVER_SIZE,
    height: SIDE_COVER_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    opacity: 0.5,
    marginHorizontal: spacing.xs,
  },
  sideCover: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  mainCoverWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 15 },
    elevation: 20,
    marginHorizontal: spacing.sm,
  },
  mainCover: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  // Track info
  trackInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
  },
  trackInfoText: {
    flex: 1,
    marginRight: spacing.md,
  },
  trackArtist: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
  },
  heartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Waveform
  waveformContainer: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  // Transport
  transportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  transportSideButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  transportButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatOneBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatOneText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000",
  },
  bigPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  // Bottom actions
  bottomActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  queueButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  queueButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
  },
  // Queue Modal
  queueContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  closeButton: {
    padding: spacing.sm,
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  queueList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  queueItemActive: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderBottomWidth: 0,
  },
  queueItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  queueItemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFF",
    marginBottom: 4,
  },
  queueItemArtist: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
});
