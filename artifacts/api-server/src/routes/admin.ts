import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  AdminMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const failedLogins = new Map<string, { count: number; firstAttemptAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// GET /admin/me — check session status
router.get("/admin/me", async (req, res): Promise<void> => {
  const authenticated = req.session?.adminAuthenticated === true;
  res.json(AdminMeResponse.parse({ authenticated }));
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
  req.session.adminAuthenticated = true;
  res.json(AdminLoginResponse.parse({ authenticated: true }));
});

// POST /admin/logout — clear session
router.post("/admin/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json(AdminLogoutResponse.parse({ authenticated: false }));
  });
});

export default router;
