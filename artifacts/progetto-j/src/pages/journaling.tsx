import { useState, useMemo } from "react";
import { useListEntrySummaries } from "@workspace/api-client-react";
import { Area, ComposedChart, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { DayCard } from "@/components/DayCard";
import { ProgressRing } from "@/components/ProgressRing";
import { MilestoneBadge } from "@/components/MilestoneBadge";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { stripHtml } from "@/lib/strip-html";

const PAGE_SIZE = 12;

function stripDayLabel(text: string): string {
  return text.replace(/^\s*GIORNO\s+\d+\s*[—–-]?\s*[\d-]*\s*\n?/i, "").trim();
}

const chartTooltip = {
  contentStyle: {
    backgroundColor: "#0A0A0A",
    border: "1px solid #B81D1D",
    color: "#E8E4DE",
    borderRadius: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    letterSpacing: "0.05em",
    padding: "8px 12px",
  },
};

const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const axisProps = {
  tick: { fill: "#666666", fontSize: 11, fontFamily: "Inter, sans-serif" },
  tickLine: false,
  axisLine: false,
};

export default function Journaling() {
  const { data: entries, isLoading: entriesLoading, isError: entriesError } = useListEntrySummaries();
  const isLoading = entriesLoading;
  const isError = entriesError;
  const journalingIntro = "Tutto ciò che misuri migliora.\nSegnare i dati dà disciplina.\nI dati sono informazione.\nInformazione più disciplina uguale progresso. Sempre.";

  // ─── Filter + pagination state ─────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Full dataset for charts
  const chartData = entries
    ? [...entries].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : [];

  const formattedChartData = chartData.map((e) => ({
    ...e,
    formattedDate: format(new Date(e.data), "d MMM", { locale: it }),
    allenamento: (e.flessioni || 0) + (e.addominali || 0),
  }));

  const financeData = formattedChartData.filter((d) => d.entrate != null || d.uscite != null);

  // Stats computed over full dataset
  const latest = entries && entries.length > 0
    ? [...entries].reduce((current, entry) => entry.numero > current.numero ? entry : current)
    : null;
  const totalEntries = entries?.length ?? 0;
  const totalCalories = entries?.reduce((sum, e) => sum + (e.kcal || 0), 0) ?? 0;
  const totalKm = entries?.reduce((sum, e) => sum + (e.km || 0), 0) ?? 0;
  const totalIncome = entries?.reduce((sum, e) => sum + (e.entrate || 0), 0) ?? 0;

  const sortedAsc = entries
    ? [...entries].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : [];
  const firstWithPeso = sortedAsc.find((e) => e.peso != null && e.peso > 0);
  const latestWithPeso = [...sortedAsc].reverse().find((e) => e.peso != null && e.peso > 0);
  const pesoDelta =
    firstWithPeso && latestWithPeso && firstWithPeso.id !== latestWithPeso.id
      ? +(latestWithPeso.peso! - firstWithPeso.peso!).toFixed(1)
      : null;

  const sonnoEntries = entries?.filter((e) => e.sonno != null && e.sonno > 0) ?? [];
  const sonnoMedio =
    sonnoEntries.length > 0
      ? +(sonnoEntries.reduce((s, e) => s + (e.sonno ?? 0), 0) / sonnoEntries.length).toFixed(1)
      : null;
  const kpiItems = [
    { label: "GIORNI", value: totalEntries, suffix: "", prefix: "" },
    { label: "KCAL", value: totalCalories, suffix: "", prefix: "" },
    { label: "KM", value: totalKm, suffix: "", prefix: "" },
    { label: "ENTRATE", value: totalIncome, suffix: "", prefix: "€" },
    { label: "PESO", value: latestWithPeso?.peso ?? null, suffix: " KG", prefix: "" },
    { label: "SONNO", value: sonnoMedio, suffix: " H", prefix: "" },
  ] as const;

  const maxDay = latest ? latest.numero : 0;
  const goalDay = 180;
  const chartProps = { margin: { top: 10, right: 10, left: -20, bottom: 0 } };

  // ─── Month options (derived from full dataset) ─────────────────────────────
  const monthOptions = useMemo(() => {
    if (!entries) return [];
    const months = new Set<string>();
    for (const e of entries) {
      const m = e.data.slice(0, 7); // YYYY-MM
      months.add(m);
    }
    return [...months].sort().reverse();
  }, [entries]);

  // ─── Filtered + paginated feed ─────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    let result = [...entries]; // already newest-first from API
    if (selectedMonth !== "all") {
      result = result.filter((e) => e.data.startsWith(selectedMonth));
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (e) =>
          String(e.numero).includes(q) ||
          (e.testo ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, selectedMonth, searchText]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  // Reset pagination when filters change
  const handleMonthChange = (v: string) => { setSelectedMonth(v); setVisibleCount(PAGE_SIZE); };
  const handleSearchChange = (v: string) => { setSearchText(v); setVisibleCount(PAGE_SIZE); };

  if (isError) {
    return (
      <>
        <DataErrorState />
        <SiteFooter />
      </>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 max-w-5xl mx-auto px-5 sm:px-6">
        <Reveal>
          <div className="mb-6">
          <span className="page-label">DIARIO OPERATIVO</span>
          <h1 className="font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide bebas text-foreground mt-2">
            JOURNALING
          </h1>
        </div>
      </Reveal>

      {journalingIntro && (
        <Reveal>
          <p className="text-[15px] sm:text-[16px] font-sans text-foreground/80 leading-relaxed mb-12 max-w-2xl whitespace-pre-wrap ink-line">
            {journalingIntro}
          </p>
        </Reveal>
      )}

        {/* Current checkpoint: gives the newest update narrative priority. */}
        {latest && (
          <Reveal>
            <section className="relative mb-12 min-h-[280px] overflow-hidden border border-iron bg-card">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
              {latest.foto && (
                <>
                  <img
                    src={getPhotoUrl(latest.foto) ?? undefined}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover grayscale-[20%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
                </>
              )}
              <div className="relative flex min-h-[280px] flex-col justify-end gap-6 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="page-label">ULTIMO CHECKPOINT</span>
                  <div className="mt-3 flex items-end gap-4">
                    <span className="font-serif text-[clamp(64px,11vw,112px)] leading-[0.72] text-primary bebas">
                      {String(latest.numero).padStart(3, "0")}
                    </span>
                    <span className="pb-1 text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                      {format(new Date(latest.data), "d MMMM yyyy", { locale: it })}
                    </span>
                  </div>
                  {latest.testo && (
                    <p className="mt-5 max-w-2xl text-[15px] font-sans leading-relaxed text-foreground/85 line-clamp-3">
                      {stripHtml(stripDayLabel(latest.testo))}
                    </p>
                  )}
                </div>
                <Link href={`/giorno/${latest.numero}`} className="btn-primary shrink-0">
                  Apri il giorno <ArrowRight size={15} />
                </Link>
              </div>
            </section>
          </Reveal>
        )}

      {/* Last seven days consistency strip */}
      {entries && entries.length > 0 && (
        <Reveal>
          {(() => {
            const currentDay = Math.max(...entries.map((entry) => entry.numero));
            const weekDays = Array.from({ length: 7 }, (_, index) => currentDay - 6 + index);
            const loggedCount = weekDays.filter((day) => entries.some((entry) => entry.numero === day && entry.testo != null)).length;
            return (
              <div className="mb-12 border-y border-border py-5">
                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                  {weekDays.map((day) => {
                    const logged = entries.some((entry) => entry.numero === day && entry.testo != null);
                    return (
                      <div
                        key={day}
                        className={`flex h-10 w-full min-w-0 items-center justify-center measured text-[13px] ${
                          logged
                            ? "bg-primary text-white"
                            : "border border-dashed border-[#333] bg-card text-[#444]"
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                  {loggedCount}/7 giorni questa settimana
                </div>
              </div>
            );
          })()}
        </Reveal>
      )}

      {/* KPI strip */}
      <section aria-labelledby="metriche-title" className="mb-12">
        <h2 id="metriche-title" className="sr-only">Metriche del percorso</h2>
        <div className="mb-12 flex snap-x gap-0 overflow-x-auto border border-border bg-card no-scrollbar">
          {kpiItems.map((item) => (
            <div key={item.label} className="min-w-[120px] shrink-0 snap-start border-r border-border p-4 last:border-r-0 sm:min-w-[140px] sm:p-5">
              <div className={`measured text-[clamp(24px,4vw,36px)] leading-none ${item.label === "ENTRATE" ? "text-[hsl(var(--acid))]" : "text-foreground"}`}>
                {item.prefix}
                {typeof item.value === "number" ? (
                  <AnimatedNumber
                    value={item.value}
                    formatter={(number) => item.label === "KCAL" || item.label === "ENTRATE"
                      ? number.toLocaleString("it-IT")
                      : number.toLocaleString("it-IT", { maximumFractionDigits: 1 })}
                  />
                ) : "—"}
                {item.suffix}
              </div>
              <div className="mt-2 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Progress rings */}
      <section aria-label="Riepilogo del percorso" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Reveal>
          <div className="border border-border bg-card p-6 flex items-center justify-center">
            <ProgressRing value={maxDay} max={goalDay} label="Progresso 180 giorni" sublabel={`${maxDay}/180`} size={140} />
          </div>
        </Reveal>
        <Reveal delay={50}>
          <div className="border border-border bg-card p-6 flex flex-col justify-center">
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-4">Ultimo giorno</span>
            {latest ? (
              <div className="flex items-center gap-3">
                <span className="font-serif text-[48px] leading-none text-primary bebas measured">{latest.numero.toString().padStart(3, "0")}</span>
                <MilestoneBadge day={latest.numero} />
              </div>
            ) : (
              <span className="text-muted-foreground text-[15px] font-sans">Nessun dato</span>
            )}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="border border-border bg-card p-6 flex flex-col justify-center">
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">Metriche chiave</span>
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-muted-foreground/70">Peso attuale</span>
                <div className="font-serif text-[32px] leading-none text-foreground bebas measured mt-1">
                  {latestWithPeso ? `${latestWithPeso.peso} KG` : "—"}
                </div>
                {pesoDelta !== null && (
                  <span className={`measured text-[11px] font-sans tabular ${pesoDelta <= 0 ? "stat-delta-positive" : "stat-delta-negative"}`}>
                    {pesoDelta > 0 ? "+" : ""}{pesoDelta} kg dal gg 1
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-muted-foreground/70">Sonno medio</span>
                <div className="font-serif text-[32px] leading-none text-foreground bebas measured mt-1">
                  {sonnoMedio !== null ? `${sonnoMedio}H` : "—"}
                </div>
                {sonnoEntries.length > 0 && (
                  <span className="text-[11px] font-sans text-muted-foreground/60">
                    su {sonnoEntries.length} notti
                  </span>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Charts — always over full dataset */}
      {formattedChartData.length > 0 && (
        <section aria-label="Andamento nel tempo" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          <Reveal>
            <div className="bg-card border border-border p-5 h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">PESO NEL TEMPO</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={formattedChartData.filter((d) => d.peso != null)} {...chartProps}>
                    <defs>
                      <linearGradient id="journalingPesoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                    <XAxis dataKey="formattedDate" {...axisProps} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} {...axisProps} />
                    {!isTouch && <Tooltip {...chartTooltip} itemStyle={{ color: "hsl(var(--primary))" }} />}
                    <Area type="monotone" dataKey="peso" fill="url(#journalingPesoGrad)" stroke="none" />
                    <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="bg-card border border-border p-5 h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">ORE SONNO</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData.filter((d) => d.sonno != null)} {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                    <XAxis dataKey="formattedDate" {...axisProps} />
                    <YAxis domain={[0, "dataMax + 2"]} {...axisProps} />
                    {!isTouch && <Tooltip {...chartTooltip} itemStyle={{ color: "hsl(var(--primary))" }} />}
                    <Line type="monotone" dataKey="sonno" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="bg-card border border-border p-5 h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">KCAL GIORNALIERE</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData.filter((d) => d.kcal != null)} {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                    <XAxis dataKey="formattedDate" {...axisProps} />
                    <YAxis domain={["dataMin - 200", "dataMax + 200"]} {...axisProps} />
                    {!isTouch && <Tooltip {...chartTooltip} itemStyle={{ color: "hsl(var(--primary))" }} />}
                    <Line type="monotone" dataKey="kcal" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="bg-card border border-border p-5 h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">ALLENAMENTO SETTIMANALE</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData.filter((d) => d.allenamento > 0)} {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                    <XAxis dataKey="formattedDate" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip {...chartTooltip} cursor={{ fill: "#1a1a1a", opacity: 0.4 }} />
                    <Bar dataKey="allenamento" fill="hsl(var(--primary))" animationDuration={1200} animationBegin={200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          {financeData.length > 0 && (
            <Reveal>
              <div className="bg-card border border-border p-5 md:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">ENTRATE VS USCITE</h3>
                  <div className="flex items-center gap-5">
                    <span className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.16em] text-[#4ade80]">
                      <span style={{ display: "inline-block", width: 16, height: 2, background: "#4ade80", borderRadius: 1 }} />
                      Entrate
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.16em] text-iron">
                      <span style={{ display: "inline-block", width: 16, height: 2, background: "hsl(0 68% 38%)", borderRadius: 1 }} />
                      Uscite
                    </span>
                  </div>
                </div>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financeData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      barGap={4}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                      <XAxis dataKey="formattedDate" {...axisProps} />
                      <YAxis
                        {...axisProps}
                        tickFormatter={(v: number) => (v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`)}
                      />
                      {!isTouch && (
                        <Tooltip
                          contentStyle={chartTooltip.contentStyle}
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                          formatter={(value: number, name: string) => [
                            `€${Number(value).toLocaleString("it-IT")}`,
                            name === "entrate" ? "Entrate" : "Uscite",
                          ]}
                        />
                      )}
                      <Bar dataKey="entrate" name="entrate" fill="#4ade80" maxBarSize={28} />
                      <Bar dataKey="uscite" name="uscite" fill="hsl(0 68% 38%)" maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>
          )}
        </section>
      )}

      {formattedChartData.length > 0 && (
        <div className="flex justify-center mb-16">
          <Cross />
        </div>
      )}

      {/* Feed with filter bar */}
      <div className="flex flex-col gap-4">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-2">
            <h2 className="font-serif text-[clamp(40px,8vw,72px)] leading-[0.85] tracking-wide bebas text-foreground">
              REGISTRO
            </h2>
            {entries && <span className="pb-1 text-[11px] font-sans uppercase tracking-[0.16em] text-muted-foreground">{filteredEntries.length} giorni</span>}
          </div>
        </Reveal>

        {/* Filter bar */}
        {entries && entries.length > 0 && (
          <Reveal>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-foreground focus:outline-none focus:border-primary uppercase tracking-wider"
              >
                <option value="all">Tutti i mesi</option>
                {monthOptions.map((m) => {
                  const [year, month] = m.split("-");
                  const label = format(new Date(Number(year), Number(month) - 1, 1), "MMMM yyyy", { locale: it }).toUpperCase();
                  return <option key={m} value={m}>{label}</option>;
                })}
              </select>
              <input
                type="text"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cerca nel diario..."
                className="flex-1 bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
              />
              {(selectedMonth !== "all" || searchText.trim()) && (
                <button
                  onClick={() => { handleMonthChange("all"); handleSearchChange(""); }}
                  className="px-4 py-2.5 text-[11px] font-sans uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:bg-[#141414] transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </Reveal>
        )}

        {isLoading ? (
          <Reveal>
            <div className="py-20 text-center text-muted-foreground italic font-serif text-xl">Caricamento...</div>
          </Reveal>
        ) : !entries || entries.length === 0 ? (
          <Reveal>
            <div className="py-20 text-center border border-border bg-card">
              <p className="font-serif text-[clamp(32px,5vw,48px)] text-muted-foreground">IL PRIMO GIORNO ARRIVA PRESTO.</p>
            </div>
          </Reveal>
        ) : filteredEntries.length === 0 ? (
          <Reveal>
            <div className="py-16 text-center border border-border bg-card">
              <p className="font-serif text-[28px] text-muted-foreground">NESSUN RISULTATO.</p>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {visibleEntries.map((entry, index) => (
                <Reveal key={entry.id}>
                  <DayCard entry={entry} featured={index === 0} />
                </Reveal>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="border border-border px-8 py-3 font-serif text-[15px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-[#141414] transition-colors"
                >
                  CARICA ALTRI ({filteredEntries.length - visibleCount})
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
