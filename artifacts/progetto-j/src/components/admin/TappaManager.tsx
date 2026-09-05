import { useState } from "react";
import { 
  useGetTappaCorrente, 
  useCompletaObiettivoTask, 
  useCreateObiettivoTask, 
  useChiudiTappa,
  useListObiettivi,
  getGetTappaCorrenteQueryKey,
  getListObiettiviQueryKey,
  getListTaskGiornoQueryKey
} from "@workspace/api-client-react";
import type { Obiettivo, ObiettivoTask, TappaCorrente, NuovaTappaTasks } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { isSunday, parseISO } from "date-fns";

export function TappaManager({ numeroGiorno, dataGiorno }: { numeroGiorno: number; dataGiorno?: string }) {
  const { data: tappa } = useGetTappaCorrente();
  const { data: obiettivi } = useListObiettivi();
  
  if (!tappa || !obiettivi) return null;

  const parsedDate = dataGiorno ? parseISO(dataGiorno) : null;
  const isOggiDomenica = Boolean(parsedDate && !Number.isNaN(parsedDate.getTime()) && isSunday(parsedDate));
  const isScaduta = !tappa.chiusa && numeroGiorno > tappa.giornoFine;
  
  const requiresVerifica = !tappa.chiusa && (isOggiDomenica || isScaduta);

  if (requiresVerifica) {
    return (
      <VerificaBlock 
        tappa={tappa} 
        obiettivi={obiettivi} 
        isRitardo={isScaduta}
        ritardoDays={numeroGiorno - tappa.giornoFine}
      />
    );
  }

  return <ActiveTappaBlock tappa={tappa} obiettivi={obiettivi} numeroGiorno={numeroGiorno} />;
}

function ActiveTappaBlock({ tappa, obiettivi, numeroGiorno }: { tappa: TappaCorrente; obiettivi: Obiettivo[]; numeroGiorno: number }) {
  const queryClient = useQueryClient();
  const completaMutation = useCompletaObiettivoTask();
  const createMutation = useCreateObiettivoTask();

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskObjId, setNewTaskObjId] = useState<number>(obiettivi[0]?.id ?? 0);
  const [creating, setCreating] = useState(false);

  const handleToggleTask = (task: ObiettivoTask) => {
    const newGiorno = task.giorno_completato ? null : numeroGiorno;
    const previousTappa = queryClient.getQueryData<TappaCorrente>(getGetTappaCorrenteQueryKey());

    queryClient.setQueryData(getGetTappaCorrenteQueryKey(), (old: TappaCorrente | undefined) => {
      if (!old) return old;
      return {
        ...old,
        obiettivi: old.obiettivi.map(grp => ({
          ...grp,
          task: grp.task.map(t => t.id === task.id ? { ...t, giorno_completato: newGiorno } : t)
        }))
      };
    });

    completaMutation.mutate({
      id: task.id,
      data: { giorno: numeroGiorno }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListObiettiviQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTappaCorrenteQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTaskGiornoQueryKey(numeroGiorno) });
      },
      onError: () => {
        queryClient.setQueryData(getGetTappaCorrenteQueryKey(), previousTappa);
        queryClient.invalidateQueries({ queryKey: getGetTappaCorrenteQueryKey() });
      }
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setCreating(true);

    createMutation.mutate({
      data: {
        obiettivo_id: newTaskObjId,
        tappa_id: tappa.id,
        testo: newTaskText.trim(),
        giorno_completato: numeroGiorno
      }
    }, {
      onSuccess: () => {
        setNewTaskText("");
        setCreating(false);
        queryClient.invalidateQueries({ queryKey: getListObiettiviQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTappaCorrenteQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTaskGiornoQueryKey(numeroGiorno) });
      },
      onError: () => {
        setCreating(false);
      }
    });
  };

  return (
    <div className="mb-8 border border-border bg-[#0A0A0A] p-6 flex flex-col gap-6">
      <div className="font-mono text-[13px] text-muted-foreground tracking-[0.2em] uppercase">
        QUESTA SETTIMANA · TAPPA {tappa.numero}
      </div>

      <div className="flex flex-col gap-5">
        {tappa.obiettivi.map(grp => {
          if (grp.task.length === 0) return null;
          return (
            <div key={grp.obiettivo.id} className="flex flex-col gap-3">
              <span className="font-mono text-[13px] text-muted-foreground tracking-[0.2em] uppercase">{grp.obiettivo.area}</span>
              <div className="flex flex-col gap-2">
                {grp.task.map(task => {
                  const isDoneToday = task.giorno_completato === numeroGiorno;
                  const isDoneOther = task.giorno_completato && !isDoneToday;
                  return (
                    <button
                      data-testid={`task-toggle-${task.id}`}
                      key={task.id}
                      type="button"
                      disabled={Boolean(isDoneOther)}
                      onClick={() => !isDoneOther && handleToggleTask(task)}
                      className="flex items-center gap-3 text-left font-sans text-[15px] outline-none group w-full disabled:opacity-100"
                    >
                      <div className={`w-[10px] h-[10px] shrink-0 transition-colors ${
                        isDoneToday ? 'bg-primary' : isDoneOther ? 'bg-muted-foreground' : 'border border-muted-foreground group-hover:border-foreground'
                      }`} />
                      <span className={`transition-colors ${
                        isDoneToday ? 'text-foreground' : isDoneOther ? 'text-muted-foreground' : 'text-[#C9C4BD] group-hover:text-foreground'
                      }`}>
                        {task.testo}
                      </span>
                      {task.giorno_completato && (
                        <span className="ml-auto font-mono text-[13px] text-muted-foreground tracking-[0.1em]">G.{task.giorno_completato}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-5 border-t border-border">
        <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-3">
          <div className="font-mono text-[13px] text-muted-foreground tracking-[0.1em] self-center shrink-0 uppercase">+ TASK VELOCE</div>
          <select 
            data-testid="select-quick-task-goal"
            value={newTaskObjId} 
            onChange={e => setNewTaskObjId(Number(e.target.value))}
            className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary uppercase tracking-wider text-[13px]"
          >
            {obiettivi.map(o => (
              <option key={o.id} value={o.id}>{o.area} {o.posizione}</option>
            ))}
          </select>
          <input
            data-testid="input-quick-task"
            type="text"
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            placeholder="Descrizione"
            className="flex-1 bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary text-[13px]"
            maxLength={80}
          />
          <button 
            data-testid="button-create-task"
            type="submit" 
            disabled={creating || !newTaskText.trim()}
            className="shrink-0 bg-primary text-primary-foreground font-sans text-[13px] uppercase tracking-[0.2em] px-4 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Aggiungi
          </button>
        </form>
      </div>
    </div>
  );
}

function VerificaBlock({ tappa, obiettivi, isRitardo, ritardoDays }: { tappa: TappaCorrente; obiettivi: Obiettivo[]; isRitardo: boolean; ritardoDays: number }) {
  const queryClient = useQueryClient();
  const chiudiMutation = useChiudiTappa();

  const [nota, setNota] = useState("");
  const [nuoveTappe, setNuoveTappe] = useState<Record<number, string[]>>({
    [obiettivi[0]?.id ?? 0]: [],
    [obiettivi[1]?.id ?? 0]: [],
    [obiettivi[2]?.id ?? 0]: [],
  });

  const [newTaskTexts, setNewTaskTexts] = useState<Record<number, string>>({});

  const handleAddTask = (objId: number, e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskTexts[objId]?.trim();
    if (!text || (nuoveTappe[objId]?.length ?? 0) >= 5) return;
    
    setNuoveTappe(prev => ({
      ...prev,
      [objId]: [...(prev[objId] || []), text]
    }));
    setNewTaskTexts(prev => ({ ...prev, [objId]: "" }));
  };

  const handleRemoveTask = (objId: number, index: number) => {
    setNuoveTappe(prev => ({
      ...prev,
      [objId]: prev[objId].filter((_, i) => i !== index)
    }));
  };

  const handleChiudi = () => {
    if (!nota.trim()) return;

    const payload: NuovaTappaTasks[] = Object.entries(nuoveTappe)
      .map(([objId, tasks]) => ({
        obiettivo_id: Number(objId),
        task: tasks
      }))
      .filter(nt => nt.task.length > 0);

    chiudiMutation.mutate({
      id: tappa.id,
      data: {
        nota: nota.trim(),
        nuove_tappe: payload
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListObiettiviQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTappaCorrenteQueryKey() });
      }
    });
  };

  return (
    <div className="mb-8 border border-primary p-6 bg-[#0A0A0A] flex flex-col gap-6">
      {isRitardo && (
        <div className="font-mono text-[13px] text-primary tracking-[0.2em] uppercase">
          VERIFICA IN RITARDO DI {ritardoDays} GIORNI
        </div>
      )}
      
      <div className="font-serif text-[32px] text-primary bebas tracking-wide uppercase">
        VERIFICA · TAPPA {tappa.numero}
      </div>

      <div className="flex flex-col gap-2">
        {tappa.obiettivi.map(grp => {
          const total = grp.task.length;
          const fatti = grp.task.filter(t => t.giorno_completato != null).length;
          return (
            <div key={grp.obiettivo.id} className="font-sans text-[15px] flex items-center gap-3">
              <span className="font-mono text-[13px] text-muted-foreground uppercase w-24 shrink-0 tracking-[0.1em]">{grp.obiettivo.area}</span>
              <span className={`bebas text-[20px] ${fatti < total ? 'text-primary' : 'text-foreground'}`}>{fatti}</span>
              <span className="bebas text-[20px] text-foreground">/ {total}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          data-testid="input-stage-review-note"
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Cosa è saltato e perché..."
          className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans text-[15px] min-h-[100px] resize-y"
        />
      </div>

      <div className="border-t border-border pt-6">
        <div className="font-mono text-[13px] text-muted-foreground tracking-[0.2em] uppercase mb-4">
          PROSSIMA TAPPA · GIORNI {tappa.giornoFine + 1}-{tappa.giornoFine + 7}
        </div>
        
        <div className="flex flex-col gap-6">
          {obiettivi.map(obj => (
            <div key={obj.id} className="flex flex-col gap-3">
              <span className="font-mono text-[13px] text-muted-foreground tracking-[0.1em] uppercase">{obj.area}</span>
              
              <div className="flex flex-col gap-2">
                {nuoveTappe[obj.id]?.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 font-sans text-[15px]">
                    <div className="w-[10px] h-[10px] border border-muted-foreground shrink-0" />
                    <span className="text-[#C9C4BD] flex-1">{t}</span>
                    <button data-testid={`button-remove-task-${obj.id}-${i}`} type="button" onClick={() => handleRemoveTask(obj.id, i)} className="text-muted-foreground hover:text-primary font-mono text-[13px] uppercase tracking-wider px-2">X</button>
                  </div>
                ))}
              </div>

              {(nuoveTappe[obj.id]?.length ?? 0) < 5 && (
                <form onSubmit={(e) => handleAddTask(obj.id, e)} className="flex gap-2">
                  <input
                    data-testid={`input-next-stage-task-${obj.id}`}
                    type="text"
                    value={newTaskTexts[obj.id] || ""}
                    onChange={e => setNewTaskTexts(prev => ({ ...prev, [obj.id]: e.target.value }))}
                    placeholder="Nuovo task..."
                    maxLength={80}
                    className="flex-1 bg-[#141414] border border-border p-2 text-white focus:outline-none focus:border-primary text-[13px]"
                  />
                  <button data-testid={`button-add-task-${obj.id}`} type="submit" disabled={!newTaskTexts[obj.id]?.trim()} className="shrink-0 bg-[#141414] border border-border text-foreground px-4 hover:bg-border transition-colors font-mono">+</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          data-testid="button-chiudi-tappa"
          type="button"
          onClick={handleChiudi}
          disabled={!nota.trim() || chiudiMutation.isPending}
          className="w-full bg-primary text-primary-foreground font-sans text-[13px] uppercase tracking-[0.2em] py-4 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-[#141414] disabled:text-muted-foreground disabled:border disabled:border-border"
        >
          {chiudiMutation.isPending ? "CHIUSURA IN CORSO..." : "CHIUDI TAPPA"}
        </button>
      </div>
    </div>
  );
}
