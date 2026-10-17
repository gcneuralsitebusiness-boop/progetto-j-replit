import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, liveStateTable, programmaTable } from "@workspace/db";

const router: IRouter = Router();
const activities = ["SONNO", "LAVORO", "ALLENAMENTO", "LIBERO"] as const;
type Activity = typeof activities[number];
const activityName: Record<Activity, string> = {
  SONNO: "DORME",
  LAVORO: "IN QUOTA",
  ALLENAMENTO: "SUL RING",
  LIBERO: "FUORI SERVIZIO",
};
const weekdays = [
  [["00:00", "06:00", "SONNO"], ["06:00", "07:00", "LIBERO"], ["07:00", "17:00", "LAVORO"], ["17:00", "19:00", "LIBERO"], ["19:00", "20:30", "ALLENAMENTO"], ["20:30", "23:00", "LIBERO"], ["23:00", "24:00", "SONNO"]],
  [["00:00", "06:00", "SONNO"], ["06:00", "07:00", "LIBERO"], ["07:00", "17:00", "LAVORO"], ["17:00", "19:00", "LIBERO"], ["19:00", "20:30", "ALLENAMENTO"], ["20:30", "23:00", "LIBERO"], ["23:00", "24:00", "SONNO"]],
  [["00:00", "06:00", "SONNO"], ["06:00", "07:00", "LIBERO"], ["07:00", "17:00", "LAVORO"], ["17:00", "19:00", "LIBERO"], ["19:00", "20:30", "ALLENAMENTO"], ["20:30", "23:00", "LIBERO"], ["23:00", "24:00", "SONNO"]],
  [["00:00", "06:00", "SONNO"], ["06:00", "07:00", "LIBERO"], ["07:00", "17:00", "LAVORO"], ["17:00", "19:00", "LIBERO"], ["19:00", "20:30", "ALLENAMENTO"], ["20:30", "23:00", "LIBERO"], ["23:00", "24:00", "SONNO"]],
  [["00:00", "06:00", "SONNO"], ["06:00", "07:00", "LIBERO"], ["07:00", "17:00", "LAVORO"], ["17:00", "19:00", "LIBERO"], ["19:00", "20:30", "ALLENAMENTO"], ["20:30", "23:00", "LIBERO"], ["23:00", "24:00", "SONNO"]],
  [["00:00", "08:00", "SONNO"], ["08:00", "23:00", "LIBERO"], ["23:00", "24:00", "SONNO"]],
  [["00:00", "08:00", "SONNO"], ["08:00", "23:00", "LIBERO"], ["23:00", "24:00", "SONNO"]],
] as const;

function romeClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const weekday = ({ Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 } as Record<string, number>)[p.weekday] ?? 0;
  return { weekday, minute: Number(p.hour) * 60 + Number(p.minute), time: `${p.hour}:${p.minute}` };
}
function minutes(time: string) { const [h, m] = time.split(":").map(Number); return h * 60 + (m ?? 0); }
function isActivity(value: unknown): value is Activity { return activities.includes(value as Activity); }
function isClock(value: unknown): value is string { return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value); }

const defaultProgram = weekdays
  .flatMap((day, giorno) => day.map(([inizio, fine, attivita]) => ({ giorno, inizio, fine, attivita })))
  .map((item, index) => ({ ...item, id: -(index + 1) }));
const adminOnly = (req: { session?: { adminAuthenticated?: boolean } }, res: { status(code: number): { json(value: unknown): void } }) => {
  if (req.session?.adminAuthenticated) return false;
  res.status(401).json({ error: "Unauthorized" });
  return true;
};
const getState = async () => (await db.select().from(liveStateTable).where(eq(liveStateTable.id, 1)).limit(1))[0];

router.get("/live", async (_req, res): Promise<void> => {
  const now = new Date();
  const local = romeClock(now);
  const state = await getState();
  const storedProgram = await db.select().from(programmaTable).orderBy(asc(programmaTable.giorno), asc(programmaTable.inizio));
  const program = storedProgram.length ? storedProgram : defaultProgram;
  const today = program.filter((block) => block.giorno === local.weekday).sort((a, b) => minutes(a.inizio) - minutes(b.inizio));
  const current = today.find((block) => minutes(block.inizio) <= local.minute && minutes(block.fine) > local.minute);
  const nextSameDay = today.find((block) => minutes(block.inizio) > local.minute);
  const tomorrow = nextSameDay ? null : program.filter((block) => block.giorno === (local.weekday + 1) % 7).sort((a, b) => minutes(a.inizio) - minutes(b.inizio));
  const next = nextSameDay ?? tomorrow?.[0];
  const hasOverride = Boolean(state?.override && isActivity(state.override) && state.overrideFino && state.overrideFino > now);
  const actual = hasOverride ? state!.override as Activity : current?.attivita as Activity ?? "LIBERO";
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=15");
  res.json({
    attivita: actual,
    nome: activityName[actual],
    da: hasOverride && state?.aggiornato ? romeClock(state.aggiornato).time : current?.inizio ?? local.time,
    prossima: next ? { attivita: next.attivita, nome: activityName[next.attivita as Activity], inizio: next.inizio } : null,
    sensore: "offline",
    ora: local.time,
    giorno: local.weekday,
    programma: today,
    overrideFino: hasOverride ? state?.overrideFino?.toISOString() : null,
  });
});

router.get("/admin/live/programma", async (req, res): Promise<void> => {
  if (adminOnly(req, res)) return;
  const storedProgram = await db.select().from(programmaTable).orderBy(asc(programmaTable.giorno), asc(programmaTable.inizio));
  res.setHeader("Cache-Control", "private, no-store");
  res.json(storedProgram.length ? storedProgram : defaultProgram.map((item, index) => ({ ...item, id: -(index + 1) })));
});
router.put("/admin/live/programma", async (req, res): Promise<void> => {
  if (adminOnly(req, res)) return;
  const schedule = req.body?.programma;
  if (!Array.isArray(schedule) || schedule.length < 7 || schedule.length > 60) {
    res.status(400).json({ error: "Il programma deve coprire tutti i giorni della settimana." }); return;
  }
  const valid = schedule.every((s: any) => Number.isInteger(s.giorno) && s.giorno >= 0 && s.giorno <= 6 && isClock(s.inizio) &&
    (s.fine === "24:00" || isClock(s.fine)) && isActivity(s.attivita) && minutes(s.fine) > minutes(s.inizio));
  if (!valid) { res.status(400).json({ error: "Intervallo o attività non validi." }); return; }
  for (let day = 0; day < 7; day++) {
    const blocks = schedule.filter((s: any) => s.giorno === day).sort((a: any, b: any) => minutes(a.inizio) - minutes(b.inizio));
    if (!blocks.length || minutes(blocks[0].inizio) !== 0 || minutes(blocks.at(-1).fine) !== 1440 ||
      blocks.some((block: any, index: number) => index > 0 && minutes(block.inizio) !== minutes(blocks[index - 1].fine))) {
      res.status(400).json({ error: `Il programma del giorno ${day} deve coprire le 24 ore senza intervalli o sovrapposizioni.` }); return;
    }
  }
  const saved = await db.transaction(async (tx) => {
    await tx.delete(programmaTable);
    return tx.insert(programmaTable).values(schedule.map((s: any) => ({ giorno: s.giorno, inizio: s.inizio, fine: s.fine, attivita: s.attivita }))).returning();
  });
  res.json(saved);
});
router.put("/admin/live/override", async (req, res): Promise<void> => {
  if (adminOnly(req, res)) return;
  if (!isActivity(req.body?.attivita)) { res.status(400).json({ error: "Attività non valida." }); return; }
  const now = new Date();
  const [state] = await db.insert(liveStateTable).values({ id: 1, override: req.body.attivita, overrideFino: new Date(now.getTime() + 3 * 60 * 60_000), aggiornato: now })
    .onConflictDoUpdate({ target: liveStateTable.id, set: { override: req.body.attivita, overrideFino: new Date(now.getTime() + 3 * 60 * 60_000), aggiornato: now } }).returning();
  res.json(state);
});
router.delete("/admin/live/override", async (req, res): Promise<void> => {
  if (adminOnly(req, res)) return;
  const [state] = await db.update(liveStateTable).set({ override: null, overrideFino: null, aggiornato: new Date() }).where(eq(liveStateTable.id, 1)).returning();
  res.json(state);
});
export default router;
