import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, bozzeTable } from "@workspace/db";

const router: IRouter = Router();
router.use("/admin/drafts", (req, res, next) => {
  const fase = Number(req.query.fase ?? req.body?.fase ?? 1);
  if (fase !== 1 && fase !== 2) { res.status(400).json({ error: "Fase non valida" }); return; }
  res.locals.fase = fase;
  next();
});

// GET /admin/drafts/:numero — get draft for a diary entry (admin only)
router.get("/admin/drafts/:numero", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const numero = Number(req.params.numero);
  if (!Number.isInteger(numero) || numero < 1) {
    res.status(400).json({ error: "Invalid numero" });
    return;
  }

  const [draft] = await db
    .select()
    .from(bozzeTable)
    .where(and(eq(bozzeTable.fase, res.locals.fase), eq(bozzeTable.numero, numero)));

  if (!draft) {
    res.status(404).json({ error: "Draft not found" });
    return;
  }

  res.json(draft);
});

// POST /admin/drafts — upsert draft (admin only)
router.post("/admin/drafts", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { numero, formJson } = req.body ?? {};
  if (!Number.isInteger(numero) || numero < 1) {
    res.status(400).json({ error: "numero must be a positive integer" });
    return;
  }
  if (typeof formJson !== "object" || formJson === null) {
    res.status(400).json({ error: "formJson must be an object" });
    return;
  }

  const [draft] = await db
    .insert(bozzeTable)
    .values({ numero, fase: res.locals.fase, dati: formJson, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [bozzeTable.fase, bozzeTable.numero],
      set: { dati: formJson, updatedAt: new Date() },
    })
    .returning();

  res.json(draft);
});

// DELETE /admin/drafts/:numero — delete draft on successful save (admin only)
router.delete("/admin/drafts/:numero", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const numero = Number(req.params.numero);
  if (!Number.isInteger(numero) || numero < 1) {
    res.status(400).json({ error: "Invalid numero" });
    return;
  }

  await db.delete(bozzeTable).where(and(eq(bozzeTable.fase, res.locals.fase), eq(bozzeTable.numero, numero)));
  res.sendStatus(204);
});

export default router;
