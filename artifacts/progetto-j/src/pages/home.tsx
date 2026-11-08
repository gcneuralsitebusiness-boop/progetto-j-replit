import { useMemo } from "react";
import { Link } from "wouter";
import {
  getGetLatestEntriesQueryKey,
  getListEntriesQueryKey,
  useListArticles,
  useGetLatestEntries,
  useListEntries,
} from "@workspace/api-client-react";
import type { Article, Entry } from "@workspace/api-client-react";
import { DataErrorState } from "@/components/DataErrorState";
import { DayCardSkeleton } from "@/components/DayCardSkeleton";
import { Delta } from "@/components/Delta";
import { PulseTrace } from "@/components/PulseTrace";
import { SiteFooter } from "@/components/SiteFooter";
import { FASE1_DATA } from "@/data/fase1";
import { SEASON_2_START_DATE } from "@/lib/seasons";
import { dayPath } from "@/lib/seasons";

// Update this value manually when a new verified weigh-in is available.
const CURRENT_WEIGHT_KG = 83.4;
const JOURNEY_START_WEIGHT_KG = 130;

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
  if (date < SEASON_2_START_DATE) return 1;
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
  const money = (value: number) => `€${value.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
  return [
    { label: "GIORNI DI ALLENAMENTO", previous: trainingDays(previous), current: trainingDays(current), format: (value) => String(value) },
    { label: "ROUND TOTALI", previous: sum(previous, "round"), current: sum(current, "round"), format: (value) => value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) },
    { label: "SONNO MEDIO", previous: averageSleep(previous), current: averageSleep(current), format: (value) => `${value.toLocaleString("it-IT", { maximumFractionDigits: 1 })} H` },
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
    <div className="season-home__week" aria-labelledby="weekly-title">
      <p className="season-home__mono season-home__eyebrow">STAGIONE 2 · LUNEDÌ — DOMENICA</p>
      <h3 id="weekly-title" className="season-home__subheading">SETTIMANA SU SETTIMANA</h3>
      {!completePreviousWeek ? (
        <p className="season-home__mono season-home__muted" data-testid="status-week-comparison">CONFRONTO DISPONIBILE DALLA SECONDA SETTIMANA</p>
      ) : (
        <>
          <div className="season-home__mono season-home__muted season-home__week-labels">
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
    </div>
  );
}

function fase1Value(id: string): number {
  const stat = FASE1_DATA.sections.flatMap((section) => section.stats).find((item) => item.id === id);
  const numberSegment = stat?.segments.find((segment) => segment.kind === "number");
  return numberSegment?.kind === "number" ? numberSegment.number.value : 0;
}

function formatArticleDate(article: Article): string {
  const date = article.data || article.createdAt;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`));
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
  const { data: articles, isLoading: articlesLoading, isError: articlesError } = useListArticles();

  const sortedEntries = useMemo(
    () => [...(entries ?? [])].sort((a, b) => a.data.localeCompare(b.data)),
    [entries],
  );
  const recentEntries = useMemo(
    () => [...(latestEntries ?? [])].sort((a, b) => b.numero - a.numero).slice(0, 3),
    [latestEntries],
  );
  const recentArticles = useMemo(
    () => [...(articles ?? [])]
      .filter((article) => article.pubblicato)
      .sort((a, b) => (b.data || b.createdAt).localeCompare(a.data || a.createdAt))
      .slice(0, 3),
    [articles],
  );
  const latest = sortedEntries.at(-1);
  const today = romeToday();
  const days = today < SEASON_2_START_DATE
    ? 1
    : Math.min(Math.max(latest?.numero ?? 0, seasonDayForDate(today)), 180);
  const startingWeight = JOURNEY_START_WEIGHT_KG.toLocaleString("it-IT");
  const currentWeight = CURRENT_WEIGHT_KG.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  if (isError || latestError) return <div className="season-root" data-season="2"><DataErrorState /><SiteFooter /></div>;

  return (
    <div className="season-home season-root min-h-[100dvh]" data-season="2">
      <main>
        <section className="season-home__hero" aria-labelledby="home-title">
          <div className="season-home__wrap">
            <p className="season-home__mono season-home__hero-label">PROJECT J · STAGIONE 2</p>
            <h1 id="home-title" className="season-home__hero-title">
              <span>130 chili. Dipendente. Una vita finita a 20 anni.</span>
              <span>Battere la dipendenza mi ha insegnato a combattere — non il contrario.</span>
              <span>Oggi documento la risalita. Ogni giorno, senza nascondere niente.</span>
            </h1>
            <p className="season-home__mono season-home__hero-meta" data-testid="text-current-season-day">
              Project J · la mia trasformazione documentata ogni giorno, dati veri inclusi · Giorno {days}
            </p>
          </div>
        </section>

        <section className="season-home__section season-home__pact" aria-labelledby="pact-title">
          <div className="season-home__wrap">
            <h2 id="pact-title" className="season-home__section-title">Non è un diario motivazionale.</h2>
            <p className="season-home__pact-copy">È la prova che si può cambiare vita. Giorno per giorno, passo per passo, fallimento per fallimento.</p>
          </div>
        </section>

        <section className="season-home__section season-home__proof" aria-labelledby="proof-title">
          <div className="season-home__wrap">
            <p className="season-home__mono season-home__eyebrow">PROVA</p>
            <h2 id="proof-title" className="season-home__section-title">I NUMERI NON MENTONO</h2>
            <p className="season-home__proof-intro">Il viaggio finora · 180 giorni documentati</p>
            <div className="season-home__proof-grid graph-paper" data-testid="data-proof-numbers">
              <div className="season-home__proof-stat"><strong>{startingWeight} → {currentWeight} kg</strong></div>
              <div className="season-home__proof-stat"><strong>{fase1Value("round").toLocaleString("it-IT")} round di MMA</strong></div>
              <div className="season-home__proof-stat"><strong>{fase1Value("flessioni").toLocaleString("it-IT")} flessioni</strong></div>
              <div className="season-home__proof-stat"><strong>{fase1Value("km").toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km di corsa</strong></div>
            </div>
            <p className="season-home__proof-note">Tutto pubblico, giorno per giorno. Niente è nascosto.</p>
            <Link href="/statistiche?stagione=1" className="season-home__link" data-testid="link-all-data-s1">VEDI TUTTI I DATI</Link>
          </div>
        </section>

        <section className="season-home__section season-home__gates" aria-label="Esplora il progetto">
          <div className="season-home__wrap">
            <article className="season-home__gate">
              <h2>SCRITTI</h2>
              <p>La mia anima, la mia fede, il mio percorso, la mia visione.</p>
              <Link href="/articoli" data-testid="link-gate-articoli">LEGGI</Link>
            </article>
            <article className="season-home__gate">
              <h2>DIARIO</h2>
              <p>Ogni giorno, anche i giorni di merda.</p>
              <Link href="/journaling?stagione=2" data-testid="link-gate-diario">APRI IL DIARIO</Link>
            </article>
            <article className="season-home__gate">
              <h2>STATISTICHE</h2>
              <p>I dati veri, senza filtri.</p>
              <Link href="/statistiche?stagione=2" data-testid="link-gate-statistiche">VEDI I NUMERI</Link>
            </article>
          </div>
        </section>

        <section className="season-home__section season-home__now" aria-labelledby="now-title">
          <div className="season-home__wrap">
            <h2 id="now-title" className="season-home__section-title">ADESSO</h2>
            <Comparison entries={sortedEntries} />
            <div className="season-home__now-grid graph-paper">
              <section className="season-home__feed" aria-labelledby="latest-title">
                <h3 id="latest-title" className="season-home__subheading">ULTIMI GIORNI</h3>
                {latestLoading || isLoading ? (
                  <div className="season-home__skeletons" role="status" aria-label="Caricamento giornate">
                    <DayCardSkeleton />
                    <DayCardSkeleton />
                  </div>
                ) : recentEntries.length > 0 ? (
                  <div className="season-home__feed-list">
                    {recentEntries.map((entry) => (
                      <Link key={entry.id} href={dayPath(entry.numero, 2)} className="season-home__day" data-testid={`link-season2-day-${entry.numero}`}>
                        <span className="season-home__day-copy">
                          <strong>GIORNO {String(entry.numero).padStart(3, "0")}</strong>
                          <span className="season-home__mono">{new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${entry.data}T12:00:00Z`))}</span>
                        </span>
                        <span className="season-home__mono">APRI</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="season-home__mono season-home__muted" data-testid="status-no-season2-days">NESSUN GIORNO PUBBLICATO.</p>
                )}
                <Link href="/journaling?stagione=2" className="season-home__link" data-testid="link-open-diary">APRI IL DIARIO</Link>
              </section>

              <section className="season-home__feed" aria-labelledby="articles-title">
                <h3 id="articles-title" className="season-home__subheading">ULTIMI SCRITTI</h3>
                {articlesLoading ? (
                  <div className="season-home__article-skeletons" role="status" aria-label="Caricamento scritti">
                    <span /><span /><span />
                  </div>
                ) : articlesError ? (
                  <p className="season-home__mono season-home__muted" data-testid="status-articles-error">SCRITTI NON DISPONIBILI.</p>
                ) : recentArticles.length > 0 ? (
                  <div className="season-home__feed-list">
                    {recentArticles.map((article) => (
                      <Link key={article.id} href={`/a/${article.slug}`} className="season-home__article" data-testid={`link-article-${article.slug}`}>
                        <strong>{article.titolo}</strong>
                        <span className="season-home__mono">{formatArticleDate(article)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="season-home__mono season-home__muted" data-testid="status-no-articles">NESSUNO SCRITTO PUBBLICATO.</p>
                )}
                <Link href="/articoli" className="season-home__link" data-testid="link-all-articles">LEGGI TUTTI GLI SCRITTI</Link>
              </section>
            </div>
            <div className="season-home__pulse" aria-label="Traccia del battito">
              <PulseTrace entries={sortedEntries} variant="divider" />
            </div>
          </div>
        </section>

        <section className="season-home__section season-home__archive" aria-labelledby="archive-title">
          <div className="season-home__wrap">
            <h2 id="archive-title" className="season-home__section-title">COM’È ANDATA LA STAGIONE 1</h2>
            <p className="season-home__archive-intro">180 giorni documentati. Prima di ricominciare dal Giorno 1, questo è quello che c’è dietro.</p>
            <div className="season-home__archive-grid">
              <div className="season-home__archive-stat"><strong>{fase1Value("sveglie").toLocaleString("it-IT")}</strong><span>sveglie alle 5</span></div>
              <div className="season-home__archive-stat"><strong>{fase1Value("video").toLocaleString("it-IT")} video · {Math.round(fase1Value("views") / 1_000_000).toLocaleString("it-IT")} milioni di visualizzazioni</strong></div>
              <div className="season-home__archive-stat"><strong>{fase1Value("sparring").toLocaleString("it-IT")}</strong><span>sparring partner</span></div>
              <div className="season-home__archive-stat"><strong>{fase1Value("paesi").toLocaleString("it-IT")}</strong><span>paesi visitati</span></div>
            </div>
            <Link href="/fase-1" className="season-home__link" data-testid="link-season1-archive">VEDI L’ARCHIVIO COMPLETO</Link>
          </div>
        </section>

        <section className="season-home__section season-home__about" aria-labelledby="about-title">
          <div className="season-home__wrap">
            <p className="season-home__mono season-home__eyebrow">CHI SONO</p>
            <h2 id="about-title" className="season-home__section-title">21 anni. Lavoro sui pali, mi alleno ogni giorno, scrivo.</h2>
            <p>Questo sito è dove non nascondo niente.</p>
            <Link href="/chi-sono" className="season-home__link" data-testid="link-about">LA MIA STORIA</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
