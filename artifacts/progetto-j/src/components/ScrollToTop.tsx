import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * Resets the document scroll for forward/link navigations while preserving
 * the browser's native scroll restoration when the user goes back or forward.
 */
export function ScrollToTop() {
  const [location] = useLocation();
  const pathname = location.split("?")[0].split("#")[0];
  const isPopNavigation = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      isPopNavigation.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isPopNavigation.current) {
      isPopNavigation.current = false;
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}