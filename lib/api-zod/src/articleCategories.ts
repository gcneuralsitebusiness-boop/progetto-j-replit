export const ARTICLE_CATEGORIES = [
  "COMBAT",
  "FEDE",
  "FINANZA",
  "DISCIPLINA",
  "LAVORO",
  "BIOHACKING",
  "BUSINESS",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return typeof value === "string" && ARTICLE_CATEGORIES.includes(value as ArticleCategory);
}