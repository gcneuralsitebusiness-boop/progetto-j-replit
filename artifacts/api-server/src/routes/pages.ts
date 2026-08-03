import { Router } from "express";
import { db } from "@workspace/db";
import { pagineTable } from "@workspace/db/schema";
import { and, asc, eq } from "drizzle-orm";

const router = Router();

router.get("/pages", async (req, res): Promise<void> => {
  const isAdmin = req.session?.adminAuthenticated === true;
  const rows = await db
    .select()
    .from(pagineTable)
    .where(isAdmin ? undefined : eq(pagineTable.pubblicata, true))
    .orderBy(asc(pagineTable.ordine), asc(pagineTable.createdAt));
  res.json(rows);
});

router.get("/pages/:slug", async (req, res): Promise<void> => {
  const isAdmin = req.session?.adminAuthenticated === true;
  const [row] = await db
    .select()
    .from(pagineTable)
    .where(
      isAdmin
        ? eq(pagineTable.slug, req.params.slug)
        : and(
            eq(pagineTable.slug, req.params.slug),
            eq(pagineTable.pubblicata, true),
          ),
    )
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json(row);
});

router.post("/pages", async (req, res): Promise<void> => {
  if (!req.session.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { slug, titolo, contenuto = "", pubblicata = false, ordine = 0 } = req.body ?? {};
  if (!slug || typeof slug !== "string" || !titolo || typeof titolo !== "string") {
    res.status(400).json({ error: "slug and titolo are required strings" });
    return;
  }

  try {
    const [row] = await db
      .insert(pagineTable)
      .values({ slug, titolo, contenuto: String(contenuto), pubblicata: Boolean(pubblicata), ordine: Number(ordine) })
      .returning();
    res.status(201).json(row);
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "Slug already exists" });
      return;
    }
    throw e;
  }
});

router.patch("/pages/:slug", async (req, res): Promise<void> => {
  if (!req.session.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [existing] = await db
    .select()
    .from(pagineTable)
    .where(eq(pagineTable.slug, req.params.slug))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const { slug, titolo, contenuto, pubblicata, ordine } = req.body ?? {};
  const updates: Partial<typeof existing> = { updatedAt: new Date() };
  if (slug !== undefined) updates.slug = String(slug);
  if (titolo !== undefined) updates.titolo = String(titolo);
  if (contenuto !== undefined) updates.contenuto = String(contenuto);
  if (pubblicata !== undefined) updates.pubblicata = Boolean(pubblicata);
  if (ordine !== undefined) updates.ordine = Number(ordine);

  const [updated] = await db
    .update(pagineTable)
    .set(updates)
    .where(eq(pagineTable.slug, req.params.slug))
    .returning();

  res.json(updated);
});

router.delete("/pages/:slug", async (req, res): Promise<void> => {
  if (!req.session.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [existing] = await db
    .select()
    .from(pagineTable)
    .where(eq(pagineTable.slug, req.params.slug))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  await db.delete(pagineTable).where(eq(pagineTable.slug, req.params.slug));
  res.status(204).end();
});

export default router;
