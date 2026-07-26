import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  className?: string;
  formatter?: (n: number) => string;
  duration?: number;
}

export function AnimatedNumber({ value, className = "", formatter, duration = 1200 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (value === 0) { setDisplayed(0); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(2, -10 * p);
      setDisplayed(Math.round(ease * value));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setDisplayed(value);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [started, value, duration]);

  const fmt = formatter ?? ((n: number) => n.toLocaleString("it-IT"));

  return <span ref={ref} className={className}>{fmt(displayed)}</span>;
}
