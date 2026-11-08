import { lazy, Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAdminMe, useAdminLogin, useAdminLogout,
  useListEntries, useListEntrySummaries, useGetEntry, useCreateEntry, useUpdateEntry, useDeleteEntry,
  useListPages, useCreatePage, useUpdatePage, useDeletePage,
  useGetEntriesBulkText, useImportEntriesBulkText,
  getAdminMeQueryKey, getListEntriesQueryKey, getListEntrySummariesQueryKey, getGetLatestEntriesQueryKey, getGetEntryQueryKey,
  getListPagesQueryKey, getGetEntryQueryOptions,
} from "@workspace/api-client-react";
import { ObiettiviEditor } from "@/components/admin/ObiettiviEditor";
import { TappaManager } from "@/components/admin/TappaManager";
import { DailyTrackingPanel, type TrackingKey } from "@/components/admin/DailyTrackingPanel";
import { DiaryHtmlEditor } from "@/components/admin/DiaryHtmlEditor";
import { AdminRetry, AdminStatus } from "@/components/admin/AdminStatus";
import type { Entry, EntryInput, PageItem } from "@workspace/api-client-react";
import { useUpload, getPhotoUrl } from "@workspace/object-storage-web";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { assertEntrySaved, buildEntryPayload } from "@/lib/entry-save";
import { cardSeasonQuery, type Fase } from "@/lib/seasons";

const AnalyticsTab = lazy(() =>
  import("@/components/admin/AnalyticsTab").then((module) => ({ default: module.AnalyticsTab })),
);
const SocialTab = lazy(() => import("@/components/admin/SocialTab").then((m) => ({ default: m.SocialTab })));
const SponsorTab = lazy(() => import("@/components/admin/SponsorTab").then((m) => ({ default: m.SponsorTab })));
const ArticoliTab = lazy(() => import("@/components/admin/ArticoliTab").then((m) => ({ default: m.ArticoliTab })));
const CoachingTab = lazy(() => import("@/components/admin/CoachingTab").then((m) => ({ default: m.CoachingTab })));
const SitoTab = lazy(() => import("@/components/admin/SitoTab").then((m) => ({ default: m.SitoTab })));
const ContattiTab = lazy(() => import("@/components/admin/ContattiTab").then((m) => ({ default: m.ContattiTab })));
const CandidatureTab = lazy(() => import("@/components/admin/CandidatureTab").then((m) => ({ default: m.CandidatureTab })));
const IscrittiTab = lazy(() => import("@/components/admin/IscrittiTab").then((m) => ({ default: m.IscrittiTab })));
const PlannerTab = lazy(() => import("@/components/admin/PlannerTab").then((m) => ({ default: m.PlannerTab })));
// Keep card jobs ordered even when the diary tab is temporarily unmounted.
const dailyCardJobs = new Map<string, Promise<void>>();

// ─── Client-side range validation ─────────────────────────────────────────────

const CLIENT_RANGES: Record<string, [number, number, string]> = {
  peso:       [30,  200,    "30–200 kg"],
  battito:    [30,  220,    "30–220 bpm"],
  sonno:      [0,   24,     "0–24 h"],
  kcal:       [0,   15000,  "0–15 000"],
  pasti:      [1,   6,      "1–6"],
  acqua:      [0,   20,     "0–20 litri"],
  acquaAllenamento: [0, 10, "0–10 litri"],
  durata:     [0,   1440,   "0–1440"],
  intensita:  [1,   5,      "1–5"],
  plank:      [0,   3600,   "0–3600 secondi"],
  energia:    [1,   5,      "1–5"],
  km:         [0,   100,    "0–100"],
  flessioni:  [0,   2000,   "0–2000"],
  addominali: [0,   2000,   "0–2000"],
  squat:      [0,   2000,   "0–2000"],
  stretchingMin: [0, 240,  "0–240 minuti"],
  round:      [0,   2000,   "0–2000"],
  entrate:    [0,   100000, "0–100 000 €"],
  uscite:     [0,   100000, "0–100 000 €"],
};
const CLIENT_INTEGER_FIELDS = new Set(["squat", "stretchingMin"]);

const ENTRY_REVIEW_LABELS: Record<string, string> = {
  numero: "Numero giorno", data: "Data", testo: "Testo", foto: "Foto", sintesi: "Sintesi card",
  peso: "Peso", battito: "Battito", sonno: "Sonno", flessioni: "Flessioni", addominali: "Addominali",
  squat: "Squat", stretchingMin: "Stretching (min)", stato1pct: "Stato 1%", fronteSettimana: "Fronte della settimana", nota1pct: "Nota 1%",
  round: "Round", km: "Km", entrate: "Entrate", uscite: "Uscite", attrito: "Attrito",
  fatto: "Fatto", nonFatto: "Non fatto", kcal: "Kcal", pasti: "Pasti", alcol: "Alcol",
  acqua: "Acqua", acquaAllenamento: "Acqua allenamento", tipoAllenamento: "Tipo allenamento",
  durata: "Durata", intensita: "Intensità", tipoGiorno: "Tipo giorno", routineCompletata: "Routine completata",
  routineForza: "Routine forza", routineFlessioni: "Routine flessioni", routineTrazioni: "Routine trazioni",
  routineSquat: "Routine squat", plank: "Plank", collo: "Collo", mobilita: "Mobilità",
  sollevamentoGamba: "Sollevamento gamba", grapplingVuoto: "Grappling vuoto", energia: "Energia",
  noteAllenamento: "Note allenamento", roundSparring: "Round sparring", roundPao: "Round pao",
  roundTecnica: "Round tecnica", oraSveglia: "Ora sveglia", oreLavoro: "Ore lavoro",
  risparmio: "Risparmio", entrateOnline: "Entrate online", videoPubblicati: "Video pubblicati",
  articoliPubblicati: "Articoli pubblicati", follower: "Follower", pagineLette: "Pagine lette",
  minutiScrittura: "Minuti scrittura", cardTitolo: "Titolo card", cardSottotitolo: "Sottotitolo card",
  cardImmagine: "Immagine card", cardOverlay: "Overlay card", cardMostraParole: "Parole card",
  cardFeed: "Card feed", cardStory: "Card story",
};

function reviewValue(value: unknown): unknown {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  return value;
}

const adminSeasonParams = (fase: Fase) => ({ fase });
const adminSeasonQuery = (fase: Fase) => `?fase=${fase}`;

function entryReviewChanges(payload: EntryInput, initial: Entry) {
  const changes = Object.entries(payload).filter(([key, value]) =>
    key !== "fase" && reviewValue(value) !== reviewValue(initial[key as keyof Entry])
  );
  return {
    overwritten: changes.filter(([, value]) => reviewValue(value) !== null).map(([key]) => ENTRY_REVIEW_LABELS[key] ?? key),
    cleared: changes.filter(([, value]) => reviewValue(value) === null).map(([key]) => ENTRY_REVIEW_LABELS[key] ?? key),
  };
}

function validateEntry(data: Partial<Record<string, unknown>>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, [min, max, label]] of Object.entries(CLIENT_RANGES)) {
    const val = data[field];
    if (val == null || val === "") continue;
    const num = Number(val);
    if (CLIENT_INTEGER_FIELDS.has(field) && !Number.isInteger(num)) {
      errors[field] = "Inserisci un numero intero";
      continue;
    }
    if (!Number.isNaN(num) && (num < min || num > max)) {
      errors[field] = `Intervallo consentito: ${label}`;
    }
  }
  return errors;
}

// ─── Backup download helper ────────────────────────────────────────────────────

type BackupResult = {
  filename: string;
  summary: Record<string, number>;
};

async function downloadBackup(): Promise<BackupResult> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/admin/backup`, { credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `HTTP ${response.status}`);
  }

  const text = await response.text();
  let payload: { summary?: Record<string, number> };
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Il file ricevuto non è un JSON valido.");
  }
  const filenameHeader = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1];
  const filename = filenameHeader ?? `progetto-j-backup-${new Date().toISOString().split("T")[0]}.json`;
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { filename, summary: payload.summary ?? {} };
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
    <main className="admin-login-shell min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="admin-login-card bracket-corners bg-card border border-border p-8 sm:p-10 w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <span className="admin-eyebrow">AREA PRIVATA</span>
          <h1 className="mt-4 text-[72px] font-serif text-primary text-center leading-none bebas">J</h1>
          <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Console Progetto J</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            autoComplete="username"
            value="admin"
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            aria-label="Password admin"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary transition-colors font-sans"
            required
          />
          {error && <p className="admin-form-error text-primary font-sans text-sm" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-serif text-[18px] py-3 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50 mt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {loginMutation.isPending ? "Accesso..." : "Entra"}
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Entry Form ───────────────────────────────────────────────────────────────

function EntryForm({ initialData, defaultNumero = 1, defaultFase = 2, allowArchiveOverride = false, onFaseChange, onSuccess, onCancel }: { initialData?: Entry; defaultNumero?: number; defaultFase?: Fase; allowArchiveOverride?: boolean; onFaseChange: (fase: Fase) => void; onSuccess: (entry: Entry) => void; onCancel?: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();
  const { uploadFile, isUploading, progress, error: uploadError } = useUpload({
    onSuccess: (res) => setFormData((d) => ({ ...d, foto: res.objectPath })),
  });
  const {
    uploadFile: uploadClipFile,
    isUploading: isClipUploading,
    progress: clipProgress,
    error: clipUploadError,
  } = useUpload();

  const [formData, setFormData] = useState<Partial<EntryInput>>({
    numero: initialData?.numero ?? defaultNumero,
    data: initialData?.data || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date()),
    kcal: initialData?.kcal ?? undefined,
    pasti: initialData?.pasti ?? undefined,
    alcol: initialData?.alcol ?? undefined,
    acqua: initialData?.acqua ?? undefined,
    acquaAllenamento: initialData?.acquaAllenamento ?? undefined,
    tipoAllenamento: initialData?.tipoAllenamento ?? undefined,
    durata: initialData?.durata ?? undefined,
    intensita: initialData?.intensita ?? undefined,
    tipoGiorno: initialData?.tipoGiorno ?? undefined,
    routineCompletata: initialData?.routineCompletata ?? undefined,
    routineFlessioni: initialData?.routineFlessioni ?? "",
    routineTrazioni: initialData?.routineTrazioni ?? "",
    routineSquat: initialData?.routineSquat ?? "",
    plank: initialData?.plank ?? undefined,
    collo: initialData?.collo ?? undefined,
    mobilita: initialData?.mobilita ?? undefined,
    sollevamentoGamba: initialData?.sollevamentoGamba ?? undefined,
    grapplingVuoto: initialData?.grapplingVuoto ?? undefined,
    energia: initialData?.energia ?? undefined,
    noteAllenamento: initialData?.noteAllenamento ?? "",
    sonno: initialData?.sonno ?? undefined,
    flessioni: initialData?.flessioni ?? undefined,
    addominali: initialData?.addominali ?? undefined,
    squat: initialData?.squat ?? undefined,
    stretchingMin: initialData?.stretchingMin ?? undefined,
    stato1pct: initialData?.stato1pct ?? undefined,
    fronteSettimana: initialData?.fronteSettimana ?? undefined,
    nota1pct: initialData?.nota1pct ?? "",
    round: initialData?.round ?? undefined,
    km: initialData?.km ?? undefined,
    peso: initialData?.peso ?? undefined,
    battito: initialData?.battito ?? undefined,
    entrate: initialData?.entrate ?? undefined,
    uscite: initialData?.uscite ?? undefined,
    testo: initialData?.testo || "",
    foto: initialData?.foto || "",
    sintesi: initialData?.sintesi || "",
    attrito: initialData?.attrito || "",
    fatto: initialData?.fatto || "",
    nonFatto: initialData?.nonFatto || "",
    ...initialData,
    fase: initialData?.fase ?? defaultFase,
  });
  useEffect(() => {
    if (!initialData) setFormData((current) => ({ ...current, fase: defaultFase, numero: defaultNumero }));
  }, [defaultFase, defaultNumero, initialData]);

  // ─── Autosave + draft restore ──────────────────────────────────────────────
  const [draftBar, setDraftBar] = useState<{ time: string; data: Partial<EntryInput> } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reviewPending, setReviewPending] = useState<{ overwritten: string[]; cleared: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [copyYesterdayPending, setCopyYesterdayPending] = useState(false);
  const draftRequest = useRef<Promise<unknown> | null>(null);
  const [touchedTracking, setTouchedTracking] = useState<Set<TrackingKey>>(new Set());
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);
  const baseline = useRef<string | null>(null);
  const serializedForm = JSON.stringify(formData);
  if (baseline.current === null) baseline.current = serializedForm;
  const dirtyRef = useRef(false);
  dirtyRef.current = baseline.current !== serializedForm;

  useEffect(() => {
    const leave = (event: Event) => {
      if (savingRef.current || (dirtyRef.current && !window.confirm("Ci sono dati non salvati. Uscire senza salvarli?"))) event.preventDefault();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current && !savingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("admin-before-navigate", leave);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("admin-before-navigate", leave);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);

  const markTouched = useCallback((key: TrackingKey) => {
    setTouchedTracking((current) => new Set(current).add(key));
  }, []);

  const markManyTouched = useCallback((keys: TrackingKey[]) => {
    setTouchedTracking((current) => {
      const next = new Set(current);
      keys.forEach((key) => next.add(key));
      return next;
    });
  }, []);

  const copyYesterday = useCallback(async () => {
    const previousNumero = Number(formData.numero) - 1;
    if (previousNumero < 1 || copyYesterdayPending) return;
    setCopyYesterdayPending(true);
    try {
    const previousEntry = await queryClient.fetchQuery(getGetEntryQueryOptions(previousNumero, adminSeasonParams((formData.fase ?? defaultFase) as Fase)));
    setFormData((current) => ({
      ...current,
      kcal: previousEntry.kcal ?? undefined,
      pasti: previousEntry.pasti ?? undefined,
      alcol: previousEntry.alcol ?? undefined,
      acqua: previousEntry.acqua ?? undefined,
      acquaAllenamento: previousEntry.acquaAllenamento ?? undefined,
      tipoAllenamento: previousEntry.tipoAllenamento ?? undefined,
      durata: previousEntry.durata ?? undefined,
      intensita: previousEntry.intensita ?? undefined,
      tipoGiorno: previousEntry.tipoGiorno ?? undefined,
      routineCompletata: previousEntry.routineCompletata ?? undefined,
      routineForza: previousEntry.routineForza ?? undefined,
      routineFlessioni: previousEntry.routineFlessioni ?? undefined,
      routineTrazioni: previousEntry.routineTrazioni ?? undefined,
      routineSquat: previousEntry.routineSquat ?? undefined,
      plank: previousEntry.plank ?? undefined,
      collo: previousEntry.collo ?? undefined,
      mobilita: previousEntry.mobilita ?? undefined,
      sollevamentoGamba: previousEntry.sollevamentoGamba ?? undefined,
      grapplingVuoto: previousEntry.grapplingVuoto ?? undefined,
      energia: previousEntry.energia ?? undefined,
      sonno: previousEntry.sonno ?? undefined,
      flessioni: previousEntry.flessioni ?? undefined,
      addominali: previousEntry.addominali ?? undefined,
      squat: previousEntry.squat ?? undefined,
      stretchingMin: previousEntry.stretchingMin ?? undefined,
      fronteSettimana: previousEntry.fronteSettimana ?? undefined,
      round: previousEntry.round ?? undefined,
      km: previousEntry.km ?? undefined,
      peso: previousEntry.peso ?? undefined,
      battito: previousEntry.battito ?? undefined,
      entrate: previousEntry.entrate ?? undefined,
      uscite: previousEntry.uscite ?? undefined,
      testo: previousEntry.testo ?? "",
      foto: previousEntry.foto ?? "",
      sintesi: previousEntry.sintesi ?? "",
    }));
    markManyTouched([
      "kcal", "pasti", "acqua", "acquaAllenamento", "alcol", "tipoAllenamento", "durata", "intensita",
      "routineCompletata", "routineForza", "routineFlessioni", "routineTrazioni",
      "routineSquat", "plank", "collo", "mobilita", "sollevamentoGamba",
      "grapplingVuoto", "energia", "flessioni",
    ]);
    } catch {
      setSubmitError("Impossibile caricare il giorno precedente. Nessun campo è stato modificato.");
    } finally {
      setCopyYesterdayPending(false);
    }
  }, [markManyTouched, formData.numero, formData.fase, defaultFase, copyYesterdayPending, queryClient]);

  // Load draft when editing an entry
  useEffect(() => {
    if (!initialData) { isMounted.current = true; return; }
    fetch(`${import.meta.env.BASE_URL}api/admin/drafts/${initialData.numero}${adminSeasonQuery((initialData.fase ?? defaultFase) as Fase)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((draft: { updatedAt: string; dati: Partial<EntryInput> } | null) => {
        if (!draft) return;
        const time = new Date(draft.updatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
        setDraftBar({ time, data: draft.dati });
      })
      .catch(() => {})
      .finally(() => { isMounted.current = true; });
  }, [initialData?.numero, initialData?.fase, defaultFase]);

  // Autosave to server (editing only), debounced 2 s
  useEffect(() => {
    if (!initialData || !isMounted.current || isSaving) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      draftRequest.current = fetch(`${import.meta.env.BASE_URL}api/admin/drafts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: initialData.numero, fase: initialData.fase ?? 1, formJson: formData }),
      }).catch(() => {});
    }, 2000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [formData, isSaving]);

  const deleteDraft = useCallback((numero: number) => {
    // A pending autosave must finish before deletion, or it can restore a stale draft.
    void Promise.resolve(draftRequest.current).finally(() =>
      fetch(`${import.meta.env.BASE_URL}api/admin/drafts/${numero}${adminSeasonQuery((initialData?.fase ?? formData.fase ?? defaultFase) as Fase)}`, { method: "DELETE", credentials: "include" }).catch(() => {})
    );
  }, [initialData?.fase, formData.fase, defaultFase]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const saveEntry = async () => {
    if (savingRef.current || isUploading || isClipUploading || isClipProcessing || copyYesterdayPending) return;
    setSubmitError(null);

    const errors = validateEntry(formData as Record<string, unknown>);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = buildEntryPayload(formData, initialData);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListEntrySummariesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetLatestEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    };

    const handleError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg.includes("401") ? "Sessione scaduta. Ricarica la pagina." : `Errore: ${msg}`);
    };

    savingRef.current = true;
    setIsSaving(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    try {
      const phaseParams = {
        fase: payload.fase,
        ...(payload.fase === 1 ? { overrideArchivio: allowArchiveOverride } : {}),
      };
      const savedEntry = initialData
        ? await updateMutation.mutateAsync({ numero: initialData.numero, params: phaseParams, data: payload })
        : await createMutation.mutateAsync({ params: phaseParams, data: payload });
      assertEntrySaved(payload, savedEntry);
      baseline.current = null;
      queryClient.setQueryData(getGetEntryQueryKey(savedEntry.numero, adminSeasonParams(savedEntry.fase ?? 1)), savedEntry);
      if (initialData && initialData.numero !== savedEntry.numero) {
        queryClient.removeQueries({ queryKey: getGetEntryQueryKey(initialData.numero, adminSeasonParams((initialData.fase ?? 1) as Fase)), exact: true });
      }
      invalidate();
      deleteDraft(initialData?.numero ?? savedEntry.numero);
      if (!initialData) {
          setFormData({
            numero: savedEntry.numero + 1,
            fase: savedEntry.fase ?? defaultFase,
            data: new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date()),
            kcal: undefined, pasti: undefined, alcol: undefined, acqua: undefined, acquaAllenamento: undefined,
            tipoAllenamento: undefined, durata: undefined, intensita: undefined,
            tipoGiorno: undefined, routineCompletata: undefined, routineForza: undefined, routineFlessioni: "",
            routineTrazioni: "", routineSquat: "", plank: undefined, collo: undefined,
            mobilita: undefined, sollevamentoGamba: undefined, grapplingVuoto: undefined,
            energia: undefined, noteAllenamento: "",
            sonno: undefined, flessioni: undefined, addominali: undefined, squat: undefined, stretchingMin: undefined,
            stato1pct: undefined, fronteSettimana: undefined, nota1pct: "",
            round: undefined, km: undefined, peso: undefined, battito: undefined,
            entrate: undefined, uscite: undefined,
            testo: "", foto: "", sintesi: "", attrito: "", fatto: "", nonFatto: "",
          });
          setTouchedTracking(new Set());
      }
      onSuccess(savedEntry);
    } catch (err) {
      handleError(err);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current || isUploading || isClipUploading || isClipProcessing || copyYesterdayPending) return;
    const errors = validateEntry(formData as Record<string, unknown>);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (initialData) {
      setReviewPending(entryReviewChanges(buildEntryPayload(formData, initialData), initialData));
      return;
    }
    void saveEntry();
  };

  const photoUrl = getPhotoUrl(formData.foto);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };
  const [clipValidationError, setClipValidationError] = useState<string | null>(null);
  const [isClipProcessing, setIsClipProcessing] = useState(false);
  const handleClipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type)) {
      setClipValidationError("Sono consentite solo immagini JPG, PNG o WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setClipValidationError("Immagine troppo grande, massimo 8 MB");
      return;
    }

    setClipValidationError(null);
    const uploaded = await uploadClipFile(file);
    if (!uploaded) return;

    setIsClipProcessing(true);
    try {
      const resizeResponse = await fetch(`${import.meta.env.BASE_URL}api/storage/uploads/resize`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectPath: uploaded.objectPath,
        }),
      });
      if (!resizeResponse.ok) {
        const body = await resizeResponse.json().catch(() => null) as { error?: string } | null;
        setClipValidationError(body?.error ?? "Impossibile ridimensionare l’immagine.");
        return;
      }
      setFormData((current) => ({ ...current, foto: uploaded.objectPath }));
    } finally {
      setIsClipProcessing(false);
    }
  };

  const isPending = isSaving || createMutation.isPending || updateMutation.isPending || isUploading || isClipUploading || isClipProcessing || copyYesterdayPending;
  const clipNumero = Number(formData.numero);
  const canOpenClip = Number.isInteger(clipNumero) && clipNumero >= 1 && clipNumero <= 180;

  const field = (label: string, key: keyof EntryInput, step?: string) => {
    const err = validationErrors[key as string];
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
        <input
          aria-label={label}
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

  const textField = (label: string, key: "routineFlessioni" | "routineTrazioni" | "routineSquat", placeholder?: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={(formData[key] as string | undefined) ?? ""}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        className="bg-[#141414] border border-border p-2.5 text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
      />
    </div>
  );

  const checkField = (label: string, key: "alcol" | "routineCompletata" | "collo" | "mobilita" | "grapplingVuoto") => (
    <label className="flex items-center gap-3 min-h-[42px] cursor-pointer text-[11px] uppercase tracking-widest text-muted-foreground">
      <input
        type="checkbox"
        checked={Boolean(formData[key])}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
        className="h-4 w-4 accent-[hsl(var(--primary))]"
      />
      {label}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} data-testid="diary-entry-form" className="bg-card border border-border p-6 md:p-8">
      <fieldset disabled={isSaving || Boolean(reviewPending)} className="flex min-w-0 flex-col gap-6">
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

      {formData.fase !== 2 && <TappaManager numeroGiorno={Number(formData.numero)} dataGiorno={formData.data} />}

      <DailyTrackingPanel
        formData={formData}
        setFormData={setFormData}
        initialData={initialData}
        markTouched={markTouched}
        markManyTouched={markManyTouched}
        onCopyYesterday={copyYesterday}
        isCopyingYesterday={copyYesterdayPending}
      />

      <div className="sticky bottom-0 z-20 -mx-6 border-y border-[#333] bg-[#0A0A0A]/95 px-6 py-3 backdrop-blur md:-mx-8 md:px-8">
        {submitError && (
          <p role="alert" data-testid="diary-save-error" className="mb-3 text-[13px] font-sans text-primary border border-primary/40 bg-primary/10 px-4 py-3">{submitError}</p>
        )}
        <button type="submit" data-testid="save-diary-entry" disabled={isPending} className="w-full bg-[#B81D1D] text-white font-serif text-[18px] py-4 tracking-wider hover:bg-[#9A1515] transition-colors uppercase disabled:opacity-50">
          {isPending ? "Attendi..." : initialData ? "Rivedi modifiche" : "Salva Giorno"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="entry-fase" className="text-[13px] uppercase tracking-widest text-muted-foreground">Fase</label>
          <select id="entry-fase" value={formData.fase ?? defaultFase} disabled={Boolean(initialData)} onChange={(e) => onFaseChange(Number(e.target.value) as Fase)} className="bg-[#141414] border border-border p-2.5 text-[13px] text-white">
            <option value={1}>Fase 1</option><option value={2}>Fase 2</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Numero *</label>
          <input aria-label="Numero giorno" type="number" required value={formData.numero ?? ""} disabled={Boolean(initialData)} onChange={(e) => setFormData({ ...formData, numero: Number(e.target.value) })} className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums disabled:opacity-50" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Data *</label>
          <input aria-label="Data giorno" type="date" required value={formData.data ?? ""} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary tabular-nums" />
        </div>
        {field("Sonno (h)", "sonno", "0.5")}
        {field("Flessioni", "flessioni")}
        {field("Addominali", "addominali")}
        {field("Squat", "squat", "1")}
        {field("Stretching (min)", "stretchingMin", "1")}
        {field("Round", "round")}
        {field("Km", "km", "0.1")}
        {field("Peso (kg)", "peso", "0.1")}
        {field("Battito (bpm)", "battito")}
        {field("Entrate (€)", "entrate", "0.01")}
        {field("Uscite (€)", "uscite", "0.01")}
      </div>

      {formData.fase === 2 && (
        <section aria-label="Dati Fase 2" className="border-t border-border pt-6">
          <h3 className="font-serif text-[26px]">FASE 2</h3>
          <p className="my-3 text-[13px] text-muted-foreground">Risparmio ed entrate online restano separati da uscite ed entrate. Registra i follower una volta a settimana.</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 [&_label]:text-[13px]">
            {field("Round sparring", "roundSparring")}
            {field("Round pao", "roundPao")}
            {field("Round tecnica", "roundTecnica")}
            <label className="flex flex-col gap-2 text-[13px]">Ora sveglia
              <input aria-label="Ora sveglia" type="time" value={formData.oraSveglia?.slice(0, 5) ?? ""} onChange={(e) => setFormData({ ...formData, oraSveglia: e.target.value || null })} className="bg-[#141414] border border-border p-2.5 text-white" />
            </label>
            {field("Ore lavoro", "oreLavoro", "0.25")}
            {field("Risparmio (€)", "risparmio", "0.01")}
            {field("Entrate online (€)", "entrateOnline", "0.01")}
            {field("Video pubblicati", "videoPubblicati")}
            {field("Articoli pubblicati", "articoliPubblicati")}
            {field("Follower", "follower")}
            {field("Pagine lette", "pagineLette")}
            {field("Minuti scrittura", "minutiScrittura")}
            <label className="flex flex-col gap-2 text-[13px]">Alcol
              <button type="button" role="switch" aria-label="Alcol" aria-checked={formData.alcol === true} onClick={() => { setFormData({ ...formData, alcol: formData.alcol !== true }); markTouched("alcol"); }} className="border border-border bg-[#141414] p-2.5 text-[13px]">{formData.alcol === true ? "Sì" : "No"}</button>
            </label>
          </div>
        </section>
      )}

      {formData.fase === 2 && (
        <section aria-label="Blocco 1%" className="border-t border-border pt-5">
          <h3 className="font-serif text-[22px]">1%</h3>
          <p className="mb-4 mt-2 text-[12px] text-muted-foreground">
            Registra lo stato del giorno e il fronte della settimana. Il fronte viene riportato quando usi “Copia dati di ieri”.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Stato
              <select
                aria-label="Stato 1%"
                value={formData.stato1pct ?? ""}
                onChange={(event) => setFormData({ ...formData, stato1pct: (event.target.value || undefined) as EntryInput["stato1pct"] })}
                className="border border-border bg-[#141414] p-2.5 text-white"
              >
                <option value="">Non impostato</option>
                <option value="spinto">Spinto</option>
                <option value="mantenuto">Mantenuto</option>
                <option value="crollato">Crollato</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Fronte della settimana
              <select
                aria-label="Fronte della settimana"
                value={formData.fronteSettimana ?? ""}
                onChange={(event) => setFormData({ ...formData, fronteSettimana: (event.target.value || undefined) as EntryInput["fronteSettimana"] })}
                className="border border-border bg-[#141414] p-2.5 text-white"
              >
                <option value="">Non impostato</option>
                <option value="corpo">Corpo</option>
                <option value="scrittura">Scrittura</option>
                <option value="soldi">Soldi</option>
                <option value="social">Social</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-[11px] uppercase tracking-widest text-muted-foreground md:col-span-2">
              Nota 1% <span className="font-sans normal-case tracking-normal">{formData.nota1pct?.length ?? 0}/200</span>
              <textarea
                aria-label="Nota 1%"
                rows={2}
                maxLength={200}
                value={formData.nota1pct ?? ""}
                onChange={(event) => setFormData({ ...formData, nota1pct: event.target.value.slice(0, 200) })}
                className="resize-y border border-border bg-[#141414] p-3 font-sans text-sm leading-relaxed text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
              />
            </label>
          </div>
        </section>
      )}

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
        <DiaryHtmlEditor value={formData.testo ?? ""} onChange={(testo) => setFormData((current) => ({ ...current, testo }))} />
      </div>

      <section className="grid grid-cols-1 gap-4 border-y border-border py-6 md:grid-cols-3">
        {([
          ["Attrito", "attrito", "L'ostacolo concreto della giornata."],
          ["Fatto", "fatto", "Ciò che hai portato a termine."],
          ["Non fatto", "nonFatto", "Ciò che hai scelto di non fare."],
        ] as const).map(([label, key, placeholder]) => (
          <label key={key} className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
              {label}<span className={(formData[key]?.length ?? 0) > 280 ? "text-primary" : ""}>{formData[key]?.length ?? 0}/280</span>
            </span>
            <textarea
              rows={4}
              maxLength={280}
              value={formData[key] ?? ""}
              onChange={(event) => setFormData((current) => ({ ...current, [key]: event.target.value.slice(0, 280) }))}
              placeholder={placeholder}
              className="resize-y border border-border bg-[#141414] p-3 font-sans text-sm leading-relaxed text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            />
          </label>
        ))}
      </section>

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

      <section className="flex flex-col gap-5 border-y border-border py-6">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Clip</span>
          <p className="mt-2 max-w-2xl font-sans text-[12px] leading-relaxed text-muted-foreground">
            La CLIP riutilizza la foto del giorno, la mostra in 4:5 e la ridimensiona sul server a massimo 1600px.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="clip-photo-upload">
              Upload foto del giorno
            </label>
            <input
              id="clip-photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleClipFileChange}
              disabled={isClipUploading || isClipProcessing}
              className="max-w-full bg-[#141414] border border-border p-2.5 text-white focus:outline-none focus:border-primary file:mr-4 file:bg-primary file:text-primary-foreground file:border-0 file:px-3 file:py-1 file:uppercase file:text-[11px] file:tracking-wider"
            />
            {isClipUploading && (
              <div className="h-1 w-full bg-[#262626]">
                <div className="h-full bg-primary transition-all" style={{ width: `${clipProgress}%` }} />
              </div>
            )}
            {isClipProcessing && (
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground" role="status">
                Ottimizzazione immagine...
              </p>
            )}
            {(clipValidationError || clipUploadError) && (
              <p className="text-[12px] font-sans text-primary" role="alert">
                {clipValidationError ?? clipUploadError?.message}
              </p>
            )}
            {photoUrl && (
              <div className="relative h-52 w-40 overflow-hidden border border-border">
                <img src={photoUrl} alt="Anteprima foto CLIP" className="h-full w-full object-cover grayscale" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, foto: "" })}
                  className="absolute bottom-2 left-2 bg-background/90 px-2 py-1 text-[11px] uppercase tracking-wider border border-border hover:text-primary transition-colors"
                >
                  Rimuovi foto
                </button>
              </div>
            )}
          </div>
          <div className="flex max-w-sm flex-col gap-3">
            <a
              href={canOpenClip ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}/clip/${clipNumero}` : undefined}
              target={canOpenClip ? "_blank" : undefined}
              rel={canOpenClip ? "noopener noreferrer" : undefined}
              aria-disabled={!canOpenClip}
              onClick={(event) => {
                if (!canOpenClip) event.preventDefault();
              }}
              className={`inline-flex min-h-10 items-center justify-center border px-4 py-2 text-[11px] font-mono uppercase tracking-widest transition-colors ${canOpenClip ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground" : "cursor-not-allowed border-border text-muted-foreground/50"}`}
            >
              Apri clip
            </a>
            <p className="font-mono text-[12px] leading-relaxed text-[#6E6A66]">
              Per registrare senza barre: Safari → Condividi → Aggiungi alla schermata Home, poi apri da lì.
            </p>
          </div>
        </div>
      </section>

      </fieldset>
      {reviewPending && initialData && (
        <div role="alertdialog" aria-modal="true" aria-label="Conferma modifiche al giorno" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <section className="max-h-[85vh] w-full max-w-xl overflow-y-auto border border-border bg-card p-6">
            <h3 className="font-serif text-xl uppercase tracking-wider">Conferma modifica</h3>
            <p className="mt-3 font-sans text-sm text-muted-foreground">
              Fase {initialData.fase ?? defaultFase} · Giorno {initialData.numero} · {initialData.data}
            </p>
            <p className="mt-4 font-sans text-sm">Questi dati verranno sovrascritti o cancellati:</p>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Sovrascritti: {reviewPending.overwritten.length ? reviewPending.overwritten.join(", ") : "nessuno"}
            </p>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Svuotati: {reviewPending.cleared.length ? reviewPending.cleared.join(", ") : "nessuno"}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setReviewPending(null)} className="border border-border px-4 py-3 font-sans text-sm uppercase tracking-wider">
                Torna al modulo
              </button>
              <button type="button" disabled={isPending} onClick={() => { setReviewPending(null); void saveEntry(); }} className="bg-primary px-4 py-3 font-sans text-sm uppercase tracking-wider text-primary-foreground disabled:opacity-50">
                {isPending ? "Salvataggio..." : "Conferma e salva"}
              </button>
            </div>
          </section>
        </div>
      )}
    </form>
  );
}

// ─── Tab: Diario ──────────────────────────────────────────────────────────────

type DiaryTarget = { numero: number; fase: Fase };

function DiarioTab({ scrollToEntry }: { scrollToEntry?: DiaryTarget }) {
  const queryClient = useQueryClient();
  const [selectedFase, setSelectedFase] = useState<Fase>(2);
  const [archiveOverride, setArchiveOverride] = useState(false);
  const { data: summaries, isLoading: listLoading, isError: listError, refetch: refetchList } = useListEntrySummaries(adminSeasonParams(selectedFase));
  const entries = summaries as Entry[] | undefined;
  const deleteMutation = useDeleteEntry();
  const [editingNumero, setEditingNumero] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const nextNumero = editingNumero ?? ((entries?.reduce((max, entry) => Math.max(max, entry.numero), 0) ?? 0) + 1);
  const { data: editingEntry, isLoading: editingLoading, isError: editingError, refetch: refetchEntry } = useGetEntry(editingNumero ?? 0, adminSeasonParams(selectedFase), {
    query: { queryKey: getGetEntryQueryKey(editingNumero ?? 0, adminSeasonParams(selectedFase)), enabled: editingNumero !== null, retry: false },
  });
  const [saveNotice, setSaveNotice] = useState<{ entry: Entry; cards: "pending" | "done" | "error" } | null>(null);

  const generateCards = (savedEntry: Entry) => {
    const identity = `${savedEntry.fase ?? 1}:${savedEntry.numero}`;
    const previous = dailyCardJobs.get(identity) ?? Promise.resolve();
    const job = previous.catch(() => {}).then(async () => {
      try {
        const { persistDailyCardImages } = await import("@/lib/daily-card-persistence");
        const paths = await persistDailyCardImages(savedEntry, [], archiveOverride);
        queryClient.setQueryData<Entry>(getGetEntryQueryKey(savedEntry.numero, adminSeasonParams((savedEntry.fase ?? 1) as Fase)), (current) =>
          current ? { ...current, ...paths } : current
        );
        void queryClient.invalidateQueries({ queryKey: getListEntrySummariesQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
        setSaveNotice((current) => current?.entry === savedEntry ? { ...current, cards: "done" } : current);
      } catch {
        setSaveNotice((current) => current?.entry === savedEntry ? { ...current, cards: "error" } : current);
      }
    });
    dailyCardJobs.set(identity, job);
    void job.finally(() => {
      if (dailyCardJobs.get(identity) === job) dailyCardJobs.delete(identity);
    });
  };

  const handleSaved = (entry: Entry) => {
    setEditingNumero(null);
    setSaveNotice({ entry, cards: entry.testo?.trim() ? "pending" : "done" });
    if (entry.testo?.trim()) setTimeout(() => generateCards(entry), 0);
  };

  // Support opening a specific entry from OggiTab
  useEffect(() => {
    if (!scrollToEntry) return;
    setSelectedFase(scrollToEntry.fase);
    setEditingNumero(scrollToEntry.numero);
  }, [scrollToEntry]);

  const startEditing = (numero: number) => {
    if (!window.dispatchEvent(new Event("admin-before-navigate", { cancelable: true }))) return;
    setEditingNumero(numero);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleDelete = (entry: Entry) => {
    setPendingDelete(entry);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate({
      numero: pendingDelete.numero,
      params: {
        fase: selectedFase,
        ...(selectedFase === 1 ? { overrideArchivio: archiveOverride } : {}),
      },
    }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListEntrySummariesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLatestEntriesQueryKey() });
          setPendingDelete(null);
        },
      });
  };

  // Client-side search filter
  const filteredEntries = entries?.filter((e) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return String(e.numero).includes(q) || (e.testo ?? "").toLowerCase().includes(q);
  }) ?? [];
  return (
    <div className="space-y-12">
      <label className="flex max-w-xs flex-col gap-2 text-[13px] uppercase tracking-widest">Fase elenco
        <select aria-label="Fase elenco" value={selectedFase} onChange={(e) => {
          if (!window.dispatchEvent(new Event("admin-before-navigate", { cancelable: true }))) return;
          setEditingNumero(null); setPendingDelete(null); setArchiveOverride(false); setSelectedFase(Number(e.target.value) as Fase);
        }} className="border border-border bg-[#141414] p-3 text-[13px]">
          <option value={1}>Fase 1</option><option value={2}>Fase 2</option>
        </select>
      </label>
      {selectedFase === 1 && (
        <div className="border border-primary/50 bg-card p-4 font-sans text-[13px]">
          <p className="font-semibold">Archivio Fase 1 · sola lettura</p>
          <p className="mt-1 text-muted-foreground">Le modifiche e le eliminazioni sono bloccate finché non attivi l’override esplicito.</p>
          <label className="mt-3 flex items-center gap-3">
            <input type="checkbox" checked={archiveOverride} onChange={(event) => setArchiveOverride(event.target.checked)} />
            Attiva override per modificare o eliminare dati dell’archivio
          </label>
        </div>
      )}
      {saveNotice && (
        <div role="status" data-testid="diary-save-success" className="border border-border bg-card p-4 font-sans text-[13px]">
          <p className="text-foreground">Giorno {saveNotice.entry.numero} salvato.</p>
          {saveNotice.cards === "pending" && <p className="mt-1 text-muted-foreground">Generazione delle card in corso. I dati del giorno sono già salvati.</p>}
          {saveNotice.cards === "error" && (
            <div className="mt-2 text-muted-foreground">
              <p>Le card non sono state aggiornate. I dati del giorno restano salvati.</p>
              <button type="button" className="mt-2 text-primary underline" onClick={() => {
                setSaveNotice({ ...saveNotice, cards: "pending" });
                generateCards(saveNotice.entry);
              }}>Riprova solo le card</button>
            </div>
          )}
        </div>
      )}
      <ObiettiviEditor />
      <div ref={formRef} className="scroll-mt-28">
        {editingNumero !== null ? (
          selectedFase === 1 && !archiveOverride ? (
            <AdminStatus tone="error">Questo giorno appartiene all’archivio Fase 1. Attiva l’override per aprire l’editor.</AdminStatus>
          ) : editingError ? (
            <div><AdminStatus tone="error">Impossibile caricare il giorno. Nessun dato è stato modificato.</AdminStatus><AdminRetry onRetry={() => void refetchEntry()} /></div>
          ) : editingLoading || !editingEntry ? (
            <div className="bg-card border border-border p-8 text-center text-muted-foreground font-sans animate-pulse">Caricamento giorno...</div>
          ) : (
            <EntryForm key={editingEntry.id} initialData={editingEntry} defaultFase={selectedFase} allowArchiveOverride={archiveOverride} onFaseChange={setSelectedFase} onSuccess={handleSaved} onCancel={() => {
              if (window.dispatchEvent(new Event("admin-before-navigate", { cancelable: true }))) setEditingNumero(null);
            }} />
          )
        ) : (
          selectedFase === 1 && !archiveOverride ? (
            <AdminStatus>Archivio in sola lettura. Attiva l’override per aggiungere o modificare una giornata.</AdminStatus>
          ) : listError ? <div><AdminStatus tone="error">Impossibile caricare i giorni.</AdminStatus><AdminRetry onRetry={() => void refetchList()} /></div>
            : listLoading ? <AdminStatus>Caricamento giorni...</AdminStatus>
            : <EntryForm key="new" defaultNumero={nextNumero} defaultFase={selectedFase} allowArchiveOverride={archiveOverride} onFaseChange={setSelectedFase} onSuccess={handleSaved} />
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
              editingNumero === entry.numero
                ? "border-primary"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center gap-6">
              {entry.foto ? (
                <img src={getPhotoUrl(entry.foto) ?? undefined} alt="" loading="lazy" decoding="async" className="w-12 h-12 object-cover border border-border shrink-0" />
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
              {editingNumero === entry.numero && (
                <span className="text-[11px] uppercase tracking-widest text-primary border border-primary px-2 py-0.5 font-sans">In modifica</span>
              )}
            </div>
            <div className="flex gap-5 flex-wrap">
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${entry.numero}${cardSeasonQuery(entry.fase)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors"
              >
                CARD
              </a>
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${entry.numero}/reel${cardSeasonQuery(entry.fase)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors"
              >
                REEL
              </a>
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${entry.numero}/reel-minimal${cardSeasonQuery(entry.fase)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors"
              >
                MINIMAL
              </a>
              <button onMouseEnter={() => void queryClient.prefetchQuery(getGetEntryQueryOptions(entry.numero, adminSeasonParams(selectedFase)))}
                onFocus={() => void queryClient.prefetchQuery(getGetEntryQueryOptions(entry.numero, adminSeasonParams(selectedFase)))}
                onClick={() => startEditing(entry.numero)} disabled={selectedFase === 1 && !archiveOverride} className="text-[13px] uppercase tracking-wider font-sans text-foreground hover:text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-40">Modifica</button>
              <button onClick={() => handleDelete(entry)} disabled={deleteMutation.isPending || (selectedFase === 1 && !archiveOverride)} className="text-[13px] uppercase tracking-wider font-sans text-destructive hover:text-destructive/80 transition-colors disabled:cursor-not-allowed disabled:opacity-40">Elimina</button>
            </div>
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <p className="text-muted-foreground font-sans text-[15px]">
            {search.trim() ? "Nessun risultato per la ricerca." : "Nessun giorno registrato."}
          </p>
        )}
      </div>
      {pendingDelete && (
        <div role="alertdialog" aria-modal="true" aria-label="Conferma eliminazione giornata" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <section className="max-h-[85vh] w-full max-w-xl overflow-y-auto border border-border bg-card p-6">
            <h3 className="font-serif text-xl uppercase tracking-wider">Conferma eliminazione</h3>
            <p className="mt-3 font-sans text-sm text-muted-foreground">
              Fase {pendingDelete.fase ?? selectedFase} · Giorno {pendingDelete.numero} · {pendingDelete.data}
            </p>
            <p className="mt-4 font-sans text-sm">Verrà eliminata l’intera giornata e tutti i suoi dati; nessun altro giorno sarà modificato.</p>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Campi valorizzati da cancellare: {Object.entries(pendingDelete)
                .filter(([key, value]) => !["id", "fase", "numero", "data", "createdAt"].includes(key) && reviewValue(value) !== null)
                .map(([key]) => ENTRY_REVIEW_LABELS[key] ?? key)
                .join(", ") || "nessuno"}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingDelete(null)} className="border border-border px-4 py-3 font-sans text-sm uppercase tracking-wider">
                Annulla
              </button>
              <button type="button" disabled={deleteMutation.isPending} onClick={confirmDelete} className="bg-primary px-4 py-3 font-sans text-sm uppercase tracking-wider text-primary-foreground disabled:opacity-50">
                {deleteMutation.isPending ? "Eliminazione..." : "Conferma eliminazione"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Oggi ────────────────────────────────────────────────────────────────

interface DashboardData {
  fase: Fase;
  todayDate: string;
  todayEntry: { numero: number; testo: string | null; foto: string | null } | null;
  currentDay: number;
  totalEntries: number;
  missingTesto: number;
  missingFoto: number;
  missingPhysical: number;
  missingDays: { testo: number[]; foto: number[]; physical: number[] };
  totalSubscribers: number;
  totalContacts: number;
  backup: { key: string; createdAt: string; sizeBytes: number } | null;
}

function OggiTab({ onSwitchTab }: { onSwitchTab: (tab: string, target?: DiaryTarget) => void }) {
  const [backupFeedback, setBackupFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const { data: dailyEntries } = useListEntrySummaries({ fase: 2 });
  const {
    data: dashboard,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/admin/dashboard`, { credentials: "include" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<DashboardData>;
    },
    staleTime: 30_000,
  });
  const backupStatus = useQuery<{ backup: DashboardData["backup"] }>({
    queryKey: ["admin-backup-status"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/admin/backup/status`, { credentials: "include" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    staleTime: 60_000,
  });
  const latestBackup = backupStatus.data?.backup ?? dashboard?.backup;

  if (loading) {
    return <div className="py-20"><AdminStatus>Caricamento area admin...</AdminStatus></div>;
  }

  if (isError || !dashboard) {
    return <div className="py-20"><AdminStatus tone="error">Sessione non valida o dashboard non disponibile.</AdminStatus><AdminRetry onRetry={() => void refetch()} /></div>;
  }

  const todayLabel = new Date(dashboard.todayDate + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const todayCard = dailyEntries?.find((entry) => entry.fase === 2 && entry.numero === dashboard.todayEntry?.numero);
  const todayCardImage = todayCard?.foto ? (getPhotoUrl(todayCard.foto) ?? todayCard.foto) : null;

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
              <button onClick={() => onSwitchTab("diario", { numero: dashboard.todayEntry!.numero, fase: dashboard.fase })}
                className="text-[11px] uppercase tracking-wider font-sans border border-border px-4 py-1.5 hover:bg-[#141414] hover:text-foreground transition-colors text-muted-foreground">
                Apri
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSwitchTab("diario", { numero: dashboard.todayEntry!.numero, fase: dashboard.fase })}
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

      {todayCard && (
        <div className="bg-card border border-border p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-serif tracking-wider">CARD DI OGGI</h2>
              <p className="mt-1 text-[13px] font-sans text-muted-foreground">Anteprima feed rigenerata al salvataggio del giorno.</p>
            </div>
            <a href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${todayCard.numero}${cardSeasonQuery(todayCard.fase)}`} target="_blank" rel="noopener noreferrer" className="border border-primary px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground">Apri card</a>
          </div>
          <div className="grid max-w-2xl grid-cols-2 gap-4">
            <a href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${todayCard.numero}${cardSeasonQuery(todayCard.fase)}${todayCard.fase === 2 ? "&" : "?"}format=feed`} target="_blank" rel="noopener noreferrer" className="overflow-hidden border border-border bg-[#0A0A0A] hover:border-primary">
              {todayCardImage ? <img src={todayCardImage} alt={`Immagine del giorno ${todayCard.numero}`} className="aspect-[1080/1350] w-full object-cover" /> : <div className="flex aspect-[1080/1350] w-full items-center justify-center px-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nessuna immagine disponibile</div>}
              <span className="block border-t border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Feed · PNG</span>
            </a>
            <a href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${todayCard.numero}${cardSeasonQuery(todayCard.fase)}${todayCard.fase === 2 ? "&" : "?"}format=story`} target="_blank" rel="noopener noreferrer" className="overflow-hidden border border-border bg-[#0A0A0A] hover:border-primary">
              {todayCard.cardStory ? <img src={getPhotoUrl(todayCard.cardStory) ?? todayCard.cardStory} alt={`Card story giorno ${todayCard.numero}`} className="aspect-[1080/1920] w-full object-cover" /> : <div className="flex aspect-[1080/1920] w-full items-center justify-center px-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Card story non disponibile</div>}
              <span className="block border-t border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Story · PNG</span>
            </a>
          </div>
        </div>
      )}

      {/* Giorni da completare */}
      <div className="bg-card border border-primary/40 p-6 md:p-8 flex flex-col gap-4">
        <div>
          <h2 className="text-[22px] font-serif tracking-wider mb-1">GIORNI DA COMPLETARE</h2>
          <p className="text-[13px] font-sans text-muted-foreground">Apri direttamente il giorno e completa solo il dato mancante.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Senza testo", count: dashboard.missingTesto, days: dashboard.missingDays.testo },
            { label: "Senza foto", count: dashboard.missingFoto, days: dashboard.missingDays.foto },
            { label: "Senza peso/battito", count: dashboard.missingPhysical, days: dashboard.missingDays.physical },
          ].map(({ label, count, days }) => (
            <div key={label} className="border border-border p-5 text-left">
              <div className="font-serif text-[48px] leading-none text-primary bebas measured">{count}</div>
              <div className="text-[11px] font-sans uppercase tracking-[0.15em] text-muted-foreground mt-2">{label}</div>
              {days.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {days.slice(0, 12).map((day) => (
                    <button
                      key={day}
                      onClick={() => onSwitchTab("diario", { numero: day, fase: dashboard.fase })}
                      className="border border-border px-2 py-1 font-mono text-[11px] text-foreground hover:border-primary hover:text-primary transition-colors"
                      title={`Modifica giorno ${day}`}
                    >
                      {day}
                    </button>
                  ))}
                  {days.length > 12 && <span className="px-1 py-1 font-mono text-[11px] text-muted-foreground">+{days.length - 12}</span>}
                </div>
              )}
              {days.length === 0 && <div className="mt-4 font-mono text-[11px] text-[#00FF41]">COMPLETO</div>}
            </div>
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
          <p className="text-[13px] font-sans text-muted-foreground mt-1">Esporta tutti i dati e conserva automaticamente gli ultimi 30 salvataggi.</p>
        </div>
        <div className={`border px-4 py-3 font-sans text-[13px] ${latestBackup && Date.now() - new Date(latestBackup.createdAt).getTime() > 48 * 60 * 60 * 1000 ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
          {backupStatus.isLoading ? <p>Verifica backup in corso...</p> : backupStatus.isError ? <p>Stato backup non disponibile.</p> : latestBackup ? (
            <>
              <div className="uppercase tracking-widest text-[11px]">ULTIMO BACKUP</div>
              <div className="mt-1 font-mono text-foreground">
                {new Date(latestBackup.createdAt).toLocaleString("it-IT")} · {(latestBackup.sizeBytes / 1024).toFixed(1)} KB
              </div>
              {Date.now() - new Date(latestBackup.createdAt).getTime() > 48 * 60 * 60 * 1000 && (
                <div className="mt-1 text-primary uppercase tracking-widest text-[11px]">BACKUP PIÙ VECCHIO DI 48 ORE</div>
              )}
            </>
          ) : (
            <span>NESSUN BACKUP AUTOMATICO DISPONIBILE</span>
          )}
        </div>
        <button
          disabled={isRunningBackup}
          onClick={() => {
            setBackupFeedback(null);
            setIsRunningBackup(true);
            void fetch(`${import.meta.env.BASE_URL}api/admin/backup/run`, { method: "POST", credentials: "include" })
              .then(async (response) => {
                const body = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
                setBackupFeedback({ type: "success", text: `Backup automatico completato · ${(body.sizeBytes / 1024).toFixed(1)} KB.` });
                await refetch();
                await backupStatus.refetch();
              })
              .catch((error: Error) => setBackupFeedback({ type: "error", text: `Backup non riuscito: ${error.message}` }))
              .finally(() => setIsRunningBackup(false));
          }}
          className="self-start border border-primary text-primary font-serif text-[15px] px-6 py-2.5 tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors uppercase disabled:opacity-50"
        >
          {isRunningBackup ? "BACKUP IN CORSO..." : "ESEGUI BACKUP ORA"}
        </button>
        <button onClick={() => {
          setBackupFeedback(null);
          void downloadBackup()
            .then(({ filename, summary }) => {
              const total = Object.values(summary).reduce((sum, count) => sum + count, 0);
              setBackupFeedback({ type: "success", text: `Backup scaricato: ${filename} · ${total} record esportati.` });
            })
            .catch((error: Error) => setBackupFeedback({ type: "error", text: `Download non riuscito: ${error.message}` }));
        }}
          className="self-start border border-primary text-primary font-serif text-[15px] px-6 py-2.5 tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors uppercase">
          SCARICA BACKUP
        </button>
        {backupFeedback && (
          <p role="status" className={`border px-4 py-3 font-sans text-[13px] ${backupFeedback.type === "error" ? "border-primary text-primary" : "border-green-500 text-green-500"}`}>
            {backupFeedback.text}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Bulk Edit ───────────────────────────────────────────────────────────

type BulkReviewItem = { numero: number; data: string; overwritten: string[]; cleared: string[] };

const BULK_REVIEW_LABELS: Record<string, string> = {
  DATA: "Data", KCAL: "Kcal", PASTI: "Pasti", ACQUA: "Acqua",
  ACQUA_ALLENAMENTO: "Acqua allenamento", SONNO: "Sonno", FLESSIONI: "Flessioni",
  ADDOMINALI: "Addominali", ROUND: "Round", KM: "Km", PESO: "Peso",
  BATTITO: "Battito", ENTRATE: "Entrate", USCITE: "Uscite", TESTO: "Testo",
};

function parseBulkReviewText(text: string): Map<number, Record<string, string | null>> {
  const result = new Map<number, Record<string, string | null>>();
  let numero: number | null = null;
  let values: Record<string, string | null> = {};
  let inText = false;
  let textLines: string[] = [];

  const finish = () => {
    if (numero == null) return;
    result.set(numero, values);
  };
  for (const line of text.split(/\r?\n/)) {
    const header = line.match(/^# GIORNO (\d+)$/);
    if (header) {
      finish();
      numero = Number(header[1]);
      values = {};
      inText = false;
      textLines = [];
      continue;
    }
    if (numero == null) continue;
    if (line.trim() === "TESTO:") {
      inText = true;
      textLines = [];
      continue;
    }
    if (line.trim() === "FINE_TESTO") {
      inText = false;
      const textValue = textLines.join("\n").trim();
      values.TESTO = textValue || null;
      continue;
    }
    if (inText) {
      textLines.push(line);
      continue;
    }
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toUpperCase();
    if (key === "DATA" || Object.hasOwn(BULK_REVIEW_LABELS, key)) {
      const value = line.slice(separator + 1).trim();
      values[key] = value === "" || value === "-" || value.toLowerCase() === "null" ? null : value;
    }
  }
  finish();
  return result;
}

function buildBulkReview(original: string, edited: string): BulkReviewItem[] {
  const before = parseBulkReviewText(original);
  const after = parseBulkReviewText(edited);
  const changes: BulkReviewItem[] = [];
  for (const [numero, next] of after) {
    const previous = before.get(numero) ?? {};
    const changedFields = Object.keys(next).filter((key) => (previous[key] ?? null) !== (next[key] ?? null));
    if (changedFields.length === 0) continue;
    changes.push({
      numero,
      data: next.DATA ?? "data non indicata",
      overwritten: changedFields.filter((key) => next[key] !== null).map((key) => BULK_REVIEW_LABELS[key] ?? key),
      cleared: changedFields.filter((key) => next[key] === null).map((key) => BULK_REVIEW_LABELS[key] ?? key),
    });
  }
  return changes;
}

function BulkEditTab() {
  const queryClient = useQueryClient();
  const [selectedFase, setSelectedFase] = useState<Fase>(2);
  const [archiveOverride, setArchiveOverride] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const [reviewItems, setReviewItems] = useState<BulkReviewItem[] | null>(null);
  const { data: exportedText, isLoading } = useGetEntriesBulkText({ fase: selectedFase }, { query: { queryKey: ["entriesBulkText", selectedFase] } });
  const importMutation = useImportEntriesBulkText();

  useEffect(() => {
    if (exportedText && text === "") {
      setText(exportedText);
    }
  }, [exportedText, selectedFase]);

  const handleImport = () => {
    setResult(null);
    setReviewItems(buildBulkReview(exportedText ?? "", text));
  };

  const confirmImport = () => {
    if (reviewItems == null) return;
    setResult(null);
    importMutation.mutate(
      {
        params: {
          fase: selectedFase,
          ...(selectedFase === 1 ? { overrideArchivio: archiveOverride } : {}),
        },
        data: { text },
      },
      {
        onSuccess: (res) => {
          setResult(res);
          setReviewItems(null);
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLatestEntriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["entriesBulkText", selectedFase] });
        },
      }
    );
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progetto-j-diario-fase-${selectedFase}-${new Date().toISOString().split("T")[0]}.txt`;
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
            <h2 className="text-[28px] font-serif tracking-wider">BULK EDIT · DIARIO · FASE {selectedFase}</h2>
            <p className="text-muted-foreground font-sans text-sm leading-relaxed mt-2">
              Modifica tutte le descrizioni e i dati tecnici in un unico file di testo. Puoi copiarlo, modificarlo fuori dal sito e reimportarlo. Vengono aggiornati solo i giorni già esistenti.
            </p>
          </div>
          <div className="text-[13px] font-sans text-muted-foreground uppercase tracking-wider">
            {isLoading ? "Caricamento..." : `${(exportedText ?? "").split("# GIORNO").length - 1} giorni`}
          </div>
        </div>

        <label className="flex max-w-xs flex-col gap-2 text-[13px] uppercase tracking-widest">Fase da esportare/importare
          <select aria-label="Fase bulk" value={selectedFase} onChange={(event) => {
            setSelectedFase(Number(event.target.value) as Fase);
            setArchiveOverride(false);
            setText("");
            setReviewItems(null);
            setResult(null);
          }} className="border border-border bg-[#141414] p-3 text-[13px]">
            <option value={1}>Fase 1</option><option value={2}>Fase 2</option>
          </select>
        </label>
        {selectedFase === 1 && (
          <div className="border border-primary/50 p-4 font-sans text-[13px]">
            <p>La Fase 1 è un archivio in sola lettura.</p>
            <label className="mt-3 flex items-center gap-3">
              <input type="checkbox" checked={archiveOverride} onChange={(event) => setArchiveOverride(event.target.checked)} />
              Attiva override per importare modifiche nell’archivio
            </label>
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setReviewItems(null); }}
          rows={24}
          className="bg-[#141414] border border-border p-4 text-[13px] font-mono text-foreground focus:outline-none focus:border-primary resize-y leading-relaxed"
          placeholder="# GIORNO 1\nDATA: 2026-07-19\nKCAL: -\n...\nTESTO:\n...\nFINE_TESTO"
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleImport}
            disabled={importMutation.isPending || isLoading || text.trim() === ""}
            className="flex-1 bg-primary text-primary-foreground font-serif text-[18px] py-4 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50"
          >
            {importMutation.isPending ? "Importazione..." : "Rivedi modifiche"}
          </button>
          <button
            onClick={handleDownload}
            disabled={text.trim() === ""}
            className="flex-1 border border-border text-muted-foreground font-serif text-[18px] py-4 tracking-wider hover:text-foreground hover:bg-[#141414] transition-colors uppercase disabled:opacity-50"
          >
            Scarica file
          </button>
        </div>

        {reviewItems && (
          <section role="alertdialog" aria-label="Revisione importazione" className="border border-primary/50 bg-card p-5">
            <h3 className="font-serif text-xl uppercase tracking-wider">Controlla prima di importare</h3>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Fase {selectedFase} · {reviewItems.length} giornate con modifiche. L’importazione aggiorna solo i giorni già esistenti.
            </p>
            {reviewItems.length === 0 ? (
              <p className="mt-4 font-sans text-sm">Non risultano differenze rispetto all’esportazione iniziale.</p>
            ) : (
              <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto font-sans text-sm">
                {reviewItems.map((item) => (
                  <li key={item.numero} className="border-b border-border pb-3">
                    <p>Fase {selectedFase} · Giorno {item.numero} · {item.data}</p>
                    <p className="mt-1 text-muted-foreground">
                      Sovrascritti: {item.overwritten.join(", ") || "nessuno"} · Svuotati: {item.cleared.join(", ") || "nessuno"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setReviewItems(null)} className="border border-border px-4 py-3 font-sans text-sm uppercase tracking-wider">
                Torna al testo
              </button>
              <button type="button" disabled={importMutation.isPending || (selectedFase === 1 && !archiveOverride)} onClick={confirmImport} className="bg-primary px-4 py-3 font-sans text-sm uppercase tracking-wider text-primary-foreground disabled:opacity-50">
                {importMutation.isPending ? "Importazione..." : "Conferma importazione"}
              </button>
            </div>
          </section>
        )}

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

type Tab = "oggi" | "diario" | "sito" | "pagine" | "bulk" | "social" | "sponsor" | "articoli" | "coaching" | "contatti" | "candidature" | "iscritti" | "analytics" | "planner";

type TabGroup = { id: string; label: string; tabs: { id: Tab; label: string }[] };

/** The 13 tabs grouped into 4 areas so the mobile nav stays manageable. */
const TAB_GROUPS: TabGroup[] = [
  {
    id: "giornata",
    label: "Oggi",
    tabs: [
      { id: "oggi", label: "Oggi" },
      { id: "diario", label: "Diario" },
      { id: "planner", label: "Planner" },
    ],
  },
  {
    id: "contenuti",
    label: "Contenuti",
    tabs: [
      { id: "articoli", label: "Articoli" },
      { id: "pagine", label: "Pagine" },
      { id: "bulk", label: "Bulk" },
    ],
  },
  {
    id: "sito",
    label: "Sito",
    tabs: [
      { id: "sito", label: "Sito" },
      { id: "social", label: "Social" },
      { id: "sponsor", label: "Sponsor" },
      { id: "coaching", label: "Coaching" },
    ],
  },
  {
    id: "dati",
    label: "Dati",
    tabs: [
      { id: "analytics", label: "Analytics" },
      { id: "contatti", label: "Contatti" },
        { id: "candidature", label: "Candidature" },
      { id: "iscritti", label: "Iscritti" },
    ],
  },
];

function groupOfTab(tab: Tab): string {
  return TAB_GROUPS.find((group) => group.tabs.some((t) => t.id === tab))?.id ?? TAB_GROUPS[0].id;
}

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: adminData, isLoading: adminLoading } = useAdminMe({ query: { queryKey: getAdminMeQueryKey(), retry: false } });
  const logoutMutation = useAdminLogout();
  const [activeTab, setActiveTab] = useState<Tab>("oggi");
  const [headerBackupFeedback, setHeaderBackupFeedback] = useState<string | null>(null);
  const [diarioScrollTo, setDiarioScrollTo] = useState<DiaryTarget | undefined>(undefined);
  // Read ?editArticle=slug from URL to jump straight into editing
  const searchParams = new URLSearchParams(window.location.search);
  const editArticleSlug = searchParams.get("editArticle") ?? undefined;
  const editDay = Number(searchParams.get("editDay"));
  const requestedEditFase = Number(searchParams.get("fase"));
  const editFase: Fase = requestedEditFase === 1 ? 1 : 2;
  const [pendingEditSlug, setPendingEditSlug] = useState<string | undefined>(editArticleSlug);

  useEffect(() => {
    if (editArticleSlug) {
      setActiveTab("articoli");
    } else if (Number.isInteger(editDay) && editDay > 0) {
      setActiveTab("diario");
      setDiarioScrollTo({ numero: editDay, fase: editFase });
    } else {
      return;
    }
    // Clean the query param from the URL without a page reload
    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
  }, []);

  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center font-serif text-2xl animate-pulse text-muted-foreground pt-16">Caricamento...</div>;
  }

  if (!adminData?.authenticated) return <AdminLoginForm />;

  const handleLogout = () => {
    if (!window.dispatchEvent(new Event("admin-before-navigate", { cancelable: true }))) return;
    logoutMutation.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() }),
    });
  };

  const handleSwitchTab = (tab: string, target?: DiaryTarget) => {
    if (!window.dispatchEvent(new Event("admin-before-navigate", { cancelable: true }))) return;
    setDiarioScrollTo(target);
    setActiveTab(tab as Tab);
  };

  return (
    <main className="admin-shell min-h-screen pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <header className="admin-header flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8 border-b border-border pb-6">
        <div>
          <div className="admin-eyebrow mb-3">AREA PRIVATA · CONTROLLO EDITORIALE</div>
          <h1 className="text-[32px] sm:text-[38px] font-serif tracking-wider">ADMIN · PROGETTO J</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => {
            setHeaderBackupFeedback(null);
            void downloadBackup()
              .then(({ filename }) => setHeaderBackupFeedback(`Backup scaricato: ${filename}`))
              .catch((error: Error) => setHeaderBackupFeedback(`Backup non riuscito: ${error.message}`));
          }}
            className="admin-secondary-action text-[12px] font-sans uppercase tracking-[0.15em] border border-border px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-[#141414] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            BACKUP
          </button>
          <button onClick={handleLogout} className="text-[13px] font-sans text-primary uppercase tracking-[0.15em] hover:text-primary/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Esci
          </button>
        </div>
      </header>
      {headerBackupFeedback && (
        <p role="status" className="mb-6 border border-border bg-card px-4 py-3 font-sans text-[13px] text-foreground">
          {headerBackupFeedback}
        </p>
      )}

      {/* Two-level nav: 4 areas on top, the area's tabs below. */}
      <nav aria-label="Sezioni admin" className="admin-navigation mb-3 grid grid-cols-2 sm:grid-cols-4 border border-border">
        {TAB_GROUPS.map((group) => {
          const isActive = groupOfTab(activeTab) === group.id;
          return (
            <button
              key={group.id}
              onClick={() => {
                if (group.tabs[0].id !== activeTab && window.dispatchEvent(new Event("admin-before-navigate", { cancelable: true }))) setActiveTab(group.tabs[0].id);
              }}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-14 px-2 font-serif text-[13px] sm:text-[14px] tracking-[0.1em] uppercase transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </nav>
      <div className="admin-subnavigation flex gap-0 mb-12 border-b border-border overflow-x-auto no-scrollbar" role="tablist" aria-label="Sottosezioni admin">
        {(TAB_GROUPS.find((group) => group.id === groupOfTab(activeTab))?.tabs ?? []).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id !== activeTab && window.dispatchEvent(new Event("admin-before-navigate", { cancelable: true }))) setActiveTab(tab.id);
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`shrink-0 min-h-12 px-4 sm:px-5 py-3 font-serif text-[13px] sm:text-[14px] tracking-[0.1em] uppercase border-b-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
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
      <Suspense fallback={<AdminStatus>Caricamento sezione...</AdminStatus>}>
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
      {activeTab === "candidature" && <CandidatureTab />}
      {activeTab === "iscritti" && <IscrittiTab />}
      {activeTab === "bulk" && <BulkEditTab />}
      {activeTab === "analytics" && (
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground font-sans animate-pulse">Caricamento analytics...</div>}>
          <AnalyticsTab />
        </Suspense>
      )}
      {activeTab === "planner" && <PlannerTab />}
      </Suspense>
      </div>
    </main>
  );
}
