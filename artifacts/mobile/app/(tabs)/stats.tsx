import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useListEntries } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniChart, type ChartDataPoint } from '@/components/MiniChart';
import { Feather } from '@expo/vector-icons';

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: entries, refetch } = useListEntries();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const sorted = entries
    ? [...entries].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : [];

  const pesoData: ChartDataPoint[] = sorted
    .filter(e => e.peso != null)
    .map(e => ({ label: shortDate(e.data), value: e.peso! }));

  const sonnoData: ChartDataPoint[] = sorted
    .filter(e => e.sonno != null)
    .map(e => ({ label: shortDate(e.data), value: e.sonno! }));

  const kcalData: ChartDataPoint[] = sorted
    .filter(e => e.kcal != null)
    .map(e => ({ label: shortDate(e.data), value: e.kcal! }));

  const allenamentoData: ChartDataPoint[] = sorted
    .filter(e => (e.flessioni ?? 0) + (e.addominali ?? 0) > 0)
    .map(e => ({ label: shortDate(e.data), value: (e.flessioni ?? 0) + (e.addominali ?? 0) }));

  const entrateData: ChartDataPoint[] = sorted
    .filter(e => e.entrate != null && e.entrate > 0)
    .map(e => ({ label: shortDate(e.data), value: e.entrate! }));

  const lastEntry = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const avgSonno =
    sonnoData.length > 0
      ? sonnoData.reduce((s, d) => s + d.value, 0) / sonnoData.length
      : null;
  const totalKcal = kcalData.reduce((s, d) => s + d.value, 0);

  const hasAnyData = sorted.length > 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === 'web' ? 118 : 100,
        paddingHorizontal: 16,
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
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>STATISTICHE</Text>

      {!hasAnyData ? (
        <View style={styles.emptyState}>
          <Feather name="bar-chart-2" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>NESSUN DATO</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            I grafici appariranno al completamento dei primi giorni del percorso.
          </Text>
        </View>
      ) : (
        <>
          {/* Summary pills */}
          <View style={styles.summaryRow}>
            {lastEntry?.peso != null && (
              <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>PESO</Text>
                <Text style={[styles.pillValue, { color: colors.primary }]}>
                  {lastEntry.peso}KG
                </Text>
              </View>
            )}
            {avgSonno != null && (
              <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>SONNO MED.</Text>
                <Text style={[styles.pillValue, { color: colors.primary }]}>
                  {avgSonno.toFixed(1)}H
                </Text>
              </View>
            )}
            {totalKcal > 0 && (
              <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>KCAL TOT.</Text>
                <Text style={[styles.pillValue, { color: colors.primary }]}>
                  {totalKcal.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Charts */}
          <View style={styles.chartsGrid}>
            <MiniChart
              data={pesoData}
              title="Peso nel tempo"
              unit="KG"
              type="line"
              height={130}
            />
            <MiniChart
              data={sonnoData}
              title="Ore di sonno"
              unit="H"
              type="line"
              height={130}
            />
            <MiniChart
              data={kcalData}
              title="Kcal giornaliere"
              type="line"
              height={130}
            />
            <MiniChart
              data={allenamentoData}
              title="Allenamento (rep)"
              type="bar"
              height={130}
            />
            {entrateData.length > 0 && (
              <MiniChart
                data={entrateData}
                title="Entrate (€)"
                type="bar"
                height={130}
                color={colors.acid}
              />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pageTitle: {
    fontSize: 36,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 4,
    marginBottom: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  pill: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pillValue: {
    fontSize: 22,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
  },

  chartsGrid: { gap: 10 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
