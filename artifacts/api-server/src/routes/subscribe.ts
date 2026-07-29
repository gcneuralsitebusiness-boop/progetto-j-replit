import { Router } from "express";
import { desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { iscrittiTable } from "@workspace/db/schema";

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

export default router;