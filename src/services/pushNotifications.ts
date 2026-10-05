export async function enablePushNotifications(): Promise<void> { throw new Error('Push notifications are available in the Android app.'); }
export async function disablePushNotifications(): Promise<void> {}
export async function refreshPushRegistration(): Promise<void> {}
export async function restorePushNotifications(_onOpen: () => void): Promise<void> {}
export function listenForPushNotifications(_onOpen: () => void) { return () => {}; }
