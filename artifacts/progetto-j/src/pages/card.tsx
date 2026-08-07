import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useListEntries } from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toPng } from "html-to-image";
import { getPhotoUrl } from "@workspace/object-storage-web";

const CARD_W = 1080;
const CARD_H = 1350;
const GOAL_DAY = 180;
const SINTESI_MAX = 180;

function stripDayLabel(text: string): string {
  return text.replace(/^\s*GIORNO\s+\d+\s*[—–-]?\s*[\d-]*\s*\n?/i, "").trim();
}

/** Sintesi from DB field, or fallback built from the first words of the diary text. */
function resolveSintesi(sintesi: string | null | undefined, testo: string | null | undefined): string {
  const explicit = sintesi?.trim();
  if (explicit) return explicit.slice(0, SINTESI_MAX);
  const cleaned = testo ? stripDayLabel(testo).replace(/\*\*/g, "").replace(/\s+/g, " ").trim() : "";
  if (!cleaned) return "";
  if (cleaned.length <= SINTESI_MAX) return cleaned;
  const cut = cleaned.slice(0, SINTESI_MAX - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

function formatNumber(n: number, fraction = 0): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: fraction });
}

function CardStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bebas font-serif leading-none text-white" style={{ fontSize: 88 }}>{value}</div>
      <div className="font-sans uppercase text-white/60" style={{ fontSize: 22, letterSpacing: "0.25em", marginTop: 8 }}>{label}</div>
    </div>
  );
}

function InstagramCard({ entry, cardRef }: { entry: Entry; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const photoUrl = entry.foto ? getPhotoUrl(entry.foto) : null;
  const sintesi = resolveSintesi(entry.sintesi, entry.testo);
  const remaining = Math.max(0, GOAL_DAY - entry.numero);

  const stats: { value: string; label: string }[] = [];
  if (entry.peso != null) stats.push({ value: `${formatNumber(entry.peso, 1)}KG`, label: "PESO" });
  if (entry.battito != null) stats.push({ value: `${formatNumber(entry.battito)}BPM`, label: "BATTITO" });
  if (entry.sonno != null) stats.push({ value: `${formatNumber(entry.sonno, 1)}H`, label: "SONNO" });

  return (
    <div
      ref={cardRef}
      style={{ width: CARD_W, height: CARD_H, position: "relative", overflow: "hidden", backgroundColor: "#0A0A0A" }}
    >
      {/* Background photo + dark overlay */}
      {photoUrl ? (
        <>
          <img
            src={photoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(15%)" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.35) 100%)" }} />
        </>
      ) : (
        /* Inline SVG crosshatch: avoids CSS-variable resolution failures in html-to-image */
        <svg
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <defs>
            <pattern id="card-xhatch" width="8" height="8" patternUnits="userSpaceOnUse">
              {/* 45° lines */}
              <line x1="0" y1="8" x2="8" y2="0" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="-1" y1="1" x2="1" y2="-1" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="7" y1="9" x2="9" y2="7" stroke="#ffffff" strokeWidth="0.75" />
              {/* -45° lines */}
              <line x1="0" y1="0" x2="8" y2="8" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="-1" y1="7" x2="1" y2="9" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="7" y1="-1" x2="9" y2="1" stroke="#ffffff" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#card-xhatch)" opacity="0.12" />
        </svg>
      )}

      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
        {/* Header: logo + date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              className="bebas font-serif"
              style={{
                width: 88, height: 88, border: "3px solid hsl(var(--primary))", color: "hsl(var(--primary))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, lineHeight: 1,
              }}
            >
              J
            </div>
            <div className="font-sans uppercase text-white/80" style={{ fontSize: 24, letterSpacing: "0.3em" }}>
              PROGETTO J
            </div>
          </div>
          <div className="font-sans uppercase text-white/60" style={{ fontSize: 22, letterSpacing: "0.2em", textAlign: "right", paddingTop: 12 }}>
            {format(new Date(entry.data), "d MMMM yyyy", { locale: it }).toUpperCase()}
          </div>
        </div>

        {/* Bottom block */}
        <div>
          {/* Day number */}
          <div className="page-label" style={{ fontSize: 26, letterSpacing: "0.35em", color: "hsl(var(--primary))" }}>GIORNO</div>
          <div className="bebas font-serif" style={{ fontSize: 260, lineHeight: 0.85, color: "hsl(var(--primary))" }}>
            {String(entry.numero).padStart(3, "0")}
          </div>

          {/* Sintesi */}
          {sintesi && (
            <p
              className="font-sans text-white"
              style={{ fontSize: 40, lineHeight: 1.35, marginTop: 40, maxWidth: 880, borderLeft: "4px solid hsl(var(--primary))", paddingLeft: 28 }}
            >
              {sintesi}
            </p>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <div style={{ display: "flex", gap: 80, marginTop: 56, borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: 44 }}>
              {stats.map((s) => (
                <CardStat key={s.label} value={s.value} label={s.label} />
              ))}
            </div>
          )}

          {/* Countdown */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 56 }}>
            <div className="font-sans uppercase text-white/60" style={{ fontSize: 22, letterSpacing: "0.25em" }}>
              {remaining > 0 ? `−${remaining} GIORNI AL GIORNO ${GOAL_DAY}` : `GIORNO ${GOAL_DAY} RAGGIUNTO`}
            </div>
            <div className="font-sans uppercase" style={{ fontSize: 22, letterSpacing: "0.25em", color: "hsl(var(--primary))" }}>
              PROGETTOJ.IT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Card() {
  const { giorno } = useParams<{ giorno: string }>();
  const { data: entries, isLoading, isError } = useListEntries();
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const requested = Number(giorno);
  const entry = entries?.find((e) => e.numero === requested);

  // Fit the 1080px card into the viewport for the on-screen preview.
  useEffect(() => {
    const compute = () => {
      const available = (wrapperRef.current?.clientWidth ?? window.innerWidth) - 8;
      setScale(Math.min(1, available / CARD_W));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      // Ensure fonts (Anton/Bebas) are fully loaded before capture.
      await document.fonts.ready;

      // pixelRatio:1 with explicit canvasWidth/canvasHeight guarantees the
      // output is exactly 1080×1350. Using pixelRatio:2 would multiply the
      // canvas dimensions by 2 (→ 2160×2700) in html-to-image ≥1.11.
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        canvasWidth: CARD_W,
        canvasHeight: CARD_H,
        backgroundColor: "#0A0A0A",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `progetto-j-giorno-${String(requested).padStart(3, "0")}.png`;
      a.click();
    } catch {
      setDownloadError("Errore durante la generazione del PNG. Riprova.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground font-sans uppercase tracking-widest text-[12px] animate-pulse">Caricamento...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-muted-foreground">Impossibile caricare i dati</span>
        <button onClick={() => window.location.reload()} className="btn-primary text-[12px]">Riprova</button>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <span className="font-serif text-[96px] leading-[0.8] text-primary bebas">404</span>
        <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-muted-foreground">Giorno non trovato</span>
        <Link href="/admin" className="btn-primary text-[12px]">Torna all'admin</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-2 flex flex-col items-center gap-6">
      <div className="flex items-center gap-6">
        <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-muted-foreground">
          CARD IG — GIORNO {String(entry.numero).padStart(3, "0")} · 1080×1350
        </span>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-primary text-primary-foreground font-serif text-[16px] px-6 py-2.5 tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {downloading ? "Generazione..." : "Scarica PNG"}
        </button>
      </div>
      {downloadError && <p className="text-[12px] font-sans text-primary">{downloadError}</p>}

      {/* Scaled preview wrapper: card keeps its internal 1080×1350 size */}
      <div ref={wrapperRef} className="w-full flex justify-center">
        <div style={{ width: CARD_W * scale, height: CARD_H * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <InstagramCard entry={entry} cardRef={cardRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
