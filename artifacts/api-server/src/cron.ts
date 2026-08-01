import { schedule } from "node-cron";
import { logger } from "./lib/logger";
import { ensureTodayEntry } from "./lib/ensureToday";

export function startDiaryCron() {
  schedule(
    "0 0 * * *",
    async () => {
      try {
        const row = await ensureTodayEntry();
        if (row) {
          logger.info(
            { dayNumber: row.numero, date: row.data },
            "Created next day",
          );
        }
      } catch (err) {
        logger.error({ err }, "Failed to create next day");
      }
    },
    {
      timezone: "Europe/Rome",
    }
  );
}
