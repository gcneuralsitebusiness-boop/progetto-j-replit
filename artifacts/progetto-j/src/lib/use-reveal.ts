import { useEffect, useRef, useState, type RefObject } from "react";

type RevealOptions = {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
};

type RevealResult<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  isVisible: boolean;
};

export function useReveal<T extends HTMLElement = HTMLElement>({
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  delay = 0,
}: RevealOptions = {}): RevealResult<T> {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (isVisible) return;

    const element = ref.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    let revealTimer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        revealTimer = window.setTimeout(() => setIsVisible(true), delay);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
    };
  }, [delay, isVisible, rootMargin, threshold]);

  return { ref, isVisible };
}