import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { Link } from "wouter";
import {
  getGetLatestEntriesQueryKey,
  getListEntriesQueryKey,
  useGetLatestEntries,
  useListEntries,
} from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { Reveal } from "@/components/Reveal";
import { FASE1_DATA } from "@/data/fase1";
import { stripHtml } from "@/lib/strip-html";
import { SEASON_2_START_DATE } from "@/lib/seasons";

type WeeklyMetric = {
  id: string;
  label: string;
  current: number | null;
  previous: number | null;
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

type HeroMedia = {
  type: "video" | "image";
  src: string;
  imageFallback?: string;
};

function assetUrl(filename: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${filename}`;
}

async function assetExists(url: string, signal: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", signal });
    return response.ok && response.headers.get("content-type")?.toLowerCase().startsWith("image/") === true;
  } catch {
    return false;
  }
}

function seasonDayForDate(date: string): number {
  if (date < SEASON_2_START_DATE) return 1;
  const start = Date.parse(`${SEASON_2_START_DATE}T12:00:00Z`);
  const today = Date.parse(`${date}T12:00:00Z`);
  return Math.min(180, Math.floor((today - start) / 86_400_000) + 1);
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function mondayFor(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return shiftDate(date, weekday === 0 ? -6 : 1 - weekday);
}

function selectWeek(entries: Entry[], from: string, to: string): Entry[] {
  return entries.filter((entry) => entry.data >= from && entry.data <= to);
}

function metricsForWeek(entries: Entry[]): Omit<WeeklyMetric, "previous">[] {
  const hasEntries = entries.length > 0;
  const trainingDays = entries.filter((entry) =>
    (entry.round ?? 0) > 0 || (entry.km ?? 0) > 0 || (entry.durata ?? 0) > 0,
  ).length;
  const rounds = entries.reduce((total, entry) => total + (entry.round ?? 0), 0);
  const sleepValues = entries.flatMap((entry) => entry.sonno == null ? [] : [entry.sonno]);
  const alcoholFreeDays = entries.filter((entry) => entry.alcol === false).length;
  return [
    { id: "training", label: "GIORNI DI ALLENAMENTO", current: hasEntries ? trainingDays : null, format: (value) => String(value) },
    { id: "rounds", label: "ROUND TOTALI", current: hasEntries ? rounds : null, format: (value) => value.toLocaleString("it-IT", { maximumFractionDigits: 1 }) },
    { id: "sleep", label: "SONNO MEDIO", current: sleepValues.length ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length : null, format: (value) => `${value.toLocaleString("it-IT", { maximumFractionDigits: 1 })} H` },
    { id: "alcohol-free", label: "GIORNI SENZA ALCOL", current: entries.some((entry) => entry.alcol != null) ? alcoholFreeDays : null, format: (value) => String(value) },
  ];
}

function weekMetrics(entries: Entry[], today: string): WeeklyMetric[] {
  const monday = mondayFor(today);
  const previousStart = shiftDate(monday, -7);
  const previousEntries = selectWeek(entries, previousStart, shiftDate(monday, -1));
  const currentEntries = selectWeek(entries, monday, today);
  const current = metricsForWeek(currentEntries);
  const previous = metricsForWeek(previousEntries);
  return current.map((metric, index) => ({ ...metric, previous: previousEntries.length ? previous[index].current : null }));
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function firstSentence(entry: Entry): string {
  const text = stripHtml(entry.testo?.trim() || entry.sintesi?.trim() || "");
  if (!text) return "TESTO NON DISPONIBILE.";
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? text).trim();
}

function phaseOneValue(id: string): number {
  const stat = FASE1_DATA.sections.flatMap((section) => section.stats).find((item) => item.id === id);
  const number = stat?.segments.find((segment) => segment.kind === "number");
  return number?.kind === "number" ? number.number.value : 0;
}

function DeltaMark({ previous, current }: { previous: number | null; current: number | null }) {
  if (previous == null || current == null || previous === current) return null;
  const improved = current > previous;
  const change = current - previous;
  return (
    <span className={`home-delta ${improved ? "home-delta--up" : "home-delta--down"}`} data-testid="weekly-metric-delta">
      <span aria-hidden="true">{improved ? "↑" : "↓"}</span>
      <span>{change > 0 ? "+" : "−"}{Math.abs(change).toLocaleString("it-IT", { maximumFractionDigits: 1 })}</span>
      <span className="home-sr-only">{improved ? "miglioramento" : "in calo"} rispetto alla settimana scorsa</span>
    </span>
  );
}

function HomeHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 80);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  return (
    <>
      <header className={`home-header${scrolled || menuOpen ? " home-header--solid" : ""}`} data-testid="home-header">
        <Link href="/" className="home-wordmark" aria-label="Project J, home" data-testid="link-home-wordmark">
          <span>PROJECT</span><span className="home-wordmark__j">J</span>
        </Link>
        <button
          type="button"
          className={`home-menu-toggle${menuOpen ? " is-open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
          aria-expanded={menuOpen}
          aria-controls="home-navigation"
          data-testid="button-home-menu"
        >
          <span /><span />
        </button>
      </header>
      <nav
        id="home-navigation"
        className={`home-menu${menuOpen ? " home-menu--open" : ""}`}
        aria-label="Navigazione principale"
        aria-hidden={!menuOpen}
        data-testid="home-navigation"
      >
        <div className="home-menu__inner">
          <a href="#origin" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>DA DOVE PARTO</a>
          <a href="#numbers" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>I NUMERI</a>
          <a href="#diary" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>IL DIARIO</a>
          <Link href="/fase-1" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>STAGIONE 1</Link>
        </div>
      </nav>
    </>
  );
}

function HeroMediaLayer() {
  const [media, setMedia] = useState<HeroMedia | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const videoUrl = assetUrl("hero-season2.mp4");
    const imageUrl = assetUrl("hero-season2.jpg");

    const discover = async () => {
      let videoAvailable = false;
      try {
        const response = await fetch(videoUrl, { method: "HEAD", signal: controller.signal });
        const size = Number(response.headers.get("content-length"));
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
        videoAvailable = response.ok && contentType.startsWith("video/")
          && Number.isFinite(size) && size > 0 && size <= 4 * 1024 * 1024;
      } catch {
        videoAvailable = false;
      }
      const imageAvailable = await assetExists(imageUrl, controller.signal);
      if (controller.signal.aborted) return;
      if (videoAvailable) setMedia({ type: "video", src: videoUrl, imageFallback: imageAvailable ? imageUrl : undefined });
      else if (imageAvailable) setMedia({ type: "image", src: imageUrl });
      else setMedia(null);
    };

    void discover();
    return () => controller.abort();
  }, []);

  const handleVideoError = () => {
    setMedia((current) => current?.imageFallback
      ? { type: "image", src: current.imageFallback }
      : null);
  };
  const handleImageError = () => setMedia(null);
  const setSlowerPlayback = (event: SyntheticEvent<HTMLVideoElement>) => {
    event.currentTarget.playbackRate = 0.82;
  };

  if (media?.type === "video") {
    return (
      <video
        className="home-hero__media"
        src={media.src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onLoadedMetadata={setSlowerPlayback}
        onError={handleVideoError}
        data-testid="home-hero-video"
      />
    );
  }
  if (media?.type === "image") {
    return (
      <img
        className="home-hero__media"
        src={media.src}
        alt=""
        loading="eager"
        onError={handleImageError}
        data-testid="home-hero-image"
      />
    );
  }
  return null;
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

  const recentEntries = useMemo(
    () => [...(latestEntries ?? [])].sort((a, b) => b.numero - a.numero).slice(0, 3),
    [latestEntries],
  );
  const today = romeToday();
  const storedDay = Math.max(...[...(entries ?? []), ...(latestEntries ?? [])].map((entry) => entry.numero), 1);
  const currentDay = today < SEASON_2_START_DATE
    ? 1
    : Math.min(180, Math.max(storedDay, seasonDayForDate(today)));
  const currentMetrics = useMemo(() => weekMetrics(entries ?? [], today), [entries, today]);
  const hasPreviousWeek = (entries ?? []).some((entry) => {
    const start = shiftDate(mondayFor(today), -7);
    return entry.data >= start && entry.data < mondayFor(today);
  });
  const archive = [
    { value: phaseOneValue("round").toLocaleString("it-IT"), label: "ROUND" },
    { value: phaseOneValue("flessioni").toLocaleString("it-IT"), label: "FLESSIONI" },
    { value: phaseOneValue("km").toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), label: "KM" },
    { value: phaseOneValue("giorni").toLocaleString("it-IT"), label: "GIORNI" },
  ];

  return (
    <div className="season-home season-root home-film" data-season="2" data-testid="season2-home">
      <HomeHeader />
      <main>
        <section className="home-hero" aria-labelledby="home-title" data-testid="home-hero">
          <HeroMediaLayer />
          <div className="home-hero__overlay" aria-hidden="true" />
          <div className="home-hero__content">
            <p className="home-mono home-hero__season">STAGIONE 2</p>
            <h1 id="home-title" className="home-hero__number" data-testid="text-current-season-day">{currentDay}</h1>
            <p className="home-hero__statement">180 GIORNI PER<br className="home-mobile-break" /> MIGLIORARSI.</p>
          </div>
          <a className="home-scroll" href="#origin" data-testid="link-scroll-origin">SCORRI <span aria-hidden="true">↓</span></a>
        </section>

        <section id="origin" className="home-chapter home-origin" aria-labelledby="origin-title" data-testid="section-origin">
          <Reveal className="home-chapter__content">
            <p className="home-mono home-eyebrow">01 · DA DOVE PARTO</p>
            <h2 id="origin-title" className="home-sr-only">Da dove parto</h2>
            <div className="home-origin__copy">
              <p>130 chili. Dipendente. Una vita finita a 20 anni.</p>
              <p>Battere la dipendenza mi ha insegnato a combattere — non il contrario.</p>
              <p>Oggi documento la risalita. Ogni giorno, senza nascondere niente.</p>
            </div>
          </Reveal>
        </section>

        <section id="numbers" className="home-chapter home-numbers" aria-labelledby="numbers-title" data-testid="section-weekly-numbers">
          <Reveal className="home-chapter__content">
            <p className="home-mono home-eyebrow">02 · STAGIONE 2, SETTIMANA IN CORSO</p>
            <h2 id="numbers-title" className="home-sr-only">I numeri</h2>
            {isLoading ? (
              <div className="home-metric-list" role="status" aria-label="Caricamento dati settimanali" data-testid="status-metrics-loading">
                {[0, 1, 2, 3].map((item) => <div className="home-metric home-metric--skeleton" key={item}><span /><span /></div>)}
              </div>
            ) : isError ? (
              <p className="home-mono home-status" role="status" data-testid="status-metrics-error">DATI SETTIMANALI NON DISPONIBILI.</p>
            ) : (
              <div className="home-metric-list" data-testid="weekly-metrics">
                {currentMetrics.map((metric) => (
                  <div className="home-metric" key={metric.id} data-testid={`metric-${metric.id}`}>
                    <div className="home-metric__heading">
                      <p className="home-mono">{metric.label}</p>
                      {hasPreviousWeek && <DeltaMark previous={metric.previous} current={metric.current} />}
                    </div>
                    <strong>{metric.current == null ? "—" : metric.format(metric.current)}</strong>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && !isError && !hasPreviousWeek && (
              <p className="home-mono home-status" data-testid="status-no-previous-week">IL CONFRONTO ARRIVERÀ CON I DATI DELLA SETTIMANA PRECEDENTE.</p>
            )}
          </Reveal>
        </section>

        <section className="home-chapter home-one-percent" aria-labelledby="one-percent-title" data-testid="section-one-percent">
          <Reveal className="home-one-percent__content">
            <svg className="home-curve" viewBox="0 0 900 430" fill="none" aria-hidden="true">
              <path d="M25 390 C190 389 286 376 395 346 C510 314 572 267 641 197 C708 129 765 73 875 24" />
            </svg>
            <p className="home-mono home-one-percent__formula">1,01 × 180 GIORNI</p>
            <h2 id="one-percent-title"><span>= </span><span className="home-one-percent__six">6</span> VOLTE MEGLIO</h2>
          </Reveal>
        </section>

        <section id="diary" className="home-chapter home-diary" aria-labelledby="diary-title" data-testid="section-diary">
          <Reveal className="home-chapter__content">
            <p className="home-mono home-eyebrow">03 · IL DIARIO</p>
            <h2 id="diary-title" className="home-sr-only">Il diario</h2>
            {latestLoading ? (
              <div className="home-diary__rows" role="status" aria-label="Caricamento diario" data-testid="status-diary-loading">
                {[0, 1, 2].map((item) => <div className="home-diary-row home-diary-row--skeleton" key={item}><span /><span /></div>)}
              </div>
            ) : latestError ? (
              <p className="home-mono home-status" role="status" data-testid="status-diary-error">IL DIARIO NON È DISPONIBILE.</p>
            ) : recentEntries.length ? (
              <div className="home-diary__rows">
                {recentEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/fase-2/giorno/${entry.numero}`}
                    className="home-diary-row"
                    data-testid={`link-season2-day-${entry.numero}`}
                  >
                    <span className="home-diary-row__day">GIORNO {entry.numero}</span>
                    <span className="home-mono home-diary-row__date">{formatDate(entry.data)}</span>
                    <span className="home-diary-row__excerpt">{firstSentence(entry)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="home-mono home-status" data-testid="status-no-season2-days">NESSUN GIORNO PUBBLICATO.</p>
            )}
            <Link href="/journaling?stagione=2" className="home-outline-link" data-testid="link-open-diary">APRI IL DIARIO <span aria-hidden="true">→</span></Link>
          </Reveal>
        </section>

        <section className="home-chapter home-archive" aria-labelledby="archive-title" data-testid="section-season1-archive">
          <Reveal className="home-chapter__content">
            <p className="home-mono home-eyebrow">04 · STAGIONE 1 · CHIUSA</p>
            <h2 id="archive-title" className="home-sr-only">Stagione 1, chiusa</h2>
            <div className="home-archive__grid">
              {archive.map((stat) => (
                <div className="home-archive__stat" key={stat.label} data-testid={`archive-${stat.label.toLowerCase()}`}>
                  <strong>{stat.value}</strong><span className="home-mono">{stat.label}</span>
                </div>
              ))}
            </div>
            <Link href="/fase-1" className="home-outline-link" data-testid="link-season1-archive">VEDI TUTTI I DATI <span aria-hidden="true">→</span></Link>
          </Reveal>
        </section>
      </main>
      <footer className="home-footer" data-testid="home-footer">
        <p className="home-footer__motto">IC XC NIKA</p>
        <p className="home-mono">PROJECTJ180DAY.COM</p>
      </footer>
    </div>
  );
}
