import { schedule } from "node-cron";
import { sql } from "drizzle-orm";
import { db, giorniTable } from "@workspace/db";
import { logger } from "./lib/logger";

function getRomeDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function startDiaryCron() {
  schedule(
    "0 0 * * *",
    async () => {
      try {
        const result = await db
          .select({ max: sql`MAX(${giorniTable.numero})`.mapWith(Number) })
          .from(giorniTable);

        const currentMax = result[0]?.max ?? 0;
        const nextDayNumber = currentMax + 1;
        const todayRome = getRomeDateString(new Date());

        await db.insert(giorniTable).values({
          numero: nextDayNumber,
          data: todayRome,
        });

        logger.info(
          { dayNumber: nextDayNumber, date: todayRome },
          "Created next day"
        );
      } catch (err) {
        logger.error({ err }, "Failed to create next day");
      }
    },
    {
      timezone: "Europe/Rome",
    }
  );
}
