import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tipo = "POST" | "ARTICOLO" | "DIARIO" | "VIDEO" | "SITO" | "ALTRO";
type Stato = "DA FARE" | "IN CORSO" | "FATTO";

interface Task {
  id: number;
  data: string;
  testo: string;
  tipo: Tipo;
  stato: Stato;
  priorita: number;
  ordine: number;
  createdAt: string;
}

// Manual drag order wins when set; otherwise priority then insertion order
function sortTasks(a: Task, b: Task): number {
  const ao = a.ordine > 0;
  const bo = b.ordine > 0;
  if (ao && bo) return a.ordine - b.ordine;
  if (ao !== bo) return ao ? -1 : 1;
  return a.priorita - b.priorita || a.id - b.id;
}

interface TaskTemplate {
  id: number;
  testo: string;
  tipo: Tipo;
  priorita: number;
  ordine: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPI: Tipo[] = ["POST", "ARTICOLO", "DIARIO", "VIDEO", "SITO", "ALTRO"];
const STATI: Stato[] = ["DA FARE", "IN CORSO", "FATTO"];

const TIPO_COLOR: Record<Tipo, string> = {
  POST: "#B81D1D",
  ARTICOLO: "#B87333",
  DIARIO: "#6E6A65",
  VIDEO: "#4A6FA5",
  SITO: "#5A8A5A",
  ALTRO: "#E8E4DE",
};

const STATO_NEXT: Record<Stato, Stato> = {
  "DA FARE": "IN CORSO",
  "IN CORSO": "FATTO",
  "FATTO": "DA FARE",
};

const STATO_LABEL: Record<Stato, string> = {
  "DA FARE": "DA FARE",
  "IN CORSO": "IN CORSO",
  "FATTO": "FATTO",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function weekStart(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDateIta(d: Date): string {
  return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatMonthIta(d: Date): string {
  return d.toLocaleDateString("it-IT", { month: "long", year: "numeric" }).toUpperCase();
}

const WEEKDAYS = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];

// ─── API helpers ──────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const api = (path: string) => `${BASE}/api${path}`;

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onStatusToggle,
  onDelete,
  onEdit,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  task: Task;
  onStatusToggle: (t: Task) => void;
  onDelete: (id: number) => void;
  onEdit: (t: Task) => void;
  draggable?: boolean;
  onDragStart?: (t: Task) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, t: Task) => void;
}) {
  const isDone = task.stato === "FATTO";
  const isHigh = task.priorita === 1 && !isDone;

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 rounded border-l-2 transition-colors cursor-pointer group ${
        isHigh ? "border-l-[#B81D1D]" : "border-l-transparent"
      } hover:bg-[#141414]`}
      draggable={draggable}
      onDragStart={() => onDragStart?.(task)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={(e) => onDrop?.(e, task)}
      onClick={() => onEdit(task)}
    >
      {/* Tipo dot */}
      <span
        className="mt-1 shrink-0 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: TIPO_COLOR[task.tipo] }}
        title={task.tipo}
      />

      {/* Testo */}
      <span
        className="flex-1 text-[14px] font-sans leading-snug min-w-0 break-words"
        style={{
          color: isDone ? "#6E6A65" : "#E8E4DE",
          textDecoration: isDone ? "line-through" : "none",
        }}
      >
        {task.testo}
      </span>

      {/* Stato button */}
      <button
        onClick={(e) => { e.stopPropagation(); onStatusToggle(task); }}
        className="shrink-0 text-[10px] font-serif tracking-[0.08em] px-2 py-0.5 border border-[#262626] hover:border-[#6E6A65] transition-colors"
        style={{ color: isDone ? "#6E6A65" : task.stato === "IN CORSO" ? "#B87333" : "#E8E4DE" }}
      >
        {STATO_LABEL[task.stato]}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="shrink-0 text-[#6E6A65] hover:text-[#B81D1D] transition-colors opacity-0 group-hover:opacity-100 text-[12px] leading-none"
        aria-label="Elimina"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Quick add form ───────────────────────────────────────────────────────────

function QuickAdd({
  onAdd,
  disabled,
}: {
  onAdd: (testo: string, tipo: Tipo) => Promise<void>;
  disabled?: boolean;
}) {
  const [testo, setTesto] = useState("");
  const [tipo, setTipo] = useState<Tipo>("ALTRO");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const t = testo.trim();
    if (!t) return;
    setLoading(true);
    try {
      await onAdd(t, tipo);
      setTesto("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <input
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Nuova task..."
        maxLength={500}
        disabled={disabled || loading}
        className="flex-1 bg-[#141414] border border-[#262626] text-[13px] font-sans px-3 py-2 text-foreground placeholder:text-[#6E6A65] focus:outline-none focus:border-[#B87333]"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as Tipo)}
        disabled={disabled || loading}
        className="bg-[#141414] border border-[#262626] text-[12px] font-serif text-foreground px-2 py-2 focus:outline-none"
      >
        {TIPI.map((t) => <option key={t}>{t}</option>)}
      </select>
      <button
        onClick={submit}
        disabled={disabled || loading || !testo.trim()}
        className="text-[12px] font-serif tracking-[0.1em] px-4 py-2 bg-[#B81D1D] text-white disabled:opacity-40 hover:bg-[#9a1515] transition-colors"
      >
        AGGIUNGI
      </button>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  task,
  onSave,
  onClose,
}: {
  task: Task;
  onSave: (id: number, patch: Partial<Task>) => Promise<void>;
  onClose: () => void;
}) {
  const [testo, setTesto] = useState(task.testo);
  const [tipo, setTipo] = useState<Tipo>(task.tipo);
  const [stato, setStato] = useState<Stato>(task.stato);
  const [priorita, setPriorita] = useState(task.priorita);
  const [data, setData] = useState(task.data);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await onSave(task.id, { testo, tipo, stato, priorita, data });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0A0A0A] border border-[#262626] p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[18px] font-serif tracking-[0.1em] mb-5">MODIFICA TASK</h3>
        <textarea
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full bg-[#141414] border border-[#262626] text-[13px] font-sans px-3 py-2 text-foreground focus:outline-none focus:border-[#B87333] resize-none mb-4"
        />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-[10px] font-serif tracking-widest text-[#6E6A65] mb-1">TIPO</div>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className="w-full bg-[#141414] border border-[#262626] text-[12px] font-serif text-foreground px-2 py-2 focus:outline-none">
              {TIPI.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-serif tracking-widest text-[#6E6A65] mb-1">STATO</div>
            <select value={stato} onChange={(e) => setStato(e.target.value as Stato)} className="w-full bg-[#141414] border border-[#262626] text-[12px] font-serif text-foreground px-2 py-2 focus:outline-none">
              {STATI.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-serif tracking-widest text-[#6E6A65] mb-1">PRIORITÀ</div>
            <select value={priorita} onChange={(e) => setPriorita(Number(e.target.value))} className="w-full bg-[#141414] border border-[#262626] text-[12px] font-serif text-foreground px-2 py-2 focus:outline-none">
              <option value={1}>1 — Alta</option>
              <option value={2}>2 — Media</option>
              <option value={3}>3 — Bassa</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] font-serif tracking-widest text-[#6E6A65] mb-1">DATA</div>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full bg-[#141414] border border-[#262626] text-[12px] font-sans text-foreground px-2 py-2 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="text-[12px] font-serif tracking-widest text-[#6E6A65] hover:text-foreground px-4 py-2 border border-[#262626]">ANNULLA</button>
          <button onClick={save} disabled={loading || !testo.trim()} className="text-[12px] font-serif tracking-widest px-4 py-2 bg-[#B81D1D] text-white disabled:opacity-40 hover:bg-[#9a1515] transition-colors">SALVA</button>
        </div>
      </div>
    </div>
  );
}

// ─── Daily view ───────────────────────────────────────────────────────────────

function DailyView({
  selectedDate,
  tasks,
  giornoAttivo,
  onPrev,
  onToday,
  onNext,
  onSelectDate,
  onAdd,
  onStatusToggle,
  onDelete,
  onEdit,
  onRoutine,
  routineLoading,
  onReorder,
}: {
  selectedDate: Date;
  tasks: Task[];
  giornoAttivo: number | null;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onSelectDate: (d: Date) => void;
  onAdd: (testo: string, tipo: Tipo) => Promise<void>;
  onStatusToggle: (t: Task) => void;
  onDelete: (id: number) => void;
  onEdit: (t: Task) => void;
  onRoutine: () => void;
  routineLoading: boolean;
  onReorder: (ids: number[]) => Promise<void>;
}) {
  const dayTasks = tasks
    .filter((t) => t.data === dateStr(selectedDate))
    .sort(sortTasks);

  const dragRef = useRef<Task | null>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent, target: Task) => {
      e.preventDefault();
      const dragged = dragRef.current;
      dragRef.current = null;
      if (!dragged || dragged.id === target.id) return;
      // Build the new display order: move dragged to target's position
      const ids = dayTasks.map((t) => t.id).filter((id) => id !== dragged.id);
      const targetIdx = ids.indexOf(target.id);
      ids.splice(targetIdx, 0, dragged.id);
      await onReorder(ids);
    },
    [dayTasks, onReorder]
  );

  return (
    <div className="mb-10">
      {/* Date header */}
      <div className="flex items-baseline gap-4 mb-4">
        <h2 className="text-[40px] md:text-[56px] font-serif leading-none text-white uppercase">
          {formatDateIta(selectedDate)}
        </h2>
        {giornoAttivo !== null && (
          <span className="text-[18px] font-serif text-[#B87333]">GIORNO {giornoAttivo}</span>
        )}
      </div>

      {/* Routine button */}
      <button
        onClick={onRoutine}
        disabled={routineLoading}
        className="mb-5 text-[11px] font-serif tracking-[0.12em] px-4 py-2 border border-[#B87333] text-[#B87333] hover:bg-[#B87333] hover:text-black transition-colors disabled:opacity-40"
      >
        {routineLoading ? "..." : "ROUTINE GIORNALIERA"}
      </button>

      {/* Task list */}
      <div className="border border-[#262626] divide-y divide-[#1a1a1a] min-h-[60px]">
        {dayTasks.length === 0 ? (
          <p className="text-[13px] text-[#6E6A65] font-sans px-3 py-4">Nessuna task per oggi.</p>
        ) : (
          dayTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onStatusToggle={onStatusToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              draggable
              onDragStart={(t) => { dragRef.current = t; }}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      <QuickAdd onAdd={onAdd} />

      {/* Day navigation */}
      <div className="flex items-center gap-4 mt-6 text-[12px] font-serif tracking-[0.1em]">
        <button onClick={onPrev} className="text-[#6E6A65] hover:text-foreground transition-colors">← IERI</button>
        <button onClick={onToday} className="text-[#B87333] hover:text-foreground transition-colors">OGGI</button>
        <button onClick={onNext} className="text-[#6E6A65] hover:text-foreground transition-colors">DOMANI →</button>
      </div>
    </div>
  );
}

// ─── Weekly view ──────────────────────────────────────────────────────────────

function WeeklyView({
  weekFrom,
  tasks,
  onSelectDay,
  onEdit,
  onStatusToggle,
  onAdd,
  onMove,
}: {
  weekFrom: Date;
  tasks: Task[];
  onSelectDay: (d: Date) => void;
  onEdit: (t: Task) => void;
  onStatusToggle: (t: Task) => void;
  onAdd: (testo: string, tipo: Tipo, data: Date) => Promise<void>;
  onMove: (id: number, data: string) => Promise<void>;
}) {
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekFrom, i));
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const dragRef = useRef<Task | null>(null);

  return (
    <div className="mb-10">
      <h3 className="text-[16px] font-serif tracking-[0.12em] text-[#6E6A65] mb-4">QUESTA SETTIMANA</h3>

      {isMobile ? (
        /* Mobile: vertical list */
        <div className="flex flex-col gap-4">
          {days.map((day) => {
            const ds = dateStr(day);
            const dayTasks = tasks.filter((t) => t.data === ds).sort((a, b) => a.priorita - b.priorita);
            return (
              <div key={ds} className="border border-[#262626] p-3">
                <div
                  className="text-[11px] font-serif tracking-widest text-[#6E6A65] mb-2 cursor-pointer hover:text-foreground"
                  onClick={() => onSelectDay(day)}
                >
                  {WEEKDAYS[days.indexOf(day)]} {day.getDate()}
                </div>
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 py-1 cursor-pointer"
                    onClick={() => onEdit(t)}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TIPO_COLOR[t.tipo] }} />
                    <span className="text-[12px] font-sans truncate flex-1" style={{ color: t.stato === "FATTO" ? "#6E6A65" : "#E8E4DE", textDecoration: t.stato === "FATTO" ? "line-through" : "none" }}>
                      {t.testo.slice(0, 40)}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); onStatusToggle(t); }} className="text-[9px] font-serif text-[#6E6A65] hover:text-foreground shrink-0">{t.stato.slice(0, 2)}</button>
                  </div>
                ))}
                {addingDay === ds ? (
                  <QuickAdd onAdd={(testo, tipo) => { setAddingDay(null); return onAdd(testo, tipo, day); }} />
                ) : (
                  <button onClick={() => setAddingDay(ds)} className="text-[10px] font-serif text-[#6E6A65] hover:text-[#B87333] mt-1">+ aggiungi</button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: 7 columns */
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const ds = dateStr(day);
            const dayTasks = tasks.filter((t) => t.data === ds).sort((a, b) => a.priorita - b.priorita);
            const isToday = ds === dateStr(new Date());
            return (
              <div
                key={ds}
                className={`border border-[#262626] p-2 min-h-[80px] ${isToday ? "border-[#B87333]" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragged = dragRef.current;
                  dragRef.current = null;
                  if (dragged && dragged.data !== ds) onMove(dragged.id, ds);
                }}
              >
                <div
                  className="text-[10px] font-serif tracking-widest mb-2 cursor-pointer hover:text-[#B87333]"
                  style={{ color: isToday ? "#B87333" : "#6E6A65" }}
                  onClick={() => onSelectDay(day)}
                >
                  {WEEKDAYS[i]} {day.getDate()}
                </div>
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-1 mb-1 cursor-pointer"
                    draggable
                    onDragStart={() => { dragRef.current = t; }}
                    onClick={() => onEdit(t)}
                    title={t.testo}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: TIPO_COLOR[t.tipo] }} />
                    <span
                      className="text-[10px] font-sans leading-tight"
                      style={{ color: t.stato === "FATTO" ? "#6E6A65" : "#E8E4DE", textDecoration: t.stato === "FATTO" ? "line-through" : "none" }}
                    >
                      {t.testo.slice(0, 40)}
                    </span>
                  </div>
                ))}
                {addingDay === ds ? (
                  <div className="mt-1">
                    <QuickAdd onAdd={(testo, tipo) => { setAddingDay(null); return onAdd(testo, tipo, day); }} />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingDay(ds)}
                    className="text-[9px] font-serif text-[#6E6A65] hover:text-[#B87333] mt-1"
                  >+</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Monthly view ─────────────────────────────────────────────────────────────

function MonthlyView({
  month,
  tasks,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  month: Date;
  tasks: Task[];
  onSelectDay: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const start = monthStart(month);
  const end = monthEnd(month);
  // Pad to Monday
  const padStart = start.getDay() === 0 ? 6 : start.getDay() - 1;
  const cells: (Date | null)[] = Array.from({ length: padStart }, () => null);
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    cells.push(new Date(d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const taskMap: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!taskMap[t.data]) taskMap[t.data] = [];
    taskMap[t.data].push(t);
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onPrevMonth} className="text-[12px] font-serif text-[#6E6A65] hover:text-foreground">←</button>
        <h3 className="text-[16px] font-serif tracking-[0.12em] text-[#6E6A65]">
          QUESTO MESE — {formatMonthIta(month)}
        </h3>
        <button onClick={onNextMonth} className="text-[12px] font-serif text-[#6E6A65] hover:text-foreground">→</button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-[#1a1a1a]">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="bg-[#0A0A0A] text-[10px] font-serif tracking-widest text-[#6E6A65] text-center py-1">{wd}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-[#0A0A0A] h-12" />;
          const ds = dateStr(day);
          const dayTasks = taskMap[ds] ?? [];
          const hasTodo = dayTasks.some((t) => t.stato === "DA FARE");
          const isToday = ds === dateStr(new Date());
          return (
            <div
              key={ds}
              onClick={() => onSelectDay(day)}
              className={`bg-[#0A0A0A] h-12 p-1.5 cursor-pointer hover:bg-[#141414] flex flex-col items-start ${isToday ? "ring-1 ring-[#B87333]" : ""}`}
            >
              <span className="text-[11px] font-serif" style={{ color: isToday ? "#B87333" : "#6E6A65" }}>{day.getDate()}</span>
              {dayTasks.length > 0 && (
                <span className="flex items-center gap-1 mt-auto">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hasTodo ? "#B81D1D" : "#6E6A65" }} />
                  <span className="text-[9px] font-serif text-[#6E6A65]">{dayTasks.length}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Template settings ────────────────────────────────────────────────────────

function TemplateSettings() {
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery<TaskTemplate[]>({
    queryKey: ["planner-templates"],
    queryFn: () => fetchJson(api("/admin/planner/templates")),
  });

  const addMut = useMutation({
    mutationFn: (body: Partial<TaskTemplate>) =>
      fetchJson(api("/admin/planner/templates"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planner-templates"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetchJson(api(`/admin/planner/templates/${id}`), { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planner-templates"] }),
  });

  const [newTesto, setNewTesto] = useState("");
  const [newTipo, setNewTipo] = useState<Tipo>("ALTRO");
  const [newPriorita, setNewPriorita] = useState(2);

  return (
    <div className="border border-[#262626] p-5">
      <h4 className="text-[14px] font-serif tracking-[0.1em] text-[#6E6A65] mb-4">IMPOSTAZIONI PLANNER — TEMPLATE ROUTINE</h4>
      <div className="divide-y divide-[#1a1a1a] mb-4">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TIPO_COLOR[t.tipo] }} />
            <span className="flex-1 text-[13px] font-sans text-foreground">{t.testo}</span>
            <span className="text-[10px] font-serif text-[#6E6A65]">{t.tipo}</span>
            <span className="text-[10px] font-serif text-[#6E6A65]">P{t.priorita}</span>
            <button onClick={() => deleteMut.mutate(t.id)} className="text-[#6E6A65] hover:text-[#B81D1D] text-[11px]">✕</button>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-[12px] text-[#6E6A65] font-sans py-2">Nessun template. Aggiungine uno qui sotto.</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={newTesto}
          onChange={(e) => setNewTesto(e.target.value)}
          placeholder="Testo template..."
          maxLength={500}
          className="flex-1 bg-[#141414] border border-[#262626] text-[12px] font-sans px-3 py-1.5 text-foreground placeholder:text-[#6E6A65] focus:outline-none focus:border-[#B87333]"
        />
        <select value={newTipo} onChange={(e) => setNewTipo(e.target.value as Tipo)} className="bg-[#141414] border border-[#262626] text-[11px] font-serif text-foreground px-2 py-1.5 focus:outline-none">
          {TIPI.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={newPriorita} onChange={(e) => setNewPriorita(Number(e.target.value))} className="bg-[#141414] border border-[#262626] text-[11px] font-serif text-foreground px-2 py-1.5 focus:outline-none">
          <option value={1}>P1</option>
          <option value={2}>P2</option>
          <option value={3}>P3</option>
        </select>
        <button
          onClick={() => {
            if (!newTesto.trim()) return;
            addMut.mutate({ testo: newTesto.trim(), tipo: newTipo, priorita: newPriorita });
            setNewTesto("");
          }}
          disabled={!newTesto.trim() || addMut.isPending}
          className="text-[11px] font-serif px-4 py-1.5 bg-[#B87333] text-black disabled:opacity-40 hover:opacity-80 transition-opacity"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main PlannerTab ──────────────────────────────────────────────────────────

export function PlannerTab() {
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(() => new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [routineLoading, setRoutineLoading] = useState(false);

  // Compute date ranges for queries
  const weekFrom = weekStart(selectedDate);
  const weekTo = addDays(weekFrom, 6);
  const mStart = monthStart(month);
  const mEnd = monthEnd(month);

  // We fetch a wide range so all three views share one query when possible
  const from = dateStr(mStart);
  const to = dateStr(mEnd);

  const { data: tasks = [], refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ["planner-tasks", from, to],
    queryFn: () => fetchJson(api(`/admin/planner/tasks?from=${from}&to=${to}`)),
  });

  // Also prefetch ±1 month so navigation is instant
  useQuery<Task[]>({
    queryKey: ["planner-tasks", dateStr(addDays(mStart, -31)), dateStr(addDays(mStart, -1))],
    queryFn: () => fetchJson(api(`/admin/planner/tasks?from=${dateStr(addDays(mStart, -31))}&to=${dateStr(addDays(mStart, -1))}`)),
  });

  const { data: giornoData } = useQuery<{ numero: number | null }>({
    queryKey: ["planner-giorno-attivo"],
    queryFn: () => fetchJson(api("/admin/planner/giorno-attivo")),
  });

  const addTask = useCallback(
    async (testo: string, tipo: Tipo, data?: Date) => {
      const d = dateStr(data ?? selectedDate);
      await fetchJson(api("/admin/planner/tasks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: d, testo, tipo, stato: "DA FARE", priorita: 2 }),
      });
      qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    },
    [selectedDate, qc]
  );

  const statusToggle = useCallback(
    async (task: Task) => {
      const next = STATO_NEXT[task.stato];
      await fetchJson(api(`/admin/planner/tasks/${task.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stato: next }),
      });
      qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    },
    [qc]
  );

  const deleteTask = useCallback(
    async (id: number) => {
      await fetchJson(api(`/admin/planner/tasks/${id}`), { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    },
    [qc]
  );

  const saveTask = useCallback(
    async (id: number, patch: Partial<Task>) => {
      await fetchJson(api(`/admin/planner/tasks/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    },
    [qc]
  );

  const reorderTasks = useCallback(
    async (ids: number[]) => {
      await fetchJson(api("/admin/planner/tasks/reorder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    },
    [qc]
  );

  const doRoutine = useCallback(async () => {
    setRoutineLoading(true);
    try {
      await fetchJson(api(`/admin/planner/routine?data=${dateStr(selectedDate)}`), { method: "POST" });
      qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    } finally {
      setRoutineLoading(false);
    }
  }, [selectedDate, qc]);

  const handleSelectDay = useCallback((d: Date) => {
    setSelectedDate(d);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Keep month in sync with selectedDate
  const prevMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="space-y-10 pb-12">
      {/* Daily */}
      <DailyView
        selectedDate={selectedDate}
        tasks={tasks}
        giornoAttivo={giornoData?.numero ?? null}
        onPrev={() => setSelectedDate((d) => addDays(d, -1))}
        onToday={() => setSelectedDate(new Date())}
        onNext={() => setSelectedDate((d) => addDays(d, 1))}
        onSelectDate={setSelectedDate}
        onAdd={addTask}
        onStatusToggle={statusToggle}
        onDelete={deleteTask}
        onEdit={setEditingTask}
        onRoutine={doRoutine}
        routineLoading={routineLoading}
        onReorder={reorderTasks}
      />

      {/* Weekly */}
      <WeeklyView
        weekFrom={weekFrom}
        tasks={tasks}
        onSelectDay={handleSelectDay}
        onEdit={setEditingTask}
        onStatusToggle={statusToggle}
        onAdd={(testo, tipo, d) => addTask(testo, tipo, d)}
        onMove={async (id, data) => {
          await fetchJson(api(`/admin/planner/tasks/${id}`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data }),
          });
          qc.invalidateQueries({ queryKey: ["planner-tasks"] });
        }}
      />

      {/* Monthly */}
      <MonthlyView
        month={month}
        tasks={tasks}
        onSelectDay={handleSelectDay}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      {/* Template settings */}
      <TemplateSettings />

      {/* Edit modal */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={saveTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
