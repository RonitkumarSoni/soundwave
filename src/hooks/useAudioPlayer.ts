import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import { usePlayerStore, Track } from "@/stores/usePlayerStore";

const isWeb = Platform.OS === "web";

let soundInstance: Audio.Sound | null = null;
// Custom WebAudio removed, using Expo Audio for all platforms

export function useAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTimeMs,
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

  // Handle track changes
  useEffect(() => {
    const loadNewTrack = async () => {
      if (!currentTrack) return;
      
      // Determine correct audio URL based on source
      let audioUri = "";
      
      if (currentTrack.source === 'deezer') {
        // Deezer provides direct 30s preview URLs that work cross-origin
        audioUri = currentTrack.audio;
      } else if (currentTrack.source === 'spotify') {
        // Spotify API no longer provides audio previews
        console.error("Spotify tracks do not have audio available.");
        return;
      } else {
        // Jamendo direct audio URL
        audioUri = currentTrack.audio;
      }

      if (!audioUri) {
        console.error("Error loading audio: track has no audio URL", currentTrack);
        return;
      }

      console.log("Loading audio URI:", audioUri, "isWeb:", isWeb);

      try {
        if (soundInstance) {
          await soundInstance.unloadAsync();
        }
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: isPlaying },
          onPlaybackStatusUpdate
        );
        soundInstance = sound;
      } catch (error: any) {
        console.error("Error loading audio:", error);
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
      }
    };
    
    loadNewTrack();
  }, [currentTrack?.id]); // Only re-run when track ID changes

  // Handle play/pause state changes from store
  useEffect(() => {
    const updatePlayState = async () => {
      try {
        if (!soundInstance) return;
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
        // Track finished, go to next
        nextTrack();
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
      setTrack(track);
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
