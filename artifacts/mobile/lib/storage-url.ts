export function getStorageObjectUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return null;

  const normalized = path.startsWith("/objects/")
    ? path
    : `/objects/${path.replace(/^\/+/, "")}`;
  return `https://${domain}/api/storage${normalized}`;
}