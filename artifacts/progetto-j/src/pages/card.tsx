import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useListEntries, useUpdateEntry, useAdminMe, getListEntriesQueryKey } from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { downloadDailyCanvasCard } from "@/lib/canvas-card-export";
import { stripHtml } from "@/lib/strip-html";
import CardCustomizer, {
  CARD_OVERLAY_DEFAULT,
  customizationFromRecord,
  type CardCustomization,
} from "@/components/CardCustomizer";

const CARD_W = 1080;
const CARD_H = 1350;
const GOAL_DAY = 180;
const SINTESI_MAX = 180;
const CARD_GRAIN_BACKGROUND = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")";

function stripDayLabel(text: string): string {
  return text.replace(/^\s*GIORNO\s+\d+\s*[—–-]?\s*[\d-]*\s*\n?/i, "").trim();
}

/** Sintesi from DB field, or fallback built from the first words of the diary text. */
function resolveSintesi(sintesi: string | null | undefined, testo: string | null | undefined): string {
  const explicit = sintesi?.trim();
  if (explicit) return explicit.slice(0, SINTESI_MAX);
  const cleaned = testo
    ? stripHtml(stripDayLabel(testo).replace(/\*\*/g, ""))
    : "";
  if (!cleaned) return "";
  if (cleaned.length <= SINTESI_MAX) return cleaned;
  const cut = cleaned.slice(0, SINTESI_MAX - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

function formatNumber(n: number, fraction = 0): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: fraction });
}

function getRoutineStreak(entries: Entry[], numero: number): number {
  const byNumber = new Map(entries.map((entry) => [entry.numero, entry]));
  let streak = 0;
  for (let day = numero; day >= 1; day -= 1) {
    const entry = byNumber.get(day);
    const active = entry?.routineCompletata === true
      || Boolean(entry?.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");
    if (!active) break;
    streak += 1;
  }
  return streak;
}

function CardStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bebas font-serif leading-none text-white" style={{ fontSize: 88 }}>{value}</div>
      <div className="font-sans uppercase text-white/60" style={{ fontSize: 22, letterSpacing: "0.25em", marginTop: 8 }}>{label}</div>
    </div>
  );
}

function CardEkg() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 40"
      style={{ width: "100%", height: 40, marginTop: 32, opacity: 0.3 }}
    >
      <polyline
        points="0,20 180,20 220,20 240,5 260,35 280,10 300,30 320,20 500,20 540,20 560,5 580,35 600,10 620,30 640,20 900,20"
        fill="none"
        stroke="#B81D1D"
        strokeWidth="2"
      />
    </svg>
  );
}

function InstagramCard({
  entry,
  custom,
  cardRef,
  routineStreak,
}: {
  entry: Entry;
  custom: CardCustomization;
  cardRef: React.RefObject<HTMLDivElement | null>;
  routineStreak: number;
}) {
  // Customization with fallback: null fields always use the original values.
  const customPhoto = custom.cardImmagine ? getPhotoUrl(custom.cardImmagine) : null;
  const photoUrl = customPhoto ?? (entry.foto ? getPhotoUrl(entry.foto) : null);
  const sintesi = custom.cardTitolo ?? resolveSintesi(entry.sintesi, entry.testo);
  const dayLabel = custom.cardSottotitolo ?? "GIORNO";
  const overlay = (custom.cardOverlay ?? CARD_OVERLAY_DEFAULT) / 100;
  const showStats = custom.cardMostraParole ?? true;
  const remaining = Math.max(0, GOAL_DAY - entry.numero);

  const stats: { value: string; label: string }[] = [];
  if (entry.peso != null) stats.push({ value: `${formatNumber(entry.peso, 1)}KG`, label: "PESO" });
  if (entry.battito != null) stats.push({ value: `${formatNumber(entry.battito)}BPM`, label: "BATTITO" });
  if (entry.sonno != null) stats.push({ value: `${formatNumber(entry.sonno, 1)}H`, label: "SONNO" });
  const hasActivity = entry.routineCompletata === true
    || Boolean(entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");
  const hasRoutine = entry.tipoGiorno != null || entry.routineCompletata != null || hasActivity;
  const routineText = hasActivity
    ? `${entry.routineCompletata === true ? "ROUTINE" : "ALLENAMENTO"} ${entry.tipoGiorno === "RECUPERO" ? "R" : (entry.tipoGiorno ?? "—")} · STREAK ${routineStreak}`
    : entry.routineCompletata === false
      ? "ROUTINE — · STREAK RESET"
      : "";

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
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to top, rgba(0,0,0,${Math.min(0.95, overlay + 0.34).toFixed(2)}) 0%, rgba(0,0,0,${overlay.toFixed(2)}) 45%, rgba(0,0,0,${Math.max(0, overlay - 0.2).toFixed(2)}) 100%)`,
            }}
          />
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

      {/* Film grain: above the image and below all card content. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: CARD_GRAIN_BACKGROUND,
          mixBlendMode: "overlay",
          opacity: 0.08,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, zIndex: 2 }}>
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
          <div className="page-label" style={{ fontSize: 26, letterSpacing: "0.35em", color: "hsl(var(--primary))" }}>{dayLabel}</div>
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
          {showStats && stats.length > 0 && (
            <div style={{ display: "flex", gap: 80, marginTop: 56, borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: 44 }}>
              {stats.map((s) => (
                <CardStat key={s.label} value={s.value} label={s.label} />
              ))}
            </div>
          )}
          {hasRoutine && (
            <div className="font-mono uppercase" style={{ marginTop: 24, fontSize: 22, letterSpacing: "0.12em", color: entry.routineCompletata ? "#00FF41" : "#B81D1D" }}>
              {routineText}
            </div>
          )}

          <CardEkg />

          {/* Countdown */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 56 }}>
            <div className="font-sans uppercase text-white/60" style={{ fontSize: 22, letterSpacing: "0.25em" }}>
              {remaining > 0 ? `−${remaining} GIORNI AL GIORNO ${GOAL_DAY}` : `GIORNO ${GOAL_DAY} RAGGIUNTO`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div className="font-sans uppercase" style={{ fontSize: 22, letterSpacing: "0.25em", color: "hsl(var(--primary))" }}>
                PROGETTOJ.IT
              </div>
              <div className="font-sans uppercase" style={{ fontSize: 20, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>
                IC XC NIKA
              </div>
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
  const { data: auth } = useAdminMe();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const requested = Number(giorno);
  const entry = entries?.find((e) => e.numero === requested);

  // Card customization: local live state, initialized from the saved values once loaded.
  const [custom, setCustom] = useState<CardCustomization>(customizationFromRecord(null));
  const [initializedFor, setInitializedFor] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const updateMutation = useUpdateEntry();

  useEffect(() => {
    if (entry && initializedFor !== entry.numero) {
      setCustom(customizationFromRecord(entry));
      setInitializedFor(entry.numero);
    }
  }, [entry, initializedFor]);

  const handleCustomChange = (patch: Partial<CardCustomization>) => {
    setCustom((c) => ({ ...c, ...patch }));
    setSaved(false);
  };

  const handleSaveCustom = () => {
    if (!entry) return;
    setSaveError(null);
    updateMutation.mutate(
      { numero: entry.numero, data: { ...custom } },
      {
        onSuccess: () => {
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
        },
        onError: () => setSaveError("Errore durante il salvataggio. Riprova."),
      }
    );
  };

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
      if (!entry) throw new Error("Entry non disponibile");
      const customPhoto = custom.cardImmagine ? getPhotoUrl(custom.cardImmagine) : null;
      const photoUrl = customPhoto ?? (entry.foto ? getPhotoUrl(entry.foto) : null);
      const sintesi = custom.cardTitolo ?? resolveSintesi(entry.sintesi, entry.testo);
      const dayLabel = custom.cardSottotitolo ?? "GIORNO";
      const overlay = (custom.cardOverlay ?? CARD_OVERLAY_DEFAULT) / 100;
      const stats: { value: string; label: string }[] = [];
      if (entry.peso != null) stats.push({ value: `${formatNumber(entry.peso, 1)}KG`, label: "PESO" });
      if (entry.battito != null) stats.push({ value: `${formatNumber(entry.battito)}BPM`, label: "BATTITO" });
      if (entry.sonno != null) stats.push({ value: `${formatNumber(entry.sonno, 1)}H`, label: "SONNO" });
      const activeDay = entry.routineCompletata === true
        || Boolean(entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");
      const routineLine = activeDay
        ? { text: `${entry.routineCompletata === true ? "ROUTINE" : "ALLENAMENTO"} ${entry.tipoGiorno === "RECUPERO" ? "R" : (entry.tipoGiorno ?? "—")} · STREAK ${getRoutineStreak(entries ?? [], entry.numero)}`, completed: entry.routineCompletata === true }
        : entry.routineCompletata === false
          ? { text: "ROUTINE — · STREAK RESET", completed: false }
          : undefined;
      await downloadDailyCanvasCard({
        filename: `progetto-j-giorno-${String(requested).padStart(3, "0")}.png`,
        photoUrl,
        overlay,
        dayNumber: entry.numero,
        dayLabel,
        dateLabel: format(new Date(entry.data), "d MMMM yyyy", { locale: it }).toUpperCase(),
        summary: sintesi,
        stats,
        showStats: custom.cardMostraParole ?? true,
        remaining: Math.max(0, GOAL_DAY - entry.numero),
        routineLine,
      });
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
    <div
      className="min-h-screen bg-background py-8 px-2 flex flex-col items-center gap-6"
      style={{
        backgroundColor: "#080808",
        backgroundImage: `
          linear-gradient(45deg, #111 25%, transparent 25%),
          linear-gradient(-45deg, #111 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #111 75%),
          linear-gradient(-45deg, transparent 75%, #111 75%)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
      }}
    >
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
            <InstagramCard entry={entry} custom={custom} cardRef={cardRef} routineStreak={getRoutineStreak(entries ?? [], entry.numero)} />
          </div>
        </div>
      </div>

      {/* PERSONALIZZA panel — admin only, never included in the PNG export */}
      {auth?.authenticated && (
        <CardCustomizer
          value={custom}
          onChange={handleCustomChange}
          onSave={handleSaveCustom}
          saving={updateMutation.isPending}
          saved={saved}
          error={saveError}
          titlePlaceholder={resolveSintesi(entry.sintesi, entry.testo) || "Sintesi automatica"}
          subtitlePlaceholder="GIORNO"
          wordToggleLabel="Mostra statistiche del giorno"
        />
      )}
    </div>
  );
}
