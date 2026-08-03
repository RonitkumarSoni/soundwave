import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, gradients, spacing } from '@/theme/colors';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string }>({ visible: false, title: '', message: '' });

  const handleResetPassword = async () => {
    if (!email) {
      if (Platform.OS === 'web') {
        setAlertConfig({ visible: true, title: 'Missing Field', message: 'Please enter your email to receive a reset link.' });
      } else {
        Alert.alert('Missing Field', 'Please enter your email to receive a reset link.');
      }
      return;
    }
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
    } catch (err: any) {
      let errorMsg = 'Unable to send password reset email right now. Please try again later.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      if (Platform.OS === 'web') {
        setAlertConfig({ visible: true, title: 'Error', message: errorMsg });
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(auth)/login');
          }
        }}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="lock-closed" size={64} color="#FFF" />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {isSent 
              ? "We've sent a password reset link to your email."
              : "Enter your email address and we'll send you a link to reset your password."}
          </Text>
        </View>

        {!isSent ? (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleResetPassword} disabled={isLoading}>
              <LinearGradient
                colors={[gradients.primary[0], gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Send Reset Link</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/login');
            }
          }}>
            <LinearGradient
              colors={[gradients.primary[0], gradients.primary[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.loginButtonText}>Back to Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {Platform.OS === 'web' && alertConfig.visible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => setAlertConfig({ ...alertConfig, visible: false })}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginTop: 16 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 12, textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 16, height: '100%', outlineStyle: 'none' } as any,
  loginButton: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  gradientButton: { height: 56, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  alertBox: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
