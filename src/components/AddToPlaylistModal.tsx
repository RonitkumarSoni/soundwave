import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/theme/colors';
import { Track, usePlayerStore, CustomPlaylist } from '@/stores/usePlayerStore';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  track: Track | null;
}

export function AddToPlaylistModal({ visible, onClose, track }: AddToPlaylistModalProps) {
  const customPlaylists = usePlayerStore((s) => s.customPlaylists);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const addTrackToPlaylist = usePlayerStore((s) => s.addTrackToPlaylist);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleAddTrack = (playlist: CustomPlaylist) => {
    if (track) {
      addTrackToPlaylist(playlist.id, track);
      Alert.alert('Added', `Added to ${playlist.name}`);
      onClose();
    }
  };

  const handleCreateAndAdd = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name.');
      return;
    }
    
    createPlaylist(newPlaylistName.trim(), '');
    
    setTimeout(() => {
      const updatedPlaylists = usePlayerStore.getState().customPlaylists;
      const created = updatedPlaylists.find(p => p.name === newPlaylistName.trim());
      if (created && track) {
        addTrackToPlaylist(created.id, track);
        Alert.alert('Success', `Playlist created and track added!`);
        setNewPlaylistName('');
        setIsCreating(false);
        onClose();
      }
    }, 100);
  };

  const renderItem = ({ item }: { item: CustomPlaylist }) => (
    <TouchableOpacity 
      style={styles.playlistItem}
      onPress={() => handleAddTrack(item)}
    >
      <View style={styles.playlistIcon}>
        <Ionicons name="musical-notes-outline" size={24} color="#FFF" />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.playlistCount}>{item.tracks.length} tracks</Text>
      </View>
      <Feather name="plus" size={24} color={colors.accentSolid} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Playlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {isCreating ? (
            <View style={styles.createSection}>
              <TextInput
                style={styles.input}
                placeholder="Playlist Name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <View style={styles.createActions}>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnCancel]} 
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnSave]} 
                  onPress={handleCreateAndAdd}
                >
                  <Text style={[styles.btnText, { color: '#FFF' }]}>Create & Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.createNewBtn}
                onPress={() => setIsCreating(true)}
              >
                <View style={[styles.playlistIcon, { backgroundColor: colors.accentSolid }]}>
                  <Feather name="plus" size={24} color="#FFF" />
                </View>
                <Text style={styles.createNewText}>Create New Playlist</Text>
              </TouchableOpacity>

              <FlatList
                data={customPlaylists}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No custom playlists yet.</Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'rgba(20, 20, 25, 0.4)',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  createNewText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  playlistName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  createSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: '#FFF',
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  btn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnSave: {
    backgroundColor: colors.accentSolid,
  },
  btnText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  }
});
