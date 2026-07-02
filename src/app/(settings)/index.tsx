import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { colors, spacing } from '@/theme/colors';
import { BlurView } from 'expo-blur';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const settings = useSettingsStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  useEffect(() => {
    settings.loadFromStorage();
  }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutConfirm(true);
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderRow = (
    icon: any,
    title: string,
    subtitle?: string,
    trailing?: React.ReactNode,
    onPress?: () => void,
    destructive?: boolean
  ) => {
    const content = (
      <View style={styles.row}>
        <View style={[styles.iconContainer, destructive && { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
          <Ionicons name={icon} size={20} color={destructive ? '#FF3B30' : '#FFF'} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, destructive && { color: '#FF3B30' }]}>{title}</Text>
          {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
        {trailing}
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
          {content}
        </TouchableOpacity>
      );
    }
    return content;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#170B2E", "#0A0514"]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        
        {/* Profile Section */}
        {renderSectionHeader('Profile')}
        <View style={styles.card}>
          {renderRow(
            'person-circle-outline', 
            user?.display_name || 'User', 
            user?.email, 
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />,
            () => Alert.alert('Edit Profile', 'Profile editing coming soon')
          )}
        </View>

        {/* Playback Section */}
        {renderSectionHeader('Playback')}
        <View style={styles.card}>
          {renderRow(
            'options-outline', 
            'Audio Quality', 
            settings.audioQuality.toUpperCase(),
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          )}
          <View style={styles.divider} />
          {renderRow(
            'infinite-outline', 
            'Gapless Playback', 
            'Play consecutive tracks seamlessly',
            <Switch 
              value={settings.gaplessPlayback} 
              onValueChange={(v) => settings.updateSetting('gaplessPlayback', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
          <View style={styles.divider} />
          {renderRow(
            'volume-high-outline', 
            'Normalize Volume', 
            'Keep all songs at the same volume level',
            <Switch 
              value={settings.normalizeVolume} 
              onValueChange={(v) => settings.updateSetting('normalizeVolume', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
        </View>

        {/* Notifications Section */}
        {renderSectionHeader('Notifications')}
        <View style={styles.card}>
          {renderRow(
            'notifications-outline', 
            'Push Notifications', 
            undefined,
            <Switch 
              value={settings.pushNotifications} 
              onValueChange={(v) => settings.updateSetting('pushNotifications', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
          <View style={styles.divider} />
          {renderRow(
            'musical-note-outline', 
            'New Music Alerts', 
            'Get notified about new releases',
            <Switch 
              value={settings.newMusicAlerts} 
              onValueChange={(v) => settings.updateSetting('newMusicAlerts', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
        </View>

        {/* Account Section */}
        {renderSectionHeader('Account')}
        <View style={styles.card}>
          {renderRow(
            'log-out-outline', 
            'Log Out', 
            undefined, 
            undefined, 
            handleLogout, 
            true
          )}
        </View>

        <Text style={styles.version}>Soundwave v1.0.0</Text>
      </ScrollView>

      {/* Custom Logout Confirm Modal for Web */}
      {Platform.OS === 'web' && showLogoutConfirm && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Log Out</Text>
            <Text style={styles.alertMessage}>Are you sure you want to log out?</Text>
            <View style={styles.alertButtons}>
              <TouchableOpacity style={styles.alertButtonCancel} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.alertButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertButtonConfirm} onPress={() => { setShowLogoutConfirm(false); logout(); }}>
                <Text style={styles.alertButtonTextConfirm}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    marginLeft: spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  rowSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 70,
  },
  version: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
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
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  alertButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  alertButtonTextCancel: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  alertButtonTextConfirm: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
