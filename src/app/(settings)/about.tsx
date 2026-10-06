import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing } from '@/theme/colors';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[gradients.background[0], gradients.background[1]]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>About Soundwave</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.version}>Version 1.0.1</Text>
        <Text style={styles.text}>
          Soundwave is your ultimate music streaming platform. Designed to give you an immersive and fast listening experience.
        </Text>
        <Text style={styles.text}>
          Built with React Native and Expo.
        </Text>
        <Text style={styles.copyright}>© 2026 Soundwave Inc. All rights reserved.</Text>
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
  content: { padding: spacing.xl, alignItems: 'center' },
  version: { fontSize: 18, fontWeight: 'bold', color: colors.accentSolid, marginBottom: spacing.xl },
  text: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: spacing.lg, lineHeight: 24 },
  copyright: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 40 },
});
