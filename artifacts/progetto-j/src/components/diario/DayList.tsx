import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { EntryLight } from "@workspace/api-client-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { isRecordedRest, isTraining } from "@/lib/diario-analytics";

type Filter = "tutti" | "attrito" | "allenamento" | "riposo";
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "tutti", label: "TUTTI" },
  { id: "attrito", label: "CON ATTRITO" },
  { id: "allenamento", label: "ALLENAMENTO" },
  { id: "riposo", label: "RIPOSO" },
];
const STEP = 20;
const STORE = `pj:daylist:v1:${import.meta.env.BASE_URL}`;

type Saved = { filter: Filter; query: string; disc: string; visible: number };
function load(): Saved {
  const base: Saved = { filter: "tutti", query: "", disc: "", visible: STEP };
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(STORE) : null;
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<Saved>;
    return {
      filter: FILTERS.some((f) => f.id === s.filter) ? (s.filter as Filter) : "tutti",
      query: typeof s.query === "string" ? s.query : "",
      disc: typeof s.disc === "string" ? s.disc : "",
      visible: typeof s.visible === "number" && s.visible >= STEP ? s.visible : STEP,
    };
  } catch { return base; }
}

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

function discipline(e: EntryLight) {
  const t = e.tipoAllenamento?.trim();
  return t && t.toUpperCase() !== "NESSUNO" ? t.toUpperCase() : "";
}
function dateText(d: string) {
  try {
    const p = parseISO(d);
    return [d, format(p, "d MMMM yyyy", { locale: it }), format(p, "d MMM", { locale: it }), format(p, "dd/MM/yyyy"), format(p, "d/M")].join(" ").toLowerCase();
  } catch { return d; }
}

export function DayList({ entries, today }: { entries: EntryLight[]; today: string }) {
  const initial = useRef(load()).current;
  const [filter, setFilter] = useState<Filter>(initial.filter);
  const [query, setQuery] = useState(initial.query);
  const [disc, setDisc] = useState(initial.disc);
  const [visible, setVisible] = useState(initial.visible);
  const mobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { window.sessionStorage.setItem(STORE, JSON.stringify({ filter, query, disc, visible })); } catch { /* storage unavailable */ }
  }, [filter, query, disc, visible]);

  const disciplines = useMemo(() => Array.from(new Set(entries.filter((e) => e.data !== today || e.hasDiario).map(discipline).filter(Boolean))).sort(), [entries, today]);
  const isPending = (e: EntryLight) => e.data === today && !e.hasDiario;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const num = q.replace(/^(#|giorno\s*)/, "");
    return [...entries]
      .sort((a, b) => b.numero - a.numero)
      .filter((e) => filter === "tutti" || (!isPending(e) && (filter === "attrito" ? Boolean(e.attrito?.trim())
        : filter === "allenamento" ? isTraining(e) : isRecordedRest(e))))
      .filter((e) => !disc || (!isPending(e) && discipline(e) === disc))
      .filter((e) => {
        if (!q) return true;
        if (/^\d+$/.test(num) && (String(e.numero) === num || String(e.numero).startsWith(num))) return true;
        if (dateText(e.data).includes(q)) return true;
        if (isPending(e)) return false;
        return (e.sintesi ?? "").toLowerCase().includes(q) || (e.attrito ?? "").toLowerCase().includes(q) || discipline(e).toLowerCase().includes(q);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, filter, query, disc, today]);

  const shown = mobile ? filtered.slice(0, visible) : filtered;
  const active = filter !== "tutti" || query.trim() !== "" || disc !== "";
  const reset = () => { setFilter("tutti"); setQuery(""); setDisc(""); setVisible(STEP); inputRef.current?.focus(); };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra giorni">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="d-btn min-h-11" aria-pressed={filter === f.id} data-testid={`filter-${f.id}`}
              onClick={() => { setFilter(f.id); setVisible(STEP); }}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex-1">
            <span className="d-label mb-1 block">CERCA</span>
            <input
              ref={inputRef} type="search" value={query} className="d-input w-full min-h-11" data-testid="input-cerca-giorni"
              placeholder="Numero, data (12 marzo) o parole" aria-label="Cerca giorni" aria-describedby="daylist-help"
              onChange={(e) => { setQuery(e.target.value); setVisible(STEP); }}
            />
          </label>
          {disciplines.length > 0 && (
            <label className="md:w-56">
              <span className="d-label mb-1 block">DISCIPLINA</span>
              <select value={disc} className="d-input w-full min-h-11" data-testid="select-disciplina" aria-label="Filtra per disciplina"
                onChange={(e) => { setDisc(e.target.value); setVisible(STEP); }}>
                <option value="">TUTTE</option>
                {disciplines.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          )}
        </div>
        <p id="daylist-help" className="text-[14px] d-muted">Cerca per numero del giorno, data, disciplina o parole in sintesi e attrito.</p>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="d-label" data-testid="text-conteggio-giorni" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "GIORNO" : "GIORNI"}{mobile && filtered.length > shown.length ? ` · VISTI ${shown.length}` : ""}
        </p>
        {active && (
          <button type="button" className="d-btn min-h-11" data-testid="button-reset-filtri" onClick={reset}>AZZERA FILTRI</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border d-line px-6 py-14 text-center">
          <p className="d-title text-[32px]">NESSUN GIORNO TROVATO.</p>
          <p className="mt-2 text-[15px] d-muted">Cambia filtro o cerca un'altra parola.</p>
          {active && <button type="button" className="d-btn mt-5 min-h-11" data-testid="button-reset-vuoto" onClick={reset}>AZZERA FILTRI</button>}
        </div>
      ) : (
        <ol className="border-t d-line">
          {shown.map((e) => {
            const pending = isPending(e);
            return (
              <li key={e.id} className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-1 border-b d-line py-5 sm:grid-cols-[110px_1fr_auto]" data-testid={`row-giorno-${e.numero}`}>
                <div className="row-span-2 sm:row-span-1">
                  <Link href={`/giorno/${e.numero}`} className="d-link d-mono text-[15px] inline-flex min-h-11 items-center" data-testid={`link-giorno-${e.numero}`}>GIORNO {e.numero}</Link>
                  <div className="d-label mt-1">{format(parseISO(e.data), "d MMM", { locale: it })}</div>
                </div>
                {pending ? (
                  <div className="flex items-center gap-3 sm:col-span-2" data-testid={`status-in-corso-${e.numero}`}>
                    <span className="d-circle" aria-hidden="true" />
                    <div>
                      <div className="d-label" style={{ color: "#E8E4DE" }}>GIORNATA IN CORSO</div>
                      <div className="text-[14px] d-muted">Attendi completamento</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <div className="flex items-start gap-4">
                        {e.foto && (
                          <Link href={`/giorno/${e.numero}`} className="block w-20 shrink-0 overflow-hidden border d-line" aria-label={`Apri la foto del giorno ${e.numero}`}>
                            <img src={getPhotoUrl(e.foto) ?? undefined} alt={`Giorno ${e.numero}`} loading="lazy" decoding="async" className="aspect-square w-full object-cover grayscale" />
                          </Link>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] leading-relaxed">{e.sintesi?.trim() || <span className="d-muted">Apri la giornata per leggere il diario completo.</span>}</p>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 d-label d-muted" aria-label={`Dati del giorno ${e.numero}`}>
                            {e.km != null && <span>{e.km.toLocaleString("it-IT")} KM</span>}
                            {e.durata != null && <span>{e.durata} MIN</span>}
                            {e.sonno != null && <span>{e.sonno} H SONNO</span>}
                            {e.peso != null && <span>{e.peso.toLocaleString("it-IT")} KG</span>}
                            {e.kcal != null && <span>{e.kcal.toLocaleString("it-IT")} KCAL</span>}
                            {e.round != null && <span>{e.round} ROUND</span>}
                          </div>
                          <Link href={`/giorno/${e.numero}`} className="d-link mt-3 inline-flex min-h-11 items-center d-label" data-testid={`link-leggi-giorno-${e.numero}`}>
                            LEGGI GIORNO {e.numero} →
                          </Link>
                        </div>
                      </div>
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
          <button type="button" className="d-btn w-full min-h-11" data-testid="button-mostra-altri" onClick={() => setVisible((v) => v + STEP)}>
            MOSTRA ALTRI {Math.min(STEP, filtered.length - visible)}
          </button>
        </div>
      )}
    </div>
  );
}
