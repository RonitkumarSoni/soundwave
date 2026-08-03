import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, borderRadius } from '@/theme/colors';

const { width } = Dimensions.get('window');

const BANDS = [
  { label: '60Hz', default: 50 },
  { label: '230Hz', default: 50 },
  { label: '910Hz', default: 50 },
  { label: '4kHz', default: 50 },
  { label: '14kHz', default: 50 },
];

function VerticalSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  const [active, setActive] = useState(false);
  const sliderHeight = 200;
  
  const handleTouch = (event: any) => {
    const y = event.nativeEvent.locationY;
    let newValue = 100 - (y / sliderHeight) * 100;
    if (newValue > 100) newValue = 100;
    if (newValue < 0) newValue = 0;
    onChange(newValue);
  };

  return (
    <View style={styles.sliderContainer}>
      <View 
        style={styles.sliderTrackWrapper}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => { setActive(true); handleTouch(e); }}
        onResponderMove={(e) => handleTouch(e)}
        onResponderRelease={() => setActive(false)}
      >
        <View style={styles.sliderTrackBackground} />
        <View style={[styles.sliderTrackFill, { height: `${value}%` }]} />
        <View style={[styles.sliderThumb, { bottom: `${value}%`, transform: [{ translateY: 10 }, { scale: active ? 1.2 : 1 }] }]} />
      </View>
      <Text style={styles.sliderLabel}>{label}</Text>
    </View>
  );
}

export default function EqualizerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bandValues, setBandValues] = useState(BANDS.map(b => b.default));
  const [eqEnabled, setEqEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.background[0], gradients.background[1], gradients.background[2]]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="chevron-down" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Equalizer</Text>
        <TouchableOpacity onPress={() => setEqEnabled(!eqEnabled)}>
          <Text style={[styles.toggleText, { color: eqEnabled ? colors.accentSolid : colors.tertiaryLabel }]}>
            {eqEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.presetContainer}>
          <Text style={styles.presetLabel}>Current Preset</Text>
          <Text style={styles.presetValue}>Custom</Text>
        </View>

        <View style={[styles.slidersWrapper, { opacity: eqEnabled ? 1 : 0.4 }]}>
          {BANDS.map((band, idx) => (
            <VerticalSlider 
              key={idx}
              label={band.label}
              value={bandValues[idx]}
              onChange={(val) => {
                if (!eqEnabled) return;
                const newVals = [...bandValues];
                newVals[idx] = val;
                setBandValues(newVals);
              }}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => setBandValues(BANDS.map(b => b.default))}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0514' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingTop: spacing.xxl,
  },
  presetContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  presetLabel: {
    color: colors.secondaryLabel,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  presetValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
  },
  slidersWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    height: 250,
  },
  sliderContainer: {
    alignItems: 'center',
    width: 40,
  },
  sliderTrackWrapper: {
    width: 40,
    height: 200,
    alignItems: 'center',
    position: 'relative',
  },
  sliderTrackBackground: {
    position: 'absolute',
    width: 6,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
  },
  sliderTrackFill: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    backgroundColor: colors.accentSolid,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderLabel: {
    color: colors.secondaryLabel,
    fontSize: 12,
    marginTop: spacing.md,
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: 60,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resetText: {
    color: '#FFF',
    fontSize: 14,
  }
});
