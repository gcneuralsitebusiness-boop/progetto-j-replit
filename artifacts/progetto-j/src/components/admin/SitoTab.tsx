import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetSiteContent, useUpdateSiteContent, getGetSiteContentQueryKey } from "@workspace/api-client-react";
import { useUpload, getPhotoUrl } from "@workspace/object-storage-web";

// ─── Shared helpers ──────────────────────────────────────────────────────────

function useSectionSave(chiavi: string[]) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateSiteContent();
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const saveKey = (chiave: string, valore: string) =>
    new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { chiave, data: { valore } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() });
            setSaved((s) => ({ ...s, [chiave]: true }));
            setTimeout(() => setSaved((s) => ({ ...s, [chiave]: false })), 2000);
            resolve();
          },
          onError: reject,
        }
      );
    });

  return { saveKey, saved, isPending: updateMutation.isPending };
}

function SectionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-6 md:p-8 flex flex-col gap-6">
      <h3 className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary border-b border-border pb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows = 4,
  type = "textarea",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  type?: "textarea" | "input" | "url";
}) {
  const cls =
    "bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans w-full";
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
      {type === "textarea" ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-y leading-relaxed`}
        />
      ) : (
        <input
          type={type === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={type === "url" ? "https://..." : undefined}
          className={cls}
        />
      )}
    </div>
  );
}

function SaveButton({ onClick, isPending, saved }: { onClick: () => void; isPending: boolean; saved: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="self-start bg-primary text-primary-foreground font-serif text-[15px] px-6 py-2.5 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50"
    >
      {saved ? "✓ Salvato" : isPending ? "Salvataggio..." : "Salva sezione"}
    </button>
  );
}

// ─── Home section ─────────────────────────────────────────────────────────────

function HomeCmsSection() {
  const { data: content } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const { saveKey, isPending } = useSectionSave(["home_hero_titolo", "home_hero_sottotitolo", "home_cta_testo", "home_community_testo"]);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    home_hero_titolo: "",
    home_hero_sottotitolo: "",
    home_cta_testo: "",
    home_community_testo: "",
  });

  useEffect(() => {
    if (content) {
      setForm({
        home_hero_titolo: content.home_hero_titolo ?? "",
        home_hero_sottotitolo: content.home_hero_sottotitolo ?? "",
        home_cta_testo: content.home_cta_testo ?? "",
        home_community_testo: content.home_community_testo ?? "",
      });
    }
  }, [content]);

  const handleSave = async () => {
    await Promise.all(
      Object.entries(form).map(([k, v]) => saveKey(k, v))
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionWrapper title="Home — Hero &amp; CTA">
      <TextField
        label="Titolo hero"
        value={form.home_hero_titolo}
        onChange={(v) => setForm({ ...form, home_hero_titolo: v })}
        type="input"
      />
      <TextField
        label="Sottotitolo hero"
        value={form.home_hero_sottotitolo}
        onChange={(v) => setForm({ ...form, home_hero_sottotitolo: v })}
        type="input"
      />
      <TextField
        label="Testo pulsante CTA"
        value={form.home_cta_testo}
        onChange={(v) => setForm({ ...form, home_cta_testo: v })}
        type="input"
      />
      <TextField
        label="Testo blocco Community"
        value={form.home_community_testo}
        onChange={(v) => setForm({ ...form, home_community_testo: v })}
        rows={3}
      />

      {/* Live hero preview */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Anteprima hero</span>
        <div className="relative border border-border bg-[#0a0a0a] overflow-hidden">
          {/* ANTEPRIMA badge */}
          <span className="absolute top-3 right-3 z-10 text-[9px] font-sans uppercase tracking-[0.25em] text-primary border border-primary px-2 py-0.5 bg-[#0a0a0a]/80">
            ANTEPRIMA
          </span>
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
            <span className="font-serif text-[72px] leading-none text-primary bebas tracking-wide" style={{ textShadow: "0 0 40px rgba(220,38,38,0.5)" }}>
              J
            </span>
            <h2 className="font-serif text-[28px] text-foreground tracking-[0.08em] bebas leading-tight">
              {form.home_hero_titolo || <span className="text-muted-foreground">Titolo hero…</span>}
            </h2>
            <p className="text-[12px] font-sans text-muted-foreground max-w-xs leading-relaxed uppercase tracking-[0.12em]">
              {form.home_hero_sottotitolo || <span className="italic normal-case tracking-normal">Sottotitolo hero…</span>}
            </p>
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans text-[11px] px-5 py-2 uppercase tracking-[0.15em] mt-1">
              {form.home_cta_testo || "Segui il percorso"}
            </div>
          </div>
        </div>
      </div>

      <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
    </SectionWrapper>
  );
}

// ─── Chi Sono section ─────────────────────────────────────────────────────────

function ChiSonoCmsSection() {
  const queryClient = useQueryClient();
  const { data: content } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const updateMutation = useUpdateSiteContent();
  const { uploadFile, isUploading, progress, error: uploadError } = useUpload({
    onSuccess: (res) => {
      updateMutation.mutate(
        { chiave: "chi_sono_foto", data: { valore: res.objectPath } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() }) }
      );
    },
  });

  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    chi_sono_bio: "",
    chi_sono_il_progetto: "",
    chi_sono_la_motivazione: "",
    chi_sono_la_promessa: "",
  });

  useEffect(() => {
    if (content) {
      setForm({
        chi_sono_bio: content.chi_sono_bio ?? "",
        chi_sono_il_progetto: content.chi_sono_il_progetto ?? "",
        chi_sono_la_motivazione: content.chi_sono_la_motivazione ?? "",
        chi_sono_la_promessa: content.chi_sono_la_promessa ?? "",
      });
    }
  }, [content]);

  const handleSave = () => {
    let remaining = Object.keys(form).length;
    Object.entries(form).forEach(([chiave, valore]) => {
      updateMutation.mutate(
        { chiave, data: { valore } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() });
            remaining -= 1;
            if (remaining === 0) {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }
          },
        }
      );
    });
  };

  const fotoPath = content?.chi_sono_foto ?? null;
  const photoUrl = getPhotoUrl(fotoPath);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleRemoveFoto = () => {
    updateMutation.mutate(
      { chiave: "chi_sono_foto", data: { valore: "" } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() }) }
    );
  };

  return (
    <SectionWrapper title="Chi Sono">
      {/* Foto */}
      <div className="flex flex-col gap-3">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Foto Chi Sono</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading || updateMutation.isPending}
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
        {photoUrl ? (
          <div className="relative border border-border w-fit">
            <img src={photoUrl} alt="Foto Chi Sono" className="max-h-[280px] object-contain" />
            <button
              type="button"
              onClick={handleRemoveFoto}
              disabled={updateMutation.isPending}
              className="absolute top-2 right-2 bg-background/90 text-[11px] uppercase tracking-wider px-2 py-1 border border-border hover:text-primary transition-colors disabled:opacity-50"
            >
              Rimuovi
            </button>
          </div>
        ) : (
          <p className="text-[12px] font-sans text-muted-foreground">Nessuna foto — la pagina mostrerà il placeholder.</p>
        )}
      </div>

      <TextField
        label="Bio"
        value={form.chi_sono_bio}
        onChange={(v) => setForm({ ...form, chi_sono_bio: v })}
        rows={5}
      />
      <TextField
        label="Il Progetto"
        value={form.chi_sono_il_progetto}
        onChange={(v) => setForm({ ...form, chi_sono_il_progetto: v })}
        rows={5}
      />
      <TextField
        label="La Motivazione"
        value={form.chi_sono_la_motivazione}
        onChange={(v) => setForm({ ...form, chi_sono_la_motivazione: v })}
        rows={5}
      />
      <TextField
        label="La Promessa"
        value={form.chi_sono_la_promessa}
        onChange={(v) => setForm({ ...form, chi_sono_la_promessa: v })}
        rows={4}
      />
      <SaveButton onClick={handleSave} isPending={updateMutation.isPending} saved={saved} />
    </SectionWrapper>
  );
}

// ─── Journaling section ───────────────────────────────────────────────────────

function JournalingCmsSection() {
  const { data: content } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const { saveKey, isPending } = useSectionSave(["journaling_intro"]);
  const [saved, setSaved] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (content) setValue(content.journaling_intro ?? "");
  }, [content]);

  const handleSave = async () => {
    await saveKey("journaling_intro", value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionWrapper title="Journaling — Testo introduttivo">
      <TextField
        label="Testo intro (mostrato in cima alla pagina Journaling)"
        value={value}
        onChange={setValue}
        rows={4}
      />
      <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
    </SectionWrapper>
  );
}

// ─── Social section ───────────────────────────────────────────────────────────

function SocialCmsSection() {
  const { data: content } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const { saveKey, isPending } = useSectionSave(["social_intro", "social_lavora_titolo"]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ social_intro: "", social_lavora_titolo: "" });

  useEffect(() => {
    if (content) {
      setForm({
        social_intro: content.social_intro ?? "",
        social_lavora_titolo: content.social_lavora_titolo ?? "",
      });
    }
  }, [content]);

  const handleSave = async () => {
    await Promise.all(Object.entries(form).map(([k, v]) => saveKey(k, v)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionWrapper title="Social — Testi pagina">
      <TextField
        label="Testo introduttivo"
        value={form.social_intro}
        onChange={(v) => setForm({ ...form, social_intro: v })}
        rows={3}
      />
      <TextField
        label="Titolo sezione 'Lavora con me'"
        value={form.social_lavora_titolo}
        onChange={(v) => setForm({ ...form, social_lavora_titolo: v })}
        type="input"
      />
      <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
    </SectionWrapper>
  );
}

// ─── Sponsor section ──────────────────────────────────────────────────────────

function SponsorCmsSection() {
  const { data: content } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const { saveKey, isPending } = useSectionSave([
    "sponsor_intro", "sponsor_cta_titolo", "sponsor_cta_testo", "sponsor_email",
  ]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    sponsor_intro: "",
    sponsor_cta_titolo: "",
    sponsor_cta_testo: "",
    sponsor_email: "",
  });

  useEffect(() => {
    if (content) {
      setForm({
        sponsor_intro: content.sponsor_intro ?? "",
        sponsor_cta_titolo: content.sponsor_cta_titolo ?? "",
        sponsor_cta_testo: content.sponsor_cta_testo ?? "",
        sponsor_email: content.sponsor_email ?? "",
      });
    }
  }, [content]);

  const handleSave = async () => {
    await Promise.all(Object.entries(form).map(([k, v]) => saveKey(k, v)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionWrapper title="Sponsor — Testi pagina">
      <TextField
        label="Testo introduttivo"
        value={form.sponsor_intro}
        onChange={(v) => setForm({ ...form, sponsor_intro: v })}
        rows={3}
      />
      <TextField
        label="Titolo CTA 'Diventa Sponsor'"
        value={form.sponsor_cta_titolo}
        onChange={(v) => setForm({ ...form, sponsor_cta_titolo: v })}
        type="input"
      />
      <TextField
        label="Testo CTA"
        value={form.sponsor_cta_testo}
        onChange={(v) => setForm({ ...form, sponsor_cta_testo: v })}
        rows={2}
      />
      <TextField
        label="Email sponsor"
        value={form.sponsor_email}
        onChange={(v) => setForm({ ...form, sponsor_email: v })}
        type="input"
      />
      <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
    </SectionWrapper>
  );
}

// ─── Coaching Pillars section ─────────────────────────────────────────────────

function CoachingPillarsCmsSection() {
  const { data: content } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const { saveKey, isPending } = useSectionSave([
    "coaching_pillar_1_label", "coaching_pillar_1_testo",
    "coaching_pillar_2_label", "coaching_pillar_2_testo",
    "coaching_pillar_3_label", "coaching_pillar_3_testo",
    "coaching_pillar_4_label", "coaching_pillar_4_testo",
    "coaching_contatto_intro",
  ]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    coaching_pillar_1_label: "",
    coaching_pillar_1_testo: "",
    coaching_pillar_2_label: "",
    coaching_pillar_2_testo: "",
    coaching_pillar_3_label: "",
    coaching_pillar_3_testo: "",
    coaching_pillar_4_label: "",
    coaching_pillar_4_testo: "",
    coaching_contatto_intro: "",
  });

  useEffect(() => {
    if (content) {
      setForm({
        coaching_pillar_1_label: content.coaching_pillar_1_label ?? "",
        coaching_pillar_1_testo: content.coaching_pillar_1_testo ?? "",
        coaching_pillar_2_label: content.coaching_pillar_2_label ?? "",
        coaching_pillar_2_testo: content.coaching_pillar_2_testo ?? "",
        coaching_pillar_3_label: content.coaching_pillar_3_label ?? "",
        coaching_pillar_3_testo: content.coaching_pillar_3_testo ?? "",
        coaching_pillar_4_label: content.coaching_pillar_4_label ?? "",
        coaching_pillar_4_testo: content.coaching_pillar_4_testo ?? "",
        coaching_contatto_intro: content.coaching_contatto_intro ?? "",
      });
    }
  }, [content]);

  const handleSave = async () => {
    await Promise.all(Object.entries(form).map(([k, v]) => saveKey(k, v)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const pillars = [
    { n: 1, defaultLabel: "ALLENAMENTO" },
    { n: 2, defaultLabel: "NUTRIZIONE" },
    { n: 3, defaultLabel: "DATI" },
    { n: 4, defaultLabel: "ACCOUNTABILITY" },
  ] as const;

  return (
    <SectionWrapper title="Coaching — Pilastri &amp; Contatto">
      <div className="space-y-6">
        {pillars.map(({ n, defaultLabel }) => (
          <div key={n} className="border border-border/50 p-4 flex flex-col gap-3">
            <span className="text-[10px] font-sans uppercase tracking-widest text-primary">
              Pilastro {n}
            </span>
            <TextField
              label="Titolo pilastro"
              value={form[`coaching_pillar_${n}_label` as keyof typeof form]}
              onChange={(v) => setForm({ ...form, [`coaching_pillar_${n}_label`]: v })}
              type="input"
            />
            <TextField
              label="Descrizione"
              value={form[`coaching_pillar_${n}_testo` as keyof typeof form]}
              onChange={(v) => setForm({ ...form, [`coaching_pillar_${n}_testo`]: v })}
              rows={2}
            />
          </div>
        ))}
      </div>
      <TextField
        label="Testo sezione contatto"
        value={form.coaching_contatto_intro}
        onChange={(v) => setForm({ ...form, coaching_contatto_intro: v })}
        rows={2}
      />
      <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
    </SectionWrapper>
  );
}

// ─── Globale section ──────────────────────────────────────────────────────────

function GlobaleCmsSection() {
  const { data: content } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });
  const { saveKey, isPending } = useSectionSave(["instagram_url", "global_footer_mantra"]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ instagram_url: "", global_footer_mantra: "" });

  useEffect(() => {
    if (content) {
      setForm({
        instagram_url: content.instagram_url ?? "",
        global_footer_mantra: content.global_footer_mantra ?? "",
      });
    }
  }, [content]);

  const handleSave = async () => {
    await Promise.all(Object.entries(form).map(([k, v]) => saveKey(k, v)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionWrapper title="Impostazioni globali">
      <TextField
        label="Link Instagram"
        value={form.instagram_url}
        onChange={(v) => setForm({ ...form, instagram_url: v })}
        type="url"
      />
      <TextField
        label="Mantra footer (es. IC XC NIKA)"
        value={form.global_footer_mantra}
        onChange={(v) => setForm({ ...form, global_footer_mantra: v })}
        type="input"
      />
      <SaveButton onClick={handleSave} isPending={isPending} saved={saved} />
    </SectionWrapper>
  );
}

// ─── SitoTab ──────────────────────────────────────────────────────────────────

export function SitoTab() {
  const { isLoading } = useGetSiteContent({ query: { queryKey: getGetSiteContentQueryKey() } });

  if (isLoading) return <p className="text-muted-foreground font-sans animate-pulse">Caricamento...</p>;

  return (
    <div className="space-y-8">
      <p className="text-[13px] font-sans text-muted-foreground uppercase tracking-wider">
        Modifica i contenuti di ogni sezione del sito. Salva ogni sezione separatamente.
      </p>
      <HomeCmsSection />
      <ChiSonoCmsSection />
      <JournalingCmsSection />
      <SocialCmsSection />
      <SponsorCmsSection />
      <CoachingPillarsCmsSection />
      <GlobaleCmsSection />
    </div>
  );
}
