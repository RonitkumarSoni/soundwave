import { Image } from 'expo-image';
import React, { useState, useEffect } from "react";
import { FlatList, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { IOSLoader } from "@/components/IOSLoader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, gradients, spacing } from "@/theme/colors";
import { AppHeader } from "@/components/AppHeader";
import { FilterChips } from "@/components/FilterChips";
import { ForYouCarousel } from "@/components/ForYouCarousel";
import { TrackRow } from "@/components/TrackRow";
import { CardSkeleton } from "@/components/Skeletons";
import { filterChips, dailyMixes, newReleases, allTracks, topPodcasts } from "@/data/mockData";
import { api } from "@/lib/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useBottomPadding } from "@/hooks/useBottomPadding";

function ArtistRow({ artist }: { artist: any }) {
  const router = useRouter();
  return (
    <TouchableOpacity 
      style={styles.artistRow} 
      activeOpacity={0.7}
      onPress={() => router.push(`/artist/${artist.id}`)}
    >
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
  const [previewTracks, setPreviewTracks] = useState<any[]>([]);
  const [youtubeTracks, setYoutubeTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);
  const initRecentlyPlayed = usePlayerStore((s) => s.initRecentlyPlayed);

  useEffect(() => {
    initRecentlyPlayed();
  }, []);

  const getOrderParam = (filter: string) => {
    switch (filter) {
      case "Hot Tracks": return "popularity_total";
      case "Editor's Picks": return "releasedate";
      case "All":
      default: return "popularity_week";
    }
  };

  const loadInitialData = async (filter: string) => {
    setLoading(true);
    setOffset(0);
    setHasMore(true);

    try {
      if (filter === "New Artists") {
        const artists = await api.getArtists(10, 0);
        setListData(artists);
      } else {
        const order = getOrderParam(filter);
        const tracks = await api.getPopular(10, 0, order);
        setListData(tracks);
      }
      
      // Load 30-sec previews
      if (previewTracks.length === 0) {
        const previews = await api.getPreviews();
        setPreviewTracks(previews);
      }
      
      // Load YouTube Hits
      if (youtubeTracks.length === 0) {
        const ytHits = await api.getYoutubeHits();
        setYoutubeTracks(ytHits);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const nextOffset = offset + 10;

    try {
      let items: any[] = [];
      if (activeFilter === "New Artists") {
        items = await api.getArtists(10, nextOffset);
      } else {
        const order = getOrderParam(activeFilter);
        items = await api.getPopular(10, nextOffset, order);
      }
      
      if (!items || items.length < 10) setHasMore(false);
      
      if (items && items.length > 0) {
        setListData((prev) => [...prev, ...items]);
        setOffset(nextOffset);
      }
    } catch (e) {
      console.error('Failed to load more data', e);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadInitialData(activeFilter);
  }, [activeFilter]);

  const renderSkeletons = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </ScrollView>
  );

  const renderHeader = () => (
    <View>
      <View style={{ paddingTop: insets.top }}>
        <AppHeader mode="greeting" />
      </View>

      <FilterChips
        chips={filterChips}
        activeChip={activeFilter}
        onSelect={setActiveFilter}
      />

      {loading ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.xxl }}>
          <View>
            <Text style={[styles.sectionTitle, { marginLeft: spacing.lg, marginBottom: spacing.md }]}>For you</Text>
            {renderSkeletons()}
          </View>
          <View>
            <Text style={[styles.sectionTitle, { marginLeft: spacing.lg, marginBottom: spacing.md }]}>Daily Mixes</Text>
            {renderSkeletons()}
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.sectionHeader, { marginTop: spacing.sm }]}>
            <Text style={styles.sectionTitle}>For you</Text>
          </View>
          <ForYouCarousel />

          <View style={styles.timeContextContainer}>
            {[
              { id: 1, title: 'Morning Commute', image: 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=300&q=80' },
              { id: 2, title: 'Wake Up Pop', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80' },
              { id: 3, title: 'Coffee & Chill', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=300&q=80' },
              { id: 4, title: 'Focus Flow', image: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=300&q=80' },
              { id: 5, title: 'Daily Lift', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80' },
              { id: 6, title: 'Discover Weekly', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80' },
            ].map((item) => (
              <TouchableOpacity key={item.id} style={styles.timeContextCard} activeOpacity={0.7}>
                <Image source={{ uri: item.image }} style={styles.timeContextImage} />
                <Text style={styles.timeContextTitle} numberOfLines={2}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginBottom: spacing.md, marginTop: spacing.sm }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Mixes</Text>
            </View>
            <FlatList
              data={dailyMixes}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recentCard} activeOpacity={0.7}>
                  <Image source={{ uri: item.coverUrl }} style={styles.recentImage} />
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artistSub} numberOfLines={1}>{item.description}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Releases</Text>
            </View>
            <FlatList
              data={newReleases}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recentCard} activeOpacity={0.7}>
                  <Image source={{ uri: item.coverUrl }} style={styles.recentImage} />
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artistSub} numberOfLines={1}>{item.description}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Podcasts</Text>
            </View>
            <FlatList
              data={topPodcasts}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recentCard} activeOpacity={0.7}>
                  <Image source={{ uri: item.coverUrl }} style={[styles.recentImage, { borderRadius: 12 }]} />
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artistSub} numberOfLines={1}>{item.host}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
            </View>
            <FlatList
              data={allTracks.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.recentCard} 
                  activeOpacity={0.7}
                  onPress={() => {
                    setTrack(item);
                    setQueue(allTracks);
                  }}
                >
                  <Image source={{ uri: item.coverUrl }} style={styles.recentImage} />
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.artistSub} numberOfLines={1}>{item.artist}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => 'rec_' + item.id}
            />
          </View>

          {recentlyPlayed && recentlyPlayed.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently Played</Text>
              </View>
              <FlatList
                data={recentlyPlayed}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.recentCard} 
                    activeOpacity={0.7}
                    onPress={() => {
                      setTrack(item);
                      setQueue(recentlyPlayed);
                    }}
                  >
                    <Image source={{ uri: item.image }} style={styles.recentImage} />
                    <Text style={styles.recentTitle} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={item => 'recent_' + item.id}
              />
            </View>
          )}

          {previewTracks.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>30-Sec Previews (via iTunes)</Text>
              </View>
              <FlatList
                data={previewTracks}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.recentCard} 
                    activeOpacity={0.7}
                    onPress={() => {
                      setTrack(item);
                      setQueue(previewTracks);
                    }}
                  >
                    <Image source={{ uri: item.image }} style={[styles.recentImage, { borderRadius: 100 }]} />
                    <Text style={styles.recentTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.artistSub} numberOfLines={1}>{item.artist_name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={item => 'preview_' + item.id}
              />
            </View>
          )}

          {youtubeTracks.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending on YouTube Music</Text>
              </View>
              <FlatList
                data={youtubeTracks}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.recentCard} 
                    activeOpacity={0.7}
                    onPress={() => {
                      setTrack(item);
                      setQueue(youtubeTracks);
                    }}
                  >
                    <Image source={{ uri: item.image }} style={styles.recentImage} />
                    <Text style={styles.recentTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.artistSub} numberOfLines={1}>{item.artist_name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={item => 'yt_' + item.id}
              />
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeFilter === "New Artists" ? "Popular Artists" : "Popular Tracks"}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(search)")}>
              <Text style={styles.showAll}>Show all →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      <FlatList
        data={listData}
        renderItem={({ item, index }) => (
          activeFilter === "New Artists" ? (
            <ArtistRow artist={item} />
          ) : (
            <TrackRow track={item} index={index} contextQueue={listData as any} />
          )
        )}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString()) + '_' + index}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.4}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  artistInfo: { flex: 1 },
  artistName: { fontSize: 16, fontWeight: "600", color: colors.label },
  artistSub: { fontSize: 12, color: colors.secondaryLabel, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.label },
  showAll: { fontSize: 13, color: colors.secondaryLabel, fontWeight: "500" },
  recentCard: { width: 110, marginRight: spacing.sm },
  recentImage: { width: 110, height: 110, borderRadius: 8, marginBottom: 8 },
  recentTitle: { color: colors.label, fontSize: 13, fontWeight: '500' },
  loadingContainer: { marginTop: 40, alignItems: 'center', justifyContent: 'center' },
  timeContextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  timeContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    width: '48%',
    overflow: 'hidden',
  },
  timeContextImage: {
    width: 56,
    height: 56,
  },
  timeContextTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
  },
});
