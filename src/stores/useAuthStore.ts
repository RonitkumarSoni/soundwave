import { create } from 'zustand';
import { User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { usePlayerStore } from './usePlayerStore';
import { useSettingsStore } from './useSettingsStore';
import { clearGoogleSession } from '@/lib/googleSignIn';
export interface UserProfile {
  id: string; email: string; display_name: string; avatar_url: string;
  is_premium: boolean; oauth_provider: string | null;
}
interface AuthState {
  user: UserProfile | null; firebaseUser: User | null; isLoggedIn: boolean; isLoading: boolean;
  emailVerified: boolean; profileError: string | null;
  setAuthData: (user: UserProfile, firebaseUser: User) => Promise<void>;
  syncUser: (user: User | null) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
}
let sessionRevision = 0;
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, firebaseUser: null, isLoggedIn: false, isLoading: true, emailVerified: false, profileError: null,
  setAuthData: async (profile, firebaseUser) => { await get().syncUser(firebaseUser); },
  syncUser: async (firebaseUser) => {
    const revision = ++sessionRevision;
    await usePlayerStore.getState().switchAccount(firebaseUser?.uid || null);
    if (revision !== sessionRevision) return;
    await useSettingsStore.getState().loadFromStorage();
    if (revision !== sessionRevision) return;
    if (!firebaseUser) {
      set({ user: null, firebaseUser: null, isLoggedIn: false, isLoading: false, emailVerified: false, profileError: null });
      return;
    }
    set({ firebaseUser, isLoggedIn: true, emailVerified: firebaseUser.emailVerified, isLoading: false,
      user: { id: firebaseUser.uid, email: firebaseUser.email || '', display_name: firebaseUser.displayName || 'User', avatar_url: firebaseUser.photoURL || '', is_premium: false, oauth_provider: firebaseUser.providerData[0]?.providerId || null }, profileError: null });
    if (!firebaseUser.emailVerified) return;
    try {
      const profile = await api.auth.me();
      if (revision === sessionRevision && auth.currentUser?.uid === firebaseUser.uid) set({ user: profile, profileError: null });
    } catch {
      if (revision === sessionRevision) set({ profileError: 'Your account could not sync. Check your connection and try again.' });
    }
  },
  logout: async () => {
    await signOut(auth);
    ++sessionRevision;
    set({ user: null, firebaseUser: null, isLoggedIn: false, isLoading: false, emailVerified: false, profileError: null });
    await get().syncUser(null);
    await clearGoogleSession().catch(() => {});
  },
  updateProfile: (profile) => {
    const user = get().user;
    if (user) set({ user: { ...user, display_name: profile.display_name ?? user.display_name, avatar_url: profile.avatar_url ?? user.avatar_url } });
  },
}));
