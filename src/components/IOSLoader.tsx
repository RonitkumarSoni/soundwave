import React, { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';

interface IOSLoaderProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: any;
  text?: string;
}

export const IOSLoader: React.FC<IOSLoaderProps> = ({ size = 'small', color = '#999999', style, text }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % 12;
      rotation.setValue(frame / 12);
    }, 80);

    return () => clearInterval(interval);
  }, [rotation]);

  const dim = size === 'large' ? 28 : typeof size === 'number' ? size : 16;
  
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spokes = Array.from({ length: 12 }).map((_, i) => i);
  
  const spokeWidth = Math.max(2, dim * 0.08);
  const spokeHeight = Math.max(4, dim * 0.28);

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ width: dim, height: dim, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={{ width: dim, height: dim, transform: [{ rotate: spin }] }}>
          {spokes.map((i) => {
            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: dim / 2 - spokeHeight / 2,
                  left: dim / 2 - spokeWidth / 2,
                  width: spokeWidth,
                  height: spokeHeight,
                  backgroundColor: color,
                  borderRadius: spokeWidth / 2,
                  opacity: Math.max(0.15, 1 - i / 12),
                  transform: [
                    { rotate: `${(i * 30)}deg` },
                    { translateY: -(dim * 0.35) },
                  ],
                }}
              />
            );
          })}
        </Animated.View>
      </View>
      {text && (
        <Text style={{ marginTop: 12, color, fontSize: 16, fontWeight: '600' }}>
          {text}
        </Text>
      )}
    </View>
  );
};
