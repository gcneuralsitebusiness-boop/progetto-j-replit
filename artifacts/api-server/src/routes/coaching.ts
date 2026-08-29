import { Router } from "express";
import { db } from "@workspace/db";
import { coachingTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { isHttpsUrlOrEmpty } from "../lib/validation";

const router = Router();

router.get("/coaching", async (_req, res): Promise<void> => {
  const rows = await db.select().from(coachingTable);
  const coaching = rows[0] ?? {
    id: 1,
    heroTitolo: "PROTOCOLLO COACHING",
    heroSottotitolo: "Dimagrimento. Disciplina. Dati.",
    descrizione: "",
    communityCta: "Entra nella community italiana e trova gente con la tua stessa fame.",
    communityUrl: "#",
    email: "contatto@projectj180day.com",
    visibile: true,
  };
  res.json(coaching);
});

router.put("/coaching", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db.select().from(coachingTable);
  const updates: Partial<typeof coachingTable.$inferInsert> = {};
  for (const key of ["heroTitolo", "heroSottotitolo", "descrizione", "communityCta", "communityUrl", "email"] as const) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.communityUrl !== undefined &&
      req.body.communityUrl !== "" &&
      req.body.communityUrl !== "#" &&
      !isHttpsUrlOrEmpty(req.body.communityUrl)) {
    res.status(400).json({ error: "communityUrl must use HTTPS" });
    return;
  }
  if (req.body.visibile !== undefined) updates.visibile = req.body.visibile;
  updates.updatedAt = new Date();

  let row;
  if (rows.length > 0) {
    [row] = await db.update(coachingTable).set(updates).where(eq(coachingTable.id, rows[0].id)).returning();
  } else {
    [row] = await db.insert(coachingTable).values({ ...updates }).returning();
  }
  res.json(row);
});

export default router;
