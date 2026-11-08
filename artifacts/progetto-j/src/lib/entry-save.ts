import type { Entry, EntryInput } from "@workspace/api-client-react";

const EDITABLE_FIELDS = [
  "fase", "roundSparring", "roundPao", "roundTecnica", "oraSveglia", "oreLavoro",
  "risparmio", "entrateOnline", "videoPubblicati", "articoliPubblicati", "follower",
  "pagineLette", "minutiScrittura",
  "kcal", "pasti", "alcol", "acqua", "acquaAllenamento", "tipoAllenamento", "durata", "intensita",
  "tipoGiorno", "routineCompletata", "routineForza", "routineFlessioni", "routineTrazioni",
  "routineSquat", "plank", "collo", "mobilita", "sollevamentoGamba", "grapplingVuoto",
  "energia", "noteAllenamento", "sonno", "flessioni", "addominali", "round", "km", "peso",
  "battito", "entrate", "uscite", "testo", "foto", "sintesi", "attrito", "fatto", "nonFatto",
] as const satisfies readonly (keyof EntryInput)[];

const NUMERIC_FIELDS = new Set(["kcal", "pasti", "acqua", "acquaAllenamento", "durata", "intensita", "plank", "energia", "sonno", "flessioni", "addominali", "round", "km", "peso", "battito", "entrate", "uscite"]);
for (const key of ["roundSparring", "roundPao", "roundTecnica", "oreLavoro", "risparmio", "entrateOnline", "videoPubblicati", "articoliPubblicati", "follower", "pagineLette", "minutiScrittura"]) NUMERIC_FIELDS.add(key);
const BOOLEAN_FIELDS = new Set(["alcol", "routineCompletata", "routineForza", "collo", "mobilita", "grapplingVuoto"]);

function normalized(value: unknown, key?: string): unknown {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  if (key === "oraSveglia" && typeof value === "string") return value.trim().slice(0, 5);
  if (typeof value === "string" && key) {
    if (NUMERIC_FIELDS.has(key) && Number.isFinite(Number(value))) return Number(value);
    if (BOOLEAN_FIELDS.has(key) && /^(true|false)$/i.test(value.trim())) return value.trim().toLowerCase() === "true";
  }
  return value;
}

/** In a PATCH, undefined would disappear in JSON and leave a cleared field unchanged. */
export function buildEntryPayload(form: Partial<EntryInput>, initial?: Entry): EntryInput {
  const payload: EntryInput = {
    fase: Number(form.fase ?? initial?.fase ?? 2) as 1 | 2,
    numero: Number(form.numero),
    data: form.data!,
  };
  for (const key of EDITABLE_FIELDS) {
    const value = normalized(form[key], key);
    if (initial ? value !== normalized(initial[key], key) : value !== null) {
      (payload as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return payload;
}

/** RETURNING is the database's confirmation; don't report success for missing fields. */
export function assertEntrySaved(payload: EntryInput, saved: Entry): void {
  for (const [key, value] of Object.entries(payload)) {
    if (key === "tipoGiorno") continue; // Day type is intentionally server-owned.
    if (normalized(saved[key as keyof Entry], key) !== normalized(value, key)) {
      throw new Error("Il server non ha confermato tutti i dati. Il contenuto del form è stato conservato.");
    }
  }
}
