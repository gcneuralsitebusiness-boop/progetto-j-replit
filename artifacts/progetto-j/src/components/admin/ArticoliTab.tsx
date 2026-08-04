import { useState } from "react";
import { ArticleContent } from "@/components/ArticleContent";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  getListArticlesQueryKey,
} from "@workspace/api-client-react";
import type { Article } from "@workspace/api-client-react";
import { useUpload, getPhotoUrl } from "@workspace/object-storage-web";

const CATEGORIES = ["Biohacking", "Combat", "Business", "Fede", "Mentalità"] as const;

const EMPTY: Omit<Article, "id" | "createdAt" | "updatedAt"> = {
  slug: "",
  titolo: "",
  categoria: CATEGORIES[0],
  contenuto: "",
  immagine: null,
  pubblicato: false,
  data: new Date().toISOString().split("T")[0],
};

function autoSlug(titolo: string): string {
  return titolo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function ArticoliTab() {
  const queryClient = useQueryClient();
  const { data: articles } = useListArticles();
  const create = useCreateArticle();
  const update = useUpdateArticle();
  const del = useDeleteArticle();
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 20;
  const [previewMode, setPreviewMode] = useState(false);

  const { uploadFile, isUploading, progress, error: uploadError } = useUpload({
    onSuccess: (res) => setForm((f) => ({ ...f, immagine: res.objectPath })),
  });

  const imgUrl = form.immagine
    ? (getPhotoUrl(form.immagine) ?? (form.immagine.startsWith("http") ? form.immagine : null))
    : null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });

  const reset = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setSlugTouched(false);
    setSubmitError(null);
  };

  const handleTitoloChange = (titolo: string) => {
    setForm((f) => ({
      ...f,
      titolo,
      slug: slugTouched ? f.slug : autoSlug(titolo),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.slug.trim() || !form.titolo.trim()) {
      setSubmitError("Slug e titolo sono obbligatori.");
      return;
    }

    const handleError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(
        msg.includes("401")
          ? "Sessione scaduta. Ricarica la pagina e rientra."
          : "Salvataggio fallito. Riprova."
      );
    };

    if (editing) {
      update.mutate({ id: editing.id, data: form }, {
        onSuccess: () => { invalidate(); reset(); },
        onError: handleError,
      });
    } else {
      create.mutate({ data: form }, {
        onSuccess: () => { invalidate(); reset(); },
        onError: handleError,
      });
    }
  };

  const startEdit = (a: Article) => {
    setEditing(a);
    setSlugTouched(true); // preserve existing slug when editing
    setSubmitError(null);
    setForm({
      slug: a.slug,
      titolo: a.titolo,
      categoria: a.categoria, // always preserve stored value, even if outside predefined list
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

  // Word count + reading time
  const wordCount = form.contenuto.trim() ? form.contenuto.trim().split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));

  const inputCls = "bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans";

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-card border border-border p-6 flex flex-col gap-4">
        <h3 className="text-[22px] font-serif tracking-wider">{editing ? "MODIFICA ARTICOLO" : "NUOVO ARTICOLO"}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Titolo */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Titolo *</label>
            <input
              placeholder="TITOLO"
              value={form.titolo}
              onChange={(e) => handleTitoloChange(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Slug *</label>
            <input
              placeholder="slug-articolo"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={!!editing}
              className={`${inputCls} disabled:opacity-40 font-mono text-[13px]`}
            />
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className={inputCls}
            >
              {/* Include current value as option if it's not in the predefined list (legacy data) */}
              {form.categoria && !CATEGORIES.includes(form.categoria as (typeof CATEGORIES)[number]) && (
                <option key="__legacy__" value={form.categoria}>{form.categoria}</option>
              )}
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Data</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              className={inputCls}
            />
          </div>

          {/* Immagine upload — full width */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Immagine</label>

            {imgUrl ? (
              <div className="relative border border-border w-fit">
                <img src={imgUrl} alt="Anteprima" className="max-h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, immagine: null })}
                  className="absolute top-2 right-2 bg-background/90 text-[11px] uppercase tracking-wider px-2 py-1 border border-border hover:text-primary transition-colors"
                >
                  Rimuovi
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await uploadFile(file);
                }}
                className={`${inputCls} file:mr-4 file:bg-primary file:text-primary-foreground file:border-0 file:px-3 file:py-1 file:uppercase file:text-[11px] file:tracking-wider`}
              />
            )}

            {isUploading && (
              <div className="w-full h-1 bg-[#262626]">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            {uploadError && (
              <p className="text-[13px] font-sans text-primary border border-primary/40 bg-primary/10 px-4 py-3">
                Errore upload: {uploadError.message}
              </p>
            )}
          </div>
        </div>

        {/* Contenuto */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Contenuto</label>
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className={`text-[11px] uppercase tracking-widest px-3 py-1 border transition-colors font-sans ${
                previewMode
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {previewMode ? "✕ Anteprima" : "Anteprima"}
            </button>
          </div>

          {previewMode ? (
            <div className="bg-[#141414] border border-primary/40 p-4 min-h-[260px]">
              {form.contenuto.trim() ? (
                <ArticleContent contenuto={form.contenuto} />
              ) : (
                <p className="text-[13px] font-sans text-muted-foreground/50 italic">
                  Nessun contenuto da visualizzare.
                </p>
              )}
            </div>
          ) : (
            <textarea
              rows={16}
              placeholder="Scrivi il contenuto dell'articolo&#10;&#10;Usa righe vuote doppie tra i paragrafi.&#10;&#10;**Titolo sezione** per un'intestazione."
              value={form.contenuto}
              onChange={(e) => setForm({ ...form, contenuto: e.target.value })}
              style={{ fontFamily: "var(--app-font-mono, ui-monospace, monospace)" }}
              className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary resize-y leading-relaxed text-[13px]"
            />
          )}

          <p className="text-[11px] font-sans text-muted-foreground/70 mt-1">
            {wordCount} parole · lettura ~{readMinutes} min
          </p>
        </div>

        <label className="flex items-center gap-2 text-[13px] font-sans text-foreground">
          <input type="checkbox" checked={form.pubblicato} onChange={(e) => setForm({ ...form, pubblicato: e.target.checked })} className="accent-primary" />
          Pubblicato
        </label>

        {submitError && (
          <p className="text-[13px] font-sans text-primary border border-primary/40 bg-primary/10 px-4 py-3">{submitError}</p>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={create.isPending || update.isPending || isUploading}
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
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Cerca per titolo o contenuto..."
          className="flex-1 bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
        />
        {search && (
          <button onClick={() => { setSearch(""); setPage(0); }} className="text-[11px] uppercase tracking-wider font-sans text-muted-foreground border border-border px-3 py-2 hover:bg-[#141414] transition-colors">
            Reset
          </button>
        )}
      </div>

      {(() => {
        const allFiltered = (articles ?? []).filter((a) => {
          if (!search.trim()) return true;
          const q = search.trim().toLowerCase();
          return a.titolo.toLowerCase().includes(q) || a.contenuto.toLowerCase().includes(q);
        });
        const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
        const pageItems = allFiltered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

        return (
          <>
            {/* Count + page indicator */}
            <div className="flex items-center justify-between text-[11px] font-sans text-muted-foreground uppercase tracking-wider">
              <span>{allFiltered.length} articol{allFiltered.length === 1 ? "o" : "i"}</span>
              {totalPages > 1 && (
                <span>pagina {page + 1} / {totalPages}</span>
              )}
            </div>

            <div className="space-y-3">
              {pageItems.map((a) => (
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

            {/* Prev / Next */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-[12px] font-sans uppercase tracking-wider border border-border px-4 py-2 text-muted-foreground hover:bg-[#141414] hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  ← Precedente
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-[12px] font-sans uppercase tracking-wider border border-border px-4 py-2 text-muted-foreground hover:bg-[#141414] hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  Successiva →
                </button>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
