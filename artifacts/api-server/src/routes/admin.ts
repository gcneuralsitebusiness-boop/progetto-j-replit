import { Router, type IRouter } from "express";
import { and, eq, gte, lt } from "drizzle-orm";
import { db, giorniTable } from "@workspace/db";
import {
  GetAdminEntryParams,
  GetAdminEntryQueryParams,
  GetAdminEntryResponse,
  GetAdminWeeklyGoalsResponse,
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  AdminMeResponse,
} from "@workspace/api-zod";
import { buildAdminGoals, getAdminGoalsQueryRange, getRomeCalendarDate } from "../lib/adminGoals";

const router: IRouter = Router();
const failedLogins = new Map<string, { count: number; firstAttemptAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// GET /admin/me — check session status
router.get("/admin/me", async (req, res): Promise<void> => {
  const authenticated = req.session?.adminAuthenticated === true;
  res.json(AdminMeResponse.parse({ authenticated }));
});

router.get("/admin/entries/:numero", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetAdminEntryParams.safeParse(req.params);
  const query = GetAdminEntryQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(400).json({ error: "Numero o fase non validi" });
    return;
  }

  const [row] = await db.select().from(giorniTable)
    .where(and(eq(giorniTable.fase, query.data.fase), eq(giorniTable.numero, params.data.numero)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(GetAdminEntryResponse.parse(JSON.parse(JSON.stringify(row))));
});

router.get("/admin/weekly-goals", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const today = getRomeCalendarDate();
    const range = getAdminGoalsQueryRange(today);
    const entries = await db.select({
      data: giorniTable.data,
      flessioni: giorniTable.flessioni,
      squat: giorniTable.squat,
      addominali: giorniTable.addominali,
      shadowMinuti: giorniTable.shadowMinuti,
      allenamentoTecnica: giorniTable.allenamentoTecnica,
      allenamentoPesi: giorniTable.allenamentoPesi,
      sparringFatto: giorniTable.sparringFatto,
      pagineBibbia: giorniTable.pagineBibbia,
      pagineLibro: giorniTable.pagineLibro,
      diarioFatto: giorniTable.diarioFatto,
      brainstormingArticoli: giorniTable.brainstormingArticoli,
      dentiVolte: giorniTable.dentiVolte,
      doccia: giorniTable.doccia,
      kcalColazione: giorniTable.kcalColazione,
      kcalPranzo: giorniTable.kcalPranzo,
      kcalCena: giorniTable.kcalCena,
      km: giorniTable.km,
      videoPubblicati: giorniTable.videoPubblicati,
      caroselliPubblicati: giorniTable.caroselliPubblicati,
      youtubePubblicati: giorniTable.youtubePubblicati,
      entrate: giorniTable.entrate,
      entrateOnline: giorniTable.entrateOnline,
      fondoEmergenza: giorniTable.fondoEmergenza,
      investimento: giorniTable.investimento,
      uscite: giorniTable.uscite,
    }).from(giorniTable).where(and(
      eq(giorniTable.fase, 2),
      gte(giorniTable.data, range.from),
      lt(giorniTable.data, range.toExclusive),
    ));
    res.json(GetAdminWeeklyGoalsResponse.parse(buildAdminGoals(entries, today)));
  } catch (err) {
    req.log.error({ err }, "Failed to calculate admin weekly goals");
    res.status(500).json({ error: "Impossibile calcolare gli obiettivi" });
  }
});

// POST /admin/login — authenticate with password
router.post("/admin/login", async (req, res): Promise<void> => {
  const now = Date.now();
  for (const [ip, attempt] of failedLogins) {
    if (now - attempt.firstAttemptAt >= RATE_LIMIT_WINDOW_MS) {
      failedLogins.delete(ip);
    }
  }
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const attempt = failedLogins.get(ip);
  if (attempt && attempt.count >= MAX_FAILED_ATTEMPTS) {
    res.status(429).json({ error: "Troppi tentativi. Riprova più tardi." });
    return;
  }

  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD environment variable is not set");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (parsed.data.password !== adminPassword) {
    const current = failedLogins.get(ip);
    if (!current || now - current.firstAttemptAt >= RATE_LIMIT_WINDOW_MS) {
      failedLogins.set(ip, { count: 1, firstAttemptAt: now });
    } else {
      current.count += 1;
    }
    res.status(401).json({ error: "Password errata" });
    return;
  }

  failedLogins.delete(ip);
  req.session.regenerate((error) => {
    if (error) {
      req.log.error({ err: error }, "Failed to regenerate admin session");
      res.status(500).json({ error: "Impossibile creare una sessione sicura." });
      return;
    }
    req.session.adminAuthenticated = true;
    res.json(AdminLoginResponse.parse({ authenticated: true }));
  });
});

// POST /admin/logout — clear session
router.post("/admin/logout", async (req, res): Promise<void> => {
  req.session.destroy((error) => {
    if (error) {
      req.log.error({ err: error }, "Failed to destroy admin session");
      res.status(500).json({ error: "Impossibile chiudere la sessione." });
      return;
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json(AdminLogoutResponse.parse({ authenticated: false }));
  });
});

export default router;
