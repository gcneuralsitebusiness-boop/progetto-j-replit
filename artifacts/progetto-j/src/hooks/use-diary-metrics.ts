import { useMemo } from "react";
import { getListLightEntriesQueryKey, useListLightEntries } from "@workspace/api-client-react";
import { recordedEntries, romeDate, weeklyComparisons } from "@/lib/diario-analytics";

/** One shared, fresh source for the home and public diary; never loads full diary bodies. */
export function useDiaryMetrics() {
  const query = useListLightEntries({
    query: {
      queryKey: getListLightEntriesQueryKey(),
      staleTime: 60_000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchInterval: (query) => query.state.data?.some((entry) => entry.data === today && !entry.hasDiario) ? 10_000 : 60_000,
      refetchIntervalInBackground: false,
    },
    request: { cache: "no-store" },
  });
  const today = romeDate();
  const entries = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.numero - b.numero), [query.data]);
  const recorded = useMemo(() => recordedEntries(entries, today), [entries, today]);
  const weekly = useMemo(() => weeklyComparisons(recorded, today), [recorded, today]);
  const weights = useMemo(() => recorded.filter((entry) => entry.peso != null), [recorded]);
  return {
    ...query,
    entries,
    recorded,
    today,
    weekly,
    maxDay: entries.length ? entries[entries.length - 1].numero : 0,
    firstWeight: weights[0]?.peso ?? null,
    currentWeight: weights[weights.length - 1]?.peso ?? null,
    latestFriction: [...recorded].reverse().find((entry) => Boolean(entry.attrito?.trim())),
  };
}
