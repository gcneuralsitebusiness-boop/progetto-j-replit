/**
 * Convert an object path returned by the upload endpoint into a browser-ready URL.
 * External URLs are passed through unchanged.
 */
export function getPhotoUrl(foto: string | null | undefined): string | null {
  if (!foto) return null;
  if (foto.startsWith("/objects/")) return `/api/storage${foto}`;
  return foto;
}
