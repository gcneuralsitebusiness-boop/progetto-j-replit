import type { Entry } from "@workspace/api-client-react";

type Field = "durata" | "km";
type Rule = { numero: number; field: Field; before: number; after: number; evidence: string[] };

// Deliberately bounded to reviewed, explicit historical statements. This is not
// a general language parser and never guesses durations or mixed-run distances.
const RULES: Rule[] = [
  { numero: 25, field: "durata", before: 90, after: 120, evidence: ["un'ora e mezza di grappling e lotta", "poi 30 minuti di sacco thai"] },
  { numero: 26, field: "durata", before: 60, after: 150, evidence: ["palestra per 2 ore e mezza"] },
  { numero: 37, field: "durata", before: 90, after: 120, evidence: ["un'ora e mezza di mma più 30 minuti a vuoto"] },
  { numero: 48, field: "durata", before: 90, after: 150, evidence: ["2 ore e mezza di sessione"] },
  { numero: 56, field: "durata", before: 75, after: 138, evidence: ["6 round da 3 minuti di mma", "poi 2 ore di calcio sulla sabbia e lotta in mare"] },
  { numero: 62, field: "durata", before: 0, after: 90, evidence: ["un'ora e mezza di muay thai"] },
  { numero: 77, field: "km", before: 0, after: 10, evidence: ["tennis, 10 km di corsa, 6 round di sparring"] },
  { numero: 112, field: "durata", before: 120, after: 150, evidence: ["palestra dalle 18 alle 20:30"] },
];

export const CORRECTION_DAYS = RULES.map((rule) => rule.numero);
export type DiaryCorrection = {
  id: string; numero: number; field: Field; before: number | null; after: number; evidence: string[];
};

function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ")
    .replace(/&rsquo;|&#8217;|&#39;|&apos;|[’‘]/g, "'")
    .replace(/\s+/g, " ").trim().toLocaleLowerCase("it-IT");
}

export function explicitCorrection(entry: Pick<Entry, "numero" | "testo" | "durata" | "km">): DiaryCorrection | null {
  const rule = RULES.find((candidate) => candidate.numero === entry.numero);
  if (!rule) return null;
  const before = entry[rule.field] ?? null;
  if (before === rule.after || (before !== null && before !== rule.before)) return null;
  const text = plainText(entry.testo ?? "");
  if (!rule.evidence.every((quote) => text.includes(quote))) return null;
  return { id: `${rule.numero}:${rule.field}`, numero: rule.numero, field: rule.field, before, after: rule.after, evidence: rule.evidence };
}
