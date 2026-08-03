import { Router } from "express";
import { desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { contattiTable } from "@workspace/db/schema";
import { notify } from "../lib/notify";

const router = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const { nome, email, tipo, messaggio } = req.body ?? {};

  if (
    typeof nome !== "string" || !nome.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof tipo !== "string" || !tipo.trim() ||
    typeof messaggio !== "string" || !messaggio.trim()
  ) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const [row] = await db.insert(contattiTable).values({
    nome: nome.trim(),
    email: email.trim(),
    tipo: tipo.trim(),
    messaggio: messaggio.trim(),
  }).returning();

  try {
    await notify(
      `Nuovo contatto: ${tipo.trim()} — ${nome.trim()}`,
      `Nome: ${nome.trim()}\nEmail: ${email.trim()}\nTipo: ${tipo.trim()}\n\n${messaggio.trim()}`,
    );
  } catch (error) {
    req.log.error({ err: error }, "Contact notification failed");
  }

  res.status(201).json(row);
});

router.get("/contacts", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select()
    .from(contattiTable)
    .orderBy(desc(contattiTable.createdAt));

  res.json(rows);
});

export default router;
