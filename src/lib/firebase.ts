import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAbbYLvEOLNa7vdkhzQFADuIdDbIM85-ms",
  authDomain: "music-app-92cbb.firebaseapp.com",
  projectId: "music-app-92cbb",
  storageBucket: "music-app-92cbb.firebasestorage.app",
  messagingSenderId: "514260576219",
  appId: "1:514260576219:android:ecbc4c367343823373e9fe" // Using Android App ID for now, will work for API calls
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
