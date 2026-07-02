import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { promoCards, PromoCard } from "@/data/mockData";
import { api } from "@/lib/api";
import { usePlayerStore } from "@/stores/usePlayerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Limit max width so images aren't stretched into very wide panoramas on web
const MAX_CARD_WIDTH = 340; 
const CARD_WIDTH = Math.min(SCREEN_WIDTH - spacing.lg * 2, MAX_CARD_WIDTH);
const CARD_HEIGHT = 180;

export function ForYouCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isDragging = useRef(false);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const handleCtaPress = async (searchQuery: string) => {
    try {
      const tracks = await api.search(searchQuery);
      if (tracks.length > 0) {
        setTrack(tracks[0]);
        setQueue(tracks);
      }
    } catch (e) {
      console.error('Carousel CTA error:', e);
    }
  };

  // Autoplay effect
  useEffect(() => {
    const timer = setInterval(() => {
      // Don't autoscroll while user is dragging
      if (isDragging.current) return;

      const nextIndex = (activeIndex + 1) % promoCards.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4500); // 4.5 seconds rotation

    return () => clearInterval(timer);
  }, [activeIndex]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + spacing.lg));
    // Only update if index has changed to prevent resetting the interval too often
    if (index >= 0 && index < promoCards.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const renderCard = ({ item }: { item: PromoCard }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        {/* Background image */}
        <Image
          source={{ uri: item.coverUrl }}
          style={styles.cardBgImage}
          resizeMode="cover"
        />
        {/* Left-to-Right gradient overlay to make text readable but keep image clear on the right */}
        <LinearGradient
          colors={["rgba(123,47,247,1)", "rgba(123,47,247,0.7)", "rgba(123,47,247,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.cardOverlay}
        />

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTextSection}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={3}>
              {item.subtitle}
            </Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.7} onPress={() => handleCtaPress(item.searchQuery)}>
            <Text style={styles.ctaText}>{item.cta}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={promoCards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + spacing.lg}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + spacing.lg,
          offset: (CARD_WIDTH + spacing.lg) * index,
          index,
        })}
        onScrollBeginDrag={() => {
          isDragging.current = true;
        }}
        onScrollEndDrag={() => {
          isDragging.current = false;
        }}
        onMomentumScrollEnd={() => {
          isDragging.current = false;
        }}
      />

      {/* Pagination dots */}
      <View style={styles.dotsContainer}>
        {promoCards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: spacing.lg,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xxl,
    overflow: "hidden",
    position: "relative",
  },
  cardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 1,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  cardTextSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.label,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
    maxWidth: "70%",
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.label,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    backgroundColor: colors.label,
    width: 18,
    borderRadius: 3,
  },
});
