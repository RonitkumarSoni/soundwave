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
  TextInput,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { Waveform } from "@/components/Waveform";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { seekGlobalAudio } from "@/hooks/useAudioPlayer";
import { api } from "@/lib/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const COVER_SIZE = Math.min(SCREEN_WIDTH * 0.7, 320);
const SIDE_COVER_SIZE = COVER_SIZE * 0.7;

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const canvasEnabled = useSettingsStore(s => s.canvasEnabled);
  const carMode = useSettingsStore(s => s.carMode);
  const bgScale = useSharedValue(1);

  React.useEffect(() => {
    if (canvasEnabled) {
      bgScale.value = withRepeat(withTiming(1.2, { duration: 15000 }), -1, true);
    } else {
      bgScale.value = withTiming(1);
    }
  }, [canvasEnabled]);

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }]
  }));

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const likedTracks = usePlayerStore((s) => s.likedTracks);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const progress = usePlayerStore((s) => s.progress);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.repeatMode);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const queue = usePlayerStore((s) => s.queue);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  
  const moveQueueItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= queue.length) return;
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    setQueue(newQueue);
  };
  const setTrack = usePlayerStore((s) => s.setTrack);
  const sleepTimer = usePlayerStore((s) => s.sleepTimer);
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);
  const downloadedTracks = usePlayerStore((s) => s.downloadedTracks);
  const toggleDownload = usePlayerStore((s) => s.toggleDownload);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);

  const [isQueueVisible, setQueueVisible] = useState(false);
  const [isPlaylistModalVisible, setPlaylistModalVisible] = useState(false);
  const [isSleepTimerModalVisible, setSleepTimerModalVisible] = useState(false);
  const [isLyricsModalVisible, setLyricsModalVisible] = useState(false);
  const [lyricsText, setLyricsText] = useState<string | null>(null);
  const [translatedLyrics, setTranslatedLyrics] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);

  React.useEffect(() => {
    setLyricsText(null);
    setTranslatedLyrics(null);
    setIsTranslated(false);
  }, [currentTrack?.id]);

  const handleOpenLyrics = async () => {
    setLyricsModalVisible(true);
    if (!currentTrack || lyricsText) return;
    setIsLoadingLyrics(true);
    try {
      const lyrics = await api.getLyrics(currentTrack.artist_name, currentTrack.name);
      setLyricsText(lyrics || "Lyrics not found for this track. Please try another song.");
    } catch (e) {
      setLyricsText("Failed to load lyrics.");
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const handleToggleTranslation = async () => {
    if (!lyricsText || lyricsText.includes("Lyrics not found")) return;
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    
    if (translatedLyrics) {
      setIsTranslated(true);
      return;
    }

    setIsTranslating(true);
    try {
      const result = await api.translateLyrics(lyricsText, 'HI');
      if (result) {
        setTranslatedLyrics(result);
        setIsTranslated(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleOpenPlaylistModal = async () => {
    setPlaylistModalVisible(true);
    try {
      const data = await api.playlists.getAll();
      setPlaylists(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (!currentTrack) return;
    try {
      await Share.share({
        message: `Listen to ${currentTrack.name} by ${currentTrack.artist_name} on Soundwave!`,
        url: `soundwave://track/${currentTrack.id}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return;
    setAddingToPlaylist(playlistId);
    try {
      await api.playlists.addTrack(playlistId, currentTrack.id);
      setPlaylistModalVisible(false);
    } catch (e) {
      console.error('Failed to add track to playlist', e);
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const handleSpeedToggle = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx] || 1.0);
  };

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    heartScale.value = withSpring(1.3, { damping: 5, stiffness: 200 });
    setTimeout(() => {
      heartScale.value = withSpring(1);
    }, 150);
    toggleLike(track);
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderEnd: (e, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe right -> prev
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          prevTrack();
        } else if (gestureState.dx < -50) {
          // Swipe left -> next
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          nextTrack();
        }
      },
    })
  ).current;

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
      <Animated.Image
        source={{ uri: track.image }}
        style={[StyleSheet.absoluteFillObject, { width: "100%", height: "100%" }, bgAnimatedStyle]}
        blurRadius={Platform.OS === "web" ? 60 : 30}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]} />
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.7)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      />      {carMode ? (
        <View style={[styles.innerContainer, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20, justifyContent: 'center' }]}>
          <TouchableOpacity
            style={{ position: 'absolute', top: insets.top + 10, left: spacing.lg }}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={32} color="#FFF" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Image source={{ uri: track.image }} style={{ width: 160, height: 160, borderRadius: 12, marginBottom: spacing.lg }} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFF', textAlign: 'center', marginBottom: 8 }} numberOfLines={1}>{track.name}</Text>
            <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{track.artist_name}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
            <TouchableOpacity onPress={prevTrack} activeOpacity={0.7} style={{ padding: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50 }}>
              <Ionicons name="play-skip-back" size={40} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); togglePlay(); }} activeOpacity={0.7} style={{ padding: 30, backgroundColor: colors.accentSolid, borderRadius: 60 }}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={48} color="#FFF" style={{ marginLeft: isPlaying ? 0 : 8 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={nextTrack} activeOpacity={0.7} style={{ padding: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50 }}>
              <Ionicons name="play-skip-forward" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
      <View {...panResponder.panHandlers} style={[styles.innerContainer, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Now Playing</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity style={styles.topBarButton} activeOpacity={0.7} onPress={() => router.push('/equalizer')}>
              <Ionicons name="options-outline" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarButton} activeOpacity={0.7} onPress={handleSpeedToggle}>
              <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600" }}>{playbackRate}x</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ position: 'absolute', top: insets.top + spacing.sm, right: spacing.xl + 48, zIndex: 10 }}>
          <TouchableOpacity style={styles.topBarButton} activeOpacity={0.7} onPress={handleOpenLyrics}>
            <Ionicons name="text" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.coverCarousel}>
          {prevTrackData && (
            <TouchableOpacity
              style={styles.sideCoverWrapper}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); prevTrack(); }}
            >
              <Image source={{ uri: prevTrackData.image }} style={styles.sideCover} />
            </TouchableOpacity>
          )}

          <View style={styles.mainCoverWrapper}>
            <Image source={{ uri: track.image }} style={styles.mainCover} />
          </View>

          {nextTrackData && (
            <TouchableOpacity
              style={styles.sideCoverWrapper}
              activeOpacity={0.7}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); nextTrack(); }}
            >
              <Image source={{ uri: nextTrackData.image }} style={styles.sideCover} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackInfoRow}>
          <View style={styles.trackInfoText}>
            <Text style={styles.trackArtist}>{track.artist_name}</Text>
            <Text style={styles.trackTitle} numberOfLines={1}>{track.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity onPress={handleOpenPlaylistModal} activeOpacity={0.7} style={styles.actionButton}>
              <Feather name="plus" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLike} activeOpacity={0.7} style={styles.actionButton}>
              <Animated.View style={heartStyle}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={22}
                  color={isLiked ? "#FF3B30" : "rgba(255,255,255,0.8)"}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

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
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleRepeat(); }} activeOpacity={0.7} style={styles.transportSideButton}>
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

          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); prevTrack(); }} activeOpacity={0.7} style={styles.transportButton}>
            <Ionicons name="play-skip-back" size={26} color="#FFF" />
          </TouchableOpacity>

          {/* Big Center Play/Pause — Glassmorphic Circle */}
          <TouchableOpacity
            style={styles.bigPlayButton}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); togglePlay(); }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={30}
              color="#FFF"
              style={isPlaying ? undefined : { marginLeft: 3 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); nextTrack(); }} activeOpacity={0.7} style={styles.transportButton}>
            <Ionicons name="play-skip-forward" size={26} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleShuffle(); }} activeOpacity={0.7} style={styles.transportSideButton}>
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffled ? "#FFF" : "rgba(255,255,255,0.5)"}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Actions Row */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => toggleDownload(currentTrack)} style={styles.queueButton}>
            <Ionicons name={downloadedTracks.some(t => t.id === currentTrack.id) ? "cloud-done" : "cloud-download-outline"} size={20} color={downloadedTracks.some(t => t.id === currentTrack.id) ? colors.accentSolid : "rgba(255,255,255,0.7)"} />
            <Text style={[styles.queueButtonText, downloadedTracks.some(t => t.id === currentTrack.id) && { color: colors.accentSolid }]}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSleepTimerModalVisible(true)} style={styles.queueButton}>
            <Ionicons name="moon-outline" size={20} color={sleepTimer ? colors.accentSolid : "rgba(255,255,255,0.7)"} />
            {sleepTimer && <Text style={[styles.queueButtonText, { color: colors.accentSolid }]}>{sleepTimer}m</Text>}
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => {
              const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
              setPlaybackSpeed(nextSpeed);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }} 
            style={styles.queueButton}
          >
            <Text style={{ color: playbackSpeed !== 1 ? colors.accentSolid : "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: '700' }}>{playbackSpeed}x</Text>
            <Text style={[styles.queueButtonText, playbackSpeed !== 1 && { color: colors.accentSolid }]}>Speed</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setQueueVisible(true)} style={styles.queueButton}>
            <Feather name="list" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.queueButtonText}>Up Next</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}

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
                  {isCurrent ? (
                    <Ionicons name="volume-medium" size={20} color="#B06AB3" />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => moveQueueItem(idx, idx - 1)} disabled={idx === 0}>
                        <Feather name="chevron-up" size={20} color={idx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)"} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => moveQueueItem(idx, idx + 1)} disabled={idx === queue.length - 1}>
                        <Feather name="chevron-down" size={20} color={idx === queue.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)"} />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Select Playlist Modal */}
      <Modal
        visible={isPlaylistModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPlaylistModalVisible(false)}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[styles.queueContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.queueHeader}>
            <TouchableOpacity onPress={() => setPlaylistModalVisible(false)} style={styles.closeButton}>
              <Feather name="chevron-down" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.queueTitle}>Add to Playlist</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.queueList}>
            {playlists.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>No playlists found.</Text>
              </View>
            ) : (
              playlists.map((playlist) => (
                <TouchableOpacity 
                  key={playlist.id} 
                  style={styles.queueItem}
                  onPress={() => handleAddToPlaylist(playlist.id)}
                  activeOpacity={0.7}
                  disabled={addingToPlaylist === playlist.id}
                >
                  <View style={styles.queueItemInfo}>
                    <Text style={styles.queueItemTitle} numberOfLines={1}>
                      {playlist.title}
                    </Text>
                  </View>
                  {addingToPlaylist === playlist.id && (
                    <ActivityIndicator size="small" color={colors.accentSolid} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Sleep Timer Modal */}
      <Modal
        visible={isSleepTimerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSleepTimerModalVisible(false)}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[styles.queueContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.queueHeader}>
            <TouchableOpacity onPress={() => setSleepTimerModalVisible(false)} style={styles.closeButton}>
              <Feather name="chevron-down" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.queueTitle}>Sleep Timer</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.queueList}>
            {[5, 10, 15, 30, 45, 60].map((minutes) => (
              <TouchableOpacity 
                key={minutes} 
                style={[styles.queueItem, sleepTimer === minutes && styles.queueItemActive]}
                onPress={() => {
                  setSleepTimer(minutes);
                  setSleepTimerModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.queueItemInfo}>
                  <Text style={[styles.queueItemTitle, sleepTimer === minutes && { color: colors.accentSolid }]}>
                    {minutes} minutes
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.queueItem}
              onPress={() => {
                setSleepTimer(null);
                setSleepTimerModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.queueItemInfo}>
                <Text style={styles.queueItemTitle}>Off</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Lyrics Modal */}
      <Modal
        visible={isLyricsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLyricsModalVisible(false)}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[styles.queueContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.queueHeader}>
            <TouchableOpacity onPress={() => setLyricsModalVisible(false)} style={styles.closeButton}>
              <Feather name="chevron-down" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.queueTitle}>Lyrics</Text>
            
            <TouchableOpacity onPress={handleToggleTranslation} disabled={!lyricsText || isLoadingLyrics || isTranslating} style={[styles.closeButton, { opacity: lyricsText && !lyricsText.includes("Lyrics not found") ? 1 : 0.5 }]}>
              {isTranslating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ color: isTranslated ? colors.accentSolid : "#FFF", fontSize: 18, fontWeight: '700' }}>
                  A/अ
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl }}>
            {isLoadingLyrics ? (
              <ActivityIndicator size="large" color={colors.accentSolid} style={{ marginTop: 40 }} />
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 22, lineHeight: 36, fontWeight: '600', textAlign: 'center' }}>
                {isTranslated ? translatedLyrics : lyricsText || "Loading..."}
              </Text>
            )}
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
  actionButton: {
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
    justifyContent: "space-between",
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
