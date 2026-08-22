import { useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Entry, EntryInput } from "@workspace/api-client-react";

type FormData = Partial<EntryInput>;
export type TrackingKey =
  | "kcal"
  | "pasti"
  | "acqua"
  | "acquaAllenamento"
  | "alcol"
  | "tipoAllenamento"
  | "durata"
  | "intensita"
  | "routineCompletata"
  | "routineForza"
  | "routineFlessioni"
  | "routineTrazioni"
  | "routineSquat"
  | "plank"
  | "collo"
  | "mobilita"
  | "sollevamentoGamba"
  | "grapplingVuoto"
  | "energia"
  | "flessioni";

type QuickStatus = "ALLENATO" | "RIPOSO" | "SOLO ROUTINE" | "SPARRING";

const TRAINING_TYPES = ["MMA", "MUAY THAI", "BJJ", "CALISTHENICS", "CORSA", "MISTO"] as const;
const ENERGY = [
  { value: 1, icon: "1" },
  { value: 2, icon: "2" },
  { value: 3, icon: "3" },
  { value: 4, icon: "4" },
  { value: 5, icon: "5" },
] as const;
const WATER_PRESETS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

function initialStatus(entry?: Entry): QuickStatus | null {
  if (!entry) return null;
  if (entry.tipoAllenamento === "SPARRING") return "SPARRING";
  if (entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO") return "ALLENATO";
  if (entry.routineCompletata != null) return "SOLO ROUTINE";
  if (entry.tipoAllenamento === "NESSUNO") return "RIPOSO";
  return null;
}

function isSunday(date: string | undefined): boolean {
  if (!date) return false;
  return new Date(`${date}T12:00:00`).getDay() === 0;
}

function longPressPrompt(label: string, fallback: number, onValue: (value: number) => void) {
  const raw = window.prompt(`${label} — inserisci un valore`, String(fallback));
  if (raw == null || raw.trim() === "") return;
  const value = Number(raw.replace(",", "."));
  if (Number.isFinite(value) && value >= 0) onValue(value);
}

function PresetButton({
  label,
  value,
  active,
  onSelect,
  onLongPress,
}: {
  label: string;
  value: number;
  active: boolean;
  onSelect: () => void;
  onLongPress: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const start = () => {
    longPressed.current = false;
    timer.current = setTimeout(() => {
      longPressed.current = true;
      onLongPress();
    }, 600);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onClick={() => { if (!longPressed.current) onSelect(); }}
      onContextMenu={(event) => { event.preventDefault(); onLongPress(); }}
      className={`min-h-11 border px-3 font-mono text-[13px] transition-colors ${
        active ? "border-[#B81D1D] bg-[#B81D1D] text-white" : "border-[#333] bg-[#1A1A1A] text-[#E8E4DE] hover:border-[#B81D1D]"
      }`}
      aria-pressed={active}
      title="Tieni premuto per un valore personalizzato"
    >
      {label}
      <span className="sr-only">{value}</span>
    </button>
  );
}

export function DailyTrackingPanel({
  formData,
  setFormData,
  initialData,
  markTouched,
  markManyTouched,
  onCopyYesterday,
}: {
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  initialData?: Entry;
  markTouched: (key: TrackingKey) => void;
  markManyTouched: (keys: TrackingKey[]) => void;
  onCopyYesterday: () => void;
}) {
  const [status, setStatus] = useState<QuickStatus | null>(() => initialStatus(initialData));
  const [showWeekly, setShowWeekly] = useState(() => isSunday(formData.data));
  const [weeklyType, setWeeklyType] = useState("normali");
  const [weeklyFlessioni, setWeeklyFlessioni] = useState(20);
  const [weeklyTrazioni, setWeeklyTrazioni] = useState(8);
  const [weeklyPlank, setWeeklyPlank] = useState(60);
  const [weeklyGamba, setWeeklyGamba] = useState<EntryInput["sollevamentoGamba"]>(null);

  const setField = <K extends keyof EntryInput>(key: K, value: EntryInput[K] | undefined) => {
    setFormData((current) => ({ ...current, [key]: value }));
    if (key !== "numero" && key !== "data") markTouched(key as TrackingKey);
  };

  const chooseStatus = (next: QuickStatus) => {
    setStatus(next);
    if (next === "RIPOSO" || next === "SOLO ROUTINE") {
      setField("tipoAllenamento", null);
      setField("durata", null);
      setField("intensita", null);
    } else {
      setField("tipoAllenamento", next === "SPARRING" ? "SPARRING" : formData.tipoAllenamento ?? "MMA");
      setField("durata", formData.durata ?? 60);
      setField("intensita", formData.intensita ?? 3);
    }
    if (next === "RIPOSO") {
      setField("routineCompletata", null);
      setField("routineForza", null);
    }
  };

  const partialRoutine = formData.routineCompletata === false;
  const routineVisible = status === "ALLENATO" || status === "SOLO ROUTINE";
  const trainingVisible = status !== null && status !== "RIPOSO" && status !== "SOLO ROUTINE";
  const duration = typeof formData.durata === "number" ? formData.durata : 60;
  const intensity = typeof formData.intensita === "number" ? formData.intensita : 3;
  const kcal = typeof formData.kcal === "number" ? formData.kcal : null;
  const acqua = typeof formData.acqua === "number" ? formData.acqua : null;
  const acquaAllenamento = typeof formData.acquaAllenamento === "number" ? formData.acquaAllenamento : null;
  const waterLiters = acqua;

  const setHydrationFromLiters = (liters: number) => {
    const normalized = Math.max(0, Math.min(20, Number(liters.toFixed(2))));
    setField("acqua", normalized);
  };

  const applyWeeklyMax = () => {
    setField("flessioni", weeklyFlessioni);
    setField("routineFlessioni", `${weeklyType} ${weeklyFlessioni}`);
    setField("routineTrazioni", String(weeklyTrazioni));
    setField("plank", weeklyPlank);
    setField("sollevamentoGamba", weeklyGamba);
    markManyTouched(["flessioni", "routineFlessioni", "routineTrazioni", "plank", "sollevamentoGamba"]);
    setShowWeekly(false);
  };

  const routineButtons = useMemo(() => [
    { key: "routineForza" as const, label: "FORZA" },
    { key: "collo" as const, label: "COLLO" },
    { key: "mobilita" as const, label: "MOBILITÀ" },
    { key: "grapplingVuoto" as const, label: "GRAPPLING" },
  ], []);

  return (
    <section className="border-y border-[#262626] bg-[#0A0A0A]">
      <div className="flex items-center justify-between gap-3 border-b border-[#262626] py-4">
        <div>
          <h3 className="font-serif text-[24px] tracking-wider text-[#E8E4DE]">TRACKING GIORNALIERO</h3>
          <p className="mt-1 font-sans text-[11px] text-[#6E6A65]">Tocca solo quello che vuoi registrare.</p>
        </div>
        <button
          type="button"
          onClick={onCopyYesterday}
          className="shrink-0 border border-[#333] bg-[#1A1A1A] px-3 py-2 font-serif text-[10px] tracking-wider text-[#E8E4DE] hover:border-[#B81D1D]"
        >
          COMPILA COME IERI
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-4">
        {([
          ["ALLENATO"],
          ["RIPOSO"],
          ["SOLO ROUTINE"],
          ["SPARRING"],
        ] as const).map(([label]) => (
          <button
            key={label}
            type="button"
            onClick={() => chooseStatus(label)}
            className={`min-h-12 border px-2 font-serif text-[12px] tracking-wider transition-colors ${
              status === label ? "border-[#B81D1D] bg-[#B81D1D] text-white" : "border-[#333] bg-[#1A1A1A] text-[#E8E4DE] hover:border-[#B81D1D]"
            }`}
            aria-pressed={status === label}
          >
              {label}
          </button>
        ))}
      </div>

      {trainingVisible && (
        <div className="border-t border-[#262626] py-4">
          <div className="mb-3 font-serif text-[11px] tracking-[0.2em] text-[#6E6A65]">ALLENAMENTO</div>
          <div className="flex flex-wrap gap-2">
            {TRAINING_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setField("tipoAllenamento", type)}
                className={`border px-3 py-2 font-serif text-[11px] tracking-wider ${
                  formData.tipoAllenamento === type ? "border-[#B81D1D] bg-[#B81D1D] text-white" : "border-[#333] bg-[#1A1A1A] text-[#E8E4DE]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-[#1A1A1A] pt-4">
            <div className="text-center font-mono text-[30px] text-[#E8E4DE]">{duration} MIN</div>
            <input
              aria-label="Durata allenamento in minuti"
              type="range"
              min="15"
              max="180"
              step="15"
              value={duration}
              onChange={(event) => setField("durata", Number(event.target.value))}
              className="mt-2 w-full accent-[#B81D1D]"
            />
            <div className="mt-2 flex justify-center gap-2">
              {[30, 60, 90].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField("durata", value)}
                  className={`border px-4 py-1.5 font-mono text-[12px] ${duration === value ? "border-[#B81D1D] text-[#B81D1D]" : "border-[#333] text-[#6E6A65]"}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 font-serif text-[11px] tracking-[0.18em] text-[#6E6A65]">QUANTO TI HA DISTRUTTO</div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField("intensita", value)}
                  className={`h-11 border font-mono text-[15px] text-white ${
                    intensity === value ? "border-[#B81D1D]" : "border-[#333] bg-[#1A1A1A]"
                  }`}
                  style={{ backgroundColor: intensity === value ? `hsl(${125 - value * 25} 75% 34%)` : undefined }}
                  aria-pressed={intensity === value}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-[#262626] py-4">
        <div className="mb-3 font-serif text-[11px] tracking-[0.2em] text-[#6E6A65]">NUTRIZIONE</div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr_auto] lg:items-start">
          <div>
            <span className="w-12 font-serif text-[11px] text-[#6E6A65]">KCAL</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1500, 1800, 2000, 2100, 2200, 2300, 2400, 2500, 2700, 3000].map((value) => (
                <PresetButton
                  key={value}
                  label={String(value)}
                  value={value}
                  active={kcal === value}
                  onSelect={() => setField("kcal", value)}
                  onLongPress={() => longPressPrompt("Kcal", kcal ?? value, (next) => setField("kcal", next))}
                />
              ))}
            </div>
          </div>
          <div className="border-l-2 border-[#00A8A8] pl-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-[11px] tracking-[0.18em] text-[#6E6A65]">ACQUA</span>
              <span className="font-mono text-[15px] text-[#E8E4DE]">
                {waterLiters == null ? "—" : `${waterLiters.toLocaleString("it-IT", { maximumFractionDigits: 2 })} L`}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {WATER_PRESETS.map((value) => (
                <PresetButton
                  key={value}
                  label={`${value}L`}
                  value={value}
                  active={waterLiters === value}
                  onSelect={() => setHydrationFromLiters(value)}
                  onLongPress={() => longPressPrompt("Acqua in litri", waterLiters ?? value, setHydrationFromLiters)}
                />
              ))}
            </div>
            <p className="mt-3 font-sans text-[10px] leading-relaxed text-[#6E6A65]">Preset da 1 a 5 litri; tieni premuto un valore per inserire una quantità personalizzata.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-2 font-serif text-[11px] tracking-[0.18em] text-[#6E6A65]">DURANTE ALLENAMENTO</div>
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 0.75, 1].map((value) => (
                  <PresetButton
                    key={value}
                    label={`${value}L`}
                    value={value}
                    active={acquaAllenamento === value}
                    onSelect={() => setField("acquaAllenamento", value)}
                    onLongPress={() => longPressPrompt("Acqua durante allenamento", acquaAllenamento ?? value, (next) => setField("acquaAllenamento", next))}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(formData.alcol)}
              onClick={() => setField("alcol", formData.alcol ? null : true)}
              className={`flex min-h-11 items-center justify-center gap-2 border px-4 font-serif text-[11px] tracking-wider ${formData.alcol ? "border-[#B81D1D] text-[#B81D1D]" : "border-[#333] text-[#6E6A65]"}`}
            >
              <span>ALCOL</span>
              <span className={`h-3 w-6 border ${formData.alcol ? "border-[#00FF41] bg-[#00FF41]" : "border-[#333] bg-[#333]"}`} />
            </button>
          </div>
        </div>
      </div>

      {routineVisible && (
        <div className="border-t border-[#262626] py-4">
          <div className="mb-3 font-serif text-[11px] tracking-[0.2em] text-[#6E6A65]">ROUTINE</div>
          <div className="font-serif text-[16px] text-[#E8E4DE]">HAI FATTO LA ROUTINE OGGI?</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setField("routineCompletata", true); setField("routineForza", true); }}
              className={`min-h-12 border font-serif text-[12px] tracking-wider ${formData.routineCompletata === true ? "border-[#00FF41] bg-[#00FF41] text-black" : "border-[#333] bg-[#1A1A1A] text-[#E8E4DE]"}`}
            >
              SÌ, COMPLETA
            </button>
            <button
              type="button"
              onClick={() => setField("routineCompletata", false)}
              className={`min-h-12 border font-serif text-[12px] tracking-wider ${partialRoutine ? "border-[#B87333] bg-[#B87333] text-black" : "border-[#333] bg-[#1A1A1A] text-[#E8E4DE]"}`}
            >
              PARZIALE
            </button>
          </div>
          {partialRoutine && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {routineButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setField(key, formData[key] ? null : true)}
                  className={`min-h-11 border font-serif text-[11px] tracking-wider ${formData[key] ? "border-[#00FF41] text-[#00FF41]" : "border-[#333] text-[#6E6A65]"}`}
                  aria-pressed={Boolean(formData[key])}
                >
                  {formData[key] ? "●" : "○"} {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-[#262626] py-4">
        <div className="mb-2 font-serif text-[11px] tracking-[0.2em] text-[#6E6A65]">ENERGIA</div>
        <div className="grid grid-cols-5 gap-2">
          {ENERGY.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setField("energia", value)}
              className={`min-h-12 border text-[24px] ${formData.energia === value ? "border-[#B81D1D] bg-[#B81D1D]" : "border-[#333] bg-[#1A1A1A]"}`}
              aria-label={`Energia ${value} su 5`}
              aria-pressed={formData.energia === value}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {showWeekly && (
        <div className="border-t border-[#B87333] bg-[#1A1100] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-serif text-[15px] text-[#B87333]">È DOMENICA</div>
              <p className="mt-1 font-sans text-[12px] text-[#E8E4DE]">Aggiorna i tuoi massimali settimanali.</p>
            </div>
            <button type="button" onClick={() => setShowWeekly(false)} className="font-serif text-[11px] text-[#6E6A65]">CHIUDI</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="font-serif text-[10px] text-[#6E6A65]">
              FLESSIONI
              <select value={weeklyType} onChange={(event) => setWeeklyType(event.target.value)} className="mt-1 w-full border border-[#333] bg-[#141414] p-2 font-mono text-[12px] text-[#E8E4DE]">
                <option value="normali">NORMALI</option>
                <option value="diamante">DIAMANTE</option>
              </select>
              <select value={weeklyFlessioni} onChange={(event) => setWeeklyFlessioni(Number(event.target.value))} className="mt-1 w-full border border-[#333] bg-[#141414] p-2 font-mono text-[12px] text-[#E8E4DE]">
                {Array.from({ length: 61 }, (_, index) => index * 5).map((value) => <option key={value} value={value}>{value} REP</option>)}
              </select>
            </label>
            <label className="font-serif text-[10px] text-[#6E6A65]">
              TRAZIONI
              <select value={weeklyTrazioni} onChange={(event) => setWeeklyTrazioni(Number(event.target.value))} className="mt-1 w-full border border-[#333] bg-[#141414] p-2 font-mono text-[12px] text-[#E8E4DE]">
                {Array.from({ length: 31 }, (_, index) => index).map((value) => <option key={value} value={value}>{value} REP</option>)}
              </select>
            </label>
            <label className="font-serif text-[10px] text-[#6E6A65]">
              PLANK
              <input type="range" min="15" max="180" step="15" value={weeklyPlank} onChange={(event) => setWeeklyPlank(Number(event.target.value))} className="mt-4 w-full accent-[#B81D1D]" />
              <span className="font-mono text-[12px] text-[#E8E4DE]">{weeklyPlank} SEC</span>
            </label>
            <div className="font-serif text-[10px] text-[#6E6A65]">
              GAMBA
              <div className="mt-1 grid grid-cols-2 gap-1">
                {(["ANCA", "PETTO", "TESTA", "OLTRE"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setWeeklyGamba(value)} className={`border px-1 py-2 font-mono text-[10px] ${weeklyGamba === value ? "border-[#B81D1D] text-[#B81D1D]" : "border-[#333] text-[#E8E4DE]"}`}>{value}</button>
                ))}
              </div>
            </div>
          </div>
          <button type="button" onClick={applyWeeklyMax} className="mt-4 w-full border border-[#B87333] py-3 font-serif text-[12px] tracking-wider text-[#B87333] hover:bg-[#B87333] hover:text-black">APPLICA MASSIMALI</button>
        </div>
      )}
    </section>
  );
}