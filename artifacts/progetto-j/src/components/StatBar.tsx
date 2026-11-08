interface StatBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  variant?: "default" | "income" | "bronze";
}

export function StatBar({ label, value, max, unit = "", variant = "default" }: StatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    default: "bg-primary",
    income: "bg-money",
    bronze: "bg-[hsl(var(--bronze))]",
  };

  const valueClasses = {
    default: "text-foreground",
    income: "text-money",
    bronze: "text-[hsl(var(--bronze))]",
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <span className={`text-[15px] font-sans font-semibold tabular ${valueClasses[variant]}`}>
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] border border-border/50 overflow-hidden">
        <div
          className={`h-full ${colorClasses[variant]} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
