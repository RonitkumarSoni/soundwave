import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { colors, spacing } from '@/theme/colors';
import { api } from '@/lib/api';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const settings = useSettingsStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [editName, setEditName] = React.useState(user?.display_name || '');
  const [updatingProfile, setUpdatingProfile] = React.useState(false);

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

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
        api.auth.deleteAccount().then(() => logout());
      }
    } else {
      Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account? This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          api.auth.deleteAccount().then(() => logout());
        } },
      ]);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setUpdatingProfile(true);
    try {
      const updatedUser = await api.auth.updateProfile(editName.trim());
      useAuthStore.setState({ user: { ...user, ...updatedUser } as any });
      setShowEditProfile(false);
    } catch (e) {
      console.error('Failed to update profile', e);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
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
        style={StyleSheet.absoluteFill}
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
            () => {
              setEditName(user?.display_name || '');
              setShowEditProfile(true);
            }
          )}
          <View style={styles.divider} />
          {renderRow(
            'eye-outline', 
            'View Public Profile', 
            'See how others view your profile', 
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />,
            () => {
              router.push('/profile');
            }
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
            'swap-horizontal-outline', 
            'Crossfade', 
            `Duration: ${settings.crossfadeDuration}s`,
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Switch 
                value={settings.crossfadeEnabled} 
                onValueChange={(v) => settings.updateSetting('crossfadeEnabled', v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
              />
              <TouchableOpacity onPress={() => settings.updateSetting('crossfadeDuration', Math.max(1, settings.crossfadeDuration - 1))}>
                <Ionicons name="remove-circle-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => settings.updateSetting('crossfadeDuration', Math.min(12, settings.crossfadeDuration + 1))}>
                <Ionicons name="add-circle-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
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

        {/* Downloads Section */}
        {renderSectionHeader('Downloads')}
        <View style={styles.card}>
          {renderRow(
            'download-outline', 
            'Download Quality', 
            settings.downloadQuality === 'normal' ? 'Normal' : 'High',
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />,
            () => settings.updateSetting('downloadQuality', settings.downloadQuality === 'normal' ? 'high' : 'normal')
          )}
          <View style={styles.divider} />
          {renderRow(
            'wifi-outline', 
            'Download over Wi-Fi only', 
            undefined,
            <Switch 
              value={settings.downloadWifiOnly} 
              onValueChange={(v) => settings.updateSetting('downloadWifiOnly', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
          <View style={styles.divider} />
          {renderRow(
            'list-outline', 
            'Manage Downloads', 
            'View and manage your downloaded tracks',
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />,
            () => router.push('/downloads')
          )}
        </View>

        {/* Preferences Section */}
        {renderSectionHeader('Preferences')}
        <View style={styles.card}>
          {renderRow(
            'color-palette-outline', 
            'Theme', 
            settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1),
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />,
            () => {
              const themes: any[] = ['dark', 'light', 'system'];
              const next = themes[(themes.indexOf(settings.theme) + 1) % themes.length];
              settings.updateSetting('theme', next);
            }
          )}
          <View style={styles.divider} />
          {renderRow(
            'language-outline', 
            'Language', 
            settings.language === 'en' ? 'English' : settings.language === 'hi' ? 'Hindi' : 'Auto',
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />,
            () => {
              const langs: any[] = ['en', 'hi', 'auto'];
              const next = langs[(langs.indexOf(settings.language) + 1) % langs.length];
              settings.updateSetting('language', next);
            }
          )}
          <View style={styles.divider} />
          {renderRow(
            'videocam-outline', 
            'Canvas', 
            'Display short looping visuals on tracks',
            <Switch 
              value={settings.canvasEnabled} 
              onValueChange={(v) => settings.updateSetting('canvasEnabled', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
          <View style={styles.divider} />
          {renderRow(
            'car-outline', 
            'Car Mode', 
            'Simplified player UI for safe driving',
            <Switch 
              value={settings.carMode} 
              onValueChange={(v) => settings.updateSetting('carMode', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
        </View>

        {/* Storage & Data Section */}
        {renderSectionHeader('Storage & Data')}
        <View style={styles.card}>
          {renderRow(
            'cellular-outline', 
            'Data Saver', 
            'Sets audio quality to low and disables Canvas',
            <Switch 
              value={settings.dataSaver} 
              onValueChange={(v) => {
                settings.updateSetting('dataSaver', v);
                if (v) {
                  settings.updateSetting('audioQuality', 'low');
                  settings.updateSetting('canvasEnabled', false);
                }
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
          <View style={styles.divider} />
          {renderRow(
            'cloud-offline-outline', 
            'Offline Mode', 
            'Only show downloaded tracks, block network access',
            <Switch 
              value={settings.offlineMode} 
              onValueChange={(v) => settings.updateSetting('offlineMode', v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentStart }}
            />
          )}
          <View style={styles.divider} />
          {renderRow(
            'server-outline', 
            'Clear Downloads', 
            `${usePlayerStore(s => s.downloadedTracks).length * 5} MB used by downloaded tracks`,
            undefined,
            () => {
              if (Platform.OS === 'web') {
                if (window.confirm('Clear all downloaded tracks?')) {
                  usePlayerStore.setState({ downloadedTracks: [] });
                }
              } else {
                Alert.alert('Clear Downloads', 'Remove all downloaded tracks from your device?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => usePlayerStore.setState({ downloadedTracks: [] }) },
                ]);
              }
            }
          )}
        </View>

        {/* About Section */}
        {renderSectionHeader('About')}
        <View style={styles.card}>
          {renderRow(
            'information-circle-outline', 
            'About Soundwave', 
            'Version 1.0.0', 
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />, 
            () => router.push('/(settings)/about')
          )}
          <View style={styles.divider} />
          {renderRow(
            'shield-checkmark-outline', 
            'Privacy Policy', 
            undefined, 
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />, 
            () => router.push('/(settings)/privacy')
          )}
          <View style={styles.divider} />
          {renderRow(
            'document-text-outline', 
            'Terms & Conditions', 
            undefined, 
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />, 
            () => router.push('/(settings)/terms')
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
          <View style={styles.divider} />
          {renderRow(
            'trash-outline', 
            'Delete Account', 
            'Permanently delete your account', 
            undefined, 
            handleDeleteAccount, 
            true
          )}
        </View>
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

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Display Name"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: 'transparent' }]} 
                onPress={() => setShowEditProfile(false)}
                disabled={updatingProfile}
              >
                <Text style={[styles.modalBtnText, { color: 'rgba(255,255,255,0.6)' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={handleUpdateProfile}
                disabled={updatingProfile || !editName.trim()}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: spacing.md,
    color: '#FFF',
    fontSize: 16,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalBtn: {
    backgroundColor: colors.accentSolid,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
