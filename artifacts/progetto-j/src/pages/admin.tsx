import { useState, useRef, useEffect, useCallback } from "react";
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
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { PlannerTab } from "@/components/admin/PlannerTab";
import type { Entry, EntryInput, PageItem } from "@workspace/api-client-react";
import { useUpload, getPhotoUrl } from "@workspace/object-storage-web";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// ─── Client-side range validation ─────────────────────────────────────────────

const CLIENT_RANGES: Record<string, [number, number, string]> = {
  peso:       [30,  200,    "30–200 kg"],
  battito:    [30,  220,    "30–220 bpm"],
  sonno:      [0,   24,     "0–24 h"],
  kcal:       [0,   15000,  "0–15 000"],
  km:         [0,   100,    "0–100"],
  flessioni:  [0,   2000,   "0–2000"],
  addominali: [0,   2000,   "0–2000"],
  round:      [0,   2000,   "0–2000"],
  entrate:    [0,   100000, "0–100 000 €"],
  uscite:     [0,   100000, "0–100 000 €"],
};

function validateEntry(data: Partial<Record<string, unknown>>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, [min, max, label]] of Object.entries(CLIENT_RANGES)) {
    const val = data[field];
    if (val == null || val === "") continue;
    const num = Number(val);
    if (!Number.isNaN(num) && (num < min || num > max)) {
      errors[field] = `Intervallo consentito: ${label}`;
    }
  }
  return errors;
}

// ─── Backup download helper ────────────────────────────────────────────────────

function downloadBackup() {
  const a = document.createElement("a");
  a.href = "/api/admin/backup";
  a.download = `progetto-j-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

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
    sintesi: initialData?.sintesi || "",
  });

  // ─── Autosave + draft restore ──────────────────────────────────────────────
  const [draftBar, setDraftBar] = useState<{ time: string; data: Partial<EntryInput> } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  // Load draft when editing an entry
  useEffect(() => {
    if (!initialData) { isMounted.current = true; return; }
    fetch(`/api/admin/drafts/${initialData.numero}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((draft: { updatedAt: string; dati: Partial<EntryInput> } | null) => {
        if (!draft) return;
        const time = new Date(draft.updatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
        setDraftBar({ time, data: draft.dati });
      })
      .catch(() => {})
      .finally(() => { isMounted.current = true; });
  }, [initialData?.numero]);

  // Autosave to server (editing only), debounced 2 s
  useEffect(() => {
    if (!initialData || !isMounted.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      fetch("/api/admin/drafts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: initialData.numero, formJson: formData }),
      }).catch(() => {});
    }, 2000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [formData]);

  const deleteDraft = useCallback((numero: number) => {
    fetch(`/api/admin/drafts/${numero}`, { method: "DELETE", credentials: "include" }).catch(() => {});
  }, []);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateEntry(formData as Record<string, unknown>);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
      sintesi: formData.sintesi?.trim() ? formData.sintesi.trim().slice(0, 180) : null,
    };

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetLatestEntriesQueryKey() });
    };

    const handleError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg.includes("401") ? "Sessione scaduta. Ricarica la pagina." : `Errore: ${msg}`);
    };

    if (initialData) {
      updateMutation.mutate({ numero: initialData.numero, data: payload }, {
        onSuccess: () => { invalidate(); deleteDraft(initialData.numero); onSuccess(); },
        onError: handleError,
      });
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
        onError: handleError,
      });
    }
  };

  const photoUrl = getPhotoUrl(formData.foto);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const field = (label: string, key: keyof EntryInput, step?: string) => {
    const err = validationErrors[key as string];
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
        <input
          type="number"
          step={step}
          value={(formData[key] as number | undefined) ?? ""}
          onChange={(e) => {
            setFormData({ ...formData, [key]: e.target.value ? Number(e.target.value) : undefined });
            if (validationErrors[key as string]) {
              setValidationErrors((prev) => { const n = { ...prev }; delete n[key as string]; return n; });
            }
          }}
          className={`bg-[#141414] border p-2.5 text-white focus:outline-none tabular-nums transition-colors ${err ? "border-primary focus:border-primary" : "border-border focus:border-primary"}`}
        />
        {err && <span className="text-[11px] font-sans text-primary">{err}</span>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 md:p-8 flex flex-col gap-6">
      {/* Draft restore bar */}
      {draftBar && (
        <div className="flex items-center justify-between gap-4 bg-[#1a1100] border border-primary/40 px-4 py-3">
          <span className="text-[12px] font-sans text-primary/90">Bozza non salvata delle {draftBar.time}.</span>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setFormData(draftBar.data); setDraftBar(null); }}
              className="text-[11px] uppercase tracking-wider font-sans text-primary border border-primary/50 px-3 py-1 hover:bg-primary/10 transition-colors">
              Ripristina
            </button>
            <button type="button" onClick={() => setDraftBar(null)}
              className="text-[11px] uppercase tracking-wider font-sans text-muted-foreground border border-border px-3 py-1 hover:bg-[#141414] transition-colors">
              Ignora
            </button>
          </div>
        </div>
      )}

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
            <p className="text-[12px] font-sans text-primary">Errore upload: {uploadError.message}</p>
          )}
          {photoUrl && (
            <div className="relative border border-border w-fit">
              <img src={photoUrl} alt="Anteprima foto" className="max-h-[200px] object-contain" />
              <button type="button" onClick={() => setFormData({ ...formData, foto: "" })}
                className="absolute top-2 right-2 bg-background/90 text-[11px] uppercase tracking-wider px-2 py-1 border border-border hover:text-primary transition-colors">
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Sintesi per Card IG</label>
          <span className={`text-[11px] font-sans tabular-nums ${(formData.sintesi?.length ?? 0) > 160 ? "text-primary" : "text-muted-foreground"}`}>
            {formData.sintesi?.length ?? 0}/180
          </span>
        </div>
        <textarea
          rows={2}
          maxLength={180}
          value={formData.sintesi ?? ""}
          onChange={(e) => setFormData({ ...formData, sintesi: e.target.value.slice(0, 180) })}
          placeholder="Frase breve per la grafica Instagram. Se vuota, viene usato l'inizio del testo del diario."
          className="bg-[#141414] border border-border p-3 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-y font-sans leading-relaxed"
        />
      </div>

      {submitError && (
        <p className="text-[13px] font-sans text-primary border border-primary/40 bg-primary/10 px-4 py-3">{submitError}</p>
      )}

      <button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground font-serif text-[18px] py-4 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50 mt-4">
        {isPending ? "Salvataggio..." : "Salva Giorno"}
      </button>
    </form>
  );
}

// ─── Tab: Diario ──────────────────────────────────────────────────────────────

function DiarioTab({ scrollToEntry }: { scrollToEntry?: number }) {
  const queryClient = useQueryClient();
  const { data: entries } = useListEntries({ query: { queryKey: getListEntriesQueryKey() } });
  const deleteMutation = useDeleteEntry();
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  // Support opening a specific entry from OggiTab
  useEffect(() => {
    if (!scrollToEntry || !entries) return;
    const target = entries.find((e) => e.numero === scrollToEntry);
    if (target) startEditing(target);
  }, [scrollToEntry, entries]);

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

  // Client-side search filter
  const filteredEntries = entries?.filter((e) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return String(e.numero).includes(q) || (e.testo ?? "").toLowerCase().includes(q);
  }) ?? [];

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-[28px] font-serif tracking-wider">DIARIO REGISTRATO</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per numero o testo..."
            className="sm:w-72 bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
        </div>
        {filteredEntries.map((entry) => (
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
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${entry.numero}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors"
              >
                Card
              </a>
              <button onClick={() => startEditing(entry)} className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors">Modifica</button>
              <button onClick={() => handleDelete(entry.numero)} disabled={deleteMutation.isPending} className="text-[13px] uppercase tracking-wider font-sans text-destructive hover:text-destructive/80 transition-colors">Elimina</button>
            </div>
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <p className="text-muted-foreground font-sans text-[15px]">
            {search.trim() ? "Nessun risultato per la ricerca." : "Nessun giorno registrato."}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Oggi ────────────────────────────────────────────────────────────────

interface DashboardData {
  todayDate: string;
  todayEntry: { numero: number; testo: string | null; foto: string | null } | null;
  currentDay: number;
  totalEntries: number;
  missingTesto: number;
  missingFoto: number;
  missingPhysical: number;
  totalSubscribers: number;
  totalContacts: number;
}

function OggiTab({ onSwitchTab }: { onSwitchTab: (tab: string, scrollToEntry?: number) => void }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDashboard(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground font-sans animate-pulse">Caricamento...</div>;
  }

  if (!dashboard) {
    return <div className="py-20 text-center text-primary font-sans">Errore nel caricamento del dashboard.</div>;
  }

  const todayLabel = new Date(dashboard.todayDate + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  return (
    <div className="space-y-10">
      {/* Today's status */}
      <div className="bg-card border border-border p-8 flex flex-col gap-6">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1">OGGI · {todayLabel}</div>
          <h2 className="text-[28px] font-serif tracking-wider">STATO DEL GIORNO</h2>
        </div>

        {dashboard.todayEntry ? (
          dashboard.todayEntry.testo ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-sans text-muted-foreground">Giorno {dashboard.todayEntry.numero} completato.</span>
              <button onClick={() => onSwitchTab("diario", dashboard.todayEntry!.numero)}
                className="text-[11px] uppercase tracking-wider font-sans border border-border px-4 py-1.5 hover:bg-[#141414] hover:text-foreground transition-colors text-muted-foreground">
                Apri
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSwitchTab("diario", dashboard.todayEntry!.numero)}
              className="self-start bg-primary text-primary-foreground font-serif text-[18px] py-3 px-8 tracking-wider hover:bg-primary/90 transition-colors uppercase"
            >
              COMPLETA IL GIORNO {dashboard.todayEntry.numero}
            </button>
          )
        ) : (
          <button
            onClick={() => onSwitchTab("diario")}
            className="self-start bg-primary text-primary-foreground font-serif text-[18px] py-3 px-8 tracking-wider hover:bg-primary/90 transition-colors uppercase"
          >
            CREA IL GIORNO DI OGGI
          </button>
        )}
      </div>

      {/* Cosa manca */}
      <div className="bg-card border border-border p-8 flex flex-col gap-4">
        <h2 className="text-[22px] font-serif tracking-wider mb-2">COSA MANCA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Senza testo", count: dashboard.missingTesto, filter: "testo" },
            { label: "Senza foto", count: dashboard.missingFoto, filter: "foto" },
            { label: "Senza peso/battito", count: dashboard.missingPhysical, filter: "physical" },
          ].map(({ label, count }) => (
            <button key={label} onClick={() => onSwitchTab("diario")}
              className="border border-border p-5 text-left hover:border-iron transition-colors group">
              <div className="font-serif text-[48px] leading-none text-primary bebas measured">{count}</div>
              <div className="text-[11px] font-sans uppercase tracking-[0.15em] text-muted-foreground mt-2">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="bg-card border border-border p-8">
        <h2 className="text-[22px] font-serif tracking-wider mb-6">STATISTICHE</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "GIORNO CORRENTE", value: dashboard.currentDay },
            { label: "GIORNI LOGGATI", value: dashboard.totalEntries },
            { label: "ISCRITTI", value: dashboard.totalSubscribers },
            { label: "CONTATTI", value: dashboard.totalContacts },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="font-serif text-[48px] leading-none text-foreground bebas measured">{value}</div>
              <div className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="bg-card border border-border p-8 flex flex-col gap-4">
        <div>
          <h2 className="text-[22px] font-serif tracking-wider">BACKUP DATI</h2>
          <p className="text-[13px] font-sans text-muted-foreground mt-1">Esporta tutti i dati in un singolo file JSON.</p>
        </div>
        <button onClick={downloadBackup}
          className="self-start border border-primary text-primary font-serif text-[15px] px-6 py-2.5 tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors uppercase">
          SCARICA BACKUP
        </button>
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

type Tab = "oggi" | "diario" | "sito" | "pagine" | "bulk" | "social" | "sponsor" | "articoli" | "coaching" | "contatti" | "iscritti" | "analytics" | "planner";

const TABS: { id: Tab; label: string }[] = [
  { id: "oggi", label: "Oggi" },
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
  { id: "analytics", label: "Analytics" },
  { id: "planner", label: "Planner" },
];

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: adminData, isLoading: adminLoading } = useAdminMe({ query: { queryKey: getAdminMeQueryKey(), retry: false } });
  const logoutMutation = useAdminLogout();
  const [activeTab, setActiveTab] = useState<Tab>("oggi");
  const [diarioScrollTo, setDiarioScrollTo] = useState<number | undefined>(undefined);
  // Read ?editArticle=slug from URL to jump straight into editing
  const searchParams = new URLSearchParams(window.location.search);
  const editArticleSlug = searchParams.get("editArticle") ?? undefined;
  const [pendingEditSlug, setPendingEditSlug] = useState<string | undefined>(editArticleSlug);

  useEffect(() => {
    if (!editArticleSlug) return;
    setActiveTab("articoli");
    // Clean the query param from the URL without a page reload
    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
  }, []);

  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center font-serif text-2xl animate-pulse text-muted-foreground pt-16">Caricamento...</div>;
  }

  if (!adminData?.authenticated) return <AdminLoginForm />;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() }),
    });
  };

  const handleSwitchTab = (tab: string, scrollToEntry?: number) => {
    setDiarioScrollTo(scrollToEntry);
    setActiveTab(tab as Tab);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-border pb-6">
        <h1 className="text-[32px] font-serif tracking-wider">ADMIN · PROGETTO J</h1>
        <div className="flex items-center gap-4">
          <button onClick={downloadBackup}
            className="text-[12px] font-sans uppercase tracking-[0.15em] border border-border px-4 py-1.5 text-muted-foreground hover:text-foreground hover:bg-[#141414] transition-colors">
            BACKUP
          </button>
          <button onClick={handleLogout} className="text-[13px] font-sans text-primary uppercase tracking-[0.15em] hover:text-primary/80 transition-colors">
            Esci
          </button>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-0 mb-12 border-b border-border overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-5 py-3 font-serif text-[14px] tracking-[0.1em] uppercase border-b-2 transition-colors ${
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
      {activeTab === "oggi" && <OggiTab onSwitchTab={handleSwitchTab} />}
      {activeTab === "diario" && <DiarioTab scrollToEntry={diarioScrollTo} />}
      {activeTab === "sito" && <SitoTab />}
      {activeTab === "pagine" && <PagineTab />}
      {activeTab === "articoli" && (
        <ArticoliTab
          startEditSlug={pendingEditSlug}
          onEditStarted={() => setPendingEditSlug(undefined)}
        />
      )}
      {activeTab === "social" && <SocialTab />}
      {activeTab === "sponsor" && <SponsorTab />}
      {activeTab === "coaching" && <CoachingTab />}
      {activeTab === "contatti" && <ContattiTab />}
      {activeTab === "iscritti" && <IscrittiTab />}
      {activeTab === "bulk" && <BulkEditTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
      {activeTab === "planner" && <PlannerTab />}
    </div>
  );
}
