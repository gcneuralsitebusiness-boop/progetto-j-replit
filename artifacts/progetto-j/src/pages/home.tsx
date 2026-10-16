import { Link } from "wouter";
import { useGetLatestEntries, getGetLatestEntriesQueryKey, useListArticles } from "@workspace/api-client-react";
import { DayCard } from "@/components/DayCard";
import { DayCardSkeleton } from "@/components/DayCardSkeleton";
import { SiteFooter } from "@/components/SiteFooter";
import { PulseTrace } from "@/components/PulseTrace";
import { AccessoBlock } from "@/components/AccessoBlock";
import { isUnfinishedToday } from "@/lib/current-day";
import { useDiaryMetrics } from "@/hooks/use-diary-metrics";
import { ArticleCard, FrictionQuote, HomeError, SeasonBlock, WeekBlock } from "@/components/home/HomeSections";
import "@/components/home/home.css";

function kg(value: number | null) {
  return value == null ? "—" : value.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export default function Home() {
  const metrics = useDiaryMetrics();
  const latest = useGetLatestEntries({
    query: {
      queryKey: getGetLatestEntriesQueryKey(),
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchInterval: (query) => query.state.data?.some((entry) => isUnfinishedToday(entry)) ? 10_000 : 30_000,
    },
    request: { cache: "no-store" },
  });
  const articles = useListArticles({ limit: 3, publishedOnly: true });

  const { maxDay, firstWeight, currentWeight, latestFriction, weekly, entries } = metrics;
  const pulse = metrics.recorded.filter((e) => e.battito != null);
  const featured = latest.data ? [...latest.data].filter((entry) => Boolean(entry.testo?.trim())).sort((a, b) => b.numero - a.numero)[0] : undefined;
  const pendingToday = latest.data?.some((entry) => isUnfinishedToday(entry)) ?? false;
  const lightReady = !metrics.isLoading && !metrics.isError;

  return (
    <div className="home-root min-h-[100dvh] flex flex-col">
      <main className="flex-1">
        {/* 1. HERO */}
        <section className="home-hero">
          {pulse.length >= 2 && (
            <div className="home-pulse" aria-hidden="true"><PulseTrace entries={pulse} variant="hero" /></div>
          )}
          <div className="home-wrap relative z-10">
            <p className="home-label mb-5">PROGETTO J · UN DIARIO DI 180 GIORNI</p>
            {metrics.isLoading ? (
              <div aria-busy="true">
                <div className="home-skel" style={{ height: 16, width: 160 }} />
                <div className="home-skel" style={{ height: 120, marginTop: 28, maxWidth: 560 }} />
              </div>
            ) : metrics.isError ? (
              <HomeError label="DATI" onRetry={() => metrics.refetch()} />
            ) : (
              <>
                <div className="home-label" data-testid="text-current-day">GIORNO {maxDay} / 180</div>
                <div className="home-bar" role="progressbar" aria-valuemin={0} aria-valuemax={180} aria-valuenow={maxDay} aria-label="Avanzamento 180 giorni">
                  <span style={{ transform: `scaleX(${Math.min(maxDay, 180) / 180})` }} />
                </div>
                <h1 className="home-weights home-bebas" data-testid="text-hero-weights">
                  <span className="num first" data-testid="text-first-weight">{kg(firstWeight)}</span>
                  <span className="arrow">→</span>
                  <span className="num current" data-testid="text-current-weight">{kg(currentWeight)}</span>
                  <span className="current"> KG</span>
                </h1>
              </>
            )}
            <p className="home-lede">
              <span>Ero dipendente. Oggi lavoro in quota e combatto.</span>
              <span>Ogni giorno pubblico tutto, numeri compresi.</span>
            </p>
            <div className="home-ctas">
              <Link href="/diario" className="home-btn home-btn-primary" data-testid="link-cta-diario">LEGGI IL DIARIO</Link>
              <Link href="/chi-sono" className="home-btn home-btn-ghost" data-testid="link-cta-chi-sono">CHI SONO</Link>
            </div>
          </div>
        </section>

        {/* ORIENTAMENTO */}
        <section className="home-section home-wrap" aria-labelledby="home-orient-title">
          <div className="home-head">
            <div><span className="home-label">COME LEGGERE</span><h2 id="home-orient-title" className="home-h2">PROGETTO J</h2></div>
          </div>
          <p className="home-orient-intro">Un diario pubblico di 180 giorni: recupero, lavoro e allenamento, con testi e misure registrate giorno per giorno.</p>
          <ol className="home-paths">
            <li><Link href="/diario" className="home-path" data-testid="link-path-diario"><span className="home-label">01</span><strong>TUTTI I GIORNI</strong><span>Cerca per data, disciplina o parole.</span></Link></li>
            <li><Link href={featured ? `/giorno/${featured.numero}` : "/diario"} className="home-path" data-testid="link-path-ultimo"><span className="home-label">02</span><strong>ULTIMO GIORNO CHIUSO</strong><span>{featured ? `Giorno ${featured.numero}` : "Il più recente completato."}</span></Link></li>
            <li><Link href="/giorno/1" className="home-path" data-testid="link-path-inizio"><span className="home-label">03</span><strong>DALL'INIZIO</strong><span>Giorno 1, il punto di partenza.</span></Link></li>
          </ol>
        </section>

        {/* 2. ULTIMO ATTRITO */}
        {lightReady && latestFriction && <FrictionQuote entry={latestFriction} />}

        {/* 3. SETTIMANA */}
        <section className="home-section home-wrap">
          <div className="home-head">
            <div><span className="home-label">QUESTA SETTIMANA VS PRECEDENTE</span><h2 className="home-h2">SETTIMANA</h2></div>
            <Link href="/diario#settimana" className="home-link" data-testid="link-all-numbers">TUTTI I NUMERI →</Link>
          </div>
          {metrics.isLoading ? <div className="home-skel" style={{ height: 200 }} />
            : metrics.isError ? <HomeError label="SETTIMANA" onRetry={() => metrics.refetch()} />
            : <WeekBlock weekly={weekly} />}
        </section>

        {/* 4. ULTIMO GIORNO */}
        <section className="home-section home-wrap">
          <div className="home-head">
            <div><span className="home-label">ULTIMO GIORNO</span>{pendingToday && <span className="home-label home-pending" data-testid="text-today-pending"><span className="home-circle" aria-hidden="true" /> OGGI IN CORSO</span>}{featured && <h2 className="home-h2">GIORNO <span className="home-mono">{String(featured.numero).padStart(3, "0")}</span></h2>}</div>
            {featured && <Link href={`/giorno/${featured.numero}`} className="home-link" data-testid="link-featured-day">APRI →</Link>}
          </div>
          <div data-testid="card-featured-day">
            {latest.isLoading ? <DayCardSkeleton />
              : latest.isError ? <HomeError label="GIORNO" onRetry={() => latest.refetch()} />
              : featured ? <DayCard entry={featured} featured />
              : <p className="home-label">NESSUN GIORNO PUBBLICATO.</p>}
          </div>
        </section>

        {/* 5. ARTICOLI */}
        <section className="home-section home-wrap">
          <div className="home-head">
            <div><span className="home-label">SCRITTI</span><h2 className="home-h2">ARTICOLI</h2></div>
            <Link href="/articoli" className="home-link" data-testid="link-all-articles">TUTTI GLI ARTICOLI →</Link>
          </div>
          {articles.isLoading ? (
            <div className="home-articles">{[0, 1, 2].map((i) => <div key={i} className="home-skel" style={{ height: 260 }} />)}</div>
          ) : articles.isError ? (
            <HomeError label="ARTICOLI" onRetry={() => articles.refetch()} />
          ) : articles.data && articles.data.length > 0 ? (
            <div className="home-articles" data-testid="list-articles">
              {articles.data.slice(0, 3).map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          ) : (
            <p className="home-label">NESSUN ARTICOLO PUBBLICATO.</p>
          )}
        </section>

        {/* 6. STAGIONE 2 */}
        {lightReady && <SeasonBlock maxDay={maxDay} />}

        {/* 7. ACCESSO */}
        <div className="home-wrap" style={{ paddingTop: 72, paddingBottom: 64 }}>
          <AccessoBlock />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
