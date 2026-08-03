import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, reload } from 'firebase/auth';

import { colors, gradients } from '@/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const email = auth.currentUser?.email || 'your email address';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleOpenEmail = () => {
    if (Platform.OS === 'web') {
      // Trying to guess based on domain
      if (email.includes('@gmail.com')) window.open('https://mail.google.com', '_blank');
      else if (email.includes('@outlook.com') || email.includes('@hotmail.com')) window.open('https://outlook.live.com', '_blank');
      else if (email.includes('@yahoo.com')) window.open('https://mail.yahoo.com', '_blank');
      else window.open('https://mail.google.com', '_blank'); // fallback
    } else {
      Linking.openURL('message://').catch(() => {
        Alert.alert('Error', 'Could not open email app.');
      });
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !auth.currentUser) return;
    try {
      setIsResending(true);
      await sendEmailVerification(auth.currentUser);
      setCooldown(60);
      if (Platform.OS === 'web') {
        alert('Verification email sent!');
      } else {
        Alert.alert('Sent!', 'A new verification email has been sent.');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to resend email';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    
    // We must reload the user to get the latest emailVerified status
    await reload(auth.currentUser);
    
    if (auth.currentUser.emailVerified) {
      router.replace('/onboarding');
    } else {
      const msg = "Your email hasn't been verified yet. Please check your inbox and click the verification link.";
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Not Verified', msg);
    }
  };

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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleOpenEmail}>
            <LinearGradient
              colors={[gradients.primary[0], gradients.primary[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.primaryButtonText}>Open Email App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleCheckVerification}>
            <Text style={styles.secondaryButtonText}>I've already verified</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.resendButton} 
          onPress={handleResend}
          disabled={cooldown > 0 || isResending}
        >
          <Text style={[styles.resendText, (cooldown > 0 || isResending) && styles.resendDisabled]}>
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
          </Text>
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
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  secondaryButtonText: {
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
