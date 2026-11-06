import { and, eq, gte, sql } from "drizzle-orm";
import { db, giorniTable } from "@workspace/db";
import { SEASON_2_START_DATE } from "@workspace/api-zod/seasons";
import { logger } from "./logger";
import { getRomeCalendarDate, planDaysToCreate } from "./ensureTodayPlan";

export async function ensureTodayEntry(now = new Date()) {
  const today = getRomeCalendarDate(now);
  const [{ maxData, maxNumero }] = await db
    .select({
      maxData: sql<string | null>`MAX(${giorniTable.data})`,
      maxNumero: sql<number>`COALESCE(MAX(${giorniTable.numero}), 0)`,
    })
    .from(giorniTable).where(eq(giorniTable.fase, 1));

  const [{ maxData: season2MaxData }] = await db
    .select({ maxData: sql<string | null>`MAX(${giorniTable.data})` })
    .from(giorniTable)
    .where(and(eq(giorniTable.fase, 2), gte(giorniTable.data, SEASON_2_START_DATE)));

  const plannedDays = planDaysToCreate(
    today,
    { maxData, maxNumero: Number(maxNumero) },
    { maxData: season2MaxData },
  );
  if (plannedDays.length === 0) return null;

  let lastCreated: typeof giorniTable.$inferSelect | null = null;
  for (const planned of plannedDays) {
    const [existing] = await db
      .select()
      .from(giorniTable)
      .where(and(eq(giorniTable.fase, planned.fase), eq(giorniTable.numero, planned.numero)))
      .limit(1);
    if (existing) continue;

    const [row] = await db
      .insert(giorniTable)
      .values(planned)
      .onConflictDoNothing()
      .returning();

    if (row) {
      lastCreated = row;
      logger.info({ fase: row.fase, numero: row.numero, date: row.data }, "Created diary day");
    }
  }

  return lastCreated;
}