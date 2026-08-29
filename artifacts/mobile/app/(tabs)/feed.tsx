import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useListEntries } from '@workspace/api-client-react';
import type { Entry } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DayCard } from '@/components/DayCard';
import { Feather } from '@expo/vector-icons';

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: entries, isLoading, isError, refetch } = useListEntries();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const renderItem = ({ item }: { item: Entry }) => (
    <DayCard entry={item} />
  );

  const renderEmpty = () =>
    isLoading ? null : isError ? (
      <View style={styles.emptyState}>
        <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>DATI NON DISPONIBILI</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Controlla la connessione e riprova.
        </Text>
      </View>
    ) : (
      <View style={styles.emptyState}>
        <Feather name="calendar" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          IL PRIMO GIORNO ARRIVA PRESTO
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          I giorni del percorso di J appariranno qui.
        </Text>
      </View>
    );

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={entries ?? []}
      keyExtractor={item => String(item.id)}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === 'web' ? 118 : 100,
        paddingHorizontal: 16,
        flexGrow: 1,
      }}
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!!(entries && entries.length > 0)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 2,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
