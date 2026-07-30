import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';
import { useSettingsStore } from '@/stores/useSettingsStore';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: "Welcome to Soundwave",
    subtitle: "Your favorite music, crystal clear.",
    icon: "headphones",
    color: gradients.primary,
  },
  {
    id: 2,
    title: "Listen Offline",
    subtitle: "Download your favorite tracks and take them anywhere, without limits.",
    icon: "download-cloud",
    color: [colors.accentStart, colors.accentSolid],
  },
  {
    id: 3,
    title: "Discover More",
    subtitle: "Find new artists, curated playlists, and enjoy personalized mixes.",
    icon: "compass",
    color: [colors.tertiaryLabel, colors.secondaryLabel],
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    updateSetting('hasSeenOnboarding', true);
    router.replace('/(home)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#170B2E", "#0A0514"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width, paddingTop: insets.top }]}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={slide.color as any}
                style={styles.iconBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name={slide.icon as any} size={64} color="#FFF" />
              </LinearGradient>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={nextSlide}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0514',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    marginBottom: 60,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentSolid,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accentSolid,
  },
  button: {
    backgroundColor: colors.accentSolid,
    paddingVertical: 18,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
