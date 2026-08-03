import { eq, sql } from "drizzle-orm";
import { db, giorniTable } from "@workspace/db";
import { logger } from "./logger";

const MAX_BACKFILL_DAYS = 30;

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export async function ensureTodayEntry() {
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
  }).format(now);

  const [{ maxData, maxNumero }] = await db
    .select({
      maxData: sql<string | null>`MAX(${giorniTable.data})`,
      maxNumero: sql<number>`COALESCE(MAX(${giorniTable.numero}), 0)`,
    })
    .from(giorniTable);

  const lastDate = maxData ?? today;
  const gap = Math.max(
    0,
    Math.floor(
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDate}T00:00:00Z`)) /
        86_400_000,
    ),
  );
  const daysToCreate = Math.min(gap, MAX_BACKFILL_DAYS);
  if (daysToCreate === 0) return null;

  let lastCreated: typeof giorniTable.$inferSelect | null = null;
  for (let offset = 1; offset <= daysToCreate; offset++) {
    const date = addDays(lastDate, offset);
    const [existing] = await db
      .select()
      .from(giorniTable)
      .where(eq(giorniTable.data, date))
      .limit(1);
    if (existing) continue;

    const numero = Number(maxNumero) + offset;
    const [row] = await db
      .insert(giorniTable)
      .values({ numero, data: date })
      .onConflictDoNothing()
      .returning();

    if (row) {
      lastCreated = row;
      logger.info(`Created day ${numero} for ${date}`);
    }
  }

  return lastCreated;
}