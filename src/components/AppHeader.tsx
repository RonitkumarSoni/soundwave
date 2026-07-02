import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing } from "@/theme/colors";
import { currentUser } from "@/data/mockData";

interface AppHeaderProps {
  mode: "greeting" | "plain";
  title?: string;
}

export function AppHeader({ mode, title }: AppHeaderProps) {
  const router = useRouter();
  const displayTitle =
    mode === "greeting" ? `Hello, ${currentUser.name}` : title || "Your library";

  return (
    <View style={styles.container}>
      {/* Top row: avatar + icon buttons */}
      <View style={styles.topRow}>
        <TouchableOpacity activeOpacity={0.7}>
          <Image
            source={{ uri: currentUser.avatarUrl }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        <View style={styles.iconButtons}>
          <TouchableOpacity 
            style={styles.iconButton} 
            activeOpacity={0.7}
            onPress={() => router.navigate("/(search)")}
          >
            <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
              <Ionicons name="search" size={18} color={colors.label} />
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={colors.label}
              />
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{displayTitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  iconButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  iconBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
    borderRadius: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.label,
    letterSpacing: -0.5,
  },
});
