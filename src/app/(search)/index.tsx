import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Pressable, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { accountStorage as AsyncStorage } from '@/lib/accountStorage';
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { TrackRow } from "@/components/TrackRow";
import { TrackRowSkeleton, CardSkeleton } from "@/components/Skeletons";
import { FilterChips } from "@/components/FilterChips";
import { genres, trendingSearches } from "@/data/mockData";
import { api } from "@/lib/api";
import { Track, usePlayerStore } from "@/stores/usePlayerStore";

const AnimatedImage = Animated.createAnimatedComponent(Image);

function AnimatedGenreCard({ genre, onPress }: { genre: any; onPress: (name: string) => void }) {
  const hoverAnim = useRef(new Animated.Value(0)).current;

  const handleHoverIn = () => {
    Animated.spring(hoverAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handleHoverOut = () => {
    Animated.spring(hoverAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const imageStyle = {
    transform: [
      { rotate: "15deg" },
      {
        scale: hoverAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        }),
      },
      {
        translateX: hoverAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        translateY: hoverAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  };

  return (
    <Pressable
      style={styles.genreCard}
      onPress={() => onPress(genre.name)}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      {...({ onMouseEnter: handleHoverIn, onMouseLeave: handleHoverOut } as any)}
    >
      <LinearGradient
        colors={[genre.color, `${genre.color}88`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.genreGradient}
      >
        <Text style={styles.genreText}>{genre.name}</Text>
        <AnimatedImage
          source={{ uri: genre.imageUrl }}
          style={[styles.genreImage, imageStyle]}
        />
      </LinearGradient>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || "");
  const [results, setResults] = useState<{ tracks: Track[], artists: any[], albums: any[] }>({ tracks: [], artists: [], albums: [] });
  const [activeTab, setActiveTab] = useState("Top");
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [genreLoading, setGenreLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);



  useEffect(() => {
    if (params.q) {
      setQuery(params.q as string);
    }
  }, [params.q]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  };

  const saveRecentSearch = async (term: string) => {
    if (!term.trim()) return;
    try {
      const filtered = recentSearches.filter(s => s.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 10); // Keep max 10
      setRecentSearches(updated);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

  const removeRecentSearch = async (term: string) => {
    try {
      const updated = recentSearches.filter(s => s !== term);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove recent search', e);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recentSearches');
    } catch (e) {
      console.error('Failed to clear recent searches', e);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setSearchError(null);
    if (!query.trim()) { setResults({ tracks: [], artists: [], albums: [] }); setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.search(query, controller.signal);
        if (controller.signal.aborted) return;
        setResults(data);

      } catch {
        if (!controller.signal.aborted) { setResults({ tracks: [], artists: [], albums: [] }); setSearchError('Search is taking a break. Please try again.'); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, searchAttempt]);

  const handleGenrePress = async (genreName: string) => {
    setGenreLoading(true);
    setQuery(genreName);
    try {
      const data = await api.search(genreName);
      setResults(data);
      if (data.tracks && data.tracks.length > 0) {
        setTrack(data.tracks[0]);
        setQueue(data.tracks);
      }
      saveRecentSearch(genreName);
    } catch (e) {
      console.error('Genre search error:', e);
    } finally {
      setGenreLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
  };

  const handleVoiceSearch = () => {
    Alert.alert("Voice search unavailable", "Type a song or artist in the search field.");
  };

  const handleSpotifyImport = async () => {
    if (!spotifyUrl.trim()) return;
    setSpotifyLoading(true);
    try {
      // 1. Fetch playlist from our backend
      const playlist = await api.importSpotify(spotifyUrl);

      if (playlist && playlist.tracks) {
        // 2. We could play them or load them. For now just search the first track to prove it works
        if (playlist.tracks.length > 0) {
          setQuery(`${playlist.tracks[0].title} ${playlist.tracks[0].subtitle}`);
          setShowSpotifyImport(false);
          setSpotifyUrl("");
        }
      }
    } catch (e) {
      console.error("Spotify import failed", e);
    } finally {
      setSpotifyLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Text style={styles.subtitle}>Find your favorite songs, artists, or lyrics</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.tertiaryLabel} />
          <TextInput autoComplete="off" importantForAutofill="noExcludeDescendants"
            style={[styles.searchInput, { outlineStyle: "none" } as any]}
            placeholder="Songs, artists, or lyrics"
            placeholderTextColor={colors.tertiaryLabel}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.tertiaryLabel}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowSpotifyImport(true)}>
                <FontAwesome5
                  name="spotify"
                  size={18}
                  color="#1DB954"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert("Code scanning unavailable", "Open a shared song link to listen.")}>
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={colors.tertiaryLabel}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVoiceSearch}>
                <Ionicons
                  name="mic-outline"
                  size={18}
                  color={colors.tertiaryLabel}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Show results or genres */}
        {query.trim() ? (
          <View>
            <View style={{ marginBottom: spacing.md }}>
              <FilterChips
                chips={["Top", "Songs", "Artists", "Albums"]}
                activeChip={activeTab}
                onSelect={setActiveTab}
              />
            </View>

            {loading ? (
              <View style={{ marginTop: 20 }}>
                {activeTab === 'Songs' || activeTab === 'Top' ? (
                  <>
                    <TrackRowSkeleton />
                    <TrackRowSkeleton />
                    <TrackRowSkeleton />
                  </>
                ) : (
                  <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
                    <CardSkeleton />
                    <CardSkeleton />
                  </View>
                )}
              </View>
            ) : (
              <View>
                {(activeTab === "Top" || activeTab === "Songs") && results.tracks.length > 0 && (
                  <View>
                    {activeTab === "Top" && <Text style={styles.resultLabel}>Songs</Text>}
                    {results.tracks.slice(0, activeTab === "Top" ? 5 : 20).map((track, index) => (
                      <View key={track.id}>
                        <TrackRow track={track} index={index} contextQueue={results.tracks} />
                        {index === 0 && query.trim().split(' ').length > 2 && (
                          <View style={{ position: 'absolute', right: spacing.lg, top: spacing.md, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: colors.secondaryLabel, fontSize: 10 }}>Lyrics match</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {(activeTab === "Top" || activeTab === "Artists") && results.artists.length > 0 && (
                  <View style={{ marginTop: activeTab === "Top" ? spacing.xl : 0 }}>
                    {activeTab === "Top" && <Text style={styles.resultLabel}>Artists</Text>}
                    {results.artists.slice(0, activeTab === "Top" ? 5 : 20).map((artist: any) => (
                      <TouchableOpacity
                        key={artist.id}
                        style={styles.artistRow}
                        onPress={() => router.push({ pathname: "/artist/[id]", params: { id: artist.id, source: artist.source || "spotify" } })}
                        activeOpacity={0.7}
                      >
                        <Image source={{ uri: artist.image || 'https://via.placeholder.com/150' }} style={styles.artistImage} />
                        <Text style={styles.artistName}>{artist.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {(activeTab === "Top" || activeTab === "Albums") && results.albums.length > 0 && (
                  <View style={{ marginTop: activeTab === "Top" ? spacing.xl : 0 }}>
                    {activeTab === "Top" && <Text style={styles.resultLabel}>Albums</Text>}
                    {results.albums.slice(0, activeTab === "Top" ? 5 : 20).map((album: any) => (
                      <TouchableOpacity
                        key={album.id}
                        style={styles.artistRow}
                        onPress={() => router.push({ pathname: "/album/[id]", params: { id: album.id, source: album.source || "spotify" } })}
                        activeOpacity={0.7}
                      >
                        <Image source={{ uri: album.image || 'https://via.placeholder.com/150' }} style={styles.albumImage} />
                        <View>
                          <Text style={styles.artistName}>{album.name}</Text>
                          <Text style={styles.albumArtist}>{album.artist_name}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {!loading && results.tracks.length === 0 && results.artists.length === 0 && results.albums.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="search-outline"
                      size={48}
                      color={colors.tertiaryLabel}
                    />
                    <Text style={styles.emptyText}>{searchError || 'No results found'}</Text>
                    {searchError && <TouchableOpacity accessibilityRole="button" onPress={() => setSearchAttempt(value => value + 1)} style={{padding:12}}><Text style={{color:colors.label}}>Try again</Text></TouchableOpacity>}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionTitle}>Recent searches</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScrollContent}
                >
                  {recentSearches.map((term, i) => (
                    <View key={i} style={styles.recentChip}>
                      <TouchableOpacity
                        style={styles.recentChipTextContainer}
                        onPress={() => setQuery(term)}
                      >
                        <Text style={styles.recentChipText}>{term}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.recentChipClose}
                        onPress={() => removeRecentSearch(term)}
                      >
                        <Ionicons name="close" size={14} color={colors.secondaryLabel} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {genreLoading && (
              <ActivityIndicator size="large" color={colors.accentSolid} style={{ marginTop: 40 }} />
            )}

            {/* Trending Searches */}
            <View style={styles.trendingSection}>
              <Text style={styles.sectionTitle}>Trending searches</Text>
              <View style={styles.trendingList}>
                {trendingSearches.map((term, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.trendingItem}
                    onPress={() => setQuery(term)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.trendingIconContainer}>
                      <Ionicons name="trending-up" size={18} color={colors.secondaryLabel} />
                    </View>
                    <Text style={styles.trendingText}>{term}</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name="chevron-forward" size={16} color={colors.tertiaryLabel} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Genre Grid */}
            <Text style={styles.sectionTitle}>Browse genres</Text>
            <View style={styles.genreGrid}>
              {genres.map((genre) => (
                <AnimatedGenreCard key={genre.id} genre={genre} onPress={handleGenrePress} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Spotify Import Modal */}
      <Modal visible={showSpotifyImport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={100} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import from Spotify</Text>
              <TouchableOpacity onPress={() => setShowSpotifyImport(false)}>
                <Ionicons name="close" size={24} color={colors.label} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Paste a public Spotify playlist or album URL below.</Text>
            <TextInput autoComplete="off" importantForAutofill="noExcludeDescendants"
              style={styles.spotifyInput}
              placeholder="https://open.spotify.com/playlist/..."
              placeholderTextColor={colors.tertiaryLabel}
              value={spotifyUrl}
              onChangeText={setSpotifyUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.importButton, (!spotifyUrl.trim() || spotifyLoading) && { opacity: 0.5 }]}
              onPress={handleSpotifyImport}
              disabled={!spotifyUrl.trim() || spotifyLoading}
            >
              {spotifyLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.importButtonText}>Import Playlist</Text>
              )}
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* Listening Modal */}
      <Modal visible={isListening} transparent animationType="fade">
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: 'rgba(255,255,255,0.1)',
            justifyContent: 'center', alignItems: 'center',
            marginBottom: spacing.xl,
            borderWidth: 2,
            borderColor: colors.accentSolid,
            shadowColor: colors.accentSolid,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 20
          }}>
            <Ionicons name="mic" size={48} color={colors.accentSolid} />
          </View>
          <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '600' }}>Listening...</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: spacing.sm }}>Try saying "Taylor Swift"</Text>
          <TouchableOpacity onPress={() => setIsListening(false)} style={{ marginTop: spacing.xxl }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>


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
  header: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.label,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryLabel,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  searchInput: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 15,
    color: colors.label,
    height: "100%",
  },
  resultLabel: {
    fontSize: 13,
    color: colors.secondaryLabel,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.label,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  genreCard: {
    width: "47%",
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  genreGradient: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "space-between",
    position: "relative",
  },
  genreText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.label,
  },
  genreImage: {
    position: "absolute",
    right: -10,
    bottom: -10,
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    transform: [{ rotate: "15deg" }],
    opacity: 0.6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.tertiaryLabel,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.tertiaryLabel,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  clearText: {
    fontSize: 14,
    color: colors.accentSolid,
    fontWeight: '500',
  },
  trendingSection: {
    marginBottom: spacing.xl,
  },
  trendingList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  trendingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.label,
  },
  recentScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  recentChipTextContainer: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  recentChipText: {
    fontSize: 14,
    color: colors.label,
  },
  recentChipClose: {
    padding: spacing.sm,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  artistImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: 'rgba(20, 20, 25, 0.4)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.label,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.secondaryLabel,
    marginBottom: spacing.lg,
  },
  spotifyInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.label,
    fontSize: 14,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  importButton: {
    backgroundColor: '#1DB954',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  albumImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  artistName: {
    fontSize: 16,
    color: colors.label,
    fontWeight: '500',
  },
  albumArtist: {
    fontSize: 14,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
});
