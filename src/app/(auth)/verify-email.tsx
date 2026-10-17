import { useAuthStore } from '@/stores/useAuthStore';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { auth } from '@/lib/firebase';
import { reload } from 'firebase/auth';

import { colors, gradients } from '@/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const email = auth.currentUser?.email || 'your email address';
  const checking = useRef(false);

  const checkVerification = useCallback(async (showResult = false) => {
    const user = auth.currentUser;
    if (!user || checking.current) return;
    checking.current = true;
    try {
      await reload(user);
      if (!auth.currentUser?.emailVerified) {
        if (showResult) Toast.show({ type: 'error', text1: 'Not verified yet', text2: 'Open the verification link sent to this email, then try again.' });
        return;
      }
      await auth.currentUser.getIdToken(true);
      await useAuthStore.getState().syncUser(auth.currentUser);
      router.replace('/onboarding');
    } catch {
      if (showResult) Toast.show({ type: 'error', text1: 'Could not check verification', text2: 'Check your connection and try again.' });
    } finally {
      checking.current = false;
    }
  }, [router]);

  useEffect(() => {
    void checkVerification();
    const interval = setInterval(() => void checkVerification(), 3000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkVerification();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkVerification]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[gradients.background[0], gradients.background[1], gradients.background[2]]} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.accentStart, colors.accentEnd]}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="mail-unread-outline" size={60} color="#FFF" />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.waitingText}>After verification, you&apos;ll continue automatically.</Text>

        <TouchableOpacity style={styles.continueButton} onPress={() => void checkVerification(true)}>
          <Text style={styles.continueButtonText}>I&apos;ve verified — continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={async () => { await useAuthStore.getState().logout(); router.replace('/(auth)/welcome'); }}>
          <Text style={styles.resendText}>Use a different account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  emailText: {
    color: '#FFF',
    fontWeight: '700',
  },
  waitingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    padding: 16,
  },
  resendText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resendDisabled: {
    color: 'rgba(255,255,255,0.3)',
  }
});
