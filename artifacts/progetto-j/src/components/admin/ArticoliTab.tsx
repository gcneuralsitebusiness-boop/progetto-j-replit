import { useState, useRef } from "react";
import { ArticleContent, getArticlePlainText } from "@/components/ArticleContent";
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

/** Max pixel dimension for the longer side of a cover image. */
const MAX_IMAGE_PX = 1920;
/** Target JPEG quality after compression (0–1). */
const IMAGE_QUALITY = 0.85;
/** Files already under this byte threshold are uploaded as-is. */
const COMPRESS_THRESHOLD_BYTES = 500 * 1024; // 500 KB

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

/**
 * Resize and re-encode an image file using the browser Canvas API.
 * - Images already small enough are returned unchanged.
 * - Larger images are drawn on a canvas (capped at MAX_IMAGE_PX on the long
 *   side) and exported as JPEG at IMAGE_QUALITY.
 * - GIF files are returned unchanged to preserve animation.
 */
async function optimizeImage(file: File): Promise<File> {
  // Skip GIFs (animation) and already-small files
  if (file.type === "image/gif" || file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_IMAGE_PX || h > MAX_IMAGE_PX) {
        const scale = MAX_IMAGE_PX / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // fallback: upload original
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // fallback
            return;
          }
          // Only use the compressed version if it's actually smaller
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }
          const ext = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${ext}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        IMAGE_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback
    };

    img.src = objectUrl;
  });
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
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [sortKey, setSortKey] = useState<"date-desc" | "date-asc" | "title-asc" | "title-desc" | "categoria-asc" | "categoria-desc">("date-desc");

  const PAGE_SIZE = 20;

  const imageInputRef = useRef<HTMLInputElement>(null);

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

    if (isUploading) {
      setSubmitError("Attendi il completamento del caricamento dell'immagine.");
      return;
    }

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

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitError("Seleziona un file immagine valido.");
      return;
    }

    // Hard reject: raw files over 20 MB are almost certainly unintentional
    const MAX_RAW_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_RAW_BYTES) {
      setSubmitError("L'immagine supera i 20 MB. Riduci le dimensioni prima di caricarla.");
      return;
    }

    setSubmitError(null);

    // Compress & resize client-side before uploading
    const optimized = await optimizeImage(file);
    await uploadFile(optimized);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Eliminare questo articolo?")) {
      del.mutate({ id }, { onSuccess: invalidate });
    }
  };

  // Word count + reading time (strip HTML tags for accurate count)
  const wordCount = getArticlePlainText(form.contenuto).split(/\s+/).filter(Boolean).length;
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

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleImageFileChange}
              className="sr-only"
            />

            {imgUrl ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="border border-border bg-[#141414] w-full sm:w-64 aspect-video overflow-hidden">
                  <img src={imgUrl} alt="Anteprima immagine articolo" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    className="border border-primary bg-primary px-4 py-2 text-[11px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Sostituisci immagine
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, immagine: null }))}
                    disabled={isUploading}
                    className="border border-border px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-iron transition-colors disabled:opacity-50"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border bg-[#141414] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] font-sans text-foreground">Carica l'immagine di copertina dal tuo computer.</p>
                  <p className="text-[11px] font-sans text-muted-foreground mt-1">
                    JPEG o WebP consigliati · max 20 MB · le immagini grandi vengono ridimensionate automaticamente a 1920 px
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  className="border border-primary bg-primary px-4 py-2 text-[11px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Scegli immagine
                </button>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-sans uppercase tracking-wider text-muted-foreground">
                  <span>Caricamento immagine</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1 bg-[#262626]">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
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
          {/* Label row + preview toggle */}
          <div className="flex items-center justify-between mb-1">
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
              placeholder="<h2>Titolo della sezione</h2>&#10;&#10;<p>Scrivi qui il contenuto dell'articolo...</p>"
              value={form.contenuto}
              onChange={(e) => setForm({ ...form, contenuto: e.target.value })}
              style={{ fontFamily: "var(--app-font-mono, ui-monospace, monospace)" }}
              className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary resize-y leading-relaxed text-[13px]"
            />
          )}

          {/* Word count + format cheat sheet */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
            <p className="text-[11px] font-sans text-muted-foreground/70">
              {wordCount} parole · lettura ~{readMinutes} min
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/40">
              HTML supportato: h1, h2, h3, p, ul, ol, li, blockquote, strong, em, a, br, hr
            </p>
          </div>
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
            {isUploading ? "Caricamento immagine..." : editing ? "Salva" : "Aggiungi"}
          </button>
          {editing && (
            <button type="button" onClick={reset} className="border border-border px-6 py-2.5 text-[13px] font-sans uppercase tracking-wider hover:bg-[#141414] transition-colors">
              Annulla
            </button>
          )}
        </div>
      </form>

      {/* Search + Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cerca per titolo o contenuto..."
            className="flex-1 bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="bg-[#141414] border border-border px-3 py-2 text-[12px] font-sans text-white focus:outline-none focus:border-primary uppercase tracking-wider"
          >
            <option value="">Tutte le categorie</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            {(["all", "published", "draft"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`text-[11px] uppercase tracking-wider font-sans px-3 py-2 border transition-colors ${
                  filterStatus === s
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {s === "all" ? "Tutti" : s === "published" ? "Pubblicati" : "Bozze"}
              </button>
            ))}
          </div>

          {/* Sort control */}
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as typeof sortKey); setPage(1); }}
            className="bg-[#141414] border border-border px-3 py-2 text-[12px] font-sans text-white focus:outline-none focus:border-primary uppercase tracking-wider"
          >
            <option value="date-desc">Data ↓ (più recenti)</option>
            <option value="date-asc">Data ↑ (più vecchi)</option>
            <option value="title-asc">Titolo A → Z</option>
            <option value="title-desc">Titolo Z → A</option>
            <option value="categoria-asc">Categoria A → Z</option>
            <option value="categoria-desc">Categoria Z → A</option>
          </select>

          {/* Reset all filters */}
          {(search || filterCategory || filterStatus !== "all") && (
            <button
              onClick={() => { setSearch(""); setFilterCategory(""); setFilterStatus("all"); setPage(1); }}
              className="text-[11px] uppercase tracking-wider font-sans text-muted-foreground border border-border px-3 py-2 hover:bg-[#141414] transition-colors ml-auto"
            >
              Reset filtri
            </button>
          )}
        </div>
      </div>

      {(() => {
        const filtered = (articles ?? []).filter((a) => {
          if (search.trim()) {
            const q = search.trim().toLowerCase();
            if (!a.titolo.toLowerCase().includes(q) && !a.contenuto.toLowerCase().includes(q)) return false;
          }
          if (filterCategory && a.categoria !== filterCategory) return false;
          if (filterStatus === "published" && !a.pubblicato) return false;
          if (filterStatus === "draft" && a.pubblicato) return false;
          return true;
        }).sort((a, b) => {
          if (sortKey === "date-desc") return (b.data ?? "").localeCompare(a.data ?? "") || a.titolo.localeCompare(b.titolo, "it");
          if (sortKey === "date-asc") return (a.data ?? "").localeCompare(b.data ?? "") || a.titolo.localeCompare(b.titolo, "it");
          if (sortKey === "title-asc") return a.titolo.localeCompare(b.titolo, "it");
          if (sortKey === "title-desc") return b.titolo.localeCompare(a.titolo, "it");
          if (sortKey === "categoria-asc") return a.categoria.localeCompare(b.categoria, "it") || a.titolo.localeCompare(b.titolo, "it");
          if (sortKey === "categoria-desc") return b.categoria.localeCompare(a.categoria, "it") || a.titolo.localeCompare(b.titolo, "it");
          return 0;
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        return (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-sans text-muted-foreground uppercase tracking-wider">
                {filtered.length} {filtered.length === 1 ? "articolo" : "articoli"}
                {filtered.length > PAGE_SIZE && ` · pagina ${safePage} di ${totalPages}`}
              </p>
            </div>

            <div className="space-y-3">
              {paginated.map((a) => (
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="text-[11px] uppercase tracking-wider font-sans border border-border px-4 py-2 hover:bg-[#141414] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Precedente
                </button>
                <span className="text-[12px] font-sans text-muted-foreground">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="text-[11px] uppercase tracking-wider font-sans border border-border px-4 py-2 hover:bg-[#141414] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
