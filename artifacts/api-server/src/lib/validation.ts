export function isHttpsUrl(value: unknown): value is string {
  return typeof value === "string" && /^https:\/\/[^\s]+$/i.test(value.trim());
}

export function isHttpsUrlOrEmpty(value: unknown): value is string {
  return value === "" || isHttpsUrl(value);
}

export function isImageReference(value: unknown): value is string {
  return typeof value === "string" &&
    (value === "" || value.startsWith("/objects/") || isHttpsUrl(value));
}