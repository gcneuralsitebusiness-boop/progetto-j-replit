import { Router, type IRouter } from "express";
import { count, eq } from "drizzle-orm";
import { db, giorniTable, contattiTable, iscrittiTable } from "@workspace/db";

const router: IRouter = Router();

// GET /admin/dashboard — summary stats for the OGGI tab (admin only)
router.get("/admin/dashboard", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Today's date in Europe/Rome
  const todayRome = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });

  const [
    allEntries,
    subscribersResult,
    contactsResult,
  ] = await Promise.all([
    db.select({
      numero: giorniTable.numero,
      data: giorniTable.data,
      testo: giorniTable.testo,
      foto: giorniTable.foto,
      peso: giorniTable.peso,
      battito: giorniTable.battito,
    }).from(giorniTable).where(eq(giorniTable.fase, 1)),
    db.select({ c: count() }).from(iscrittiTable),
    db.select({ c: count() }).from(contattiTable),
  ]);

  const todayEntry = allEntries.find((e) => e.data === todayRome) ?? null;
  const currentDay = allEntries.length > 0 ? Math.max(...allEntries.map((e) => e.numero)) : 0;
  const missingDays = {
    testo: allEntries.filter((entry) => !entry.testo?.trim()).map((entry) => entry.numero),
    foto: allEntries.filter((entry) => !entry.foto?.trim()).map((entry) => entry.numero),
    physical: allEntries
      .filter((entry) => entry.peso == null || entry.battito == null)
      .map((entry) => entry.numero),
  };

  res.json({
    todayDate: todayRome,
    todayEntry,
    currentDay,
    totalEntries: allEntries.length,
    missingTesto: missingDays.testo.length,
    missingFoto: missingDays.foto.length,
    missingPhysical: missingDays.physical.length,
    missingDays,
    totalSubscribers: subscribersResult[0]?.c ?? 0,
    totalContacts: contactsResult[0]?.c ?? 0,
    // Backup status is loaded independently through /admin/backup/status.
    // Object-storage latency must not block opening the daily editor.
    backup: null,
  });
});

export default router;
