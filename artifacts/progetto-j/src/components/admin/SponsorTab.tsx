import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useListSponsors,
  useCreateSponsor,
  useUpdateSponsor,
  useDeleteSponsor,
  getListSponsorsQueryKey,
} from "@workspace/api-client-react";
import type { Sponsor } from "@workspace/api-client-react";

const LEVELS = ["Bronze", "Silver", "Gold", "Blood"] as const;

const EMPTY: Omit<Sponsor, "id" | "createdAt" | "updatedAt"> = {
  nome: "",
  descrizione: "",
  url: "",
  logo: null,
  livello: "Bronze",
  ordine: 0,
  visibile: true,
};

function SortableSponsorRow({
  s,
  onEdit,
  onDelete,
  isDeleting,
}: {
  s: Sponsor;
  onEdit: (s: Sponsor) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: s.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none select-none"
          title="Trascina per riordinare"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="3" height="3" rx="1" />
            <rect x="10" y="3" width="3" height="3" rx="1" />
            <rect x="3" y="9" width="3" height="3" rx="1" />
            <rect x="10" y="9" width="3" height="3" rx="1" />
          </svg>
        </button>
        <div>
          <div className="font-serif text-[20px] tracking-wider text-foreground">{s.nome}</div>
          <div className="text-[12px] font-sans text-muted-foreground uppercase tracking-wider">
            {s.livello} · ordine {s.ordine} · {s.visibile ? "visibile" : "nascosto"}
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => onEdit(s)}
          className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors"
        >
          Modifica
        </button>
        <button
          onClick={() => onDelete(s.id)}
          disabled={isDeleting}
          className="text-[13px] uppercase tracking-wider font-sans text-destructive hover:text-destructive/80 transition-colors"
        >
          Elimina
        </button>
      </div>
    </div>
  );
}

export function SponsorTab() {
  const queryClient = useQueryClient();
  const { data: sponsors } = useListSponsors();
  const create = useCreateSponsor();
  const update = useUpdateSponsor();
  const del = useDeleteSponsor();
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState(EMPTY);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListSponsorsQueryKey() });

  const reset = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      update.mutate({ id: editing.id, data: form }, { onSuccess: () => { invalidate(); reset(); } });
    } else {
      create.mutate({ data: form }, { onSuccess: () => { invalidate(); reset(); } });
    }
  };

  const startEdit = (s: Sponsor) => {
    setEditing(s);
    setForm({
      nome: s.nome,
      descrizione: s.descrizione,
      url: s.url,
      logo: s.logo,
      livello: s.livello,
      ordine: s.ordine,
      visibile: s.visibile,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Eliminare questo sponsor?")) {
      del.mutate({ id }, { onSuccess: invalidate });
    }
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sponsors) return;

    const oldIndex = sponsors.findIndex((s) => s.id === active.id);
    const newIndex = sponsors.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sponsors, oldIndex, newIndex);

    // Optimistically update query cache
    queryClient.setQueryData(getListSponsorsQueryKey(), reordered);

    // Persist new ordine values for items that changed position
    reordered.forEach((s, i) => {
      if (s.ordine !== i) {
        update.mutate(
          { id: s.id, data: { nome: s.nome, descrizione: s.descrizione, url: s.url, logo: s.logo, livello: s.livello, ordine: i, visibile: s.visibile } },
          { onSuccess: invalidate }
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-card border border-border p-6 flex flex-col gap-4">
        <h3 className="text-[22px] font-serif tracking-wider">{editing ? "MODIFICA SPONSOR" : "NUOVO SPONSOR"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            placeholder="NOME"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
          <input
            placeholder="URL"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
          <input
            placeholder="LOGO URL"
            value={form.logo ?? ""}
            onChange={(e) => setForm({ ...form, logo: e.target.value || null })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
          <select
            value={form.livello}
            onChange={(e) => setForm({ ...form, livello: e.target.value as typeof LEVELS[number] })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <input
            type="number"
            placeholder="ORDINE"
            value={form.ordine}
            onChange={(e) => setForm({ ...form, ordine: Number(e.target.value) })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
        </div>
        <textarea
          placeholder="DESCRIZIONE"
          value={form.descrizione}
          onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
          className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary resize-y font-sans"
        />
        <label className="flex items-center gap-2 text-[13px] font-sans text-foreground">
          <input type="checkbox" checked={form.visibile} onChange={(e) => setForm({ ...form, visibile: e.target.checked })} className="accent-primary" />
          Visibile
        </label>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={create.isPending || update.isPending}
            className="bg-primary text-primary-foreground font-serif text-[15px] px-6 py-2.5 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50"
          >
            {editing ? "Salva" : "Aggiungi"}
          </button>
          {editing && (
            <button type="button" onClick={reset} className="border border-border px-6 py-2.5 text-[13px] font-sans uppercase tracking-wider hover:bg-[#141414] transition-colors">
              Annulla
            </button>
          )}
        </div>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sponsors?.map((s) => s.id) ?? []} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sponsors?.map((s) => (
              <SortableSponsorRow
                key={s.id}
                s={s}
                onEdit={startEdit}
                onDelete={handleDelete}
                isDeleting={del.isPending}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
