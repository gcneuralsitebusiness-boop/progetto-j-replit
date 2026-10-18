import { useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getListEntrySummariesQueryKey, useGetSiteContent, useListEntrySummaries } from "@workspace/api-client-react";
import { DayCard } from "@/components/DayCard";
import { DataErrorState } from "@/components/DataErrorState";
import { SiteFooter } from "@/components/SiteFooter";
import { isUnfinishedToday } from "@/lib/current-day";

const PAGE_SIZE = 12;

/** Journaling opens directly on the saved days, separate from Diario statistics. */
export default function Journaling() {
  const { data: entries, isLoading, isError } = useListEntrySummaries({
    query: {
      queryKey: getListEntrySummariesQueryKey(),
      refetchInterval: (query) =>
        query.state.data?.some((entry) => isUnfinishedToday(entry)) ? 10_000 : false,
    },
  });
  // Editorial copy is optional: it must not block the diary records.
  const { data: siteContent } = useGetSiteContent();
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const monthOptions = useMemo(
    () => [...new Set(entries?.map((entry) => entry.data.slice(0, 7)) ?? [])].sort().reverse(),
    [entries],
  );
  const filteredEntries = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return [...(entries ?? [])]
      .sort((a, b) => b.numero - a.numero)
      .filter((entry) =>
        (selectedMonth === "all" || entry.data.startsWith(selectedMonth)) &&
        (!search || String(entry.numero).includes(search) ||
          (entry.testo ?? "").toLowerCase().includes(search)),
      );
  }, [entries, selectedMonth, searchText]);

  if (isError) {
    return <><DataErrorState /><SiteFooter /></>;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 max-w-5xl mx-auto px-5 sm:px-6">
      <header className="mb-8">
        <span className="page-label">DIARIO OPERATIVO</span>
        <h1 className="font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide bebas text-foreground mt-2">
          JOURNALING
        </h1>
        {siteContent?.journaling_intro && (
          <p className="mt-6 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/80">
            {siteContent.journaling_intro}
          </p>
        )}
      </header>

      <section aria-label="Giornate del diario">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-serif text-[clamp(32px,6vw,48px)] leading-none bebas">LE GIORNATE</h2>
          {entries && (
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground" aria-live="polite">
              {filteredEntries.length} giorni
            </span>
          )}
        </div>

        {entries && entries.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <select
              aria-label="Filtra le giornate per mese"
              value={selectedMonth}
              onChange={(event) => { setSelectedMonth(event.target.value); setVisibleCount(PAGE_SIZE); }}
              className="bg-[#141414] border border-border px-4 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary uppercase tracking-wider"
            >
              <option value="all">Tutti i mesi</option>
              {monthOptions.map((month) => {
                const [year, number] = month.split("-").map(Number);
                return <option key={month} value={month}>{format(new Date(year, number - 1, 1), "MMMM yyyy", { locale: it })}</option>;
              })}
            </select>
            <input
              type="search"
              aria-label="Cerca per numero o testo della giornata"
              placeholder="Cerca nel diario..."
              value={searchText}
              onChange={(event) => { setSearchText(event.target.value); setVisibleCount(PAGE_SIZE); }}
              className="min-w-0 flex-1 bg-[#141414] border border-border px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
            {(selectedMonth !== "all" || searchText.trim()) && (
              <button
                onClick={() => { setSelectedMonth("all"); setSearchText(""); setVisibleCount(PAGE_SIZE); }}
                className="border border-border px-4 py-2.5 text-[11px] uppercase tracking-wider hover:bg-[#141414]"
              >
                Mostra tutte
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div role="status" className="flex flex-col items-center gap-5 py-20">
            <span className="day-progress-ring" aria-hidden="true" />
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground">Caricamento giornate...</p>
          </div>
        ) : !entries?.length ? (
          <p className="border border-border bg-card p-10 text-center font-serif text-[28px]">IL PRIMO GIORNO ARRIVA PRESTO.</p>
        ) : !filteredEntries.length ? (
          <p className="border border-border bg-card p-10 text-center font-serif text-[28px]">NESSUN RISULTATO.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredEntries.slice(0, visibleCount).map((entry, index) => (
                <DayCard key={entry.id} entry={entry} featured={index === 0} />
              ))}
            </div>
            {visibleCount < filteredEntries.length && (
              <div className="flex justify-center py-8">
                <button
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="border border-border px-8 py-3 font-serif text-[15px] uppercase tracking-wider hover:bg-[#141414]"
                >
                  CARICA ALTRI ({filteredEntries.length - visibleCount})
                </button>
              </div>
            )}
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
