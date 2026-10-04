import AsyncStorage from '@react-native-async-storage/async-storage';
let accountId: string | null = null;
export const setStorageAccount = (uid: string | null) => { accountId = uid; };
export const getStorageAccount = () => accountId;
export const accountKey = (key: string, uid = accountId) => uid ? 'soundwave:' + encodeURIComponent(uid) + ':' + key : null;
const writes = new Map<string, Promise<void>>();
function enqueue(key: string, action: () => Promise<void>) {
  const pending = (writes.get(key) || Promise.resolve()).catch(() => {}).then(action);
  writes.set(key, pending);
  void pending.finally(() => { if (writes.get(key) === pending) writes.delete(key); }).catch(() => {});
  return pending;
}
export const accountStorage = {
  async getItem(key: string) {
    const uid = accountId, scoped = accountKey(key);
    if (!scoped) return null;
    await writes.get(scoped)?.catch(() => {});
    const value = await AsyncStorage.getItem(scoped);
    return uid === accountId ? value : null;
  },
  async setItem(key: string, value: string) {
    const scoped = accountKey(key);
    if (scoped) await enqueue(scoped, () => AsyncStorage.setItem(scoped, value));
  },
  async removeItem(key: string) {
    const scoped = accountKey(key);
    if (scoped) await enqueue(scoped, () => AsyncStorage.removeItem(scoped));
  },
};
export async function clearAccountStorage(uid: string) {
  const prefix = 'soundwave:' + encodeURIComponent(uid) + ':';
  await Promise.all([...writes.entries()].filter(([key]) => key.startsWith(prefix)).map(([, pending]) => pending.catch(() => {})));
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(prefix));
  await AsyncStorage.multiRemove(keys);
}
