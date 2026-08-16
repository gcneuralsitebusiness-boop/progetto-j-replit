import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, giorniTable } from "@workspace/db";
import { ensureTodayEntry } from "../lib/ensureToday";
import {
  CreateEntryBody,
  UpdateEntryBody,
  UpdateEntryParams,
  DeleteEntryParams,
  ListEntriesResponse,
  GetLatestEntriesResponse,
  CreateEntryResponse,
  UpdateEntryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** Coerce Date objects → ISO strings so Zod string schemas don't crash */
const ser = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// GET /entries — all entries sorted by date descending
router.get("/entries", async (_req, res): Promise<void> => {
  void ensureTodayEntry().catch((err) => {
    _req.log.error({ err }, "Failed to ensure today's entry");
  });

  const rows = await db
    .select()
    .from(giorniTable)
    .orderBy(desc(giorniTable.data));
  res.json(ListEntriesResponse.parse(ser(rows)));
});

// GET /entries/latest — 3 most recent entries
router.get("/entries/latest", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(giorniTable)
    .orderBy(desc(giorniTable.data))
    .limit(3);
  res.json(GetLatestEntriesResponse.parse(ser(rows)));
});

// ─── Range validation ──────────────────────────────────────────────────────────

const RANGES: Record<string, [number, number]> = {
  pasti: [1, 6],
  acqua: [0, 20],
  durata: [0, 1440],
  intensita: [1, 5],
  plank: [0, 3600],
  energia: [1, 5],
  peso: [30, 200],
  battito: [30, 220],
  sonno: [0, 24],
  kcal: [0, 15000],
  km: [0, 100],
  flessioni: [0, 2000],
  addominali: [0, 2000],
  round: [0, 2000],
  entrate: [0, 100000],
  uscite: [0, 100000],
};

const OPTIONAL_NUMERIC_FIELDS = new Set([
  "kcal",
  "pasti",
  "acqua",
  "durata",
  "intensita",
  "plank",
  "energia",
  "sonno",
  "flessioni",
  "addominali",
  "round",
  "km",
  "peso",
  "battito",
  "entrate",
  "uscite",
]);

const OPTIONAL_BOOLEAN_FIELDS = new Set([
  "alcol",
  "routineCompletata",
  "routineForza",
  "collo",
  "mobilita",
  "grapplingVuoto",
]);

const OPTIONAL_TEXT_FIELDS = new Set([
  "tipoAllenamento",
  "tipoGiorno",
  "routineFlessioni",
  "routineTrazioni",
  "routineSquat",
  "sollevamentoGamba",
  "noteAllenamento",
  "testo",
  "sintesi",
  "foto",
]);

/**
 * Admin forms and older saved drafts can contain empty strings for optional
 * controls. PostgreSQL does not treat "" as SQL NULL, especially for boolean
 * and numeric columns, so normalize those values at the API boundary.
 */
function normalizeEntryBody(input: unknown): unknown {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return input;

  const normalized: Record<string, unknown> = { ...(input as Record<string, unknown>) };

  for (const field of OPTIONAL_NUMERIC_FIELDS) {
    if (!(field in normalized)) continue;
    const value = normalized[field];
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      normalized[field] = trimmed === "" ? null : Number(trimmed);
    }
  }

  for (const field of OPTIONAL_BOOLEAN_FIELDS) {
    if (!(field in normalized)) continue;
    const value = normalized[field];
    if (value === null || value === undefined || typeof value === "boolean") continue;
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase();
      normalized[field] = trimmed === "" ? null : trimmed === "true" ? true : trimmed === "false" ? false : value;
    }
  }

  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (!(field in normalized)) continue;
    const value = normalized[field];
    if (typeof value === "string" && value.trim() === "") normalized[field] = null;
  }

  return normalized;
}

function validateRanges(data: Record<string, unknown>): string | null {
  for (const [field, [min, max]] of Object.entries(RANGES)) {
    const val = data[field];
    if (val == null) continue;
    const num = Number(val);
    if (Number.isNaN(num)) continue;
    if (num < min || num > max) {
      return `${field}: il valore ${num} è fuori dall'intervallo consentito (${min}–${max})`;
    }
  }
  return null;
}

function automaticDayType(numero: number): "A" | "B" {
  return numero % 2 === 0 ? "B" : "A";
}

// POST /entries — create entry (admin only)
router.post("/entries", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateEntryBody.safeParse(normalizeEntryBody(req.body));
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid entry body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rangeError = validateRanges(parsed.data as Record<string, unknown>);
  if (rangeError) {
    res.status(400).json({ error: rangeError });
    return;
  }

  // Check for duplicate numero
  const existing = await db
    .select()
    .from(giorniTable)
    .where(eq(giorniTable.numero, parsed.data.numero));
  if (existing.length > 0) {
    res.status(409).json({ error: `Entry for giorno ${parsed.data.numero} already exists` });
    return;
  }

  const [row] = await db.insert(giorniTable).values({
    ...parsed.data,
    tipoGiorno: automaticDayType(parsed.data.numero),
  }).returning();
  res.status(201).json(CreateEntryResponse.parse(ser(row)));
});

// PATCH /entries/:numero — update entry (admin only)
router.patch("/entries/:numero", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateEntryBody.safeParse(normalizeEntryBody(req.body));
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const rangeError = validateRanges(body.data as Record<string, unknown>);
  if (rangeError) {
    res.status(400).json({ error: rangeError });
    return;
  }

  const [row] = await db
    .update(giorniTable)
    .set({
      ...body.data,
      tipoGiorno: automaticDayType(params.data.numero),
    })
    .where(eq(giorniTable.numero, params.data.numero))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(UpdateEntryResponse.parse(ser(row)));
});

// DELETE /entries/:numero — delete entry (admin only)
router.delete("/entries/:numero", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(giorniTable)
    .where(eq(giorniTable.numero, params.data.numero))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.sendStatus(204);
});

// Bulk text export/import
const NUMERIC_FIELDS = [
  "kcal",
  "sonno",
  "flessioni",
  "addominali",
  "round",
  "km",
  "peso",
  "battito",
  "entrate",
  "uscite",
] as const;

function formatNumberValue(val: number | null): string {
  if (val === null || val === undefined) return "-";
  return String(val);
}

function parseNumberValue(val: string): number | null {
  const trimmed = val.trim();
  if (trimmed === "" || trimmed === "-" || trimmed.toLowerCase() === "null") return null;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return null;
  return num;
}

function buildBulkText(rows: (typeof giorniTable.$inferSelect)[]): string {
  const lines: string[] = [];
  for (const row of rows) {
    lines.push(`# GIORNO ${row.numero}`);
    lines.push(`DATA: ${row.data}`);
    lines.push(`KCAL: ${formatNumberValue(row.kcal)}`);
    lines.push(`SONNO: ${formatNumberValue(row.sonno)}`);
    lines.push(`FLESSIONI: ${formatNumberValue(row.flessioni)}`);
    lines.push(`ADDOMINALI: ${formatNumberValue(row.addominali)}`);
    lines.push(`ROUND: ${formatNumberValue(row.round)}`);
    lines.push(`KM: ${formatNumberValue(row.km)}`);
    lines.push(`PESO: ${formatNumberValue(row.peso)}`);
    lines.push(`BATTITO: ${formatNumberValue(row.battito)}`);
    lines.push(`ENTRATE: ${formatNumberValue(row.entrate)}`);
    lines.push(`USCITE: ${formatNumberValue(row.uscite)}`);
    lines.push("TESTO:");
    lines.push(row.testo || "");
    lines.push("FINE_TESTO");
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

interface ParsedBlock {
  numero: number;
  data: string;
  kcal: number | null;
  sonno: number | null;
  flessioni: number | null;
  addominali: number | null;
  round: number | null;
  km: number | null;
  peso: number | null;
  battito: number | null;
  entrate: number | null;
  uscite: number | null;
  testo: string | null;
}

function parseBulkText(text: string): { blocks: ParsedBlock[]; errors: string[] } {
  const blocks: ParsedBlock[] = [];
  const errors: string[] = [];
  const rawBlocks = text.split(/\n# GIORNO /);
  for (let i = 0; i < rawBlocks.length; i++) {
    let raw = rawBlocks[i].trim();
    if (i === 0) {
      if (!raw.startsWith("# GIORNO ")) continue;
      raw = raw.slice("# GIORNO ".length);
    }
    if (!raw) continue;

    const lines = raw.split("\n");
    const numeroLine = lines[0].trim();
    const numero = Number(numeroLine);
    if (Number.isNaN(numero) || !Number.isInteger(numero)) {
      errors.push(`Blocco non valido: numero mancante o non intero`);
      continue;
    }

    let data: string | null = null;
    const values: Record<string, string> = {};
    let testo: string | null = null;

    let inTesto = false;
    let testoLines: string[] = [];
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === "TESTO:") {
        inTesto = true;
        continue;
      }
      if (line.trim() === "FINE_TESTO") {
        inTesto = false;
        continue;
      }
      if (inTesto) {
        testoLines.push(line);
        continue;
      }
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      if (key === "data") {
        data = value;
      } else if (NUMERIC_FIELDS.includes(key as (typeof NUMERIC_FIELDS)[number])) {
        values[key] = value;
      }
    }

    if (!data) {
      errors.push(`Giorno ${numero}: data mancante`);
      continue;
    }

    testo = testoLines.length > 0 ? testoLines.join("\n").trim() : null;
    if (testo === "") testo = null;

    blocks.push({
      numero,
      data,
      kcal: parseNumberValue(values.kcal ?? "-"),
      sonno: parseNumberValue(values.sonno ?? "-"),
      flessioni: parseNumberValue(values.flessioni ?? "-"),
      addominali: parseNumberValue(values.addominali ?? "-"),
      round: parseNumberValue(values.round ?? "-"),
      km: parseNumberValue(values.km ?? "-"),
      peso: parseNumberValue(values.peso ?? "-"),
      battito: parseNumberValue(values.battito ?? "-"),
      entrate: parseNumberValue(values.entrate ?? "-"),
      uscite: parseNumberValue(values.uscite ?? "-"),
      testo,
    });
  }
  return { blocks, errors };
}

router.get("/bulk/entries", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db.select().from(giorniTable).orderBy(giorniTable.numero);
  const text = buildBulkText(rows);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(text);
});

router.post("/bulk/entries", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const text = req.body?.text;
  if (typeof text !== "string") {
    res.status(400).json({ error: "text must be a string" });
    return;
  }

  const { blocks, errors } = parseBulkText(text);
  if (blocks.length === 0) {
    res.status(400).json({ error: "No valid entries found in text" });
    return;
  }

  let updated = 0;
  for (const block of blocks) {
    const [existing] = await db.select().from(giorniTable).where(eq(giorniTable.numero, block.numero)).limit(1);
    if (!existing) {
      errors.push(`Giorno ${block.numero}: non trovato, saltato`);
      continue;
    }
    await db
      .update(giorniTable)
      .set({
        data: block.data,
        kcal: block.kcal,
        sonno: block.sonno,
        flessioni: block.flessioni,
        addominali: block.addominali,
        round: block.round,
        km: block.km,
        peso: block.peso,
        battito: block.battito,
        entrate: block.entrate,
        uscite: block.uscite,
        testo: block.testo,
      })
      .where(eq(giorniTable.numero, block.numero));
    updated++;
  }

  res.json({ updated, errors });
});

export default router;
