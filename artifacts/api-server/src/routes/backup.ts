import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  giorniTable,
  contenutiTable,
  pagineTable,
  socialTable,
  sponsorTable,
  articoliTable,
  coachingTable,
  contattiTable,
  iscrittiTable,
} from "@workspace/db";

const router: IRouter = Router();

// GET /admin/backup — full database export (admin only)
router.get("/admin/backup", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [
    giorni,
    contenuti,
    pagine,
    social,
    sponsor,
    articoli,
    coaching,
    contatti,
    iscritti,
  ] = await Promise.all([
    db.select().from(giorniTable),
    db.select().from(contenutiTable),
    db.select().from(pagineTable),
    db.select().from(socialTable),
    db.select().from(sponsorTable),
    db.select().from(articoliTable),
    db.select().from(coachingTable),
    db.select().from(contattiTable),
    db.select().from(iscrittiTable),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    giorni,
    contenuti,
    pagine,
    social,
    sponsor,
    articoli,
    coaching,
    contatti,
    iscritti,
  };

  const date = new Date().toISOString().split("T")[0];
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="progetto-j-backup-${date}.json"`);
  res.json(backup);
});

export default router;
