import { useGetCoaching, useGetSiteContent } from "@workspace/api-client-react";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { Users, Mail, Target, TrendingDown, Dumbbell, ArrowRight } from "lucide-react";

export default function Coaching() {
  const { data: coaching, isLoading } = useGetCoaching();
  const { data: siteContent } = useGetSiteContent();

  const content = coaching ?? {
    heroTitolo: "PROTOCOLLO COACHING",
    heroSottotitolo: "Dimagrimento. Disciplina. Dati.",
    descrizione:
      "Un percorso di 12 settimane basato sui numeri reali del diario. Allenamento, nutrizione, sonno, abitudini. Niente promesse facili: solo un sistema che funziona se lo segui.",
    communityCta: "Entra nella community italiana e trova gente con la tua stessa fame.",
    communityUrl: "#",
    email: "contatto@progettoj.it",
  };

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-5xl mx-auto px-5 sm:px-6">
      <Reveal>
        <div className="mb-6">
          <span className="page-label">SERVIZIO</span>
          <h1 className="font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide bebas text-primary mt-2">
            {isLoading ? "COACHING" : content.heroTitolo}
          </h1>
          <p className="font-serif text-[clamp(20px,4vw,28px)] text-foreground tracking-wide bebas mt-2">
            {content.heroSottotitolo}
          </p>
        </div>
      </Reveal>

      <Reveal>
        <p className="text-[15px] sm:text-[17px] font-sans text-foreground/80 leading-relaxed mb-16 max-w-2xl ink-line">
          {content.descrizione}
        </p>
      </Reveal>

      {/* Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {[
          { icon: Dumbbell, label: siteContent?.coaching_pillar_1_label || "ALLENAMENTO", text: siteContent?.coaching_pillar_1_testo || "Protocolli costruiti sul corpo, non sul marketing." },
          { icon: TrendingDown, label: siteContent?.coaching_pillar_2_label || "TRACKING", text: siteContent?.coaching_pillar_2_testo || "Come misurare e leggere i tuoi dati." },
          { icon: Target, label: siteContent?.coaching_pillar_3_label || "DATI", text: siteContent?.coaching_pillar_3_testo || "Peso, sonno, km, calorie. Misuriamo tutto." },
          { icon: Users, label: siteContent?.coaching_pillar_4_label || "ACCOUNTABILITY", text: siteContent?.coaching_pillar_4_testo || "Report settimanali e obiettivi chiari." },
        ].map((p, i) => (
          <Reveal key={p.label} delay={i * 80}>
            <div className="border border-border bg-card p-5 metallic-sheen h-full">
              <div className="border border-primary p-2 w-fit mb-4">
                <p.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-serif text-[24px] leading-none text-foreground bebas mb-2">{p.label}</h3>
              <p className="text-[13px] font-sans text-muted-foreground leading-relaxed">{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="cut-divider mb-16" />

      {/* Community CTA */}
      <Reveal>
        <div className="border border-primary bg-card p-6 sm:p-8 metallic-sheen relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -translate-y-1/2 translate-x-1/2 rotate-45" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="border border-primary p-3 sm:p-4">
                <Users size={28} className="text-primary" />
              </div>
              <div>
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary">COMMUNITY</span>
                <p className="text-[16px] sm:text-[18px] font-sans text-foreground leading-relaxed max-w-md">
                  {content.communityCta}
                </p>
              </div>
            </div>
            <a
              href={content.communityUrl}
              className="inline-flex items-center gap-2 border border-primary text-primary font-sans text-[13px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
            >
              Entra <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </Reveal>

      {/* Contact */}
      <Reveal>
        <div className="mt-12 border border-border bg-card p-6 sm:p-8 metallic-sheen text-center">
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <Mail size={18} />
            <span className="text-[11px] font-sans uppercase tracking-[0.2em]">INFO</span>
          </div>
          <p className="text-[14px] font-sans text-muted-foreground mb-4">
            {siteContent?.coaching_contatto_intro || "Per informazioni sul protocollo scrivi a"}
          </p>
          <a
            href={`mailto:${content.email}`}
            className="font-serif text-[28px] sm:text-[36px] text-foreground bebas hover:text-primary transition-colors"
          >
            {content.email}
          </a>
        </div>
      </Reveal>

      <div className="mt-16 flex justify-center">
        <Cross />
      </div>
    </div>
  );
}
