import { useEffect } from "react";

const DEFAULT_TITLE = "Progetto J — 180 Giorni Documentati";
const DEFAULT_DESCRIPTION =
  "180 giorni di trasformazione documentata. Dati reali, zero filtri. Corpo, mente, business.";
const DEFAULT_IMAGE =
  "https://portfolio-showcase-gcneuralsitebus.replit.app/og-image.jpg";
const SITE_URL = "https://portfolio-showcase-gcneuralsitebus.replit.app";

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
    const resolvedImage = image ?? DEFAULT_IMAGE;
    const resolvedUrl = url ?? window.location.href;

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
    };
  }, [title, description, image, url]);
}
