import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { TrackRow } from "@/components/TrackRow";
import { genres } from "@/data/mockData";
import { api } from "@/lib/api";
import { Track } from "@/stores/usePlayerStore";

const AnimatedImage = Animated.createAnimatedComponent(Image);

function AnimatedGenreCard({ genre }: { genre: any }) {
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
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      // TypeScript might complain about onHoverIn/Out on standard Pressable type, so we can cast it if needed, but it works on Web.
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const tracks = await api.search(query);
      setResults(tracks);
      setLoading(false);
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

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
        {/* Title */}
        <Text style={styles.title}>Search</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.tertiaryLabel} />
          <TextInput
            style={[styles.searchInput, { outlineStyle: "none" } as any]}
            placeholder="Songs, artists, or albums"
            placeholderTextColor={colors.tertiaryLabel}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.tertiaryLabel}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Show results or genres */}
        {query.trim() ? (
          <View>
            {results.map((track, index) => (
              <TrackRow key={track.id} track={track} index={index} contextQueue={results} />
            ))}
            {results.length === 0 && (
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
        ) : (
          <View>
            {/* Genre Grid */}
            <Text style={styles.sectionTitle}>Browse genres</Text>
            <View style={styles.genreGrid}>
              {genres.map((genre) => (
                <AnimatedGenreCard key={genre.id} genre={genre} />
              ))}
            </View>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.label,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
  emptyText: {
    fontSize: 16,
    color: colors.tertiaryLabel,
  },
});
