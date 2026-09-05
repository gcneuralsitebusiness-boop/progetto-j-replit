import { useEffect, useState, useRef } from "react";
import { useSearch, Link } from "wouter";
import { useListObiettivi, useGetLatestEntries } from "@workspace/api-client-react";
import type { Obiettivo } from "@workspace/api-client-react";
import { format, isSunday, startOfDay, nextSunday } from "date-fns";
import { it } from "date-fns/locale";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";

function getNextSundayDate() {
  const today = new Date();
  if (isSunday(today)) return today;
  return nextSunday(today);
}

function Diamond({
  obiettivo,
  isActive,
  isOtherActive,
  onClick,
  index,
  skipAnimation
}: {
  obiettivo: Obiettivo;
  isActive: boolean;
  isOtherActive: boolean;
  onClick: () => void;
  index: number;
  skipAnimation: boolean;
}) {
  const isFailed = obiettivo.stato === "fallito";
  const isCompleted = obiettivo.stato === "compiuto";
  
  let pct = Math.min(100, Math.max(0, (obiettivo.fatto / obiettivo.previsto) * 100));
  if (isCompleted) pct = 100;
  if (isFailed) pct = 0;

  let borderColor = "#B81D1D";
  let textColor = "#E8E4DE";
  
  if (isOtherActive) {
    borderColor = "#2A2725";
  } else if (isFailed) {
    borderColor = "#2A2725";
    textColor = "#2A2725";
  } else if (isCompleted) {
    borderColor = "#B81D1D";
    textColor = "#0A0A0A";
  }
  
  const transform = isActive 
    ? "scale(1.2)"
    : isOtherActive 
      ? `scale(0.7) translateX(${index === 0 ? '-40px' : index === 2 ? '40px' : '0'})` 
      : "scale(1)";

  const [mounted, setMounted] = useState(skipAnimation);

  useEffect(() => {
    if (skipAnimation) {
      setMounted(true);
      return undefined;
    }
    const timer = setTimeout(() => setMounted(true), 200 + index * 150);
    return () => clearTimeout(timer);
  }, [skipAnimation, index]);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        className="relative outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B81D1D] transition-[transform,opacity] duration-[350ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform, opacity: isOtherActive ? 0.35 : 1, width: "var(--diamond-size, 104px)", height: "var(--diamond-size, 104px)" }}
        data-testid={`diamond-${obiettivo.posizione}`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible transition-colors duration-[350ms]" style={{ color: borderColor }}>
          <clipPath id={`clip-${obiettivo.id}`}>
            <polygon points="50,0 100,50 50,100 0,50" />
          </clipPath>
          
          <polygon 
            points="50,0 100,50 50,100 0,50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1)" : "scale(0.8)",
              transformOrigin: "center",
              transition: skipAnimation ? "none" : "opacity 300ms linear, transform 300ms linear"
            }}
          />
          
          {(pct > 0 || isCompleted) && (
            <g clipPath={`url(#clip-${obiettivo.id})`}>
              <rect 
                x="0" 
                y="0" 
                width="100" 
                height="100" 
                fill="#B81D1D"
                style={{
                  transformOrigin: "bottom",
                  transform: `scaleY(${mounted ? pct / 100 : 0})`,
                  transition: skipAnimation ? "none" : "transform 500ms cubic-bezier(0.2,0.8,0.2,1)",
                  transitionDelay: skipAnimation ? "0ms" : "800ms"
                }}
              />
            </g>
          )}

          {isFailed && (
            <line
              x1="14.6"
              y1="14.6"
              x2="85.4"
              y2="85.4"
              stroke="currentColor"
              strokeWidth="1"
              style={{ opacity: mounted ? 1 : 0, transition: skipAnimation ? "none" : "opacity 300ms linear" }}
            />
          )}
        </svg>
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
             opacity: mounted ? 1 : 0,
             transition: skipAnimation ? "none" : "opacity 0ms",
             transitionDelay: skipAnimation ? "0ms" : "300ms"
          }}
        >
          <span className="font-serif text-[44px] leading-none transition-colors duration-[350ms] bebas" style={{ color: textColor }}>
            {obiettivo.posizione}
          </span>
        </div>
      </button>
      <div 
        className="mt-6 font-mono text-[13px] tracking-[0.2em] uppercase transition-all duration-[350ms]"
        style={{
          color: "#9A958F",
          opacity: isOtherActive ? 0 : 1,
          transform: isOtherActive ? "translateY(10px)" : "translateY(0)"
        }}
        data-testid={`diamond-area-${obiettivo.posizione}`}
      >
        {obiettivo.area}
      </div>
    </div>
  );
}

function GoalPanel({ obiettivo }: { obiettivo: Obiettivo }) {
  const currentTappa = obiettivo.tappa_corrente;
  
  return (
    <div className="w-full max-w-[800px] mx-auto animate-in fade-in duration-200 delay-150 fill-mode-both px-4 sm:px-0">
      <div className="font-mono text-[13px] text-[#B81D1D] tracking-[0.2em] mb-2 uppercase">
        OBIETTIVO {obiettivo.posizione} · {obiettivo.area}
      </div>
      <h2 className="font-serif text-[32px] sm:text-[40px] text-[#E8E4DE] leading-[0.95] mb-6 bebas uppercase">
        {obiettivo.titolo}
      </h2>
      <div className="h-px w-full bg-[#1A1A1A] mb-6" />
      <div className="font-serif text-[64px] leading-none mb-6 bebas">
        <span className="text-[#B81D1D]">{obiettivo.fatto}</span>
        <span className="text-[#E8E4DE]"> / {obiettivo.previsto}</span>
      </div>
      <div className="h-px w-full bg-[#1A1A1A] mb-6" />
      
      {currentTappa ? (
        <div className="mb-6">
          <div className="font-mono text-[13px] text-[#9A958F] tracking-[0.2em] mb-4 uppercase">
            TAPPA {currentTappa.numero} · GIORNI {currentTappa.giorno_inizio}-{currentTappa.giorno_fine}
          </div>
          <div className="flex flex-col gap-3">
            {currentTappa.task.map(task => (
              <div key={task.id} className="flex items-center gap-3 font-sans text-[15px]">
                {task.saltato ? (
                  <>
                    <div className="w-[10px] h-[10px] border border-[#2A2725] flex items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="w-[14px] h-px bg-[#2A2725] rotate-45 absolute" />
                    </div>
                    <span className="text-[#2A2725]">{task.testo}</span>
                  </>
                ) : task.giorno_completato ? (
                  <>
                    <div className="w-[10px] h-[10px] bg-[#E8E4DE] shrink-0" />
                    <span className="text-[#E8E4DE]">{task.testo}</span>
                    <Link href={`/giorno/${task.giorno_completato}`} className="ml-auto font-mono text-[13px] text-[#9A958F] tracking-[0.1em] hover:text-[#B81D1D] transition-colors">
                      G.{task.giorno_completato}
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="w-[10px] h-[10px] border border-[#9A958F] shrink-0" />
                    <span className="text-[#C9C4BD]">{task.testo}</span>
                  </>
                )}
              </div>
            ))}
            {currentTappa.task.length === 0 && (
              <span className="text-[#9A958F] text-[15px]">Nessun task in questa tappa.</span>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 font-mono text-[13px] text-[#9A958F] tracking-[0.2em]">
          NESSUNA TAPPA ATTIVA
        </div>
      )}

      {obiettivo.tappe_precedenti.length > 0 && (
        <div className="mb-6">
          <div className="font-mono text-[13px] text-[#9A958F] tracking-[0.2em] mb-3 uppercase">
            TAPPE PRECEDENTI
          </div>
          <div className="flex flex-wrap gap-4 text-[15px]">
            {obiettivo.tappe_precedenti.map(tp => (
              <div key={tp.numero} className="flex items-center gap-2">
                <span className="font-mono text-[#9A958F]">{tp.numero}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: tp.task_totali }).map((_, i) => (
                    <div key={i} className={`w-[8px] h-[8px] ${i < tp.task_fatti ? "bg-[#0A0A0A] border border-[#E8E4DE] !bg-[#E8E4DE]" : "border border-[#9A958F]"}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {obiettivo.prova && (
        <div className="font-sans text-[15px] text-[#9A958F] border-t border-[#1A1A1A] pt-6 mt-6">
          {obiettivo.prova}
        </div>
      )}
    </div>
  );
}

export default function Obiettivi() {
  const { data: obiettivi, isLoading, isError } = useListObiettivi();
  const { data: latestEntries } = useGetLatestEntries();
  const search = useSearch();
  const hasDirectGoal = Boolean(new URLSearchParams(search).get("rombo"));
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [skipAnimation, setSkipAnimation] = useState(hasDirectGoal);
  const [lineMounted, setLineMounted] = useState(hasDirectGoal);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const romboParam = searchParams.get("rombo");
    if (romboParam && obiettivi) {
      const target = obiettivi.find(o => String(o.posizione) === romboParam);
      if (target) {
        setSkipAnimation(true);
        setLineMounted(true);
        setActiveId(target.id);
      }
    } else {
      const timer = setTimeout(() => setLineMounted(true), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [search, obiettivi]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeId !== null && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Find if we clicked on a diamond button
        const isDiamond = (e.target as Element).closest('[data-testid^="diamond-"]');
        if (!isDiamond) {
          setActiveId(null);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeId]);

  if (isError) {
    return (
      <>
        <DataErrorState />
        <SiteFooter />
      </>
    );
  }

  if (isLoading || !obiettivi) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <span className="text-muted-foreground font-mono uppercase tracking-widest text-[13px] animate-pulse">
          Caricamento...
        </span>
      </div>
    );
  }

  const latestDay = latestEntries?.[0]?.numero ?? 1;
  const ciclo = obiettivi[0]?.ciclo ?? 1;

  // Check if today is sunday or current tappa is overdue
  const today = startOfDay(new Date());
  const isTodaySunday = isSunday(today);
  const nextVerifyDate = getNextSundayDate();
  
  // Find if any active tappa is overdue
  let isOverdue = false;
  for (const o of obiettivi) {
    if (o.tappa_corrente && latestDay > o.tappa_corrente.giorno_fine) {
      isOverdue = true;
      break;
    }
  }

  const checkColor = isTodaySunday || isOverdue ? "text-[#B81D1D]" : "text-[#9A958F]";
  const activeObj = obiettivi.find(o => o.id === activeId);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] selection:bg-[#B81D1D] selection:text-white">
      {/* Top Left */}
      <div className="absolute top-24 left-5 sm:left-6 z-10">
        <span className="font-mono text-[13px] text-[#B81D1D] tracking-[0.15em]">
          CICLO {ciclo} · GIORNO {latestDay} / 180
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center py-32 overflow-hidden relative">
        <style>{`
          .diamond-grid {
            --diamond-size: 88px;
          }
          @media (min-width: 768px) {
            .diamond-grid { --diamond-size: 104px; }
          }
          @media (max-width: 379px) {
            .diamond-grid { --diamond-size: 72px; }
          }
        `}</style>

        {/* Reserved space for panel */}
        <div 
          ref={containerRef}
          className="w-full flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ height: activeId ? "auto" : "280px", minHeight: activeId ? "280px" : "280px" }}
        >
          {activeObj && (
            <div className="w-full h-full flex flex-col justify-end pb-12">
              <GoalPanel key={activeObj.id} obiettivo={activeObj} />
            </div>
          )}
        </div>

        {/* Horizontal Line and Diamonds */}
        <div className="relative w-full max-w-[1000px] mx-auto px-4 sm:px-12 diamond-grid">
          {/* Animated Line */}
          <div className="absolute left-0 right-0 top-[calc(var(--diamond-size)/2)] -translate-y-1/2 h-px z-0 overflow-hidden">
            <div 
              className="w-full h-full bg-[#1A1A1A] transition-transform duration-[600ms] ease-out origin-left"
              style={{ transform: lineMounted ? "scaleX(1)" : "scaleX(0)", transition: skipAnimation ? "none" : "transform 600ms ease-out" }}
            />
          </div>

          {/* Diamonds */}
          <div className="relative z-10 flex justify-between items-start max-w-[800px] mx-auto">
            {obiettivi.map((obiettivo, index) => (
              <div 
                key={obiettivo.id} 
              >
                <Diamond
                  index={index}
                  skipAnimation={skipAnimation}
                  obiettivo={obiettivo}
                  isActive={activeId === obiettivo.id}
                  isOtherActive={activeId !== null && activeId !== obiettivo.id}
                  onClick={() => setActiveId(activeId === obiettivo.id ? null : obiettivo.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Footer Area */}
      <div className="pb-12 text-center">
        <span className={`font-mono text-[13px] tracking-[0.15em] ${checkColor}`}>
          PROSSIMA VERIFICA · DOMENICA {format(nextVerifyDate, "d MMM", { locale: it }).toUpperCase()}
        </span>
      </div>

      <SiteFooter />
    </div>
  );
}
