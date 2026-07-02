import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { colors, gradients, spacing } from '@/theme/colors';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const setAuthData = useAuthStore((s) => s.setAuthData);
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '394758762438-q309rh1p5afvp52srr5nrc6lt3tepsfl.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignup(id_token);
    }
  }, [response]);

  const handleGoogleSignup = async (idToken: string) => {
    try {
      setIsLoading(true);
      const data = await api.auth.googleLogin(idToken);
      await setAuthData(data);
      router.replace('/(home)');
    } catch (err: any) {
      let errorMsg = 'Unable to connect to our servers right now. Please try again later.';
      const msg = err.response?.data?.message;
      if (msg && typeof msg === 'string' && !msg.startsWith('<') && !msg.startsWith('Cannot ')) {
        errorMsg = msg;
      } else if (Array.isArray(msg)) {
        errorMsg = msg.join(', ');
      }
      if (Platform.OS === 'web') window.alert('Sign Up Failed\n\n' + errorMsg);
      else Alert.alert('Sign Up Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      setIsLoading(true);
      const data = await api.auth.signup(email, password, displayName);
      await setAuthData(data);
      router.replace('/(home)');
    } catch (err: any) {
      let errorMsg = 'Unable to connect to our servers right now. Please try again later.';
      if (err.response?.status === 409) {
        errorMsg = 'An account with this email already exists. Please log in instead.';
      } else {
        const msg = err.response?.data?.message;
        if (msg && typeof msg === 'string' && !msg.startsWith('<') && !msg.startsWith('Cannot ')) {
          errorMsg = msg;
        } else if (Array.isArray(msg)) {
          errorMsg = msg.join(', ');
        }
      }
      if (Platform.OS === 'web') window.alert('Sign Up Failed\n\n' + errorMsg);
      else Alert.alert('Sign Up Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#7D5598", "#50568B", "#2E517E"]}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={isLoading}>
            <LinearGradient
              colors={[gradients.primary[0], gradients.primary[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={() => promptAsync()}
            disabled={!request || isLoading}
          >
            <Ionicons name="logo-google" size={20} color="#FFF" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'center' },
  header: { alignItems: 'flex-start', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 16, height: '100%', outlineStyle: 'none' } as any,
  signupButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  gradientButton: { height: 56, justifyContent: 'center', alignItems: 'center' },
  signupButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: 'rgba(255,255,255,0.5)', paddingHorizontal: 16, fontSize: 14 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  googleIcon: { marginRight: 12 },
  googleButtonText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  footerLink: { color: colors.accentStart, fontSize: 14, fontWeight: '600' },
});
