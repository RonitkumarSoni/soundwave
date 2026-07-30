import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";
import { AppHeader } from "@/components/AppHeader";
import { FilterChips } from "@/components/FilterChips";
import { TrackRow } from "@/components/TrackRow";
import { TrackRowSkeleton } from "@/components/Skeletons";
import { libraryTabs } from "@/data/mockData";
import { api } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Track, usePlayerStore } from "@/stores/usePlayerStore";

type SortOrder = 'added' | 'az';

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>('added');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [optionsPlaylist, setOptionsPlaylist] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [updating, setUpdating] = useState(false);
  const insets = useSafeAreaInsets();
  const likedTracks = usePlayerStore((s) => s.likedTracks);
  const downloadedTracks = usePlayerStore((s) => s.downloadedTracks);
  const followedArtists = usePlayerStore((s) => s.followedArtists);
  const savedAlbums = usePlayerStore((s) => s.savedAlbums);
  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === "Liked Songs" || activeTab === "All") {
        setTracks(likedTracks);
      } else if (activeTab === "Downloads") {
        setTracks(downloadedTracks);
      } else if (activeTab === "Recently Played") {
        setTracks(recentlyPlayed);
      } else {
        setTracks([]);
      }
      
      if (activeTab === "Playlists" || activeTab === "All") {
        try {
          const res = await api.playlists.getAll();
          setPlaylists(res || []);
        } catch (e) {
          console.error("Failed to load playlists", e);
        }
      } else {
        setPlaylists([]);
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab, likedTracks, downloadedTracks, recentlyPlayed]);

  const sortedTracks = React.useMemo(() => {
    let result = [...tracks];
    if (searchQuery.trim()) {
      result = result.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.artist_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (sortOrder === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [tracks, sortOrder, searchQuery]);

  const sortedPlaylists = React.useMemo(() => {
    let result = [...playlists];
    if (searchQuery.trim()) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (sortOrder === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [playlists, sortOrder, searchQuery]);

  const sortedArtists = React.useMemo(() => {
    let result = [...followedArtists];
    if (searchQuery.trim()) {
      result = result.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (sortOrder === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [followedArtists, sortOrder, searchQuery]);

  const sortedAlbums = React.useMemo(() => {
    let result = [...savedAlbums];
    if (searchQuery.trim()) {
      result = result.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (sortOrder === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [savedAlbums, sortOrder, searchQuery]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    try {
      const res = await api.playlists.create(newPlaylistName.trim());
      setPlaylists([...playlists, res]);
      setShowCreateModal(false);
      setNewPlaylistName("");
    } catch (e) {
      console.error("Failed to create playlist", e);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePlaylist = async () => {
    if (!optionsPlaylist || !editPlaylistName.trim()) return;
    setUpdating(true);
    try {
      const res = await api.playlists.update(optionsPlaylist.id, editPlaylistName.trim());
      setPlaylists(playlists.map(p => p.id === optionsPlaylist.id ? { ...p, title: res.title } : p));
      setShowEditModal(false);
      setOptionsPlaylist(null);
    } catch (e) {
      console.error("Failed to update playlist", e);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!optionsPlaylist) return;
    try {
      await api.playlists.delete(optionsPlaylist.id);
      setPlaylists(playlists.filter(p => p.id !== optionsPlaylist.id));
      setOptionsPlaylist(null);
    } catch (e) {
      console.error("Failed to delete playlist", e);
    }
  };

  const getSortedData = (data: any[]) => {
    let filtered = data;
    if (searchQuery.trim().length > 0) {
      filtered = data.filter(item => {
        const name = (item.name || item.title || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      });
    }

    if (sortOrder === 'added') return filtered;
    return [...filtered].sort((a, b) => {
      const nameA = a.name || a.title || '';
      const nameB = b.name || b.title || '';
      return nameA.localeCompare(nameB);
    });
  };

  return (
    <LinearGradient
      colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xl,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ position: 'relative' }}>
          <AppHeader mode="plain" title="Your library" />
          <TouchableOpacity 
            style={[styles.sortButton, { position: 'absolute', right: spacing.lg, bottom: spacing.md }]} 
            onPress={() => setSortOrder(prev => prev === 'added' ? 'az' : 'added')}
          >
            <Ionicons name={sortOrder === 'added' ? 'time-outline' : 'text-outline'} size={18} color={colors.label} />
            <Text style={styles.sortButtonText}>{sortOrder === 'added' ? 'Recent' : 'A-Z'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.secondaryLabel} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in Library..."
            placeholderTextColor={colors.secondaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.secondaryLabel} />
            </TouchableOpacity>
          )}
        </View>

        <FilterChips
          chips={libraryTabs}
          activeChip={activeTab}
          onSelect={setActiveTab}
        />

        {loading ? (
          <View style={{ marginTop: 20 }}>
            <TrackRowSkeleton />
            <TrackRowSkeleton />
            <TrackRowSkeleton />
            <TrackRowSkeleton />
            <TrackRowSkeleton />
          </View>
        ) : (
          <>
            {(activeTab === "Playlists" || activeTab === "All") && (
              <View style={styles.section}>
                {activeTab === "Playlists" && (
                  <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
                    <Text style={styles.createButtonText}>+ Create New Playlist</Text>
                  </TouchableOpacity>
                )}
                {sortedPlaylists.map((playlist) => (
                  <TouchableOpacity 
                    key={playlist.id} 
                    style={styles.playlistItem}
                    onPress={() => router.push(`/playlist/${playlist.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName}>{playlist.title}</Text>
                      <Text style={styles.playlistSub}>{playlist.track_count || 0} tracks</Text>
                    </View>
                    <TouchableOpacity 
                      style={{ padding: spacing.sm }}
                      onPress={() => setOptionsPlaylist(playlist)}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={colors.secondaryLabel} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(activeTab === "Artists" || activeTab === "All") && sortedArtists.map((artist) => (
              <TouchableOpacity key={artist.id} style={styles.playlistItem} onPress={() => router.push(`/artist/${artist.id}`)}>
                <Text style={styles.playlistName}>{artist.name}</Text>
              </TouchableOpacity>
            ))}

            {(activeTab === "Albums" || activeTab === "All") && sortedAlbums.map((album) => (
              <TouchableOpacity key={album.id} style={styles.playlistItem} onPress={() => router.push(`/album/${album.id}`)}>
                <Text style={styles.playlistName}>{album.name}</Text>
              </TouchableOpacity>
            ))}

            {(activeTab === "Liked Songs" || activeTab === "Downloads" || activeTab === "Recently Played" || activeTab === "All") && sortedTracks.length > 0 && (
              <View style={styles.section}>
                {sortedTracks.map((track, index) => (
                  <TrackRow key={`${track.id}-${index}`} track={track} index={index} showDuration contextQueue={sortedTracks} />
                ))}
              </View>
            )}
            
            {(activeTab !== "Playlists" && activeTab !== "Artists" && activeTab !== "Albums" && sortedTracks.length === 0) && (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {activeTab === "Downloads" ? "No downloaded tracks yet." : 
                   activeTab === "Recently Played" ? "No recently played tracks." : "No liked songs yet."}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist Name"
              placeholderTextColor={colors.tertiaryLabel}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: 'transparent' }]} 
                onPress={() => setShowCreateModal(false)}
                disabled={creating}
              >
                <Text style={[styles.modalBtnText, { color: colors.secondaryLabel }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={handleCreatePlaylist}
                disabled={creating || !newPlaylistName.trim()}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal visible={!!optionsPlaylist && !showEditModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOptionsPlaylist(null)}>
          <View style={[styles.modalContent, { marginTop: 'auto', marginBottom: insets.bottom + spacing.lg }]}>
            <Text style={styles.modalTitle}>{optionsPlaylist?.title}</Text>
            <TouchableOpacity 
              style={styles.optionRow}
              onPress={() => {
                setEditPlaylistName(optionsPlaylist?.title || "");
                setShowEditModal(true);
              }}
            >
              <Ionicons name="pencil-outline" size={24} color={colors.label} />
              <Text style={styles.optionText}>Edit Playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionRow}
              onPress={handleDeletePlaylist}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error || '#FF3B30'} />
              <Text style={[styles.optionText, { color: colors.error || '#FF3B30' }]}>Delete Playlist</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist Name"
              placeholderTextColor={colors.tertiaryLabel}
              value={editPlaylistName}
              onChangeText={setEditPlaylistName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: 'transparent' }]} 
                onPress={() => {
                  setShowEditModal(false);
                  setOptionsPlaylist(null);
                }}
                disabled={updating}
              >
                <Text style={[styles.modalBtnText, { color: colors.secondaryLabel }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={handleUpdatePlaylist}
                disabled={updating || !editPlaylistName.trim()}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortButtonText: {
    color: colors.label,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  playlistContainer: {
    paddingHorizontal: spacing.lg,
  },
  createButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
  },
  createButtonText: {
    color: colors.label,
    fontSize: 16,
    fontWeight: '500',
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  playlistInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playlistName: {
    color: colors.label,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  playlistSub: {
    color: colors.secondaryLabel,
    fontSize: 13,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.label,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: spacing.md,
    color: colors.label,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  optionText: {
    fontSize: 16,
    color: colors.label,
    fontWeight: '500',
  },
});
