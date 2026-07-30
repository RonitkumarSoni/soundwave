import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Soundwave</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Feather name="music" size={48} color={colors.accentSolid} />
          </View>
          <Text style={styles.appName}>Soundwave</Text>
          <Text style={styles.versionText}>Version 1.0.0 (Build 42)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.bodyText}>
            Welcome to Soundwave! These terms and conditions outline the rules and regulations for the use of the Soundwave App. 
            By accessing this app, we assume you accept these terms and conditions. Do not continue to use Soundwave if you do not agree to take all of the terms and conditions stated on this page.
          </Text>
          <Text style={styles.bodyText}>
            The app and its original content, features, and functionality are and will remain the exclusive property of Soundwave Studios and its licensors.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.bodyText}>
            Your privacy is critically important to us. At Soundwave, we have a few fundamental principles:
          </Text>
          <Text style={styles.listItem}>• We don't ask you for personal information unless we truly need it.</Text>
          <Text style={styles.listItem}>• We don't share your personal information with anyone except to comply with the law, develop our products, or protect our rights.</Text>
          <Text style={styles.listItem}>• We don't store personal information on our servers unless required for the on-going operation of our services.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Source Licenses</Text>
          <Text style={styles.bodyText}>
            Soundwave is built using amazing open-source projects including React Native, Expo, Zustand, and many more. We are grateful to the open-source community for their invaluable contributions.
          </Text>
        </View>

        <Text style={styles.footerText}>© 2026 Soundwave Studios. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0514' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 14,
    color: colors.secondaryLabel,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: spacing.md,
  },
  bodyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  listItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    marginLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.tertiaryLabel,
    marginTop: spacing.xl,
  }
});
