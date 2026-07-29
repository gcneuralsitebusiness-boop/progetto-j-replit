import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminMe, useAdminLogin, useAdminLogout,
  useListEntries, useCreateEntry, useUpdateEntry, useDeleteEntry,
  useListPages, useCreatePage, useUpdatePage, useDeletePage,
  useGetEntriesBulkText, useImportEntriesBulkText,
  getAdminMeQueryKey, getListEntriesQueryKey, getGetLatestEntriesQueryKey,
  getListPagesQueryKey,
} from "@workspace/api-client-react";
import { SocialTab } from "@/components/admin/SocialTab";
import { SponsorTab } from "@/components/admin/SponsorTab";
import { ArticoliTab } from "@/components/admin/ArticoliTab";
import { CoachingTab } from "@/components/admin/CoachingTab";
import { SitoTab } from "@/components/admin/SitoTab";
import { ContattiTab } from "@/components/admin/ContattiTab";
import { IscrittiTab } from "@/components/admin/IscrittiTab";
import type { Entry, EntryInput, PageItem } from "@workspace/api-client-react";
import { useUpload, getPhotoUrl } from "@workspace/object-storage-web";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// ─── Login ────────────────────────────────────────────────────────────────────

function AdminLoginForm() {
  const queryClient = useQueryClient();
  const loginMutation = useAdminLogin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(
      { data: { password } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() }),
        onError: () => setError("Password non corretta"),
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="bg-card border border-border p-10 w-full max-w-sm flex flex-col gap-8">
        <h1 className="text-[64px] font-serif text-primary text-center leading-none mt-2">J</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary transition-colors font-sans"
            required
          />
          {error && <p className="text-primary font-sans text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-serif text-[18px] py-3 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50 mt-2"
          >
            {loginMutation.isPending ? "Accesso..." : "Entra"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Entry Form ───────────────────────────────────────────────────────────────

function EntryForm({ initialData, onSuccess, onCancel }: { initialData?: Entry; onSuccess: () => void; onCancel?: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();
  const { uploadFile, isUploading, progress, error: uploadError } = useUpload({
    onSuccess: (res) => setFormData((d) => ({ ...d, foto: res.objectPath })),
  });

  const [formData, setFormData] = useState<Partial<EntryInput>>({
    numero: initialData?.numero || 1,
    data: initialData?.data || new Date().toISOString().split("T")[0],
    kcal: initialData?.kcal ?? undefined,
    sonno: initialData?.sonno ?? undefined,
    flessioni: initialData?.flessioni ?? undefined,
    addominali: initialData?.addominali ?? undefined,
    round: initialData?.round ?? undefined,
    km: initialData?.km ?? undefined,
    peso: initialData?.peso ?? undefined,
    battito: initialData?.battito ?? undefined,
    entrate: initialData?.entrate ?? undefined,
    uscite: initialData?.uscite ?? undefined,
    testo: initialData?.testo || "",
    foto: initialData?.foto || "",
  });

  const photoUrl = getPhotoUrl(formData.foto);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: EntryInput = {
      numero: Number(formData.numero),
      data: formData.data as string,
      kcal: formData.kcal != null ? Number(formData.kcal) : null,
      sonno: formData.sonno != null ? Number(formData.sonno) : null,
      flessioni: formData.flessioni != null ? Number(formData.flessioni) : null,
      addominali: formData.addominali != null ? Number(formData.addominali) : null,
      round: formData.round != null ? Number(formData.round) : null,
      km: formData.km != null ? Number(formData.km) : null,
      peso: formData.peso != null ? Number(formData.peso) : null,
      battito: formData.battito != null ? Number(formData.battito) : null,
      entrate: formData.entrate != null ? Number(formData.entrate) : null,
      uscite: formData.uscite != null ? Number(formData.uscite) : null,
      testo: formData.testo || null,
      foto: formData.foto || null,
    };

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetLatestEntriesQueryKey() });
    };

    if (initialData) {
      updateMutation.mutate({ numero: initialData.numero, data: payload }, { onSuccess: () => { invalidate(); onSuccess(); } });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          invalidate();
          setFormData({
            numero: Number(formData.numero) + 1,
            data: new Date().toISOString().split("T")[0],
            kcal: undefined, sonno: undefined, flessioni: undefined, addominali: undefined,
            round: undefined, km: undefined, peso: undefined, battito: undefined,
            entrate: undefined, uscite: undefined,
            testo: "", foto: "",
          });
          onSuccess();
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const field = (label: string, key: keyof EntryInput, step?: string) => (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type="number"
        step={step}
        value={(formData[key] as number | undefined) ?? ""}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value ? Number(e.target.value) : undefined })}
        className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 md:p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[28px] font-serif tracking-wider">{initialData ? `MODIFICA GIORNO ${initialData.numero}` : "AGGIUNGI GIORNO"}</h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground text-[13px] uppercase tracking-wider font-sans border border-border px-4 py-1.5 hover:bg-[#141414] transition-colors">
            Annulla
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Numero *</label>
          <input type="number" required value={formData.numero ?? ""} onChange={(e) => setFormData({ ...formData, numero: Number(e.target.value) })} className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Data *</label>
          <input type="date" required value={formData.data ?? ""} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums" />
        </div>
        {field("Kcal", "kcal")}
        {field("Sonno (h)", "sonno", "0.5")}
        {field("Flessioni", "flessioni")}
        {field("Addominali", "addominali")}
        {field("Round", "round")}
        {field("Km", "km", "0.1")}
        {field("Peso (kg)", "peso", "0.1")}
        {field("Battito (bpm)", "battito")}
        {field("Entrate (€)", "entrate", "0.01")}
        {field("Uscite (€)", "uscite", "0.01")}
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Foto</label>
        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary file:mr-4 file:bg-primary file:text-primary-foreground file:border-0 file:px-3 file:py-1 file:uppercase file:text-[11px] file:tracking-wider"
          />
          {isUploading && (
            <div className="w-full h-1 bg-[#262626]">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {uploadError && (
            <p className="text-[12px] font-sans text-primary">
              Errore upload: {uploadError.message}
            </p>
          )}
          {photoUrl && (
            <div className="relative border border-border w-fit">
              <img src={photoUrl} alt="Anteprima foto" className="max-h-[200px] object-contain" />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, foto: "" })}
                className="absolute top-2 right-2 bg-background/90 text-[11px] uppercase tracking-wider px-2 py-1 border border-border hover:text-primary transition-colors"
              >
                Rimuovi
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Testo</label>
        <textarea rows={6} value={formData.testo ?? ""} onChange={(e) => setFormData({ ...formData, testo: e.target.value })} className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary resize-y font-sans leading-relaxed" />
      </div>

      <button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground font-serif text-[18px] py-4 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50 mt-4">
        {isPending ? "Salvataggio..." : "Salva Giorno"}
      </button>
    </form>
  );
}

// ─── Tab: Diario ──────────────────────────────────────────────────────────────

function DiarioTab() {
  const queryClient = useQueryClient();
  const { data: entries } = useListEntries({ query: { queryKey: getListEntriesQueryKey() } });
  const deleteMutation = useDeleteEntry();
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const startEditing = (entry: Entry) => {
    setEditingEntry(entry);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleDelete = (numero: number) => {
    if (window.confirm(`Eliminare il giorno ${numero}?`)) {
      deleteMutation.mutate({ numero }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLatestEntriesQueryKey() });
        },
      });
    }
  };

  return (
    <div className="space-y-12">
      <div ref={formRef} className="scroll-mt-28">
        {editingEntry ? (
          <EntryForm key={editingEntry.id} initialData={editingEntry} onSuccess={() => setEditingEntry(null)} onCancel={() => setEditingEntry(null)} />
        ) : (
          <EntryForm key="new" onSuccess={() => {}} />
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-[28px] font-serif tracking-wider mb-8">DIARIO REGISTRATO</h2>
        {entries?.map((entry) => (
          <div
            key={entry.id}
            className={`bg-card border p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${
              editingEntry?.id === entry.id
                ? "border-primary"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center gap-6">
              {entry.foto ? (
                <img src={getPhotoUrl(entry.foto) ?? undefined} alt="" className="w-12 h-12 object-cover border border-border shrink-0" />
              ) : (
                <div className="w-12 h-12 border border-border bg-[#0a0a0a] shrink-0 flex items-center justify-center text-[10px] font-sans text-muted-foreground tabular-nums">
                  {entry.numero}
                </div>
              )}
              <div className="font-serif text-[32px] text-primary leading-none w-28 mt-1">GIORNO {entry.numero}</div>
              <div className="text-[13px] font-sans text-muted-foreground uppercase tracking-wider">
                {format(new Date(entry.data), "d MMM yyyy", { locale: it })}
              </div>
              <div className="text-[13px] font-sans text-muted-foreground uppercase tracking-wider hidden md:block">
                {[entry.kcal ? `${entry.kcal} KCAL` : null, entry.peso ? `${entry.peso} KG` : null].filter(Boolean).join(" · ")}
              </div>
              {editingEntry?.id === entry.id && (
                <span className="text-[11px] uppercase tracking-widest text-primary border border-primary px-2 py-0.5 font-sans">In modifica</span>
              )}
            </div>
            <div className="flex gap-6">
              <button onClick={() => startEditing(entry)} className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors">Modifica</button>
              <button onClick={() => handleDelete(entry.numero)} disabled={deleteMutation.isPending} className="text-[13px] uppercase tracking-wider font-sans text-destructive hover:text-destructive/80 transition-colors">Elimina</button>
            </div>
          </div>
        ))}
        {entries?.length === 0 && (
          <p className="text-muted-foreground font-sans text-[15px]">Nessun giorno registrato.</p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Bulk Edit ───────────────────────────────────────────────────────────

function BulkEditTab() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const { data: exportedText, isLoading } = useGetEntriesBulkText({ query: { queryKey: ["entriesBulkText"] } });
  const importMutation = useImportEntriesBulkText();

  useEffect(() => {
    if (exportedText && text === "") {
      setText(exportedText);
    }
  }, [exportedText]);

  const handleImport = () => {
    setResult(null);
    importMutation.mutate(
      { data: { text } },
      {
        onSuccess: (res) => {
          setResult(res);
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLatestEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["entriesBulkText"] });
        },
      }
    );
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progetto-j-diario-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-card border border-border p-6 md:p-8 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[28px] font-serif tracking-wider">BULK EDIT · DIARIO</h2>
            <p className="text-muted-foreground font-sans text-sm leading-relaxed mt-2">
              Modifica tutte le descrizioni e i dati tecnici in un unico file di testo. Puoi copiarlo, modificarlo fuori dal sito e reimportarlo. Vengono aggiornati solo i giorni già esistenti.
            </p>
          </div>
          <div className="text-[13px] font-sans text-muted-foreground uppercase tracking-wider">
            {isLoading ? "Caricamento..." : `${(exportedText ?? "").split("# GIORNO").length - 1} giorni`}
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={24}
          className="bg-[#141414] border border-border p-4 text-[13px] font-mono text-foreground focus:outline-none focus:border-primary resize-y leading-relaxed"
          placeholder="# GIORNO 1\nDATA: 2026-07-19\nKCAL: -\n...\nTESTO:\n...\nFINE_TESTO"
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleImport}
            disabled={importMutation.isPending || text.trim() === ""}
            className="flex-1 bg-primary text-primary-foreground font-serif text-[18px] py-4 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50"
          >
            {importMutation.isPending ? "Importazione..." : "Importa modifiche"}
          </button>
          <button
            onClick={handleDownload}
            disabled={text.trim() === ""}
            className="flex-1 border border-border text-muted-foreground font-serif text-[18px] py-4 tracking-wider hover:text-foreground hover:bg-[#141414] transition-colors uppercase disabled:opacity-50"
          >
            Scarica file
          </button>
        </div>

        {result && (
          <div className={`border p-4 font-sans text-sm ${result.errors.length > 0 ? "border-primary text-primary" : "border-green-500 text-green-500"}`}>
            <p>Giorni aggiornati: {result.updated}</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Errori:</p>
                <ul className="list-disc pl-5 mt-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="text-[11px] text-muted-foreground font-sans leading-relaxed border-t border-border pt-4">
          <p className="uppercase tracking-widest mb-2">Formato richiesto</p>
          <p>Non modificare la struttura dei blocchi. Ogni giorno inizia con <code># GIORNO N</code>, seguito da <code>DATA: YYYY-MM-DD</code> e i campi numerici. Il testo va tra <code>TESTO:</code> e <code>FINE_TESTO</code>. Valori mancanti o non numerici scrivili come <code>-</code>.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Pagine ──────────────────────────────────────────────────────────────

function PageForm({ initialData, onSuccess, onCancel }: { initialData?: PageItem; onSuccess: () => void; onCancel?: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreatePage();
  const updateMutation = useUpdatePage();

  const [formData, setFormData] = useState({
    slug: initialData?.slug ?? "",
    titolo: initialData?.titolo ?? "",
    contenuto: initialData?.contenuto ?? "",
    pubblicata: initialData?.pubblicata ?? false,
    ordine: initialData?.ordine ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPagesQueryKey() });
    if (initialData) {
      updateMutation.mutate({ slug: initialData.slug, data: formData }, { onSuccess: () => { invalidate(); onSuccess(); } });
    } else {
      createMutation.mutate({ data: formData }, { onSuccess: () => { invalidate(); onSuccess(); } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const err = (createMutation.error || updateMutation.error) as any;

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h3 className="text-[22px] font-serif tracking-wider">{initialData ? "MODIFICA PAGINA" : "NUOVA PAGINA"}</h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground text-[13px] uppercase tracking-wider font-sans border border-border px-4 py-1.5 hover:bg-[#141414] transition-colors">
            Annulla
          </button>
        )}
      </div>

      {err && <p className="text-primary text-sm font-sans">{err?.message ?? "Errore"}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Slug * <span className="normal-case">(/p/slug)</span></label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
            placeholder="es. regole-del-gioco"
            disabled={!!initialData}
            className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary disabled:opacity-40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Titolo *</label>
          <input
            type="text"
            required
            value={formData.titolo}
            onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
            className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Contenuto</label>
        <textarea
          rows={10}
          value={formData.contenuto}
          onChange={(e) => setFormData({ ...formData, contenuto: e.target.value })}
          className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary resize-y font-sans leading-relaxed"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-2 w-32">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Ordine</label>
          <input type="number" value={formData.ordine} onChange={(e) => setFormData({ ...formData, ordine: Number(e.target.value) })} className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer mt-5">
          <input
            type="checkbox"
            checked={formData.pubblicata}
            onChange={(e) => setFormData({ ...formData, pubblicata: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-[13px] font-sans uppercase tracking-widest text-muted-foreground">Pubblicata</span>
        </label>
      </div>

      <button type="submit" disabled={isPending} className="self-start bg-primary text-primary-foreground font-serif text-[15px] px-8 py-3 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50">
        {isPending ? "Salvataggio..." : initialData ? "Aggiorna" : "Crea Pagina"}
      </button>
    </form>
  );
}

function PagineTab() {
  const queryClient = useQueryClient();
  const { data: pages, isLoading } = useListPages({ query: { queryKey: getListPagesQueryKey() } });
  const deleteMutation = useDeletePage();
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [showNew, setShowNew] = useState(false);

  const handleDelete = (slug: string) => {
    if (window.confirm(`Eliminare la pagina "${slug}"?`)) {
      deleteMutation.mutate({ slug }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPagesQueryKey() }) });
    }
  };

  return (
    <div className="space-y-10">
      {!showNew && !editingPage && (
        <button onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground font-serif text-[15px] px-6 py-2.5 tracking-wider hover:bg-primary/90 transition-colors uppercase">
          + Nuova Pagina
        </button>
      )}

      {showNew && (
        <PageForm
          onSuccess={() => setShowNew(false)}
          onCancel={() => setShowNew(false)}
        />
      )}

      {editingPage && (
        <PageForm
          initialData={editingPage}
          onSuccess={() => setEditingPage(null)}
          onCancel={() => setEditingPage(null)}
        />
      )}

      <div className="space-y-4">
        <h2 className="text-[28px] font-serif tracking-wider mb-8">PAGINE CREATE</h2>
        {isLoading && <p className="text-muted-foreground font-sans animate-pulse">Caricamento...</p>}
        {pages?.map((page) => (
          <div key={page.id} className="bg-card border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-muted-foreground/30 transition-colors">
            <div className="flex items-center gap-6">
              <div className="font-serif text-[20px] leading-none">{page.titolo}</div>
              <code className="text-[13px] font-mono text-muted-foreground">/p/{page.slug}</code>
              {page.pubblicata ? (
                <span className="text-[11px] uppercase tracking-widest text-primary border border-primary px-2 py-0.5">Online</span>
              ) : (
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5">Bozza</span>
              )}
            </div>
            <div className="flex gap-6">
              <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-[13px] uppercase tracking-wider font-sans text-muted-foreground hover:text-foreground transition-colors">
                Apri
              </a>
              <button onClick={() => { setShowNew(false); setEditingPage(page); }} className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors">
                Modifica
              </button>
              <button onClick={() => handleDelete(page.slug)} disabled={deleteMutation.isPending} className="text-[13px] uppercase tracking-wider font-sans text-destructive hover:text-destructive/80 transition-colors">
                Elimina
              </button>
            </div>
          </div>
        ))}
        {!isLoading && pages?.length === 0 && (
          <p className="text-muted-foreground font-sans text-[15px]">Nessuna pagina creata. Inizia con "+ Nuova Pagina".</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin ───────────────────────────────────────────────────────────────

type Tab = "diario" | "sito" | "pagine" | "bulk" | "social" | "sponsor" | "articoli" | "coaching" | "contatti" | "iscritti";

const TABS: { id: Tab; label: string }[] = [
  { id: "diario", label: "Diario" },
  { id: "sito", label: "Sito" },
  { id: "pagine", label: "Pagine" },
  { id: "articoli", label: "Articoli" },
  { id: "social", label: "Social" },
  { id: "sponsor", label: "Sponsor" },
  { id: "coaching", label: "Coaching" },
  { id: "contatti", label: "Contatti" },
  { id: "iscritti", label: "Iscritti" },
  { id: "bulk", label: "Bulk" },
];

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: adminData, isLoading: adminLoading } = useAdminMe({ query: { queryKey: getAdminMeQueryKey(), retry: false } });
  const logoutMutation = useAdminLogout();
  const [activeTab, setActiveTab] = useState<Tab>("diario");

  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center font-serif text-2xl animate-pulse text-muted-foreground pt-16">Caricamento...</div>;
  }

  if (!adminData?.authenticated) return <AdminLoginForm />;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() }),
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-border pb-6">
        <h1 className="text-[32px] font-serif tracking-wider">ADMIN · PROGETTO J</h1>
        <button onClick={handleLogout} className="text-[13px] font-sans text-primary uppercase tracking-[0.15em] hover:text-primary/80 transition-colors">
          Esci
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-12 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-serif text-[15px] tracking-[0.1em] uppercase border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "diario" && <DiarioTab />}
      {activeTab === "sito" && <SitoTab />}
      {activeTab === "pagine" && <PagineTab />}
      {activeTab === "articoli" && <ArticoliTab />}
      {activeTab === "social" && <SocialTab />}
      {activeTab === "sponsor" && <SponsorTab />}
      {activeTab === "coaching" && <CoachingTab />}
      {activeTab === "contatti" && <ContattiTab />}
      {activeTab === "iscritti" && <IscrittiTab />}
      {activeTab === "bulk" && <BulkEditTab />}
    </div>
  );
}
