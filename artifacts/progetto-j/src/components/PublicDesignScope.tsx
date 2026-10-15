import { useLayoutEffect } from "react";
import { useLocation } from "wouter";
import "@/styles/public-design.css";

/** Scope the public visual rules to the whole document, including portals, never admin. */
export function PublicDesignScope() {
  const [location] = useLocation();
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-public-site", !/^\/admin(?:\/|$)/.test(location));
    return () => root.removeAttribute("data-public-site");
  }, [location]);
  return null;
}
