import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/theme/colors";
import { useAlertTheme } from '@/hooks/useAlertTheme';

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  showCancel?: boolean;
}

export function CustomDialog({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  showCancel = true,
}: CustomDialogProps) {
  const theme = useAlertTheme();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <BlurView intensity={40} tint={theme.isDark ? 'dark' : 'light'} style={styles.overlay}>
        <View style={[styles.dialogContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.button }]}>
            <Ionicons
              name={isDestructive ? "warning" : "information-circle"}
              size={32}
              color={isDestructive ? theme.danger : theme.accent}
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>{message}</Text>
          <View style={styles.buttonRow}>
            {showCancel && <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.button }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>{cancelText}</Text>
            </TouchableOpacity>}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                isDestructive && { backgroundColor: "rgba(255, 59, 48, 0.2)" },
              ]}
              onPress={() => {
                onCancel();
                setTimeout(onConfirm, 100); // slight delay for smooth modal dismiss
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.confirmText,
                  { color: isDestructive ? theme.danger : theme.accent },
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dialogContainer: {
    width: "85%",
    backgroundColor: "rgba(30, 20, 50, 0.95)",
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  cancelText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(138, 63, 252, 0.2)",
    alignItems: "center",
  },
  confirmText: {
    color: colors.accentSolid,
    fontSize: 16,
    fontWeight: "600",
  },
});
