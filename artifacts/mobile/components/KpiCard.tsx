import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface KpiCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function KpiCard({ label, value, accent = false }: KpiCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[
          styles.value,
          { color: accent ? colors.acid : colors.foreground },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  label: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    letterSpacing: 1,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'center',
  },
});
