import { useState } from "react";
import { useListObiettivi, useUpdateObiettivo, getListObiettiviQueryKey, getGetTappaCorrenteQueryKey } from "@workspace/api-client-react";
import type { ObiettivoUpdate, Obiettivo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function ObiettiviEditor() {
  const { data: obiettivi, isLoading } = useListObiettivi();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !obiettivi || obiettivi.length === 0) return null;

  return (
    <div className="mb-12 border border-border bg-card">
      <button 
        data-testid="obiettivi-editor-toggle"
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 outline-none focus-visible:bg-[#141414] hover:bg-[#141414] transition-colors"
      >
        <span className="font-serif text-[28px] tracking-wider text-foreground">OBIETTIVI</span>
        <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-muted-foreground">
          {isOpen ? "CHIUDI" : "APRI"}
        </span>
      </button>
      
      {isOpen && (
        <div className="border-t border-border p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {obiettivi.map(ob => (
            <ObiettivoForm key={ob.id} obiettivo={ob} />
          ))}
        </div>
      )}
    </div>
  );
}

function ObiettivoForm({ obiettivo }: { obiettivo: Obiettivo }) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateObiettivo();
  
  const [formData, setFormData] = useState<ObiettivoUpdate>({
    area: obiettivo.area as ObiettivoUpdate["area"],
    titolo: obiettivo.titolo,
    previsto: obiettivo.previsto,
    giorno_limite: obiettivo.giornoLimite,
    prova: obiettivo.prova ?? "",
    stato: obiettivo.stato as ObiettivoUpdate["stato"],
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    updateMutation.mutate({
      id: obiettivo.id,
      data: {
        ...formData,
        prova: formData.prova?.trim() === "" ? null : formData.prova,
      }
    }, {
      onSuccess: () => {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        queryClient.invalidateQueries({ queryKey: getListObiettiviQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTappaCorrenteQueryKey() });
      },
      onError: () => {
        setSaving(false);
      }
    });
  };

  const field = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-border p-4 bg-[#0A0A0A]">
      <div className="font-mono text-[13px] text-primary tracking-[0.2em] mb-2 uppercase">
        ROMBO {obiettivo.posizione}
      </div>

      {field("Area", (
        <select 
          data-testid={`select-goal-area-${obiettivo.id}`}
          value={formData.area} 
          onChange={e => setFormData({ ...formData, area: e.target.value as ObiettivoUpdate["area"] })}
          className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary uppercase tracking-wider text-[13px]"
        >
          <option value="CORPO">CORPO</option>
          <option value="CONTENUTI">CONTENUTI</option>
          <option value="SOLDI">SOLDI</option>
        </select>
      ))}

      {field(`Titolo (${formData.titolo.length}/60)`, (
        <input 
          data-testid={`input-goal-title-${obiettivo.id}`}
          type="text" 
          maxLength={60} 
          required 
          value={formData.titolo} 
          onChange={e => setFormData({ ...formData, titolo: e.target.value })}
          className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary"
        />
      ))}

      <div className="grid grid-cols-2 gap-4">
        {field("Da fare (Fatto: " + obiettivo.fatto + ")", (
          <input 
            data-testid={`input-goal-target-${obiettivo.id}`}
            type="number" 
            required 
            min={1}
            value={formData.previsto} 
            onChange={e => setFormData({ ...formData, previsto: Number(e.target.value) })}
            className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums"
          />
        ))}
        {field("Giorno Limite", (
          <input 
            data-testid={`input-goal-deadline-${obiettivo.id}`}
            type="number" 
            required 
            min={1}
            max={180}
            value={formData.giorno_limite} 
            onChange={e => setFormData({ ...formData, giorno_limite: Number(e.target.value) })}
            className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums"
          />
        ))}
      </div>

      {field("Prova", (
        <input 
          data-testid={`input-goal-proof-${obiettivo.id}`}
          type="text" 
          value={formData.prova ?? ""} 
          onChange={e => setFormData({ ...formData, prova: e.target.value })}
          className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary"
        />
      ))}

      {field("Stato", (
        <select 
          data-testid={`select-goal-status-${obiettivo.id}`}
          value={formData.stato} 
          onChange={e => setFormData({ ...formData, stato: e.target.value as ObiettivoUpdate["stato"] })}
          className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary uppercase tracking-wider text-[13px]"
        >
          <option value="attivo">Attivo</option>
          <option value="compiuto">Compiuto</option>
          <option value="fallito">Fallito</option>
        </select>
      ))}

      <button 
        data-testid={`button-save-goal-${obiettivo.id}`}
        type="submit" 
        disabled={saving}
        className="mt-2 w-full bg-[#141414] border border-border text-foreground font-sans text-[13px] uppercase tracking-[0.2em] py-3 hover:bg-border hover:text-white transition-colors disabled:opacity-50"
      >
        {saved ? "SALVATO" : saving ? "SALVATAGGIO..." : "SALVA"}
      </button>
    </form>
  );
}
