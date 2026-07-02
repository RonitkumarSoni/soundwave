import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, spacing } from "@/theme/colors";

interface WaveformProps {
  progress: number; // 0 to 1
  currentTime: string;
  totalTime: string;
  onSeek: (position: number) => void;
}

export function Waveform({
  progress,
  currentTime,
  totalTime,
  onSeek,
}: WaveformProps) {
  const [containerWidth, setContainerWidth] = React.useState(300);

  // Generate random bar heights for visual waveform effect
  const bars = useMemo(() => {
    const count = 50;
    return Array.from({ length: count }, (_, i) => {
      // Create a natural waveform shape
      const normalizedPos = i / count;
      const base = 0.3;
      const peak = Math.sin(normalizedPos * Math.PI) * 0.5;
      const random = Math.random() * 0.4;
      return Math.min(1, base + peak + random);
    });
  }, []);

  const handlePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const width = containerWidth || 300;
    const seekPos = Math.max(0, Math.min(1, locationX / width));
    onSeek(seekPos);
  };

  return (
    <View style={styles.container}>
      <View style={styles.waveformOuter}>
        <TouchableOpacity
          style={styles.waveformContainer}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          {bars.map((height, index) => {
            const barProgress = index / bars.length;
            const isPlayed = barProgress <= progress;
            const barHeight = 4 + height * 28; // min 4, max 32

            return (
              <View key={index} style={styles.barWrapper} pointerEvents="none">
                {isPlayed ? (
                  <View style={[styles.bar, { height: barHeight, backgroundColor: "#FFF" }]} />
                ) : (
                  <View
                    style={[
                      styles.bar,
                      styles.barInactive,
                      { height: barHeight },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Scrubber Handle */}
        <View style={[styles.scrubberHandle, { left: `${progress * 100}%` }]} pointerEvents="none">
          <View style={styles.scrubberLine} />
          <View style={styles.scrubberDot} />
        </View>
      </View>

      {/* Time labels */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{currentTime}</Text>
        <Text style={styles.timeText}>{totalTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    marginVertical: spacing.lg,
  },
  waveformOuter: {
    position: "relative",
    justifyContent: "center",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: 3,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    width: 2,
    borderRadius: 1,
  },
  barInactive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  timeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontVariant: ["tabular-nums"],
  },
  scrubberHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 10,
    marginLeft: -5,
    alignItems: "center",
    justifyContent: "center",
  },
  scrubberLine: {
    position: "absolute",
    width: 2,
    height: 54,
    backgroundColor: "#FFF",
    borderRadius: 1,
  },
  scrubberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
    position: "absolute",
    top: "50%",
    marginTop: -3,
  },
});
