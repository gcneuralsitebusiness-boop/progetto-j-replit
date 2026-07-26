import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import {
  useListEntries,
  useGetLatestEntries,
  useGetSiteContent,
} from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KpiCard } from '@/components/KpiCard';
import { DayCard } from '@/components/DayCard';
import { ProgressRing } from '@/components/ProgressRing';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: allEntries, refetch: refetchAll } = useListEntries();
  const { data: latestEntries, isLoading: latestLoading, refetch: refetchLatest } =
    useGetLatestEntries();
  const { data: siteContent } = useGetSiteContent();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAll(), refetchLatest()]);
    setRefreshing(false);
  };

  const totalDays = allEntries?.length ?? 0;
  const totalKm = allEntries?.reduce((sum, e) => sum + (e.km ?? 0), 0) ?? 0;
  const totalKcal = allEntries?.reduce((sum, e) => sum + (e.kcal ?? 0), 0) ?? 0;
  const totalIncome = allEntries?.reduce((sum, e) => sum + (e.entrate ?? 0), 0) ?? 0;

  const heroTitle = siteContent?.home_hero_titolo ?? 'PROGETTO J · 180 DAYS';
  const heroSub =
    siteContent?.home_hero_sottotitolo ?? "J doesn't talk. J shows data.";

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 24,
        paddingBottom: Platform.OS === 'web' ? 118 : 100,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ——— Hero ——— */}
      <View style={styles.hero}>
        <Text style={[styles.heroJ, { color: colors.primary }]}>J</Text>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>{heroTitle}</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
          {heroSub.toUpperCase()}
        </Text>
        <View style={[styles.heroDivider, { backgroundColor: colors.primary }]} />
      </View>

      {/* ——— KPI cards ——— */}
      <View style={styles.pad}>
        <View style={styles.kpiRow}>
          <KpiCard label="GIORNI" value={totalDays} />
          <KpiCard label="KM" value={totalKm} />
          <KpiCard label="KCAL" value={totalKcal > 0 ? totalKcal.toLocaleString() : '0'} />
          <KpiCard label="ENTRATE" value={`€${totalIncome}`} accent />
        </View>
      </View>

      {/* ——— Progress ring ——— */}
      <View style={styles.pad}>
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            PROGRESSIONE 180 GIORNI
          </Text>
          <View style={styles.progressRow}>
            <ProgressRing value={totalDays} max={180} size={96} />
            <View style={styles.progressMeta}>
              <View>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>COMPLETATO</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {Math.round((totalDays / 180) * 100)}%
                </Text>
              </View>
              <View>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>RIMANENTI</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {Math.max(0, 180 - totalDays)}G
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ——— Separator ——— */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* ——— Latest entries ——— */}
      <View style={styles.pad}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ULTIMI GIORNI</Text>
          <TouchableOpacity onPress={() => router.push('/feed')} style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>TUTTI</Text>
            <Feather name="arrow-right" size={12} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {latestLoading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Caricamento...
            </Text>
          </View>
        ) : !latestEntries || latestEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="clock" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              IL PRIMO GIORNO ARRIVA PRESTO
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              I giorni del percorso appariranno qui.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {latestEntries.map(entry => (
              <DayCard key={entry.id} entry={entry} compact />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },

  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroJ: {
    fontSize: 64,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 6,
    lineHeight: 68,
  },
  heroTitle: {
    fontSize: 15,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 5,
    textAlign: 'center',
    marginTop: 4,
  },
  heroSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 8,
  },
  heroDivider: {
    width: 32,
    height: 1,
    marginTop: 20,
  },

  pad: { paddingHorizontal: 16, marginBottom: 14 },
  kpiRow: { flexDirection: 'row', gap: 6 },

  progressCard: {
    borderWidth: 1,
    padding: 16,
  },
  cardLabel: {
    fontSize: 9,
    letterSpacing: 2.5,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  progressMeta: {
    flex: 1,
    gap: 12,
  },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 28,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 2,
  },

  separator: { height: 1, marginHorizontal: 16, marginBottom: 20 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 3,
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2,
  },

  cardList: { gap: 10 },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 2,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
