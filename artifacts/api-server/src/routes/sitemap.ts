import { Router } from "express";
import { asc } from "drizzle-orm";
import { db, giorniTable } from "@workspace/db";

const router = Router();
const baseUrl = "https://portfolio-showcase-gcneuralsitebus.replit.app";
const staticRoutes = ["/", "/journaling", "/chi-sono", "/coaching", "/social", "/sponsor"];

router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  const entries = await db.select().from(giorniTable).orderBy(asc(giorniTable.numero));
  const urls = [
    ...staticRoutes.map((route) => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>${route === "/" || route === "/journaling" ? "daily" : "monthly"}</changefreq>
  </url>`),
    ...entries.map((entry) => `
  <url>
    <loc>${baseUrl}/giorno/${entry.id}</loc>
    <lastmod>${new Date(entry.data).toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
  </url>`),
  ];

  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`);
});

export default router;