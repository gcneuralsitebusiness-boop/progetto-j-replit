import { useGetLatestEntries, useListEntries, useGetCoaching, useGetSiteContent, useListArticles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";
import { Timeline180 } from "@/components/Timeline180";
import { DayCard } from "@/components/DayCard";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { PulseTrace } from "@/components/PulseTrace";
import { ArrowRight, Users, Flame, Dumbbell, Heart, Wallet } from "lucide-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { getArticlePlainText } from "@/components/ArticleContent";

export default function Home() {
  const { data: latestEntries, isLoading: latestLoading, isError: latestError } = useGetLatestEntries();
  const { data: allEntries, isLoading: allLoading, isError: allError } = useListEntries();
  const { data: coaching, isLoading: coachingLoading, isError: coachingError } = useGetCoaching();
  const { data: siteContent, isLoading: siteContentLoading, isError: siteContentError } = useGetSiteContent();
  const { data: articles, isLoading: articlesLoading, isError: articlesError } = useListArticles();
  const isError = latestError || allError || coachingError || siteContentError || articlesError;
  const isLoading = latestLoading || allLoading || coachingLoading || siteContentLoading || articlesLoading;

  const heroTitolo = siteContent?.home_hero_titolo || "PROGETTO J · 180 DAYS";
  const heroSottotitolo = siteContent?.home_hero_sottotitolo || "Disciplina. Tracking. Dati.";
  const ctaTesto = siteContent?.home_cta_testo || "Segui il percorso";
  const communityTesto = siteContent?.home_community_testo || coaching?.communityCta || "Entra nella community italiana e trova gente con la tua stessa fame.";

  const totalDays = allEntries?.length ?? 0;
  const currentDay = allEntries && allEntries.length > 0
    ? Math.max(...allEntries.map((e) => e.numero))
    : 0;
  const totalKm = allEntries?.reduce((sum, e) => sum + (e.km || 0), 0) ?? 0;
  const totalKcal = allEntries?.reduce((sum, e) => sum + (e.kcal || 0), 0) ?? 0;
  const totalIncome = allEntries?.reduce((sum, e) => sum + (e.entrate || 0), 0) ?? 0;
  const remainingDays = Math.max(180 - currentDay, 0);
  const sortedEntries = allEntries ? [...allEntries].sort((a, b) => a.numero - b.numero) : [];
  const firstEntry = sortedEntries[0];
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const latestDay = lastEntry;
  const latestArticle = articles
    ? [...articles]
      .filter((article) => article.pubblicato)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
    : undefined;
  const progressPercent = Math.min(100, Math.round((currentDay / 180) * 100));
  const latestArticleExcerpt = latestArticle
    ? getArticlePlainText(latestArticle.contenuto).slice(0, 180).replace(/\s+\S*$/, "") + (getArticlePlainText(latestArticle.contenuto).length > 180 ? "…" : "")
    : "";
  const comparisonMetrics = [
    { label: "PESO", unit: "KG", first: firstEntry?.peso, last: lastEntry?.peso, fraction: 1 },
    { label: "BATTITO", unit: "BPM", first: firstEntry?.battito, last: lastEntry?.battito, fraction: 0 },
  ].filter((metric) => metric.first != null && metric.last != null);

  const tickerItems = [
    { icon: Flame, label: "GIORNI", value: totalDays },
    { icon: Dumbbell, label: "KM", value: totalKm },
    { icon: Heart, label: "KCAL", value: totalKcal.toLocaleString() },
    { icon: Wallet, label: "ENTRATE", value: `€${totalIncome}` },
  ];

  const tickerContent = (
    <div className="ticker-track">
      {[...tickerItems, ...tickerItems].map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-6 sm:px-8 text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
          <item.icon size={14} className="text-iron" />
          <span className="measured text-foreground">{item.value}</span>
          <span>{item.label}</span>
          <span className="text-iron">·</span>
        </div>
      ))}
    </div>
  );

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col">
        <DataErrorState />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="min-h-[85svh] flex flex-col items-center justify-center px-5 sm:px-6 py-20 text-center relative hero-radial overflow-hidden">
          {allEntries && <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-0"><PulseTrace entries={allEntries} variant="hero" /></div>}
          <Reveal className="relative z-10">
            <h1 className="font-serif text-[clamp(120px,28vw,280px)] leading-[0.73] text-primary bebas tracking-[0.02em]">J</h1>
            <div className="page-label mx-auto w-fit text-primary before:!bg-primary">PERCORSO IN CORSO</div>
            <h2 className="font-serif text-[clamp(24px,6vw,44px)] text-foreground tracking-[0.08em] mt-4 sm:mt-6 mb-4 bebas">
              {heroTitolo}
            </h2>
            <p className="text-[14px] sm:text-[15px] font-sans text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed uppercase tracking-[0.12em]">
              {heroSottotitolo}
            </p>
            {currentDay > 0 && (
              <div className="mx-auto mb-8 max-w-md">
                <div className="flex items-end justify-between text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  <span>GIORNO {String(currentDay).padStart(3, "0")} / 180</span>
                  <span className="text-primary">{progressPercent}%</span>
                </div>
                <div className="h-1 bg-iron"><div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }} /></div>
              </div>
            )}
            <Link href="/journaling" className="btn-primary">
              {ctaTesto} <ArrowRight size={16} />
            </Link>

            {/* Live hero data strip */}
            {currentDay > 0 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <span className="hero-data-item"><strong className="measured">GG {currentDay}</strong> / 180</span>
                <span className="text-iron text-[10px]">·</span>
                <span className="hero-data-item"><strong className="measured">{totalKm}</strong> km</span>
                <span className="text-iron text-[10px]">·</span>
                <span className="hero-data-item"><strong className="measured">{totalKcal.toLocaleString("it-IT")}</strong> kcal</span>
                {totalIncome > 0 && (
                  <>
                    <span className="text-iron text-[10px]">·</span>
                    <span className="hero-data-item"><strong className="measured">€{totalIncome.toLocaleString("it-IT")}</strong></span>
                  </>
                )}
              </div>
            )}
            {allEntries && (() => {
              const pulse = allEntries.filter((entry) => entry.battito != null).sort((a, b) => a.numero - b.numero);
              return pulse.length >= 2 ? (
                <p className="mt-5 text-[10px] font-sans uppercase tracking-[0.25em] text-muted-foreground">
                  BATTITO A RIPOSO · <span className="measured">{pulse[0].battito}</span> <span className="text-iron">→</span> <span className="measured">{pulse[pulse.length - 1].battito}</span> BPM
                </p>
              ) : null;
            })()}
            <p className="mt-4 text-[10px] font-sans uppercase tracking-[0.25em] text-muted-foreground">
              AGGIORNATO OGNI GIORNO
            </p>
            {remainingDays > 0 && (
              <div className="mt-16 text-center">
                <div className="measured text-[clamp(40px,10vw,88px)] leading-none text-foreground">{remainingDays}</div>
                <div className="mt-3 text-[11px] font-sans uppercase tracking-[0.25em] text-muted-foreground">
                  GIORNI AL TRAGUARDO
                </div>
              </div>
            )}
          </Reveal>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-muted-foreground/60">Scorri</span>
            <div className="scroll-hint-line" />
          </div>
        </section>

        {/* Live ticker */}
        {totalDays > 0 && (
          <div className="border-y border-border bg-card overflow-hidden py-3">
            {tickerContent}
          </div>
        )}

        {/* Latest update + editorial content */}
        {(latestDay || latestArticle) && (
          <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-20 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
              {latestDay && (
                <Reveal>
                  <div>
                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <span className="page-label">ULTIMO AGGIORNAMENTO</span>
                        <h3 className="font-serif text-[clamp(42px,7vw,72px)] leading-[0.82] text-foreground bebas mt-2">
                          GIORNO {String(latestDay.numero).padStart(3, "0")}
                        </h3>
                      </div>
                      <Link href={`/giorno/${latestDay.numero}`} className="hidden sm:inline-flex text-[11px] uppercase tracking-[0.2em] text-primary hover:text-foreground">
                        APRI <ArrowRight size={14} />
                      </Link>
                    </div>
                    <DayCard entry={latestDay} featured />
                  </div>
                </Reveal>
              )}
              {latestArticle && (
                <Reveal delay={100}>
                  <Link href={`/a/${latestArticle.slug}`} className="group block h-full border border-border bg-card p-6 sm:p-8 card-lift hover:border-iron">
                    <span className="page-label">ULTIMO ARTICOLO</span>
                    <div className="mt-12 flex flex-col h-[calc(100%-3rem)]">
                      <span className="text-[10px] font-sans uppercase tracking-[0.22em] text-primary">{latestArticle.categoria}</span>
                      <h3 className="mt-4 font-serif text-[clamp(38px,5vw,58px)] leading-[0.86] text-foreground bebas group-hover:text-primary transition-colors">
                        {latestArticle.titolo}
                      </h3>
                      <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">{latestArticleExcerpt}</p>
                      <span className="mt-auto pt-10 inline-flex items-center gap-2 text-[11px] font-sans uppercase tracking-[0.2em] text-primary">
                        Leggi l'articolo <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              )}
            </div>
          </section>
        )}

        {comparisonMetrics.length > 0 && firstEntry && lastEntry && (
          <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-24 w-full">
            <Reveal>
              <div className="border-t border-iron pt-8">
                <h3 className="font-serif text-[clamp(28px,6vw,48px)] leading-none tracking-wide bebas text-foreground">
                  GIORNO {firstEntry.numero} → GIORNO {lastEntry.numero}
                </h3>
                {firstEntry.foto && lastEntry.foto && (
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {[firstEntry, lastEntry].map((entry) => (
                      <div key={entry.id}>
                        <div className="aspect-[4/3] overflow-hidden border border-iron bg-[#0A0A0A]">
                          <img src={getPhotoUrl(entry.foto) ?? undefined} alt={`Giorno ${entry.numero}`} className="h-full w-full object-cover grayscale" />
                        </div>
                        <div className="mt-2 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                          GIORNO {entry.numero}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">PRIMA</div>
                  <div className="hidden text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground sm:block">ORA</div>
                  {comparisonMetrics.map((metric) => {
                    const first = metric.first as number;
                    const last = metric.last as number;
                    const improved = last < first;
                    return (
                      <div key={metric.label} className="sm:col-span-2 grid grid-cols-[1fr_auto_1fr] items-end gap-4 border-t border-border pt-4">
                        <div>
                          <div className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</div>
                          <div className="measured mt-2 text-[clamp(32px,7vw,56px)] leading-none text-foreground">{first.toFixed(metric.fraction)} {metric.unit}</div>
                        </div>
                        <span className="pb-2 text-xl text-iron">→</span>
                        <div className="text-right">
                          <div className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">ORA</div>
                          <div className={`measured mt-2 text-[clamp(32px,7vw,56px)] leading-none ${improved ? "text-primary" : "text-foreground"}`}>{last.toFixed(metric.fraction)} {metric.unit}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* Timeline */}
        <section className="max-w-5xl mx-auto px-5 sm:px-6 py-24 w-full">
          <Reveal>
            {allLoading ? (
              <div className="text-center text-muted-foreground italic font-serif text-xl py-20">Caricamento...</div>
            ) : (
              <Timeline180 entries={allEntries ?? []} />
            )}
          </Reveal>
        </section>

        <div className="max-w-5xl mx-auto"><PulseTrace entries={allEntries ?? []} variant="divider" /></div>

        {/* Latest Days */}
        <section className="max-w-5xl mx-auto px-5 sm:px-6 py-24 w-full">
          <Reveal>
            <div className="flex items-end justify-between mb-10">
              <h3 className="font-serif text-[clamp(48px,10vw,96px)] leading-[0.85] tracking-wide bebas text-foreground">
                ULTIMI GIORNI
              </h3>
              <Link
                href="/journaling"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-sans uppercase tracking-[0.2em] text-primary hover:text-foreground transition-colors"
              >
                Vedi tutti <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestLoading || !latestEntries ? (
              <Reveal>
                <p className="text-center text-muted-foreground italic font-serif text-xl py-12 md:col-span-3">Caricamento...</p>
              </Reveal>
            ) : latestEntries.length === 0 ? (
              <Reveal>
                <p className="text-center text-muted-foreground italic text-xl py-12 md:col-span-3 font-serif">
                  I dati arriveranno presto.
                </p>
              </Reveal>
            ) : (
              latestEntries.map((entry) => (
                <Reveal key={entry.id}>
                  <DayCard entry={entry} />
                </Reveal>
              ))
            )}
          </div>

          <div className="mt-10 flex justify-center sm:hidden">
            <Link
              href="/journaling"
              className="btn-ghost !px-5 !py-2 !text-[11px]"
            >
              Vedi tutti <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Community CTA bar */}
        <section className="max-w-5xl mx-auto px-5 sm:px-6 py-16 w-full">
          <Reveal>
            <a
              href={coaching?.communityUrl || "#"}
              className="group block border border-iron bg-card p-5 sm:p-6 card-lift hover:border-iron transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="border border-primary p-3 sm:p-4 shrink-0">
                    <Users size={28} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary">COMMUNITY</span>
                    <p className="text-[16px] sm:text-[18px] font-sans text-foreground leading-relaxed max-w-lg">
                      {communityTesto}
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 border border-primary text-primary font-sans text-[13px] uppercase tracking-[0.2em] px-5 py-2.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  Entra <ArrowRight size={16} />
                </div>
              </div>
            </a>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
