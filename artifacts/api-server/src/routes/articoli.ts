import { Router } from "express";
import { db } from "@workspace/db";
import { articoliTable } from "@workspace/db/schema";
import { isArticleCategory, isLegacyArticleCategory, normalizeArticleCategory } from "../constants/articleCategories";
import { eq, and } from "drizzle-orm";

const router = Router();

/** Validate Instagram card customization fields. Returns an error message or null. */
export function validateCardFields(body: Record<string, unknown>): string | null {
  const { cardTitolo, cardSottotitolo, cardOverlay, cardMostraParole, cardImmagine } = body;
  if (cardTitolo !== undefined && cardTitolo !== null) {
    if (typeof cardTitolo !== "string" || cardTitolo.length > 60) return "Il titolo card può avere al massimo 60 caratteri.";
  }
  if (cardSottotitolo !== undefined && cardSottotitolo !== null) {
    if (typeof cardSottotitolo !== "string" || cardSottotitolo.length > 24) return "Il sottotitolo card può avere al massimo 24 caratteri.";
  }
  if (cardImmagine !== undefined && cardImmagine !== null && typeof cardImmagine !== "string") {
    return "Immagine card non valida.";
  }
  if (cardOverlay !== undefined && cardOverlay !== null) {
    const n = Number(cardOverlay);
    if (!Number.isInteger(n) || n < 30 || n > 90) return "L'overlay deve essere un intero tra 30 e 90.";
  }
  if (cardMostraParole !== undefined && cardMostraParole !== null && typeof cardMostraParole !== "boolean") {
    return "cardMostraParole deve essere booleano.";
  }
  return null;
}

router.get("/articles", async (req, res): Promise<void> => {
  const query = db.select().from(articoliTable).orderBy(articoliTable.data);
  const rows = await (req.session?.adminAuthenticated
    ? query
    : query.where(eq(articoliTable.pubblicato, true)));
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

// GET /admin/articles/:slug/preview — admin-only, returns any article (draft or published)
router.get("/admin/articles/:slug/preview", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const slug = req.params.slug;
  const [row] = await db
    .select()
    .from(articoliTable)
    .where(eq(articoliTable.slug, slug))
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
    res.status(400).json({ error: "Slug e titolo sono obbligatori." });
    return;
  }
  if (!isArticleCategory(categoria) && !isLegacyArticleCategory(categoria)) {
    res.status(400).json({ error: "Seleziona una categoria valida." });
    return;
  }

  const [row] = await db
    .insert(articoliTable)
    .values({
      slug,
      titolo,
      categoria: normalizeArticleCategory(categoria),
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

  if (req.body.categoria !== undefined && !isArticleCategory(req.body.categoria) && !isLegacyArticleCategory(req.body.categoria)) {
    res.status(400).json({ error: "Seleziona una categoria valida." });
    return;
  }

  // Card customization fields: nullable, validated, never touching published content
  const cardError = validateCardFields(req.body);
  if (cardError) {
    res.status(400).json({ error: cardError });
    return;
  }

  const updates: Partial<typeof articoliTable.$inferInsert> = {};
  for (const key of ["slug", "titolo", "categoria", "contenuto", "immagine", "data"] as const) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.categoria !== undefined) updates.categoria = normalizeArticleCategory(req.body.categoria);
  for (const key of ["cardTitolo", "cardSottotitolo", "cardImmagine"] as const) {
    if (req.body[key] !== undefined) updates[key] = req.body[key] === null ? null : String(req.body[key]);
  }
  if (req.body.cardOverlay !== undefined) {
    updates.cardOverlay = req.body.cardOverlay === null ? null : Number(req.body.cardOverlay);
  }
  if (req.body.cardMostraParole !== undefined) {
    updates.cardMostraParole = req.body.cardMostraParole === null ? null : Boolean(req.body.cardMostraParole);
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
