import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { contattiTable } from "@workspace/db/schema";
import { notify } from "../lib/notify";
import { createRateLimiter } from "../lib/rateLimit";

const router = Router();
const contactRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Troppe richieste. Riprova tra qualche minuto.",
});

router.post("/contact", contactRateLimit, async (req, res): Promise<void> => {
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

router.patch("/contacts/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  const stato = req.body?.stato;
  if (!Number.isInteger(id) || id < 1 || !["nuova", "letta", "gestita"].includes(stato)) {
    res.status(400).json({ error: "Stato non valido" });
    return;
  }

  const [row] = await db
    .update(contattiTable)
    .set({ stato })
    .where(eq(contattiTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Contatto non trovato" });
    return;
  }
  res.json(row);
});

export default router;
