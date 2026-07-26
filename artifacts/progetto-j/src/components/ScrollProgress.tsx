import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setPct(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (pct <= 0) return null;

  return (
    <div
      className="fixed top-0 left-0 h-[2px] bg-primary z-[9999] pointer-events-none origin-left"
      style={{ width: `${pct}%`, transition: "width 80ms linear" }}
    />
  );
}
