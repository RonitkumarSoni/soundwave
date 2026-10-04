import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export function LoadError({ title, onRetry }: { title: string; onRetry: () => void }) {
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, backgroundColor: '#170B2E', padding: 24, paddingTop: insets.top + 40 }}>
    <Text accessibilityRole="header" style={{ color: '#FFF', fontSize: 22 }}>{title}</Text>
    <Text style={{ color: '#B9A9D9', marginVertical: 16 }}>Check your connection and try again.</Text>
    <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 18 }}>Retry</Text></TouchableOpacity>
  </View>;
}
