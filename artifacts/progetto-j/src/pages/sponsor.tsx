import { useListSponsors, useGetSiteContent } from "@workspace/api-client-react";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { ArrowUpRight, Mail } from "lucide-react";

const LEVEL_STYLES: Record<string, string> = {
  Bronze: "border-[hsl(var(--bronze))] text-[hsl(var(--bronze))]",
  Silver: "border-[#C0C0C0] text-[#C0C0C0]",
  Gold: "border-[#D4AF37] text-[#D4AF37]",
  Blood: "border-primary text-primary",
};

export default function Sponsor() {
  const { data: sponsors, isLoading: sponsorsLoading, isError: sponsorsError } = useListSponsors();
  const { data: siteContent, isLoading: siteContentLoading, isError: siteContentError } = useGetSiteContent();
  const isLoading = sponsorsLoading || siteContentLoading;
  const isError = sponsorsError || siteContentError;

  const sponsorIntro = siteContent?.sponsor_intro || "Chi crede in questo percorso e lo rende possibile. Sponsor tecnici, partner, e chi mette le risorse per costruire qualcosa di reale.";
  const ctaTitolo = siteContent?.sponsor_cta_titolo || "SOSTIENI IL PROGETTO";
  const ctaTesto = siteContent?.sponsor_cta_testo || "Se vuoi mettere il tuo brand dietro un percorso di trasformazione documentato, scrivi a";
  const sponsorEmail = siteContent?.sponsor_email || "sponsor@progettoj.it";

  if (isError) {
    return (
      <>
        <DataErrorState />
        <SiteFooter />
      </>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-5xl mx-auto px-5 sm:px-6">
      <Reveal>
        <div className="mb-6">
          <span className="page-label">SUPPORTO</span>
          <h1 className="font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide bebas text-foreground mt-2">
            SPONSOR
          </h1>
        </div>
      </Reveal>

      <Reveal>
        <p className="text-[15px] sm:text-[16px] font-sans text-foreground/80 leading-relaxed mb-16 max-w-2xl ink-line">
          {sponsorIntro}
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Caricamento...</div>
        ) : (
          sponsors?.map((s) => (
            <Reveal key={s.id}>
              <a
                href={s.url || "#"}
                target={s.url ? "_blank" : undefined}
                rel={s.url ? "noopener noreferrer" : undefined}
                className={`group block border bg-card p-5 metallic-sheen hover:border-primary transition-colors ${LEVEL_STYLES[s.livello] || LEVEL_STYLES.Bronze}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] border px-2 py-0.5">{s.livello}</span>
                  {s.url && <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />}
                </div>
                {s.logo && (
                  <div className="h-16 mb-4 flex items-center justify-center bg-[#0a0a0a] border border-border/50">
                    <img src={s.logo} alt={s.nome} className="max-h-full max-w-full object-contain p-2" />
                  </div>
                )}
                <h3 className="font-serif text-[32px] leading-none text-foreground bebas mb-2">{s.nome}</h3>
                <p className="text-[13px] font-sans text-muted-foreground leading-relaxed">{s.descrizione}</p>
              </a>
            </Reveal>
          ))
        )}
      </div>

      <Reveal>
        <div className="border border-border bg-card p-6 sm:p-8 metallic-sheen">
          <div className="flex items-center gap-3 mb-4">
            <div className="border border-primary p-2">
              <Mail size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary">DIVENTA SPONSOR</span>
              <h2 className="font-serif text-[32px] sm:text-[40px] leading-none text-foreground bebas">{ctaTitolo}</h2>
            </div>
          </div>
          <p className="text-[14px] font-sans text-foreground/80 leading-relaxed mb-6">
            {ctaTesto} <a href={`mailto:${sponsorEmail}`} className="text-primary hover:underline">{sponsorEmail}</a>
          </p>
          <a
            href={`mailto:${sponsorEmail}`}
            className="inline-block border border-primary text-primary font-sans text-[13px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Contattaci
          </a>
        </div>
      </Reveal>

      <div className="mt-16 flex justify-center">
        <Cross />
      </div>
      <SiteFooter />
    </div>
  );
}
