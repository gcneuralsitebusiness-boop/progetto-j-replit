import { Router } from "express";
import { db } from "@workspace/db";
import { contenutiTable } from "@workspace/db/schema";
import { isHttpsUrlOrEmpty } from "../lib/validation";

const router = Router();

const CONTENT_KEYS = [
  // Home
  "home_hero_titolo",
  "home_hero_sottotitolo",
  "home_cta_testo",
  "home_community_testo",
  // Chi Sono
  "chi_sono_bio",
  "chi_sono_il_progetto",
  "chi_sono_la_motivazione",
  "chi_sono_la_promessa",
  "chi_sono_foto",
  // Journaling
  "journaling_intro",
  // Social
  "social_intro",
  "social_lavora_titolo",
  // Sponsor
  "sponsor_intro",
  "sponsor_cta_titolo",
  "sponsor_cta_testo",
  "sponsor_email",
  // Coaching pillars
  "coaching_pillar_1_label",
  "coaching_pillar_1_testo",
  "coaching_pillar_2_label",
  "coaching_pillar_2_testo",
  "coaching_pillar_3_label",
  "coaching_pillar_3_testo",
  "coaching_pillar_4_label",
  "coaching_pillar_4_testo",
  "coaching_contatto_intro",
  // Global
  "global_footer_mantra",
  "instagram_url",
] as const;

type ContentKey = (typeof CONTENT_KEYS)[number];
type ContentMap = Record<ContentKey, string | null>;

async function buildContentMap(): Promise<ContentMap> {
  const rows = await db.select().from(contenutiTable);
  const map = Object.fromEntries(CONTENT_KEYS.map((k) => [k, null])) as ContentMap;
  for (const row of rows) {
    if (CONTENT_KEYS.includes(row.chiave as ContentKey)) {
      map[row.chiave as ContentKey] = row.valore;
    }
  }
  return map;
}

router.get("/content", async (_req, res): Promise<void> => {
  const map = await buildContentMap();
  res.json(map);
});

router.put("/content/:chiave", async (req, res): Promise<void> => {
  if (!req.session.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { chiave } = req.params;
  if (!CONTENT_KEYS.includes(chiave as ContentKey)) {
    res.status(400).json({ error: "Invalid content key" });
    return;
  }

  const valore = req.body?.valore;
  if (typeof valore !== "string") {
    res.status(400).json({ error: "valore must be a string" });
    return;
  }
  if (chiave === "instagram_url" && !isHttpsUrlOrEmpty(valore)) {
    res.status(400).json({ error: "instagram_url must use HTTPS" });
    return;
  }

  await db
    .insert(contenutiTable)
    .values({ chiave, valore })
    .onConflictDoUpdate({
      target: contenutiTable.chiave,
      set: { valore, aggiornatoA: new Date() },
    });

  const map = await buildContentMap();
  res.json(map);
});

export default router;
