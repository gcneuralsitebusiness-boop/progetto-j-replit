import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pageviewsTable, pageviewsDailyTable, articoliTable } from "@workspace/db/schema";
import { and, gte, sql, desc, eq, type SQL } from "drizzle-orm";

const router: IRouter = Router();

// ─── Rate limiter (in-memory, 20 req/min per IP) ──────────────────────────────
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    rateLimits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

// Cleanup stale rate-limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now - entry.windowStart >= RATE_WINDOW_MS * 2) rateLimits.delete(ip);
  }
}, 5 * 60_000);

// ─── Referrer → source bucket (shared with the aggregation job) ───────────────
export const SOURCE_BUCKET_SQL = sql<string>`
  CASE
    WHEN ${pageviewsTable.referrer} IS NULL OR ${pageviewsTable.referrer} = '' OR lower(${pageviewsTable.referrer}) = 'direct' THEN 'Diretto'
    WHEN lower(${pageviewsTable.referrer}) LIKE '%instagram%' OR lower(${pageviewsTable.referrer}) = 'ig' THEN 'Instagram'
    WHEN lower(${pageviewsTable.referrer}) LIKE '%google%' THEN 'Google'
    WHEN lower(${pageviewsTable.referrer}) LIKE '%whatsapp%' OR lower(${pageviewsTable.referrer}) = 'wa' THEN 'WhatsApp'
    WHEN lower(${pageviewsTable.referrer}) LIKE '%telegram%' OR lower(${pageviewsTable.referrer}) = 'tg' THEN 'Telegram'
    ELSE 'Altro'
  END`;

// ─── POST /analytics/event ────────────────────────────────────────────────────
router.post("/analytics/event", async (req, res): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    res.status(200).end(); // silent, don't reveal rate limit to client
    return;
  }

  try {
    const { path, referrer, durationSec, scrollDepth, sessionId, viewId, type } =
      req.body as Record<string, unknown>;

    const safeView = typeof viewId === "string" ? viewId.slice(0, 64) : null;
    const recentWindow = new Date(Date.now() - 24 * 60 * 60_000);

    if (type === "exit" && safeView) {
      const safeDur = typeof durationSec === "number" ? Math.round(durationSec) : null;
      const safeScroll = typeof scrollDepth === "number" ? scrollDepth : null;
      await db
        .update(pageviewsTable)
        .set({ durationSec: safeDur, scrollDepth: safeScroll, closed: 1 })
        .where(
          and(
            eq(pageviewsTable.viewId, safeView),
            gte(pageviewsTable.timestamp, recentWindow)
          )
        );
      res.status(200).end();
      return;
    }

    if (type === "heartbeat" && safeView) {
      // Keep long-lived visits present in the realtime section
      await db
        .update(pageviewsTable)
        .set({ lastSeen: new Date(), closed: 0 })
        .where(
          and(
            eq(pageviewsTable.viewId, safeView),
            gte(pageviewsTable.timestamp, recentWindow)
          )
        );
      res.status(200).end();
      return;
    }

    if (typeof path !== "string" || !path) {
      res.status(200).end();
      return;
    }
    const safePath = path.slice(0, 500);
    const safeSession = typeof sessionId === "string" ? sessionId.slice(0, 64) : null;

    {
      // New pageview — device from UA (mobile vs desktop only, no fingerprinting)
      const ua = req.headers["user-agent"] ?? "";
      const safeDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";

      // Country from Accept-Language (e.g. "it-IT,it;q=0.9" → "IT"), no geolocation service
      const acceptLang = req.headers["accept-language"] ?? "";
      const langMatch = acceptLang.match(/^[a-z]{2,3}-([A-Z]{2})/);
      const safeCountry = langMatch ? langMatch[1] : (acceptLang.slice(0, 2).toUpperCase() || null);

      const safeReferrer = typeof referrer === "string" ? referrer.slice(0, 500) : null;

      await db.insert(pageviewsTable).values({
        path: safePath,
        referrer: safeReferrer,
        device: safeDevice,
        country: safeCountry,
        sessionId: safeSession,
        viewId: safeView,
        durationSec: null,
        scrollDepth: null,
        closed: 0,
        lastSeen: new Date(),
      });
    }

    res.status(200).end();
  } catch {
    // Never surface errors to the client
    res.status(200).end();
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null; // "all"
}

interface PageStats {
  views: number;
  durationSum: number;
  durationCount: number;
  scrollSum: number;
  scrollCount: number;
  completedCount: number;
}

function emptyStats(): PageStats {
  return { views: 0, durationSum: 0, durationCount: 0, scrollSum: 0, scrollCount: 0, completedCount: 0 };
}

function addStats(map: Map<string, PageStats>, key: string, s: Partial<PageStats>): void {
  const cur = map.get(key) ?? emptyStats();
  cur.views += s.views ?? 0;
  cur.durationSum += s.durationSum ?? 0;
  cur.durationCount += s.durationCount ?? 0;
  cur.scrollSum += s.scrollSum ?? 0;
  cur.scrollCount += s.scrollCount ?? 0;
  cur.completedCount += s.completedCount ?? 0;
  map.set(key, cur);
}

function finalizeStats(s: PageStats) {
  return {
    views: s.views,
    avgDuration: s.durationCount > 0 ? Math.round(s.durationSum / s.durationCount) : null,
    avgScroll: s.scrollCount > 0 ? Math.round(s.scrollSum / s.scrollCount) : null,
    completionRate: s.views > 0 ? Math.round((s.completedCount / s.views) * 100) : null,
  };
}

// ─── GET /admin/analytics ─────────────────────────────────────────────────────
router.get("/admin/analytics", async (req, res): Promise<void> => {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Non autorizzato" });
    return;
  }

  try {
    const period = typeof req.query.period === "string" ? req.query.period : "7d";
    const since = periodStart(period);
    const includeDaily = since === null; // "all" must merge the historical rollup

    const rawWhere: SQL | undefined = since ? gte(pageviewsTable.timestamp, since) : undefined;

    // ── Overview counts (fixed windows — raw retention of 90d always covers them)
    const todayStart = periodStart("today")!;
    const sevenStart = periodStart("7d")!;
    const thirtyStart = periodStart("30d")!;

    const rawStatsSelect = {
      views: sql<number>`count(*)::int`,
      durationSum: sql<number>`coalesce(sum(${pageviewsTable.durationSec}), 0)::int`,
      durationCount: sql<number>`count(${pageviewsTable.durationSec})::int`,
      scrollSum: sql<number>`coalesce(sum(${pageviewsTable.scrollDepth}), 0)::int`,
      scrollCount: sql<number>`count(${pageviewsTable.scrollDepth})::int`,
      completedCount: sql<number>`sum(case when ${pageviewsTable.scrollDepth} = 100 then 1 else 0 end)::int`,
    };

    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);

    // Unique visitors = distinct anonymous sessions (30-min sliding window kept
    // client-side in sessionStorage, no cookie). Rows without a sessionId
    // (very old clients) fall back to counting the row itself.
    const uniqueVisitors = sql<number>`count(distinct coalesce(${pageviewsTable.sessionId}, ${pageviewsTable.id}::text))::int`;

    const [
      todayCount,
      sevenCount,
      thirtyCount,
      dailySeries,
      rawPages,
      rawSources,
      rawDevices,
      realtimeRows,
      allArticoli,
      dailyPages,
      dailySources,
      dailyDevices,
    ] = await Promise.all([
      db.select({ count: uniqueVisitors }).from(pageviewsTable).where(gte(pageviewsTable.timestamp, todayStart)),
      db.select({ count: uniqueVisitors }).from(pageviewsTable).where(gte(pageviewsTable.timestamp, sevenStart)),
      db.select({ count: uniqueVisitors }).from(pageviewsTable).where(gte(pageviewsTable.timestamp, thirtyStart)),
      // Daily series — unique visitors per day, last 30 days, always raw (retention is 90 days)
      db
        .select({
          date: sql<string>`DATE(${pageviewsTable.timestamp} AT TIME ZONE 'Europe/Rome')`,
          views: uniqueVisitors,
        })
        .from(pageviewsTable)
        .where(gte(pageviewsTable.timestamp, thirtyStart))
        .groupBy(sql`DATE(${pageviewsTable.timestamp} AT TIME ZONE 'Europe/Rome')`)
        .orderBy(sql`DATE(${pageviewsTable.timestamp} AT TIME ZONE 'Europe/Rome')`),
      // Raw per-path stats for the selected period
      db
        .select({ path: pageviewsTable.path, ...rawStatsSelect })
        .from(pageviewsTable)
        .where(rawWhere)
        .groupBy(pageviewsTable.path),
      // Raw source buckets
      db
        .select({ source: SOURCE_BUCKET_SQL.as("source"), count: sql<number>`count(*)::int` })
        .from(pageviewsTable)
        .where(rawWhere)
        .groupBy(SOURCE_BUCKET_SQL),
      // Raw device counts
      db
        .select({ device: pageviewsTable.device, count: sql<number>`count(*)::int` })
        .from(pageviewsTable)
        .where(rawWhere)
        .groupBy(pageviewsTable.device),
      // Realtime: sessions seen in the last 5 minutes (heartbeats keep long visits alive)
      db
        .select({ path: pageviewsTable.path, count: sql<number>`count(*)::int` })
        .from(pageviewsTable)
        .where(and(gte(pageviewsTable.lastSeen, fiveMinAgo), eq(pageviewsTable.closed, 0)))
        .groupBy(pageviewsTable.path)
        .orderBy(desc(sql`count(*)`)),
      db.select({ slug: articoliTable.slug, titolo: articoliTable.titolo }).from(articoliTable),
      // Historical rollup (only needed for "Tutto")
      includeDaily
        ? db
            .select({
              path: pageviewsDailyTable.path,
              views: sql<number>`sum(${pageviewsDailyTable.views})::int`,
              durationSum: sql<number>`sum(${pageviewsDailyTable.durationSum})::int`,
              durationCount: sql<number>`sum(${pageviewsDailyTable.durationCount})::int`,
              scrollSum: sql<number>`sum(${pageviewsDailyTable.scrollSum})::int`,
              scrollCount: sql<number>`sum(${pageviewsDailyTable.scrollCount})::int`,
              completedCount: sql<number>`sum(${pageviewsDailyTable.completedCount})::int`,
            })
            .from(pageviewsDailyTable)
            .groupBy(pageviewsDailyTable.path)
        : Promise.resolve([]),
      includeDaily
        ? db
            .select({
              source: pageviewsDailyTable.source,
              count: sql<number>`sum(${pageviewsDailyTable.views})::int`,
            })
            .from(pageviewsDailyTable)
            .groupBy(pageviewsDailyTable.source)
        : Promise.resolve([]),
      includeDaily
        ? db
            .select({
              device: pageviewsDailyTable.device,
              count: sql<number>`sum(${pageviewsDailyTable.views})::int`,
            })
            .from(pageviewsDailyTable)
            .groupBy(pageviewsDailyTable.device)
        : Promise.resolve([]),
    ]);

    // ── Merge raw + rollup per path ───────────────────────────────────────────
    const pathStats = new Map<string, PageStats>();
    for (const row of rawPages) addStats(pathStats, row.path, row);
    for (const row of dailyPages) addStats(pathStats, row.path, row);

    const allPages = [...pathStats.entries()].map(([path, s]) => ({ path, ...finalizeStats(s) }));
    allPages.sort((a, b) => b.views - a.views);

    const topPages = allPages.slice(0, 20).map(({ completionRate, ...rest }) => rest);

    const slugToTitle = new Map(allArticoli.map((a) => [a.slug, a.titolo]));
    const articles = allPages
      .filter((p) => p.path.startsWith("/a/"))
      .map((p) => {
        const slug = p.path.replace(/^\/a\//, "");
        return { ...p, titolo: slugToTitle.get(slug) ?? slug };
      });

    const diary = allPages
      .filter((p) => p.path.startsWith("/giorno/"))
      .map(({ completionRate, ...p }) => ({ ...p, giorno: p.path.replace(/^\/giorno\//, "") }));

    // ── Sources (raw buckets + rollup buckets) ────────────────────────────────
    const sourceMap: Record<string, number> = {
      Instagram: 0, Google: 0, WhatsApp: 0, Telegram: 0, Diretto: 0, Altro: 0,
    };
    for (const row of rawSources) {
      sourceMap[row.source] = (sourceMap[row.source] ?? 0) + row.count;
    }
    for (const row of dailySources) {
      sourceMap[row.source] = (sourceMap[row.source] ?? 0) + row.count;
    }
    const sources = Object.entries(sourceMap).map(([name, count]) => ({ name, count }));

    // ── Devices (raw + rollup) ────────────────────────────────────────────────
    let mobileCount = 0;
    let desktopCount = 0;
    for (const row of [...rawDevices, ...dailyDevices]) {
      if (row.device === "mobile") mobileCount += row.count;
      else desktopCount += row.count;
    }
    const totalDevices = mobileCount + desktopCount;
    const devices = {
      mobile: totalDevices > 0 ? Math.round((mobileCount / totalDevices) * 100) : 0,
      desktop: totalDevices > 0 ? Math.round((desktopCount / totalDevices) * 100) : 0,
      mobileCount,
      desktopCount,
    };

    const realtimeTotal = realtimeRows.reduce((s, r) => s + r.count, 0);

    res.json({
      overview: {
        today: todayCount[0]?.count ?? 0,
        last7d: sevenCount[0]?.count ?? 0,
        last30d: thirtyCount[0]?.count ?? 0,
      },
      dailySeries,
      topPages,
      articles,
      diary,
      sources,
      devices,
      realtime: { total: realtimeTotal, pages: realtimeRows },
    });
  } catch {
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
