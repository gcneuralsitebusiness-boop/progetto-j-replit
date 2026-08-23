import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "blockquote",
  "strong",
  "em",
  "a",
  "br",
  "hr",
] as const;

const ALLOWED_ATTR = ["href", "target", "rel"] as const;
const HTML_CONTENT_PATTERN = /<\/?[a-z][^>]*>/i;
const ESCAPED_HTML_PATTERN = /&lt;\/?(?:h[1-3]|p|ul|ol|li|blockquote|strong|em|a|br|hr)\b/i;

const sanitizeConfig = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTR],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  KEEP_CONTENT: true,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function legacyTextToHtml(content: string): string {
  return content
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      const heading = trimmed.match(/^\*\*(.+)\*\*$/);
      if (heading) {
        return `<h2>${escapeHtml(heading[1].trim())}</h2>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function decodeEscapedArticleHtml(content: string): string {
  if (!ESCAPED_HTML_PATTERN.test(content)) return content;

  const textarea = document.createElement("textarea");
  textarea.innerHTML = content;
  return textarea.value;
}

export function sanitizeArticleHtml(contenuto: string): string {
  const source = contenuto.trim();
  if (!source) return "";

  const normalizedSource = decodeEscapedArticleHtml(source);
  const html = HTML_CONTENT_PATTERN.test(normalizedSource)
    ? normalizedSource
    : legacyTextToHtml(normalizedSource);
  return DOMPurify.sanitize(html, sanitizeConfig);
}

export function getArticlePlainText(contenuto: string): string {
  const safeHtml = sanitizeArticleHtml(contenuto);
  if (!safeHtml) return "";

  const document = new DOMParser().parseFromString(safeHtml, "text/html");
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function ArticleContent({ contenuto }: { contenuto: string }) {
  const safeHtml = sanitizeArticleHtml(contenuto);
  const hasVisibleText = safeHtml
    ? new DOMParser().parseFromString(safeHtml, "text/html").body.textContent?.trim()
    : "";
  const fallbackHtml = hasVisibleText || !contenuto.trim()
    ? safeHtml
    : legacyTextToHtml(contenuto);

  return (
    <div
      className="article-body"
      dangerouslySetInnerHTML={{ __html: fallbackHtml }}
    />
  );
}