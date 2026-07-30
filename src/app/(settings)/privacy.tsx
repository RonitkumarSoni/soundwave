import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing } from '@/theme/colors';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[gradients.background[0], gradients.background[1]]} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>1. Data Collection</Text>
        <Text style={styles.text}>We collect information about the music you listen to in order to provide personalized recommendations.</Text>

        <Text style={styles.heading}>2. Use of Information</Text>
        <Text style={styles.text}>Your data is used solely for improving your experience on Soundwave and is never sold to third parties.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0514' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  content: { padding: spacing.xl },
  heading: { fontSize: 18, fontWeight: 'bold', color: colors.accentSolid, marginBottom: spacing.sm, marginTop: spacing.lg },
  text: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
});
