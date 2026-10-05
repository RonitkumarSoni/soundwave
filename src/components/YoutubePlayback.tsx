import React from 'react';
import { AppState, View, Text, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlayerStore, type Track } from '@/stores/usePlayerStore';
import { useAlertTheme } from '@/hooks/useAlertTheme';
import YoutubeEmbed from './YoutubeEmbed';
import { useIsFocused } from '@react-navigation/native';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function YoutubePlayback({ track }: { track: Track }) {
  const router = useRouter();
  const theme = useAlertTheme();
  const focused = useIsFocused();
  const offline = useSettingsStore(state => state.offlineMode);
  const [active, setActive] = React.useState(AppState.currentState === 'active');
  const [error, setError] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    usePlayerStore.getState().pause();
    const listener = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => listener.remove();
  }, [track.id]);
  const valid = /^[A-Za-z0-9_-]{11}$/.test(track.id);
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(home)')} style={{ paddingVertical: 16 }}><Text style={{ color: theme.accent }}>Back</Text></TouchableOpacity>
    <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700', marginVertical: 16 }}>{track.name}</Text>
    <Text style={{ color: theme.secondaryText, marginBottom: 20 }}>{track.artist_name} · YouTube</Text>
    <View style={{ height: 280, backgroundColor: '#000' }}>{active && focused && valid && !offline && <YoutubeEmbed key={`${track.id}:${attempt}`} id={track.id} onError={setError} />}</View>
    {offline && <Text style={{ color: theme.secondaryText, marginTop: 12 }}>Turn off Offline Mode to play YouTube videos.</Text>}
    <Text style={{ color: theme.secondaryText, marginVertical: 20 }}>Tap Play in the YouTube player. Playback stops when you leave this screen or put the app in the background.</Text>
    {!!error && <Text style={{ color: theme.danger }}>{error}</Text>}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
      <TouchableOpacity onPress={() => { setError(''); setAttempt(value => value + 1); }}><Text style={{ color: theme.accent }}>Reload player</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => { void Linking.openURL(`https://www.youtube.com/watch?v=${encodeURIComponent(track.id)}`).catch(() => setError('Could not open YouTube.')); }}><Text style={{ color: theme.accent }}>Open in YouTube</Text></TouchableOpacity>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 }}>
      <TouchableOpacity onPress={() => usePlayerStore.getState().prevTrack()}><Text style={{ color: theme.text }}>Previous</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => usePlayerStore.getState().nextTrack()}><Text style={{ color: theme.text }}>Next</Text></TouchableOpacity>
    </View>
  </SafeAreaView>;
}
