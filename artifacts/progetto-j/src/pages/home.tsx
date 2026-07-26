import { useGetLatestEntries, useListEntries, useGetCoaching, useGetSiteContent } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { Timeline180 } from "@/components/Timeline180";
import { DayCard } from "@/components/DayCard";
import { ArrowRight, Users, Flame, Dumbbell, Heart, Wallet } from "lucide-react";

export default function Home() {
  const { data: latestEntries, isLoading: latestLoading } = useGetLatestEntries();
  const { data: allEntries, isLoading: allLoading } = useListEntries();
  const { data: coaching } = useGetCoaching();
  const { data: siteContent } = useGetSiteContent();

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
          <item.icon size={14} className="text-primary" />
          <span className="text-foreground">{item.value}</span>
          <span>{item.label}</span>
          <span className="text-primary">·</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-20 text-center relative hero-radial">
          <Reveal className="relative z-10">
            <h1 className="font-serif text-[clamp(120px,28vw,280px)] leading-[0.75] text-primary bebas tracking-wide glow-red hero-glitch">J</h1>
            <h2 className="font-serif text-[clamp(24px,6vw,44px)] text-foreground tracking-[0.08em] mt-4 sm:mt-6 mb-6 bebas">
              {heroTitolo}
            </h2>
            <p className="text-[14px] sm:text-[15px] font-sans text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed uppercase tracking-[0.12em]">
              {heroSottotitolo}
            </p>
            <Link href="/journaling" className="btn-primary">
              {ctaTesto} <ArrowRight size={16} />
            </Link>

            {/* Live hero data strip */}
            {currentDay > 0 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <span className="hero-data-item"><strong>GG {currentDay}</strong> / 180</span>
                <span className="text-primary/40 text-[10px]">·</span>
                <span className="hero-data-item"><strong>{totalKm}</strong> km</span>
                <span className="text-primary/40 text-[10px]">·</span>
                <span className="hero-data-item"><strong>{totalKcal.toLocaleString("it-IT")}</strong> kcal</span>
                {totalIncome > 0 && (
                  <>
                    <span className="text-primary/40 text-[10px]">·</span>
                    <span className="hero-data-item"><strong>€{totalIncome.toLocaleString("it-IT")}</strong></span>
                  </>
                )}
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

        <div className="cut-divider max-w-5xl mx-auto" />

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
              className="group block border border-primary bg-card p-5 sm:p-6 metallic-sheen card-lift hover:border-primary transition-colors"
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

      <footer className="border-t border-border py-12 mt-12 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex flex-col items-center gap-6">
          <Cross />
          <span className="font-serif text-[18px] text-primary bebas">
            {siteContent?.global_footer_mantra || "IC XC NIKA"}
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/chi-sono" className="hover:text-primary transition-colors">Chi Sono</Link>
            <Link href="/journaling" className="hover:text-primary transition-colors">Journaling</Link>
            <Link href="/articoli" className="hover:text-primary transition-colors">Articoli</Link>
            <Link href="/coaching" className="hover:text-primary transition-colors">Coaching</Link>
            <Link href="/social" className="hover:text-primary transition-colors">Social</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
