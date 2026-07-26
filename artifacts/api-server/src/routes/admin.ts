import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  AdminMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /admin/me — check session status
router.get("/admin/me", async (req, res): Promise<void> => {
  const authenticated = req.session?.adminAuthenticated === true;
  res.json(AdminMeResponse.parse({ authenticated }));
});

// POST /admin/login — authenticate with password
router.post("/admin/login", async (req, res): Promise<void> => {
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
    res.status(401).json({ error: "Password errata" });
    return;
  }

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
