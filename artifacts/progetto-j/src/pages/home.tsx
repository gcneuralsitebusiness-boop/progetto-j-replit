import { useMemo } from "react";
import { Link } from "wouter";
import {
  getGetLatestEntriesQueryKey,
  getListEntriesQueryKey,
  useGetLatestEntries,
  useListEntries,
} from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { DataErrorState } from "@/components/DataErrorState";
import { DayCardSkeleton } from "@/components/DayCardSkeleton";
import { Delta } from "@/components/Delta";
import { SiteFooter } from "@/components/SiteFooter";
import { SEASON_2_START_DATE } from "@/lib/seasons";
import { dayPath } from "@/lib/seasons";

type WeeklyMetric = {
  label: string;
  previous: number;
  current: number;
  format: (value: number) => string;
};

function romeToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function seasonDayForDate(date: string): number {
  if (date < SEASON_2_START_DATE) return 0;
  const start = Date.parse(`${SEASON_2_START_DATE}T12:00:00Z`);
  const today = Date.parse(`${date}T12:00:00Z`);
  return Math.min(180, Math.floor((today - start) / 86_400_000) + 1);
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function mondayFor(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return shiftDate(date, weekday === 0 ? -6 : 1 - weekday);
}

function weekEntries(entries: Entry[], from: string, to: string): Entry[] {
  return entries.filter((entry) => entry.data >= from && entry.data <= to);
}

function weekMetrics(previous: Entry[], current: Entry[]): WeeklyMetric[] {
  const sum = (items: Entry[], key: "round" | "risparmio" | "entrateOnline") =>
    items.reduce((total, item) => total + (item[key] ?? 0), 0);
  const averageSleep = (items: Entry[]) => {
    const sleep = items.map((entry) => entry.sonno).filter((value): value is number => value != null);
    return sleep.length ? sleep.reduce((total, value) => total + value, 0) / sleep.length : 0;
  };
  const trainingDays = (items: Entry[]) => items.filter((entry) =>
    (entry.round ?? 0) > 0 || (entry.km ?? 0) > 0 || (entry.durata ?? 0) > 0,
  ).length;
  const alcoholDays = (items: Entry[]) => items.filter((entry) => entry.alcol === true).length;
  const money = (value: number) => `€${value.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
  return [
    { label: "GIORNI DI ALLENAMENTO", previous: trainingDays(previous), current: trainingDays(current), format: (value) => String(value) },
    { label: "ROUND TOTALI", previous: sum(previous, "round"), current: sum(current, "round"), format: (value) => value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) },
    { label: "SONNO MEDIO", previous: averageSleep(previous), current: averageSleep(current), format: (value) => `${value.toLocaleString("it-IT", { maximumFractionDigits: 1 })} H` },
    { label: "GIORNI CON ALCOL", previous: alcoholDays(previous), current: alcoholDays(current), format: (value) => String(value) },
    { label: "RISPARMIO", previous: sum(previous, "risparmio"), current: sum(current, "risparmio"), format: money },
    { label: "ENTRATE ONLINE", previous: sum(previous, "entrateOnline"), current: sum(current, "entrateOnline"), format: money },
  ];
}

function Comparison({ entries }: { entries: Entry[] }) {
  const today = romeToday();
  const monday = mondayFor(today);
  const previousStart = shiftDate(monday, -7);
  const previousEnd = shiftDate(monday, -1);
  const current = weekEntries(entries, monday, shiftDate(monday, 6));
  const previous = weekEntries(entries, previousStart, previousEnd);
  const recordedDates = new Set(previous.map((entry) => entry.data));
  const completePreviousWeek = Array.from({ length: 7 }, (_, index) => shiftDate(previousStart, index))
    .every((date) => recordedDates.has(date));

  return (
    <section className="season-home__section" aria-labelledby="weekly-title">
      <p className="season-home__mono season-home__eyebrow">STAGIONE 2 · LUNEDÌ — DOMENICA</p>
      <h2 id="weekly-title" className="season-home__section-title">SETTIMANA SU SETTIMANA</h2>
      {!completePreviousWeek ? (
        <p className="season-home__mono season-home__muted">CONFRONTO DISPONIBILE DALLA SECONDA SETTIMANA</p>
      ) : (
        <>
          <div className="season-home__mono season-home__muted" style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <span>SETTIMANA SCORSA</span><span>QUESTA SETTIMANA</span>
          </div>
          <div className="season-home__compare graph-paper">
            {weekMetrics(previous, current).map((metric) => {
              return (
                <div key={metric.label} className="season-home__metric" data-testid={`week-metric-${metric.label.toLowerCase().replaceAll(" ", "-")}`}>
                  <span className="season-home__mono season-home__metric-name">{metric.label}</span>
                  <span className="season-home__metric-values">
                    <span>{metric.format(metric.previous)}</span>
                    <span aria-hidden="true" className="season-home__muted">/</span>
                    <span>{metric.format(metric.current)}</span>
                  </span>
                  <span className="season-home__metric-delta"><Delta previous={metric.previous} current={metric.current} /></span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default function Home() {
  const params = { fase: 2 as const };
  const latestQueryKey = getGetLatestEntriesQueryKey(params);
  const allQueryKey = getListEntriesQueryKey(params);
  const { data: latestEntries, isLoading: latestLoading, isError: latestError } = useGetLatestEntries(params, {
    query: { queryKey: latestQueryKey },
  });
  const { data: entries, isLoading, isError } = useListEntries(params, {
    query: { queryKey: allQueryKey },
  });

  const sortedEntries = useMemo(
    () => [...(entries ?? [])].sort((a, b) => a.data.localeCompare(b.data)),
    [entries],
  );
  const latest = sortedEntries.at(-1);
  const today = romeToday();
  const beforeStart = today < SEASON_2_START_DATE;
  const days = Math.min(Math.max(latest?.numero ?? 0, seasonDayForDate(today)), 180);
  const showPreStart = beforeStart && !latest;
  const percent = Math.min(days / 180, 1);

  if (isError || latestError) return <><DataErrorState /><SiteFooter /></>;

  return (
    <div className="season-home season-root min-h-[100dvh]" data-season="2">
      <main>
        <section className="season-home__hero" data-season-stage={showPreStart ? "pre-start" : latest ? "active" : "awaiting-entry"}>
          <div className="season-home__wrap">
            <p className="season-home__mono season-home__hero-label">STAGIONE 2</p>
            {showPreStart ? (
              <>
                <p className="season-home__subnumber" data-testid="season-two-pregame">GIORNO 1 · DAL 7 NOVEMBRE</p>
                <div className="season-home__progress" aria-label="Avanzamento 0 su 180 giorni"><span style={{ transform: "scaleX(0)" }} /></div>
              </>
            ) : (
              <>
                <div className="season-home__number" aria-label={`Giorno ${days}`} data-testid="season-two-counter">{String(days).padStart(2, "0")}</div>
                <p className="season-home__mono" style={{ color: "var(--accent)" }}>GIORNO {days} / 180</p>
                <div className="season-home__progress" aria-label={`Avanzamento ${days} su 180 giorni`}>
                  <span style={{ transform: `scaleX(${percent})` }} />
                </div>
              </>
            )}
            <p className="season-home__motto">180 GIORNI PER MIGLIORARSI</p>
            <p className="season-home__statement">1% MEGLIO DI IERI</p>
          </div>
        </section>

        <div className="season-home__wrap">
          <Comparison entries={sortedEntries} />

          <section className="season-home__section" aria-labelledby="latest-title">
            <p className="season-home__mono season-home__eyebrow">IL DIARIO, SENZA TAGLI</p>
            <h2 id="latest-title" className="season-home__section-title">ULTIMI GIORNI</h2>
            {latestLoading || isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="status" aria-label="Caricamento giornate">
                <DayCardSkeleton /><DayCardSkeleton />
              </div>
            ) : latestEntries?.length ? (
              <div className="season-home__latest">
                {[...latestEntries].sort((a, b) => b.numero - a.numero).map((entry) => (
                  <Link key={entry.id} href={dayPath(entry.numero, 2)} className="season-home__day" data-testid={`link-season2-day-${entry.numero}`}>
                    <div>
                      <strong>GIORNO {String(entry.numero).padStart(3, "0")}</strong>
                      <span className="season-home__mono">{new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${entry.data}T12:00:00Z`))}</span>
                    </div>
                    <span className="season-home__mono">APRI</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="graph-paper border-t border-[#1A1A1A] py-7">
                <p className="season-home__mono season-home__muted">NESSUN GIORNO PUBBLICATO.</p>
                <p className="mt-3 text-[15px] text-[#E8E4DE]">
                  {beforeStart
                    ? "La stagione comincia il 7 novembre. Qui troverai il registro, un giorno alla volta."
                    : "La giornata di oggi non è ancora pubblicata. Qui troverai il registro, un giorno alla volta."}
                </p>
              </div>
            )}
            <Link href="/journaling?stagione=2" className="season-home__link">APRI IL DIARIO</Link>
          </section>
        </div>

        <section className="season-home__archive" aria-labelledby="archive-title">
          <div className="season-home__wrap">
            <p className="season-home__mono season-home__eyebrow">ARCHIVIO</p>
            <h2 id="archive-title" className="season-home__section-title">STAGIONE 1 · 180 GIORNI</h2>
            <div className="season-home__archive-grid">
              <div className="season-home__archive-stat"><strong>531</strong><span>ROUND</span></div>
              <div className="season-home__archive-stat"><strong>10.562</strong><span>FLESSIONI</span></div>
              <div className="season-home__archive-stat"><strong>281,6</strong><span>KM</span></div>
              <div className="season-home__archive-stat"><strong>180</strong><span>GIORNI DOCUMENTATI</span></div>
            </div>
            <Link href="/fase-1" className="season-home__link">VEDI TUTTI I DATI</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
