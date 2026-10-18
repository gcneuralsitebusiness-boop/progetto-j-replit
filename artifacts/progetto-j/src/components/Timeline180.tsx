import type { Entry } from "@workspace/api-client-react";
import { Link } from "wouter";

export function Timeline180({ entries }: { entries: Entry[] }) {
  const completedDays = new Set(entries.map((e) => e.numero));
  const currentDay = entries.length > 0 ? Math.max(...entries.map((e) => e.numero)) : 0;
  const total = 180;
  const logged = completedDays.size;
  const skipped = currentDay - logged;
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
             giorno {currentDay} di {total} · {logged} registrati
             {skipped > 0 ? ` · ${skipped} saltati` : ""}
             {" · "}{remaining} rimanenti
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
           <span className="inline-block w-3 h-3 bg-primary border-2 border-foreground" />
          Oggi
        </span>
         <span className="flex items-center gap-2">
           <span className="inline-block w-3 h-3 bg-card border border-dashed border-[#333333]" />
           Saltato
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
          const isSkipped = !done && day < currentDay;
          const isMilestone = [30, 60, 90, 180].includes(day);
          const cellClass = `measured aspect-square flex items-center justify-center text-[9px] sm:text-[10px] border transition-colors ${
            isCurrent
              ? "bg-primary text-primary-foreground border-2 border-foreground"
              : done
              ? isMilestone
                ? "bg-[hsl(var(--bronze))] text-[hsl(var(--bronze-foreground))] border-[hsl(var(--bronze))]"
                : "bg-iron text-primary-foreground border-iron"
              : isSkipped
                ? "bg-card border border-dashed border-[#333333] text-[#444444]"
                : isMilestone
                  ? "bg-card border-[hsl(var(--bronze))]/50 text-[hsl(var(--bronze))]"
                  : "bg-card border-border text-muted-foreground"
          }`;
          const label = `Giorno ${day}${done ? " — registrato" : ""}${isCurrent ? " — corrente" : ""}`;
          const cell = (
            <span
              title={label}
              aria-label={label}
              className={cellClass}
            >
              {day}
            </span>
          );
          return done ? (
            <Link
              key={day}
              href={`/giorno/${day}`}
              className="timeline-day-link rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {cell}
            </Link>
          ) : (
            <div key={day}>{cell}</div>
          );
        })}
      </div>

      <div className="mt-8 border border-primary bg-transparent p-6 sm:p-8">
        <div className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary">GIORNO 180</div>
        <div className="mt-2 font-serif text-[clamp(24px,5vw,40px)] leading-none text-foreground bebas">IL REPORT FINALE</div>
        <p className="mt-4 text-[14px] font-sans text-muted-foreground">
          Tutti i dati, il metodo, gli errori. Gratis, a chi lo vuole.
        </p>
        <a href="#email-capture" className="btn-primary mt-6 inline-flex">RICEVILO</a>
      </div>

      <div className="cut-divider mt-8" />
    </div>
  );
}
