import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { candidatureTable } from "@workspace/db/schema";
import {
  CreateCandidaturaBody,
  ListCandidatureResponse,
  UpdateCandidaturaBody,
  UpdateCandidaturaParams,
  UpdateCandidaturaResponse,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";

const router = Router();

// In-memory rate-limit store: IP -> list of request timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Cleanup stale entries every 10 minutes to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const fresh = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, fresh);
    }
  }
}, 10 * 60 * 1000).unref();

// Validate contatto: email, @handle, or alphanumeric handle (max 120)
function isValidContatto(value: string): boolean {
  if (value.length > 120) return false;
  // Email pattern
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRe.test(value)) return true;
  // Social handle starting with @
  if (value.startsWith("@")) return true;
  // Alphanumeric handle (letters, digits, underscores, dots, hyphens — no spaces)
  const handleRe = /^[A-Za-z0-9._-]+$/;
  if (handleRe.test(value)) return true;
  return false;
}

function sanitize(s: string): string {
  return s.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

router.post("/candidature", async (req, res): Promise<void> => {
  // Rate limiting
  const ip =
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"]) ??
    req.socket.remoteAddress ??
    "unknown";

  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );

  if (timestamps.length >= RATE_LIMIT_MAX) {
    req.log.warn({ ip }, "Candidatura rate limit exceeded");
    res.status(429).json({ error: "Troppi tentativi. Riprova tra un'ora." });
    return;
  }

  // Validate with generated Zod schema
  const parsed = CreateCandidaturaBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid candidatura body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nome, contatto, progetto } = parsed.data;

  // Extra validation: nome nonblank
  if (!nome.trim()) {
    res.status(400).json({ error: "Il nome non può essere vuoto." });
    return;
  }

  // Extra validation: contatto format
  if (!isValidContatto(contatto.trim())) {
    res.status(400).json({
      error:
        "Il contatto deve essere un'email valida, un handle social (@...) o un nome utente alfanumerico.",
    });
    return;
  }

  // Sanitize strings
  const nomeClean = sanitize(nome);
  const contattoClean = sanitize(contatto);
  const progettoClean = sanitize(progetto);

  // Record the timestamp after validation passes
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  const [row] = await db
    .insert(candidatureTable)
    .values({
      nome: nomeClean,
      contatto: contattoClean,
      progetto: progettoClean,
    })
    .returning();

  await notify(
    `Nuova candidatura: ${nomeClean}`,
    `Nome: ${nomeClean}\nContatto: ${contattoClean}\n\n${progettoClean}`,
  );

  req.log.info({ id: row.id }, "Candidatura created");
  res.status(201).json(row);
});

router.get("/candidature", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select()
    .from(candidatureTable)
    .orderBy(desc(candidatureTable.createdAt));

  res.json(ListCandidatureResponse.parse(rows));
});

router.patch("/candidature/:id", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateCandidaturaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCandidaturaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(candidatureTable)
    .set({ stato: parsed.data.stato })
    .where(eq(candidatureTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Candidatura non trovata." });
    return;
  }

  res.json(UpdateCandidaturaResponse.parse(row));
});

export default router;
