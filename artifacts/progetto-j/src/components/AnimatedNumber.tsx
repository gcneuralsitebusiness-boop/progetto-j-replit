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

function cubicBezierEase(progress: number) {
  const xFor = (t: number) => ((1 - t) ** 3 * 0) + (3 * (1 - t) ** 2 * t * 0.2) + (3 * (1 - t) * t ** 2 * 0.2) + t ** 3;
  const yFor = (t: number) => ((1 - t) ** 3 * 0) + (3 * (1 - t) ** 2 * t * 0.8) + (3 * (1 - t) * t ** 2) + t ** 3;
  const derivative = (t: number) => 3 * (1 - t) ** 2 * 0.2 + 6 * (1 - t) * t * (0.2 - 0.2) + 3 * t ** 2 * (1 - 0.2);
  let t = progress;
  for (let index = 0; index < 5; index += 1) {
    const slope = derivative(t);
    if (Math.abs(slope) < 0.001) break;
    t = Math.min(1, Math.max(0, t - (xFor(t) - progress) / slope));
  }
  return yFor(t);
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
      const eased = cubicBezierEase(p);
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
