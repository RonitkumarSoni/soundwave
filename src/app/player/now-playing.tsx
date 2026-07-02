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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COVER_SIZE = SCREEN_WIDTH * 0.75;
const COVER_SPACING = (SCREEN_WIDTH - COVER_SIZE) / 2;

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLiked = usePlayerStore((s) => s.isLiked);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const progress = usePlayerStore((s) => s.progress);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const queue = usePlayerStore((s) => s.queue);
  const setTrack = usePlayerStore((s) => s.setTrack);

  const [isQueueVisible, setQueueVisible] = useState(false);

  // Heart animation — must be before any conditional return
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // If no track is selected, go back
  if (!currentTrack) {
    return (
      <LinearGradient
        colors={["#B06AB3", "#4568DC"]}
        style={[{ flex: 1, alignItems: "center", justifyContent: "center" }, { paddingTop: insets.top }]}
      >
        <Text style={{ color: "white", fontSize: 16 }}>No track selected</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const track = currentTrack;
  const currentIdx = queue.findIndex((t) => t.id === track.id);
  const carouselTracks = queue.length > 0 ? queue : [track];

  const handleLike = () => {
    heartScale.value = withSpring(1.3, { damping: 5, stiffness: 200 });
    setTimeout(() => {
      heartScale.value = withSpring(1);
    }, 150);
    toggleLike();
  };

  const handleShare = async () => {
    try {
      const url = "https://soundwave-studio-app.vercel.app/";
      const message = `Listen to "${track.name}" by ${track.artist_name} on Soundwave! 🎵\n${url}`;
      
      await Share.share({
        message,
        url,
        title: "Share Song",
      });
    } catch (error: any) {
      console.error("Error sharing:", error.message);
    }
  };

  // Format time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const durationMs = track.duration * 1000;
  const currentTime = formatTime(progress * durationMs);
  const totalTime = `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, "0")}`;

  const renderCoverItem = ({
    item,
    index,
  }: {
    item: (typeof carouselTracks)[number];
    index: number;
  }) => {
    return (
      <View style={styles.coverItemWrapper}>
        <Image source={{ uri: item.image }} style={styles.coverImage} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Exact gradient from reference image: Muted Purple to Deep Slate Blue */}
      <LinearGradient
        colors={["#7D5598", "#50568B", "#2E517E"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 60 }]}>
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

      {/* Cover Art */}
      <View style={styles.coverSection}>
        <View style={[styles.coverItemWrapper, { marginRight: 0 }]}>
          <Image source={{ uri: track.image }} style={styles.coverImage} />
        </View>
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
              color={isLiked ? "#FF3B30" : "#FFF"}
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
        <TouchableOpacity onPress={toggleShuffle} activeOpacity={0.7}>
          <Ionicons
            name="shuffle"
            size={24}
            color={isShuffled ? "#FFF" : "rgba(255,255,255,0.5)"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={prevTrack} activeOpacity={0.7}>
          <Ionicons name="play-skip-back" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Big Center Play/Pause Glass Capsule */}
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

        <TouchableOpacity onPress={nextTrack} activeOpacity={0.7}>
          <Ionicons name="play-skip-forward" size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={toggleRepeat}>
          <Feather
            name="repeat"
            size={24}
            color={repeatMode !== "off" ? "#FFF" : "rgba(255,255,255,0.5)"}
          />
          {repeatMode === "one" && (
            <View style={{ position: "absolute", top: -5, right: -5, backgroundColor: "#FFF", borderRadius: 10, width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 9, fontWeight: "bold", color: "#000" }}>1</Text>
            </View>
          )}
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  coverSection: {
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    height: COVER_SIZE,
  },
  coverItemWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    marginRight: spacing.md,
    borderRadius: 24,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 15,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  trackInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  trackInfoText: {
    flex: 1,
    marginRight: spacing.md,
  },
  trackArtist: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 6,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  transportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  bigPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
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
    paddingBottom: spacing.xxxl * 2,
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
