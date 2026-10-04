import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, gradients } from '@/theme/colors';
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, fetchSignInMethodsForEmail } from 'firebase/auth';

import { useAuthStore } from '@/stores/useAuthStore';

type Step = 'email' | 'password' | 'profile';

export default function SignupScreen() {
  const router = useRouter();
  const setAuthData = useAuthStore((s) => s.setAuthData);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (title: string, message: string) => {
    setErrorMsg(message);
  };

  const handleNextFromEmail = async () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      showError('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      try {
        const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
        if (methods && methods.length > 0) {
          showError('Account Exists', 'This email is already registered. Please log in instead.');
          setIsLoading(false);
          return;
        }
      } catch  {
        // If email enumeration protection is enabled in Firebase, proceed gracefully
      }
      setStep('password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextFromPassword = () => {
    const hasMinLength = password.length >= 8;
    const hasLetterAndNumber = /(?=.*[a-zA-Z])(?=.*[0-9])/.test(password);

    if (!hasMinLength || !hasLetterAndNumber) {
      showError('Weak Password', 'Please ensure your password meets all requirements.');
      return;
    }
    setStep('profile');
  };

  const handleSignup = async () => {
    if (!displayName.trim()) {
      showError('Missing Field', 'Please enter your name.');
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: displayName.trim() });

        // Pure Firebase Auth Flow: Bypass backend JWT exchange.
        const userProfile = {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          display_name: displayName.trim(),
          avatar_url: userCredential.user.photoURL || '',
          is_premium: false,
          oauth_provider: null,
        };

        await sendEmailVerification(userCredential.user);
        await setAuthData(userProfile, userCredential.user);
        Keyboard.dismiss();
        router.replace('/(auth)/verify-email');
      }
    } catch (err: any) {
      let errorMsg = 'Unable to create account right now. Please try again later.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email already exists. Please log in instead.';
        setStep('email');
      }
      showError('Sign Up Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[gradients.background[0], gradients.background[1], gradients.background[2]]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setErrorMsg(null);
            if (step === 'profile') setStep('password');
            else if (step === 'password') setStep('email');
            else {
              if (router.canGoBack()) {
                router.back();
              } else {
                Keyboard.dismiss();
                router.replace('/(auth)/welcome');
              }
            }
          }}
        >
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create account</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, step === 'email' && styles.progressActive]} />
        <View style={[styles.progressBar, step === 'password' && styles.progressActive]} />
        <View style={[styles.progressBar, step === 'profile' && styles.progressActive]} />
      </View>

      <View style={styles.content}>
        {step === 'email' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your email?</Text>
            <View style={[styles.inputContainer, errorMsg ? styles.inputErrorBorder : null]}>
              <TextInput autoComplete="off" importantForAutofill="noExcludeDescendants" textContentType="none"
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorMsg(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {errorMsg ? (
              <Text style={styles.errorTextSimple}>{errorMsg}</Text>
            ) : (
              <Text style={styles.helperText}>You'll need to confirm this email later.</Text>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={handleNextFromEmail} disabled={isLoading}>
              <LinearGradient
                colors={[gradients.primary[0], gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextButtonText}>Next</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'password' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Create a password</Text>
            <View style={[styles.inputContainer, errorMsg ? styles.inputErrorBorder : null]}>
              <TextInput autoComplete="off" importantForAutofill="noExcludeDescendants" textContentType="none"
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMsg(null); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <Text style={styles.errorTextSimple}>{errorMsg}</Text>
            ) : null}

            <PasswordStrengthBar password={password} />

            <TouchableOpacity style={styles.nextButton} onPress={handleNextFromPassword}>
              <LinearGradient
                colors={[gradients.primary[0], gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'profile' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <View style={[styles.inputContainer, errorMsg ? styles.inputErrorBorder : null]}>
              <TextInput autoComplete="off" importantForAutofill="noExcludeDescendants" textContentType="none"
                style={styles.input}
                placeholder="Display name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={displayName}
                onChangeText={(text) => { setDisplayName(text); setErrorMsg(null); }}
              />
            </View>

            {errorMsg ? (
              <Text style={styles.errorTextSimple}>{errorMsg}</Text>
            ) : (
              <Text style={styles.helperText}>This appears on your profile.</Text>
            )}

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By tapping "Create account", you agree to the Soundwave Terms of Service and Privacy Policy.
              </Text>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleSignup} disabled={isLoading}>
              <LinearGradient
                colors={[gradients.primary[0], gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextButtonText}>Create account</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingRight: 32, // to offset back button and center title
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: colors.accentStart,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  helperText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 32,
  },
  nextButton: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    overflow: 'hidden',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  termsContainer: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  termsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  loginLink: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inputErrorBorder: {
    borderColor: '#D32F2F',
  },
  errorTextSimple: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 24,
    marginTop: -4,
  },
});
