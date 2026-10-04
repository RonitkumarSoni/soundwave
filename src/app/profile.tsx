import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';
import { api } from '@/lib/api';

export default function PublicProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const followedArtists = usePlayerStore((s) => s.followedArtists);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await api.playlists.getAll();
      setPlaylists(data || []);
    } catch (e) {
      console.error('Failed to load profile data', e);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Followers', value: '1,234' },
    { label: 'Following', value: followedArtists.length.toString() },
    { label: 'Playlists', value: playlists.length.toString() },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerActions, { top: insets.top + spacing.md }]}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={[styles.profileHeader, { marginTop: insets.top + 60 }]}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>{user?.display_name || 'User Name'}</Text>
          <Text style={styles.userHandle}>@{user?.email?.split('@')[0] || 'username'}</Text>

          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statBox}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accentSolid} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Your Stats (This Month)</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsGridItem}>
                <Ionicons name="time-outline" size={24} color={colors.accentSolid} />
                <Text style={styles.statsGridValue}>42h 15m</Text>
                <Text style={styles.statsGridLabel}>Listened</Text>
              </View>
              <View style={styles.statsGridItem}>
                <Ionicons name="musical-notes-outline" size={24} color={colors.accentSolid} />
                <Text style={styles.statsGridValue}>1,204</Text>
                <Text style={styles.statsGridLabel}>Tracks Played</Text>
              </View>
              <View style={styles.statsGridItem}>
                <Ionicons name="star-outline" size={24} color={colors.accentSolid} />
                <Text style={styles.statsGridValue}>Pop, Lo-Fi</Text>
                <Text style={styles.statsGridLabel}>Top Genres</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Public Playlists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {playlists.map((pl) => (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.playlistCard}
                  onPress={() => router.push(`/playlist/${pl.id}`)}
                >
                  <Image source={{ uri: pl.cover_url || 'https://via.placeholder.com/150' }} style={styles.playlistCover} />
                  <Text style={styles.playlistName} numberOfLines={1}>{pl.title}</Text>
                  <Text style={styles.playlistCount}>{pl.track_count || 0} tracks</Text>
                </TouchableOpacity>
              ))}
              {playlists.length === 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 20 }}>No public playlists.</Text>
              )}
            </ScrollView>

            {followedArtists.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Following Artists</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                  {followedArtists.map((artist) => (
                    <TouchableOpacity
                      key={artist.id}
                      style={styles.artistCard}
                      onPress={() => router.push({ pathname: '/artist/[id]', params: { id: artist.id, source: artist.source || 'spotify' } })}
                    >
                      <Image source={{ uri: artist.image || 'https://via.placeholder.com/150' }} style={styles.artistCover} />
                      <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0514' },
  headerActions: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatarContainer: {
    shadowColor: colors.accentSolid,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  content: {
    paddingVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statsGridItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsGridValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginTop: spacing.xs,
    marginBottom: 2,
    textAlign: 'center',
  },
  statsGridLabel: {
    fontSize: 11,
    color: colors.secondaryLabel,
    textAlign: 'center',
  },
  hScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  playlistCard: {
    width: 140,
  },
  playlistCover: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.md,
    marginBottom: 8,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  playlistCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  artistCard: {
    width: 110,
    alignItems: 'center',
  },
  artistCover: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
  },
});
