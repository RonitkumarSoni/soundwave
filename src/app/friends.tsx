import { Image } from 'expo-image';
import React from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';

const MOCK_FRIENDS = [
  { id: 'usr_01', name: 'Alice Smith', avatar: 'https://i.pravatar.cc/150?img=1', track: 'Blinding Lights', artist: 'The Weeknd', time: '2m ago' },
  { id: 'usr_02', name: 'Bob Johnson', avatar: 'https://i.pravatar.cc/150?img=2', track: 'Levitating', artist: 'Dua Lipa', time: '15m ago' },
  { id: 'usr_03', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?img=3', track: 'Sunflower', artist: 'Post Malone', time: '1h ago' },
  { id: 'usr_04', name: 'Diana Prince', avatar: 'https://i.pravatar.cc/150?img=4', track: 'Positions', artist: 'Ariana Grande', time: '5h ago' },
  { id: 'usr_05', name: 'Evan Wright', avatar: 'https://i.pravatar.cc/150?img=5', track: 'Ghost', artist: 'Justin Bieber', time: '1d ago' },
];

export default function FriendsActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: typeof MOCK_FRIENDS[0] }) => (
    <TouchableOpacity 
      style={styles.friendCard} 
      activeOpacity={0.7}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.listeningContainer}>
          <Ionicons name="musical-note" size={12} color={colors.secondaryLabel} style={{ marginRight: 4 }} />
          <Text style={styles.trackInfo} numberOfLines={1}>{item.track} • {item.artist}</Text>
        </View>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friend Activity</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="person-add-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_FRIENDS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0514' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  contentContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackInfo: {
    fontSize: 13,
    color: colors.secondaryLabel,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: colors.tertiaryLabel,
  },
});
