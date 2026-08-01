import { eq, sql } from "drizzle-orm";
import { db, giorniTable } from "@workspace/db";

export async function ensureTodayEntry() {
  const now = new Date();
  const romeDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
  }).format(now);

  const [existing] = await db
    .select()
    .from(giorniTable)
    .where(eq(giorniTable.data, romeDate))
    .limit(1);

  if (existing) return null;

  const [{ max }] = await db
    .select({ max: sql`COALESCE(MAX(${giorniTable.numero}), 0)` })
    .from(giorniTable);
  const numero = Number(max) + 1;

  const [row] = await db
    .insert(giorniTable)
    .values({ numero, data: romeDate })
    .onConflictDoNothing()
    .returning();

  return row ?? null;
}