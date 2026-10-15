import type { EntryLight } from "@workspace/api-client-react";

export type DiaryEntry = EntryLight;
const DAY_MS = 86_400_000;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function romeDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(now);
}

function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function mondayOf(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return shiftDate(date, weekday === 0 ? -6 : 1 - weekday);
}

/** Extracted from the existing statistics page; retains its routine notation. */
export function parseReps(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const sets = [...value.matchAll(/(\d+)\s*[x×]\s*(\d+)/gi)];
  if (sets.length) return sets.reduce((sum, match) => sum + Number(match[1]) * Number(match[2]), 0);
  const simple = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(simple) && simple > 0 ? simple : null;
}

export function pushupCount(entry: DiaryEntry): number | null {
  return finite(entry.flessioni) ? entry.flessioni : parseReps(entry.routineFlessioni);
}

export function isTraining(entry: DiaryEntry): boolean {
  const type = entry.tipoAllenamento?.trim().toUpperCase();
  const rest = ["NESSUNO", "RIPOSO", "REST", "REST DAY", "RECUPERO", "OFF"];
  return (finite(entry.durata) && entry.durata > 0) || Boolean(type && !rest.includes(type));
}

export function hasRoutineActivity(entry: DiaryEntry): boolean {
  return [entry.routineCompletata, entry.routineForza, entry.collo, entry.mobilita, entry.grapplingVuoto]
    .some((value) => value === true);
}

export function periodEntries(entries: DiaryEntry[], period: number, today = romeDate()): DiaryEntry[] {
  const start = period > 0 ? shiftDate(today, -(period - 1)) : null;
  return entries.filter((entry) => !start || (entry.data >= start && entry.data <= today))
    .sort((a, b) => a.data.localeCompare(b.data) || a.numero - b.numero);
}

function sum(entries: DiaryEntry[], selector: (entry: DiaryEntry) => number | null | undefined): number | null {
  const values = entries.map(selector).filter(finite);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function mean(entries: DiaryEntry[], selector: (entry: DiaryEntry) => number | null | undefined): number | null {
  const values = entries.map(selector).filter(finite);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function sessions(entries: DiaryEntry[]): number | null {
  const known = entries.some((entry) => finite(entry.durata) || Boolean(entry.tipoAllenamento?.trim()));
  return known ? entries.filter(isTraining).length : null;
}

export function totalsFor(entries: DiaryEntry[]) {
  const minutes = sum(entries, (entry) => entry.durata);
  return [
    { key: "giorni", label: "Giorni documentati", value: entries.length, decimals: 0 },
    { key: "allenamenti", label: "Allenamenti", value: sessions(entries), decimals: 0 },
    { key: "ore", label: "Ore di allenamento", value: minutes == null ? null : minutes / 60, decimals: 1 },
    { key: "km", label: "Km", value: sum(entries, (entry) => entry.km), decimals: 1 },
    { key: "flessioni", label: "Flessioni", value: sum(entries, pushupCount), decimals: 0 },
    { key: "addominali", label: "Addominali", value: sum(entries, (entry) => entry.addominali), decimals: 0 },
    { key: "round", label: "Round", value: sum(entries, (entry) => entry.round), decimals: 0 },
    { key: "kcal", label: "Kcal", value: sum(entries, (entry) => entry.kcal), decimals: 0 },
  ];
}

export function displayValue(value: number | null | undefined, suffix = "", decimals = 1): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${value.toLocaleString("it-IT", { maximumFractionDigits: decimals })}${suffix}`;
}

export function weeklyComparisons(entries: DiaryEntry[], today = romeDate()) {
  const monday = mondayOf(today);
  const previousMonday = shiftDate(monday, -7);
  const current = entries.filter((entry) => entry.data >= monday && entry.data <= shiftDate(monday, 6));
  const previous = entries.filter((entry) => entry.data >= previousMonday && entry.data < monday);
  const metrics = [
    { key: "allenamenti", label: "Allenamenti", get: sessions, higher: true, unit: "", decimals: 0 },
    { key: "minuti", label: "Minuti totali", get: (rows: DiaryEntry[]) => sum(rows, (e) => e.durata), higher: true, unit: " min", decimals: 0 },
    { key: "intensita", label: "Intensità media", get: (rows: DiaryEntry[]) => mean(rows, (e) => e.intensita), higher: true, unit: "", decimals: 1 },
    { key: "sonno", label: "Sonno medio", get: (rows: DiaryEntry[]) => mean(rows, (e) => e.sonno), higher: true, unit: " h", decimals: 1 },
    { key: "peso", label: "Peso medio", get: (rows: DiaryEntry[]) => mean(rows, (e) => e.peso), higher: false, unit: " kg", decimals: 1 },
    { key: "entrate", label: "Entrate", get: (rows: DiaryEntry[]) => sum(rows, (e) => e.entrate), higher: true, unit: " €", decimals: 2 },
    { key: "uscite", label: "Uscite", get: (rows: DiaryEntry[]) => sum(rows, (e) => e.uscite), higher: false, unit: " €", decimals: 2 },
  ];
  return metrics.map((metric) => {
    const oldValue = metric.get(previous);
    const newValue = metric.get(current);
    const difference = oldValue == null || newValue == null ? null : newValue - oldValue;
    const delta = difference == null || oldValue === 0
      ? (difference === 0 ? 0 : null)
      : difference / Math.abs(oldValue!) * 100;
    const trend: "better" | "worse" | "same" | null = difference == null ? null
      : difference === 0 ? "same" : (metric.higher ? difference > 0 : difference < 0) ? "better" : "worse";
    return { key: metric.key, label: metric.label, previous: oldValue, current: newValue, delta, trend, unit: metric.unit, decimals: metric.decimals };
  });
}

export function moneyTotals(entries: DiaryEntry[]) {
  const entrate = sum(entries, (entry) => entry.entrate);
  const uscite = sum(entries, (entry) => entry.uscite);
  return { entrate, uscite, saldo: entrate == null || uscite == null ? null : entrate - uscite };
}

export function monthlyMoney(entries: DiaryEntry[]) {
  const months = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    if (!finite(entry.entrate) && !finite(entry.uscite)) continue;
    const key = entry.data.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), entry]);
  }
  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, rows]) => ({
    month,
    label: new Intl.DateTimeFormat("it-IT", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`)),
    ...moneyTotals(rows),
  }));
}

export function januaryDays(today = romeDate()): number {
  return Math.max(0, Math.round((Date.parse("2027-01-31T00:00:00Z") - Date.parse(`${today}T00:00:00Z`)) / DAY_MS));
}

type PersonalRecord = { key: string; label: string; value: number | null; numero: number | null; unit: string };

export function personalRecords(entries: DiaryEntry[]): PersonalRecord[] {
  const best = (key: string, label: string, get: (e: DiaryEntry) => number | null | undefined, unit: string, lower = false): PersonalRecord => {
    let value: number | null = null;
    let numero: number | null = null;
    for (const entry of [...entries].sort((a, b) => a.numero - b.numero)) {
      const next = get(entry);
      if (finite(next) && (value == null || (lower ? next < value : next > value))) {
        value = next;
        numero = entry.numero;
      }
    }
    return { key, label, value, numero, unit };
  };
  // One activity per actual calendar day; gaps and inactive dates break the run.
  const activeDates = new Map<string, DiaryEntry>();
  for (const entry of entries) {
    if (isTraining(entry) || hasRoutineActivity(entry)) activeDates.set(entry.data, entry);
  }
  let previous = "", run = 0, longest = 0, streakDay: number | null = null;
  for (const [date, entry] of [...activeDates.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    if (run > longest) { longest = run; streakDay = entry.numero; }
    previous = date;
  }
  return [
    best("flessioni", "Più flessioni in un giorno", pushupCount, " rip."),
    best("addominali", "Più addominali in un giorno", (e) => e.addominali, " rip."),
    best("durata", "Allenamento più lungo", (e) => e.durata, " min"),
    best("km", "Più km in un giorno", (e) => e.km, " km"),
    { key: "streak", label: "Streak allenamento / routine", value: longest || null, numero: streakDay, unit: " giorni" },
    best("sonno", "Sonno migliore", (e) => e.sonno, " h"),
    best("peso", "Peso più basso", (e) => e.peso, " kg", true),
  ];
}

export function correlations(entries: DiaryEntry[]) {
  const result: { key: string; text: string }[] = [];
  const sleepPairs = entries.filter((e) => finite(e.sonno) && finite(e.intensita));
  const poorSleep = sleepPairs.filter((e) => e.sonno! < 6);
  const goodSleep = sleepPairs.filter((e) => e.sonno! >= 6);
  if (poorSleep.length >= 8 && goodSleep.length >= 8) {
    result.push({ key: "sonno", text: `Quando dormo meno di 6 ore, l'intensità media è ${displayValue(mean(poorSleep, (e) => e.intensita))}. Quando dormo 6 ore o più, è ${displayValue(mean(goodSleep, (e) => e.intensita))}.` });
  }
  const minutesPairs = entries.filter((e) => finite(e.durata));
  const friction = minutesPairs.filter((e) => Boolean(e.attrito?.trim()));
  const other = minutesPairs.filter((e) => !e.attrito?.trim());
  if (friction.length >= 8 && other.length >= 8) {
    result.push({ key: "attrito", text: `Nei giorni con ATTRITO mi alleno in media ${displayValue(mean(friction, (e) => e.durata))} minuti. Negli altri ${displayValue(mean(other, (e) => e.durata))}.` });
  }
  return result;
}

/** The original weekly load formula, without its fabricated default intensity. */
export function weeklyLoad(entries: DiaryEntry[]) {
  const weeks = new Map<string, { label: string; load: number | null; minuti: number }>();
  for (const entry of entries) {
    if (!isTraining(entry) || !finite(entry.durata)) continue;
    const monday = mondayOf(entry.data);
    const row = weeks.get(monday) ?? {
      label: new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${monday}T00:00:00Z`)),
      load: null,
      minuti: 0,
    };
    row.minuti += entry.durata;
    if (finite(entry.intensita)) row.load = (row.load ?? 0) + entry.durata * entry.intensita;
    weeks.set(monday, row);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
}
