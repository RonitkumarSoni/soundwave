import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export function UnavailableFeature({ title, message }: { title: string; message: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return <View style={[styles.page, { paddingTop: insets.top + 20 }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.text}>‹ Back</Text></TouchableOpacity>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#170B2E', padding: 24 }, back: { minHeight: 48, justifyContent: 'center' }, text: { color: '#FFF', fontSize: 17 }, title: { color: '#FFF', fontSize: 28, fontWeight: '700', marginTop: 32 }, message: { color: '#B9A9D9', fontSize: 17, lineHeight: 26, marginTop: 16 } });
