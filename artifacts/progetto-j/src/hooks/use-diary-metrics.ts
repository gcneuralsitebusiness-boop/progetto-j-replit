import { useMemo } from "react";
import { getListLightEntriesQueryKey, useListLightEntries } from "@workspace/api-client-react";
import { romeDate, weeklyComparisons } from "@/lib/diario-analytics";

/** One shared, fresh source for the home and public diary; never loads full diary bodies. */
export function useDiaryMetrics() {
  const query = useListLightEntries({
    query: {
      queryKey: getListLightEntriesQueryKey(),
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
    },
    request: { cache: "no-store" },
  });
  const today = romeDate();
  const entries = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.numero - b.numero), [query.data]);
  const weekly = useMemo(() => weeklyComparisons(entries, today), [entries, today]);
  const weights = useMemo(() => entries.filter((entry) => entry.peso != null), [entries]);
  return {
    ...query,
    entries,
    today,
    weekly,
    maxDay: entries.length ? entries[entries.length - 1].numero : 0,
    firstWeight: weights[0]?.peso ?? null,
    currentWeight: weights[weights.length - 1]?.peso ?? null,
    latestFriction: [...entries].reverse().find((entry) => Boolean(entry.attrito?.trim())),
  };
}
