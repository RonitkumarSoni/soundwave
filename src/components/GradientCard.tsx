import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, borderRadius } from "@/theme/colors";

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradientColors?: readonly [string, string, ...string[]];
}

export function GradientCard({
  children,
  style,
  gradientColors,
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={gradientColors || gradients.forYouCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xxl,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
  },
});
