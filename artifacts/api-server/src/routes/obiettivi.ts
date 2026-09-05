import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db, obiettiviTable, tappeTable, taskTable } from "@workspace/db";
import {
  ChiudiTappaBody, ChiudiTappaParams, ChiudiTappaResponse,
  CompletaObiettivoTaskBody, CompletaObiettivoTaskParams, CompletaObiettivoTaskResponse,
  CreateObiettivoTaskBody, CreateObiettivoTaskResponse,
  DeleteObiettivoTaskParams, GetTappaCorrenteResponse,
  ListObiettiviResponse, ListTaskGiornoParams, ListTaskGiornoResponse,
  UpdateObiettivoBody, UpdateObiettivoParams, UpdateObiettivoResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const isAdmin = (req: any): boolean => Boolean(req.session?.adminAuthenticated);
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : "Errore interno";
const taskPayload = (task: typeof taskTable.$inferSelect) => ({
  ...task,
  giorno_completato: task.giornoCompletato,
});

async function ensureInitialSeed(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(obiettiviTable).values([
      { ciclo: 1, posizione: 1, area: "CORPO", titolo: "OBIETTIVO CORPO", previsto: 1, prova: null },
      { ciclo: 1, posizione: 2, area: "CONTENUTI", titolo: "OBIETTIVO CONTENUTI", previsto: 1, prova: null },
      { ciclo: 1, posizione: 3, area: "SOLDI", titolo: "OBIETTIVO SOLDI", previsto: 1, prova: null },
    ]).onConflictDoNothing({ target: [obiettiviTable.ciclo, obiettiviTable.posizione] });
    await tx.insert(tappeTable).values({ ciclo: 1, numero: 1, giornoInizio: 1, giornoFine: 7 })
      .onConflictDoNothing({ target: [tappeTable.ciclo, tappeTable.numero] });
  });
}

async function currentTappa(ciclo?: number) {
  if (ciclo == null) {
    return (await db.select().from(tappeTable).where(eq(tappeTable.chiusa, false))
      .orderBy(desc(tappeTable.giornoFine)).limit(1))[0];
  }
  return (await db.select().from(tappeTable).where(and(eq(tappeTable.ciclo, ciclo), eq(tappeTable.chiusa, false)))
    .orderBy(desc(tappeTable.giornoFine)).limit(1))[0];
}

async function tappaPayload(tappa: typeof tappeTable.$inferSelect) {
  const [goals, tasks] = await Promise.all([
    db.select().from(obiettiviTable).where(eq(obiettiviTable.ciclo, tappa.ciclo)).orderBy(asc(obiettiviTable.posizione)),
    db.select().from(taskTable).where(eq(taskTable.tappaId, tappa.id)).orderBy(asc(taskTable.ordine), asc(taskTable.id)),
  ]);
  return {
    ...tappa,
    obiettivi: goals.map((obiettivo) => ({
      obiettivo,
      task: tasks.filter((task) => task.obiettivoId === obiettivo.id).map(taskPayload),
    })),
  };
}

async function goalsPayload(ciclo: number) {
  const [goals, allTasks, stages] = await Promise.all([
    db.select().from(obiettiviTable).where(eq(obiettiviTable.ciclo, ciclo)).orderBy(asc(obiettiviTable.posizione)),
    db.select().from(taskTable),
    db.select().from(tappeTable).where(eq(tappeTable.ciclo, ciclo)).orderBy(asc(tappeTable.numero)),
  ]);
  const current = stages.filter((stage) => !stage.chiusa).sort((a, b) => b.giornoFine - a.giornoFine)[0];
  return goals.map((goal) => ({
    ...goal,
    fatto: allTasks.filter((task) => task.obiettivoId === goal.id && task.giornoCompletato !== null).length,
    tappa_corrente: current ? {
      numero: current.numero,
      giorno_inizio: current.giornoInizio,
      giorno_fine: current.giornoFine,
      task: allTasks.filter((task) => task.tappaId === current.id && task.obiettivoId === goal.id)
        .sort((a, b) => a.ordine - b.ordine || a.id - b.id).map(taskPayload),
    } : null,
    tappe_precedenti: stages.filter((stage) => stage.chiusa).map((stage) => {
      const tasks = allTasks.filter((task) => task.tappaId === stage.id && task.obiettivoId === goal.id);
      return { numero: stage.numero, task_fatti: tasks.filter((task) => task.giornoCompletato !== null).length, task_totali: tasks.length };
    }),
  }));
}

router.get("/obiettivi", async (req, res): Promise<void> => {
  try {
    await ensureInitialSeed();
    const active = await currentTappa();
    const ciclo = active?.ciclo ?? 1;
    res.json(ListObiettiviResponse.parse(await goalsPayload(ciclo)));
  } catch (err) {
    req.log.error({ err }, "Unable to list goals");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/tappe/corrente", async (req, res): Promise<void> => {
  try {
    await ensureInitialSeed();
    const tappa = await currentTappa();
    if (!tappa) { res.status(404).json({ error: "Tappa corrente non trovata" }); return; }
    res.json(GetTappaCorrenteResponse.parse(await tappaPayload(tappa)));
  } catch (err) {
    req.log.error({ err }, "Unable to get current stage");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/task/:id/completa", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const params = CompletaObiettivoTaskParams.safeParse(req.params);
  const body = CompletaObiettivoTaskBody.safeParse(req.body);
  if (!params.success || !body.success) { req.log.warn("Invalid task completion request"); res.status(400).json({ error: errorMessage(params.success ? body.error : params.error) }); return; }
  try {
    const [existing] = await db.select().from(taskTable).where(eq(taskTable.id, params.data.id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Task non trovato" }); return; }
    const [task] = await db.update(taskTable).set({
      giornoCompletato: existing.giornoCompletato === null ? body.data.giorno : null,
      saltato: false,
    }).where(eq(taskTable.id, existing.id)).returning();
    res.json(CompletaObiettivoTaskResponse.parse(taskPayload(task)));
  } catch (err) { req.log.error({ err }, "Unable to toggle task"); res.status(500).json({ error: "Errore interno" }); }
});

router.post("/task", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const body = CreateObiettivoTaskBody.safeParse(req.body);
  if (!body.success) { req.log.warn({ errors: body.error.issues }, "Invalid task"); res.status(400).json({ error: body.error.message }); return; }
  try {
    const [task] = await db.insert(taskTable).values({
      obiettivoId: body.data.obiettivo_id, tappaId: body.data.tappa_id, testo: body.data.testo,
      giornoCompletato: body.data.giorno_completato ?? null,
    }).returning();
    res.status(201).json(CreateObiettivoTaskResponse.parse(taskPayload(task)));
  } catch (err) { req.log.error({ err }, "Unable to create task"); res.status(500).json({ error: "Errore interno" }); }
});

router.delete("/task/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const params = DeleteObiettivoTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  try {
    const [task] = await db.delete(taskTable).where(eq(taskTable.id, params.data.id)).returning();
    if (!task) { res.status(404).json({ error: "Task non trovato" }); return; }
    res.status(204).end();
  } catch (err) { req.log.error({ err }, "Unable to delete task"); res.status(500).json({ error: "Errore interno" }); }
});

router.post("/tappe/:id/chiudi", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const params = ChiudiTappaParams.safeParse(req.params);
  const body = ChiudiTappaBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: errorMessage(params.success ? body.error : params.error) }); return; }
  try {
    const next = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(tappeTable).where(and(eq(tappeTable.id, params.data.id), eq(tappeTable.chiusa, false))).limit(1);
      if (!current) return null;
      await tx.update(tappeTable).set({ chiusa: true, nota: body.data.nota }).where(eq(tappeTable.id, current.id));
      await tx.update(taskTable).set({ saltato: true }).where(and(eq(taskTable.tappaId, current.id), isNull(taskTable.giornoCompletato)));
      const [newStage] = await tx.insert(tappeTable).values({
        ciclo: current.ciclo, numero: current.numero + 1, giornoInizio: current.giornoFine + 1, giornoFine: current.giornoFine + 7,
      }).returning();
      const values = body.data.nuove_tappe.flatMap((group) => group.task.map((testo, ordine) => ({
        obiettivoId: group.obiettivo_id, tappaId: newStage.id, testo, ordine,
      })));
      if (values.length) await tx.insert(taskTable).values(values);
      return newStage;
    });
    if (!next) { res.status(404).json({ error: "Tappa corrente non trovata" }); return; }
    res.status(201).json(ChiudiTappaResponse.parse(await tappaPayload(next)));
  } catch (err) { req.log.error({ err }, "Unable to close stage"); res.status(500).json({ error: "Errore interno" }); }
});

router.get("/giorni/:numero/task", async (req, res): Promise<void> => {
  const params = ListTaskGiornoParams.safeParse(req.params);
  if (!params.success || !Number.isInteger(params.data.numero) || params.data.numero < 1) { res.status(400).json({ error: "Giorno non valido" }); return; }
  try {
    const rows = await db.select({ id: taskTable.id, testo: taskTable.testo, giorno_completato: taskTable.giornoCompletato, saltato: taskTable.saltato, area: obiettiviTable.area, titolo: obiettiviTable.titolo })
      .from(taskTable).innerJoin(obiettiviTable, eq(taskTable.obiettivoId, obiettiviTable.id))
      .where(eq(taskTable.giornoCompletato, params.data.numero)).orderBy(asc(taskTable.id));
    res.json(ListTaskGiornoResponse.parse(rows));
  } catch (err) { req.log.error({ err }, "Unable to list daily tasks"); res.status(500).json({ error: "Errore interno" }); }
});

router.put("/obiettivi/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Non autorizzato" }); return; }
  const params = UpdateObiettivoParams.safeParse(req.params);
  const body = UpdateObiettivoBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: errorMessage(params.success ? body.error : params.error) }); return; }
  try {
    const [goal] = await db.update(obiettiviTable).set({ area: body.data.area, titolo: body.data.titolo, previsto: body.data.previsto, giornoLimite: body.data.giorno_limite, prova: body.data.prova, stato: body.data.stato })
      .where(eq(obiettiviTable.id, params.data.id)).returning();
    if (!goal) { res.status(404).json({ error: "Obiettivo non trovato" }); return; }
    const payload = (await goalsPayload(goal.ciclo)).find((item) => item.id === goal.id);
    res.json(UpdateObiettivoResponse.parse(payload));
  } catch (err) { req.log.error({ err }, "Unable to update goal"); res.status(500).json({ error: "Errore interno" }); }
});

export default router;