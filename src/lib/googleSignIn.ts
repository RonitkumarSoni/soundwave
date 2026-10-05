import { GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup, type User } from 'firebase/auth';
import { auth } from './firebase';
export const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const clearGoogleSession = async () => {};
export async function reauthenticateGoogle(user: User) {
  await reauthenticateWithPopup(user, new GoogleAuthProvider());
  await user.getIdToken(true);
}
