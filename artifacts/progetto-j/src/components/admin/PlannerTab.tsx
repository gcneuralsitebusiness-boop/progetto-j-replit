import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getListEntriesQueryKey, useListEntries } from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";

type CalendarView = "week" | "month";
type ChecklistTask = "DIARIO" | "CARD IG" | "STORIA IG" | "TRACKING";

const FIXED_TASKS: ChecklistTask[] = ["DIARIO", "CARD IG", "STORIA IG", "TRACKING"];
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() + (day === 0 ? -6 : 1 - day));
  next.setHours(12, 0, 0, 0);
  return next;
}

function monthDays(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
  const offset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  return Array.from({ length: offset + last.getDate() }, (_, index) => (
    addDays(first, index - offset)
  ));
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("it-IT", { month: "long", year: "numeric" }).toUpperCase();
}

function isCompiled(entry?: Entry): boolean {
  if (!entry) return false;
  return Boolean(
    entry.testo?.trim()
    || entry.kcal != null
    || entry.acqua != null
    || entry.tipoAllenamento
    || entry.routineCompletata != null
    || entry.energia != null,
  );
}

function trackingSummary(entry?: Entry): string[] {
  if (!entry) return [];
  const summary: string[] = [];
  if (entry.kcal != null) summary.push(`🥗 ${entry.kcal}`);
  if (entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO") summary.push(`🥊 ${entry.tipoAllenamento}`);
  if (entry.durata != null) summary.push(`${entry.durata} min`);
  if (entry.routineCompletata === true) summary.push("✓ routine");
  if (entry.routineCompletata === false) summary.push("~ routine");
  if (entry.energia != null) summary.push(`⚡ ${entry.energia}/5`);
  return summary;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

type ChecklistRow = {
  id: number;
  data: string;
  testo: ChecklistTask;
  stato: "DA FARE" | "FATTO";
};

export function PlannerTab({ onOpenDay }: { onOpenDay: (numero?: number) => void }) {
  const queryClient = useQueryClient();
  const today = localDate(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: entries } = useListEntries({ query: { queryKey: getListEntriesQueryKey() } });

  const dates = useMemo(() => {
    if (view === "week") {
      const first = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, index) => addDays(first, index));
    }
    return monthDays(anchor);
  }, [anchor, view]);

  const range = useMemo(() => ({
    from: localDate(dates[0] ?? anchor),
    to: localDate(dates[dates.length - 1] ?? anchor),
  }), [anchor, dates]);

  const { data: checklist = [], isLoading: checklistLoading } = useQuery({
    queryKey: ["planner-checklist", range.from, range.to],
    queryFn: () => fetchJson<ChecklistRow[]>(`/admin/planner/checklist?from=${range.from}&to=${range.to}`),
  });

  const toggleTask = useMutation({
    mutationFn: ({ data, task, done }: { data: string; task: ChecklistTask; done: boolean }) => (
      fetchJson<ChecklistRow>("/admin/planner/checklist", {
        method: "POST",
        body: JSON.stringify({ data, task, done }),
      })
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner-checklist"] }),
  });

  const entryByDate = useMemo(() => new Map((entries ?? []).map((entry) => [entry.data, entry])), [entries]);
  const checklistByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    checklist.forEach((row) => {
      if (row.stato !== "FATTO") return;
      const set = map.get(row.data) ?? new Set<string>();
      set.add(row.testo);
      map.set(row.data, set);
    });
    return map;
  }, [checklist]);

  const selectedEntry = entryByDate.get(selectedDate);
  const selectedTasks = checklistByDate.get(selectedDate) ?? new Set<string>();
  const changeAnchor = (direction: number) => {
    setAnchor((current) => {
      const next = new Date(current);
      if (view === "week") next.setDate(next.getDate() + direction * 7);
      else next.setMonth(next.getMonth() + direction);
      return next;
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#262626] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#B81D1D]">ADMIN / ORGANIZZAZIONE</p>
          <h2 className="mt-2 font-serif text-[30px] tracking-wider text-[#E8E4DE]">PLANNER</h2>
          <p className="mt-1 font-sans text-[12px] text-[#6E6A65]">Controlla la giornata, compila il tracking e prepara i contenuti.</p>
        </div>
        <div className="flex border border-[#333]">
          {(["week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={`px-4 py-2 font-serif text-[11px] tracking-wider ${view === option ? "bg-[#B81D1D] text-white" : "text-[#6E6A65] hover:text-[#E8E4DE]"}`}
            >
              {option === "week" ? "SETTIMANA" : "MESE"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => changeAnchor(-1)} className="border border-[#333] px-4 py-2 font-serif text-[12px] text-[#E8E4DE]">←</button>
        <div className="text-center">
          <div className="font-serif text-[18px] tracking-wider text-[#E8E4DE]">{view === "week" ? "SETTIMANA" : monthLabel(anchor)}</div>
          {view === "week" && <div className="mt-1 font-sans text-[11px] capitalize text-[#6E6A65]">{dateLabel(dates[0] ?? anchor)} — {dateLabel(dates[dates.length - 1] ?? anchor)}</div>}
        </div>
        <button type="button" onClick={() => changeAnchor(1)} className="border border-[#333] px-4 py-2 font-serif text-[12px] text-[#E8E4DE]">→</button>
      </div>

      <div className={`grid gap-px bg-[#262626] ${view === "week" ? "grid-cols-7" : "grid-cols-7"}`}>
        {["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"].map((day) => (
          <div key={day} className="bg-[#0A0A0A] py-2 text-center font-mono text-[10px] text-[#6E6A65]">{day}</div>
        ))}
        {dates.map((date) => {
          const key = localDate(date);
          const entry = entryByDate.get(key);
          const future = key > today;
          const compiled = isCompiled(entry);
          const state = future ? "FUTURO" : compiled ? "COMPILATO" : "MANCANTE";
          const stateColor = future ? "#6E6A65" : compiled ? "#00FF41" : "#B81D1D";
          const tasksDone = checklistByDate.get(key)?.size ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              className={`min-h-[112px] bg-[#101010] p-2 text-left transition-colors hover:bg-[#181818] ${selectedDate === key ? "outline outline-2 outline-[#B81D1D] -outline-offset-2" : ""} ${date.getMonth() !== anchor.getMonth() && view === "month" ? "opacity-40" : ""}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-mono text-[13px] text-[#E8E4DE]">{date.getDate()}</span>
                <span className="h-2 w-2" style={{ backgroundColor: stateColor }} title={state} />
              </div>
              <div className="mt-2 font-mono text-[9px]" style={{ color: stateColor }}>{state}</div>
              <div className="mt-2 space-y-1 font-sans text-[10px] text-[#B7B1AA]">
                {trackingSummary(entry).slice(0, 2).map((item) => <div key={item} className="truncate">{item}</div>)}
              </div>
              <div className="mt-2 font-mono text-[9px] text-[#6E6A65]">TASK {tasksDone}/4</div>
            </button>
          );
        })}
      </div>

      <div className="border border-[#333] bg-[#101010] p-5">
        <div className="flex flex-col gap-4 border-b border-[#262626] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#B81D1D]">{selectedDate === today ? "OGGI" : "GIORNO SELEZIONATO"}</p>
            <h3 className="mt-1 font-serif text-[22px] capitalize tracking-wider text-[#E8E4DE]">{dateLabel(parseDate(selectedDate))}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {trackingSummary(selectedEntry).length > 0 ? trackingSummary(selectedEntry).map((item) => <span key={item} className="border border-[#333] px-2 py-1 font-mono text-[10px] text-[#B7B1AA]">{item}</span>) : <span className="font-sans text-[12px] text-[#6E6A65]">Nessun tracking registrato.</span>}
            </div>
          </div>
          <button type="button" onClick={() => onOpenDay(selectedEntry?.numero)} className="border border-[#B81D1D] px-4 py-3 font-serif text-[12px] tracking-wider text-[#B81D1D] hover:bg-[#B81D1D] hover:text-white">
            APRI GIORNO
          </button>
        </div>

        <div className="pt-4">
          <div className="mb-3 font-serif text-[11px] tracking-[0.2em] text-[#6E6A65]">TASK FISSI</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FIXED_TASKS.map((task) => {
              const done = selectedTasks.has(task);
              return (
                <button
                  key={task}
                  type="button"
                  disabled={checklistLoading || toggleTask.isPending}
                  onClick={() => toggleTask.mutate({ data: selectedDate, task, done: !done })}
                  className={`min-h-12 border px-2 font-serif text-[11px] tracking-wider transition-colors ${done ? "border-[#00FF41] bg-[#00FF41] text-black" : "border-[#333] text-[#E8E4DE] hover:border-[#B81D1D]"}`}
                  aria-pressed={done}
                >
                  {done ? "✓" : "○"} {task}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}