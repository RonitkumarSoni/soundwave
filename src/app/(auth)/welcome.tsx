import { signInGoogle } from '@/lib/googleSignIn';
import Toast from 'react-native-toast-message';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';

import { useAuthStore } from '@/stores/useAuthStore';






export default function WelcomeScreen() {
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const setAuthData = useAuthStore((s) => s.setAuthData);

  // Logo Pulse Animation
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleGoogleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const userCredential = await signInGoogle();

      const userProfile = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        display_name: userCredential.user.displayName || 'User',
        avatar_url: userCredential.user.photoURL || '',
        is_premium: false,
        oauth_provider: 'google',
      };

      await setAuthData(userProfile, userCredential.user);
      router.replace('/(home)');
    } catch {
      Toast.show({ type: 'error', text1: 'Sign-in failed', text2: 'Please check your connection and try again.' });
    } finally { setSigningIn(false); }
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#170B2E', '#2B1354', '#4B2079']}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle glow effect top left */}
        <View style={styles.glow} />
      </View>

      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.iconWrapper, animatedStyle]}>
            <Ionicons name="musical-note" size={60} color="#FFF" />
          </Animated.View>
          <Text style={styles.brandName}>Soundwave</Text>
          <Text style={styles.tagline}>Millions of songs.</Text>
          <Text style={styles.tagline}>Free on Soundwave.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.accentStart, colors.accentEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.signupButtonText}>Sign up free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            disabled={signingIn}
            onPress={handleGoogleLogin}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={24} color="#FFF" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>{signingIn ? 'Signing in…' : 'Continue with Google'}</Text>
          </TouchableOpacity>



          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glow: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accentStart,
    opacity: 0.15,
    filter: 'blur(50px)' as any, // Works on Web
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accentStart,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.accentStart,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  signupButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
  },
  socialIcon: {
    position: 'absolute',
    left: 20,
  },
  socialButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  loginText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
