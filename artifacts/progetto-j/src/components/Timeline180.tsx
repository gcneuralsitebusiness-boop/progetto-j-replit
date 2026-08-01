import type { Entry } from "@workspace/api-client-react";

export function Timeline180({ entries }: { entries: Entry[] }) {
  const completedDays = new Set(entries.map((e) => e.numero));
  const currentDay = entries.length > 0 ? Math.max(...entries.map((e) => e.numero)) : 0;
  const total = 180;
  const completed = completedDays.size;
  const remaining = total - currentDay;
  const percent = total > 0 ? Math.round((currentDay / total) * 100) : 0;

  const days = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="font-serif text-[clamp(48px,10vw,96px)] leading-[0.85] tracking-wide bebas text-foreground">
            180 GIORNI
          </h3>
          <p className="text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.2em] text-muted-foreground mt-3">
            {completed} registrati · giorno {currentDay} di {total} · {remaining} rimanenti
          </p>
        </div>
        <div className="text-[12px] font-sans uppercase tracking-[0.2em] text-primary font-semibold">
          {percent}% completato
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#1a1a1a] border-b border-border mb-4">
        <div className="h-full bg-iron transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 text-[10px] font-sans uppercase tracking-[0.15em] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-iron border border-iron" />
          Registrato
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-[hsl(var(--bronze))] border border-[hsl(var(--bronze))]" />
          Tappa
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-[#1a1a1a] border border-primary" />
          Oggi
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-card border border-border" />
          Avanti
        </span>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-10 gap-1 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-24">
        {days.map((day) => {
          const done = completedDays.has(day);
          const isCurrent = day === currentDay && currentDay > 0;
          const isMilestone = [30, 60, 90, 180].includes(day);
          return (
            <div
              key={day}
              title={`Giorno ${day}${done ? " — registrato" : ""}${isCurrent ? " — corrente" : ""}`}
              className={`measured aspect-square flex items-center justify-center text-[9px] sm:text-[10px] border transition-colors ${
                done
                  ? isMilestone
                    ? "bg-[hsl(var(--bronze))] text-[hsl(var(--bronze-foreground))] border-[hsl(var(--bronze))]"
                     : "bg-iron text-primary-foreground border-iron"
                  : isCurrent
                     ? "bg-[#1a1a1a] border-primary text-primary"
                    : isMilestone
                      ? "bg-card border-[hsl(var(--bronze))]/50 text-[hsl(var(--bronze))]"
                      : "bg-card border-border text-muted-foreground"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="cut-divider mt-8" />
    </div>
  );
}
