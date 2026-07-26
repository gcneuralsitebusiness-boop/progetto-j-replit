import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  label?: string;
}

export function ProgressRing({ value, max, size = 100, label }: ProgressRingProps) {
  const colors = useColors();
  const progress = Math.min(value / max, 1);
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="square"
        />
      </Svg>
      {/* Inner content */}
      <View style={styles.inner}>
        <Text style={[styles.value, { color: colors.primary }]}>{value}</Text>
        <Text style={[styles.max, { color: colors.mutedForeground }]}>/{max}</Text>
        {label && (
          <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={2}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
    lineHeight: 30,
  },
  max: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    lineHeight: 14,
  },
  label: {
    fontSize: 8,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
