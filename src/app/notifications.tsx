import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'New release from The Weeknd', message: 'Check out his new single "Take My Breath".', type: 'music', time: '2 hours ago', unread: true },
  { id: '2', title: 'Your playlist hit 100 saves!', message: 'People are loving your "Late Night Vibes" playlist.', type: 'social', time: '1 day ago', unread: true },
  { id: '3', title: 'Upcoming concert near you', point: 'Imagine Dragons are playing in your city next month.', type: 'event', time: '3 days ago', unread: false },
  { id: '4', title: 'Weekly Mix is ready', message: 'Discover new tracks we curated just for you.', type: 'music', time: '4 days ago', unread: false },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const getIcon = (type: string) => {
    switch (type) {
      case 'music': return <Ionicons name="musical-notes" size={20} color={colors.accentSolid} />;
      case 'social': return <Ionicons name="people" size={20} color="#4B2079" />;
      case 'event': return <Ionicons name="calendar" size={20} color="#E23FD6" />;
      default: return <Ionicons name="notifications" size={20} color="#FFF" />;
    }
  };

  const renderItem = ({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) => (
    <TouchableOpacity style={[styles.notificationCard, item.unread && styles.unreadCard]} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        {getIcon(item.type)}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message || (item as any).point}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
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
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  unreadCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: colors.tertiaryLabel,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentSolid,
    marginLeft: spacing.sm,
  }
});
