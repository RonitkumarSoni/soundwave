import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, gradients, spacing } from '@/theme/colors';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const setAuthData = useAuthStore((s) => s.setAuthData);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message });
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showError('Missing Fields', 'Please enter your email and password.');
      return;
    }
    
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      const firebaseIdToken = await userCredential.user.getIdToken();
      const data = await api.auth.firebaseLogin(firebaseIdToken);
      
      await setAuthData(data);
      router.replace('/(home)');
    } catch (err: any) {
      let errorMsg = 'Unable to log in right now. Please try again later.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Access disabled due to many failed login attempts. Try resetting your password.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      showError('Log In Failed', errorMsg);
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
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(auth)/welcome');
          }
        }}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Log in</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email or username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            <LinearGradient
              colors={[gradients.primary[0], gradients.primary[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Log In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  form: { gap: 8 },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    height: '100%',
    outlineStyle: 'none',
  } as any,
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  loginButton: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    overflow: 'hidden',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  signupLink: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
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
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  alertMessage: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24 },
  alertButton: { width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  alertButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
});
