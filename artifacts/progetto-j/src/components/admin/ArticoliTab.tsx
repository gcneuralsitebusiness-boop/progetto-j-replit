import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  getListArticlesQueryKey,
} from "@workspace/api-client-react";
import type { Article } from "@workspace/api-client-react";

const EMPTY: Omit<Article, "id" | "createdAt" | "updatedAt"> = {
  slug: "",
  titolo: "",
  categoria: "Generale",
  contenuto: "",
  immagine: null,
  pubblicato: false,
  data: new Date().toISOString().split("T")[0],
};

export function ArticoliTab() {
  const queryClient = useQueryClient();
  const { data: articles } = useListArticles();
  const create = useCreateArticle();
  const update = useUpdateArticle();
  const del = useDeleteArticle();
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });

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

  const startEdit = (a: Article) => {
    setEditing(a);
    setForm({
      slug: a.slug,
      titolo: a.titolo,
      categoria: a.categoria,
      contenuto: a.contenuto,
      immagine: a.immagine,
      pubblicato: a.pubblicato,
      data: a.data,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Eliminare questo articolo?")) {
      del.mutate({ id }, { onSuccess: invalidate });
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-card border border-border p-6 flex flex-col gap-4">
        <h3 className="text-[22px] font-serif tracking-wider">{editing ? "MODIFICA ARTICOLO" : "NUOVO ARTICOLO"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            placeholder="SLUG"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
          <input
            required
            placeholder="TITOLO"
            value={form.titolo}
            onChange={(e) => setForm({ ...form, titolo: e.target.value })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
          <input
            placeholder="CATEGORIA"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
          <input
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
          />
          <input
            placeholder="IMMAGINE URL"
            value={form.immagine ?? ""}
            onChange={(e) => setForm({ ...form, immagine: e.target.value || null })}
            className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans md:col-span-2"
          />
        </div>
        <textarea
          rows={8}
          placeholder="CONTENUTO"
          value={form.contenuto}
          onChange={(e) => setForm({ ...form, contenuto: e.target.value })}
          className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary resize-y font-sans leading-relaxed"
        />
        <label className="flex items-center gap-2 text-[13px] font-sans text-foreground">
          <input type="checkbox" checked={form.pubblicato} onChange={(e) => setForm({ ...form, pubblicato: e.target.checked })} className="accent-primary" />
          Pubblicato
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

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per titolo o contenuto..."
          className="flex-1 bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-[11px] uppercase tracking-wider font-sans text-muted-foreground border border-border px-3 py-2 hover:bg-[#141414] transition-colors">
            Reset
          </button>
        )}
      </div>

      <div className="space-y-3">
        {(articles ?? []).filter((a) => {
          if (!search.trim()) return true;
          const q = search.trim().toLowerCase();
          return a.titolo.toLowerCase().includes(q) || a.contenuto.toLowerCase().includes(q);
        }).map((a) => (
          <div key={a.id} className={`bg-card border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${a.pubblicato ? "border-border" : "border-primary/50"}`}>
            <div>
              <div className="font-serif text-[20px] tracking-wider text-foreground">{a.titolo}</div>
              <div className="text-[12px] font-sans text-muted-foreground uppercase tracking-wider">/{a.slug} · {a.categoria} · {a.pubblicato ? "pubblicato" : "bozza"}</div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => startEdit(a)} className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors">Modifica</button>
              <button onClick={() => handleDelete(a.id)} disabled={del.isPending} className="text-[13px] uppercase tracking-wider font-sans text-destructive hover:text-destructive/80 transition-colors">Elimina</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
