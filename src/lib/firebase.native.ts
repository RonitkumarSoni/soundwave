import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseApp } from './firebase.config';
let nativeAuth: Auth;
try {
// Platform-specific optional/persistence adapter is loaded only on native.
// eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth') as { getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence };
  nativeAuth = initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (error) {
  if ((error as { code?: string }).code !== 'auth/already-initialized') throw error;
  nativeAuth = getAuth(firebaseApp);
}
export const auth = nativeAuth;
