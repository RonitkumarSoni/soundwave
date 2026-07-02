import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { colors, gradients } from "@/theme/colors";

interface BottomNavProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

const tabs = [
  { icon: "home" as const, iconOutline: "home-outline" as const, label: "Home" },
  { icon: "musical-notes" as const, iconOutline: "musical-notes-outline" as const, label: "Library" },
  { icon: "settings" as const, iconOutline: "settings-outline" as const, label: "Settings" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        <View style={styles.navContent}>
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.label}
              tab={tab}
              index={index}
              isActive={activeTab === index}
              onPress={() => onTabChange(index)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

interface TabItemProps {
  tab: (typeof tabs)[number];
  index: number;
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const fabScale = useSharedValue(0);

  React.useEffect(() => {
    fabScale.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    // No translateY to prevent clipping at the top
  }));

  const fabScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
    opacity: fabScale.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabPressable}>
      <Animated.View style={[styles.tabItem, animatedStyle]}>
        {/* Gradient FAB behind active icon */}
        <Animated.View style={[styles.fabContainer, fabScaleStyle]}>
          <LinearGradient
            colors={[gradients.primary[0], gradients.primary[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          />
        </Animated.View>

        <Ionicons
          name={isActive ? tab.icon : tab.iconOutline}
          size={24}
          color={isActive ? colors.label : colors.secondaryLabel}
        />
      </Animated.View>
    </Pressable>
  );
}

const fabShadow = Platform.select({
  web: {
    boxShadow: `0 4px 12px ${colors.accentStart}99`,
  },
  default: {
    shadowColor: colors.accentStart,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 100,
  },
  blurContainer: {
    width: "100%",
    maxWidth: 320,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceBorder,
  },
  navContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
  },
  tabPressable: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItem: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fabContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    ...fabShadow,
  } as any,
});
