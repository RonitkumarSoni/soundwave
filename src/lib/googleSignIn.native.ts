import Constants from 'expo-constants';
import { GoogleAuthProvider, signInWithCredential, reauthenticateWithCredential, type User } from 'firebase/auth';
import { auth } from './firebase';
let native: typeof import('@react-native-google-signin/google-signin').GoogleSignin | null = null;
async function getGoogleSignin() {
  if (Constants.executionEnvironment === 'storeClient') throw new Error('Google sign-in needs a development build. Use email and password to test in Expo Go.');
  if (!native) {
    native = (await import('@react-native-google-signin/google-signin')).GoogleSignin;
    native.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '514260576219-em1tjqq13ci3coffqqgkrrcrqie9noor.apps.googleusercontent.com' });
  }
  return native;
}
export async function signInGoogle() {
  const GoogleSignin = await getGoogleSignin();
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  if (!result.data?.idToken) throw new Error('Google sign-in was cancelled');
  return signInWithCredential(auth, GoogleAuthProvider.credential(result.data.idToken));
}
export const clearGoogleSession = async () => {
  if (Constants.executionEnvironment !== 'storeClient') await (await getGoogleSignin()).signOut();
};
export async function reauthenticateGoogle(user: User) {
  const GoogleSignin = await getGoogleSignin();
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  if (!result.data?.idToken) throw new Error('Google sign-in was cancelled');
  await reauthenticateWithCredential(user, GoogleAuthProvider.credential(result.data.idToken));
  await user.getIdToken(true);
}
