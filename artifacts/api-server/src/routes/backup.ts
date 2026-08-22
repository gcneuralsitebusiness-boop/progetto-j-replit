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

  let datasets;
  try {
    datasets = await Promise.all([
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
  } catch (error) {
    req.log.error({ err: error }, "Backup export failed");
    res.status(500).json({ error: "Impossibile creare il backup." });
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
  ] = datasets;

  const backup = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 2,
    summary: {
      giorni: giorni.length,
      contenuti: contenuti.length,
      pagine: pagine.length,
      social: social.length,
      sponsor: sponsor.length,
      articoli: articoli.length,
      coaching: coaching.length,
      contatti: contatti.length,
      iscritti: iscritti.length,
    },
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
