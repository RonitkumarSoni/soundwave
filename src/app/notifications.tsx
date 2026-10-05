import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAlertTheme } from '@/hooks/useAlertTheme';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { CustomDialog } from '@/components/CustomDialog';
import { enablePushNotifications } from '@/services/pushNotifications';
import { api } from '@/lib/api';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useAlertTheme();
  const bottomPadding = useBottomPadding();
  const items = useNotificationStore(state => state.items);
  const markRead = useNotificationStore(state => state.markRead);
  const clear = useNotificationStore(state => state.clear);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const testNotification = async () => {
    if (testing) return;
    setTesting(true);
    try {
      await enablePushNotifications();
      useSettingsStore.getState().updateSetting('pushNotifications', true);
      await api.notifications.test();
      Toast.show({ type: 'success', text1: 'Test notification accepted', text2: 'Check your notification shade.' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Notification test failed', text2: error?.response?.data?.message || error?.message || 'Check your connection and retry.' });
    } finally { setTesting(false); }
  };
  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.page, { backgroundColor: theme.background }]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(home)')} style={styles.back}><Ionicons name="chevron-back" size={28} color={theme.text} /></TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
      <TouchableOpacity disabled={!items.length} onPress={markRead}><Text style={{ color: theme.accent }}>Mark all read</Text></TouchableOpacity>
    </View>
    <FlatList data={items} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20, paddingBottom: bottomPadding }}
      renderItem={({ item }) => <View style={[styles.card, { backgroundColor: theme.button, borderColor: theme.border }]}>
        <View style={styles.cardHeading}><Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>{!item.read && <View style={[styles.dot, { backgroundColor: theme.accent }]} />}</View>
        <Text style={[styles.message, { color: theme.secondaryText }]}>{item.message}</Text>
        <Text style={[styles.date, { color: theme.secondaryText }]}>{new Date(item.receivedAt).toLocaleString()}</Text>
      </View>}
      ListEmptyComponent={<Text style={[styles.message, { color: theme.secondaryText }]}>No notifications yet. Enable alerts or send a test notification below.</Text>}
      ListFooterComponent={<View style={styles.footer}>
        <TouchableOpacity disabled={testing} onPress={() => { void testNotification(); }} style={styles.action}>{testing ? <ActivityIndicator color={theme.accent} /> : <Text style={{ color: theme.accent }}>Enable & test notification</Text>}</TouchableOpacity>
        {!!items.length && <TouchableOpacity onPress={() => setConfirmClear(true)} style={styles.action}><Text style={{ color: theme.danger }}>Clear all notifications</Text></TouchableOpacity>}
      </View>}
    />
    <CustomDialog visible={confirmClear} title="Clear notifications" message="Remove all notifications from this device?" confirmText="Clear" isDestructive onCancel={() => setConfirmClear(false)} onConfirm={clear} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 }, back: { minWidth: 44, minHeight: 44, justifyContent: 'center' }, title: { flex: 1, fontSize: 22, fontWeight: '700' }, card: { padding: 20, marginBottom: 16, borderRadius: 20, borderWidth: 1 }, cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, cardTitle: { flex: 1, fontSize: 17, fontWeight: '700' }, dot: { width: 8, height: 8, borderRadius: 4 }, message: { fontSize: 16, lineHeight: 24, marginTop: 10 }, date: { fontSize: 12, marginTop: 12 }, footer: { marginTop: 24 }, action: { alignItems: 'center', justifyContent: 'center', minHeight: 48 } });
