import { getApp, getApps, initializeApp } from 'firebase/app';
export const firebaseApp = getApps().length ? getApp() : initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAbbYLvEOLNa7vdkhzQFADuIdDbIM85-ms',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'music-app-92cbb.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'music-app-92cbb',
  storageBucket: 'music-app-92cbb.firebasestorage.app',
  messagingSenderId: '514260576219',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:514260576219:android:ecbc4c367343823373e9fe',
});
