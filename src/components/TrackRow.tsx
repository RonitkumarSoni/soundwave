import { Image } from 'expo-image';
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Share, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { Track, usePlayerStore } from "@/stores/usePlayerStore";
import { Feather } from "@expo/vector-icons";
import { allTracks } from "@/data/mockData";
import { useAuthStore } from "@/stores/useAuthStore";

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

  const isCurrentTrack = currentTrack?.id === track.id;
  const isDownloaded = downloadedTracks.some(t => t.id === track.id);
  
  const [isMenuVisible, setMenuVisible] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleDownload = () => {
    if (isDownloaded) {
      toggleDownload(track);
    } else {
      if (!user?.is_premium) {
        Alert.alert(
          "Premium Feature",
          "Downloading tracks is a Premium feature. Upgrade now to listen offline!",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Get Premium", onPress: () => { setMenuVisible(false); router.push("/(premium)"); } }
          ]
        );
        return;
      }

      setIsDownloading(true);
      // Simulate download progress
      setTimeout(() => {
        toggleDownload(track);
        setIsDownloading(false);
      }, 1500);
    }
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      await Share.share({
        message: `Listen to ${track.name} by ${track.artist_name} on Soundwave!`,
        url: `soundwave://track/${track.id}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handlePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isCurrentTrack) {
      togglePlay();
      return;
    }
    
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

      {/* Context Menu Modal */}
      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
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
              const radioQueue = [...allTracks].sort(() => Math.random() - 0.5);
              setQueue([track, ...radioQueue.filter(t => t.id !== track.id)]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}>
              <Ionicons name="radio-outline" size={24} color="#FFF" />
              <Text style={styles.menuItemText}>Start Radio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push(`/artist/${track.artist_id}`); }}>
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
              Alert.alert('Song Credits', `Written by: ${track.artist_name}\nProduced by: Soundwave Studios`);
            }}>
              <Ionicons name="information-circle-outline" size={24} color="#FFF" />
              <Text style={styles.menuItemText}>Show Credits</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
