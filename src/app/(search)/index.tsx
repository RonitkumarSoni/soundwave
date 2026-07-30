import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Pressable, Modal } from 'react-native';
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ tracks: Track[], artists: any[], albums: any[] }>({ tracks: [], artists: [], albums: [] });
  const [activeTab, setActiveTab] = useState("Top");
  const [loading, setLoading] = useState(false);
  const [genreLoading, setGenreLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showScanner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 246,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [showScanner]);

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
    if (!query.trim()) {
      setResults({ tracks: [], artists: [], albums: [] });
      return;
    }

    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const data = await api.search(query);
      
      // Sort tracks to ensure the closest matches are at the top
      if (data.tracks && data.tracks.length > 0) {
        const qLower = query.toLowerCase();
        data.tracks.sort((a: Track, b: Track) => {
          // Add fallback to empty string if title is undefined (or use 'name' if it comes from raw API)
          const aTitle = (a.title || (a as any).name || "").toLowerCase();
          const bTitle = (b.title || (b as any).name || "").toLowerCase();
          
          // 1. Exact match
          if (aTitle === qLower && bTitle !== qLower) return -1;
          if (bTitle === qLower && aTitle !== qLower) return 1;
          
          // 2. Starts with query
          const aStarts = aTitle.startsWith(qLower);
          const bStarts = bTitle.startsWith(qLower);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;
          
          // 3. Includes query
          const aIncludes = aTitle.includes(qLower);
          const bIncludes = bTitle.includes(qLower);
          if (aIncludes && !bIncludes) return -1;
          if (bIncludes && !aIncludes) return 1;
          
          return 0;
        });
      }

      setResults(data);
      setLoading(false);
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

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
    setIsListening(true);
    // Mock speech-to-text delay
    setTimeout(() => {
      setIsListening(false);
      setQuery("Imagine Dragons");
    }, 2500);
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
          <TextInput
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
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setShowScanner(true)}>
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
                        onPress={() => router.push(`/artist/${artist.id}`)}
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
                        onPress={() => router.push(`/album/${album.id}`)}
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
                    <Text style={styles.emptyText}>No results found</Text>
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

      {/* Listening Modal */}
      <Modal visible={isListening} transparent animationType="fade">
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
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

      {/* QR Scanner Mock Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScanner(false)}
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '600', marginBottom: spacing.xl }}>Scan Soundwave Code</Text>
          
          <View style={{ 
            width: 250, height: 250, 
            borderWidth: 2, borderColor: colors.accentSolid, 
            borderRadius: borderRadius.lg,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden'
          }}>
            <Ionicons name="scan-outline" size={80} color="rgba(255,255,255,0.2)" />
            <Animated.View 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: colors.accentSolid,
                shadowColor: colors.accentSolid,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 10,
                transform: [{ translateY: scanAnim }]
              }}
            />
          </View>
          
          <Text style={{ color: colors.secondaryLabel, fontSize: 14, marginTop: spacing.lg, textAlign: 'center' }}>
            Align a QR code or Soundwave code{'\n'}within the frame to scan.
          </Text>

          <TouchableOpacity onPress={() => setShowScanner(false)} style={{ marginTop: spacing.xxl }}>
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
    borderRadius: 25,
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
