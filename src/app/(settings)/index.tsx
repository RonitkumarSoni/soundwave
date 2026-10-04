import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { colors, spacing } from '@/theme/colors';
import { api } from '@/lib/api';
import { clearAccountStorage } from '@/lib/accountStorage';
import { deleteDownload, cancelDownloads } from '@/services/downloadService';
import Toast from 'react-native-toast-message';
import { CustomDialog } from '@/components/CustomDialog';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const settings = useSettingsStore();
  const downloadedTracks = usePlayerStore(state => state.downloadedTracks);
  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [editName, setEditName] = React.useState(user?.display_name || '');
  const [updatingProfile, setUpdatingProfile] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState<{ visible: boolean; title: string; message: string; confirmText?: string; isDestructive?: boolean; onConfirm: () => void } | null>(null);


  const handleLogout = () => {
    setDialogConfig({
      visible: true,
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      isDestructive: true,
      onConfirm: () => logout()
    });
  };

  const handleDeleteAccount = () => {
    setDialogConfig({
      visible: true,
      title: 'Delete Account',
      message: 'Are you sure you want to permanently delete your account? This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        const uid = useAuthStore.getState().firebaseUser?.uid;
        try {
          await api.auth.deleteAccount();
          cancelDownloads();
          const downloads = usePlayerStore.getState().downloadedTracks;
          await Promise.allSettled(downloads.map(deleteDownload));
          await logout();
          if (uid) await clearAccountStorage(uid);
        } catch (error: any) {
          Toast.show({ type: "error", text1: "Account deletion failed", text2: error?.response?.status === 401 ? "Sign out and sign in again, then retry deletion." : "Check your connection and retry." });
        }
      }
    });
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
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update profile' });
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
    const unsupported = ["Gapless Playback", "Crossfade", "Normalize Volume", "Push Notifications", "New Music Alerts", "Theme", "Language", "Car Mode"].includes(title);
    if (unsupported) { subtitle = "Currently unavailable"; trailing = undefined; onPress = undefined; }
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
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />,
            () => {
              const choices = ["auto", "low", "normal", "high"] as const;
              settings.updateSetting("audioQuality", choices[(choices.indexOf(settings.audioQuality) + 1) % choices.length]);
            }
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
            'Play downloaded audio and show your offline library',
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
            `${(downloadedTracks.reduce((bytes, track) => bytes + (track.fileSize || 0), 0) / (1024 * 1024)).toFixed(1)} MB used by downloaded tracks`,
            undefined,
            () => {
              setDialogConfig({
                visible: true,
                title: 'Clear Downloads',
                message: 'Remove all downloaded tracks from your device?',
                confirmText: 'Clear',
                isDestructive: true,
                onConfirm: async () => {
                  cancelDownloads();
                  for (const track of [...usePlayerStore.getState().downloadedTracks]) await usePlayerStore.getState().toggleDownload(track);
                }
              });
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

      {/* Custom Dialog Modal */}
      {dialogConfig && (
        <CustomDialog
          visible={dialogConfig.visible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          isDestructive={dialogConfig.isDestructive}
          onCancel={() => setDialogConfig(null)}
          onConfirm={() => {
            setDialogConfig(null);
            dialogConfig.onConfirm();
          }}
        />
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
