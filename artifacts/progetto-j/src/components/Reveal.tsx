import { createElement, useEffect, useState, type ReactNode, type ElementType } from "react";
import { useReveal } from "@/lib/use-reveal";

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "none";
  as?: ElementType;
}) {
  const { ref, isVisible } = useReveal<HTMLElement>();
  const [isAnimating, setIsAnimating] = useState(!isVisible);

  useEffect(() => {
    if (!isVisible) {
      setIsAnimating(true);
      return;
    }

    const timer = window.setTimeout(() => setIsAnimating(false), delay + 600);
    return () => window.clearTimeout(timer);
  }, [delay, isVisible]);

  return createElement(
    as,
    {
      ref,
      className,
      style: {
        opacity: isVisible ? 1 : 0,
        transform: isVisible || direction === "none" ? "translateY(0)" : "translateY(12px)",
        transition: "opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)",
        transitionDelay: `${delay}ms`,
        willChange: isAnimating ? "opacity, transform" : "auto",
      },
    },
    children
  );
}
