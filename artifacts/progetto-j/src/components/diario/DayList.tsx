import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { EntryLight } from "@workspace/api-client-react";
import { isTraining } from "@/lib/diario-analytics";

type Filter = "tutti" | "attrito" | "allenamento";
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "tutti", label: "TUTTI" },
  { id: "attrito", label: "CON ATTRITO" },
  { id: "allenamento", label: "ALLENAMENTO" },
];
const STEP = 20;

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export function DayList({ entries, today }: { entries: EntryLight[]; today: string }) {
  const [filter, setFilter] = useState<Filter>("tutti");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(STEP);
  const mobile = useIsMobile();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...entries]
      .sort((a, b) => b.numero - a.numero)
      .filter((e) => filter === "tutti" || (filter === "attrito" ? Boolean(e.attrito?.trim()) : isTraining(e)))
      .filter((e) => !q || String(e.numero) === q.replace(/^#/, "") || String(e.numero).startsWith(q)
        || (e.sintesi ?? "").toLowerCase().includes(q) || (e.attrito ?? "").toLowerCase().includes(q));
  }, [entries, filter, query]);

  const shown = mobile ? filtered.slice(0, visible) : filtered;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra giorni">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="d-btn" aria-pressed={filter === f.id} data-testid={`filter-${f.id}`}
              onClick={() => { setFilter(f.id); setVisible(STEP); }}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search" value={query} className="d-input md:max-w-sm md:ml-auto" data-testid="input-cerca-giorni"
          placeholder="Numero o parole in sintesi e attrito" aria-label="Cerca giorni"
          onChange={(e) => { setQuery(e.target.value); setVisible(STEP); }}
        />
      </div>
      <p className="d-label mb-3" data-testid="text-conteggio-giorni">{filtered.length} {filtered.length === 1 ? "GIORNO" : "GIORNI"}</p>

      {filtered.length === 0 ? (
        <div className="border d-line px-6 py-14 text-center">
          <p className="d-title text-[32px]">NESSUN GIORNO TROVATO.</p>
          <p className="mt-2 text-[15px] d-muted">Cambia filtro o cerca un'altra parola.</p>
        </div>
      ) : (
        <ol className="border-t d-line">
          {shown.map((e) => {
            const pending = e.data === today && !e.hasDiario;
            return (
              <li key={e.id} className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-1 border-b d-line py-5 sm:grid-cols-[110px_1fr_auto]" data-testid={`row-giorno-${e.numero}`}>
                <div className="row-span-2 sm:row-span-1">
                  <Link href={`/giorno/${e.numero}`} className="d-link d-mono text-[15px]" data-testid={`link-giorno-${e.numero}`}>GIORNO {e.numero}</Link>
                  <div className="d-label mt-1">{format(parseISO(e.data), "d MMM", { locale: it })}</div>
                </div>
                {pending ? (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <span className="d-circle" aria-hidden="true" />
                    <div>
                      <div className="d-label" style={{ color: "#E8E4DE" }}>GIORNATA IN CORSO</div>
                      <div className="text-[14px] d-muted">Attendi completamento</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <p className="text-[15px] leading-relaxed">{e.sintesi?.trim() || <span className="d-muted">—</span>}</p>
                      {e.attrito?.trim() && (
                        <p className="mt-2 text-[14px] leading-relaxed d-muted"><span className="d-label d-red mr-2">ATTRITO</span>{e.attrito}</p>
                      )}
                    </div>
                    <div className="d-label col-start-2 sm:col-start-auto sm:text-right">
                      {isTraining(e) ? `${e.tipoAllenamento && e.tipoAllenamento !== "NESSUNO" ? e.tipoAllenamento : "ALLENAMENTO"}${e.durata != null ? ` · ${e.durata} MIN` : ""}` : e.tipoAllenamento?.trim() ? "RIPOSO" : "—"}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {mobile && visible < filtered.length && (
        <div className="mt-6 flex justify-center">
          <button type="button" className="d-btn w-full" data-testid="button-mostra-altri" onClick={() => setVisible((v) => v + STEP)}>
            MOSTRA ALTRI 20
          </button>
        </div>
      )}
    </div>
  );
}
