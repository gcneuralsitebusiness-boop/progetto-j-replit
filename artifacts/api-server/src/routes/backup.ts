import { Router, type IRouter } from "express";
import {
  generateBackupPayload,
  getLatestBackupStatus,
  runAutomaticBackup,
} from "../lib/backupService";

const router: IRouter = Router();

// GET /admin/backup — full database export (admin only)
router.get("/admin/backup", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const backup = await generateBackupPayload();
    const date = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="progetto-j-backup-${date}.json"`);
    res.json(backup);
  } catch (error) {
    req.log.error({ err: error }, "Backup export failed");
    res.status(500).json({ error: "Impossibile creare il backup." });
  }
});

router.get("/admin/backup/status", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    res.json({ backup: await getLatestBackupStatus() });
  } catch (error) {
    req.log.error({ err: error }, "Backup status lookup failed");
    res.status(500).json({ error: "Impossibile leggere lo stato del backup." });
  }
});

router.post("/admin/backup/run", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await runAutomaticBackup();
    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Manual backup run failed");
    res.status(500).json({ error: "Impossibile completare il backup." });
  }
});

export default router;
