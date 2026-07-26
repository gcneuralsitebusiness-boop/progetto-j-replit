import { Router } from "express";
import { db } from "@workspace/db";
import { socialTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/social", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(socialTable)
    .where(eq(socialTable.visibile, true))
    .orderBy(socialTable.ordine, socialTable.nome);
  res.json(rows);
});

router.post("/social", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { nome, url, icona, descrizione, ordine, visibile } = req.body;
  if (!nome || !url || typeof nome !== "string" || typeof url !== "string") {
    res.status(400).json({ error: "nome and url are required" });
    return;
  }

  const [row] = await db
    .insert(socialTable)
    .values({
      nome,
      url,
      icona: typeof icona === "string" ? icona : "Instagram",
      descrizione: typeof descrizione === "string" ? descrizione : "",
      ordine: typeof ordine === "number" ? ordine : 0,
      visibile: typeof visibile === "boolean" ? visibile : true,
      updatedAt: new Date(),
    })
    .returning();
  res.status(201).json(row);
});

router.put("/social/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const updates: Partial<typeof socialTable.$inferInsert> = {};
  for (const key of ["nome", "url", "icona", "descrizione"] as const) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.ordine !== undefined) updates.ordine = req.body.ordine;
  if (req.body.visibile !== undefined) updates.visibile = req.body.visibile;
  updates.updatedAt = new Date();

  const [row] = await db.update(socialTable).set(updates).where(eq(socialTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/social/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(socialTable).where(eq(socialTable.id, id));
  res.sendStatus(204);
});

export default router;
