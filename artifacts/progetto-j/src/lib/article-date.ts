const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

/** Date-only key (YYYY-MM-DD) without timezone shifting. */
export function dateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (!m) return null;
  const key = `${m[1]}-${m[2]}-${m[3]}`;
  const parsed = new Date(`${key}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === key ? key : null;
}

export function formatDateIt(value: string | null | undefined): string | null {
  const key = dateKey(value);
  if (!key) return null;
  const [y, mo, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[mo - 1]} ${y}`;
}

