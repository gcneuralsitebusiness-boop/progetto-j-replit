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

export function sanitizeArticleHtml(contenuto: string): string {
  const source = contenuto.trim();
  if (!source) return "";

  const html = HTML_CONTENT_PATTERN.test(source) ? source : legacyTextToHtml(source);
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

  return (
    <div
      className="article-body"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}