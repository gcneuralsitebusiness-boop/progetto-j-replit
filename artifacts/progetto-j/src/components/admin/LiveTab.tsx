import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetLiveQueryKey,
  getGetLiveScheduleQueryKey,
  useClearLiveOverride,
  useGetLiveSchedule,
  useSaveLiveSchedule,
  useSetLiveOverride,
} from "@workspace/api-client-react";
import type { LiveScheduleInput, LiveScheduleItem } from "@workspace/api-client-react";
import "./live-tab.css";

const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const ACTIVITIES = [
  { value: "SONNO", label: "Sonno" },
  { value: "LAVORO", label: "Lavoro" },
  { value: "ALLENAMENTO", label: "Allenamento" },
  { value: "LIBERO", label: "Tempo libero" },
] as const;
type Activity = LiveScheduleInput["attivita"];
type DraftRow = { key: string; giorno: number; inizio: string; fine: string; attivita: Activity };
const freshKey = () => `row-${Math.random().toString(36).slice(2, 10)}`;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Errore imprevisto.";
const isUnauthorized = (error: unknown) => /401|unauthorized|non autorizzat/i.test(errorText(error));

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
function asDraft(items: LiveScheduleItem[]): DraftRow[] {
  return items.map(({ giorno, inizio, fine, attivita }) => ({ key: freshKey(), giorno, inizio, fine, attivita }));
}
function validateRows(rows: DraftRow[]) {
  const errors: string[] = [];
  for (let day = 0; day < 7; day += 1) {
    const dayRows = rows.filter((row) => row.giorno === day).sort((a, b) => toMinutes(a.inizio) - toMinutes(b.inizio));
    if (!dayRows.length) { errors.push(`${DAYS[day]}: il programma deve coprire l’intera giornata.`); continue; }
    if (dayRows[0].inizio !== "00:00") errors.push(`${DAYS[day]}: la prima fascia deve iniziare alle 00:00.`);
    if (dayRows[dayRows.length - 1].fine !== "24:00") errors.push(`${DAYS[day]}: l’ultima fascia deve terminare alle 24:00.`);
    dayRows.forEach((row, index) => {
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.inizio)) errors.push(`${DAYS[day]}: inserisci un orario iniziale valido.`);
      if (!/^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/.test(row.fine)) errors.push(`${DAYS[day]}: inserisci un orario finale valido, fino a 24:00.`);
      const start = toMinutes(row.inizio);
      const end = row.fine === "24:00" ? 1440 : toMinutes(row.fine);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return;
      if (end <= start) errors.push(`${DAYS[day]}: ogni fascia deve avere una durata positiva.`);
      const next = dayRows[index + 1];
      if (next && row.fine !== next.inizio) errors.push(`${DAYS[day]}: le fasce devono essere consecutive, senza vuoti o sovrapposizioni.`);
    });
  }
  return [...new Set(errors)];
}

export function LiveTab() {
  const queryClient = useQueryClient();
  const scheduleQuery = useGetLiveSchedule();
  const saveSchedule = useSaveLiveSchedule();
  const setOverride = useSetLiveOverride();
  const clearOverride = useClearLiveOverride();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const schedule = scheduleQuery.data ?? [];
  const scheduleErrors = useMemo(() => validateRows(rows), [rows]);
  const dayRows = useMemo(
    () => rows.filter((row) => row.giorno === selectedDay).sort((a, b) => toMinutes(a.inizio) - toMinutes(b.inizio)),
    [rows, selectedDay],
  );

  useEffect(() => {
    if (scheduleQuery.data && !initialized) {
      setRows(asDraft(scheduleQuery.data));
      setInitialized(true);
    }
  }, [scheduleQuery.data, initialized]);

  const invalidateLive = () => {
    void queryClient.invalidateQueries({ queryKey: getGetLiveQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetLiveScheduleQueryKey() });
  };
  const patchRow = (key: string, patch: Partial<DraftRow>) => {
    setRows((current) => current.map((row) => row.key === key ? { ...row, ...patch } : row));
    setFeedback(null);
  };
  const save = () => {
    setFeedback(null);
    if (scheduleErrors.length) {
      setFeedback({ kind: "error", text: scheduleErrors[0] });
      return;
    }
    const programma: LiveScheduleInput[] = rows
      .slice()
      .sort((a, b) => a.giorno - b.giorno || toMinutes(a.inizio) - toMinutes(b.inizio))
      .map(({ giorno, inizio, fine, attivita }) => ({ giorno, inizio, fine, attivita }));
    saveSchedule.mutate({ data: { programma } }, {
      onSuccess: (result) => {
        setRows(asDraft(result));
        setFeedback({ kind: "success", text: "Programma settimanale salvato." });
        invalidateLive();
      },
      onError: (error) => setFeedback({
        kind: "error",
        text: isUnauthorized(error) ? "Sessione admin scaduta. Accedi di nuovo per salvare." : errorText(error),
      }),
    });
  };
  const applyOverride = (attivita: Activity) => {
    setFeedback(null);
    setOverride.mutate({ data: { attivita } }, {
      onSuccess: () => {
        setFeedback({ kind: "success", text: "Override attivo per tre ore." });
        invalidateLive();
      },
      onError: (error) => setFeedback({ kind: "error", text: isUnauthorized(error) ? "Sessione admin scaduta. Accedi di nuovo." : errorText(error) }),
    });
  };
  const resetOverride = () => {
    setFeedback(null);
    clearOverride.mutate(undefined, {
      onSuccess: () => {
        setFeedback({ kind: "success", text: "Override rimosso. È tornato attivo il programma settimanale." });
        invalidateLive();
      },
      onError: (error) => setFeedback({ kind: "error", text: isUnauthorized(error) ? "Sessione admin scaduta. Accedi di nuovo." : errorText(error) }),
    });
  };
  const addRange = () => {
    const last = dayRows[dayRows.length - 1];
    if (!last) {
      setRows((current) => [...current, { key: freshKey(), giorno: selectedDay, inizio: "00:00", fine: "24:00", attivita: "LIBERO" }]);
      setFeedback(null);
      return;
    }
    if (last.fine === "24:00") return;
    const nextStart = last.fine;
    const nextEndMinutes = Math.min(1440, toMinutes(nextStart) + 180);
    const nextEnd = nextEndMinutes === 1440 ? "24:00" : `${String(Math.floor(nextEndMinutes / 60)).padStart(2, "0")}:${String(nextEndMinutes % 60).padStart(2, "0")}`;
    setRows((current) => [
      ...current.map((row) => row.key === last.key ? { ...row, fine: nextStart } : row),
      { key: freshKey(), giorno: selectedDay, inizio: nextStart, fine: nextEnd, attivita: "LIBERO" },
      ...(nextEnd !== "24:00" ? [{ key: freshKey(), giorno: selectedDay, inizio: nextEnd, fine: "24:00", attivita: "LIBERO" as Activity }] : []),
    ]);
    setFeedback(null);
  };
  const removeRange = (key: string) => {
    const index = dayRows.findIndex((row) => row.key === key);
    const row = dayRows[index];
    if (!row || dayRows.length <= 1) return;
    const previous = dayRows[index - 1];
    const next = dayRows[index + 1];
    setRows((current) => current.filter((entry) => entry.key !== key).map((entry) => {
      if (previous && entry.key === previous.key) return { ...entry, fine: row.fine };
      if (!previous && next && entry.key === next.key) return { ...entry, inizio: row.inizio };
      return entry;
    }));
    setFeedback(null);
  };

  if (scheduleQuery.isLoading) {
    return <section className="live-admin"><div className="live-admin-skeleton" /><div className="live-admin-skeleton" /></section>;
  }
  if (scheduleQuery.isError) {
    const unauthorized = isUnauthorized(scheduleQuery.error);
    return (
      <section className="live-admin">
        <header className="live-admin-heading"><p className="live-admin-kicker">J / IN TEMPO REALE</p><h2>Programma live</h2></header>
        <div className="live-admin-alert" role="alert">
          <strong>{unauthorized ? "Accesso admin richiesto" : "Programma non disponibile"}</strong>
          <p>{unauthorized ? "La sessione è scaduta o non è attiva. Accedi all’area admin e riapri questa scheda." : errorText(scheduleQuery.error)}</p>
          <button type="button" className="live-admin-button secondary" onClick={() => void scheduleQuery.refetch()} data-testid="button-retry-live-schedule">Riprova</button>
        </div>
      </section>
    );
  }

  return (
    <section className="live-admin">
      <header className="live-admin-heading">
        <div><p className="live-admin-kicker">J / IN TEMPO REALE</p><h2>Il tempo, senza filtri.</h2></div>
        <p>Controlli pubblici del diario.<br />Le modifiche sono visibili su /live.</p>
      </header>
      {feedback && <div className={`live-admin-feedback ${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</div>}
      <section className="live-admin-override">
        <div className="live-admin-subhead"><div><span>01 / INTERVENTO TEMPORANEO</span><h3>Override di tre ore</h3></div><p>Sostituisce il programma corrente per tre ore.</p></div>
        <div className="live-override-actions">
          {ACTIVITIES.map(({ value, label }) => (
            <button key={value} type="button" className="live-admin-button" disabled={setOverride.isPending || clearOverride.isPending} onClick={() => applyOverride(value)} data-testid={`button-live-override-${value.toLowerCase()}`}>
              {setOverride.isPending ? "Attendi…" : label}
            </button>
          ))}
          <button type="button" className="live-admin-button clear" disabled={setOverride.isPending || clearOverride.isPending} onClick={resetOverride} data-testid="button-clear-live-override">
            {clearOverride.isPending ? "Attendi…" : "Rimuovi override"}
          </button>
        </div>
      </section>
      <section className="live-admin-schedule">
        <div className="live-admin-subhead"><div><span>02 / SETTIMANA TIPO</span><h3>Programma giornaliero</h3></div><p>Ogni giorno deve coprire in continuità dalle 00:00 alle 24:00.</p></div>
        <div className="live-day-tabs" role="tablist" aria-label="Giorno della settimana">
          {DAYS.map((day, index) => (
            <button key={day} type="button" role="tab" aria-selected={selectedDay === index} onClick={() => setSelectedDay(index)} data-testid={`tab-live-day-${index}`}>
              <span>{day.slice(0, 3)}</span><b>{String(index + 1).padStart(2, "0")}</b>
            </button>
          ))}
        </div>
        <div className="live-admin-range-list">
          {dayRows.map((row, index) => (
            <div className="live-admin-range" key={row.key}>
              <span className="live-range-number">{String(index + 1).padStart(2, "0")}</span>
              <label><span>DALLE</span><input type="text" inputMode="numeric" pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} value={row.inizio} onChange={(event) => patchRow(row.key, { inizio: event.target.value })} data-testid={`input-live-start-${index}`} /></label>
              <label><span>ALLE</span><input type="text" inputMode="numeric" pattern="(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)" maxLength={5} value={row.fine} onChange={(event) => patchRow(row.key, { fine: event.target.value })} data-testid={`input-live-end-${index}`} aria-describedby="live-end-time-note" /></label>
              <label className="live-activity-select"><span>ATTIVITÀ</span><select value={row.attivita} onChange={(event) => patchRow(row.key, { attivita: event.target.value as Activity })} data-testid={`select-live-activity-${index}`}>{ACTIVITIES.map((activity) => <option key={activity.value} value={activity.value}>{activity.label}</option>)}</select></label>
              <button type="button" className="live-remove-range" disabled={dayRows.length <= 1} onClick={() => removeRange(row.key)} aria-label={`Rimuovi fascia ${index + 1}`} data-testid={`button-remove-live-range-${index}`}>Rimuovi</button>
            </div>
          ))}
          <p className="live-admin-note" id="live-end-time-note">Formato 24 ore HH:MM. La chiusura della giornata è 24:00.</p>
          <button type="button" className="live-add-range" disabled={Boolean(dayRows.length && dayRows[dayRows.length - 1]?.fine === "24:00")} onClick={addRange} data-testid="button-add-live-range">{dayRows.length ? "+ Aggiungi fascia di tre ore" : "+ Crea prima fascia"}</button>
        </div>
        {scheduleErrors.length > 0 && (
          <div className="live-validation" role="status"><strong>Il programma non è ancora salvabile.</strong><span>{scheduleErrors[0]}</span></div>
        )}
        <div className="live-save-row">
          <span>{schedule.length} fasce caricate · 7 giorni</span>
          <button type="button" className="live-admin-button save" onClick={save} disabled={saveSchedule.isPending || !initialized} data-testid="button-save-live-schedule">
            {saveSchedule.isPending ? "Salvataggio…" : "Salva programma"}
          </button>
        </div>
      </section>
    </section>
  );
}
