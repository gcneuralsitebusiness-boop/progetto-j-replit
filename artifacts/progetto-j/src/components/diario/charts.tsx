import { useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { format, isAfter, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { EntryLight } from "@workspace/api-client-react";
import { hasRoutineActivity, isTraining, parseReps, pushupCount } from "@/lib/diario-analytics";
import { useReveal } from "@/lib/use-reveal";

export const COLORS = { red: "#B81D1D", ink: "#E8E4DE", grey: "#C9C4BD", line: "#1A1A1A", money: "#8B6914", dim: "#6E6A65" };
export const tooltipStyle = {
  backgroundColor: "#0A0A0A",
  border: "1px solid #B81D1D",
  color: "#E8E4DE",
  borderRadius: 0,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "13px",
  letterSpacing: "0.05em",
  padding: "8px 12px",
};
const tick = { fill: COLORS.grey, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" };
const dayLabel = (data: string) => format(parseISO(data), "d MMM", { locale: it });

export function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center border border-dashed d-line px-6 text-center">
      <p className="max-w-sm text-[14px] leading-relaxed d-muted">{label}</p>
    </div>
  );
}

type NumericAxisScale = { domain: [number, number]; ticks: number[] };

function buildAxisScale(values: number[], step: number, padding: number, preferredMinimum?: number): NumericAxisScale {
  if (values.length === 0) {
    const fallbackMax = (preferredMinimum ?? 0) + step * 2;
    return {
      domain: [preferredMinimum ?? 0, fallbackMax],
      ticks: [preferredMinimum ?? 0, preferredMinimum != null ? preferredMinimum + step : step, fallbackMax],
    };
  }
  const calculatedMinimum = Math.floor((Math.min(...values) - padding) / step) * step;
  const minimum = preferredMinimum == null ? calculatedMinimum : Math.min(preferredMinimum, calculatedMinimum);
  const maximum = Math.max(minimum + step, Math.ceil((Math.max(...values) + padding) / step) * step);
  const ticks = Array.from({ length: Math.floor((maximum - minimum) / step) + 1 }, (_, index) => Number((minimum + index * step).toFixed(2)));
  return { domain: [minimum, maximum], ticks };
}

const finite = (values: Array<number | null | undefined>) => values.filter((v): v is number => v != null && Number.isFinite(v));

export function ChartReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
        window.requestAnimationFrame(() => {
          path.style.transition = "stroke-dashoffset 1100ms cubic-bezier(.2,.8,.2,1)";
          path.style.strokeDashoffset = "0";
        });
      });
      animated.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isVisible, ref]);
  return <div ref={ref} className={className}>{children}</div>;
}

export function ChartTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="d-title text-[22px] tracking-[0.12em]">{children}</h3>
      {note && <span className="d-label">{note}</span>}
    </div>
  );
}

/* ── CORPO ─────────────────────────────────────────── */
export function WeightChart({ entries }: { entries: EntryLight[] }) {
  const body = entries.map((e) => ({ label: dayLabel(e.data), peso: e.peso ?? undefined }));
  const scale = buildAxisScale(finite(body.map((e) => e.peso)), 5, 1, 75);
  const lastWeightIndex = body.reduce((last, e, i) => (e.peso != null ? i : last), -1);
  return (
    <ChartReveal className="h-[300px] w-full" >
      {body.some((e) => e.peso != null) ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={body} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="diarioPesoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={COLORS.line} strokeDasharray="2 5" />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis unit=" kg" width={64} domain={scale.domain} ticks={scale.ticks} tick={tick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} kg`, "Peso"]} />
            <Area type="monotone" dataKey="peso" fill="url(#diarioPesoGrad)" stroke="none" connectNulls={false} />
            <Line
              type="monotone" dataKey="peso" name="Peso kg" stroke={COLORS.red} strokeWidth={3} connectNulls={false}
              dot={(props: { cx?: number; cy?: number; index?: number }) => (
                <circle key={`peso-dot-${props.index ?? 0}`} cx={props.cx} cy={props.cy} r={props.index === lastWeightIndex ? 5 : 3} fill={COLORS.red} />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : <ChartEmpty label="Nessun peso registrato nel periodo. Nessun valore inventato." />}
    </ChartReveal>
  );
}

/* ── SOLDI ─────────────────────────────────────────── */
export type MoneyMonth = { month: string; label: string; entrate: number | null; uscite: number | null; saldo: number | null };
const euro = (v: number) => `${v.toLocaleString("it-IT", { maximumFractionDigits: 2 })} €`;

export function MoneyChart({ months }: { months: MoneyMonth[] }) {
  const data = months.map((m) => ({ label: m.label, entrate: m.entrate ?? undefined, uscite: m.uscite ?? undefined, saldo: m.saldo ?? undefined }));
  const has = data.some((m) => m.entrate != null || m.uscite != null);
  return (
    <ChartReveal className="h-[300px] w-full">
      {has ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={COLORS.line} strokeDasharray="2 5" />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
            <YAxis width={72} tick={tick} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v.toLocaleString("it-IT")} €`} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(139,105,20,0.08)" }}
              formatter={(value: number, name: string) => [euro(Number(value)), name === "entrate" ? "Entrate" : name === "uscite" ? "Uscite" : "Saldo"]}
            />
            <Bar dataKey="entrate" name="entrate" fill="var(--money)" maxBarSize={32} />
            <Bar dataKey="uscite" name="uscite" fill="var(--money)" fillOpacity={0.4} maxBarSize={32} />
            <Line type="monotone" dataKey="saldo" name="saldo" stroke={COLORS.ink} strokeWidth={2} dot={{ r: 4, fill: COLORS.ink, strokeWidth: 0 }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : <ChartEmpty label="Nessuna entrata o uscita registrata nel periodo." />}
    </ChartReveal>
  );
}

/* ── RECUPERO ──────────────────────────────────────── */
export function SleepChart({ entries }: { entries: EntryLight[] }) {
  const data = entries.map((e) => ({ label: dayLabel(e.data), sonno: e.sonno ?? undefined }));
  return (
    <ChartReveal className="h-[240px]">
      {data.some((e) => e.sonno != null) ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={COLORS.line} strokeDasharray="2 5" />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis width={40} domain={[0, (maximum: number) => Math.max(12, maximum)]} tick={tick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(232,228,222,0.04)" }} formatter={(value: number) => [`${value} h`, "Sonno"]} />
            <Bar dataKey="sonno" name="Sonno" fill={COLORS.grey} animationDuration={1200} animationBegin={200} />
          </BarChart>
        </ResponsiveContainer>
      ) : <ChartEmpty label="Nessun dato sonno nel periodo selezionato." />}
    </ChartReveal>
  );
}

export function PulseChart({ entries }: { entries: EntryLight[] }) {
  const data = entries.map((e) => ({ label: dayLabel(e.data), battito: e.battito ?? undefined }));
  const scale = buildAxisScale(finite(data.map((e) => e.battito)), 10, 5);
  return (
    <ChartReveal className="h-[240px]">
      {data.some((e) => e.battito != null) ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="diarioBattitoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLORS.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={COLORS.line} strokeDasharray="2 5" />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis unit=" bpm" width={76} domain={scale.domain} ticks={scale.ticks} tick={tick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} bpm`, "Battito"]} />
            <Area type="monotone" dataKey="battito" fill="url(#diarioBattitoGrad)" stroke="none" connectNulls={false} />
            <Line type="monotone" dataKey="battito" name="Battito" stroke={COLORS.red} strokeWidth={3} dot={{ r: 3, fill: COLORS.red }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : <ChartEmpty label="Nessun dato battito nel periodo selezionato." />}
    </ChartReveal>
  );
}

/* ── FORZA ─────────────────────────────────────────── */
type ForceMetricKey = "flessioni" | "trazioni" | "squat" | "plank" | "mobilita";
type ForcePoint = { label: string } & Partial<Record<ForceMetricKey, number>>;

const FORCE_METRICS: Array<{ key: ForceMetricKey; title: string; unit: string; color: string; step: number; padding: number }> = [
  { key: "flessioni", title: "Flessioni", unit: "ripetizioni", color: COLORS.red, step: 10, padding: 2 },
  { key: "trazioni", title: "Trazioni", unit: "ripetizioni", color: COLORS.ink, step: 5, padding: 1 },
  { key: "squat", title: "Squat", unit: "ripetizioni", color: COLORS.grey, step: 10, padding: 2 },
  { key: "plank", title: "Plank", unit: "secondi", color: COLORS.red, step: 30, padding: 5 },
  { key: "mobilita", title: "Mobilità gamba", unit: "livello", color: COLORS.ink, step: 1, padding: 0.25 },
];

function liftLevel(value: string | null | undefined): number | null {
  if (!value) return null;
  return ({ ANCA: 1, PETTO: 2, TESTA: 3, OLTRE: 4 } as Record<string, number>)[value] ?? null;
}

function ForceMetricChart({ metric, points }: { metric: (typeof FORCE_METRICS)[number]; points: ForcePoint[] }) {
  const metricPoints = points.filter((p) => p[metric.key] != null);
  const scale = buildAxisScale(finite(metricPoints.map((p) => p[metric.key])), metric.step, metric.padding);
  return (
    <div className="border d-line bg-[#0F0F0F] p-4" data-testid={`chart-forza-${metric.key}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h4 className="d-title text-[20px] tracking-[0.12em]">{metric.title}</h4>
        <span className="d-label">{metricPoints.length} {metricPoints.length === 1 ? "valore" : "valori"}</span>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metricPoints} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={COLORS.line} strokeDasharray="2 5" />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
            <YAxis width={44} domain={scale.domain} ticks={scale.ticks} tick={tick} tickLine={false} axisLine={false} tickFormatter={(v: number) => String(v)} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Giorno ${l}`} formatter={(value: number) => [`${value} ${metric.unit}`, metric.title]} />
            <Line type="monotone" dataKey={metric.key} name={metric.title} stroke={metric.color} strokeWidth={2} dot={{ r: 4, fill: metric.color, strokeWidth: 0 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ForceCharts({ entries }: { entries: EntryLight[] }) {
  const force: ForcePoint[] = entries.map((e) => ({
    label: String(e.numero),
    flessioni: pushupCount(e) ?? undefined,
    trazioni: parseReps(e.routineTrazioni) ?? undefined,
    squat: parseReps(e.routineSquat) ?? undefined,
    plank: e.plank ?? undefined,
    mobilita: liftLevel(e.sollevamentoGamba) ?? undefined,
  }));
  const metrics = FORCE_METRICS.filter((m) => force.some((p) => p[m.key] != null));
  if (!metrics.length) return <ChartEmpty label="Nessun dato di forza nel periodo selezionato." />;
  return (
    <ChartReveal className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {metrics.map((m) => <ForceMetricChart key={m.key} metric={m} points={force} />)}
    </ChartReveal>
  );
}

export function WeeklyLoadChart({ weeks }: { weeks: Array<{ label: string; load: number | null; minuti: number }> }) {
  if (!weeks.length) return <ChartEmpty label="Nessun allenamento con durata nel periodo selezionato." />;
  const data = weeks.map((w) => ({ ...w, load: w.load ?? undefined }));
  return (
    <div className="h-[260px] w-full" data-testid="chart-carico-settimanale">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={COLORS.line} strokeDasharray="2 5" />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
          <YAxis yAxisId="load" width={52} tick={tick} tickLine={false} axisLine={false} />
          <YAxis yAxisId="minutes" orientation="right" width={48} tick={tick} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(232,228,222,0.04)" }} formatter={(value: number, name: string) => [value, name === "load" ? "Carico (min × int)" : "Minuti"]} />
          <Bar yAxisId="load" dataKey="load" name="load" fill={COLORS.red} />
          <Bar yAxisId="minutes" dataKey="minuti" name="minuti" fill={COLORS.dim} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── CALENDARIO ────────────────────────────────────── */
export function CalendarHeatmap({ entries, today }: { entries: EntryLight[]; today: string }) {
  const startMonth = new Date("2026-05-01T00:00:00");
  const sorted = [...entries].sort((a, b) => a.data.localeCompare(b.data));
  const todayDate = parseISO(today);
  const lastDate = sorted.length ? parseISO(sorted[sorted.length - 1].data) : todayDate;
  const endDate = isAfter(lastDate, todayDate) ? lastDate : todayDate;
  const months: Date[] = [];
  for (let c = new Date(startMonth); !isAfter(c, endDate); c.setMonth(c.getMonth() + 1)) months.push(new Date(c));
  const byDate = new Map(entries.map((e) => [e.data, e]));
  return (
    <div>
      <div className="flex gap-8 overflow-x-auto pb-3">
        {months.map((month) => {
          const monthKey = format(month, "yyyy-MM");
          const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
          return (
            <div key={monthKey} className="min-w-[200px]">
              <h3 className="d-title mb-3 text-[20px] uppercase tracking-wider d-muted">{format(month, "MMMM", { locale: it })} <span className="d-mono">{format(month, "yyyy")}</span></h3>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: days }, (_, i) => {
                  const date = `${monthKey}-${String(i + 1).padStart(2, "0")}`;
                  const entry = byDate.get(date);
                  const training = entry ? isTraining(entry) : false;
                  const routine = entry ? hasRoutineActivity(entry) : false;
                  const bg = routine && training ? COLORS.red : routine || training ? "rgba(184,29,29,0.45)" : entry ? "#2A2A2A" : "transparent";
                  const title = entry ? [`Giorno ${entry.numero}`, training ? entry.tipoAllenamento || "Allenamento" : null, routine ? "Routine" : null, entry.alcol === true ? "Alcol" : null].filter(Boolean).join(" · ") : date;
                  const style = { background: entry?.alcol === true ? "repeating-linear-gradient(45deg, #B81D1D 0 3px, #0A0A0A 3px 5px)" : bg, border: entry ? "none" : `1px solid ${COLORS.line}` };
                  return entry
                    ? <Link key={date} href={`/giorno/${entry.numero}`} title={title} aria-label={title} className="block h-6 w-6 hover:outline hover:outline-1 hover:outline-[#E8E4DE]" style={style} />
                    : <span key={date} title={title} className="block h-6 w-6" style={style} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-5 d-label">
        <span className="flex items-center gap-2"><span className="inline-block h-[13px] w-[13px]" style={{ background: COLORS.red }} />ALLENAMENTO + ROUTINE</span>
        <span className="flex items-center gap-2"><span className="inline-block h-[13px] w-[13px]" style={{ background: "rgba(184,29,29,0.45)" }} />UNO DEI DUE</span>
        <span className="flex items-center gap-2"><span className="inline-block h-[13px] w-[13px]" style={{ background: "#2A2A2A" }} />DOCUMENTATO</span>
        <span className="flex items-center gap-2"><span className="inline-block h-[13px] w-[13px]" style={{ background: "repeating-linear-gradient(45deg, #B81D1D 0 3px, #0A0A0A 3px 5px)" }} />ALCOL</span>
      </div>
    </div>
  );
}
