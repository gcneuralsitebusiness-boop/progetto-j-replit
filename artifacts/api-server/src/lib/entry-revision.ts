import { createHash } from "node:crypto";

/** JSON serialization treats database Date values identically to the GET payload. */
export function entryRevision(entry: unknown): string {
  return `"${createHash("sha256").update(JSON.stringify(entry)).digest("hex")}"`;
}

export function matchesRevision(condition: string, entry: unknown): boolean {
  const revision = entryRevision(entry);
  return condition.split(",").some((token) => token.trim() === revision || token.trim() === "*");
}
