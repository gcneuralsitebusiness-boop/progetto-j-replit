import { useEffect, useRef, useState } from "react";
import { useParams, useRoute, useSearch, Link } from "wouter";
import { seasonParams, cardSeasonQuery } from "@/lib/seasons";
import {
  useGetEntry,
  useListEntrySummaries,
  useAdminMe,
  useUpdateEntry,
  getGetEntryQueryKey,
  getListEntrySummariesQueryKey,
  getListEntriesQueryKey,
} from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { downloadMinimalCanvasCard } from "@/lib/canvas-card-export";
import { toPngWithEmbeddedAssets } from "@/lib/export-image";
import { stripHtml } from "@/lib/strip-html";
import { getPhotoUrl } from "@workspace/object-storage-web";
import CardCustomizer, {
  customizationFromRecord,
  type CardCustomization,
} from "@/components/CardCustomizer";

const CARD_W = 1080;
const CARD_H = 1920;
const GREEN = "#3DDC84";
const BLACK = "#0A0A0A";
const WHITE = "#E8E4DE";
const GREY = "#6E6A65";
const DARK_GREY = "#4A4744";
const SITE_DOMAIN = "projectj180day.com";
const GOAL_DAY = 180;

type ReelMode = "reel" | "minimal";

function formatNumber(n: number, fraction = 0): string {
  return n.toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fraction,
  });
}

function stripDayLabel(text: string): string {
  return text.replace(/^\s*GIORNO\s+\d+\s*[—–-]?\s*[\d-]*\s*\n?/i, "").trim();
}

function summary(text: string | null | undefined, sintesi: string | null | undefined): string {
  const source = sintesi?.trim() || (text ? stripHtml(stripDayLabel(text)) : "");
  if (source.length <= 180) return source;
  const cut = source.slice(0, 179);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 90 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function ReelArtwork({
  entry,
  custom,
  minimal,
  cardRef,
  minimalBlur,
  minimalOverlay,
}: {
  entry: Entry;
  custom: CardCustomization;
  minimal: boolean;
  cardRef: React.RefObject<HTMLDivElement | null>;
  minimalBlur: number;
  minimalOverlay: number;
}) {
  const number = String(entry.numero).padStart(3, "0");
  const RED = entry.fase === 2 ? GREEN : "#B81D1D";

  if (minimal) {
    const photoUrl = entry.foto ? getPhotoUrl(entry.foto) : null;
    return (
      <div
        ref={cardRef}
        style={{
          width: CARD_W,
          height: CARD_H,
          position: "relative",
          overflow: "hidden",
          backgroundColor: BLACK,
          color: RED,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              zIndex: 0,
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `blur(${minimalBlur}px)`,
              transform: "scale(1.15)",
            }}
          />
        )}
        {photoUrl && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              zIndex: 1,
              inset: 0,
              backgroundColor: `rgba(0,0,0,${(minimalOverlay / 100).toFixed(2)})`,
            }}
          />
        )}
        {photoUrl && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              zIndex: 2,
              inset: 0,
              background: "radial-gradient(circle at center, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 45%, rgba(10,10,10,0) 100%)",
            }}
          />
        )}
        <div
          className="bebas"
          style={{
            position: "relative",
            zIndex: 3,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 520,
            lineHeight: 0.85,
            letterSpacing: "0.01em",
          }}
        >
          {number}
        </div>
        <div
          className="bebas"
          style={{
            position: "relative",
            zIndex: 3,
            marginTop: 40,
            color: DARK_GREY,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: "0.1em",
          }}
        >
          {entry.fase === 2 ? `GIORNO ${entry.numero} · STAGIONE 2` : `/${GOAL_DAY}`}
        </div>
      </div>
    );
  }

  const photoUrl = custom.cardImmagine
    ? getPhotoUrl(custom.cardImmagine)
    : entry.foto
      ? getPhotoUrl(entry.foto)
      : null;
  const overlay = (custom.cardOverlay ?? 55) / 100;
  const daySummary = custom.cardTitolo ?? summary(entry.testo, entry.sintesi);
  const stats: Array<{ value: string; unit: string }> = [];
  if (entry.peso != null) stats.push({ value: formatNumber(entry.peso, 1), unit: "KG" });
  if (entry.battito != null) stats.push({ value: formatNumber(entry.battito), unit: "BPM" });
  if (entry.sonno != null) stats.push({ value: formatNumber(entry.sonno, 1), unit: "H SONNO" });

  return (
    <div
      ref={cardRef}
      style={{
        width: CARD_W,
        height: CARD_H,
        position: "relative",
        overflow: "hidden",
        backgroundColor: BLACK,
      }}
    >
      {photoUrl && (
        <img
          src={photoUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {photoUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at center, rgba(0,0,0,${Math.min(0.98, overlay + 0.16).toFixed(2)}) 0%, rgba(0,0,0,${overlay.toFixed(2)}) 58%, rgba(0,0,0,${Math.max(0.4, overlay - 0.08).toFixed(2)}) 100%)`,
          }}
        />
      )}

      <div
        className="bebas"
        style={{
          position: "absolute",
          top: "33%",
          left: 0,
          right: 0,
          textAlign: "center",
          color: RED,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 60,
          lineHeight: 1,
        }}
      >
        J
      </div>
      <div
        className="bebas"
        style={{
          position: "absolute",
          top: "38%",
          left: 0,
          right: 0,
          textAlign: "center",
          color: RED,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 180,
          lineHeight: 0.85,
        }}
      >
        {number}
      </div>
      <div
        className="bebas"
        style={{
          position: "absolute",
          top: "45%",
          left: 0,
          right: 0,
          textAlign: "center",
          color: GREY,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 26,
          letterSpacing: "0.3em",
        }}
      >
        {entry.fase === 2 ? `GIORNO ${entry.numero} · STAGIONE 2` : `GIORNO / ${GOAL_DAY}`}
      </div>
      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          width: 100,
          height: 4,
          transform: "translateX(-50%)",
          backgroundColor: RED,
        }}
      />
      {daySummary && (
        <div
          style={{
            position: "absolute",
            top: "51%",
            left: 140,
            right: 140,
            color: WHITE,
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 34,
            lineHeight: 1.5,
            textAlign: "center",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {daySummary}
        </div>
      )}
      {custom.cardMostraParole !== false && stats.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "60.5%",
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: 26,
            color: WHITE,
            whiteSpace: "nowrap",
          }}
        >
          {stats.map((stat, index) => (
            <div key={stat.unit} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              {index > 0 && <span style={{ color: GREY, fontFamily: "'Bebas Neue', sans-serif", fontSize: 28 }}>·</span>}
              <span className="bebas" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 46, lineHeight: 1 }}>
                {stat.value}
              </span>
              <span className="bebas" style={{ color: GREY, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.2em" }}>
                {stat.unit}
              </span>
            </div>
          ))}
        </div>
      )}
      <div
        className="bebas"
        style={{
          position: "absolute",
          top: "65.5%",
          left: 0,
          right: 0,
          textAlign: "center",
          color: GREY,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 24,
          letterSpacing: "0.26em",
        }}
      >
        {SITE_DOMAIN}
      </div>
    </div>
  );
}

function MinimalControls({
  blur,
  overlay,
  onBlurChange,
  onOverlayChange,
}: {
  blur: number;
  overlay: number;
  onBlurChange: (value: number) => void;
  onOverlayChange: (value: number) => void;
}) {
  return (
    <section className="w-full max-w-xl border border-border bg-card p-6 flex flex-col gap-5">
      <h2 className="font-serif bebas text-[20px] tracking-[0.15em] text-foreground">REGOLAZIONI MINIMAL</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-muted-foreground">SFOCATURA · {blur}</span>
        <input
          type="range"
          min={5}
          max={60}
          step={1}
          value={blur}
          onChange={(event) => onBlurChange(Number(event.target.value))}
          className="accent-primary"
          data-testid="slider-minimal-blur"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-muted-foreground">OVERLAY · {overlay}</span>
        <input
          type="range"
          min={30}
          max={90}
          step={1}
          value={overlay}
          onChange={(event) => onOverlayChange(Number(event.target.value))}
          className="accent-primary"
          data-testid="slider-minimal-overlay"
        />
      </label>
    </section>
  );
}

function Guides() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "29%",
          left: 0,
          right: 0,
          height: "42%",
          border: "1px dashed rgba(232,228,222,0.65)",
          pointerEvents: "none",
        }}
      >
        <span className="bebas" style={{ position: "absolute", top: 8, left: 12, color: WHITE, fontSize: 16, letterSpacing: "0.16em" }}>FEED</span>
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "12%",
          left: 0,
          right: 0,
          height: "75%",
          border: "1px dashed rgba(184,115,51,0.8)",
          pointerEvents: "none",
        }}
      >
        <span className="bebas" style={{ position: "absolute", top: 8, left: 12, color: "#B87333", fontSize: 16, letterSpacing: "0.16em" }}>PROFILO</span>
      </div>
    </>
  );
}

export default function CardReel() {
  const search = useSearch();
  const fase = new URLSearchParams(search).get("fase") === "2" ? 2 : 1;
  const [matchMinimal, minimalParams] = useRoute("/card/:giorno/reel-minimal");
  const [, reelParams] = useRoute("/card/:giorno/reel");
  const minimal = Boolean(matchMinimal);
  const giorno = (minimal ? minimalParams?.giorno : reelParams?.giorno) ?? "";
  const requested = Number(giorno);
  const { data: entry, isLoading, isError } = useGetEntry(requested, seasonParams(fase), {
    query: {
      queryKey: getGetEntryQueryKey(requested, seasonParams(fase)),
      enabled: Number.isInteger(requested) && requested >= 1 && requested <= GOAL_DAY,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    },
  });
  const { data: daySummaries, isLoading: daysLoading } = useListEntrySummaries(seasonParams(fase), {
    query: {
      queryKey: getListEntrySummariesQueryKey(seasonParams(fase)),
      staleTime: 30_000,
    },
  });
  const nextDay = entry && daySummaries
    ? [...daySummaries]
      .sort((a, b) => a.numero - b.numero)
      .find((candidate) => candidate.numero > entry.numero)
    : undefined;
  const { data: auth } = useAdminMe();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [minimalBlur, setMinimalBlur] = useState(20);
  const [minimalOverlay, setMinimalOverlay] = useState(55);
  const [custom, setCustom] = useState<CardCustomization>(customizationFromRecord(null));
  const [customDirty, setCustomDirty] = useState(false);
  const entryIdentity = entry ? `${fase}:${entry.numero}` : null;
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const updateMutation = useUpdateEntry();

  useEffect(() => {
    if (entry && (initializedFor !== entryIdentity || !customDirty)) {
      setCustom(customizationFromRecord(entry));
      setInitializedFor(entryIdentity);
      setCustomDirty(false);
    }
  }, [entry, initializedFor, customDirty]);

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
    if (!cardRef.current || !entry || downloading || initializedFor !== entryIdentity) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const photoUrl = minimal
        ? (entry.foto ? getPhotoUrl(entry.foto) : null)
        : (custom.cardImmagine
          ? getPhotoUrl(custom.cardImmagine)
          : (entry.foto ? getPhotoUrl(entry.foto) : null));
      if (minimal) {
        await downloadMinimalCanvasCard({
          filename: `progettoj-${fase === 2 ? "fase-2-" : ""}giorno-${String(requested).padStart(3, "0")}-minimal.png`,
          photoUrl,
          blur: minimalBlur,
          overlay: minimalOverlay,
          dayNumber: entry.numero,
          fase,
        });
      } else {
        // Export the actual preview, not the unrelated daily-card canvas.
        // Guides are siblings of this element and deliberately stay out of the PNG.
        const png = await toPngWithEmbeddedAssets(cardRef.current, {
          width: CARD_W,
          height: CARD_H,
          pixelRatio: 1,
          backgroundColor: BLACK,
          style: { transform: "none" },
        });
        const link = document.createElement("a");
        link.download = `progettoj-${fase === 2 ? "fase-2-" : ""}giorno-${String(entry.numero).padStart(3, "0")}-reel.png`;
        link.href = png;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch {
      setDownloadError("Errore durante la generazione del PNG. Verifica l'immagine e riprova.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveCustom = () => {
    if (!entry) return;
    setSaveError(null);
    updateMutation.mutate(
      { numero: entry.numero, params: seasonParams(fase), data: { ...custom } },
      {
        onSuccess: (savedEntry) => {
          queryClient.setQueryData(getGetEntryQueryKey(entry.numero, seasonParams(fase)), savedEntry);
          setCustom(customizationFromRecord(savedEntry));
          setCustomDirty(false);
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
        },
        onError: () => setSaveError("Errore durante il salvataggio. Riprova."),
      },
    );
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground font-sans uppercase tracking-widest text-[12px] animate-pulse">Caricamento...</span></div>;
  }
  if (isError || !entry) {
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
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-muted-foreground">
          {minimal ? "REEL MINIMAL" : "COPERTINA REEL"} · GIORNO {String(entry.numero).padStart(3, "0")} · 1080×1920
        </span>
        <button
          onClick={handleDownload}
          disabled={downloading || initializedFor !== entryIdentity}
          className="bg-primary text-primary-foreground font-serif text-[16px] px-6 py-2.5 tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {downloading ? "Generazione..." : minimal ? "Scarica minimal" : "Scarica copertina reel"}
        </button>
        {!minimal && nextDay && (
          <Link
            href={`/card/${nextDay.numero}/reel${cardSeasonQuery(fase)}`}
            aria-label={`Vai alla prossima giornata disponibile, giorno ${nextDay.numero}`}
            className="border border-primary px-6 py-2.5 font-serif text-[16px] uppercase tracking-wider text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Vai alla prossima giornata
          </Link>
        )}
        {!minimal && !daysLoading && daySummaries && !nextDay && (
          <span className="text-[11px] font-sans uppercase tracking-wider text-muted-foreground">
            Ultima giornata disponibile
          </span>
        )}
      </div>
      {downloadError && <p className="text-[12px] font-sans text-primary">{downloadError}</p>}

      <div ref={wrapperRef} className="w-full flex justify-center">
        <div style={{ width: CARD_W * scale, height: CARD_H * scale, position: "relative" }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
            <ReelArtwork
              entry={entry}
              custom={custom}
              minimal={minimal}
              cardRef={cardRef}
              minimalBlur={minimalBlur}
              minimalOverlay={minimalOverlay}
            />
            {!minimal && <Guides />}
          </div>
        </div>
      </div>

      {minimal && auth?.authenticated && (
        <MinimalControls
          blur={minimalBlur}
          overlay={minimalOverlay}
          onBlurChange={setMinimalBlur}
          onOverlayChange={setMinimalOverlay}
        />
      )}

      {!minimal && auth?.authenticated && (
        <CardCustomizer
          value={custom}
          onChange={(patch) => { setCustom((current) => ({ ...current, ...patch })); setCustomDirty(true); setSaved(false); }}
          onSave={handleSaveCustom}
          saving={updateMutation.isPending}
          saved={saved}
          error={saveError}
          titlePlaceholder={summary(entry.testo, entry.sintesi) || "Sintesi automatica"}
          subtitlePlaceholder="GIORNO"
          wordToggleLabel="Mostra dati del giorno"
          overlayMin={30}
          overlayMax={90}
          overlayDefault={55}
        />
      )}
    </div>
  );
}