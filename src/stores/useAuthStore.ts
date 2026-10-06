import { create } from 'zustand';
import { User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import { usePlayerStore } from './usePlayerStore';
import { useSettingsStore } from './useSettingsStore';
import { clearGoogleSession } from '@/lib/googleSignIn';
import { disablePushNotifications } from '@/services/pushNotifications';
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
    const accountChanged = get().isLoading || !firebaseUser || get().firebaseUser?.uid !== firebaseUser.uid;
    if (accountChanged) {
      set({ isLoading: true });
      await usePlayerStore.getState().switchAccount(firebaseUser?.uid || null);
      if (revision !== sessionRevision) return;
      await useSettingsStore.getState().loadFromStorage();
      if (revision !== sessionRevision) return;
    }
    if (!firebaseUser) {
      set({ user: null, firebaseUser: null, isLoggedIn: false, isLoading: false, emailVerified: false, profileError: null });
      return;
    }
    set({ firebaseUser, isLoggedIn: true, emailVerified: firebaseUser.emailVerified, isLoading: false,
      user: !accountChanged && get().user ? get().user : { id: firebaseUser.uid, email: firebaseUser.email || '', display_name: firebaseUser.displayName || 'User', avatar_url: firebaseUser.photoURL || '', is_premium: false, oauth_provider: firebaseUser.providerData[0]?.providerId || null }, profileError: null });
    if (!firebaseUser.emailVerified) return;
    try {
      const profile = await api.auth.me();
      if (revision === sessionRevision && auth.currentUser?.uid === firebaseUser.uid) set({ user: profile, profileError: null });
    } catch (error: any) {
      const status = error?.response?.status;
      const message = status === 429 ? 'The account service received too many requests. Please wait a minute before retrying.'
        : status === 401 ? 'Your session could not be verified. Sign in again.'
        : status === 503 ? 'The backend authentication service is unavailable or not configured.'
        : status >= 500 ? 'The backend returned a server error. Try again shortly.'
        : status ? `Account sync failed (HTTP ${status}).`
        : 'Could not connect to the account service. Check your connection and retry.';
      if (revision === sessionRevision && auth.currentUser?.uid === firebaseUser.uid) {
        const responseMessage = error?.response?.data?.message;
        const reason = typeof responseMessage === 'string' && [
          'Sign in to continue', 'Invalid or expired session',
          'Verify your email before using your account',
          'Authentication service is not configured',
          'Backend authentication service could not verify your session',
        ].includes(responseMessage) ? responseMessage : 'Unrecognized backend response';
        console.warn('[Account sync failed]', { status: status || 'no response', code: error?.code || 'unknown', backend: API_BASE, reason });
        set({ profileError: message });
      }
    }
  },
  logout: async () => {
    await disablePushNotifications().catch(() => {});
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
