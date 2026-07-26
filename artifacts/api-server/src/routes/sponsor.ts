import { Router } from "express";
import { db } from "@workspace/db";
import { sponsorTable, sponsorLevels } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/sponsors", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(sponsorTable)
    .where(eq(sponsorTable.visibile, true))
    .orderBy(sponsorTable.ordine, sponsorTable.nome);
  res.json(rows);
});

router.post("/sponsors", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { nome, descrizione, url, logo, livello, ordine, visibile } = req.body;
  if (!nome || typeof nome !== "string") {
    res.status(400).json({ error: "nome is required" });
    return;
  }

  const [row] = await db
    .insert(sponsorTable)
    .values({
      nome,
      descrizione: typeof descrizione === "string" ? descrizione : "",
      url: typeof url === "string" ? url : "",
      logo: typeof logo === "string" ? logo : null,
      livello: sponsorLevels.includes(livello) ? livello : "Bronze",
      ordine: typeof ordine === "number" ? ordine : 0,
      visibile: typeof visibile === "boolean" ? visibile : true,
      updatedAt: new Date(),
    })
    .returning();
  res.status(201).json(row);
});

router.put("/sponsors/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const updates: Partial<typeof sponsorTable.$inferInsert> = {};
  for (const key of ["nome", "descrizione", "url", "logo"] as const) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.livello !== undefined && sponsorLevels.includes(req.body.livello)) {
    updates.livello = req.body.livello;
  }
  if (req.body.ordine !== undefined) updates.ordine = req.body.ordine;
  if (req.body.visibile !== undefined) updates.visibile = req.body.visibile;
  updates.updatedAt = new Date();

  const [row] = await db.update(sponsorTable).set(updates).where(eq(sponsorTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/sponsors/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(sponsorTable).where(eq(sponsorTable.id, id));
  res.sendStatus(204);
});

export default router;
