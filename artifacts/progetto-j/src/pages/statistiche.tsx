import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, isAfter, parseISO, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { useListEntries } from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { DataErrorState } from "@/components/DataErrorState";
import { PulseTrace } from "@/components/PulseTrace";
import { Reveal } from "@/components/Reveal";
import { RevealGroup } from "@/components/RevealGroup";
import { TerminalBackdrop } from "@/components/TerminalBackdrop";
import { Grid180 } from "@/components/Grid180";
import { SiteFooter } from "@/components/SiteFooter";
import { useReveal } from "@/lib/use-reveal";

const COLORS = { red: "#B81D1D", copper: "#B87333", acid: "#00FF41", ink: "#E8E4DE", gray: "#6E6A65" };
const tooltipStyle = {
  backgroundColor: "#0A0A0A",
  border: "1px solid #B81D1D",
  color: "#E8E4DE",
  borderRadius: 0,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "12px",
  letterSpacing: "0.05em",
  padding: "8px 12px",
};

function average(entries: Entry[], selector: (entry: Entry) => number | null | undefined): number | null {
  const values = entries.map(selector).filter((value): value is number => value != null && Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function metricStats(entries: Entry[], selector: (entry: Entry) => number | null | undefined) {
  const values = entries.map(selector).filter((value): value is number => value != null && Number.isFinite(value));
  return {
    value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    count: values.length,
  };
}

function display(value: number | null, suffix = "", decimals = 1) {
  return value == null ? "—" : `${value.toLocaleString("it-IT", { maximumFractionDigits: decimals })}${suffix}`;
}

function waterLiters(entry: Entry): number | null {
  return entry.acqua != null && Number.isFinite(entry.acqua) ? entry.acqua : null;
}

function hydrationTarget(entry: Entry): number {
  const trainingBonus = entry.durata != null && entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO"
    ? Math.min(1, entry.durata / 120 * 0.5)
    : 0;
  return Number((2 + trainingBonus).toFixed(2));
}

function trainingLoad(entry: Entry): number | null {
  if (entry.durata == null || !entry.tipoAllenamento || entry.tipoAllenamento === "NESSUNO") return null;
  return entry.durata * (entry.intensita ?? 3);
}

function routineStats(entries: Entry[]) {
  const sorted = [...entries].sort((a, b) => a.numero - b.numero);
  let current = 0;
  let record = 0;
  let run = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    const isActive = sorted[index].routineCompletata === true
      || Boolean(sorted[index].tipoAllenamento && sorted[index].tipoAllenamento !== "NESSUNO");
    if (isActive) {
      run += 1;
      record = Math.max(record, run);
    } else {
      run = 0;
    }
    if (index === sorted.length - 1) current = run;
  }
  return { current, record };
}

function parseReps(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const sets = [...value.matchAll(/(\d+)\s*[x×]\s*(\d+)/gi)];
  if (sets.length) return sets.reduce((sum, match) => sum + Number(match[1]) * Number(match[2]), 0);
  const simple = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(simple) && simple > 0 ? simple : null;
}

function liftLevel(value: Entry["sollevamentoGamba"]): number | null {
  return value ? ({ ANCA: 1, PETTO: 2, TESTA: 3, OLTRE: 4 }[value] ?? null) : null;
}

/** Weekly training load: sum of minutes × intensity, grouped by ISO week start (Monday). */
function buildWeeklyLoad(all: Entry[]) {
  const weeks = new Map<string, { label: string; load: number; minuti: number }>();
  for (const entry of all) {
    if (entry.durata == null || !entry.tipoAllenamento || entry.tipoAllenamento === "NESSUNO") continue;
    const date = parseISO(entry.data);
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    const key = format(monday, "yyyy-MM-dd");
    const current = weeks.get(key) ?? { label: format(monday, "d MMM", { locale: it }), load: 0, minuti: 0 };
    current.load += entry.durata * (entry.intensita ?? 3);
    current.minuti += entry.durata;
    weeks.set(key, current);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => ({
    ...value,
    load: Math.round(value.load),
    minuti: Math.round(value.minuti),
  }));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-iron py-10">
      <h2 className="mb-6 font-serif text-[28px] tracking-[0.22em] text-foreground bebas uppercase">{title}</h2>
      {children}
    </section>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center border border-dashed border-iron px-6 text-center">
      <p className="max-w-sm font-sans text-[13px] leading-relaxed text-muted-foreground">{label}</p>
    </div>
  );
}

function ChartReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  const animated = useRef(false);

  useEffect(() => {
    if (!isVisible || animated.current || !ref.current) return;
    const frame = window.requestAnimationFrame(() => {
      const root = ref.current;
      if (!root) return;
      root.querySelectorAll<SVGPathElement>("path.recharts-line-curve").forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = String(length);
        path.style.strokeDashoffset = String(length);
        path.style.willChange = "stroke-dashoffset";
        window.requestAnimationFrame(() => {
          path.style.transition = "stroke-dashoffset var(--dur-draw) var(--ease-out)";
          path.style.strokeDashoffset = "0";
          window.setTimeout(() => { path.style.willChange = "auto"; }, 1200);
        });
      });
      root.querySelectorAll<SVGElement>(".recharts-area-area").forEach((area) => {
        area.style.opacity = "0";
        area.style.transition = "opacity var(--dur-base) var(--ease-out) 1200ms";
        window.requestAnimationFrame(() => { area.style.opacity = "1"; });
      });
      root.querySelectorAll<SVGElement>(".recharts-line-dots circle").forEach((dot, index) => {
        dot.style.opacity = "0";
        dot.style.transition = `opacity var(--dur-fast) var(--ease-out) ${1200 + index * 40}ms`;
        window.requestAnimationFrame(() => { dot.style.opacity = "1"; });
      });
      animated.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isVisible, ref]);

  return <div ref={ref} className={className}>{children}</div>;
}

function CorrelationCard({
  title,
  firstLabel,
  firstValue,
  secondLabel,
  secondValue,
  goodWhenLower = false,
  firstCount,
  secondCount,
  minSamples = 3,
}: {
  title: string;
  firstLabel: string;
  firstValue: number | null;
  secondLabel: string;
  secondValue: number | null;
  goodWhenLower?: boolean;
  firstCount: number;
  secondCount: number;
  minSamples?: number;
}) {
  const difference = firstValue != null && secondValue != null ? firstValue - secondValue : null;
  const good = difference == null ? false : goodWhenLower ? difference < 0 : difference > 0;
  const ready = firstCount > 0 && secondCount > 0;
  const hasSmallSample = ready && (firstCount < minSamples || secondCount < minSamples);
  const maxVal = Math.max(Math.abs(firstValue ?? 0), Math.abs(secondValue ?? 0));
  const pctFirst = maxVal > 0 ? (Math.abs(firstValue ?? 0) / maxVal) * 100 : 0;
  const pctSecond = maxVal > 0 ? (Math.abs(secondValue ?? 0) / maxVal) * 100 : 0;
  return (
    <div className="border-l-2 border-[hsl(var(--copper))] bg-[#111111] p-5 sm:p-6">
      <h3 className="font-serif text-[20px] tracking-[0.12em] text-foreground bebas">{title}</h3>
      {!ready ? (
        <p className="mt-4 font-sans text-[14px] leading-relaxed text-muted-foreground">
          Dati insufficienti per il confronto. Disponibili: {firstCount} / {secondCount}.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <div className="font-mono text-[32px] leading-none text-foreground">{display(firstValue)}</div>
            <div className="mt-2 text-[12px] leading-snug text-muted-foreground">{firstLabel}</div>
          </div>
          <div>
            <div className="font-mono text-[32px] leading-none text-foreground">{display(secondValue)}</div>
            <div className="mt-2 text-[12px] leading-snug text-muted-foreground">{secondLabel}</div>
          </div>
          <div className="col-span-2 mt-3 flex flex-col gap-1" aria-label="Confronto proporzionale">
            <div className="h-1.5 bg-primary transition-all" style={{ width: `${pctFirst}%` }} />
            <div className="h-1.5 bg-iron transition-all" style={{ width: `${pctSecond}%` }} />
          </div>
          {difference != null && (
            <div className={`col-span-2 text-[12px] font-mono uppercase tracking-wider ${good ? "text-[hsl(var(--acid))]" : "text-primary"}`}>
              Differenza {difference > 0 ? "+" : ""}{difference.toFixed(1)}
            </div>
          )}
          {hasSmallSample && (
            <div className="col-span-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Campione ridotto · {firstCount} / {secondCount} valori
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PERIODS = [
  { id: 7, label: "7G" },
  { id: 30, label: "30G" },
  { id: 90, label: "90G" },
  { id: 0, label: "TUTTO" },
] as const;

export default function Statistiche() {
  const { data: entries, isLoading, isError } = useListEntries();
  const [period, setPeriod] = useState<number>(30);

  const data = useMemo(() => {
    const all = [...(entries ?? [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    // One period-filtered dataset drives every period-scoped chart.
    const recent = period === 0
      ? all
      : all.filter((entry) => entry.data >= format(subDays(new Date(), period - 1), "yyyy-MM-dd"));
    const tracked = recent.filter((entry) =>
      entry.kcal != null ||
      entry.pasti != null ||
      entry.alcol != null ||
      entry.acqua != null ||
      entry.acquaAllenamento != null ||
      entry.tipoAllenamento != null ||
      entry.durata != null ||
      entry.intensita != null ||
      entry.tipoGiorno != null ||
      entry.routineCompletata != null ||
      entry.routineForza != null ||
      entry.routineFlessioni != null ||
      entry.routineTrazioni != null ||
      entry.routineSquat != null ||
      entry.plank != null ||
      entry.collo != null ||
      entry.mobilita != null ||
      entry.sollevamentoGamba != null ||
      entry.grapplingVuoto != null ||
      entry.energia != null ||
      entry.noteAllenamento != null
    );
    const streak = routineStats(all);
    const firstWeight = recent.find((entry) => entry.peso != null)?.peso ?? null;
    const lastWeight = [...recent].reverse().find((entry) => entry.peso != null)?.peso ?? null;
    const body = recent.map((entry) => ({
      ...entry,
      label: format(parseISO(entry.data), "d MMM", { locale: it }),
      peso: entry.peso ?? undefined,
    }));
    const recovery = recent.map((entry) => ({
      ...entry,
      label: format(parseISO(entry.data), "d MMM", { locale: it }),
      battito: entry.battito ?? undefined,
      sonno: entry.sonno ?? undefined,
    }));
    const force = recent.map((entry) => ({
      ...entry,
      label: String(entry.numero),
      flessioni: parseReps(entry.routineFlessioni) ?? undefined,
      plank: entry.plank ?? undefined,
      mobilita: liftLevel(entry.sollevamentoGamba) ?? undefined,
    }));
    const sessions = recent.filter((entry) => entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO").length;
    const totalSessions = all.filter((entry) => entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO").length;
    const currentDay = all.length ? Math.max(...all.map((entry) => entry.numero)) : 0;
    const withTraining = recent.filter((entry) => entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");
    const withoutTraining = recent.filter((entry) => !entry.tipoAllenamento || entry.tipoAllenamento === "NESSUNO");
    const goodSleep = recent.filter((entry) => entry.sonno != null && entry.sonno >= 6);
    const poorSleep = recent.filter((entry) => entry.sonno != null && entry.sonno < 6);
    const hydrationEntries = recent.filter((entry) => waterLiters(entry) != null);
    const hydration = hydrationEntries.map((entry) => ({
      label: format(parseISO(entry.data), "d MMM", { locale: it }),
      acqua: waterLiters(entry) ?? undefined,
      target: hydrationTarget(entry),
      acquaAllenamento: entry.acquaAllenamento ?? undefined,
    }));
    const hydrated = hydrationEntries.filter((entry) => (waterLiters(entry) ?? 0) >= hydrationTarget(entry));
    const underHydrated = hydrationEntries.filter((entry) => (waterLiters(entry) ?? 0) < hydrationTarget(entry));
    return {
      all, recent, tracked, body, recovery, force, hydration, streak, sessions, totalSessions, currentDay,
      hydrationSummary: {
        average: average(hydrationEntries, waterLiters),
        target: average(hydrationEntries, hydrationTarget),
        met: hydrated.length,
        count: hydrationEntries.length,
      },
      weightLost: firstWeight != null && lastWeight != null ? firstWeight - lastWeight : null,
      trainingPulse: [metricStats(withTraining, (entry) => entry.battito), metricStats(withoutTraining, (entry) => entry.battito)] as const,
      sleepWeight: [metricStats(goodSleep, (entry) => entry.peso), metricStats(poorSleep, (entry) => entry.peso)] as const,
      waterEnergy: [metricStats(hydrated, (entry) => entry.energia), metricStats(underHydrated, (entry) => entry.energia)] as const,
      waterSleep: [metricStats(hydrated, (entry) => entry.sonno), metricStats(underHydrated, (entry) => entry.sonno)] as const,
      waterLoad: [metricStats(hydrated, trainingLoad), metricStats(underHydrated, trainingLoad)] as const,
      weeklyLoad: buildWeeklyLoad(recent),
    };
  }, [entries, period]);

  if (isLoading) return <div className="min-h-screen pt-24 flex items-center justify-center text-[12px] uppercase tracking-widest text-muted-foreground">Caricamento...</div>;
  if (isError) return <><DataErrorState /><SiteFooter /></>;

  const today = new Date();
  const startMonth = new Date("2026-05-01T00:00:00");
  const lastDate = data.all.length ? parseISO(data.all[data.all.length - 1].data) : today;
  const endDate = isAfter(lastDate, today) ? lastDate : today;
  const months: Date[] = [];
  for (let cursor = new Date(startMonth); !isAfter(cursor, endDate); cursor.setMonth(cursor.getMonth() + 1)) months.push(new Date(cursor));
  const byDate = new Map(data.all.map((entry) => [entry.data, entry]));
  const lastWeightIndex = data.body.reduce(
    (lastIndex, entry, index) => (entry.peso != null ? index : lastIndex),
    -1,
  );
  const heroStats = [
    { label: "GIORNI COMPLETATI", value: data.currentDay, caption: "giorno corrente" },
    { label: "KG PERSI", value: 47, caption: "da 130 KG a 83 KG" },
    { label: "ALLENAMENTI TOTALI", value: data.totalSessions, caption: "tutto il percorso" },
    { label: "STREAK RECORD", value: data.streak.record, caption: "massimo storico" },
    { label: "STREAK ATTUALE", value: data.streak.current, caption: "giorni consecutivi" },
    { label: "PESO CAMBIATO", value: data.weightLost, caption: period === 0 ? "dal giorno 1" : `ultimi ${period} giorni` },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-5 pb-16 pt-24 sm:px-6">
      <main className="mx-auto max-w-5xl">
        <div className="relative mb-10 overflow-hidden border-b border-[rgba(245,240,232,0.12)] pb-10">
          <TerminalBackdrop intensity="medium" glow />
          <div className="relative z-10">
          <span className="page-label">DATI DEL PERCORSO</span>
          <h1 className="mt-2 font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide text-foreground bebas">STATISTICHE</h1>
          <p className="mt-5 max-w-xl font-sans text-[15px] leading-relaxed text-muted-foreground">Nessun dato arrotondato. Nessun giorno nascosto.</p>
          <div className="mt-6 inline-flex border border-border">
            {PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriod(option.id)}
                className={`min-h-10 px-4 font-mono text-[11px] tracking-[0.16em] transition-colors ${
                  period === option.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={period === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          </div>
        </div>

        <Reveal>
          <Section title="I numeri">
            <div className="relative overflow-hidden">
              <div className="stats-hero-graph" aria-hidden="true">
                <PulseTrace entries={data.all} variant="hero" />
              </div>
              <RevealGroup className="relative z-10 grid grid-cols-2 gap-3">
              {heroStats.map(({ label, value, caption }) => (
                <div key={label} className="border-l-[3px] border-primary bg-[#111111] p-4 sm:p-6">
                  {typeof value === "number" ? (
                    <AnimatedNumber
                      value={value}
                      className="font-mono text-[clamp(36px,7vw,72px)] leading-none text-foreground"
                      formatter={(number) => label === "PESO CAMBIATO"
                        ? `${number > 0 ? "−" : "+"}${Math.abs(number).toFixed(1)} KG`
                        : number.toLocaleString("it-IT")}
                    />
                  ) : (
                    <span className="font-mono text-[clamp(36px,7vw,72px)] leading-none text-foreground">—</span>
                  )}
                  <div className="mt-3 font-serif text-[14px] tracking-[0.14em] text-muted-foreground bebas sm:text-[18px]">{label}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{caption}</div>
                </div>
              ))}
              </RevealGroup>
            </div>
          </Section>
        </Reveal>
        <PulseTrace entries={data.all} variant="divider" />

        <Reveal>
          <Section title="180 giorni">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">180 GIORNI</span>
              <span className="font-mono text-[11px] text-primary">{Math.min(data.all.length, 180)} / 180</span>
            </div>
            <Grid180 completedDays={data.all.length} />
          </Section>
        </Reveal>
        <PulseTrace entries={data.all} variant="divider" />

        <Reveal>
          <Section title={period === 0 ? "Peso — tutto il percorso" : `Peso — ultimi ${period} giorni`}>
            <ChartReveal className="h-[300px] w-full">
              {data.body.some((entry) => entry.peso != null) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.body} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={COLORS.red} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#1A1A1A" strokeDasharray="2 5" />
                    <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis unit=" kg" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} kg`, "Peso"]} />
                    <Area type="monotone" dataKey="peso" fill="url(#pesoGrad)" stroke="none" connectNulls={false} />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      name="Peso kg"
                      stroke={COLORS.red}
                      strokeWidth={3}
                      dot={(props: { cx?: number; cy?: number; index?: number }) => {
                        const isLast = props.index === lastWeightIndex;
                        return (
                          <circle
                            key={`peso-dot-${props.index ?? 0}`}
                            cx={props.cx}
                            cy={props.cy}
                            r={isLast ? 5 : 3}
                            fill={COLORS.red}
                            className={isLast ? "stats-last-dot" : undefined}
                          />
                        );
                      }}
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <ChartEmpty label="Registra almeno due pesi per vedere una tendenza, senza inventare valori mancanti." />}
            </ChartReveal>
          </Section>
        </Reveal>
        <PulseTrace entries={data.all} variant="divider" />

        <Reveal>
          <Section title="Recupero">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-3 font-serif text-[15px] tracking-[0.16em] text-muted-foreground bebas">SONNO · ORE</div>
                <ChartReveal className="h-[230px]">
                  {data.recovery.some((entry) => entry.sonno != null) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.recovery} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#1A1A1A" strokeDasharray="2 5" />
                        <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 12]} tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} h`, "Sonno"]} />
                        <Bar dataKey="sonno" name="Sonno" fill={COLORS.copper} animationDuration={1200} animationBegin={200} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <ChartEmpty label="Nessun dato sonno nel periodo selezionato." />}
                </ChartReveal>
              </div>
              <div>
                <div className="mb-3 font-serif text-[15px] tracking-[0.16em] text-muted-foreground bebas">BATTITO · BPM</div>
                <ChartReveal className="h-[230px]">
                  {data.recovery.some((entry) => entry.battito != null) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.recovery} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="battitoGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={COLORS.ink} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={COLORS.ink} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#1A1A1A" strokeDasharray="2 5" />
                        <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis unit=" bpm" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} bpm`, "Battito"]} />
                        <Area type="monotone" dataKey="battito" fill="url(#battitoGrad)" stroke="none" connectNulls={false} />
                        <Line type="monotone" dataKey="battito" name="Battito" stroke={COLORS.ink} strokeWidth={3} dot={{ r: 3, fill: COLORS.ink }} connectNulls={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : <ChartEmpty label="Nessun dato battito nel periodo selezionato." />}
                </ChartReveal>
              </div>
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">Metriche separate: ogni grafico ha una sola unità di misura.</p>
          </Section>
        </Reveal>
        <PulseTrace entries={data.all} variant="divider" />

        <Reveal>
          <Section title="Idratazione">
            {data.hydration.length > 0 ? (
              <>
              <div className="mb-6 grid grid-cols-3 gap-2">
                <div className="border-l-2 border-[#00A8A8] bg-[#111111] p-3 sm:p-4">
                  <div className="font-mono text-[24px] text-foreground">{display(data.hydrationSummary.average, " L")}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">media registrata</div>
                </div>
                <div className="border-l-2 border-[#00A8A8] bg-[#111111] p-3 sm:p-4">
                  <div className="font-mono text-[24px] text-foreground">{display(data.hydrationSummary.target, " L")}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">obiettivo dinamico</div>
                </div>
                <div className="border-l-2 border-[#00A8A8] bg-[#111111] p-3 sm:p-4">
                  <div className="font-mono text-[24px] text-foreground">{data.hydrationSummary.met}/{data.hydrationSummary.count}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">giorni in target</div>
                </div>
              </div>
              <ChartReveal className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.hydration} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#1A1A1A" strokeDasharray="2 5" />
                    <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis unit=" L" domain={[0, "auto"]} tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value} L`, name === "acqua" ? "Totale" : name === "target" ? "Target" : "Durante allenamento"]} />
                    <Legend wrapperStyle={{ color: COLORS.gray, fontSize: 10, textTransform: "uppercase" }} />
                    <Bar dataKey="acqua" name="acqua" fill="#00A8A8" />
                    <Line type="monotone" dataKey="target" name="target" stroke={COLORS.ink} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="acquaAllenamento" name="allenamento" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3, fill: COLORS.red }} connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartReveal>
              <p className="mt-4 text-[11px] leading-relaxed uppercase tracking-widest text-muted-foreground">Il totale in litri guida grafico e correlazioni. Target base 2 L + fino a 0,5 L con allenamento.</p>
              </>
            ) : (
              <ChartEmpty label="Nessun dato acqua nel periodo selezionato. Compila i litri dal tracking giornaliero per attivare grafico e correlazioni." />
            )}
          </Section>
        </Reveal>
        <PulseTrace entries={data.all} variant="divider" />

        <Reveal>
          <Section title="Progressione forza">
            <ChartReveal className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.force} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#1A1A1A" strokeDasharray="2 5" />
                  <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="flessioni" name="Flessioni" stroke={COLORS.red} strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="plank" name="Plank sec" stroke={COLORS.copper} strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="mobilita" name="Mobilità gamba" stroke={COLORS.ink} strokeWidth={2} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartReveal>
          </Section>
        </Reveal>
        <PulseTrace entries={data.all} variant="divider" />

        {data.weeklyLoad.length > 0 && (
          <>
            <Reveal>
              <Section title="Carico settimanale">
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklyLoad} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#1A1A1A" strokeDasharray="2 5" />
                      <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name === "load" ? "Carico (min × int)" : "Minuti"]} />
                      <Bar dataKey="load" name="Carico" fill={COLORS.red} />
                      <Bar dataKey="minuti" name="Minuti" fill={COLORS.copper} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">Carico = minuti × intensità, per settimana</p>
              </Section>
            </Reveal>
            <PulseTrace entries={data.all} variant="divider" />
          </>
        )}

        {data.recent.length >= 3 && (
          <>
            <Reveal>
              <Section title="Correlazioni">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CorrelationCard
                    title="Battito × allenamento"
                    firstLabel="media con allenamento (BPM)"
                    firstValue={data.trainingPulse[0].value}
                    firstCount={data.trainingPulse[0].count}
                    secondLabel="media senza (BPM)"
                    secondValue={data.trainingPulse[1].value}
                    secondCount={data.trainingPulse[1].count}
                    goodWhenLower
                  />
                  <CorrelationCard
                    title="Peso × sonno"
                    firstLabel="peso medio con 6+ ore (kg)"
                    firstValue={data.sleepWeight[0].value}
                    firstCount={data.sleepWeight[0].count}
                    secondLabel="peso medio con meno di 6 (kg)"
                    secondValue={data.sleepWeight[1].value}
                    secondCount={data.sleepWeight[1].count}
                  />
                  <CorrelationCard
                    title="Acqua × energia"
                    firstLabel="energia con acqua in target"
                    firstValue={data.waterEnergy[0].value}
                    firstCount={data.waterEnergy[0].count}
                    secondLabel="energia sotto target"
                    secondValue={data.waterEnergy[1].value}
                    secondCount={data.waterEnergy[1].count}
                  />
                  <CorrelationCard
                    title="Acqua × sonno"
                    firstLabel="sonno con acqua in target (h)"
                    firstValue={data.waterSleep[0].value}
                    firstCount={data.waterSleep[0].count}
                    secondLabel="sonno sotto target (h)"
                    secondValue={data.waterSleep[1].value}
                    secondCount={data.waterSleep[1].count}
                  />
                  <CorrelationCard
                    title="Acqua × carico"
                    firstLabel="carico con acqua in target"
                    firstValue={data.waterLoad[0].value}
                    firstCount={data.waterLoad[0].count}
                    secondLabel="carico sotto target"
                    secondValue={data.waterLoad[1].value}
                    secondCount={data.waterLoad[1].count}
                  />
                </div>
                <p className="mt-5 text-[11px] leading-relaxed uppercase tracking-widest text-muted-foreground">Le relazioni sono confronti descrittivi, non diagnosi: ogni gruppo richiede almeno tre valori reali.</p>
              </Section>
            </Reveal>
            <PulseTrace entries={data.all} variant="divider" />
          </>
        )}

        <Reveal>
          <Section title="Registro dati">
            <div className="overflow-x-auto border border-[rgba(245,240,232,0.12)]">
              <table className="min-w-full border-collapse font-mono text-[11px] tracking-wide">
                <thead className="border-b border-[rgba(245,240,232,0.12)] text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-normal">GIORNO</th>
                    <th className="px-3 py-3 font-normal">PESO</th>
                    <th className="px-3 py-3 font-normal">SONNO</th>
                    <th className="px-3 py-3 font-normal">BPM</th>
                    <th className="px-3 py-3 font-normal">KCAL</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tracked.slice(-12).reverse().map((entry, index) => (
                    <Reveal key={entry.id} as="tr" delay={Math.min(index, 8) * 60} className="border-b border-[rgba(245,240,232,0.08)] text-foreground last:border-0">
                      <td className="px-3 py-3 text-primary">#{entry.numero}</td>
                      <td className="px-3 py-3">{display(entry.peso, " kg")}</td>
                      <td className="px-3 py-3">{display(entry.sonno, " h")}</td>
                      <td className="px-3 py-3">{display(entry.battito)}</td>
                      <td className="px-3 py-3">{display(entry.kcal, "")}</td>
                    </Reveal>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </Reveal>
        <PulseTrace entries={data.all} variant="divider" />

        <Reveal>
          <Section title="Calendario heatmap">
            <div className="flex gap-8 overflow-x-auto pb-3">
              {months.map((month) => {
                const monthKey = format(month, "yyyy-MM");
                const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                return (
                  <div key={monthKey} className="min-w-[170px]">
                    <h3 className="mb-3 font-serif text-[18px] uppercase tracking-wider text-muted-foreground bebas">{format(month, "MMMM yyyy", { locale: it })}</h3>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: days }, (_, index) => {
                        const date = `${monthKey}-${String(index + 1).padStart(2, "0")}`;
                        const entry = byDate.get(date);
                        const training = Boolean(entry?.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");
                        const routine = entry?.routineCompletata === true;
                        const alcohol = entry?.alcol === true;
                        const color = alcohol ? "bg-primary" : routine && training ? "bg-[hsl(var(--acid))]" : routine || training ? "bg-[hsl(var(--acid))]/40" : "bg-[#333333]";
                        const tooltip = entry
                          ? [
                              `Giorno ${entry.numero}`,
                              entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO" ? entry.tipoAllenamento : null,
                              entry.alcol === true ? "Alcol" : null,
                            ].filter(Boolean).join(" · ")
                          : date;
                        return <Link key={date} href={entry ? `/giorno/${entry.numero}` : "#"} title={tooltip} className={`h-5 w-5 sm:h-4 sm:w-4 ${color} ${entry ? "hover:ring-1 hover:ring-foreground" : ""}`} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}