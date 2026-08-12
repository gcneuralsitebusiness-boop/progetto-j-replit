import { db } from "@workspace/db";
import { pageviewsTable, pageviewsDailyTable } from "@workspace/db/schema";
import { lt, sql } from "drizzle-orm";
import { logger } from "./logger";

const RETENTION_DAYS = 90;

/**
 * Rolls raw pageviews older than RETENTION_DAYS into pageviews_daily and
 * deletes the raw rows — inside one transaction, so a failed run never
 * double-counts or loses data. All dashboard dimensions (path, device,
 * source bucket, country) plus sums/counts are preserved so historical
 * metrics stay exact after the raw rows are gone.
 */
export async function runAnalyticsAggregation(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const sourceBucket = sql<string>`
    CASE
      WHEN ${pageviewsTable.referrer} IS NULL OR ${pageviewsTable.referrer} = '' OR lower(${pageviewsTable.referrer}) = 'direct' THEN 'Diretto'
      WHEN lower(${pageviewsTable.referrer}) LIKE '%instagram%' OR lower(${pageviewsTable.referrer}) = 'ig' THEN 'Instagram'
      WHEN lower(${pageviewsTable.referrer}) LIKE '%google%' THEN 'Google'
      WHEN lower(${pageviewsTable.referrer}) LIKE '%whatsapp%' OR lower(${pageviewsTable.referrer}) = 'wa' THEN 'WhatsApp'
      WHEN lower(${pageviewsTable.referrer}) LIKE '%telegram%' OR lower(${pageviewsTable.referrer}) = 'tg' THEN 'Telegram'
      ELSE 'Altro'
    END`;

  try {
    await db.transaction(async (tx) => {
      const oldRows = await tx
        .select({
          date: sql<string>`DATE(${pageviewsTable.timestamp} AT TIME ZONE 'Europe/Rome')`,
          path: pageviewsTable.path,
          device: pageviewsTable.device,
          source: sourceBucket.as("source"),
          country: sql<string>`coalesce(${pageviewsTable.country}, '')`,
          views: sql<number>`count(*)::int`,
          durationSum: sql<number>`coalesce(sum(${pageviewsTable.durationSec}), 0)::int`,
          durationCount: sql<number>`count(${pageviewsTable.durationSec})::int`,
          scrollSum: sql<number>`coalesce(sum(${pageviewsTable.scrollDepth}), 0)::int`,
          scrollCount: sql<number>`count(${pageviewsTable.scrollDepth})::int`,
          completedCount: sql<number>`sum(case when ${pageviewsTable.scrollDepth} = 100 then 1 else 0 end)::int`,
        })
        .from(pageviewsTable)
        .where(lt(pageviewsTable.timestamp, cutoff))
        .groupBy(
          sql`DATE(${pageviewsTable.timestamp} AT TIME ZONE 'Europe/Rome')`,
          pageviewsTable.path,
          pageviewsTable.device,
          sourceBucket,
          sql`coalesce(${pageviewsTable.country}, '')`
        );

      if (oldRows.length === 0) return;

      for (const row of oldRows) {
        await tx
          .insert(pageviewsDailyTable)
          .values(row)
          .onConflictDoUpdate({
            target: [
              pageviewsDailyTable.date,
              pageviewsDailyTable.path,
              pageviewsDailyTable.device,
              pageviewsDailyTable.source,
              pageviewsDailyTable.country,
            ],
            set: {
              views: sql`${pageviewsDailyTable.views} + excluded.views`,
              durationSum: sql`${pageviewsDailyTable.durationSum} + excluded.duration_sum`,
              durationCount: sql`${pageviewsDailyTable.durationCount} + excluded.duration_count`,
              scrollSum: sql`${pageviewsDailyTable.scrollSum} + excluded.scroll_sum`,
              scrollCount: sql`${pageviewsDailyTable.scrollCount} + excluded.scroll_count`,
              completedCount: sql`${pageviewsDailyTable.completedCount} + excluded.completed_count`,
            },
          });
      }

      await tx.delete(pageviewsTable).where(lt(pageviewsTable.timestamp, cutoff));

      logger.info({ rows: oldRows.length }, "Analytics aggregation complete");
    });
  } catch (err) {
    logger.error({ err }, "Analytics aggregation failed");
  }
}

export function scheduleAnalyticsAggregation(): void {
  // Run at 03:00 Rome time daily using node-cron
  import("node-cron").then(({ schedule }) => {
    schedule(
      "0 3 * * *",
      () => {
        runAnalyticsAggregation().catch(() => {});
      },
      { timezone: "Europe/Rome" }
    );
  });
}
