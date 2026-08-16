import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListEntriesQueryKey, useListEntries } from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";

type FixedTask = "DIARIO" | "TRACKING" | "CARD IG" | "CONTENUTO";

const FIXED_TASKS: FixedTask[] = ["DIARIO", "TRACKING", "CARD IG", "CONTENUTO"];
const WEEKDAYS = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type PlannerTask = {
  testo: FixedTask;
  stato: "DA FARE" | "FATTO";
};

type PlannerExtra = {
  id: number;
  data: string;
  testo: string;
};

type PlannerState = {
  tasks: PlannerTask[];
  extras: PlannerExtra[];
  fixedNote: string;
};

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  result.setHours(12, 0, 0, 0);
  return result;
}

function dayNumber(entries: Entry[] | undefined, date: string): string {
  const exactEntry = entries?.find((entry) => entry.data === date);
  if (exactEntry) return String(exactEntry.numero).padStart(3, "0");
  const today = localDate(new Date());
  const todayEntry = entries?.find((entry) => entry.data === today);
  if (todayEntry) {
    const offset = Math.round((parseDate(date).getTime() - parseDate(today).getTime()) / 86400000);
    return String(todayEntry.numero + offset).padStart(3, "0");
  }
  const latest = [...(entries ?? [])].sort((a, b) => b.numero - a.numero)[0];
  return latest ? String(latest.numero).padStart(3, "0") : "—";
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

function doneTasks(rows: PlannerTask[] | undefined): Set<FixedTask> {
  return new Set((rows ?? []).filter((row) => row.stato === "FATTO").map((row) => row.testo));
}

function WeekDots({
  dates,
  today,
  rows,
  selectedDate,
  onSelect,
}: {
  dates: Date[];
  today: string;
  rows: PlannerTask[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const grouped = useMemo(() => {
    const result = new Map<string, Set<string>>();
    for (const row of rows) {
      const date = (row as PlannerTask & { data?: string }).data;
      if (!date || row.stato !== "FATTO") continue;
      const current = result.get(date) ?? new Set<string>();
      current.add(row.testo);
      result.set(date, current);
    }
    return result;
  }, [rows]);

  return (
    <div className="border-t border-[#262626] pt-6">
      <div className="mb-4 font-mono text-[10px] tracking-[0.2em] text-[#6E6A65]">SETTIMANA</div>
      <div className="grid grid-cols-7 gap-2">
        {dates.map((date, index) => {
          const key = localDate(date);
          const completed = grouped.get(key)?.size ?? 0;
          const future = key > today;
          const color = future ? "#E8E4DE" : completed === 4 ? "#00FF41" : completed > 0 ? "#187A3A" : "#333";
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`flex min-w-0 flex-col items-center gap-2 py-1 ${selectedDate === key ? "text-[#E8E4DE]" : "text-[#6E6A65]"}`}
              aria-label={`${WEEKDAYS[index]} ${date.getDate()}, ${completed} task completati`}
            >
              <span className="font-mono text-[10px]">{WEEKDAYS[index]}</span>
              <span className="h-3 w-3 border border-[#555]" style={{ backgroundColor: color, borderColor: color }} />
              <span className="font-mono text-[10px]">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PlannerTab() {
  const queryClient = useQueryClient();
  const today = localDate(new Date());
  const weekDates = useMemo(() => {
    const first = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, index) => addDays(first, index));
  }, []);
  const weekFrom = localDate(weekDates[0]);
  const weekTo = localDate(weekDates[6]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [extraText, setExtraText] = useState("");
  const [fixedNote, setFixedNote] = useState("");
  const [fixedNoteOpen, setFixedNoteOpen] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: entries } = useListEntries({ query: { queryKey: getListEntriesQueryKey() } });
  const { data: todayState } = useQuery({
    queryKey: ["planner-state", today],
    queryFn: () => fetchJson<PlannerState>(`/admin/planner/state?data=${today}`),
  });
  const { data: selectedState } = useQuery({
    queryKey: ["planner-state", selectedDate],
    queryFn: () => fetchJson<PlannerState>(`/admin/planner/state?data=${selectedDate}`),
    enabled: selectedDate !== today,
  });
  const activeState = selectedDate === today ? todayState : selectedState;
  const { data: weekRows = [] } = useQuery({
    queryKey: ["planner-checklist", weekFrom, weekTo],
    queryFn: () => fetchJson<(PlannerTask & { data: string })[]>(`/admin/planner/checklist?from=${weekFrom}&to=${weekTo}`),
  });

  const [checked, setChecked] = useState<Record<FixedTask, boolean>>({
    DIARIO: false,
    TRACKING: false,
    "CARD IG": false,
    CONTENUTO: false,
  });

  useEffect(() => {
    if (!activeState) return;
    const next = doneTasks(activeState.tasks);
    setChecked({
      DIARIO: next.has("DIARIO"),
      TRACKING: next.has("TRACKING"),
      "CARD IG": next.has("CARD IG"),
      CONTENUTO: next.has("CONTENUTO"),
    });
  }, [activeState]);

  useEffect(() => {
    if (todayState) setFixedNote(todayState.fixedNote);
  }, [todayState]);

  const toggleTask = useMutation({
    mutationFn: ({ task, done }: { task: FixedTask; done: boolean }) => (
      fetchJson<PlannerTask>("/admin/planner/checklist", {
        method: "POST",
        body: JSON.stringify({ data: selectedDate, task, done }),
      })
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner"] }),
  });

  const addExtra = useMutation({
    mutationFn: (text: string) => fetchJson<PlannerExtra>("/admin/planner/extras", {
      method: "POST",
      body: JSON.stringify({ data: selectedDate, testo: text }),
    }),
    onSuccess: () => {
      setExtraText("");
      queryClient.invalidateQueries({ queryKey: ["planner-state", selectedDate] });
    },
  });

  const deleteExtra = useMutation({
    mutationFn: (id: number) => fetchJson<void>(`/admin/planner/extras/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner-state", selectedDate] }),
  });

  const saveFixedNote = useMutation({
    mutationFn: (text: string) => fetchJson("/admin/planner/fixed-note", {
      method: "PUT",
      body: JSON.stringify({ testo: text }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner-state", today] }),
  });

  useEffect(() => {
    if (!todayState || fixedNote === todayState.fixedNote) return;
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveFixedNote.mutate(fixedNote), 500);
    return () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    };
  }, [fixedNote, todayState, saveFixedNote]);

  const selectedSummary = checked;
  const selectedExtras = activeState?.extras ?? [];
  const activeNumber = dayNumber(entries, selectedDate);
  const activeLoading = !activeState;
  const extraLimitReached = selectedExtras.length >= 3;

  return (
    <section className="space-y-8 bg-[#0A0A0A]">
      <div className="border-b border-[#262626] pb-6">
        <div className="bebas text-[18px] tracking-[0.24em] text-[#6E6A65]">{selectedDate === today ? "OGGI" : "GIORNO SELEZIONATO"} · {selectedDate}</div>
        <h2 className="bebas mt-1 text-[64px] leading-none tracking-[0.06em] text-[#B81D1D] sm:text-[86px]">GIORNO {activeNumber}</h2>
      </div>

      <div>
        <div className="mb-4 font-mono text-[10px] tracking-[0.2em] text-[#6E6A65]">DA FARE OGGI</div>
        <div className="space-y-2">
          {FIXED_TASKS.map((task) => {
            const isDone = checked[task];
            return (
              <button
                key={task}
                type="button"
                disabled={activeLoading || toggleTask.isPending}
                onClick={() => {
                  const done = !isDone;
                  setChecked((current) => ({ ...current, [task]: done }));
                  toggleTask.mutate({ task, done });
                }}
                className={`flex min-h-[58px] w-full items-center gap-4 border px-4 text-left transition-colors ${isDone ? "border-[#00FF41] bg-[#00FF41] text-black" : "border-[#333] text-[#E8E4DE] hover:border-[#6E6A65]"}`}
                aria-pressed={isDone}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[18px] ${isDone ? "border-black" : "border-[#333]"}`}>
                  {isDone ? "×" : ""}
                </span>
                <span className={`font-sans text-[18px] ${isDone ? "line-through" : ""}`}>{task}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#6E6A65]">ALTRO</div>
        <div className="flex gap-2">
          <input
            value={extraText}
            onChange={(event) => setExtraText(event.target.value.slice(0, 180))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && extraText.trim() && !extraLimitReached) addExtra.mutate(extraText.trim());
            }}
            disabled={extraLimitReached || addExtra.isPending}
            placeholder={extraLimitReached ? "Massimo 3 note raggiunto" : "Nota rapida per oggi"}
            className="min-h-12 min-w-0 flex-1 border border-[#333] bg-transparent px-3 font-sans text-[14px] text-[#E8E4DE] outline-none placeholder:text-[#6E6A65] focus:border-[#B81D1D]"
          />
          <button
            type="button"
            disabled={!extraText.trim() || extraLimitReached || addExtra.isPending}
            onClick={() => addExtra.mutate(extraText.trim())}
            className="w-12 border border-[#B81D1D] font-mono text-[24px] text-[#B81D1D] disabled:opacity-30"
            aria-label="Aggiungi nota extra"
          >
            +
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {selectedExtras.map((note) => (
            <div key={note.id} className="flex items-center gap-3 border-l-2 border-[#333] pl-3 font-sans text-[14px] text-[#E8E4DE]">
              <span className="min-w-0 flex-1">{note.testo}</span>
              <button type="button" onClick={() => deleteExtra.mutate(note.id)} className="font-mono text-[14px] text-[#6E6A65] hover:text-[#B81D1D]" aria-label={`Elimina ${note.testo}`}>×</button>
            </div>
          ))}
        </div>
      </div>

      <WeekDots
        dates={weekDates}
        today={today}
        rows={weekRows}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      {selectedDate !== today && (
        <div className="border-t border-[#262626] pt-5">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#6E6A65]">
            RIEPILOGO · {parseDate(selectedDate).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div className="mt-3 space-y-2">
            {FIXED_TASKS.map((task) => (
              <div key={task} className={`font-sans text-[15px] ${selectedSummary.has(task) ? "text-[#00FF41]" : "text-[#6E6A65]"}`}>
                {selectedSummary.has(task) ? "✓" : "□"} {task}
              </div>
            ))}
          </div>
          {selectedExtras.length > 0 && (
            <div className="mt-4 font-sans text-[13px] text-[#6E6A65]">
              Note extra: {selectedExtras.map((note) => note.testo).join(" · ")}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-[#262626] pt-5">
        <button
          type="button"
          onClick={() => setFixedNoteOpen((open) => !open)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={fixedNoteOpen}
        >
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#6E6A65]">NOTE FISSE</span>
          <span className="font-mono text-[14px] text-[#6E6A65]">{fixedNoteOpen ? "−" : "+"}</span>
        </button>
        {fixedNoteOpen && (
          <textarea
            value={fixedNote}
            onChange={(event) => setFixedNote(event.target.value.slice(0, 1000))}
            rows={10}
            maxLength={1000}
            placeholder={"Thailandia: budget 1500€\nPost #3 manca materiale primo boxing\nFixare export card canvas"}
            className="mt-4 w-full resize-y border-0 border-l-2 border-[#333] bg-transparent p-0 pl-4 font-mono text-[14px] leading-6 text-[#6E6A65] outline-none placeholder:text-[#444]"
          />
        )}
      </div>
    </section>
  );
}