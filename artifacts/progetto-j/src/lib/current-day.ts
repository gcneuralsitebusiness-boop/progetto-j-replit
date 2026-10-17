type Day = { numero: number; data: string; testo?: string | null; hasDiario?: boolean };

export function romeToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
}

export function isUnfinishedToday(entry: Day, today = romeToday()): boolean {
  const hasDiary = entry.hasDiario ?? Boolean(entry.testo?.trim());
  return entry.data === today && !hasDiary;
}

/** Also handles the first request after midnight, while the idempotent creator runs. */
export function isCurrentDayPending(entries: readonly Day[] | undefined, numero: number, today = romeToday()): boolean {
  if (!entries?.length || !Number.isInteger(numero) || numero < 1) return false;
  const requested = entries.find((entry) => entry.numero === numero);
  if (requested) return isUnfinishedToday(requested, today);
  const maxDate = entries.reduce((max, entry) => entry.data > max ? entry.data : max, "");
  const maxNumero = entries.reduce((max, entry) => Math.max(max, entry.numero), 0);
  const gap = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${maxDate}T00:00:00Z`)) / 86_400_000);
  return gap > 0 && numero === maxNumero + gap;
}
