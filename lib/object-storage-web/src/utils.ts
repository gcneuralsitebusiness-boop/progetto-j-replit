/**
 * Convert an object path returned by the upload endpoint into a browser-ready URL.
 * External URLs are passed through unchanged.
 */
export function getPhotoUrl(foto: string | null | undefined): string | null {
  if (!foto) return null;
  if (foto.startsWith("/objects/")) {
    const baseUrl =
      (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/";
    const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${base}/api/storage${foto}`;
  }
  return foto;
}
