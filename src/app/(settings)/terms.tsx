import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing } from '@/theme/colors';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[gradients.background[0], gradients.background[1]]} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>By accessing Soundwave, you agree to be bound by these terms of service and all applicable laws.</Text>

        <Text style={styles.heading}>2. User Conduct</Text>
        <Text style={styles.text}>You agree not to use the service for any unlawful purpose or to violate any local, state, or international law.</Text>
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
