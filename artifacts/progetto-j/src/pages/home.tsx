import { useEffect, useState } from "react";
import { useGetLatestEntries, getGetLatestEntriesQueryKey, useListEntries, useGetSiteContent } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";
import { Timeline180 } from "@/components/Timeline180";
import { DayCard } from "@/components/DayCard";
import { DayCardSkeleton } from "@/components/DayCardSkeleton";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { PulseTrace } from "@/components/PulseTrace";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { AccessoBlock } from "@/components/AccessoBlock";
import { ArrowRight, Flame, Dumbbell, Heart, Wallet } from "lucide-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { isUnfinishedToday } from "@/lib/current-day";
import { FASE1_DATA } from "@/data/fase1";

export default function Home() {
  const { data: latestEntries, isLoading: latestLoading, isError: latestError } = useGetLatestEntries(undefined, {
    query: {
      queryKey: getGetLatestEntriesQueryKey(),
      refetchInterval: (query) => query.state.data?.some((entry) => isUnfinishedToday(entry)) ? 10_000 : false,
    },
  });
  const { data: allEntries, isLoading: allLoading, isError: allError } = useListEntries();
  const { data: siteContent, isLoading: siteContentLoading, isError: siteContentError } = useGetSiteContent();
  const isError = latestError || allError || siteContentError;
  const isLoading = latestLoading || allLoading || siteContentLoading;

  const ctaTesto = siteContent?.home_cta_testo || "Segui il percorso";
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalDays = allEntries?.length ?? 0;
  const currentDay = allEntries && allEntries.length > 0
    ? Math.max(...allEntries.map((e) => e.numero))
    : 0;
  const totalKm = allEntries?.reduce((sum, e) => sum + (e.km || 0), 0) ?? 0;
  const totalKcal = allEntries?.reduce((sum, e) => sum + (e.kcal || 0), 0) ?? 0;
  const totalIncome = allEntries?.reduce((sum, e) => sum + (e.entrate || 0), 0) ?? 0;
  const sortedEntries = allEntries ? [...allEntries].sort((a, b) => a.numero - b.numero) : [];
  const firstEntry = sortedEntries[0];
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const latestDay = lastEntry;
  const weightEntries = sortedEntries.filter((entry) => entry.peso != null);
  const firstWeight = weightEntries[0]?.peso ?? null;
  const currentWeight = weightEntries[weightEntries.length - 1]?.peso ?? null;
  const heartRateEntries = sortedEntries.filter((entry) => entry.battito != null);
  const comparisonMetrics = [
    { label: "PESO", unit: "KG", first: firstEntry?.peso ?? firstWeight, last: lastEntry?.peso ?? currentWeight, fraction: 1 },
    { label: "BATTITO", unit: "BPM", first: firstEntry?.battito ?? heartRateEntries[0]?.battito, last: lastEntry?.battito ?? heartRateEntries[heartRateEntries.length - 1]?.battito, fraction: 0 },
  ].filter((metric) => metric.first != null && metric.last != null);

  const tickerItems = [
    { icon: Flame, label: "GIORNI", value: totalDays, prefix: "", formatter: (value: number) => String(Math.round(value)) },
    { icon: Dumbbell, label: "KM", value: totalKm, prefix: "", formatter: (value: number) => value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) },
    { icon: Heart, label: "KCAL", value: totalKcal, prefix: "", formatter: (value: number) => Math.round(value).toLocaleString("it-IT") },
    { icon: Wallet, label: "ENTRATE", value: totalIncome, prefix: "€", formatter: (value: number) => Math.round(value).toLocaleString("it-IT") },
  ];

  const tickerContent = (
    <div className="ticker-track">
      {[...tickerItems, ...tickerItems].map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-6 sm:px-8 text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
          <item.icon size={14} className="text-iron" />
          <span className="measured text-foreground">
            {item.prefix}
            <AnimatedNumber value={item.value} formatter={item.formatter} />
          </span>
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
        {/* A single, readable entry point into the diary. */}
        <section className="relative isolate overflow-hidden px-5 sm:px-6 pt-28 sm:pt-36 pb-16 sm:pb-20 hero-radial">
          {heartRateEntries.length >= 2 && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-[200px] -translate-y-1/2 opacity-[0.12]" aria-hidden="true">
              <PulseTrace entries={heartRateEntries} variant="hero" />
            </div>
          )}
          <Reveal className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="mx-auto flex max-w-3xl flex-col items-center">
              <div className="page-label w-fit text-primary before:!bg-primary">GIORNO {String(currentDay).padStart(3, "0")} / 180</div>
              <div className="mt-5 font-serif text-[clamp(120px,25vw,220px)] leading-[0.72] text-primary bebas tracking-[0.02em]" aria-label={`Giorno ${String(currentDay).padStart(3, "0")}`}>
                <AnimatedNumber
                  value={currentDay}
                  className="!font-serif"
                  formatter={(value) => String(Math.round(value)).padStart(3, "0")}
                  duration={1600}
                />
              </div>
              <Link
                href={FASE1_DATA.route}
                className="mt-8 inline-flex max-w-full items-center justify-center border border-[#E8E4DE] bg-transparent px-8 py-4 text-center font-mono text-[13px] uppercase tracking-[0.15em] text-[#E8E4DE] transition-colors hover:bg-[#E8E4DE] hover:text-[#0A0A0A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8E4DE]"
              >
                {FASE1_DATA.homeButton}
              </Link>
              {firstWeight != null && currentWeight != null && (
                <div className="measured mt-7 text-[16px] uppercase tracking-[0.12em] sm:text-[18px]">
                  <span className="text-muted-foreground line-through">{firstWeight.toFixed(1)} KG</span>
                  <span className="mx-3 text-primary">→</span>
                  <span className="text-[hsl(var(--acid))]">{currentWeight.toFixed(1)} KG</span>
                </div>
              )}
              <p className="mt-5 max-w-sm text-center font-sans text-[13px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[14px]">
                NON È MOTIVAZIONE. SONO NUMERI. 180 GIORNI, TUTTI PUBBLICI.
              </p>
              <Link href="/journaling" className="btn-primary mt-8">
                 {currentDay > 0 ? "COSA È SUCCESSO OGGI →" : ctaTesto}
                 {currentDay === 0 && <ArrowRight size={16} />}
              </Link>
              <div className={`mt-8 transition-opacity duration-500 ${hasScrolled ? "opacity-0" : "opacity-100"}`} aria-hidden={hasScrolled}>
                <div className="scroll-hint-line" />
              </div>
            </div>
          </Reveal>
        </section>

        {/* Live ticker */}
        {totalDays > 0 && (
          <div className="border-y border-border bg-card overflow-hidden py-3">
            {tickerContent}
          </div>
        )}

        {comparisonMetrics.length > 0 && firstEntry && lastEntry && (
          <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-24 w-full">
            <Reveal>
              <div className="border-t border-iron pt-8">
                <span className="page-label">LA TRASFORMAZIONE</span>
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
                          <div className="mt-2 text-[clamp(32px,7vw,56px)] leading-none text-foreground">
                            <AnimatedNumber value={first} formatter={(value) => `${value.toFixed(metric.fraction)} ${metric.unit}`} />
                          </div>
                        </div>
                        <span className="pb-2 text-xl text-iron">→</span>
                        <div className="text-right">
                          <div className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">ORA</div>
                          <div className={`mt-2 text-[clamp(32px,7vw,56px)] leading-none ${improved ? "text-primary" : "text-foreground"}`}>
                            <AnimatedNumber value={last} formatter={(value) => `${value.toFixed(metric.fraction)} ${metric.unit}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* The latest diary day stands on its own; editorial lives in Articoli. */}
        {latestDay && (
          <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-16 sm:pt-20 w-full">
            <Reveal>
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
            </Reveal>
          </section>
        )}

        {/* Timeline */}
        <section className="max-w-5xl mx-auto px-5 sm:px-6 py-24 w-full">
          <Reveal>
            {allLoading ? (
              <div className="h-24 animate-pulse bg-iron/20" aria-hidden="true" />
            ) : (
              <Timeline180 entries={allEntries ?? []} />
            )}
          </Reveal>
        </section>

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
              <>
                <DayCardSkeleton />
                <DayCardSkeleton />
                <DayCardSkeleton />
              </>
            ) : latestEntries.length === 0 ? (
              <Reveal>
                <p className="text-center text-muted-foreground italic text-xl py-12 md:col-span-3 font-serif">
                  I dati arriveranno presto.
                </p>
              </Reveal>
            ) : (
              latestEntries.map((entry) => (
                <Reveal key={entry.id}>
                  <DayCard entry={entry} hookOnly />
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

        <div className="max-w-5xl mx-auto px-5 sm:px-6 w-full" aria-hidden="true">
          {heartRateEntries.length >= 2 ? (
            <PulseTrace entries={heartRateEntries} variant="divider" />
          ) : (
            <div className="h-px bg-border" />
          )}
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 w-full">
          <AccessoBlock />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
