import type { Notification } from 'expo-notifications';
import { Platform } from 'react-native';
import { isDevice } from 'expo-device';
import Constants from 'expo-constants';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

// Expo Go cannot receive Android remote push notifications; don't initialize its native push APIs.
const Notifications: typeof import('expo-notifications') | null = Constants.executionEnvironment === 'storeClient'
  ? null
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Only load native push APIs in builds that include them.
  : require('expo-notifications');

let registered: { token: string; uid: string } | null = null;
Notifications?.setNotificationHandler({ handleNotification: async notification => {
  const belongsToUser = !!auth.currentUser && notification.request.content.data?.uid === auth.currentUser.uid;
  const enabled = belongsToUser && useSettingsStore.getState().pushNotifications;
  return { shouldShowBanner: enabled, shouldShowList: enabled, shouldPlaySound: enabled, shouldSetBadge: false };
} });

async function registerDevice() {
  if (!Notifications) throw new Error('Push notifications require a development build.');
  if (Platform.OS !== 'android') throw new Error('This push setup currently supports Android.');
  if (!isDevice) throw new Error('Push notifications require a physical Android device.');
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in before enabling notifications.');
  const token = String((await Notifications.getDevicePushTokenAsync()).data);
  if (auth.currentUser?.uid !== uid) throw new Error('Account changed. Please retry.');
  await api.notifications.register(token);
  if (auth.currentUser?.uid !== uid) return;
  registered = { token, uid };
}

export async function enablePushNotifications() {
  if (!Notifications) throw new Error('Push notifications require a development build.');
  await Notifications.setNotificationChannelAsync('soundwave-alerts', { name: 'Soundwave alerts', importance: Notifications.AndroidImportance.HIGH });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Allow notifications in Android settings to enable alerts.');
  await registerDevice();
}
export async function refreshPushRegistration() {
  if (!Notifications) return;
  if (Platform.OS !== 'android' || !isDevice) return;
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) {
    await Notifications.setNotificationChannelAsync('soundwave-alerts', { name: 'Soundwave alerts', importance: Notifications.AndroidImportance.HIGH });
    await registerDevice();
  }
}
export async function disablePushNotifications() {
  const device = registered;
  registered = null;
  if (device && auth.currentUser?.uid === device.uid) await api.notifications.unregister(device.token);
}
function receiveNotification(notification: Notification) {
  const uid = auth.currentUser?.uid;
  if (!uid || notification.request.content.data?.uid !== uid) return false;
  useNotificationStore.getState().receive(uid, {
    id: notification.request.identifier,
    title: notification.request.content.title || 'Soundwave',
    message: notification.request.content.body || '', receivedAt: notification.date, read: false,
  });
  return true;
}
export async function restorePushNotifications(onOpen: () => void) {
  if (!Notifications) return;
  for (const notification of await Notifications.getPresentedNotificationsAsync()) receiveNotification(notification);
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response && receiveNotification(response.notification)) {
    await Notifications.clearLastNotificationResponseAsync();
    onOpen();
  }
}
export function listenForPushNotifications(onOpen: () => void) {
  if (!Notifications) return () => {};
  const receive = (notification: Notification) => {
    const uid = auth.currentUser?.uid;
    if (!uid || notification.request.content.data?.uid !== uid) return;
    useNotificationStore.getState().receive(uid, {
      id: notification.request.identifier,
      title: notification.request.content.title || 'Soundwave',
      message: notification.request.content.body || '', receivedAt: notification.date, read: false,
    });
  };
  const incoming = Notifications.addNotificationReceivedListener(receive);
  const response = Notifications.addNotificationResponseReceivedListener(event => {
    const uid = auth.currentUser?.uid;
    if (!uid || event.notification.request.content.data?.uid !== uid) return;
    receive(event.notification); onOpen();
  });
  const token = Notifications.addPushTokenListener(() => { void refreshPushRegistration().catch(() => {}); });
  return () => { incoming.remove(); response.remove(); token.remove(); };
}
