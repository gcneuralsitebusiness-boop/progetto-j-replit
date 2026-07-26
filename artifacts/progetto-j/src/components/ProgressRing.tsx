interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
}

export function ProgressRing({ value, max, size = 120, stroke = 6, label, sublabel }: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-[28px] leading-none text-foreground bebas">{Math.round(pct)}%</span>
          {sublabel && (
            <span className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted-foreground mt-1">{sublabel}</span>
          )}
        </div>
      </div>
      <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </div>
  );
}
