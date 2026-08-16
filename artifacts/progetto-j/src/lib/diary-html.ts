import DOMPurify from "dompurify";

/** The diary editor accepts this small, presentation-only HTML subset. */
export const DIARY_ALLOWED_TAGS = ["h1", "h2", "h3", "p", "br", "strong", "em"] as const;

const DIARY_HTML_PATTERN = /<\s*\/?\s*(?:h1|h2|h3|p|br|strong|em)\b/i;

export function containsDiaryHtml(value: string): boolean {
  return DIARY_HTML_PATTERN.test(value);
}

/**
 * Sanitize only at the DOM boundary. The API deliberately stores the editor
 * value unchanged; this protects the public page without changing the draft.
 */
export function sanitizeDiaryHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [...DIARY_ALLOWED_TAGS],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}