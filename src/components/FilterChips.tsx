import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { colors, gradients, spacing, borderRadius } from "@/theme/colors";

interface FilterChipsProps {
  chips: string[];
  activeChip: string;
  onSelect: (chip: string) => void;
}

export function FilterChips({ chips, activeChip, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {chips.map((chip) => {
        const isActive = chip === activeChip;
        return (
          <TouchableOpacity
            key={chip}
            onPress={() => onSelect(chip)}
            activeOpacity={0.7}
          >
            {isActive ? (
              <LinearGradient
                colors={[gradients.primary[0], gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chip}
              >
                <Text style={styles.chipTextActive}>{chip}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.chipInactive}>
                <Text style={styles.chipTextInactive}>{chip}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  chipInactive: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chipInactiveBg,
    borderWidth: 1,
    borderColor: colors.chipInactiveBorder,
  },
  chipTextActive: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.label,
  },
  chipTextInactive: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondaryLabel,
  },
});
