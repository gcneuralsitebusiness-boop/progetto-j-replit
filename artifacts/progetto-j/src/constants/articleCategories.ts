export const ARTICLE_CATEGORIES = [
  "LA MENTE",
  "IL CORPO",
  "IL BUSINESS",
  "IL VIAGGIO",
  "LA FEDE",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return typeof value === "string" && ARTICLE_CATEGORIES.includes(value as ArticleCategory);
}

export function normalizeArticleCategory(value: string | null | undefined): ArticleCategory {
  const category = value?.trim().toUpperCase();
  if (category === "COMBAT") return "IL CORPO";
  if (category === "FEDE") return "LA FEDE";
  if (category === "FINANZA" || category === "BUSINESS") return "IL BUSINESS";
  if (category === "IL CORPO" || category === "IL BUSINESS" || category === "IL VIAGGIO" || category === "LA FEDE" || category === "LA MENTE") {
    return category;
  }
  return "LA MENTE";
}