import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetPlannerAnnotation,
  useSavePlannerAnnotation,
  getGetPlannerAnnotationQueryKey,
} from "@workspace/api-client-react";
import type { PlannerAnnotation } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type PlannerTaskRow = {
  id: number;
  data: string;
  testo: string;
  stato: string;
  tipo: string;
  priorita: number;
  ordine: number | null;
};

type View = "todo" | "note";

function romeToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftDate(value: string, amount: number): string {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + amount, 12));
  return date.toISOString().slice(0, 10);
}

function longDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const UNSAVED_MSG = "L'annotazione ha modifiche non salvate. Uscire e perderle?";

export function PlannerTab() {
  const queryClient = useQueryClient();
  const today = romeToday();
  const [date, setDate] = useState(today);
  const [view, setView] = useState<View>("todo");

  // Annotation draft state
  const [draft, setDraft] = useState("");
  const [baseline, setBaseline] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const initializedFor = useRef<string | null>(null);
  const dirty = initializedFor.current === date && draft !== baseline;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const [newTask, setNewTask] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  const annotationKey = getGetPlannerAnnotationQueryKey({ data: date });
  const annotation = useGetPlannerAnnotation({ data: date }, { query: { queryKey: annotationKey } });
  const saveAnnotation = useSavePlannerAnnotation();

  const tasksQuery = useQuery({
    queryKey: ["planner-tasks", date],
    queryFn: () => fetchJson<PlannerTaskRow[]>(`/admin/planner/tasks?data=${date}`),
  });
  const tasks = [...(tasksQuery.data ?? [])].sort(
    (a, b) => (a.ordine ?? Number.MAX_SAFE_INTEGER) - (b.ordine ?? Number.MAX_SAFE_INTEGER) || a.id - b.id,
  );

  // Init / sync annotation without clobbering dirty input
  useEffect(() => {
    const server = annotation.data;
    if (!server || server.data !== date) return;
    if (initializedFor.current !== date) {
      initializedFor.current = date;
      setDraft(server.testo);
      setBaseline(server.testo);
      setSaveState("idle");
      return;
    }
    if (!dirtyRef.current) {
      setDraft(server.testo);
      setBaseline(server.testo);
    }
  }, [annotation.data, date]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    const leave = (event: Event) => {
      if (dirtyRef.current && !window.confirm(UNSAVED_MSG)) event.preventDefault();
    };
    window.addEventListener("admin-before-navigate", leave);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("admin-before-navigate", leave);
    };
  }, []);

  function confirmLeave(): boolean {
    return !dirtyRef.current || window.confirm(UNSAVED_MSG);
  }

  function changeDate(next: string) {
    if (!next || next === date) return;
    if (!confirmLeave()) return;
    initializedFor.current = null;
    setDraft("");
    setBaseline("");
    setSaveState("idle");
    setTaskError(null);
    setDate(next);
  }

  function changeView(next: View) {
    if (next === view) return;
    if (view === "note" && !confirmLeave()) return;
    if (view === "note") {
      setDraft(baseline);
    }
    setView(next);
  }

  async function handleSave() {
    const targetDate = date;
    const text = draft;
    setSaveState("idle");
    try {
      const result = await saveAnnotation.mutateAsync({ data: { data: targetDate, testo: text } });
      queryClient.setQueryData<PlannerAnnotation>(
        getGetPlannerAnnotationQueryKey({ data: targetDate }),
        result,
      );
      if (initializedFor.current === targetDate) {
        setBaseline(text);
        setSaveState("saved");
      }
    } catch {
      if (initializedFor.current === targetDate) setSaveState("error");
    }
  }

  const createTask = useMutation({
    mutationFn: ({ data, testo }: { data: string; testo: string }) =>
      fetchJson<PlannerTaskRow>("/admin/planner/tasks", {
        method: "POST",
        body: JSON.stringify({ data, testo, tipo: "ALTRO", stato: "DA FARE", priorita: 2 }),
      }),
    onSuccess: (_row, vars) => {
      if (vars.data === date) setNewTask("");
      queryClient.invalidateQueries({ queryKey: ["planner-tasks", vars.data] });
    },
    onError: () => setTaskError("Non è stato possibile aggiungere la voce."),
  });

  const toggleTask = useMutation({
    mutationFn: ({ id, stato }: { id: number; stato: string; data: string }) =>
      fetchJson<PlannerTaskRow>(`/admin/planner/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ stato }),
      }),
    onMutate: ({ id, stato, data }) => {
      queryClient.setQueryData<PlannerTaskRow[]>(["planner-tasks", data], (old) =>
        old?.map((row) => (row.id === id ? { ...row, stato } : row)),
      );
    },
    onError: () => setTaskError("Non è stato possibile aggiornare la voce."),
    onSettled: (_r, _e, vars) => queryClient.invalidateQueries({ queryKey: ["planner-tasks", vars.data] }),
  });

  const deleteTask = useMutation({
    mutationFn: ({ id }: { id: number; data: string }) =>
      fetchJson<void>(`/admin/planner/tasks/${id}`, { method: "DELETE" }),
    onError: () => setTaskError("Non è stato possibile eliminare la voce."),
    onSettled: (_r, _e, vars) => queryClient.invalidateQueries({ queryKey: ["planner-tasks", vars.data] }),
  });

  function submitTask() {
    const testo = newTask.trim();
    if (!testo || createTask.isPending) return;
    setTaskError(null);
    createTask.mutate({ data: date, testo });
  }

  const legacyNotes = annotation.data?.data === date ? annotation.data.legacyNotes : [];
  const annotationReady = initializedFor.current === date;
  const doneCount = tasks.filter((t) => t.stato === "FATTO").length;

  return (
    <section className="space-y-8" data-testid="planner-tab">
      {/* Date header */}
      <div className="border-b border-[#262626] pb-6">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#6E6A65]" data-testid="text-planner-date-label">
          {date === today ? "OGGI" : "GIORNO SELEZIONATO"}
        </div>
        <h2 className="bebas mt-1 text-[40px] leading-none tracking-[0.04em] text-[#E8E4DE] first-letter:uppercase sm:text-[56px]" data-testid="text-planner-date">
          {longDate(date)}
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => changeDate(shiftDate(date, -1))}
            className="h-10 w-10 border border-[#333] font-mono text-[14px] text-[#E8E4DE] transition-colors hover:border-[#B81D1D]"
            aria-label="Giorno precedente"
            data-testid="button-planner-prev-day"
          >
            ‹
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            className="h-10 border border-[#333] bg-transparent px-3 font-mono text-[12px] text-[#E8E4DE] outline-none [color-scheme:dark] focus:border-[#B81D1D]"
            aria-label="Seleziona data"
            data-testid="input-planner-date"
          />
          <button
            type="button"
            onClick={() => changeDate(shiftDate(date, 1))}
            className="h-10 w-10 border border-[#333] font-mono text-[14px] text-[#E8E4DE] transition-colors hover:border-[#B81D1D]"
            aria-label="Giorno successivo"
            data-testid="button-planner-next-day"
          >
            ›
          </button>
          {date !== today && (
            <button
              type="button"
              onClick={() => changeDate(today)}
              className="h-10 border border-[#B81D1D] px-4 font-mono text-[11px] tracking-[0.16em] text-[#B81D1D] transition-colors hover:bg-[#B81D1D] hover:text-[#E8E4DE]"
              data-testid="button-planner-today"
            >
              OGGI
            </button>
          )}
        </div>
      </div>

      {/* View switch */}
      <div className="flex border-b border-[#262626]" role="tablist">
        {([["todo", "Cose da fare"], ["note", "Annotazione"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => changeView(key)}
            className={`-mb-px border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
              view === key ? "border-[#B81D1D] text-[#E8E4DE]" : "border-transparent text-[#6E6A65] hover:text-[#E8E4DE]"
            }`}
            data-testid={`tab-planner-${key}`}
          >
            {label}
            {key === "note" && dirty && <span className="ml-2 text-[#B81D1D]">•</span>}
          </button>
        ))}
      </div>

      {view === "todo" ? (
        <div className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitTask();
            }}
            className="flex gap-2"
          >
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value.slice(0, 500))}
              placeholder="Roba da fare"
              disabled={createTask.isPending}
              className="min-h-12 min-w-0 flex-1 border border-[#333] bg-transparent px-3 font-sans text-[15px] text-[#E8E4DE] outline-none placeholder:text-[#6E6A65] focus:border-[#B81D1D] disabled:opacity-60"
              data-testid="input-planner-new-task"
            />
            <button
              type="submit"
              disabled={!newTask.trim() || createTask.isPending}
              className="w-12 border border-[#B81D1D] font-mono text-[22px] text-[#B81D1D] transition-colors hover:bg-[#B81D1D] hover:text-[#E8E4DE] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#B81D1D]"
              aria-label="Aggiungi"
              data-testid="button-planner-add-task"
            >
              +
            </button>
          </form>

          {taskError && (
            <p className="admin-form-error font-sans text-[13px] text-[#E8E4DE]" role="alert" data-testid="text-planner-task-error">
              {taskError}
            </p>
          )}

          {tasksQuery.isLoading ? (
            <div className="space-y-2" data-testid="status-planner-tasks-loading">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse border border-[#1F1F1F] bg-[#121212]" />
              ))}
            </div>
          ) : tasksQuery.isError ? (
            <div className="flex items-center gap-4 border border-[#333] px-4 py-3" data-testid="status-planner-tasks-error">
              <span className="flex-1 font-sans text-[13px] text-[#B81D1D]">Errore nel caricamento.</span>
              <button
                type="button"
                onClick={() => tasksQuery.refetch()}
                className="font-mono text-[11px] tracking-[0.16em] text-[#E8E4DE] underline-offset-4 hover:underline"
                data-testid="button-planner-tasks-retry"
              >
                RIPROVA
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <p className="border-l-2 border-[#333] pl-4 font-sans text-[14px] text-[#6E6A65]" data-testid="text-planner-tasks-empty">
              Niente per questo giorno.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-[#1F1F1F] border-y border-[#1F1F1F]">
                {tasks.map((task) => {
                  const done = task.stato === "FATTO";
                  return (
                    <li key={task.id} className="group flex items-center gap-4 py-3" data-testid={`row-planner-task-${task.id}`}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={task.testo}
                        onClick={() => {
                          setTaskError(null);
                          toggleTask.mutate({ id: task.id, stato: done ? "DA FARE" : "FATTO", data: date });
                        }}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center border transition-colors duration-150 ${
                          done ? "border-[#B81D1D] bg-[#B81D1D]" : "border-[#555] hover:border-[#E8E4DE]"
                        }`}
                        data-testid={`checkbox-planner-task-${task.id}`}
                      >
                        {done && (
                          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
                            <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="#E8E4DE" strokeWidth="1.8" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`min-w-0 flex-1 break-words font-sans text-[15px] transition-colors ${
                          done ? "text-[#6E6A65] line-through decoration-[#B81D1D]" : "text-[#E8E4DE]"
                        }`}
                        data-testid={`text-planner-task-${task.id}`}
                      >
                        {task.testo}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Eliminare "${task.testo}"?`)) deleteTask.mutate({ id: task.id, data: date });
                        }}
                        className="font-mono text-[14px] text-[#444] opacity-100 transition-colors hover:text-[#B81D1D] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                        aria-label={`Elimina ${task.testo}`}
                        data-testid={`button-planner-delete-task-${task.id}`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="font-mono text-[10px] tracking-[0.2em] text-[#6E6A65]" data-testid="text-planner-tasks-count">
                {doneCount}/{tasks.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {annotation.isError && !annotationReady ? (
            <div className="flex items-center gap-4 border border-[#333] px-4 py-3" data-testid="status-planner-annotation-error">
              <span className="flex-1 font-sans text-[13px] text-[#B81D1D]">Errore nel caricamento dell'annotazione.</span>
              <button
                type="button"
                onClick={() => annotation.refetch()}
                className="font-mono text-[11px] tracking-[0.16em] text-[#E8E4DE] underline-offset-4 hover:underline"
                data-testid="button-planner-annotation-retry"
              >
                RIPROVA
              </button>
            </div>
          ) : !annotationReady ? (
            <div className="h-72 animate-pulse border border-[#1F1F1F] bg-[#121212]" data-testid="status-planner-annotation-loading" />
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value.slice(0, 100000));
                  if (saveState !== "idle") setSaveState("idle");
                }}
                rows={14}
                placeholder="Annotazioni di oggi"
                className="w-full resize-y border border-[#262626] bg-[#0D0D0D] p-4 font-sans text-[15px] leading-7 text-[#E8E4DE] outline-none placeholder:text-[#444] focus:border-[#B81D1D]"
                data-testid="input-planner-annotation"
              />
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || saveAnnotation.isPending}
                  className="btn-primary disabled:pointer-events-none disabled:opacity-40"
                  data-testid="button-planner-save-annotation"
                >
                  {saveAnnotation.isPending ? "Salvataggio..." : "Salva"}
                </button>
                <span
                  className={`font-mono text-[11px] tracking-[0.14em] ${saveState === "error" ? "text-[#B81D1D]" : "text-[#6E6A65]"}`}
                  role="status"
                  data-testid="status-planner-annotation"
                >
                  {saveAnnotation.isPending
                    ? "SALVATAGGIO IN CORSO"
                    : saveState === "error"
                      ? "ERRORE: NON SALVATO, IL TESTO È ANCORA QUI"
                      : dirty
                        ? "MODIFICHE NON SALVATE"
                        : saveState === "saved"
                          ? "SALVATO"
                          : ""}
                </span>
              </div>
            </>
          )}

          {legacyNotes.length > 0 && (
            <div className="border-t border-[#1F1F1F] pt-4" data-testid="section-planner-legacy-notes">
              <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-[#555]">NOTE PRECEDENTI</div>
              <ul className="space-y-1">
                {legacyNotes.map((note) => (
                  <li
                    key={note.id}
                    className="border-l border-[#333] pl-3 font-sans text-[13px] text-[#6E6A65]"
                    data-testid={`text-planner-legacy-note-${note.id}`}
                  >
                    {note.testo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
