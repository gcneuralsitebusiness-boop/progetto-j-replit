import { useMemo } from "react";
import { Link } from "wouter";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, isAfter, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useListEntries } from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { DataErrorState } from "@/components/DataErrorState";
import { SiteFooter } from "@/components/SiteFooter";

const COLORS = { red: "#B81D1D", copper: "#B87333", acid: "#00FF41", ink: "#E8E4DE", gray: "#6E6A65" };
const tooltipStyle = { backgroundColor: "#111111", border: `1px solid ${COLORS.gray}`, color: COLORS.ink, borderRadius: 0 };

function average(entries: Entry[], selector: (entry: Entry) => number | null | undefined): number | null {
  const values = entries.map(selector).filter((value): value is number => value != null && Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function display(value: number | null, suffix = "", decimals = 1) {
  return value == null ? "—" : `${value.toLocaleString("it-IT", { maximumFractionDigits: decimals })}${suffix}`;
}

function routineStats(entries: Entry[]) {
  const sorted = [...entries].sort((a, b) => a.numero - b.numero);
  let current = 0;
  let record = 0;
  let run = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].routineCompletata === true) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-iron py-10">
      <h2 className="mb-6 font-serif text-[28px] tracking-[0.22em] text-foreground bebas uppercase">{title}</h2>
      {children}
    </section>
  );
}

function CorrelationCard({
  title,
  firstLabel,
  firstValue,
  secondLabel,
  secondValue,
  goodWhenLower = false,
  ready,
  remaining,
}: {
  title: string;
  firstLabel: string;
  firstValue: number | null;
  secondLabel: string;
  secondValue: number | null;
  goodWhenLower?: boolean;
  ready: boolean;
  remaining: number;
}) {
  const difference = firstValue != null && secondValue != null ? firstValue - secondValue : null;
  const good = difference == null ? false : goodWhenLower ? difference < 0 : difference > 0;
  return (
    <div className="border-l-2 border-[hsl(var(--copper))] bg-[#111111] p-5 sm:p-6">
      <h3 className="font-serif text-[20px] tracking-[0.12em] text-foreground bebas">{title}</h3>
      {!ready ? (
        <p className="mt-4 font-sans text-[14px] text-muted-foreground">Servono più dati — {remaining} giorni rimasti</p>
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
          {difference != null && (
            <div className={`col-span-2 text-[12px] font-mono uppercase tracking-wider ${good ? "text-[hsl(var(--acid))]" : "text-primary"}`}>
              Differenza {difference > 0 ? "+" : ""}{difference.toFixed(1)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Statistiche() {
  const { data: entries, isLoading, isError } = useListEntries();

  const data = useMemo(() => {
    const all = [...(entries ?? [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const recent30 = all.slice(-30);
    const recent60 = all.slice(-60);
    const tracked = all.filter((entry) =>
      entry.kcal != null ||
      entry.pasti != null ||
      entry.alcol != null ||
      entry.acqua != null ||
      entry.tipoAllenamento != null ||
      entry.durata != null ||
      entry.intensita != null ||
      entry.tipoGiorno != null ||
      entry.routineCompletata != null ||
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
    const firstWeight = all.find((entry) => entry.peso != null)?.peso ?? null;
    const lastWeight = [...all].reverse().find((entry) => entry.peso != null)?.peso ?? null;
    const body = recent30.map((entry) => ({
      ...entry,
      label: format(parseISO(entry.data), "d MMM", { locale: it }),
      peso: entry.peso ?? undefined,
      battito: entry.battito ?? undefined,
      sonno: entry.sonno ?? undefined,
    }));
    const force = recent60.map((entry) => ({
      ...entry,
      label: String(entry.numero),
      flessioni: parseReps(entry.routineFlessioni) ?? undefined,
      plank: entry.plank ?? undefined,
      mobilita: liftLevel(entry.sollevamentoGamba) ?? undefined,
    }));
    const sessions = all.filter((entry) => entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO").length;
    const withTraining = all.filter((entry) => entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO");
    const withoutTraining = all.filter((entry) => !entry.tipoAllenamento || entry.tipoAllenamento === "NESSUNO");
    const goodSleep = all.filter((entry) => entry.sonno != null && entry.sonno >= 6);
    const poorSleep = all.filter((entry) => entry.sonno != null && entry.sonno < 6);
    const highKcalWeights: number[] = [];
    const lowKcalWeights: number[] = [];
    all.forEach((entry, index) => {
      const delayed = all[index + 3]?.peso;
      if (delayed == null || entry.kcal == null) return;
      if (entry.kcal > 2500) highKcalWeights.push(delayed);
      if (entry.kcal < 2000) lowKcalWeights.push(delayed);
    });
    return {
      all, tracked, body, force, streak, sessions,
      weightLost: firstWeight != null && lastWeight != null ? firstWeight - lastWeight : null,
      trainingPulse: [average(withTraining, (entry) => entry.battito), average(withoutTraining, (entry) => entry.battito)] as const,
      sleepWeight: [average(goodSleep, (entry) => entry.peso), average(poorSleep, (entry) => entry.peso)] as const,
      sleepEnergy: [average(goodSleep, (entry) => entry.energia), average(poorSleep, (entry) => entry.energia)] as const,
      kcalWeight: [highKcalWeights.length ? highKcalWeights.reduce((a, b) => a + b, 0) / highKcalWeights.length : null, lowKcalWeights.length ? lowKcalWeights.reduce((a, b) => a + b, 0) / lowKcalWeights.length : null] as const,
    };
  }, [entries]);

  if (isLoading) return <div className="min-h-screen pt-24 flex items-center justify-center text-[12px] uppercase tracking-widest text-muted-foreground">Caricamento...</div>;
  if (isError) return <><DataErrorState /><SiteFooter /></>;

  const ready = data.tracked.length >= 14;
  const today = new Date();
  const startMonth = new Date("2026-05-01T00:00:00");
  const lastDate = data.all.length ? parseISO(data.all[data.all.length - 1].data) : today;
  const endDate = isAfter(lastDate, today) ? lastDate : today;
  const months: Date[] = [];
  for (let cursor = new Date(startMonth); !isAfter(cursor, endDate); cursor.setMonth(cursor.getMonth() + 1)) months.push(new Date(cursor));
  const byDate = new Map(data.all.map((entry) => [entry.data, entry]));

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-5 pb-16 pt-24 sm:px-6">
      <main className="mx-auto max-w-5xl">
        <div className="mb-10">
          <span className="page-label">DATI DEL PERCORSO</span>
          <h1 className="mt-2 font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide text-foreground bebas">STATISTICHE</h1>
          <p className="mt-5 max-w-xl font-sans text-[15px] leading-relaxed text-muted-foreground">Allenamento, routine e recupero misurati nel tempo.</p>
        </div>

        <Section title="Hero stats">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["STREAK ATTUALE", data.streak.current, "giorni consecutivi"],
              ["STREAK RECORD", data.streak.record, "massimo storico"],
              ["SESSIONI TOTALI", data.sessions, "allenamenti"],
              ["PESO PERSO", data.weightLost, "dal giorno 1"],
            ].map(([label, value, caption]) => (
              <div key={String(label)} className="border-l-[3px] border-primary bg-[#111111] p-4 sm:p-6">
                <div className="font-mono text-[clamp(36px,7vw,72px)] leading-none text-foreground">{typeof value === "number" && label === "PESO PERSO" ? `${value > 0 ? "−" : "+"}${Math.abs(value).toFixed(1)} KG` : value}</div>
                <div className="mt-3 font-serif text-[14px] tracking-[0.14em] text-muted-foreground bebas sm:text-[18px]">{label}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{caption}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Grafico corpo — ultimi 30 giorni">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.body} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#333" strokeDasharray="2 5" />
                <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line yAxisId="left" type="monotone" dataKey="peso" name="Peso kg" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3, fill: COLORS.red }} connectNulls={false} />
                <Line yAxisId="right" type="monotone" dataKey="battito" name="Battito bpm" stroke={COLORS.copper} strokeWidth={2} dot={{ r: 3, fill: "#111111", stroke: COLORS.copper }} connectNulls={false} />
                <Area yAxisId="left" type="monotone" dataKey="sonno" name="Sonno h" stroke={COLORS.gray} fill={COLORS.gray} fillOpacity={0.12} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="text-[hsl(var(--acid))]">● allenamento</span><span>● nessun allenamento</span><span className="text-primary">● alcol</span>
          </div>
        </Section>

        <Section title="Progressione forza">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.force} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#333" strokeDasharray="2 5" />
                <XAxis dataKey="label" tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="flessioni" name="Flessioni" stroke={COLORS.red} strokeWidth={2} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="plank" name="Plank sec" stroke={COLORS.copper} strokeWidth={2} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="mobilita" name="Mobilità gamba" stroke={COLORS.ink} strokeWidth={2} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Correlazioni">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CorrelationCard title="Battito × allenamento" firstLabel="media con allenamento (BPM)" firstValue={data.trainingPulse[0]} secondLabel="media senza (BPM)" secondValue={data.trainingPulse[1]} goodWhenLower ready={ready} remaining={Math.max(0, 14 - data.tracked.length)} />
            <CorrelationCard title="Peso × sonno" firstLabel="peso medio con 6+ ore (kg)" firstValue={data.sleepWeight[0]} secondLabel="peso medio con meno di 6 (kg)" secondValue={data.sleepWeight[1]} ready={ready} remaining={Math.max(0, 14 - data.tracked.length)} />
            <CorrelationCard title="Energia × sonno" firstLabel="energia media con 6+ ore" firstValue={data.sleepEnergy[0]} secondLabel="energia media con meno di 6" secondValue={data.sleepEnergy[1]} ready={ready} remaining={Math.max(0, 14 - data.tracked.length)} />
            <CorrelationCard title="Kcal × peso — ritardo 3 giorni" firstLabel="peso dopo giornate sopra 2500 kcal" firstValue={data.kcalWeight[0]} secondLabel="peso dopo giornate sotto 2000 kcal" secondValue={data.kcalWeight[1]} ready={ready} remaining={Math.max(0, 14 - data.tracked.length)} />
          </div>
        </Section>

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
                      return <Link key={date} href={entry ? `/giorno/${entry.numero}` : "#"} title={entry ? `Giorno ${entry.numero}` : date} className={`h-4 w-4 ${color} ${entry ? "hover:ring-1 hover:ring-foreground" : ""}`} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}