import { useEffect, useMemo, useState } from "react";
import { useParams, useSearch } from "wouter";
import { useAdminMe, useListEntries, useUpdateEntry, getListEntriesQueryKey } from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getPhotoUrl } from "@workspace/object-storage-web";
import CardCustomizer, { customizationFromRecord, type CardCustomization } from "@/components/CardCustomizer";
import { DailyCardPreview } from "@/components/DailyCardPreview";
import {
  CARD_HEIGHTS,
  CARD_WIDTH,
  DAILY_CARD_VARIANTS,
  downloadDailyCard,
  isDailyCardVariant,
  makeDailyCardData,
  type DailyCardFormat,
  type DailyCardVariant,
} from "@/lib/daily-card";
import { stripHtml } from "@/lib/strip-html";
import { usePageMeta } from "@/hooks/use-page-meta";

function CardContent({ entry, entries }: { entry: Entry; entries: Entry[] }) {
  const search = useSearch();
  const queryClient = useQueryClient();
  const { data: auth } = useAdminMe();
  const updateMutation = useUpdateEntry();
  const params = new URLSearchParams(search);
  const defaultFormat: DailyCardFormat = params.get("format") === "story" ? "story" : "feed";
  const variantParam = params.get("variant");
  const defaultVariant: DailyCardVariant | null = isDailyCardVariant(variantParam) ? variantParam : null;
  const [format, setFormat] = useState<DailyCardFormat>(defaultFormat);
  const [variant, setVariant] = useState<DailyCardVariant | null>(defaultVariant);
  const [custom, setCustom] = useState<CardCustomization>(customizationFromRecord(entry));
  const [downloading, setDownloading] = useState<DailyCardFormat | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormat(defaultFormat);
    setVariant(defaultVariant);
  }, [defaultFormat, defaultVariant]);

  const combined = useMemo(() => ({ ...entry, ...custom }), [entry, custom]);
  const photoPath = combined.cardImmagine || combined.foto;
  const photoUrl = photoPath ? (getPhotoUrl(photoPath) ?? photoPath) : null;
  const cardData = makeDailyCardData(combined, format, variant, entries, photoUrl);
  const feedPath = entry.cardFeed ? (getPhotoUrl(entry.cardFeed) ?? entry.cardFeed) : null;
  const canonical = `https://projectj180day.com/card/${entry.numero}`;

  usePageMeta({
    title: `Card giorno ${String(entry.numero).padStart(3, "0")} — Progetto J`,
    description: entry.sintesi || `Card del giorno ${entry.numero} del percorso Progetto J.`,
    image: feedPath,
    url: canonical,
  });

  const setSearch = (nextFormat: DailyCardFormat, nextVariant: DailyCardVariant | null) => {
    const next = new URLSearchParams();
    next.set("format", nextFormat);
    if (nextVariant) next.set("variant", nextVariant);
    window.history.replaceState({}, "", `${window.location.pathname}?${next.toString()}`);
    setFormat(nextFormat);
    setVariant(nextVariant);
  };

  const download = async (nextFormat: DailyCardFormat) => {
    setDownloading(nextFormat);
    setError(null);
    try {
      await downloadDailyCard(makeDailyCardData(combined, nextFormat, variant, entries, photoUrl));
    } catch {
      setError("Impossibile generare il PNG. Verifica l'immagine e riprova.");
    } finally {
      setDownloading(null);
    }
  };

  const saveCustom = () => {
    setError(null);
    updateMutation.mutate({ numero: entry.numero, data: custom }, {
      onSuccess: () => {
        setSaved(true);
        queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      },
      onError: () => setError("Impossibile salvare le personalizzazioni."),
    });
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(stripHtml(entry.sintesi || entry.testo || `Giorno ${entry.numero} — Progetto J`).replace(/\s+/g, " ").trim());
    } catch {
      setError("Copia non disponibile in questo browser.");
    }
  };

  const previewHeight = CARD_HEIGHTS[format] / CARD_WIDTH * 100;
  return (
    <main className="min-h-screen bg-[#080808] px-3 py-7 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">Card giornaliera · {format === "feed" ? "1080 × 1350" : "1080 × 1920"}</div>
            <h1 className="bebas mt-2 text-5xl leading-none text-[#B81D1D]">GIORNO {String(entry.numero).padStart(3, "0")}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSearch("feed", variant)} className={`border px-4 py-2 text-[10px] font-mono uppercase tracking-widest ${format === "feed" ? "border-[#B81D1D] bg-[#B81D1D] text-white" : "border-white/20 text-white/70"}`}>Feed</button>
            <button onClick={() => setSearch("story", variant)} className={`border px-4 py-2 text-[10px] font-mono uppercase tracking-widest ${format === "story" ? "border-[#B81D1D] bg-[#B81D1D] text-white" : "border-white/20 text-white/70"}`}>Story</button>
            <button onClick={() => void download("feed")} disabled={downloading !== null} className="border border-[#B81D1D] px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-[#F4F1EC] hover:bg-[#B81D1D] disabled:opacity-50">{downloading === "feed" ? "Genero…" : "PNG feed"}</button>
            <button onClick={() => void download("story")} disabled={downloading !== null} className="border border-[#B81D1D] px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-[#F4F1EC] hover:bg-[#B81D1D] disabled:opacity-50">{downloading === "story" ? "Genero…" : "PNG story"}</button>
            <button onClick={() => void copySummary()} className="border border-white/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white/70 hover:text-white">Copia sintesi</button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="mx-auto w-full max-w-[620px]">
            <div className="overflow-hidden border border-white/15 bg-black shadow-2xl" style={{ aspectRatio: `1080 / ${CARD_HEIGHTS[format]}` }}>
              <DailyCardPreview entry={combined} format={format} variant={variant} className="h-full w-full" />
            </div>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Anteprima in scala · formato reale {CARD_WIDTH} × {CARD_HEIGHTS[format]}</p>
          </div>
          <aside className="border border-white/15 bg-[#0d0d0c] p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">Variante</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSearch(format, null)} className={`border px-2 py-2 text-left font-mono text-[9px] uppercase tracking-wide ${variant === null ? "border-[#B81D1D] text-[#F4F1EC]" : "border-white/15 text-white/55"}`}>Automatica</button>
              {DAILY_CARD_VARIANTS.map((item) => <button key={item} onClick={() => setSearch(format, item)} className={`border px-2 py-2 text-left font-mono text-[9px] uppercase tracking-wide ${variant === item ? "border-[#B81D1D] bg-[#B81D1D] text-white" : "border-white/15 text-white/55 hover:text-white"}`}>{item.replaceAll("_", " ")}</button>)}
            </div>
            <div className="mt-5 border-t border-white/10 pt-4 text-[10px] font-mono uppercase tracking-widest text-white/45">
              Seed: {entry.numero}-{format}-{cardData.variant}<br />Safe area story: 250–1660 px
            </div>
          </aside>
        </section>

        {error && <p className="border border-[#B81D1D]/60 bg-[#B81D1D]/10 p-3 text-sm text-[#F4F1EC]">{error}</p>}
        {auth?.authenticated && <CardCustomizer value={custom} onChange={(patch) => { setCustom((current) => ({ ...current, ...patch })); setSaved(false); }} onSave={saveCustom} saving={updateMutation.isPending} saved={saved} error={error} titlePlaceholder={entry.sintesi || "Sintesi automatica"} subtitlePlaceholder="PROGETTO J" wordToggleLabel="Mostra dati nella card" />}
        <div className="sr-only" style={{ height: previewHeight }} />
      </div>
    </main>
  );
}

export default function Card() {
  const { giorno } = useParams<{ giorno: string }>();
  const { data: entries, isLoading, isError } = useListEntries();
  const numero = /^\d+$/.test(giorno ?? "") ? Number(giorno) : NaN;
  const entry = entries?.find((item) => item.numero === numero);
  if (isLoading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-white/50">Caricamento card…</div>;
  if (isError || !entry || !entries) return <div className="min-h-screen bg-[#080808] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-white/50">Giorno non trovato</div>;
  return <CardContent entry={entry} entries={entries} />;
}