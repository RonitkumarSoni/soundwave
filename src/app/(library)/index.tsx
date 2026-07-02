import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, spacing } from "@/theme/colors";
import { AppHeader } from "@/components/AppHeader";
import { FilterChips } from "@/components/FilterChips";
import { TrackRow } from "@/components/TrackRow";
import { libraryTabs } from "@/data/mockData";
import { api } from "@/lib/api";
import { Track, usePlayerStore } from "@/stores/usePlayerStore";

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState("All");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const likedTracks = usePlayerStore((s) => s.likedTracks);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === "Liked Songs" || activeTab === "All") {
        setTracks(likedTracks);
      } else {
        setTracks([]);
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab, likedTracks]);

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AppHeader mode="plain" title="Your library" />

        {/* Segmented Tabs */}
        <FilterChips
          chips={libraryTabs}
          activeChip={activeTab}
          onSelect={setActiveTab}
        />

        {/* Track List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.accentSolid} style={{ marginTop: 20 }} />
        ) : activeTab === "Playlists" || activeTab === "Downloads" ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Coming Soon</Text>
          </View>
        ) : tracks.length > 0 ? (
          tracks.map((track, index) => (
            <TrackRow key={track.id} track={track} index={index} showDuration contextQueue={tracks} />
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>No liked songs yet.</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
