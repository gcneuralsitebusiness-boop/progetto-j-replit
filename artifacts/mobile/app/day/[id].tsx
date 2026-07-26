import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useListEntries } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── helpers ──────────────────────────────────────────────────────────────────

function padDay(n: number) {
  return n.toString().padStart(3, '0');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    'GEN','FEB','MAR','APR','MAG','GIU',
    'LUG','AGO','SET','OTT','NOV','DIC',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <Text style={[styles.sectionLabel, { color }]}>{text}</Text>
  );
}

function MetricBar({
  label,
  value,
  unit,
  fraction,
  accent,
  colors,
}: {
  label: string;
  value: number;
  unit: string;
  fraction: number; // 0-1
  accent?: boolean;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  const barColor = accent ? colors.acid : colors.primary;
  return (
    <View style={styles.metricBar}>
      <View style={styles.metricBarTop}>
        <Text style={[styles.metricBarLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text style={[styles.metricBarValue, { color: accent ? colors.acid : colors.foreground }]}>
          {value}
          <Text style={[styles.metricBarUnit, { color: colors.mutedForeground }]}>{unit}</Text>
        </Text>
      </View>
      <View style={[styles.metricBarTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.metricBarFill,
            { backgroundColor: barColor, width: `${Math.min(100, Math.round(fraction * 100))}%` },
          ]}
        />
      </View>
    </View>
  );
}

function FinanceRow({
  label,
  value,
  positive,
  colors,
}: {
  label: string;
  value: number;
  positive: boolean;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  const color = positive
    ? colors.acid
    : value === 0
    ? colors.mutedForeground
    : colors.primary;

  return (
    <View style={styles.financeRow}>
      <Text style={[styles.financeLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.financeValue, { color }]}>
        €{Math.abs(value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function DayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: entries } = useListEntries();

  const entry = entries?.find(e => String(e.id) === id);

  if (!entry) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Caricamento...
        </Text>
      </View>
    );
  }

  const photoUrl = entry.foto
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/storage/objects/${entry.foto}`
    : null;

  // Compute fractions for bars (reference max values)
  const kcalFraction = entry.kcal ? entry.kcal / 3500 : 0;
  const sonnoFraction = entry.sonno ? entry.sonno / 10 : 0;
  const kmFraction = entry.km ? entry.km / 20 : 0;
  const pesoDeltaRef = 120; // max kg reference
  const pesoFraction = entry.peso ? entry.peso / pesoDeltaRef : 0;
  const flessIoniFraction = entry.flessioni ? entry.flessioni / 100 : 0;
  const addFraction = entry.addominali ? entry.addominali / 200 : 0;
  const roundFraction = entry.round ? entry.round / 20 : 0;
  const battFraction = entry.battito ? entry.battito / 200 : 0;

  const hasFinance = entry.entrate != null || entry.uscite != null;
  const entrate = entry.entrate ?? 0;
  const uscite = entry.uscite ?? 0;
  const saldo = entrate - uscite;

  const hasTraining = entry.flessioni != null || entry.addominali != null || entry.round != null || entry.battito != null;
  const hasFitness = entry.kcal != null || entry.sonno != null || entry.km != null || entry.peso != null;

  const topPad = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── Hero image / placeholder ─── */}
      <View style={styles.heroContainer}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted }]}>
            {/* Crosshatch via rotated lines */}
            <View style={styles.crosshatchOverlay}>
              {Array.from({ length: 18 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.crosshatchLine,
                    {
                      backgroundColor: colors.foreground + '08',
                      top: i * 18 - 80,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.heroWatermark, { color: colors.foreground + '12' }]}>
              {padDay(entry.numero)}
            </Text>
          </View>
        )}

        {/* Gradient overlay */}
        <View
          style={[styles.heroGradient, { backgroundColor: colors.background }]}
          pointerEvents="none"
        />

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.background + 'CC', top: topPad + 12 }]}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>

        {/* Day badge */}
        <View style={[styles.heroBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.heroBadgeText, { color: colors.primaryForeground }]}>
            G{entry.numero}
          </Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Day header */}
        <View style={styles.dayHeader}>
          <Text style={[styles.dayTitle, { color: colors.primary }]}>
            GIORNO {padDay(entry.numero)}
          </Text>
          <Text style={[styles.dayDate, { color: colors.mutedForeground }]}>
            {formatDate(entry.data)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.primary + '40' }]} />

        {/* ─── Finance ─── */}
        {hasFinance && (
          <View style={[styles.financeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionLabel text="FINANZE" color={colors.acid} />
            <FinanceRow label="ENTRATE" value={entrate} positive={true} colors={colors} />
            <View style={[styles.financeDivider, { backgroundColor: colors.border }]} />
            <FinanceRow label="USCITE" value={uscite} positive={false} colors={colors} />
            <View style={[styles.financeDivider, { backgroundColor: colors.border }]} />
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.mutedForeground }]}>SALDO</Text>
              <Text
                style={[
                  styles.financeValueLarge,
                  { color: saldo >= 0 ? colors.acid : colors.primary },
                ]}
              >
                {saldo >= 0 ? '+' : '−'}€
                {Math.abs(saldo).toLocaleString('it-IT', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* Mini bar chart */}
            {entrate + uscite > 0 && (
              <View style={styles.financeBarWrap}>
                <View style={[styles.financeBarTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.financeBarFill,
                      {
                        backgroundColor: colors.acid,
                        width: `${Math.round((entrate / Math.max(entrate, uscite, 1)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={[styles.financeBarTrack, { backgroundColor: colors.border, marginTop: 4 }]}>
                  <View
                    style={[
                      styles.financeBarFill,
                      {
                        backgroundColor: colors.primary + 'AA',
                        width: `${Math.round((uscite / Math.max(entrate, uscite, 1)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── Fitness metrics ─── */}
        {hasFitness && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <SectionLabel text="ATTIVITÀ" color={colors.mutedForeground} />
            {entry.kcal != null && (
              <MetricBar label="KCAL" value={entry.kcal} unit="" fraction={kcalFraction} colors={colors} />
            )}
            {entry.km != null && (
              <MetricBar label="KM" value={entry.km} unit=" km" fraction={kmFraction} colors={colors} />
            )}
            {entry.sonno != null && (
              <MetricBar label="SONNO" value={entry.sonno} unit="h" fraction={sonnoFraction} colors={colors} />
            )}
            {entry.peso != null && (
              <MetricBar label="PESO" value={entry.peso} unit=" kg" fraction={pesoFraction} colors={colors} />
            )}
          </View>
        )}

        {/* ─── Training ─── */}
        {hasTraining && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <SectionLabel text="ALLENAMENTO" color={colors.mutedForeground} />
            {entry.flessioni != null && (
              <MetricBar label="FLESSIONI" value={entry.flessioni} unit=" rip" fraction={flessIoniFraction} colors={colors} />
            )}
            {entry.addominali != null && (
              <MetricBar label="ADDOMINALI" value={entry.addominali} unit=" rip" fraction={addFraction} colors={colors} />
            )}
            {entry.round != null && (
              <MetricBar label="ROUND" value={entry.round} unit="" fraction={roundFraction} colors={colors} />
            )}
            {entry.battito != null && (
              <MetricBar label="BATTITO" value={entry.battito} unit=" bpm" fraction={battFraction} colors={colors} />
            )}
          </View>
        )}

        {/* ─── Diary text ─── */}
        {entry.testo ? (
          <View style={[styles.textCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.textAccentBar, { backgroundColor: colors.primary }]} />
            <Text style={[styles.diaryText, { color: colors.foreground + 'E0' }]}>
              {entry.testo}
            </Text>
          </View>
        ) : (
          <View style={[styles.noText, { borderColor: colors.border }]}>
            <Feather name="edit-3" size={18} color={colors.mutedForeground} />
            <Text style={[styles.noTextLabel, { color: colors.mutedForeground }]}>
              Nessun testo per questo giorno.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular', letterSpacing: 2 },

  // Hero
  heroContainer: { height: 240, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshatchOverlay: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ rotate: '-45deg' }],
  },
  crosshatchLine: {
    position: 'absolute',
    left: -SCREEN_WIDTH,
    right: -SCREEN_WIDTH,
    height: 1,
  },
  heroWatermark: {
    fontSize: 100,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 8,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    opacity: 0.8,
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    top: 12,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
  },

  // Scroll content
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },

  dayHeader: { gap: 4 },
  dayTitle: {
    fontSize: 44,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 3,
    lineHeight: 46,
  },
  dayDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },

  divider: { height: 1 },

  // Section label
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // Finance card
  financeCard: {
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  financeLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  financeValue: {
    fontSize: 22,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
  },
  financeValueLarge: {
    fontSize: 32,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
  },
  financeDivider: { height: 1 },
  financeBarWrap: { marginTop: 10, gap: 0 },
  financeBarTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  financeBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Metrics section
  section: {
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  metricBar: { gap: 6 },
  metricBarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metricBarLabel: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  metricBarValue: {
    fontSize: 26,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
    lineHeight: 26,
  },
  metricBarUnit: {
    fontSize: 14,
    letterSpacing: 1,
  },
  metricBarTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 1,
  },

  // Diary text
  textCard: {
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
  },
  textAccentBar: {
    width: 2,
    borderRadius: 1,
  },
  diaryText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 26,
    fontFamily: 'Inter_400Regular',
  },

  // No text state
  noText: {
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  noTextLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1.5,
  },
});
