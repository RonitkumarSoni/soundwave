import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';

const MOCK_PROFILES: Record<string, any> = {
  'usr_01': { name: 'Alice Smith', avatar: 'https://i.pravatar.cc/150?img=1', followers: 128, following: 45 },
  'usr_02': { name: 'Bob Johnson', avatar: 'https://i.pravatar.cc/150?img=2', followers: 56, following: 12 },
  'usr_03': { name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?img=3', followers: 342, following: 89 },
  'usr_04': { name: 'Diana Prince', avatar: 'https://i.pravatar.cc/150?img=4', followers: 1024, following: 300 },
  'usr_05': { name: 'Evan Wright', avatar: 'https://i.pravatar.cc/150?img=5', followers: 8, following: 2 },
};

const MOCK_PUBLIC_PLAYLISTS = [
  { id: 'pl_01', title: 'Late Night Vibes', tracks: 24, coverUrl: 'https://picsum.photos/seed/latenight/200/200' },
  { id: 'pl_02', title: 'Workout Mix', tracks: 45, coverUrl: 'https://picsum.photos/seed/workout/200/200' },
  { id: 'pl_03', title: 'Chill Lo-Fi', tracks: 112, coverUrl: 'https://picsum.photos/seed/chill/200/200' },
];

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setProfile(MOCK_PROFILES[id as string] || { name: 'Unknown User', avatar: 'https://via.placeholder.com/150', followers: 0, following: 0 });
      setLoading(false);
    }, 500);
  }, [id]);

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
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-horizontal" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.profileInfoContainer, { marginTop: insets.top + 60 }]}>
        <Image source={{ uri: profile?.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{profile?.name}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}><Text style={styles.statsNumber}>{profile?.followers}</Text> Followers</Text>
          <Text style={styles.statsText}> • </Text>
          <Text style={styles.statsText}><Text style={styles.statsNumber}>{profile?.following}</Text> Following</Text>
        </View>

        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => setIsFollowing(!isFollowing)}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Public Playlists</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={[gradients.background[0], gradients.background[1]]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={colors.accentSolid} />
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
        data={MOCK_PUBLIC_PLAYLISTS}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.playlistRow} activeOpacity={0.7}>
            <Image source={{ uri: item.coverUrl }} style={styles.playlistCover} />
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistTitle}>{item.title}</Text>
              <Text style={styles.playlistTracks}>{item.tracks} tracks</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.secondaryLabel} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
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
    paddingBottom: spacing.md,
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
  profileInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statsText: {
    fontSize: 14,
    color: colors.secondaryLabel,
  },
  statsNumber: {
    fontWeight: '700',
    color: '#FFF',
  },
  followButton: {
    backgroundColor: colors.accentSolid,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFF',
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  playlistCover: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  playlistTracks: {
    fontSize: 13,
    color: colors.secondaryLabel,
  }
});
