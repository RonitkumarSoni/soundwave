import { trackShareUrl } from '@/lib/share';
import { Image } from 'expo-image';
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Share, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Toast from 'react-native-toast-message';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { Track, usePlayerStore } from "@/stores/usePlayerStore";

import { api } from "@/lib/api";
import { sameTrack } from "@/lib/tracks";
import { useAuthStore } from "@/stores/useAuthStore";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { CustomDialog } from "./CustomDialog";

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
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleDownload = usePlayerStore((s) => s.toggleDownload);
  const downloadedTracks = usePlayerStore((s) => s.downloadedTracks);

  const isCurrentTrack = sameTrack(currentTrack, track);
  const isDownloaded = downloadedTracks.some(t => sameTrack(t, track));

  const [isMenuVisible, setMenuVisible] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isPlaylistModalVisible, setPlaylistModalVisible] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState<{ visible: boolean; title: string; message: string; confirmText?: string; isDestructive?: boolean; onConfirm: () => void } | null>(null);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleDownload = async () => {
    if (!isDownloaded && !user?.is_premium) {
      setDialogConfig({ visible: true, title: 'Premium feature', message: 'An active subscription is required. Purchases are currently unavailable.', confirmText: 'OK', onConfirm: () => setMenuVisible(false) });
      return;
    }
    setIsDownloading(true);
    try { await toggleDownload(track); } finally { setIsDownloading(false); }
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      const shareUrl = trackShareUrl(track);

      await Share.share({
        message: `Listen to ${track.name} by ${track.artist_name} on Soundwave! ${shareUrl}`,
        url: Platform.OS === 'web' ? undefined : shareUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRowPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isCurrentTrack) {
      return;
    }
    playTrack();
  };

  const handlePlayButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isCurrentTrack) {
      togglePlay();
      return;
    }
    playTrack();
  };

  const playTrack = async () => {
    setTrack(track);
    if (contextQueue && contextQueue.length > 0) {
      setQueue(contextQueue);
    } else {
      // Auto-populate queue with popular tracks so Up Next has content
      try {
        const popular = await api.getPopular(20, 0);
        if (popular.length > 0) {
          // Put current track first, then fill with popular tracks (excluding duplicates)
          const others = popular.filter((t: Track) => !sameTrack(t, track));
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
    <>
      <Animated.View style={{ width: '100%' }} entering={FadeInDown.delay((index % 12) * 50).duration(300)}>
      <TouchableOpacity
        style={styles.container}
        onPress={handleRowPress}
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

        {/* Download Button */}
        <TouchableOpacity onPress={handleDownload} activeOpacity={0.7} style={styles.downloadButton}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.accentSolid} />
          ) : (
            <Ionicons
              name={isDownloaded ? "cloud-done" : "cloud-download-outline"}
              size={18}
              color={isDownloaded ? colors.accentSolid : colors.tertiaryLabel}
            />
          )}
        </TouchableOpacity>

        {/* Context Menu Button */}
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMenuVisible(true); }} activeOpacity={0.7} style={styles.downloadButton}>
          <Feather name="more-horizontal" size={18} color={colors.tertiaryLabel} />
        </TouchableOpacity>

        {/* Play Button */}
        <TouchableOpacity onPress={handlePlayButtonPress} activeOpacity={0.7}>
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

      {/* Context Menu Modal */}
      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Image source={{ uri: track.image }} style={styles.menuCover} />
            <View style={styles.menuHeaderInfo}>
              <Text style={styles.menuTitle} numberOfLines={1}>{track.name}</Text>
              <Text style={styles.menuArtist} numberOfLines={1}>{track.artist_name}</Text>
            </View>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              setTrack(track);
              void api.search(track.artist_name).then(data => setQueue([track, ...data.tracks.filter(t => !sameTrack(t, track))]));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}>
              <Ionicons name="radio-outline" size={24} color="#FFF" />
              <Text style={styles.menuItemText}>Start Radio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              setPlaylistModalVisible(true);
            }}>
              <Feather name="plus-square" size={24} color="#FFF" />
              <Text style={styles.menuItemText}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              if (track.artist_id) {
                router.push(`/artist/${track.artist_id}?source=${track.source || "jiosaavn"}`);
              } else {
                Toast.show({ type: 'error', text1: 'Artist Not Found', text2: 'Detailed artist information is not available.' });
              }
            }}>
              <Ionicons name="person-outline" size={24} color="#FFF" />
              <Text style={styles.menuItemText}>View Artist</Text>
            </TouchableOpacity>

            {/* Download */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleDownload();
                if (isDownloaded) setMenuVisible(false);
              }}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={colors.accentSolid} style={{ marginRight: 24 }} />
              ) : (
                <Ionicons name={isDownloaded ? "cloud-done" : "cloud-download-outline"} size={24} color={isDownloaded ? colors.accentSolid : "#FFF"} />
              )}
              <Text style={styles.menuItemText}>{isDownloading ? "Downloading..." : isDownloaded ? "Remove from Downloads" : "Download"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#FFF" />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
                Toast.show({ type: 'info', text1: 'Song Credits', text2: `Written by: ${track.artist_name} | Produced by: Soundwave` });
            }}>
              <Ionicons name="information-circle-outline" size={24} color="#FFF" />
              <Text style={styles.menuItemText}>Show Credits</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </Animated.View>

      <AddToPlaylistModal
        visible={isPlaylistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        track={track}
      />

      {/* Custom Dialog Modal */}
      {dialogConfig && (
        <CustomDialog
          visible={dialogConfig.visible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          isDestructive={dialogConfig.isDestructive}
          onCancel={() => setDialogConfig(null)}
          onConfirm={() => {
            setDialogConfig(null);
            dialogConfig.onConfirm();
          }}
        />
      )}
    </>
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
    fontVariant: ["tabular-nums"],
  },
  downloadButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  menuCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  menuHeaderInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  menuArtist: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  menuList: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: spacing.lg,
  },
});
