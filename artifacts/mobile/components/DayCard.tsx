import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import type { Entry } from '@workspace/api-client-react';

function padDay(n: number): string {
  return n.toString().padStart(3, '0');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    'GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU',
    'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

interface Stat {
  label: string;
  value: string;
  accent?: boolean;
}

export function DayCard({ entry, compact = false }: { entry: Entry; compact?: boolean }) {
  const colors = useColors();
  const handlePress = () => router.push(`/day/${entry.id}`);

  const photoUrl = entry.foto
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/storage/objects/${entry.foto}`
    : null;

  const stats: Stat[] = [];
  if (entry.kcal != null) stats.push({ label: 'KCAL', value: String(entry.kcal) });
  if (entry.sonno != null) stats.push({ label: 'SONNO', value: `${entry.sonno}H` });
  if (entry.km != null) stats.push({ label: 'KM', value: String(entry.km) });
  if (entry.peso != null) stats.push({ label: 'PESO', value: `${entry.peso}KG` });
  if (entry.flessioni != null) stats.push({ label: 'FLEX', value: String(entry.flessioni) });
  if (entry.addominali != null) stats.push({ label: 'ABS', value: String(entry.addominali) });
  if (entry.battito != null) stats.push({ label: 'BPM', value: String(entry.battito) });
  if (entry.round != null) stats.push({ label: 'ROUND', value: String(entry.round) });
  if (entry.entrate != null) stats.push({ label: 'ENTRATE', value: `€${entry.entrate}`, accent: true });
  if (entry.uscite != null) stats.push({ label: 'USCITE', value: `€${entry.uscite}` });

  const visibleStats = compact ? stats.slice(0, 4) : stats;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
    >
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Photo / placeholder header */}
      <View style={styles.photoContainer}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={[styles.dayWatermark, { color: colors.foreground + '0D' }]}>
              {padDay(entry.numero)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.photoOverlay,
            { backgroundColor: colors.card },
          ]}
        />
        {/* Day badge */}
        <View style={[styles.dayBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.dayBadgeText, { color: colors.primaryForeground }]}>
            G{entry.numero}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.dayNumber, { color: colors.primary }]}>
            GIORNO {padDay(entry.numero)}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(entry.data)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.primary + '40' }]} />

        {/* Stats chips */}
        {visibleStats.length > 0 && (
          <View style={styles.statsRow}>
            {visibleStats.map(stat => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  {stat.label}
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: stat.accent ? colors.acid : colors.foreground },
                  ]}
                >
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Diary text snippet */}
        {entry.testo ? (
          <Text
            style={[styles.text, { color: colors.foreground + 'CC' }]}
            numberOfLines={compact ? 2 : 3}
          >
            {entry.testo}
          </Text>
        ) : null}

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <Text style={[styles.tapHintText, { color: colors.primary }]}>
            LEGGI TUTTO
          </Text>
          <Text style={[styles.tapHintArrow, { color: colors.primary }]}>›</Text>
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  photoContainer: {
    height: 150,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWatermark: {
    fontSize: 60,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 6,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    opacity: 0.85,
  },
  dayBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dayBadgeText: {
    fontSize: 10,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
  },
  body: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 4,
  },
  dayNumber: {
    fontSize: 28,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 2,
  },
  date: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 10,
  },
  statItem: {},
  statLabel: {
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tapHintText: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2.5,
  },
  tapHintArrow: {
    fontSize: 16,
    lineHeight: 16,
  },
});
