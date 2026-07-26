import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCoaching, useUpdateCoaching, getGetCoachingQueryKey } from "@workspace/api-client-react";

export function CoachingTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetCoaching();
  const update = useUpdateCoaching();

  const [form, setForm] = useState({
    heroTitolo: "",
    heroSottotitolo: "",
    descrizione: "",
    communityCta: "",
    communityUrl: "",
    email: "",
    visibile: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        heroTitolo: data.heroTitolo,
        heroSottotitolo: data.heroSottotitolo,
        descrizione: data.descrizione,
        communityCta: data.communityCta,
        communityUrl: data.communityUrl,
        email: data.email,
        visibile: data.visibile,
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { data: form },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCoachingQueryKey() }),
      }
    );
  };

  if (isLoading) return <div className="text-muted-foreground">Caricamento...</div>;

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 flex flex-col gap-4">
      <h3 className="text-[22px] font-serif tracking-wider">PAGINA COACHING</h3>
      <input
        placeholder="TITOLO HERO"
        value={form.heroTitolo}
        onChange={(e) => setForm({ ...form, heroTitolo: e.target.value })}
        className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
      />
      <input
        placeholder="SOTTOTITOLO HERO"
        value={form.heroSottotitolo}
        onChange={(e) => setForm({ ...form, heroSottotitolo: e.target.value })}
        className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
      />
      <textarea
        rows={4}
        placeholder="DESCRIZIONE"
        value={form.descrizione}
        onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
        className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary resize-y font-sans leading-relaxed"
      />
      <input
        placeholder="CTA COMMUNITY"
        value={form.communityCta}
        onChange={(e) => setForm({ ...form, communityCta: e.target.value })}
        className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
      />
      <input
        placeholder="URL COMMUNITY"
        value={form.communityUrl}
        onChange={(e) => setForm({ ...form, communityUrl: e.target.value })}
        className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
      />
      <input
        placeholder="EMAIL CONTATTO"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="bg-[#141414] border border-border p-3 text-white focus:outline-none focus:border-primary font-sans"
      />
      <label className="flex items-center gap-2 text-[13px] font-sans text-foreground">
        <input type="checkbox" checked={form.visibile} onChange={(e) => setForm({ ...form, visibile: e.target.checked })} className="accent-primary" />
        Pagina visibile
      </label>
      <button
        type="submit"
        disabled={update.isPending}
        className="self-start bg-primary text-primary-foreground font-serif text-[15px] px-6 py-2.5 tracking-wider hover:bg-primary/90 transition-colors uppercase disabled:opacity-50"
      >
        {update.isPending ? "Salvataggio..." : "Salva"}
      </button>
    </form>
  );
}
