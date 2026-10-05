import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomPadding } from '@/hooks/useBottomPadding';
export function UnavailableFeature({ title, message }: { title: string; message: string }) {
  const router = useRouter();
  const bottomPadding = useBottomPadding();
  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.page}>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/(home)')} style={styles.back}><Text style={styles.text}>‹ Back</Text></TouchableOpacity>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#170B2E' }, content: { flexGrow: 1, padding: 24 }, back: { minHeight: 48, justifyContent: 'center' }, text: { color: '#FFF', fontSize: 17 }, title: { color: '#FFF', fontSize: 28, fontWeight: '700', marginTop: 32 }, message: { color: '#B9A9D9', fontSize: 17, lineHeight: 26, marginTop: 16 } });
