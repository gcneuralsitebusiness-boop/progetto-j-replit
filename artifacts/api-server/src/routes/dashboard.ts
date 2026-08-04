import { Router, type IRouter } from "express";
import { sql, count, isNull, or } from "drizzle-orm";
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
    missingTestoResult,
    missingFotoResult,
    missingPhysicalResult,
    subscribersResult,
    contactsResult,
  ] = await Promise.all([
    db.select({ numero: giorniTable.numero, data: giorniTable.data, testo: giorniTable.testo, foto: giorniTable.foto }).from(giorniTable),
    db.select({ c: count() }).from(giorniTable).where(isNull(giorniTable.testo)),
    db.select({ c: count() }).from(giorniTable).where(isNull(giorniTable.foto)),
    db.select({ c: count() }).from(giorniTable).where(
      or(isNull(giorniTable.peso), isNull(giorniTable.battito))
    ),
    db.select({ c: count() }).from(iscrittiTable),
    db.select({ c: count() }).from(contattiTable),
  ]);

  const todayEntry = allEntries.find((e) => e.data === todayRome) ?? null;
  const currentDay = allEntries.length > 0 ? Math.max(...allEntries.map((e) => e.numero)) : 0;

  res.json({
    todayDate: todayRome,
    todayEntry,
    currentDay,
    totalEntries: allEntries.length,
    missingTesto: missingTestoResult[0]?.c ?? 0,
    missingFoto: missingFotoResult[0]?.c ?? 0,
    missingPhysical: missingPhysicalResult[0]?.c ?? 0,
    totalSubscribers: subscribersResult[0]?.c ?? 0,
    totalContacts: contactsResult[0]?.c ?? 0,
  });
});

export default router;
