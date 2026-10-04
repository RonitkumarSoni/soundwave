import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
export const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const clearGoogleSession = async () => {};
