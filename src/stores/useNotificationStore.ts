import { create } from 'zustand';
import { accountStorage, getStorageAccount } from '@/lib/accountStorage';

export interface InboxNotification { id: string; title: string; message: string; receivedAt: number; read: boolean }
interface NotificationState {
  uid: string | null;
  items: InboxNotification[];
  load: (uid: string | null) => Promise<void>;
  receive: (uid: string, item: InboxNotification) => void;
  markRead: () => void;
  clear: () => void;
}
export const useNotificationStore = create<NotificationState>((set, get) => ({
  uid: null, items: [],
  load: async uid => {
    set({ uid, items: [] });
    if (!uid) return;
    const saved = await accountStorage.getItem('notification_inbox');
    if (get().uid !== uid || getStorageAccount() !== uid) return;
    try {
      const parsed = JSON.parse(saved || '[]');
      if (Array.isArray(parsed)) {
        const current = get().items;
        const known = new Set(current.map(item => item.id));
        const valid = parsed.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.message === 'string' && typeof item.receivedAt === 'number' && !known.has(item.id));
        set({ items: [...current, ...valid].slice(0, 100) });
      }
    } catch { /* Ignore a damaged local inbox. */ }
  },
  receive: (uid, item) => {
    if (get().uid !== uid || getStorageAccount() !== uid) return;
    const items = [item, ...get().items.filter(existing => existing.id !== item.id)].slice(0, 100);
    set({ items });
    void accountStorage.setItem('notification_inbox', JSON.stringify(items)).catch(() => {});
  },
  markRead: () => {
    const items = get().items.map(item => ({ ...item, read: true }));
    set({ items });
    void accountStorage.setItem('notification_inbox', JSON.stringify(items)).catch(() => {});
  },
  clear: () => {
    set({ items: [] });
    void accountStorage.setItem('notification_inbox', '[]').catch(() => {});
  },
}));
