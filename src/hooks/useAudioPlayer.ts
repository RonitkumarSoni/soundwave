import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import { usePlayerStore, Track } from "@/stores/usePlayerStore";

const isWeb = Platform.OS === "web";

export let soundInstance: Audio.Sound | null = null;

export const seekGlobalAudio = async (position: number) => {
  const { currentTrack, setProgress } = usePlayerStore.getState();
  setProgress(position);
  if (currentTrack && soundInstance) {
    const durationMs = currentTrack.duration * 1000;
    await soundInstance.setPositionAsync(position * durationMs);
  }
};

export function useAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTimeMs,
    repeatMode,
    playbackRate,
    setTrack,
    togglePlay,
    play,
    pause,
    setProgress,
    setCurrentTime,
    nextTrack,
    prevTrack,
  } = usePlayerStore();

  // Initialize audio session on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.warn("Failed to set audio mode", e);
      }
    };
    initAudio();
    
    return () => {
      if (soundInstance) {
        soundInstance.unloadAsync();
        soundInstance = null;
      }
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadNewTrack = async () => {
      if (!currentTrack) {
        if (soundInstance) {
          await soundInstance.unloadAsync();
          soundInstance = null;
        }
        return;
      }
      
      // Determine correct audio URL based on source
      let audioUri = "";
      
      if (currentTrack.source === 'deezer') {
        audioUri = currentTrack.audio;
      } else if (currentTrack.source === 'spotify') {
        if (currentTrack.audio) {
          audioUri = currentTrack.audio;
        } else {
          console.error("Spotify track does not have audio preview available.");
          return;
        }
      } else {
        // Fallback for Jamendo and others
        audioUri = currentTrack.audiodownload || currentTrack.audio;
      }

      if (!audioUri) {
        console.error("Error loading audio: track has no audio URL", currentTrack);
        return;
      }
      
      // Automatic Song Caching Logic
      if (!isWeb) {
        try {
          const FileSystem = require('expo-file-system');
          const CACHE_DIR = `${FileSystem.documentDirectory}audio_cache/`;
          await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true }).catch(() => {});
          
          const filename = `${currentTrack.id}_${currentTrack.source || 'default'}.m4a`;
          const fileUri = `${CACHE_DIR}${filename}`;
          
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists) {
            audioUri = fileUri; // Play from local cache
          } else {
            // Start background download for future plays
            FileSystem.downloadAsync(audioUri, fileUri).catch((e: any) => console.log('Cache download failed', e));
          }
        } catch (e) {
          console.log('Caching setup failed:', e);
        }
      }

      try {
        if (soundInstance) {
          await soundInstance.unloadAsync();
          soundInstance = null;
        }
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: isPlaying, rate: playbackRate, shouldCorrectPitch: true }
        );

        if (isCancelled) {
          // If a new track was selected while this one was loading, unload and discard it
          await sound.unloadAsync();
          return;
        }

        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        soundInstance = sound;
      } catch (error: any) {
        console.warn("Error loading audio:", error);
        // Pause playback so UI reflects that the track is not playing
        usePlayerStore.getState().pause();
      }
    };
    
    loadNewTrack();

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id]); // Only re-run when track ID changes

  // Update native loop mode when repeatMode changes
  useEffect(() => {
    const updateLoop = async () => {
      if (soundInstance) {
        await soundInstance.setIsLoopingAsync(repeatMode === "one");
      }
    };
    updateLoop();
  }, [repeatMode]);

  // Update playback rate when it changes
  useEffect(() => {
    const updateRate = async () => {
      if (soundInstance) {
        await soundInstance.setRateAsync(playbackRate, true);
      }
    };
    updateRate();
  }, [playbackRate]);

  // Handle play/pause state changes from store
  useEffect(() => {
    const updatePlayState = async () => {
      try {
        if (!soundInstance) return;
        const status = await soundInstance.getStatusAsync();
        if (!status.isLoaded) return;
        
        if (isPlaying) {
          await soundInstance.playAsync();
        } else {
          await soundInstance.pauseAsync();
        }
      } catch (error) {
        console.error("Error updating play state:", error);
      }
    };
    
    updatePlayState();
  }, [isPlaying]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        const state = usePlayerStore.getState();
        if (state.repeatMode !== "one") {
          // Track finished, go to next
          nextTrack();
        }
        // If repeatMode === 'one', Expo AV isLooping will handle it automatically
      } else {
        // Update progress
        const currentMs = status.positionMillis;
        const durationMs = status.durationMillis || (currentTrack?.duration ? currentTrack.duration * 1000 : 1);
        setCurrentTime(currentMs);
        setProgress(currentMs / durationMs);
      }
    }
  };

  const playTrack = useCallback(
    (track: Track) => {
      const { currentTrack, play } = usePlayerStore.getState();
      if (currentTrack?.id === track.id) {
        seekGlobalAudio(0);
        play();
      } else {
        setTrack(track);
      }
    },
    [setTrack]
  );

  const seekTo = useCallback(
    async (position: number) => {
      setProgress(position);
      if (currentTrack && soundInstance) {
        const durationMs = currentTrack.duration * 1000;
        await soundInstance.setPositionAsync(position * durationMs);
      }
    },
    [setProgress, currentTrack]
  );

  return {
    currentTrack,
    isPlaying,
    progress,
    currentTimeMs,
    playTrack,
    togglePlay,
    play,
    pause,
    seekTo,
    nextTrack,
    prevTrack,
  };
}
