import { useState } from "react";
import { useListSocial, useGetSiteContent } from "@workspace/api-client-react";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { Instagram, Youtube, Twitter, MessageCircle, Send, Mail, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Instagram,
  Youtube,
  Twitter,
  Telegram: MessageCircle,
  Email: Mail,
  Default: Send,
};

function SocialIcon({ name, size = 24 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] || ICON_MAP.Default;
  return <Icon size={size} className="text-foreground" />;
}

export default function Social() {
  const { data: socials, isLoading } = useListSocial();
  const { data: siteContent } = useGetSiteContent();
  const [form, setForm] = useState({ nome: "", email: "", tipo: "", messaggio: "" });

  const socialIntro = siteContent?.social_intro || "Tutti i canali dove pubblico. Segui il percorso, commenta, condividi. Se vuoi collaborare, compila il form in fondo.";
  const lavoraTitolo = siteContent?.social_lavora_titolo || "LAVORA CON ME";
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Errore durante l'invio");
      setSent(true);
      toast.success("Messaggio inviato. Ti risponderemo al più presto.");
      setForm({ nome: "", email: "", tipo: "", messaggio: "" });
    } catch (err) {
      toast.error("Impossibile inviare il messaggio. Riprova più tardi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-5xl mx-auto px-5 sm:px-6">
      <Reveal>
        <div className="mb-6">
          <span className="page-label">HUB</span>
          <h1 className="font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide bebas text-foreground mt-2">
            SOCIAL
          </h1>
        </div>
      </Reveal>

      <Reveal>
        <p className="text-[15px] sm:text-[16px] font-sans text-foreground/80 leading-relaxed mb-16 max-w-2xl ink-line">
          {socialIntro}
        </p>
      </Reveal>

      {/* Social cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Caricamento...</div>
        ) : (
          socials?.map((s) => (
            <Reveal key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-border bg-card p-5 metallic-sheen hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="border border-border p-3">
                    <SocialIcon name={s.icona} size={22} />
                  </div>
                  <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-serif text-[28px] leading-none text-foreground bebas mb-2">{s.nome}</h3>
                <p className="text-[13px] font-sans text-muted-foreground leading-relaxed">{s.descrizione}</p>
              </a>
            </Reveal>
          ))
        )}
      </div>

      <div className="cut-divider mb-16" />

      {/* Lavora con me */}
      <Reveal>
        <div className="border border-border bg-card p-6 sm:p-8 metallic-sheen">
          <div className="flex items-center gap-3 mb-6">
            <div className="border border-primary p-2">
              <Mail size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary">NETWORKING</span>
              <h2 className="font-serif text-[32px] sm:text-[40px] leading-none text-foreground bebas">{lavoraTitolo}</h2>
            </div>
          </div>

          {sent ? (
            <div className="border border-primary bg-primary/5 p-6 text-center">
              <p className="text-[15px] font-sans text-foreground">Messaggio inviato. Ti ricontatteremo presto.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-[12px] font-sans uppercase tracking-[0.15em] text-primary hover:text-foreground transition-colors"
              >
                Invia un altro messaggio
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                type="text"
                placeholder="NOME"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="bg-[#0a0a0a] border border-border p-3 text-[13px] font-sans uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <input
                required
                type="email"
                placeholder="EMAIL"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-[#0a0a0a] border border-border p-3 text-[13px] font-sans uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="bg-[#0a0a0a] border border-border p-3 text-[13px] font-sans uppercase tracking-wider text-foreground focus:border-primary focus:outline-none sm:col-span-2"
              >
                <option value="">TIPO DI COLLABORAZIONE</option>
                <option value="sponsor">Sponsor / Partnership</option>
                <option value="coaching">Coaching / Consulenza</option>
                <option value="content">Content / Media</option>
                <option value="altro">Altro</option>
              </select>
              <textarea
                required
                rows={4}
                placeholder="MESSAGGIO"
                value={form.messaggio}
                onChange={(e) => setForm({ ...form, messaggio: e.target.value })}
                className="bg-[#0a0a0a] border border-border p-3 text-[13px] font-sans text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:col-span-2"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="sm:col-span-2 border border-primary text-primary font-sans text-[13px] uppercase tracking-[0.2em] py-3 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Invio..." : "Invia richiesta"}
              </button>
            </form>
          )}
        </div>
      </Reveal>

      <div className="mt-16 flex justify-center">
        <Cross />
      </div>
    </div>
  );
}
