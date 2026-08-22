export const ARTICLE_CATEGORIES = [
  "LA MENTE",
  "IL CORPO",
  "IL BUSINESS",
  "IL VIAGGIO",
  "LA FEDE",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
const LEGACY_CATEGORIES = ["COMBAT", "FEDE", "FINANZA", "DISCIPLINA", "LAVORO", "BIOHACKING", "BUSINESS"] as const;

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return typeof value === "string" && ARTICLE_CATEGORIES.includes(value as ArticleCategory);
}

export function isLegacyArticleCategory(value: unknown): value is (typeof LEGACY_CATEGORIES)[number] {
  return typeof value === "string" && LEGACY_CATEGORIES.includes(value as (typeof LEGACY_CATEGORIES)[number]);
}

export function normalizeArticleCategory(value: string): ArticleCategory {
  if (value === "COMBAT") return "IL CORPO";
  if (value === "FEDE") return "LA FEDE";
  if (value === "FINANZA" || value === "BUSINESS") return "IL BUSINESS";
  if (isArticleCategory(value)) return value;
  return "LA MENTE";
}