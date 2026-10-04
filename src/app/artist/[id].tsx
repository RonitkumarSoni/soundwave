import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { LoadError } from '@/components/LoadError';
import { gradients, spacing } from '@/theme/colors';
import { TrackRow } from '@/components/TrackRow';
import { PlaylistHeaderSkeleton, TrackRowSkeleton } from '@/components/Skeletons';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useBottomPadding } from '@/hooks/useBottomPadding';

export default function ArtistDetailScreen() {
  const { id, source = "jiosaavn" } = useLocalSearchParams<{ id: string; source?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const bottomPadding = useBottomPadding();

  const followedArtists = usePlayerStore((s) => s.followedArtists);
  const toggleFollowArtist = usePlayerStore((s) => s.toggleFollowArtist);

  const isFollowed = followedArtists.some((a) => a.id === id && (a.source || "jiosaavn") === source);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError(false);
    setArtist(null); setTracks([]);
    void Promise.all([api.getArtistById(id, source), api.getArtistTracks(id, source)]).then(([details, items]) => {
      if (cancelled) return;
      if (!details) throw new Error("Details unavailable");
      setArtist(details); setTracks(items || []);
    }).catch(() => { if (!cancelled) setLoadError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, source, attempt]);

  if (loadError) return <LoadError title="Artist could not load" onRetry={() => setAttempt(value => value + 1)} />;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Image
        source={{ uri: artist?.image || 'https://via.placeholder.com/300' }}
        style={styles.artistImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(10, 5, 20, 0.8)', '#0A0514']}
        style={styles.imageGradient}
      />

      <View style={[styles.headerActions, { top: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.artistInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.artistName}>{artist?.name || 'Artist Name'}</Text>
          <TouchableOpacity
            style={[styles.followButton, isFollowed && styles.followingButton]}
            onPress={() => artist && toggleFollowArtist(artist)}
          >
            <Text style={[styles.followButtonText, isFollowed && styles.followingButtonText]}>
              {isFollowed ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.followerCount}>
          {(artist?.followers || 0).toLocaleString()} followers
        </Text>
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
    height: 350,
    width: '100%',
    position: 'relative',
    marginBottom: spacing.md,
  },
  artistImage: {
    width: '100%',
    height: '100%',

  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
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
  artistInfo: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    flex: 1,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF',
    marginLeft: spacing.md,
  },
  followingButton: {
    backgroundColor: '#FFF',
  },
  followButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#000',
  },
  followerCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});
