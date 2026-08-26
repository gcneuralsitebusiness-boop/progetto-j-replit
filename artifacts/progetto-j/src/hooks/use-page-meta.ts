import { useEffect } from "react";

const DEFAULT_TITLE = "Progetto J — 180 Giorni Documentati";
const DEFAULT_DESCRIPTION =
  "180 giorni di trasformazione documentata. Dati reali, zero filtri. Corpo, mente, business.";
const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || "https://projectj180day.com").replace(/\/$/, "");
const DEFAULT_IMAGE = `${PUBLIC_SITE_URL}/og-image.jpg`;
const SITE_URL = PUBLIC_SITE_URL;

function setMeta(property: string, content: string, attr = "property") {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${property}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(property: string, attr = "property") {
  const el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${property}"]`
  );
  if (el) el.removeAttribute("content");
}

export interface PageMetaOptions {
  title: string;
  description: string;
  image?: string | null;
  url?: string;
}

/**
 * Imperatively updates <head> OG / Twitter meta tags while a page is mounted,
 * then restores the site-wide defaults on unmount.
 */
export function usePageMeta({ title, description, image, url }: PageMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    const resolveUrl = (value: string) => value.startsWith("http") ? value : new URL(value, PUBLIC_SITE_URL).toString();
    const resolvedImage = image ? resolveUrl(image) : DEFAULT_IMAGE;
    const resolvedUrl = url ? resolveUrl(url) : PUBLIC_SITE_URL;

    // Title
    document.title = title;

    // Open Graph
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:image", resolvedImage);
    setMeta("og:image:width", "1200");
    setMeta("og:image:height", "630");
    setMeta("og:url", resolvedUrl);

    // Twitter
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");
    setMeta("twitter:image", resolvedImage, "name");
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.href = resolvedUrl;

    return () => {
      document.title = prevTitle;
      setMeta("og:title", DEFAULT_TITLE);
      setMeta("og:description", DEFAULT_DESCRIPTION);
      setMeta("og:image", DEFAULT_IMAGE);
      setMeta("og:image:width", "1200");
      setMeta("og:image:height", "630");
      setMeta("og:url", SITE_URL);
      setMeta("twitter:title", DEFAULT_TITLE, "name");
      setMeta("twitter:description", DEFAULT_DESCRIPTION, "name");
      setMeta("twitter:image", DEFAULT_IMAGE, "name");
      const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (canonical) canonical.href = SITE_URL;
    };
  }, [title, description, image, url]);
}
