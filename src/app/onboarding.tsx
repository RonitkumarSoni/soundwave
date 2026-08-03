import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing } from '@/theme/colors';
import { useSettingsStore } from '@/stores/useSettingsStore';

const { width } = Dimensions.get('window');
const ARTIST_SIZE = (width - spacing.xl * 2 - spacing.md * 2) / 3;

// Mock list of popular artists for onboarding
const INITIAL_ARTISTS = [
  { id: '1', name: 'Arijit Singh', image: 'https://c.saavncdn.com/artists/Arijit_Singh_500x500.jpg' },
  { id: '2', name: 'Pritam', image: 'https://i.scdn.co/image/ab6761610000e5ebcb6926f44f620555ba444fca' },
  { id: '3', name: 'A.R. Rahman', image: 'https://c.saavncdn.com/artists/AR_Rahman_500x500.jpg' },
  { id: '4', name: 'Justin Bieber', image: 'https://c.saavncdn.com/artists/Justin_Bieber_500x500.jpg' },
  { id: '5', name: 'Shreya Ghoshal', image: 'https://c.saavncdn.com/artists/Shreya_Ghoshal_500x500.jpg' },
  { id: '6', name: 'Badshah', image: 'https://c.saavncdn.com/artists/Badshah_500x500.jpg' },
  { id: '7', name: 'The Weeknd', image: 'https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg' },
  { id: '8', name: 'Taylor Swift', image: 'https://c.saavncdn.com/artists/Taylor_Swift_500x500.jpg' },
  { id: '9', name: 'Drake', image: 'https://c.saavncdn.com/artists/Drake_500x500.jpg' },
  { id: '10', name: 'Neha Kakkar', image: 'https://c.saavncdn.com/artists/Neha_Kakkar_500x500.jpg' },
  { id: '11', name: 'Ed Sheeran', image: 'https://c.saavncdn.com/artists/Ed_Sheeran_500x500.jpg' },
  { id: '12', name: 'Sonu Nigam', image: 'https://c.saavncdn.com/artists/Sonu_Nigam_500x500.jpg' },
  { id: '13', name: 'Diljit Dosanjh', image: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_500x500.jpg' },
  { id: '14', name: 'Atif Aslam', image: 'https://c.saavncdn.com/artists/Atif_Aslam_500x500.jpg' },
  { id: '15', name: 'Ariana Grande', image: 'https://c.saavncdn.com/artists/Ariana_Grande_500x500.jpg' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const toggleArtist = (id: string) => {
    const newSet = new Set(selectedArtists);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedArtists(newSet);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    // In a real app, save these preferences to the backend
    await new Promise(r => setTimeout(r, 1000)); 
    updateSetting('hasSeenOnboarding', true);
    setIsSaving(false);
    router.replace('/(home)');
  };

  const isReady = selectedArtists.size >= 3;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[gradients.background[0], gradients.background[1], gradients.background[2]]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
        <Text style={styles.title}>Choose 3 or more artists you like.</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {INITIAL_ARTISTS.map(artist => {
            const isSelected = selectedArtists.has(artist.id);
            return (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistCard}
                onPress={() => toggleArtist(artist.id)}
                activeOpacity={0.7}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: artist.image }} style={[styles.artistImage, isSelected && styles.artistImageSelected]} />
                  {isSelected && (
                    <View style={styles.checkOverlay}>
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text style={styles.artistName} numberOfLines={2}>{artist.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24 }]}>
        <TouchableOpacity 
          style={[styles.doneButton, isReady ? styles.doneButtonActive : null]}
          onPress={handleFinish}
          disabled={!isReady || isSaving}
        >
          {isReady && (
            <LinearGradient
              colors={[gradients.primary[0], gradients.primary[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.doneButtonText, isReady ? styles.doneButtonTextActive : null]}>
              {isReady ? 'Done' : 'Choose 3 or more'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  artistCard: {
    width: ARTIST_SIZE,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: ARTIST_SIZE,
    height: ARTIST_SIZE,
    borderRadius: ARTIST_SIZE / 2,
    marginBottom: 8,
    position: 'relative',
  },
  artistImage: {
    width: '100%',
    height: '100%',
    borderRadius: ARTIST_SIZE / 2,
    backgroundColor: colors.surface,
  },
  artistImageSelected: {
    opacity: 0.5,
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  doneButton: {
    width: 200,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  doneButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  },
  doneButtonTextActive: {
    color: '#FFF',
  }
});
