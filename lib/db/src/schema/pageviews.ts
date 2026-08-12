import { pgTable, serial, text, integer, timestamp, date, index, uniqueIndex } from "drizzle-orm/pg-core";

export const pageviewsTable = pgTable(
  "pageviews",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    device: text("device").notNull().default("desktop"), // "mobile" | "desktop"
    country: text("country"),
    durationSec: integer("duration_sec"),
    scrollDepth: integer("scroll_depth"), // 0 | 25 | 50 | 75 | 100
    sessionId: text("session_id"), // anonymous visitor session (30-min sliding window, sessionStorage — no cookie)
    viewId: text("view_id"), // per-pageview token used to attach exit/heartbeat updates
    closed: integer("closed").notNull().default(0), // 1 when exit beacon received
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(), // updated by heartbeats
  },
  (t) => [
    index("pageviews_timestamp_idx").on(t.timestamp),
    index("pageviews_path_idx").on(t.path),
    index("pageviews_view_id_idx").on(t.viewId),
  ]
);

// Daily rollup of raw pageviews older than the retention window.
// Dimensions (path, device, source, country) are preserved so every
// dashboard section keeps working on historical data. Sums + counts
// (not averages) are stored so raw and aggregated data merge exactly.
export const pageviewsDailyTable = pgTable(
  "pageviews_daily",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    path: text("path").notNull(),
    device: text("device").notNull().default("desktop"),
    source: text("source").notNull().default("Diretto"), // bucketed referrer: Instagram/Google/WhatsApp/Telegram/Diretto/Altro
    country: text("country").notNull().default(""),
    views: integer("views").notNull().default(0),
    durationSum: integer("duration_sum").notNull().default(0),
    durationCount: integer("duration_count").notNull().default(0),
    scrollSum: integer("scroll_sum").notNull().default(0),
    scrollCount: integer("scroll_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0), // scroll_depth = 100
  },
  (t) => [uniqueIndex("pageviews_daily_dims_idx").on(t.date, t.path, t.device, t.source, t.country)]
);

export type Pageview = typeof pageviewsTable.$inferSelect;
export type InsertPageview = typeof pageviewsTable.$inferInsert;
