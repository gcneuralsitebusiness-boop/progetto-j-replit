import { useListEntries, useGetSiteContent, getGetSiteContentQueryKey } from "@workspace/api-client-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
import { Dumbbell, Heart, Flame, Wallet } from "lucide-react";

const chartTooltip = {
  contentStyle: { backgroundColor: "#0a0a0a", borderColor: "hsl(var(--primary))", color: "#F5F0E8", borderRadius: 0 },
};

const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const axisProps = {
  tick: { fill: "#666666", fontSize: 11, fontFamily: "Inter, sans-serif" },
  tickLine: false,
  axisLine: false,
};

export default function Journaling() {
  const { data: entries, isLoading: entriesLoading, isError: entriesError } = useListEntries();
  const { data: content, isLoading: contentLoading, isError: contentError } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const isLoading = entriesLoading || contentLoading;
  const isError = entriesError || contentError;
  const journalingIntro = content?.journaling_intro;

  const chartData = entries
    ? [...entries].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : [];

  const formattedChartData = chartData.map((e) => ({
    ...e,
    formattedDate: format(new Date(e.data), "d MMM", { locale: it }),
    allenamento: (e.flessioni || 0) + (e.addominali || 0),
  }));

  const financeData = formattedChartData.filter((d) => d.entrate != null || d.uscite != null);

  const latest = entries && entries.length > 0 ? entries[0] : null;
  const totalEntries = entries?.length ?? 0;
  const totalCalories = entries?.reduce((sum, e) => sum + (e.kcal || 0), 0) ?? 0;
  const totalKm = entries?.reduce((sum, e) => sum + (e.km || 0), 0) ?? 0;
  const totalIncome = entries?.reduce((sum, e) => sum + (e.entrate || 0), 0) ?? 0;

  // Peso progresso: delta dal primo peso registrato all'ultimo
  const sortedAsc = entries
    ? [...entries].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    : [];
  const firstWithPeso = sortedAsc.find((e) => e.peso != null && e.peso > 0);
  const latestWithPeso = [...sortedAsc].reverse().find((e) => e.peso != null && e.peso > 0);
  const pesoDelta =
    firstWithPeso && latestWithPeso && firstWithPeso.id !== latestWithPeso.id
      ? +(latestWithPeso.peso! - firstWithPeso.peso!).toFixed(1)
      : null;

  // Sonno medio: media su tutti i giorni con dato sonno
  const sonnoEntries = entries?.filter((e) => e.sonno != null && e.sonno > 0) ?? [];
  const sonnoMedio =
    sonnoEntries.length > 0
      ? +(sonnoEntries.reduce((s, e) => s + (e.sonno ?? 0), 0) / sonnoEntries.length).toFixed(1)
      : null;

  const maxDay = latest ? latest.numero : 0;
  const goalDay = 180;

  const chartProps = { margin: { top: 10, right: 10, left: -20, bottom: 0 } };

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
          <p className="text-[15px] sm:text-[16px] font-sans text-foreground/80 leading-relaxed mb-16 max-w-2xl whitespace-pre-wrap ink-line">
            {journalingIntro}
          </p>
        </Reveal>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <Reveal>
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Flame size={16} strokeWidth={2} />
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">GIORNI</span>
            </div>
            <AnimatedNumber value={totalEntries} className="font-serif text-[36px] sm:text-[48px] leading-none text-foreground bebas" formatter={(n) => String(n)} />
          </div>
        </Reveal>
        <Reveal delay={50}>
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Dumbbell size={16} strokeWidth={2} />
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">KM</span>
            </div>
            <AnimatedNumber value={totalKm} className="font-serif text-[36px] sm:text-[48px] leading-none text-foreground bebas" formatter={(n) => String(n)} />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Heart size={16} strokeWidth={2} />
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">KCAL</span>
            </div>
            <AnimatedNumber value={totalCalories} className="font-serif text-[36px] sm:text-[48px] leading-none text-foreground bebas" />
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-2 text-[hsl(var(--acid))]">
              <Wallet size={16} strokeWidth={2} />
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">ENTRATE</span>
            </div>
            <div className="font-serif text-[36px] sm:text-[48px] leading-none text-[hsl(var(--acid))] bebas">
              €<AnimatedNumber value={totalIncome} />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Progress rings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Reveal>
          <div className="border border-border bg-card p-6 metallic-sheen flex items-center justify-center">
            <ProgressRing value={maxDay} max={goalDay} label="Progresso 180 giorni" sublabel={`${maxDay}/180`} size={140} />
          </div>
        </Reveal>
        <Reveal delay={50}>
          <div className="border border-border bg-card p-6 metallic-sheen flex flex-col justify-center">
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-4">Ultimo giorno</span>
            {latest ? (
              <div className="flex items-center gap-3">
                <span className="font-serif text-[48px] leading-none text-primary bebas">{latest.numero.toString().padStart(3, "0")}</span>
                <MilestoneBadge day={latest.numero} />
              </div>
            ) : (
              <span className="text-muted-foreground text-[15px] font-sans">Nessun dato</span>
            )}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="border border-border bg-card p-6 metallic-sheen flex flex-col justify-center">
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">Metriche chiave</span>
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-muted-foreground/70">Peso attuale</span>
                <div className="font-serif text-[32px] leading-none text-foreground bebas mt-1">
                  {latestWithPeso ? `${latestWithPeso.peso} KG` : "—"}
                </div>
                {pesoDelta !== null && (
                  <span className={`text-[11px] font-sans tabular ${pesoDelta <= 0 ? "stat-delta-positive" : "stat-delta-negative"}`}>
                    {pesoDelta > 0 ? "+" : ""}{pesoDelta} kg dal gg 1
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-muted-foreground/70">Sonno medio</span>
                <div className="font-serif text-[32px] leading-none text-foreground bebas mt-1">
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
      </div>

      {/* Charts */}
      {formattedChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          <Reveal>
            <div className="bg-card border border-border p-5 metallic-sheen h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">PESO NEL TEMPO</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData.filter((d) => d.peso != null)} {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="formattedDate" {...axisProps} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} {...axisProps} />
                    {!isTouch && <Tooltip {...chartTooltip} itemStyle={{ color: "hsl(var(--primary))" }} />}
                    <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="bg-card border border-border p-5 metallic-sheen h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">ORE SONNO</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData.filter((d) => d.sonno != null)} {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
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
            <div className="bg-card border border-border p-5 metallic-sheen h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">KCAL GIORNALIERE</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData.filter((d) => d.kcal != null)} {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
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
            <div className="bg-card border border-border p-5 metallic-sheen h-full flex flex-col">
              <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-5">ALLENAMENTO SETTIMANALE</h3>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData.filter((d) => d.allenamento > 0)} {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="formattedDate" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip {...chartTooltip} cursor={{ fill: "#1a1a1a", opacity: 0.4 }} />
                    <Bar dataKey="allenamento" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          {/* Entrate vs Uscite — full width */}
          {financeData.length > 0 && (
            <Reveal>
              <div className="bg-card border border-border p-5 metallic-sheen md:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">ENTRATE VS USCITE</h3>
                  <div className="flex items-center gap-5">
                    <span className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.16em] text-[#4ade80]">
                      <span style={{ display: "inline-block", width: 16, height: 2, background: "#4ade80", borderRadius: 1 }} />
                      Entrate
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.16em] text-primary">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                      <XAxis dataKey="formattedDate" {...axisProps} />
                      <YAxis
                        {...axisProps}
                        tickFormatter={(v: number) => (v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`)}
                      />
                      {!isTouch && (
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#1f1f1f", color: "#F5F0E8", borderRadius: 0, fontSize: 12 }}
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
        </div>
      )}

      {formattedChartData.length > 0 && (
        <div className="flex justify-center mb-16">
          <Cross />
        </div>
      )}

      {/* Feed */}
      <div className="flex flex-col gap-4">
        <Reveal>
          <h2 className="font-serif text-[clamp(40px,8vw,72px)] leading-[0.85] tracking-wide bebas text-foreground mb-6">
            REGISTRO
          </h2>
        </Reveal>

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
        ) : (
          entries.map((entry) => (
            <Reveal key={entry.id}>
              <DayCard entry={entry} />
            </Reveal>
          ))
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
