import { Image } from 'expo-image';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

import { colors, gradients, spacing, borderRadius } from '@/theme/colors';
import { TrackRow } from '@/components/TrackRow';
import { usePlayerStore } from '@/stores/usePlayerStore';

export default function CustomPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const customPlaylists = usePlayerStore(s => s.customPlaylists);
  const deletePlaylist = usePlayerStore(s => s.deletePlaylist);
  const removeTrackFromPlaylist = usePlayerStore(s => s.removeTrackFromPlaylist);
  const setQueue = usePlayerStore(s => s.setQueue);
  const setTrack = usePlayerStore(s => s.setTrack);

  const playlist = customPlaylists.find(p => p.id === id);

  if (!playlist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Playlist not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      setTrack(playlist.tracks[0]);
      setQueue(playlist.tracks);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deletePlaylist(playlist.id);
            router.back();
          }
        }
      ]
    );
  };

  // Generate a composite image from the first 4 tracks
  const images = playlist.tracks.slice(0, 4).map(t => t.image).filter(Boolean);
  const coverSize = 240;

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeletePlaylist} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <View style={[styles.coverContainer, { width: coverSize, height: coverSize }]}>
            {images.length > 0 ? (
              images.length >= 4 ? (
                <View style={styles.gridCover}>
                  {images.map((img, i) => (
                    <Image key={i} source={{ uri: img }} style={styles.gridImage} />
                  ))}
                </View>
              ) : (
                <Image source={{ uri: images[0] }} style={styles.fullImage} />
              )
            ) : (
              <View style={[styles.fullImage, styles.placeholderCover]}>
                <Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.2)" />
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>{playlist.name}</Text>
          <Text style={styles.subtitle}>{playlist.tracks.length} tracks • Custom Playlist</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handlePlayAll} style={styles.playButton}>
              <LinearGradient
                colors={[gradients.primary[0], gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playButtonBg}
              >
                <Ionicons name="play" size={24} color="#FFF" style={{ marginLeft: 4 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.trackList}>
          {playlist.tracks.map((track, index) => (
            <View key={track.id + index} style={styles.trackRowContainer}>
              <View style={{ flex: 1 }}>
                <TrackRow track={track} index={index} contextQueue={playlist.tracks} />
              </View>
              <TouchableOpacity 
                style={styles.removeTrackBtn}
                onPress={() => {
                  Alert.alert("Remove Track", `Remove "${track.name}" from playlist?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => removeTrackFromPlaylist(playlist.id, track.id) }
                  ]);
                }}
              >
                <Feather name="minus-circle" size={20} color={colors.secondaryLabel} />
              </TouchableOpacity>
            </View>
          ))}
          {playlist.tracks.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>This playlist is empty.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  coverContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCover: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridImage: {
    width: '50%',
    height: '50%',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  playButton: {
    shadowColor: gradients.primary[0],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 32,
    backgroundColor: '#000',
  },
  playButtonBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackList: {
    paddingHorizontal: spacing.md,
  },
  trackRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeTrackBtn: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: spacing.md,
  }
});
