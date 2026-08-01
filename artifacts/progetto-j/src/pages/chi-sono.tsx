import { useGetSiteContent } from "@workspace/api-client-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";

const DEFAULTS = {
  chi_sono_bio:
    "Mi chiamo J. Ho 21 anni. Bologna.\n\nDue anni fa pesavo 130 chili ed ero dipendente. Non avevo una direzione — solo il giorno dopo. Ho toccato il fondo. Poi ho smesso di fuggire e ho iniziato a costruire.",
  chi_sono_il_progetto:
    "180 giorni. Documentati. Senza filtri.\n\nNiente motivazione vuota, niente estetica costruita per i social. Solo numeri, sudore, e quello che emerge quando resti solo con te stesso. Se inciampo, lo vedete. I dati sono reali perché la trasformazione è reale.",
  chi_sono_la_motivazione:
    "Il cambiamento nasce dalla disciplina, non dall'ispirazione di un momento.\n\nIl corpo e lo spirito sono legati — forgiando uno, sollevi l'altro. Lo sport da combattimento mi ha insegnato che il corpo regge più di quanto la mente creda. La fede mi ha dato una ragione per continuare quando il corpo non bastava.",
  chi_sono_la_promessa:
    "Non so chi sarò al giorno 180.\n\nSo che sarò onesto nel raccontarlo. Se fallisco, resterà documentato. Ogni mattina mi sveglio con una sola certezza: il lavoro va fatto, senza scuse.",
};

function PhotoBlock({ path }: { path: string | null | undefined }) {
  const url = getPhotoUrl(path ?? null);

  if (url) {
    return (
      <div className="w-full" style={{ maxWidth: 480 }}>
        <img
          src={url}
          alt="J"
          className="w-full object-cover border border-border"
          style={{ height: "clamp(320px, 50vw, 500px)" }}
        />
      </div>
    );
  }

  // Crosshatch placeholder
  return (
    <div
      className="w-full border border-border relative overflow-hidden flex items-center justify-center"
      style={{ maxWidth: 480, height: "clamp(320px, 50vw, 500px)" }}
    >
      {/* crosshatch via SVG pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="crosshatch"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 12 L12 0 M-2 2 L2 -2 M10 14 L14 10"
              stroke="#2a2a2a"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#0a0a0a" />
        <rect width="100%" height="100%" fill="url(#crosshatch)" />
      </svg>
      <span className="relative font-serif text-[clamp(80px,18vw,140px)] text-[#1e1e1e] leading-none select-none bebas">
        J
      </span>
    </div>
  );
}

export default function ChiSono() {
  const { data: content, isLoading, isError } = useGetSiteContent();

  const bio = content?.chi_sono_bio ?? DEFAULTS.chi_sono_bio;
  const progetto = content?.chi_sono_il_progetto ?? DEFAULTS.chi_sono_il_progetto;
  const motivazione = content?.chi_sono_la_motivazione ?? DEFAULTS.chi_sono_la_motivazione;
  const promessa = content?.chi_sono_la_promessa ?? DEFAULTS.chi_sono_la_promessa;

  const sections = [
    { key: "LA STORIA", body: bio },
    { key: "IL PROGETTO", body: progetto },
    { key: "LA MOTIVAZIONE", body: motivazione },
    { key: "LA PROMESSA", body: promessa },
  ];

  if (isError) {
    return (
      <>
        <DataErrorState />
        <SiteFooter />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <span className="text-muted-foreground font-sans uppercase tracking-widest text-[12px] animate-pulse">Caricamento...</span>
        </div>
        <SiteFooter />
      </>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-4xl mx-auto px-5 sm:px-6">
      <Reveal>
        <div className="mb-6">
          <span className="page-label">DOSSIER</span>
          <h1 className="font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide bebas text-foreground mt-2">
            CHI SONO
          </h1>
        </div>
      </Reveal>

      {/* Photo block */}
      <Reveal delay={60}>
        <div className="mb-14">
          <PhotoBlock path={content?.chi_sono_foto} />
        </div>
      </Reveal>

      <div className="space-y-14">
        {sections.map((section, i) => (
          <Reveal key={section.key} delay={i * 80 + 120}>
            <section>
              <h2 className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary mb-4">
                {section.key}
              </h2>
              <p className="text-[16px] sm:text-[17px] font-sans text-foreground/90 leading-[1.8] whitespace-pre-wrap">
                {section.body}
              </p>
            </section>
          </Reveal>
        ))}

        <Reveal delay={440}>
          <div className="border border-primary bg-card p-8 sm:p-10 metallic-sheen text-center">
            <Cross className="mx-auto mb-4" />
            <span className="font-serif text-[clamp(36px,8vw,64px)] leading-none text-primary bebas tracking-wide">
              IC XC NIKA
            </span>
          </div>
        </Reveal>
      </div>
      <SiteFooter />
    </div>
  );
}
