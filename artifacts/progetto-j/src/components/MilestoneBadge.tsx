const MILESTONES = [30, 60, 90, 180];

export function MilestoneBadge({ day }: { day: number }) {
  const milestone = MILESTONES.slice().reverse().find((m) => day >= m);
  if (!milestone) return null;

  return (
    <div
      className="inline-flex px-2.5 py-1 border border-[#8B6914] font-mono text-[11px] uppercase tracking-[0.15em] text-[#8B6914]"
    >
      <span>{milestone} GIORNI</span>
    </div>
  );
}
