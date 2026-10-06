import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface Props {
  password: string;
}

export const PasswordStrengthBar = ({ password }: Props) => {
  const hasMinLength = password.length >= 8;
  const hasLetterAndNumber = /(?=.*[a-zA-Z])(?=.*[0-9])/.test(password);

  const strength = hasMinLength && hasLetterAndNumber ? 3
    : hasMinLength || hasLetterAndNumber ? 2 : password.length > 0 ? 1 : 0;

  const barColor = useMemo(() => {
    if (strength === 1) return colors.danger || '#FF4B4B'; // Red
    if (strength === 2) return '#FFA015'; // Orange
    if (strength === 3) return colors.accentSolid; // Soundwave Purple
    return 'rgba(255,255,255,0.1)';
  }, [strength]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${(strength / 3) * 100}%`, { duration: 300 }),
      backgroundColor: withTiming(barColor, { duration: 300 }),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <Animated.View style={[styles.bar, animatedBarStyle]} />
      </View>

      <View style={styles.checklist}>
        <View style={styles.checkItem}>
          <Ionicons
            name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={hasMinLength ? colors.accentSolid : 'rgba(255,255,255,0.5)'}
          />
          <Text style={[styles.checkText, hasMinLength && styles.checkTextActive]}>
            At least 8 characters
          </Text>
        </View>
        <View style={styles.checkItem}>
          <Ionicons
            name={hasLetterAndNumber ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={hasLetterAndNumber ? colors.accentSolid : 'rgba(255,255,255,0.5)'}
          />
          <Text style={[styles.checkText, hasLetterAndNumber && styles.checkTextActive]}>
            Contains a letter and a number
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  barContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  checklist: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  checkTextActive: {
    color: '#FFF',
  }
});
