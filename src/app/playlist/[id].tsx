import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Switch, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';
import { TrackRow } from '@/components/TrackRow';
import { PlaylistHeaderSkeleton, TrackRowSkeleton } from '@/components/Skeletons';
import { Track, usePlayerStore } from '@/stores/usePlayerStore';
import * as Haptics from 'expo-haptics';
import { useBottomPadding } from '@/hooks/useBottomPadding';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const bottomPadding = useBottomPadding();
  const downloadTracks = usePlayerStore((s) => s.downloadTracks);
  const downloadedTracks = usePlayerStore((s) => s.downloadedTracks);
  
  const allDownloaded = playlist?.tracks?.length > 0 && 
    playlist.tracks.every((t: Track) => downloadedTracks.some(dt => dt.id === t.id));

  useEffect(() => {
    loadPlaylistData();
  }, [id]);

  const loadPlaylistData = async () => {
    setLoading(true);
    try {
      const data = await api.playlists.getById(id as string);
      setPlaylist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCover = () => {
    const mockImages = [
      'https://images.unsplash.com/photo-1493225457124-a1a2a5f08db3?w=300&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80'
    ];
    const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
    setPlaylist({ ...playlist, cover_url: randomImg });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1]]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.headerActions, { top: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={async () => {
          try {
            await Share.share({
              message: `Check out this playlist: ${playlist?.title || 'Awesome Music'} on Soundwave!`,
            });
          } catch (error: any) {
            console.error(error.message);
          }
        }}>
          <Feather name="share" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={handleChangeCover} 
        style={[styles.albumCoverContainer, { marginTop: insets.top + 60 }]}
      >
        <Image 
          source={{ uri: playlist?.cover_url || 'https://via.placeholder.com/300' }} 
          style={styles.albumImage} 
        />
        <View style={{ position: 'absolute', bottom: -10, right: -10, backgroundColor: colors.accentSolid, padding: 8, borderRadius: 20 }}>
          <Feather name="edit-2" size={16} color="#FFF" />
        </View>
      </TouchableOpacity>

      <View style={styles.albumInfo}>
        <Text style={styles.albumName}>{playlist?.title || 'Playlist'}</Text>
        <Text style={styles.artistName}>
          {playlist?.tracks?.length || 0} tracks
        </Text>
      </View>

      <View style={styles.collabContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Text style={styles.collabText}>Collaborative</Text>
          <Switch 
            value={isCollaborative} 
            onValueChange={setIsCollaborative}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
          />
        </View>
        
        <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          activeOpacity={0.7}
          onPress={() => {
            if (playlist?.tracks) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              downloadTracks(playlist.tracks);
            }
          }}
        >
          <Feather name="download-cloud" size={18} color={allDownloaded ? colors.accentSolid : "#FFF"} />
          <Text style={[styles.collabText, allDownloaded && { color: colors.accentSolid }]}>
            {allDownloaded ? "Downloaded" : "Download"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
          style={StyleSheet.absoluteFillObject}
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
        style={StyleSheet.absoluteFillObject}
      />

      <FlatList
        data={playlist?.tracks || []}
        keyExtractor={(item: Track, index) => `${item.id}-${index}`}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <TrackRow track={item} index={index} contextQueue={playlist?.tracks || []} />
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
  artistName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },
  collabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  collabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  }
});
