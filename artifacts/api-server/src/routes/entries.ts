import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
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
router.use(["/entries", "/giorni", "/bulk/entries"], (req, res, next) => {
  const fase = Number(req.query.fase ?? 1);
  if (fase !== 1 && fase !== 2) {
    res.status(400).json({ error: "Fase non valida: scegliere 1 o 2" });
    return;
  }
  res.locals.fase = fase;
  if (req.method === "GET") {
    void ensureTodayEntry().catch((err) => {
      req.log.error({ err }, "Failed to ensure today's entry");
    });
  }
  next();
});
const dayIdentity = (fase: number, numero: number) =>
  and(eq(giorniTable.fase, fase), eq(giorniTable.numero, numero));

/** Coerce Date objects → ISO strings so Zod string schemas don't crash */
const ser = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// GET /entries — all entries sorted by date descending
router.get("/entries", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(giorniTable)
    .where(eq(giorniTable.fase, res.locals.fase))
    .orderBy(desc(giorniTable.data));
  res.json(ListEntriesResponse.parse(ser(rows)));
});

// GET /entries/latest — 3 most recent entries
router.get("/entries/latest", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(giorniTable)
    .where(eq(giorniTable.fase, res.locals.fase))
    .orderBy(desc(giorniTable.data))
    .limit(3);
  res.json(GetLatestEntriesResponse.parse(ser(rows)));
});

// GET /giorni/:numero/clip — deliberately narrow public payload for the video clip
router.get("/giorni/:numero/clip", async (req, res): Promise<void> => {
  const numero = Number(req.params.numero);
  if (!Number.isInteger(numero) || numero < 1 || numero > 180) {
    res.status(404).json({ error: "Giorno non trovato" });
    return;
  }

  const [row] = await db
    .select({
      numeroGiorno: giorniTable.numero,
      data: giorniTable.data,
      sonnoOre: giorniTable.sonno,
      entrateEur: giorniTable.entrate,
      usciteEur: giorniTable.uscite,
      attrito: giorniTable.attrito,
      fotoClipUrl: giorniTable.foto,
    })
    .from(giorniTable)
    .where(dayIdentity(res.locals.fase, numero))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Giorno non trovato" });
    return;
  }

  res.json({
    fase: res.locals.fase,
    numeroGiorno: row.numeroGiorno,
    rimasti: Math.max(0, 180 - row.numeroGiorno),
    data: row.data,
    sonnoOre: row.sonnoOre ?? null,
    entrateEur: row.entrateEur ?? null,
    usciteEur: row.usciteEur ?? null,
    attrito: row.attrito?.trim() || null,
    // Internal object paths are resolved to a browser URL by the existing
    // object-storage client; external URLs remain unchanged.
    fotoClipUrl: row.fotoClipUrl?.trim() || null,
  });
});

// GET /entries/summary — lightweight list for feeds and planning
router.get("/entries/summary", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: giorniTable.id,
      fase: giorniTable.fase,
      numero: giorniTable.numero,
      data: giorniTable.data,
      kcal: giorniTable.kcal,
      sonno: giorniTable.sonno,
      flessioni: giorniTable.flessioni,
      addominali: giorniTable.addominali,
      round: giorniTable.round,
      km: giorniTable.km,
      peso: giorniTable.peso,
      battito: giorniTable.battito,
      entrate: giorniTable.entrate,
      uscite: giorniTable.uscite,
      testo: giorniTable.testo,
      sintesi: giorniTable.sintesi,
      foto: giorniTable.foto,
      attrito: giorniTable.attrito,
      fatto: giorniTable.fatto,
      nonFatto: giorniTable.nonFatto,
      cardFeed: giorniTable.cardFeed,
      cardStory: giorniTable.cardStory,
      tipoAllenamento: giorniTable.tipoAllenamento,
      routineCompletata: giorniTable.routineCompletata,
    })
    .from(giorniTable)
    .where(eq(giorniTable.fase, res.locals.fase))
    .orderBy(desc(giorniTable.data));
  res.json(ser(rows));
});

router.get("/entries/current-season", async (_req, res): Promise<void> => {
  const [latest] = await db.select({ fase: giorniTable.fase, numero: giorniTable.numero })
    .from(giorniTable).orderBy(desc(giorniTable.fase), desc(giorniTable.numero)).limit(1);
  res.json(latest ?? { fase: 1, numero: 0 });
});

// GET /entries/:numero — complete public detail for a single day
router.get("/entries/:numero", async (req, res): Promise<void> => {
  const numero = Number(req.params.numero);
  if (!Number.isInteger(numero) || numero < 1 || numero > 180) {
    res.status(400).json({ error: "Invalid entry number" });
    return;
  }
  const [row] = await db
    .select()
    .from(giorniTable)
    .where(dayIdentity(res.locals.fase, numero))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(ser(row));
});

// ─── Range validation ──────────────────────────────────────────────────────────

const RANGES: Record<string, [number, number]> = {
  pasti: [1, 6],
  acqua: [0, 20],
  acquaAllenamento: [0, 10],
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
  "roundSparring", "roundPao", "roundTecnica", "oreLavoro", "risparmio", "entrateOnline",
  "videoPubblicati", "articoliPubblicati", "follower", "pagineLette", "minutiScrittura",
  "kcal",
  "pasti",
  "acqua",
  "acquaAllenamento",
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
  "oraSveglia",
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
  "attrito",
  "fatto",
  "nonFatto",
  "cardTitolo",
  "cardSottotitolo",
  "cardImmagine",
  "cardFeed",
  "cardStory",
]);

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

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
    .where(dayIdentity(parsed.data.fase ?? res.locals.fase, parsed.data.numero));
  if (existing.length > 0) {
    res.status(409).json({ error: `Entry for giorno ${parsed.data.numero} already exists` });
    return;
  }

  const [row] = await db.insert(giorniTable).values({
    ...parsed.data,
    fase: parsed.data.fase ?? res.locals.fase,
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

  if (body.data.fase != null && body.data.fase !== res.locals.fase) {
    res.status(400).json({ error: "La fase di una giornata salvata non può cambiare. Crea una nuova giornata nella fase desiderata." });
    return;
  }

  const [row] = await db
    .update(giorniTable)
    .set({
      ...body.data,
      tipoGiorno: automaticDayType(params.data.numero),
    })
    .where(dayIdentity(res.locals.fase, params.data.numero))
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
    .where(dayIdentity(res.locals.fase, params.data.numero))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.sendStatus(204);
});

// Bulk text export/import
const BULK_FIELD_MAP: Record<string, string> = {
  kcal: "kcal",
  acqua: "acqua",
  acqua_allenamento: "acquaAllenamento",
  pasti: "pasti",
  sonno: "sonno",
  flessioni: "flessioni",
  addominali: "addominali",
  round: "round",
  km: "km",
  peso: "peso",
  battito: "battito",
  entrate: "entrate",
  uscite: "uscite",
};

function formatNumberValue(val: number | null): string {
  if (val === null || val === undefined) return "-";
  return String(val);
}

function buildBulkText(rows: (typeof giorniTable.$inferSelect)[]): string {
  const lines: string[] = [];
  for (const row of rows) {
    lines.push(`# GIORNO ${row.numero}`);
    lines.push(`DATA: ${row.data}`);
    lines.push(`KCAL: ${formatNumberValue(row.kcal)}`);
    lines.push(`PASTI: ${formatNumberValue(row.pasti)}`);
    lines.push(`ACQUA: ${formatNumberValue(row.acqua)}`);
    lines.push(`ACQUA_ALLENAMENTO: ${formatNumberValue(row.acquaAllenamento)}`);
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
  pasti: number | null;
  acqua: number | null;
  acquaAllenamento: number | null;
  sonno: number | null;
  flessioni: number | null;
  addominali: number | null;
  round: number | null;
  km: number | null;
  peso: number | null;
  battito: number | null;
  entrate: number | null;
  uscite: number | null;
  providedFields: string[];
  testoProvided: boolean;
  testo: string | null;
}

function parseBulkNumber(raw: string | undefined, field: string, context: string, errors: string[]): number | null {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "" || trimmed === "-" || trimmed.toLowerCase() === "null") return null;

  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    errors.push(`${context}: ${field} deve essere un numero`);
    return null;
  }

  const range = RANGES[field];
  if (range && (num < range[0] || num > range[1])) {
    errors.push(`${context}: ${field} fuori intervallo (${range[0]}–${range[1]})`);
    return null;
  }
  return num;
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
    const providedFields = new Set<string>();
    let testoProvided = false;
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === "TESTO:") {
        inTesto = true;
        testoProvided = true;
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
      } else if (BULK_FIELD_MAP[key]) {
        const field = BULK_FIELD_MAP[key];
        values[field] = value;
        providedFields.add(field);
      }
    }

    if (!data) {
      errors.push(`Giorno ${numero}: data mancante`);
      continue;
    }
    if (!isValidIsoDate(data)) {
      errors.push(`Giorno ${numero}: data non valida, usare il formato YYYY-MM-DD`);
      continue;
    }

    testo = testoLines.length > 0 ? testoLines.join("\n").trim() : null;
    if (testo === "") testo = null;

    const context = `Giorno ${numero}`;
    blocks.push({
      numero,
      data,
      kcal: parseBulkNumber(values.kcal, "kcal", context, errors),
      pasti: parseBulkNumber(values.pasti, "pasti", context, errors),
      acqua: parseBulkNumber(values.acqua, "acqua", context, errors),
      acquaAllenamento: parseBulkNumber(values.acquaAllenamento, "acquaAllenamento", context, errors),
      sonno: parseBulkNumber(values.sonno, "sonno", context, errors),
      flessioni: parseBulkNumber(values.flessioni, "flessioni", context, errors),
      addominali: parseBulkNumber(values.addominali, "addominali", context, errors),
      round: parseBulkNumber(values.round, "round", context, errors),
      km: parseBulkNumber(values.km, "km", context, errors),
      peso: parseBulkNumber(values.peso, "peso", context, errors),
      battito: parseBulkNumber(values.battito, "battito", context, errors),
      entrate: parseBulkNumber(values.entrate, "entrate", context, errors),
      uscite: parseBulkNumber(values.uscite, "uscite", context, errors),
      providedFields: [...providedFields],
      testoProvided,
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
  const rows = await db.select().from(giorniTable).where(eq(giorniTable.fase, res.locals.fase)).orderBy(giorniTable.numero);
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
  if (blocks.length === 0 || errors.length > 0) {
    res.status(400).json({ error: errors.length ? "Import non valido" : "No valid entries found in text", errors });
    return;
  }

  const existingRows = await Promise.all(
    blocks.map((block) => db.select().from(giorniTable).where(dayIdentity(res.locals.fase, block.numero)).limit(1))
  );
  const missingErrors = existingRows
    .map((rows, index) => rows.length ? null : `Giorno ${blocks[index].numero}: non trovato, saltato`)
    .filter((error): error is string => error != null);
  if (missingErrors.length > 0) {
    res.status(400).json({ error: "Import non valido", errors: missingErrors });
    return;
  }

  let updated = 0;
  await db.transaction(async (tx) => {
    for (const block of blocks) {
      const update: Record<string, unknown> = { data: block.data };
      for (const field of block.providedFields) {
        update[field] = block[field as keyof ParsedBlock];
      }
      if (block.testoProvided) update.testo = block.testo;
      await tx
        .update(giorniTable)
        .set(update)
        .where(dayIdentity(res.locals.fase, block.numero));
      updated++;
    }
  });

  res.json({ updated, errors });
});

export default router;
