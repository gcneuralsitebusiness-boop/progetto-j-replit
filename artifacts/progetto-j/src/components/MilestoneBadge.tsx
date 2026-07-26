import { Trophy } from "lucide-react";

const MILESTONES = [30, 60, 90, 180];

export function MilestoneBadge({ day }: { day: number }) {
  const milestone = MILESTONES.slice().reverse().find((m) => day >= m);
  if (!milestone) return null;

  const isFinal = milestone === 180;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-sans uppercase tracking-[0.15em] ${
        isFinal
          ? "bg-[hsl(var(--bronze))] text-[hsl(var(--bronze-foreground))] border-[hsl(var(--bronze))]"
          : "bg-transparent text-[hsl(var(--bronze))] border-[hsl(var(--bronze))]"
      }`}
    >
      <Trophy size={12} strokeWidth={2} />
      <span>{milestone} DAYS</span>
    </div>
  );
}
