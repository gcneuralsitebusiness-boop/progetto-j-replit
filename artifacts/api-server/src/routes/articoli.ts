import { Router } from "express";
import { db } from "@workspace/db";
import { articoliTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/articles", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(articoliTable)
    .where(eq(articoliTable.pubblicato, true))
    .orderBy(articoliTable.data);
  res.json(rows);
});

router.get("/articles/:slug", async (req, res): Promise<void> => {
  const slug = req.params.slug;
  const [row] = await db
    .select()
    .from(articoliTable)
    .where(and(eq(articoliTable.slug, slug), eq(articoliTable.pubblicato, true)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.post("/articles", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { slug, titolo, categoria, contenuto, immagine, pubblicato, data } = req.body;
  if (!slug || !titolo || typeof slug !== "string" || typeof titolo !== "string") {
    res.status(400).json({ error: "slug and titolo are required" });
    return;
  }

  const [row] = await db
    .insert(articoliTable)
    .values({
      slug,
      titolo,
      categoria: typeof categoria === "string" ? categoria : "Generale",
      contenuto: typeof contenuto === "string" ? contenuto : "",
      immagine: typeof immagine === "string" ? immagine : null,
      pubblicato: typeof pubblicato === "boolean" ? pubblicato : false,
      data: typeof data === "string" ? data : new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .returning();
  res.status(201).json(row);
});

router.put("/articles/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const updates: Partial<typeof articoliTable.$inferInsert> = {};
  for (const key of ["slug", "titolo", "categoria", "contenuto", "immagine", "data"] as const) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.pubblicato !== undefined) updates.pubblicato = req.body.pubblicato;
  updates.updatedAt = new Date();

  const [row] = await db.update(articoliTable).set(updates).where(eq(articoliTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/articles/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(articoliTable).where(eq(articoliTable.id, id));
  res.sendStatus(204);
});

export default router;
