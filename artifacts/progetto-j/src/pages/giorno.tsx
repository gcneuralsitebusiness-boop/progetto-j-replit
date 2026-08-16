import { useEffect, useRef, useState, type ReactElement } from "react";
import { useParams, useSearch, Link } from "wouter";
import { useListEntries, useListArticles } from "@workspace/api-client-react";
import type { Entry as ApiEntry } from "@workspace/api-client-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Share2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { usePageMeta } from "@/hooks/use-page-meta";

function padDay(n: number) {
  return n.toString().padStart(3, "0");
}

function stripDayLabel(text: string): string {
  return text.replace(/^\s*GIORNO\s+\d+\s*[—–-]?\s*[\d-]*\s*\n?/i, "").trim();
}

function formatCurrency(n: number): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(n: number, fraction = 0): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: fraction });
}

function hasNutritionData(entry: GiornoEntry): boolean {
  return entry.kcal != null
    || entry.pasti != null
    || entry.acqua != null
    || entry.energia != null
    || entry.alcol === true;
}

function hasTrainingData(entry: GiornoEntry): boolean {
  return entry.tipoAllenamento != null
    || entry.durata != null
    || entry.intensita != null
    || entry.tipoGiorno != null
    || entry.routineCompletata != null
    || entry.routineFlessioni != null
    || entry.routineTrazioni != null
    || entry.routineSquat != null
    || entry.plank != null
    || entry.routineForza != null
    || entry.collo != null
    || entry.mobilita != null
    || entry.sollevamentoGamba != null
    || entry.grapplingVuoto != null;
}

function hasTrackingData(entry: GiornoEntry): boolean {
  return hasNutritionData(entry) || hasTrainingData(entry);
}

// ─── Data strip ───────────────────────────────────────────────────────────────

interface DataStripItem {
  key: string;
  value: number;
  display: string;
  label: string;
}

function DataStrip({ entry }: { entry: GiornoEntry }) {
  const items: DataStripItem[] = [];
  if (entry.peso != null) {
    items.push({ key: "peso", value: entry.peso, display: `${formatNumber(entry.peso, 1)}KG`, label: "PESO" });
  }
  if (entry.battito != null) {
    items.push({ key: "battito", value: entry.battito, display: `${formatNumber(entry.battito)}BPM`, label: "BATTITO" });
  }
  if (entry.sonno != null) {
    items.push({ key: "sonno", value: entry.sonno, display: `${formatNumber(entry.sonno, 1)}H`, label: "SONNO" });
  }
  if (entry.kcal != null) {
    items.push({ key: "kcal", value: entry.kcal, display: formatNumber(entry.kcal), label: "KCAL" });
  }
  if (entry.round != null) {
    items.push({ key: "round", value: entry.round, display: formatNumber(entry.round), label: "ROUND" });
  }
  if (entry.flessioni != null) {
    items.push({ key: "flessioni", value: entry.flessioni, display: formatNumber(entry.flessioni), label: "FLEX" });
  }
  if (entry.addominali != null) {
    items.push({ key: "addominali", value: entry.addominali, display: formatNumber(entry.addominali), label: "ADDOM" });
  }
  if (entry.km != null) {
    items.push({ key: "km", value: entry.km, display: formatNumber(entry.km, 1), label: "KM" });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory justify-start sm:justify-center gap-4 sm:gap-6 py-4 border-b border-border">
      {items.map((item) => (
        <div key={item.key} className="snap-start flex-shrink-0 flex flex-col items-center min-w-[60px] sm:min-w-[72px]">
          <div className="font-serif text-[36px] sm:text-[48px] leading-none text-foreground bebas measured">
            {item.display}
          </div>
          <div className="text-[11px] font-sans uppercase tracking-[0.12em] text-muted-foreground mt-1">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackingRows({ entry, routineStreak }: { entry: GiornoEntry; routineStreak: number }) {
  const hasNutrition = hasNutritionData(entry);
  const hasTraining = hasTrainingData(entry);

  if (!hasNutrition && !hasTraining) return null;
  const activeDay = entry.routineCompletata === true
    || Boolean(entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");

  const cell = (value: string, label: string, tone?: "acid" | "primary") => (
    <div key={`${label}-${value}`} className="flex flex-col">
      <span className={`measured font-mono text-[16px] leading-tight ${tone === "acid" ? "text-[hsl(var(--acid))]" : tone === "primary" ? "text-primary" : "text-foreground"}`}>
        {value}
      </span>
      <span className="mt-0.5 text-[9px] font-sans uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="mt-4 space-y-5 border-t border-border pt-4 uppercase">
      {hasNutrition && (
        <div>
          <div className="mb-2 text-[10px] font-sans tracking-[0.16em] text-muted-foreground">NUTRIZIONE</div>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            {entry.kcal != null && cell(formatNumber(entry.kcal), "KCAL")}
            {entry.pasti != null && cell(String(entry.pasti), "PASTI")}
            {entry.acqua != null && cell(`${formatNumber(entry.acqua, 1)}L`, "ACQUA")}
            {entry.energia != null && cell(`${entry.energia}/5`, "ENERGIA")}
            {entry.alcol === true && cell("SÌ", "ALCOL", "primary")}
          </div>
        </div>
      )}
      {hasTraining && (
        <div>
          <div className="mb-2 text-[10px] font-sans tracking-[0.16em] text-muted-foreground">ALLENAMENTO</div>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            {entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO" && cell(entry.tipoAllenamento, "TIPO")}
            {entry.durata != null && cell(`${entry.durata}MIN`, "DURATA")}
            {entry.intensita != null && cell(String(entry.intensita), "INTENSITÀ")}
            {entry.tipoGiorno && cell(entry.tipoGiorno === "RECUPERO" ? "R" : entry.tipoGiorno, "ROUTINE")}
            {activeDay
              ? cell(`✓ · ${routineStreak}`, entry.routineCompletata === true ? "STREAK" : "STREAK (ALLENAMENTO)", "acid")
              : entry.routineCompletata === false
                ? cell("RESET", "STREAK", "primary")
                : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Finance row ──────────────────────────────────────────────────────────────

function FinanceRow({ entry }: { entry: GiornoEntry }) {
  if (entry.entrate == null && entry.uscite == null) return null;

  const entrate = entry.entrate ?? 0;
  const uscite = entry.uscite ?? 0;
  const saldo = entrate - uscite;

  return (
    <div className="flex justify-between items-start py-4 border-b border-border">
      <div className="flex flex-col gap-1">
        <div className="measured text-[20px] font-sans font-bold text-[hsl(var(--acid))]">
          €{formatCurrency(entrate)}
        </div>
        <div className="text-[11px] font-sans uppercase tracking-[0.12em] text-muted-foreground">
          ENTRATE
        </div>
      </div>
      <div className="flex flex-col gap-1 items-center">
        <div className="measured text-[20px] font-sans font-bold text-foreground">
          €{formatCurrency(uscite)}
        </div>
        <div className="text-[11px] font-sans uppercase tracking-[0.12em] text-muted-foreground">
          USCITE
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <div className={`measured text-[20px] font-sans font-bold ${saldo >= 0 ? "text-[hsl(var(--acid))]" : "text-primary"}`}>
          {saldo >= 0 ? "+" : "−"}€{formatCurrency(Math.abs(saldo))}
        </div>
        <div className="text-[11px] font-sans uppercase tracking-[0.12em] text-muted-foreground">
          SALDO
        </div>
      </div>
    </div>
  );
}

// ─── VS Media table ───────────────────────────────────────────────────────────

interface VsMetric {
  label: string;
  value: number | null;
  avg: number;
  fraction?: number;
}

function VsMediaTable({ entry, averages }: { entry: GiornoEntry; averages: VsMetric[] }) {
  const rows = averages.filter((m): m is VsMetric & { value: number } => m.value != null);
  if (rows.length === 0) return null;

  return (
    <div className="py-4 border-b border-border">
      {rows.map((m) => {
        const diff = m.value - m.avg;
        const pct = m.avg > 0 ? Math.round((diff / m.avg) * 100) : 0;
        const isPositive = diff > 0;
        const isEqual = diff === 0;
        const colorClass = isEqual ? "text-muted-foreground" : isPositive ? "text-[hsl(var(--acid))]" : "text-primary";
        const arrow = isEqual ? "=" : isPositive ? "↑" : "↓";
        const pctText = isEqual ? "0" : Math.abs(pct);

        return (
          <div key={m.label} className="flex items-center justify-between py-3">
            <div className="w-[40%] text-[13px] font-sans uppercase tracking-[0.1em] text-muted-foreground">
              {m.label}
            </div>
            <div className="w-[30%] text-right font-serif text-[28px] leading-none text-foreground bebas measured">
              {formatNumber(m.value, m.fraction ?? 0)}
            </div>
            <div className={`w-[30%] text-right text-[14px] font-sans font-bold ${colorClass}`}>
              {arrow} {pctText}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Diary text ───────────────────────────────────────────────────────────────

function isSubtitleLine(line: string): { isSubtitle: true; text: string } | { isSubtitle: false } {
  const md = line.match(/^\*\*(.+)\*\*$/);
  if (md) {
    return { isSubtitle: true, text: md[1].trim() };
  }
  const titleCase = /^[A-Z][A-Za-z'\u2019]+(?:\s+[A-Z][A-Za-z'\u2019]+)*$/;
  if (line.length <= 25 && !/[.!?,:;]$/.test(line) && titleCase.test(line)) {
    return { isSubtitle: true, text: line };
  }
  return { isSubtitle: false };
}

function DiaryText({ text, entryId, entryNumero }: { text: string; entryId: number; entryNumero: number }) {
  const cleaned = stripDayLabel(text);
  const lines = cleaned.split(/\r?\n/);
  const elements: ReactElement[] = [];
  const search = useSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  let buffer: { text: string; index: number }[] = [];
  let key = 0;

  const flush = () => {
    if (buffer.length > 0) {
      const paragraph = buffer.map((line) => line.text).join(" ").replace(/\s+/g, " ").trim();
      if (paragraph && buffer.length > 0) {
        elements.push(
          <p key={key++} className="font-sans text-[16px] text-foreground leading-[1.7] max-w-[65ch] mb-4">
            {buffer.map((line, lineIndex) => (
              <span
                key={line.index}
                data-line={line.index}
                className="group relative inline transition-colors duration-700 box-decoration-clone"
                style={
                  highlightedLine === line.index
                    ? {
                        backgroundColor: "hsl(var(--primary) / 0.28)",
                        borderLeft: "3px solid hsl(var(--primary))",
                        boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.3)",
                        padding: "2px 8px",
                      }
                    : undefined
                }
              >
                {line.text}
                <button
                  type="button"
                  aria-label={`Condividi riga del giorno ${entryNumero}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void shareLine(line.text, line.index);
                  }}
                  className="ml-2 inline-flex align-middle text-[10px] uppercase tracking-[0.12em] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary"
                >
                  <Share2 size={11} />
                </button>
                {lineIndex < buffer.length - 1 ? " " : null}
              </span>
            ))}
          </p>
        );
      }
      buffer = [];
    }
  };

  const shareLine = async (lineText: string, lineIndex: number) => {
    const url = `${window.location.origin}/giorno/${entryNumero}?line=${lineIndex}`;
    const title = `Giorno ${entryNumero} — Progetto J`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: lineText, url });
      } catch {
        // The reader cancelled the native share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be unavailable in an embedded browser.
    }
  };

  // A shared line is highlighted after the rendered diary is available, then fades out.
  useEffect(() => {
    const value = new URLSearchParams(search).get("line");
    const lineIndex = value == null ? null : Number(value);
    if (lineIndex == null || !Number.isInteger(lineIndex) || lineIndex < 0) return;
    const target = containerRef.current?.querySelector(`[data-line="${lineIndex}"]`);
    if (!target) return;
    setHighlightedLine(lineIndex);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = window.setTimeout(() => setHighlightedLine(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [search]);

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;

    const sub = isSubtitleLine(line);
    if (sub.isSubtitle) {
      flush();
      elements.push(
        <span
          key={key++}
          className="block font-serif text-[20px] text-iron bebas uppercase mt-6 first:mt-0 mb-2"
        >
          {sub.text}
        </span>
      );
    } else {
      buffer.push({ text: line, index });
    }
  });
  flush();

  if (elements.length === 0) return null;

  return (
    <>
      <div ref={containerRef} className="border-l-2 border-iron pl-6">{elements}</div>
      {copied && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-primary bg-[#0A0A0A] px-4 py-2 text-[11px] font-sans uppercase tracking-[0.2em] text-primary">
          LINK COPIATO
        </div>
      )}
    </>
  );
}

// ─── Linked articles (matched by date) ────────────────────────────────────────

function LinkedArticles({ entryData }: { entryData: string }) {
  const { data: articles } = useListArticles();
  const matched = (articles ?? [])
    .filter((a) => a.data === entryData)
    .sort((a, b) => new Date(a.createdAt ?? a.data).getTime() - new Date(b.createdAt ?? b.data).getTime());

  if (matched.length === 0) return null;

  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 border-t border-iron py-10">
      <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:sticky md:top-24 self-start mb-4 md:mb-0">
        ARTICOLI
      </div>
      <div className="flex flex-col gap-4">
        {matched.map((article) => (
          <Link
            key={article.id}
            href={`/a/${article.slug}`}
            className="group border border-border bg-card px-5 py-4 hover:border-iron transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] border border-border px-2 py-0.5 text-muted-foreground">
                {article.categoria}
              </span>
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                Scritto questo giorno
              </span>
            </div>
            <div className="font-serif text-[24px] sm:text-[28px] leading-none bebas uppercase text-foreground group-hover:text-primary transition-colors">
              {article.titolo}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Share button ─────────────────────────────────────────────────────────────

function ShareButton({ entryNumero, entryTesto }: { entryNumero: number; entryTesto: string | null }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Giorno ${entryNumero} — Progetto J`;
    const firstLine = entryTesto?.trim().split("\n").find((l) => l.trim()) ?? "";

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: firstLine || title, url });
      } catch {
        // user cancelled or error — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // fallback: select text
      }
    }
  };

  return (
    <div className="flex justify-center mb-10">
      <button
        onClick={handleShare}
        className="border border-border bg-card px-6 py-3 font-serif text-[14px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:border-iron transition-colors"
      >
        {copied ? "LINK COPIATO ✓" : "CONDIVIDI"}
      </button>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

/** Inner component rendered only when the entry is available, so hooks run unconditionally. */
function GiornoContent({
  entry,
  prevEntry,
  nextEntry,
  averages,
  routineStreak,
}: {
  entry: GiornoEntry;
  prevEntry: GiornoEntry | null;
  nextEntry: GiornoEntry | null;
  averages: VsMetric[];
  routineStreak: number;
}) {
  const photoUrl = getPhotoUrl(entry.foto);
  const hasPhoto = Boolean(entry.foto && photoUrl);

  // Build a short description from the first diary sentence, falling back to the date.
  const firstDiaryLine = entry.testo
    ? stripDayLabel(entry.testo).split(/\r?\n/).find((l) => l.trim())?.trim()
    : undefined;
  const dateLabel = format(new Date(entry.data), "d MMMM yyyy", { locale: it });
  const metaDescription = firstDiaryLine
    ? firstDiaryLine.length > 160
      ? firstDiaryLine.slice(0, 157) + "…"
      : firstDiaryLine
    : `Giorno ${entry.numero} — ${dateLabel}`;
  const hasData = entry.peso != null
    || entry.battito != null
    || entry.sonno != null
    || entry.round != null
    || entry.flessioni != null
    || entry.addominali != null
    || entry.km != null
    || hasTrackingData(entry);
  const hasFinance = entry.entrate != null || entry.uscite != null;
  const hasVsMedia = averages.some((metric) => metric.value != null);

  usePageMeta({
    title: `Giorno ${String(entry.numero).padStart(3, "0")} — Progetto J`,
    description: metaDescription,
    image: hasPhoto ? photoUrl : null,
    url: `${window.location.origin}/giorno/${entry.numero}`,
  });

  return (
    <div className="min-h-screen pb-24">
      {/* ─── Hero ─── */}
      <div className="relative w-full h-[50svh] min-h-[320px] max-h-[520px] overflow-hidden">
        {hasPhoto ? (
          <img
            src={photoUrl ?? undefined}
            alt={`Giorno ${entry.numero}`}
            className="w-full h-full object-cover grayscale-[15%]"
          />
        ) : (
          <div className="relative h-full w-full border border-iron bg-[#0A0A0A]">
            <div className="crosshatch absolute inset-0 opacity-30" />
            <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-sans uppercase tracking-[0.2em] text-[#3A3A3A]">
              NESSUNA IMMAGINE — SOLO IL LAVORO
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Back button */}
        <div className="absolute top-20 left-0 right-0 max-w-5xl mx-auto px-5 sm:px-6">
          <Link
            href="/journaling"
            className="inline-flex items-center gap-2 text-[11px] font-sans uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Journaling
          </Link>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-6 -mt-16 relative z-10">

        {/* Day header */}
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
            <div>
              <span className="page-label">GIORNO</span>
              <h1 className="font-serif text-[clamp(72px,14vw,140px)] leading-[0.8] text-primary bebas tracking-wide">
                {padDay(entry.numero)}
              </h1>
            </div>
            <div className="text-right pb-2">
              <div className="text-[13px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                {format(new Date(entry.data), "EEEE", { locale: it })}
              </div>
              <div className="font-serif text-[28px] text-foreground bebas tracking-wide">
                {format(new Date(entry.data), "d MMMM yyyy", { locale: it })}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 gap-y-0 max-w-4xl mx-auto px-5">
          {hasData && <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 border-t border-iron py-10">
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:sticky md:top-24 self-start mb-4 md:mb-0">DATI</div>
            <div>
              <DataStrip entry={entry} />
              <TrackingRows entry={entry} routineStreak={routineStreak} />
            </div>
          </div>}
          {hasFinance && <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 border-t border-iron py-10">
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:sticky md:top-24 self-start mb-4 md:mb-0">FINANZE</div>
            <FinanceRow entry={entry} />
          </div>}
          {hasVsMedia && <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 border-t border-iron py-10">
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:sticky md:top-24 self-start mb-4 md:mb-0">VS MEDIA</div>
            <VsMediaTable entry={entry} averages={averages} />
          </div>}
          {entry.testo && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 border-t border-iron py-10">
              <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:sticky md:top-24 self-start mb-4 md:mb-0">DIARIO</div>
              <DiaryText text={entry.testo} entryId={entry.id} entryNumero={entry.numero} />
            </div>
          )}
          <LinkedArticles entryData={entry.data} />
        </div>

        {/* ─── Prev / Next navigation ─── */}
        <ShareButton entryNumero={entry.numero} entryTesto={entry.testo ?? null} />

        <div className="h-px bg-border mb-10" />
        <div className="grid grid-cols-2 gap-3">
          {prevEntry ? (
            <Link
              href={`/giorno/${prevEntry.numero}`}
              className="flex min-h-[64px] items-center gap-3 border border-border bg-card px-4 sm:px-5 hover:border-primary transition-colors group"
            >
              <ArrowLeft size={16} className="shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted-foreground">Precedente</div>
                <div className="font-serif text-[22px] leading-none text-foreground bebas">GG {padDay(prevEntry.numero)}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {nextEntry ? (
            <Link
              href={`/giorno/${nextEntry.numero}`}
              className="flex min-h-[64px] items-center justify-end gap-3 border border-border bg-card px-4 sm:px-5 hover:border-primary transition-colors text-right group"
            >
              <div className="min-w-0">
                <div className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted-foreground">Successivo</div>
                <div className="font-serif text-[22px] leading-none text-foreground bebas">GG {padDay(nextEntry.numero)}</div>
              </div>
              <ArrowLeft size={16} className="shrink-0 text-primary rotate-180" />
            </Link>
          ) : (
            <div />
          )}
        </div>

        <div className="mt-16 flex justify-center">
          <Cross />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function GiornoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: entries, isLoading, isError } = useListEntries();

  const requestedNumber = Number(id);
  const entry = entries?.find((e) => e.numero === requestedNumber);

  // Compute averages across all entries
  const avg = (arr: (number | null | undefined)[]): number => {
    const vals = arr.filter((v): v is number => v != null && v > 0);
    return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : 0;
  };

  const avgKcal = avg(entries?.map((e) => e.kcal) ?? []);
  const avgKm = avg(entries?.map((e) => e.km) ?? []);
  const avgSonno = avg(entries?.map((e) => e.sonno) ?? []);
  const avgPeso = avg(entries?.map((e) => e.peso) ?? []);
  const avgBattito = avg(entries?.map((e) => e.battito) ?? []);
  const avgFlessioni = avg(entries?.map((e) => e.flessioni) ?? []);
  const avgAddominali = avg(entries?.map((e) => e.addominali) ?? []);
  const avgRound = avg(entries?.map((e) => e.round) ?? []);

  // Sorted entries for prev/next navigation
  const sorted = entries ? [...entries].sort((a, b) => b.numero - a.numero) : [];
  const idx = entry ? sorted.findIndex((e) => e.numero === entry.numero) : -1;
  const prevEntry = sorted[idx + 1] ?? null;
  const nextEntry = sorted[idx - 1] ?? null;

  let routineStreak = 0;
  const entryHasActivity = entry?.routineCompletata === true
    || Boolean(entry?.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");
  if (entry && entryHasActivity) {
    const byNumber = new Map((entries ?? []).map((item) => [item.numero, item]));
    for (let day = entry.numero; day >= 1; day -= 1) {
      const current = byNumber.get(day);
      const active = current?.routineCompletata === true
        || Boolean(current?.tipoAllenamento && current.tipoAllenamento !== "NESSUNO");
      if (!active) break;
      routineStreak += 1;
    }
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <span className="text-muted-foreground font-sans uppercase tracking-widest text-[12px] animate-pulse">Caricamento...</span>
        </div>
        <SiteFooter />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <DataErrorState />
        <SiteFooter />
      </>
    );
  }

  if (!entry) {
    return (
      <>
        <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6">
          <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-muted-foreground">Giornata non trovata</span>
          <Link href="/journaling" className="btn-primary text-[12px]">Torna al Journaling</Link>
        </div>
        <SiteFooter />
      </>
    );
  }

  const averages: VsMetric[] = [
    { label: "KCAL", value: entry.kcal ?? null, avg: avgKcal },
    { label: "SONNO", value: entry.sonno ?? null, avg: avgSonno, fraction: 1 },
    { label: "PESO", value: entry.peso ?? null, avg: avgPeso, fraction: 1 },
    { label: "BATTITO", value: entry.battito ?? null, avg: avgBattito },
    { label: "KM", value: entry.km ?? null, avg: avgKm, fraction: 1 },
    { label: "FLESSIONI", value: entry.flessioni ?? null, avg: avgFlessioni },
    { label: "ADDOMINALI", value: entry.addominali ?? null, avg: avgAddominali },
    { label: "ROUND", value: entry.round ?? null, avg: avgRound },
  ];

  return <GiornoContent entry={entry} prevEntry={prevEntry} nextEntry={nextEntry} averages={averages} routineStreak={routineStreak} />;
}

// Type alias used throughout this file for a single diary entry
type GiornoEntry = ApiEntry;
