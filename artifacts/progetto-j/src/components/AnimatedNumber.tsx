import { useEffect, useRef, useState } from "react";
import { useReveal } from "@/lib/use-reveal";

interface Props {
  value: number;
  className?: string;
  formatter?: (n: number) => string;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export function AnimatedNumber({ value, className = "", formatter, duration = 800, decimals = 0, suffix = "", prefix = "" }: Props) {
  const { ref, isVisible } = useReveal<HTMLSpanElement>();
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!isVisible) return;
    if (value === 0) { setDisplayed(0); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = p * p * (3 - 2 * p);
      setDisplayed(eased * value);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setDisplayed(value);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [isVisible, value, duration]);

  const fmt = formatter ?? ((n: number) => `${prefix}${n.toLocaleString("it-IT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`);

  return <span ref={ref} className={`measured tabular ${className}`}>{isVisible ? fmt(displayed) : fmt(0)}</span>;
}
