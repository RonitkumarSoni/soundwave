import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, gradients, spacing } from "@/theme/colors";
import { AppHeader } from "@/components/AppHeader";
import { FilterChips } from "@/components/FilterChips";
import { ForYouCarousel } from "@/components/ForYouCarousel";
import { TrackRow } from "@/components/TrackRow";
import { filterChips } from "@/data/mockData";
import { api } from "@/lib/api";

function ArtistRow({ artist }: { artist: any }) {
  return (
    <TouchableOpacity style={styles.artistRow} activeOpacity={0.7}>
      <Image source={{ uri: artist.image }} style={styles.artistAvatar} />
      <View style={styles.artistInfo}>
        <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
        <Text style={styles.artistSub}>Artist</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.secondaryLabel} style={{ marginRight: spacing.sm }} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const insets = useSafeAreaInsets();

  // Map filters to Jamendo order parameters
  const getOrderParam = (filter: string) => {
    switch (filter) {
      case "Hot Tracks":
        return "popularity_total";
      case "Editor's Picks":
        return "buzz";
      case "All":
      default:
        return "popularity_week";
    }
  };

  const loadInitialData = async (filter: string) => {
    setLoading(true);
    setOffset(0);
    setHasMore(true);

    if (filter === "New Artists") {
      const artists = await api.getArtists(10, 0);
      setListData(artists);
    } else {
      const order = getOrderParam(filter);
      const tracks = await api.getPopular(10, 0, order);
      setListData(tracks);
    }
    setLoading(false);
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const nextOffset = offset + 10;

    let items: any[] = [];
    if (activeFilter === "New Artists") {
      items = await api.getArtists(10, nextOffset);
    } else {
      const order = getOrderParam(activeFilter);
      items = await api.getPopular(10, nextOffset, order);
    }
    
    if (items.length < 10) {
      setHasMore(false);
    }
    
    setListData((prev) => [...prev, ...items]);
    setOffset(nextOffset);
    setLoadingMore(false);
  };

  useEffect(() => {
    loadInitialData(activeFilter);
  }, [activeFilter]);

  const renderHeader = () => (
    <View>
      {/* Header */}
      <AppHeader mode="greeting" />

      {/* Filter Chips */}
      <FilterChips
        chips={filterChips}
        activeChip={activeFilter}
        onSelect={setActiveFilter}
      />

      {/* For You Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>For you</Text>
      </View>
      <ForYouCarousel />

      {/* Popular Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeFilter === "New Artists" ? "Popular Artists" : "Popular Tracks"}
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(search)")}>
          <Text style={styles.showAll}>Show all →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <ActivityIndicator 
        size="small" 
        color={colors.accentSolid} 
        style={{ marginVertical: 20 }} 
      />
    );
  };

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accentSolid} />
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={({ item, index }) => (
            activeFilter === "New Artists" ? (
              <ArtistRow artist={item} />
            ) : (
              <TrackRow track={item} index={index} contextQueue={listData as any} />
            )
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{
            paddingTop: insets.top,
            paddingBottom: 160, // space for MiniPlayer + BottomNav
          }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.4}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.label,
  },
  showAll: {
    fontSize: 13,
    color: colors.secondaryLabel,
    fontWeight: "500",
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  artistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.label,
  },
  artistSub: {
    fontSize: 12,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
});
