/** Placeholder card matching DayCard's silhouette, shown while the diary loads. */
export function DayCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`border border-border bg-card overflow-hidden animate-pulse ${featured ? "min-h-[420px]" : ""}`}
      aria-hidden="true"
    >
      <div className="h-48 sm:h-56 md:h-64 bg-iron/30" />
      <div className="p-5 sm:p-6 space-y-4">
        <div className="h-14 w-40 bg-iron/30" />
        <div className="h-px bg-iron/50" />
        <div className="flex gap-6">
          <div className="h-8 w-16 bg-iron/30" />
          <div className="h-8 w-16 bg-iron/30" />
          <div className="h-8 w-16 bg-iron/30" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-iron/20" />
          <div className="h-3 w-4/5 bg-iron/20" />
        </div>
      </div>
    </div>
  );
}
