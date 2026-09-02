import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { getPhotoUrl } from "@workspace/object-storage-web";
import {
  DAILY_CANVAS_FORMATS,
  DAILY_CANVAS_VARIANTS,
  dailyCardCanvasDataUrl,
  downloadDailyCardCanvas,
  isDailyCanvasVariant,
  dailyCanvasVariant,
  type DailyCanvasCardData,
  type DailyCanvasFormat,
  type DailyCanvasVariant,
} from "@/lib/canvas-card-export";
import { usePageMeta } from "@/hooks/use-page-meta";

const GOAL_DAYS = 180;
const CLIP_API_PATH = `${import.meta.env.BASE_URL}api/giorni`;

type ClipData = {
  numeroGiorno: number;
  rimasti: number;
  data: string;
  sonnoOre: number | null;
  entrateEur: number | null;
  usciteEur: number | null;
  attrito: string | null;
  fotoClipUrl: string | null;
};

type CardStatus = "loading" | "ready" | "not-found" | "error";

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1].slice(2)}` : value;
}

function formatSleep(value: number | null) {
  if (value == null) return "—";
  return `${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)} H`;
}

function formatEuro(value: number | null) {
  if (value == null) return "—";
  return `€\u00a0${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function easeOutExpo(progress: number) {
  return progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
}

function useAnimatedNumber(target: number, delay: number, duration: number, replayKey: number, reduced: boolean) {
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    setValue(0);
    let frame = 0;
    const timer = window.setTimeout(() => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        setValue(target * easeOutExpo(progress));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [duration, delay, reduced, replayKey, target]);

  return value;
}

function useFrictionSize(text: string, replayKey: number) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [size, setSize] = useState(36);

  useEffect(() => {
    setSize(36);
    const frame = window.requestAnimationFrame(() => {
      const element = ref.current;
      if (!element || !text) return;
      let next = 36;
      element.style.maxHeight = "none";
      while (next > 28 && element.scrollHeight > next * 1.3 * 3 + 2) {
        next *= 0.96;
        element.style.fontSize = `${next}px`;
      }
      element.style.maxHeight = "";
      setSize(Math.max(28, next));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [replayKey, text]);

  return { ref, size };
}

function mulberry32(seed: number) {
  let value = (seed >>> 0) || 1;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function GrainLayer({ seed, height, variant }: { seed: number; height: number; variant: DailyCanvasVariant }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const width = 270;
    canvas.width = width;
    canvas.height = Math.ceil(height / 4);
    const context = canvas.getContext("2d");
    if (!context) return;
    const pixels = context.createImageData(canvas.width, canvas.height);
    const random = mulberry32(seed);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const channel = Math.floor(random() * 256);
      pixels.data[index] = channel;
      pixels.data[index + 1] = channel;
      pixels.data[index + 2] = channel;
      pixels.data[index + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
  }, [height, seed]);
  return <canvas ref={ref} className={`pj-card__grain${variant === "negativo" ? " pj-card__grain--negative" : ""}`} aria-hidden="true" />;
}

function Ruler({
  dayNumber,
  variant,
  active,
}: {
  dayNumber: number;
  variant: DailyCanvasVariant;
  active: boolean;
}) {
  return (
    <div className={`pj-card__ruler pj-card__ruler--${variant}${active ? " is-active" : ""}`} aria-label={`${dayNumber} giorni completati su ${GOAL_DAYS}`}>
      {Array.from({ length: GOAL_DAYS }, (_, index) => {
        const tick = index + 1;
        const current = tick === dayNumber;
        const past = tick < dayNumber;
        const delay = current
          ? 380
          : (Math.max(0, Math.min(dayNumber - 1, tick - 1)) / Math.max(1, dayNumber - 1)) * 380;
        return (
          <span
            key={tick}
            className="pj-card__tick"
            style={{
              "--tick-color": variant === "negativo"
                ? current ? "#0A0A0A" : "rgba(10,10,10,.18)"
                : current ? "#F0EBE3" : past ? "#B81D1D" : "#2A2725",
              "--tick-delay": `${delay}ms`,
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

function DailyCardDom({
  data,
  format,
  variant,
  replayKey,
  staticPreview,
}: {
  data: ClipData;
  format: DailyCanvasFormat;
  variant: DailyCanvasVariant;
  replayKey: number;
  staticPreview: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const motionless = reduced || staticPreview;
  const photoUrl = getPhotoUrl(data.fotoClipUrl);
  const height = format === "feed" ? 1350 : 1920;
  const dayDelay = variant === "negativo" ? 150 : variant === "testo" ? 300 : 250;
  const dayDuration = variant === "foto" ? 950 : 900;
  const day = useAnimatedNumber(data.numeroGiorno, dayDelay, dayDuration, replayKey, motionless);
  const sleep = useAnimatedNumber(data.sonnoOre ?? 0, 850, 650, replayKey, motionless);
  const income = useAnimatedNumber(data.entrateEur ?? 0, 850, 650, replayKey, motionless);
  const expenses = useAnimatedNumber(data.usciteEur ?? 0, 850, 650, replayKey, motionless);
  const friction = useFrictionSize(data.attrito ?? "", replayKey);
  const [rulerActive, setRulerActive] = useState(motionless);

  useEffect(() => {
    if (motionless) {
      setRulerActive(true);
      return;
    }
    setRulerActive(false);
    const timer = window.setTimeout(() => setRulerActive(true), 1500);
    return () => window.clearTimeout(timer);
  }, [motionless, replayKey]);

  const rootStyle = {
    "--pj-height": `${height}px`,
  } as CSSProperties;

  return (
    <div
      className={`pj-card pj-card--${format} pj-card--${variant}${motionless ? " is-reduced" : " is-running"}`}
      style={rootStyle}
      data-replay-key={replayKey}
    >
      <header className="pj-card__header">
        <div className="pj-card__brand">
          <span className="pj-card__brand-j">J</span>
          <span className="pj-card__brand-name">PROGETTO J</span>
        </div>
        <span className="pj-card__remaining">{data.rimasti} RIMASTI</span>
      </header>

      {variant === "foto" && (
        <>
          <section className="pj-card__photo" aria-label={`Foto del giorno ${data.numeroGiorno}`}>
            {photoUrl && <img src={photoUrl} alt="" />}
            <div className="pj-card__photo-veil" aria-hidden="true" />
            <div className="pj-card__day-number" aria-label={`Giorno ${data.numeroGiorno}`}>{Math.round(day)}</div>
          </section>
          <section className="pj-card__data-band" aria-label="Dati del giorno">
            <div className="pj-card__overprint" aria-hidden="true" />
            <div className="pj-card__stat"><span>SONNO</span><strong>{data.sonnoOre == null ? "—" : formatSleep(sleep)}</strong></div>
            <div className="pj-card__stat"><span>ENTRATE</span><strong>{data.entrateEur == null ? "—" : formatEuro(income)}</strong></div>
            <div className="pj-card__stat"><span>USCITE</span><strong>{data.usciteEur == null ? "—" : formatEuro(expenses)}</strong></div>
          </section>
          <section className="pj-card__friction" aria-label="Attrito">
            <span>ATTRITO</span>
            <p ref={friction.ref} style={{ fontSize: `${friction.size}px` }}>{data.attrito ?? ""}</p>
          </section>
        </>
      )}

      {variant === "negativo" && (
        <section className="pj-card__negative" aria-label="Variante negativa">
          <div className="pj-card__negative-number">{Math.round(day)}</div>
          <div className="pj-card__negative-band" aria-hidden="true" />
          <div className="pj-card__negative-phrase">{numberInItalian(Math.round(day))} GIORNI.<br />NESSUNO CANCELLATO.</div>
        </section>
      )}

      {variant === "testo" && (
        <section className="pj-card__text" aria-label="Variante testo">
          <div className="pj-card__text-ghost">{Math.round(day)}</div>
          <div className="pj-card__text-band" aria-hidden="true" />
          <div className="pj-card__text-number">{Math.round(day)}</div>
          <p ref={friction.ref} style={{ fontSize: `${Math.min(104, Math.max(28, friction.size * 2.89))}px` }}>{data.attrito ?? ""}</p>
        </section>
      )}

      <Ruler dayNumber={data.numeroGiorno} variant={variant} active={rulerActive} />
      <footer className="pj-card__footer">
        <span className="pj-card__footer-bar" aria-hidden="true" />
        <span>PROJECTJ180DAY.COM</span>
      </footer>
      <GrainLayer seed={data.numeroGiorno} height={height} variant={variant} />
    </div>
  );
}

function numberInItalian(value: number): string {
  const units = ["", "UNO", "DUE", "TRE", "QUATTRO", "CINQUE", "SEI", "SETTE", "OTTO", "NOVE"];
  const teens = ["DIECI", "UNDICI", "DODICI", "TREDICI", "QUATTORDICI", "QUINDICI", "SEDICI", "DICIASSETTE", "DICIOTTO", "DICIANNOVE"];
  const tens = ["", "", "VENTI", "TRENTA", "QUARANTA", "CINQUANTA", "SESSANTA", "SETTANTA", "OTTANTA", "NOVANTA"];
  if (value < 10) return units[value] ?? "";
  if (value < 20) return teens[value - 10] ?? "";
  if (value < 100) {
    const ten = Math.floor(value / 10);
    const unit = value % 10;
    return `${tens[ten]}${unit === 1 || unit === 8 ? units[unit].slice(1) : units[unit]}`;
  }
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const prefix = hundreds === 1 ? "CENTO" : `${units[hundreds]}CENTO`;
  return remainder ? `${prefix}${numberInItalian(remainder)}` : prefix;
}

function makeCopy(data: ClipData) {
  const values = [
    `Giorno ${data.numeroGiorno}`,
    formatDate(data.data),
    data.sonnoOre == null ? null : `sonno ${formatSleep(data.sonnoOre)}`,
    data.entrateEur == null ? null : `entrate ${formatEuro(data.entrateEur)}`,
    data.usciteEur == null ? null : `uscite ${formatEuro(data.usciteEur)}`,
    data.attrito ? `attrito: ${data.attrito}` : null,
  ].filter(Boolean);
  return values.join(" · ");
}

function CardPreview({
  data,
  format,
  variant,
  replayKey,
  onReplay,
  staticPreview,
}: {
  data: ClipData;
  format: DailyCanvasFormat;
  variant: DailyCanvasVariant;
  replayKey: number;
  onReplay: () => void;
  staticPreview: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const height = format === "feed" ? 1350 : 1920;

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;
    const update = () => setScale(Math.min(1, element.clientWidth / 1080));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [format]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onReplay();
    }
  };

  return (
    <div
      ref={shellRef}
      className="pj-card-preview"
      style={{ aspectRatio: `1080 / ${height}` }}
      onClick={onReplay}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Anteprima card del giorno ${data.numeroGiorno}. Tocca per riprodurre.`}
    >
      <div className="pj-card-preview__scaled" style={{ transform: `scale(${scale})`, width: 1080, height }}>
        <DailyCardDom key={`${format}-${variant}-${replayKey}`} data={data} format={format} variant={variant} replayKey={replayKey} staticPreview={staticPreview} />
      </div>
    </div>
  );
}

function CardContent({ data }: { data: ClipData }) {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const requestedFormat = params.get("format");
  const requestedVariant = params.get("variant");
  const [format, setFormat] = useState<DailyCanvasFormat>(requestedFormat === "story" ? "story" : "feed");
  const [manualVariant, setManualVariant] = useState<DailyCanvasVariant | null>(
    isDailyCanvasVariant(requestedVariant) ? requestedVariant : null,
  );
  const [replayKey, setReplayKey] = useState(0);
  const [downloading, setDownloading] = useState<DailyCanvasFormat | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dayInput, setDayInput] = useState(String(data.numeroGiorno));
  const staticPreview = params.get("motion") === "off";
  const overlayEnabled = params.get("overlay") === "1";
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);

  useEffect(() => {
    setFormat(requestedFormat === "story" ? "story" : "feed");
    setManualVariant(isDailyCanvasVariant(requestedVariant) ? requestedVariant : null);
  }, [requestedFormat, requestedVariant]);

  const photoUrl = getPhotoUrl(data.fotoClipUrl);
  const cardData = useMemo<DailyCanvasCardData>(() => ({
    dayNumber: data.numeroGiorno,
    remaining: data.rimasti,
    date: data.data,
    sleepHours: data.sonnoOre,
    income: data.entrateEur,
    expenses: data.usciteEur,
    friction: data.attrito,
    photoUrl,
    format,
    variant: manualVariant,
  }), [data, format, manualVariant, photoUrl]);
  const variant = dailyCanvasVariant(cardData, manualVariant);

  useEffect(() => {
    if (!overlayEnabled) {
      setOverlaySrc(null);
      return;
    }
    let active = true;
    setOverlaySrc(null);
    dailyCardCanvasDataUrl({ ...cardData, variant })
      .then((src) => { if (active) setOverlaySrc(src); })
      .catch(() => { if (active) setNotice("Overlay PNG non disponibile."); });
    return () => { active = false; };
  }, [cardData, overlayEnabled, variant]);

  usePageMeta({
    title: `Card giorno ${String(data.numeroGiorno).padStart(3, "0")} — Progetto J`,
    description: `Card giornaliera del giorno ${data.numeroGiorno} del percorso Progetto J.`,
    image: photoUrl,
    url: `https://projectj180day.com/card/${data.numeroGiorno}`,
  });

  const updateUrl = (nextFormat: DailyCanvasFormat, nextVariant: DailyCanvasVariant | null) => {
    const query = new URLSearchParams();
    query.set("format", nextFormat);
    if (nextVariant) query.set("variant", nextVariant);
    navigate(`/card/${data.numeroGiorno}?${query.toString()}`);
    setFormat(nextFormat);
    setManualVariant(nextVariant);
    setReplayKey((key) => key + 1);
    setNotice(null);
  };

  const goToDay = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextDay = Number(dayInput);
    if (!Number.isInteger(nextDay) || nextDay < 1 || nextDay > GOAL_DAYS) {
      setNotice("Inserisci un giorno tra 1 e 180.");
      return;
    }
    const query = new URLSearchParams();
    query.set("format", format);
    if (manualVariant) query.set("variant", manualVariant);
    navigate(`/card/${nextDay}?${query.toString()}`);
  };

  const download = async (nextFormat: DailyCanvasFormat) => {
    setDownloading(nextFormat);
    setNotice(null);
    try {
      await downloadDailyCardCanvas({ ...cardData, format: nextFormat, variant });
      setNotice(`PNG ${nextFormat === "feed" ? "4:5" : "9:16"} pronto.`);
    } catch {
      setNotice("Impossibile generare il PNG. Verifica l'immagine e riprova.");
    } finally {
      setDownloading(null);
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(makeCopy(data));
      setNotice("Sintesi copiata.");
    } catch {
      setNotice("Copia non disponibile in questo browser.");
    }
  };

  const openFullscreen = () => {
    window.open(`${import.meta.env.BASE_URL}clip/${data.numeroGiorno}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="pj-card-page">
      <div className="pj-card-page__inner">
        <header className="pj-card-page__header">
          <div>
            <div className="pj-card-page__eyebrow">CARD GIORNALIERA · {format === "feed" ? "1080 × 1350 · 4:5" : "1080 × 1920 · 9:16"}</div>
            <h1>GIORNO {String(data.numeroGiorno).padStart(3, "0")}</h1>
          </div>
          <form className="pj-day-picker" onSubmit={goToDay}>
            <label htmlFor="pj-day">GIORNO</label>
            <input id="pj-day" type="number" min={1} max={180} value={dayInput} onChange={(event) => setDayInput(event.target.value)} />
            <button type="submit">APRI</button>
          </form>
        </header>

        <div className={`pj-card-compare${overlayEnabled ? " pj-card-compare--overlay" : ""}`}>
          <CardPreview data={data} format={format} variant={variant} replayKey={replayKey} staticPreview={staticPreview || overlayEnabled} onReplay={() => setReplayKey((key) => key + 1)} />
          {overlayEnabled && overlaySrc && (
            <img className="pj-card-compare__png" src={overlaySrc} alt="Overlay PNG al 50% sopra la preview DOM" />
          )}
        </div>

        <div className="pj-card-page__format-tabs" role="group" aria-label="Formato anteprima">
          {DAILY_CANVAS_FORMATS.map((item) => (
            <button key={item} type="button" className={format === item ? "is-selected" : ""} onClick={() => updateUrl(item, manualVariant)}>
              {item === "feed" ? "FEED" : "STORY"}
            </button>
          ))}
        </div>
        <div className="pj-card-page__actions">
          <button type="button" onClick={() => void download("feed")} disabled={downloading !== null}>PNG FEED</button>
          <button type="button" onClick={() => void download("story")} disabled={downloading !== null}>PNG STORY</button>
          <button type="button" onClick={() => void copySummary()}>COPIA SINTESI</button>
        </div>

        <section className="pj-card-page__controls" aria-label="Controlli della card">
          <div>
            <div className="pj-card-page__control-label">VARIANTE · {variant.toUpperCase()}</div>
            <div className="pj-card-page__variant-tabs">
              <button type="button" className={manualVariant === null ? "is-selected" : ""} onClick={() => updateUrl(format, null)}>AUTO</button>
              {DAILY_CANVAS_VARIANTS.map((item) => (
                <button key={item} type="button" className={manualVariant === item ? "is-selected" : ""} onClick={() => updateUrl(format, item)}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="pj-card-page__help">
            <span>Tap sull’anteprima per rivedere l’animazione. Per registrarla: apri a schermo intero.</span>
            <button type="button" onClick={openFullscreen}>SCHERMO INTERO</button>
          </div>
        </section>
        {notice && <p className="pj-card-page__notice" role="status">{notice}</p>}
      </div>
    </main>
  );
}

export default function Card() {
  const { giorno: rawGiorno } = useParams<{ giorno: string }>();
  const parsed = /^\d+$/.test(rawGiorno ?? "") ? Number(rawGiorno) : NaN;
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= GOAL_DAYS;
  const [status, setStatus] = useState<CardStatus>(valid ? "loading" : "not-found");
  const [data, setData] = useState<ClipData | null>(null);

  useEffect(() => {
    if (!valid) {
      setStatus("not-found");
      setData(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setData(null);
    fetch(`${CLIP_API_PATH}/${parsed}/clip`)
      .then(async (response) => {
        if (response.status === 404) throw new Error("not-found");
        if (!response.ok) throw new Error("error");
        return response.json() as Promise<ClipData>;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus(error instanceof Error && error.message === "not-found" ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [parsed, valid]);

  if (status === "ready" && data) return <CardContent data={data} />;
  if (status === "not-found") return <main className="pj-card-state">GIORNO NON TROVATO</main>;
  if (status === "error") return <main className="pj-card-state">ERRORE</main>;
  return <main className="pj-card-state">CARICAMENTO CARD…</main>;
}