import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tasksTable,
  taskTemplatesTable,
  insertTaskSchema,
  insertTaskTemplateSchema,
  giorniTable,
  plannerNotesTable,
} from "@workspace/db/schema";
import { eq, and, between, sql, asc, desc, isNull } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();
export const FIXED_PLANNER_TASKS = ["DIARIO", "TRACKING", "CARD IG", "CONTENUTO"] as const;

function isAdmin(req: any): boolean {
  return !!req.session?.adminAuthenticated;
}

// ─── Fixed daily checklist ────────────────────────────────────────────────────

router.get("/admin/planner/checklist", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const { from, to } = req.query as Record<string, string>;
  if (!from || !to) { res.status(400).json({ error: "Parametri mancanti" }); return; }
  try {
    const rows = await db
      .select()
      .from(tasksTable)
      .where(between(tasksTable.data, from, to));
    res.json(rows.filter((row) => (FIXED_PLANNER_TASKS as readonly string[]).includes(row.testo)));
  } catch {
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/admin/planner/checklist", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const parsed = z.object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    task: z.enum(FIXED_PLANNER_TASKS),
    done: z.boolean(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  try {
    const existing = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.data, parsed.data.data), eq(tasksTable.testo, parsed.data.task)));
    if (existing[0]) {
      const [row] = await db
        .update(tasksTable)
        .set({ stato: parsed.data.done ? "FATTO" : "DA FARE" })
        .where(eq(tasksTable.id, existing[0].id))
        .returning();
      res.json(row);
      return;
    }
    if (!parsed.data.done) {
      res.json({ data: parsed.data.data, testo: parsed.data.task, stato: "DA FARE" });
      return;
    }
    const [row] = await db.insert(tasksTable).values({
      data: parsed.data.data,
      testo: parsed.data.task,
      tipo: parsed.data.task === "DIARIO" ? "DIARIO" : "ALTRO",
      stato: "FATTO",
      priorita: 2,
    }).returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Errore interno" });
  }
});

// ─── Simple planner state: daily extras + persistent fixed notes ──────────────

router.get("/admin/planner/state", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const { data } = req.query as Record<string, string>;
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    res.status(400).json({ error: "data obbligatoria (YYYY-MM-DD)" }); return;
  }
  try {
    const [tasks, extras, fixed] = await Promise.all([
      db.select().from(tasksTable).where(eq(tasksTable.data, data)),
      db.select().from(plannerNotesTable).where(and(eq(plannerNotesTable.data, data), eq(plannerNotesTable.tipo, "daily"))),
      db.select().from(plannerNotesTable).where(and(isNull(plannerNotesTable.data), eq(plannerNotesTable.tipo, "fixed"))).limit(1),
    ]);
    res.json({
      tasks: tasks.filter((row) => (FIXED_PLANNER_TASKS as readonly string[]).includes(row.testo)),
      extras,
      fixedNote: fixed[0]?.testo ?? "",
    });
  } catch {
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/admin/planner/extras", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const parsed = z.object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    testo: z.string().trim().min(1).max(180),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  try {
    const existing = await db
      .select()
      .from(plannerNotesTable)
      .where(and(eq(plannerNotesTable.data, parsed.data.data), eq(plannerNotesTable.tipo, "daily")));
    if (existing.length >= 3) { res.status(400).json({ error: "Massimo 3 note extra per giornata" }); return; }
    const [row] = await db.insert(plannerNotesTable).values({
      data: parsed.data.data,
      tipo: "daily",
      testo: parsed.data.testo,
    }).returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/admin/planner/extras/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "ID non valido" }); return; }
  try {
    await db.delete(plannerNotesTable).where(and(eq(plannerNotesTable.id, id), eq(plannerNotesTable.tipo, "daily")));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Errore interno" });
  }
});

router.put("/admin/planner/fixed-note", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const parsed = z.object({
    testo: z.string().max(1000).refine((text) => text.split(/\r?\n/).length <= 10, "Massimo 10 righe"),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  try {
    const existing = await db
      .select()
      .from(plannerNotesTable)
      .where(and(isNull(plannerNotesTable.data), eq(plannerNotesTable.tipo, "fixed")))
      .limit(1);
    if (existing[0]) {
      const [row] = await db.update(plannerNotesTable)
        .set({ testo: parsed.data.testo, updatedAt: new Date() })
        .where(eq(plannerNotesTable.id, existing[0].id))
        .returning();
      res.json(row);
      return;
    }
    const [row] = await db.insert(plannerNotesTable).values({
      data: null,
      tipo: "fixed",
      testo: parsed.data.testo,
    }).returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Errore interno" });
  }
});

// ─── Tasks CRUD ───────────────────────────────────────────────────────────────

// GET /admin/planner/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/admin/planner/tasks", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  try {
    const { from, to, data } = req.query as Record<string, string>;
    let rows;
    if (data) {
      rows = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.data, data))
        .orderBy(asc(tasksTable.priorita), asc(tasksTable.createdAt));
    } else if (from && to) {
      rows = await db
        .select()
        .from(tasksTable)
        .where(between(tasksTable.data, from, to))
        .orderBy(asc(tasksTable.data), asc(tasksTable.priorita), asc(tasksTable.createdAt));
    } else {
      res.status(400).json({ error: "Parametri mancanti" }); return;
    }
    res.json(rows);
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// POST /admin/planner/tasks
router.post("/admin/planner/tasks", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  try {
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db.insert(tasksTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// PATCH /admin/planner/tasks/:id
router.patch("/admin/planner/tasks/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID non valido" }); return; }
  try {
    const allowed = z.object({
      testo: z.string().min(1).max(500).optional(),
      tipo: z.enum(["POST", "ARTICOLO", "DIARIO", "VIDEO", "SITO", "ALTRO"]).optional(),
      stato: z.enum(["DA FARE", "IN CORSO", "FATTO"]).optional(),
      priorita: z.number().int().min(1).max(3).optional(),
      data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    });
    const parsed = allowed.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db
      .update(tasksTable)
      .set(parsed.data)
      .where(eq(tasksTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Non trovata" }); return; }
    res.json(row);
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// DELETE /admin/planner/tasks/:id
router.delete("/admin/planner/tasks/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID non valido" }); return; }
  try {
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.status(204).end();
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// POST /admin/planner/tasks/reorder — assign manual order within a day
// Body: { ids: number[] } in the desired display order
router.post("/admin/planner/tasks/reorder", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  try {
    const parsed = z.object({ ids: z.array(z.number().int()).min(1).max(200) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    await db.transaction(async (tx) => {
      for (let i = 0; i < parsed.data.ids.length; i++) {
        await tx
          .update(tasksTable)
          .set({ ordine: i + 1 })
          .where(eq(tasksTable.id, parsed.data.ids[i]));
      }
    });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// ─── Templates ────────────────────────────────────────────────────────────────

// GET /admin/planner/templates
router.get("/admin/planner/templates", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  try {
    const rows = await db
      .select()
      .from(taskTemplatesTable)
      .orderBy(asc(taskTemplatesTable.ordine), asc(taskTemplatesTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// POST /admin/planner/templates
router.post("/admin/planner/templates", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  try {
    const parsed = insertTaskTemplateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const maxOrdine = await db
      .select({ m: sql<number>`coalesce(max(${taskTemplatesTable.ordine}), -1)` })
      .from(taskTemplatesTable);
    const ordine = (maxOrdine[0]?.m ?? -1) + 1;
    const [row] = await db
      .insert(taskTemplatesTable)
      .values({ ...parsed.data, ordine })
      .returning();
    res.status(201).json(row);
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// PATCH /admin/planner/templates/:id
router.patch("/admin/planner/templates/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID non valido" }); return; }
  try {
    const allowed = z.object({
      testo: z.string().min(1).max(500).optional(),
      tipo: z.enum(["POST", "ARTICOLO", "DIARIO", "VIDEO", "SITO", "ALTRO"]).optional(),
      priorita: z.number().int().min(1).max(3).optional(),
      ordine: z.number().int().optional(),
    });
    const parsed = allowed.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [row] = await db
      .update(taskTemplatesTable)
      .set(parsed.data)
      .where(eq(taskTemplatesTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Non trovata" }); return; }
    res.json(row);
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// DELETE /admin/planner/templates/:id
router.delete("/admin/planner/templates/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID non valido" }); return; }
  try {
    await db.delete(taskTemplatesTable).where(eq(taskTemplatesTable.id, id));
    res.status(204).end();
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// ─── Routine giornaliera ──────────────────────────────────────────────────────

// POST /admin/planner/routine?data=YYYY-MM-DD
// Creates tasks from templates for the given date, skipping existing ones (idempotent)
router.post("/admin/planner/routine", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const { data } = req.query as Record<string, string>;
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    res.status(400).json({ error: "data obbligatoria (YYYY-MM-DD)" }); return;
  }
  try {
    const templates = await db
      .select()
      .from(taskTemplatesTable)
      .orderBy(asc(taskTemplatesTable.ordine));
    if (templates.length === 0) {
      res.json({ created: 0, skipped: 0, message: "Nessun template definito" }); return;
    }
    const existing = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.data, data));

    let created = 0;
    let skipped = 0;
    for (const t of templates) {
      const dup = existing.some(
        (e) => e.testo === t.testo && e.tipo === t.tipo
      );
      if (dup) { skipped++; continue; }
      await db.insert(tasksTable).values({
        data,
        testo: t.testo,
        tipo: t.tipo,
        stato: "DA FARE",
        priorita: t.priorita,
      });
      created++;
    }
    res.json({ created, skipped });
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

// ─── Giorno corrente del progetto ─────────────────────────────────────────────

// GET /admin/planner/giorno-attivo — returns the latest published giorno number
router.get("/admin/planner/giorno-attivo", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  try {
    const rows = await db
      .select({ numero: giorniTable.numero })
      .from(giorniTable)
      .orderBy(desc(giorniTable.numero))
      .limit(1);
    res.json({ numero: rows[0]?.numero ?? null });
  } catch { res.status(500).json({ error: "Errore interno" }); }
});

export default router;
