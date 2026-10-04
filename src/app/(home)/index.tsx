import { Image } from 'expo-image';
import React, { useState, useEffect } from "react";
import { FlatList, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, gradients, spacing } from "@/theme/colors";
import { AppHeader } from "@/components/AppHeader";
import { FilterChips } from "@/components/FilterChips";
import { ForYouCarousel } from "@/components/ForYouCarousel";
import { TrackRow } from "@/components/TrackRow";
import { CardSkeleton, AppHeaderSkeleton, FilterChipsSkeleton, ForYouSkeleton } from "@/components/Skeletons";
import { filterChips, dailyMixes, newReleases, allTracks, topPodcasts } from "@/data/mockData";
import { api } from "@/lib/api";

import { usePlayerStore } from "@/stores/usePlayerStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useBottomPadding } from "@/hooks/useBottomPadding";

function ArtistRow({ artist }: { artist: any }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.artistRow}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/artist/[id]', params: { id: artist.id, source: artist.source || 'spotify' } })}
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
  const [recommendedTracks, setRecommendedTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [country, setCountry] = useState<string>('India');
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();

  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);
  const downloadedTracks = usePlayerStore((s) => s.downloadedTracks);

  const offlineMode = useSettingsStore((s) => s.offlineMode);

  useEffect(() => {
    // Fetch region (using a CORS-friendly API for Web)
    fetch('https://ipwho.is/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country) {
          setCountry(data.country);
        }
      })
      .catch(e => console.log('Region fetch error', e));
  }, []);

  const getOrderParam = (filter: string) => {
    switch (filter) {
      case "Hot Tracks": return "popularity_total";
      case "Editor's Picks": return "releasedate";
      case "All":
      default: return "popularity_week";
    }
  };

  const deduplicateTracks = (tracks: any[]) => {
    const seen = new Set<string>();
    return tracks.filter((track) => {
      const title = (track.name || track.title || '').toLowerCase().split('(')[0].split('-')[0].trim();
      if (!title || seen.has(title)) return false;
      seen.add(title);
      return true;
    });
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const newOffset = offset + 10;

    try {
      if (activeFilter === "New Artists") {
        const artists = await api.getArtists(10, newOffset);
        if (artists.length === 0) setHasMore(false);
        else setListData(prev => [...prev, ...artists]);
      } else {
        const order = getOrderParam(activeFilter);
        const newTracks = await api.getPopular(10, newOffset, order, country);
        if (newTracks.length === 0) setHasMore(false);
        else setListData(prev => [...prev, ...deduplicateTracks(newTracks)]);
      }
      setOffset(newOffset);
    } catch (e) {
      console.error('Failed to load more data', e);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setOffset(0); setHasMore(true);
    if (offlineMode) { setLoading(false); return; }
    setLoading(true);
    const main = activeFilter === "New Artists" ? api.getArtists(10, 0) : api.getPopular(10, 0, activeFilter === "Hot Tracks" ? "popularity_total" : activeFilter === "Editor's Picks" ? "releasedate" : "popularity_week", country);
    const publish = (promise: Promise<any>, setter: (value: any) => void) => promise.then(value => { if (!cancelled) setter(value); });
    void publish(main, setListData).catch(() => {
      if (!cancelled) { setListData([]); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    void publish(api.getPreviews(), setPreviewTracks).catch(() => {});
    void publish(api.getYoutubeHits(), setYoutubeTracks).catch(() => {});
    void publish(api.getPopular(5, 0, "popularity_total", country), setRecommendedTracks).catch(() => {});
    return () => { cancelled = true; };
  }, [activeFilter, offlineMode, country]);

  const renderSkeletons = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </ScrollView>
  );

  const headerElement = React.useMemo(() => (
    <View>
      {loading ? (
        <>
          <View style={{ paddingTop: insets.top }}>
            <AppHeaderSkeleton />
          </View>
          <FilterChipsSkeleton />
          <View style={{ marginTop: spacing.md, gap: spacing.xxl }}>
            <View>
              <Text style={[styles.sectionTitle, { marginLeft: spacing.lg, marginBottom: spacing.md }]}>For you</Text>
              <ForYouSkeleton />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { marginLeft: spacing.lg, marginBottom: spacing.md }]}>Daily Mixes</Text>
              {renderSkeletons()}
            </View>
          </View>
        </>
      ) : offlineMode ? (
        <>
          <View style={{ paddingTop: insets.top }}>
            <AppHeader mode="greeting" />
          </View>
          <View style={[styles.sectionHeader, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
            <Ionicons name="cloud-offline" size={24} color={colors.accentSolid} />
            <Text style={[styles.sectionTitle, { marginLeft: spacing.sm }]}>Offline Mode</Text>
          </View>
          {downloadedTracks.length > 0 ? (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: spacing.lg }}>
                Showing your downloaded tracks. Network access is disabled.
              </Text>
              {downloadedTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueue={downloadedTracks}
                />
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="musical-notes-outline" size={64} color="rgba(255,255,255,0.2)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginTop: spacing.md }}>
                No downloaded tracks available.
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={{ paddingTop: insets.top }}>
            <AppHeader mode="greeting" />
          </View>

          <FilterChips
            chips={filterChips}
            activeChip={activeFilter}
            onSelect={setActiveFilter}
          />

          {activeFilter === "All" && (
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
                  <Text style={styles.sectionTitle}>
                    Daily Mixes
                  </Text>
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
                  data={recommendedTracks.length > 0 ? recommendedTracks : allTracks.slice(0, 6)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.recentCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        setTrack(item);
                        setQueue(recommendedTracks.length > 0 ? recommendedTracks : allTracks);
                      }}
                    >
                      <Image source={{ uri: item.coverUrl || item.image }} style={styles.recentImage} />
                      <Text style={styles.recentTitle} numberOfLines={1}>{item.title || item.name}</Text>
                      <Text style={styles.artistSub} numberOfLines={1}>{item.artist || item.artist_name}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item, idx) => 'rec_' + (item.id || idx)}
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
                    <Text style={styles.sectionTitle}>Song previews</Text>
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
            </>
          )}

          <View style={[styles.sectionHeader, activeFilter !== "All" && { marginTop: spacing.md }]}>
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
  ), [activeFilter, previewTracks, youtubeTracks, loading, insets.top, recentlyPlayed, downloadedTracks, offlineMode, recommendedTracks, router, setQueue, setTrack]);

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: any) => {
    const paddingToBottom = 300;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            loadMoreData();
          }
        }}
        scrollEventThrottle={400}
      >
        {headerElement}
        <View>
          {listData.map((item, index) => (
            activeFilter === "New Artists" ? (
              <ArtistRow key={`artist_${item.id || index}_${index}`} artist={item} />
            ) : (
              <TrackRow key={`track_${item.id || index}_${index}`} track={item} index={index} contextQueue={listData as any} />
            )
          ))}
        </View>
      </ScrollView>
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
