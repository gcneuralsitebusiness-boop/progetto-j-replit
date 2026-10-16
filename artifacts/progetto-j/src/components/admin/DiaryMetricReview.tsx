import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListEntriesQueryKey, getListLightEntriesQueryKey, getListEntrySummariesQueryKey,
  getGetLatestEntriesQueryKey, getGetEntryQueryKey, type Entry,
} from "@workspace/api-client-react";
import { CORRECTION_DAYS, explicitCorrection, type DiaryCorrection } from "@/lib/diary-corrections";

type Review = { entry: Entry; revision: string; correction: DiaryCorrection };
const endpoint = (numero: number) => `${import.meta.env.BASE_URL}api/entries/${numero}`;
const amount = (value: number | null, field: "km" | "durata") => value == null ? "non registrato" : `${value} ${field === "km" ? "km" : "min"}`;

async function readDay(numero: number) {
  const response = await fetch(endpoint(numero), { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(`Impossibile rileggere il giorno ${numero} (HTTP ${response.status}).`);
  const entry: Entry = await response.json();
  const revision = response.headers.get("ETag");
  if (!revision || revision.startsWith("W/")) throw new Error("La versione del server non supporta ancora la verifica protetta. Aggiorna il sito prima di correggere.");
  return { entry, revision };
}

/** Explicit, opt-in reconciliation; never auto-runs when the admin opens. */
export function DiaryMetricReview() {
  const queryClient = useQueryClient();
  const running = useRef(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function analyze() {
    if (running.current) return;
    running.current = true; setBusy(true); setError(""); setMessage("");
    setDownloaded(false); setSelected([]); setApplied([]); setReviews([]); setChecked(false);
    try {
      const originals = await Promise.all(CORRECTION_DAYS.map(readDay));
      setReviews(originals.flatMap(({ entry, revision }) => {
        const correction = explicitCorrection(entry);
        return correction ? [{ entry, revision, correction }] : [];
      }));
      setChecked(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Verifica non riuscita. Nessun valore modificato."); }
    finally { running.current = false; setBusy(false); }
  }

  function downloadOriginals() {
    const data = reviews.filter((r) => selected.includes(r.correction.id)).map(({ entry, revision, correction }) => ({
      ...correction, data: entry.data, originalText: entry.testo, revision,
    }));
    const url = URL.createObjectURL(new Blob([JSON.stringify({ createdAt: new Date().toISOString(), corrections: data }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `diario-prima-delle-correzioni-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }

  async function apply() {
    if (running.current || !downloaded || !selected.length) return;
    running.current = true; setBusy(true); setError(""); setMessage("");
    let savedCount = 0;
    try {
      for (const review of reviews.filter((r) => selected.includes(r.correction.id) && !applied.includes(r.correction.id))) {
        const { correction, revision, entry } = review;
        const response = await fetch(endpoint(correction.numero), {
          method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", "If-Match": revision },
          body: JSON.stringify({ [correction.field]: correction.after }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? `Correzione rifiutata per il giorno ${correction.numero} (HTTP ${response.status}).`);
        }
        // Mark a confirmed database write even if the subsequent re-read fails:
        // never encourage a blind retry of a change that may already be saved.
        setApplied((current) => [...current, correction.id]);
        savedCount++;
        const saved = await readDay(correction.numero);
        if (saved.entry[correction.field] !== correction.after || saved.entry.testo !== entry.testo) {
          throw new Error(`Il giorno ${correction.numero} è stato aggiornato ma la rilettura non coincide. Controlla il giorno prima di procedere.`);
        }
        queryClient.setQueryData(getGetEntryQueryKey(correction.numero), saved.entry);
      }
      setMessage(`${savedCount} correzioni salvate e rilette. Testi e date non modificati.`);
    } catch (err) {
      setError(`${savedCount > 0 ? `${savedCount} correzioni già salvate. ` : ""}${err instanceof Error ? err.message : "Verifica del salvataggio non riuscita."} Le altre correzioni non sono state applicate. Rileggi i giorni prima di riprovare.`);
    } finally {
      setDownloaded(false); setSelected([]);
      await Promise.all([
        getListEntriesQueryKey(), getListLightEntriesQueryKey(), getListEntrySummariesQueryKey(), getGetLatestEntriesQueryKey(), ["admin-dashboard"],
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      running.current = false; setBusy(false);
    }
  }

  return (
    <details className="border border-border bg-card p-5" data-testid="diary-metric-review">
      <summary className="cursor-pointer py-2 font-sans text-[14px] tracking-wide">VERIFICA COERENZA DI ORE E KM</summary>
      <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
        Confronta gli otto casi già verificati con il testo originale. Non interpreta tutte le giornate e non stima dati mancanti.
        Seleziona solo le correzioni che confermi; prima di applicarle scarica il confronto con gli originali.
        Agisce soltanto sul database di questo sito, senza sincronizzare anteprima e produzione.
      </p>
      <button type="button" className="btn-secondary mt-4 min-h-11 px-4" onClick={() => void analyze()} disabled={busy}> {busy ? "OPERAZIONE IN CORSO…" : "RILEGGI GLI ORIGINALI"} </button>
      <div role="status" className="mt-3 text-[14px]">{message || (checked && !reviews.length ? "Nessuna correzione esplicita da proporre nei casi verificati. Questo non certifica la completezza di tutti i dati." : "")}</div>
      {error && <p role="alert" className="mt-3 text-[14px] text-red-400">{error}</p>}
      <div className="mt-4 space-y-3">
        {reviews.map(({ correction }) => {
          const done = applied.includes(correction.id);
          return <label key={correction.id} className="flex items-start gap-3 border border-border p-4">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#B81D1D]" checked={selected.includes(correction.id)} disabled={busy || done}
              onChange={(event) => { setDownloaded(false); setSelected((ids) => event.target.checked ? [...ids, correction.id] : ids.filter((id) => id !== correction.id)); }} />
            <span className="min-w-0 text-[14px] leading-relaxed">
              <strong>Giorno {correction.numero} · {correction.field === "km" ? "Distanza" : "Durata"}</strong>
              <span className="block">{amount(correction.before, correction.field)} → {amount(correction.after, correction.field)}{done ? " · SALVATO" : ""}</span>
              {correction.evidence.map((quote) => <span key={quote} className="block break-words text-muted-foreground">«{quote}»</span>)}
            </span>
          </label>;
        })}
      </div>
      {reviews.some((r) => !applied.includes(r.correction.id)) && <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn-secondary min-h-11 px-4" disabled={busy || !selected.length} onClick={downloadOriginals}>1. SCARICA ORIGINALI SELEZIONATI</button>
        <button type="button" className="btn-primary min-h-11 px-4" disabled={busy || !downloaded || !selected.length} onClick={() => void apply()}>2. APPLICA {selected.length} CORREZIONI</button>
      </div>}
    </details>
  );
}
