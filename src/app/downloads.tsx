import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { colors, gradients, spacing } from '@/theme/colors';
import { TrackRow } from '@/components/TrackRow';

export default function DownloadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const downloadedTracks = usePlayerStore((s) => s.downloadedTracks);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Downloads</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {downloadedTracks.length} tracks • {downloadedTracks.length * 5} MB
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {downloadedTracks.length > 0 ? (
          downloadedTracks.map((track, index) => (
            <TrackRow key={`${track.id}-${index}`} track={track} index={index} contextQueue={downloadedTracks} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="download-cloud" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No downloaded tracks yet.</Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  statsBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.sm,
  },
  statsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  content: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: spacing.md,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
});
