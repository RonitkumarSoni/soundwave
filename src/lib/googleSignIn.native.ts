import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';
GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '514260576219-em1tjqq13ci3coffqqgkrrcrqie9noor.apps.googleusercontent.com' });
export async function signInGoogle() {
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  if (!result.data?.idToken) throw new Error('Google sign-in was cancelled');
  return signInWithCredential(auth, GoogleAuthProvider.credential(result.data.idToken));
}
export const clearGoogleSession = () => GoogleSignin.signOut();
