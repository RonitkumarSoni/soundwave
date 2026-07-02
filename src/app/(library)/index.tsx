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
import { Track } from "@/stores/usePlayerStore";

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState("All");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      const data = await api.getLibrary();
      setTracks(data);
      setLoading(false);
    };
    loadData();
  }, []);

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
        ) : (
          tracks.map((track, index) => (
            <TrackRow key={track.id} track={track} index={index} showDuration contextQueue={tracks} />
          ))
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
