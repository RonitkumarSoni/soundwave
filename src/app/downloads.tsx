import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { gradients, spacing } from '@/theme/colors';
import { TrackRow } from '@/components/TrackRow';
import { cancelDownloads } from '@/services/downloadService';

export default function DownloadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const downloadedTracks = usePlayerStore((s) => s.downloadedTracks);
  const pending = usePlayerStore(state => state.downloadProgress);

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
          {downloadedTracks.length} tracks • {(downloadedTracks.reduce((bytes, track) => bytes + (track.fileSize || 0), 0) / (1024 * 1024)).toFixed(1)} MB
        </Text>
      </View>

      {Object.keys(pending).length > 0 && <TouchableOpacity accessibilityRole="button" onPress={cancelDownloads} style={{ padding: 16, minHeight: 48 }}><Text style={{ color: "#FFF" }}>{Object.keys(pending).length} active download(s) · Cancel</Text></TouchableOpacity>}
      <FlatList data={downloadedTracks} keyExtractor={track => (track.source || "jamendo") + ":" + track.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <TrackRow track={item} index={index} contextQueue={downloadedTracks} />}
        ListEmptyComponent={<View style={styles.emptyState}><Feather name="download-cloud" size={48} color="rgba(255,255,255,0.3)" /><Text style={styles.emptyText}>No downloaded tracks yet.</Text></View>}
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
