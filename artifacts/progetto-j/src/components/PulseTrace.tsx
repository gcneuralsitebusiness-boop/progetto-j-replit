import type { Entry } from "@workspace/api-client-react";

interface PulseTraceProps {
  entries: Entry[];
  variant: "hero" | "divider";
}

export function PulseTrace({ entries, variant }: PulseTraceProps) {
  const points = entries
    .filter((entry) => entry.battito != null)
    .sort((a, b) => a.numero - b.numero)
    .map((entry) => ({ x: entry.numero, y: entry.battito as number }));

  if (points.length < 2) return null;

  const minX = points[0].x;
  const maxX = points[points.length - 1].x;
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const xRange = Math.max(maxX - minX, 1);
  const yRange = Math.max(maxY - minY, 1);
  const height = variant === "hero" ? 120 : 60;
  const path = points
    .map((point) => {
      const x = ((point.x - minX) / xRange) * 1000;
      const y = height * 0.15 + ((maxY - point.y) / yRange) * height * 0.7;
      return `${x} ${y}`;
    })
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point}`)
    .join(" ");

  const last = points[points.length - 1];
  const lastX = ((last.x - minX) / xRange) * 1000;
  const lastY = height * 0.15 + ((maxY - last.y) / yRange) * height * 0.7;

  return (
    <svg
      viewBox={`0 0 1000 ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      aria-hidden="true"
      className="block pointer-events-none"
    >
      <path
        d={path}
        fill="none"
        stroke={variant === "hero" ? "hsl(var(--primary))" : "hsl(var(--iron))"}
        strokeWidth={variant === "hero" ? 1.5 : 1}
        opacity={variant === "hero" ? 0.9 : 0.5}
        className={variant === "hero" ? "pulse-trace-path" : undefined}
      />
      {variant === "hero" && <circle cx={lastX} cy={lastY} r="3" fill="hsl(var(--primary))" />}
    </svg>
  );
}