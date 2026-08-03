import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';
import { TrackRow } from '@/components/TrackRow';
import { PlaylistHeaderSkeleton, TrackRowSkeleton } from '@/components/Skeletons';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useBottomPadding } from '@/hooks/useBottomPadding';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomPadding = useBottomPadding();

  const savedAlbums = usePlayerStore((s) => s.savedAlbums);
  const toggleSaveAlbum = usePlayerStore((s) => s.toggleSaveAlbum);

  const isSaved = savedAlbums.some((a) => a.id === id);

  useEffect(() => {
    loadAlbumData();
  }, [id]);

  const loadAlbumData = async () => {
    setLoading(true);
    try {
      const albumData = await api.getAlbumById(id as string);
      setAlbum(albumData);
      
      const tracksData = await api.getAlbumTracks(id as string);
      setTracks(tracksData || []);
      
      // Fallback
      if (!albumData && !tracksData?.length) {
        const fallback = await api.getPopular(10, 0, 'releasedate');
        setTracks(fallback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1]]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.headerActions, { top: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.albumCoverContainer, { marginTop: insets.top + 60 }]}>
        <Image 
          source={{ uri: album?.image || 'https://via.placeholder.com/300' }} 
          style={styles.albumImage} 
        />
      </View>

      <View style={styles.albumInfo}>
        <Text style={styles.albumName}>{album?.name || 'Album Name'}</Text>
        <View style={styles.artistRow}>
          <Text style={styles.artistName}>
            {album?.artist_name || 'Artist Name'}
          </Text>
          <TouchableOpacity 
            style={[styles.followButton, isSaved && styles.followingButton]}
            onPress={() => album && toggleSaveAlbum(album)}
          >
            <Text style={[styles.followButtonText, isSaved && styles.followingButtonText]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ paddingTop: insets.top + spacing.xl }}>
          <PlaylistHeaderSkeleton />
          <View style={{ marginTop: spacing.xl }}>
            <TrackRowSkeleton />
            <TrackRowSkeleton />
            <TrackRowSkeleton />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <TrackRow track={item} index={index} contextQueue={tracks} />
        )}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0514',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingBottom: spacing.xl,
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumCoverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  albumImage: {
    width: 240,
    height: 240,
    borderRadius: borderRadius.lg,
  },
  albumInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  albumName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  followingButton: {
    backgroundColor: '#FFF',
  },
  followButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  followingButtonText: {
    color: '#000',
  },
});
