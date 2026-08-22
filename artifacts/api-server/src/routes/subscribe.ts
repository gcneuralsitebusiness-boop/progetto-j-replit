import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { iscrittiTable } from "@workspace/db/schema";
import { notify } from "../lib/notify";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/subscribe", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!emailPattern.test(email)) {
    res.status(400).json({ error: "Inserisci un indirizzo email valido." });
    return;
  }

  try {
    const [row] = await db.insert(iscrittiTable).values({ email }).returning();
    try {
      await notify(
        "Nuova iscrizione newsletter",
        `Nuovo indirizzo iscritto: ${email}`,
      );
    } catch (error) {
      req.log.error({ err: error }, "Subscription notification failed");
    }
    res.status(201).json(row);
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Questa email è già iscritta." });
      return;
    }
    res.status(500).json({ error: "Impossibile completare l'iscrizione." });
  }
});

router.get("/subscribers", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db.select().from(iscrittiTable).orderBy(desc(iscrittiTable.createdAt));
  res.json(rows);
});

router.delete("/subscribers/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Iscritto non valido" });
    return;
  }

  const [row] = await db
    .delete(iscrittiTable)
    .where(eq(iscrittiTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Iscritto non trovato" });
    return;
  }

  res.json({ ok: true, id: row.id });
});

export default router;