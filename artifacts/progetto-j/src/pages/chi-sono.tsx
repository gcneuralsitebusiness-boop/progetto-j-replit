import { Fragment } from "react";
import { useGetSiteContent } from "@workspace/api-client-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { AccessoBlock } from "@/components/AccessoBlock";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";

const DEFAULTS = {
  chi_sono_il_progetto:
    "180 giorni. Tutti documentati. Peso, battito, sonno, soldi, allenamento. Pubblicati ogni giorno sul sito con i dati reali.\n\nNessun filtro sull'immagine. Nessuna storia costruita a posteriori. Se un giorno vado male, lo scrivo. Se un giorno non mi alleno, è nel tracking. Se guadagno poco, è nei numeri.\n\nLa trasformazione è reale perché i dati sono reali. Ogni altra versione è marketing.",
  chi_sono_la_motivazione:
    "Non l'ho fatto per i follower. Non l'ho fatto per dimostrare niente a nessuno.\n\nL'ho fatto perché dove ero prima ho pregato per tutto questo. Per alzarmi la mattina e avere qualcosa da fare. Per sentire la fatica nel corpo invece di quell'altra cosa. Per avere una direzione invece di un solo giorno dopo.\n\nLa fede ortodossa è il centro. Il resto — MMA, Muay Thai, BJJ, il lavoro, il business — è la struttura che la fede regge.",
  chi_sono_la_promessa:
    "Non so chi sarò al giorno 180.\n\nSo che sarà documentato. Ogni errore, ogni giorno perso, ogni numero che va nella direzione sbagliata — resterà sul sito.\n\nSe fallisco, lo sapete.\nSe ce la faccio, lo sapete.\n\nIC XC NIKA",
};

const STORY_PARAGRAPHS = [
  "Mi chiamo J, ho 21 anni, vivo a Bologna.",
  "Due anni fa pesavo 130 chili ed ero dipendente.",
  "Nessuno mi ha salvato. Nessun programma, nessuna clinica.",
  "Ho smesso e sono entrato in una palestra.",
  "Il primo giorno ho vomitato dopo sei minuti.",
  "Sono tornato il giorno dopo.",
];

function HeroBlock({ path }: { path: string | null | undefined }) {
  const url = getPhotoUrl(path ?? null);

  return (
    <div
      className="relative left-1/2 mb-16 w-screen -translate-x-1/2 overflow-hidden"
      style={{ height: "clamp(420px, 65vh, 640px)" }}
    >
      {url ? (
        <img
          src={url}
          alt="J"
          className="absolute inset-0 h-full w-full object-cover object-top grayscale-[15%]"
        />
      ) : (
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="xhatch" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M0 12 L12 0 M-2 2 L2 -2 M10 14 L14 10" stroke="#2a2a2a" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0a0a0a" />
          <rect width="100%" height="100%" fill="url(#xhatch)" />
        </svg>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-4xl px-5 pb-10 sm:px-6">
        <span className="page-label">DOSSIER</span>
        <h1 className="mt-3 font-serif text-[clamp(72px,16vw,140px)] leading-[0.82] tracking-wide text-foreground bebas uppercase">
          CHI<br />SONO
        </h1>
        <p className="mt-4 font-sans text-[13px] uppercase tracking-[0.2em] text-muted-foreground">
          Bologna · 21 anni · Giorno in corso
        </p>
      </div>
    </div>
  );
}

export default function ChiSono() {
  const { data: content, isLoading, isError } = useGetSiteContent();

  const progetto = content?.chi_sono_il_progetto ?? DEFAULTS.chi_sono_il_progetto;
  const motivazione = content?.chi_sono_la_motivazione ?? DEFAULTS.chi_sono_la_motivazione;
  const promessa = content?.chi_sono_la_promessa ?? DEFAULTS.chi_sono_la_promessa;

  const sections = [
    { key: "LA STORIA", body: STORY_PARAGRAPHS.join("\n\n") },
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
    <div className="min-h-screen pt-28 pb-20 max-w-4xl mx-auto px-5 sm:px-6">
      <HeroBlock path={content?.chi_sono_foto} />

      <div className="grid grid-cols-1 gap-0 max-w-4xl mx-auto">
        {sections.map((section, i) => (
          <Fragment key={section.key}>
            <Reveal delay={i * 80}>
              <section className="grid grid-cols-1 gap-x-10 border-t border-iron py-12 md:grid-cols-[160px_1fr]">
                <div className="self-start mb-6 md:sticky md:top-24 md:mb-0">
                  <div className="select-none font-serif text-[clamp(56px,9vw,88px)] leading-none text-iron/20 bebas">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h2 className="mt-2 font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {section.key}
                  </h2>
                </div>
                <div>
                  {i === 0 ? (
                    <div className="space-y-5 font-sans text-[16px] leading-[1.85] text-foreground/85 sm:text-[17px]">
                      {STORY_PARAGRAPHS.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-sans text-[16px] leading-[1.85] text-foreground/85 sm:text-[17px]">
                      {section.body}
                    </p>
                  )}
                </div>
              </section>
            </Reveal>

            {i === 0 && (
              <div className="my-4 border-l-4 border-primary py-4 pl-6">
                <p className="max-w-2xl font-serif text-[clamp(22px,4vw,32px)] leading-[1.2] tracking-wide text-foreground bebas uppercase">
                  "Se inciampo, lo vedete. I dati sono reali perché la trasformazione è reale."
                </p>
              </div>
            )}

            {i === 2 && (
              <div className="my-4 border-l-4 border-primary py-4 pl-6">
                <p className="max-w-2xl font-serif text-[clamp(22px,4vw,32px)] leading-[1.2] tracking-wide text-foreground bebas uppercase">
                  "La fede ortodossa è il centro. Il resto è la struttura che la fede regge."
                </p>
              </div>
            )}
          </Fragment>
        ))}

        <Reveal delay={400}>
          <div className="mt-6 border-t-2 border-primary pb-16 pt-10 text-center">
            <Cross className="mx-auto mb-6" />
            <span className="block font-serif text-[clamp(48px,10vw,88px)] leading-none tracking-wide text-primary bebas">
              IC XC NIKA
            </span>
            <p className="mt-4 font-sans text-[12px] uppercase tracking-[0.25em] text-muted-foreground">
              Cristo vince · sempre
            </p>
          </div>
        </Reveal>
      </div>
      <div className="mt-10">
        <AccessoBlock />
      </div>
      <SiteFooter />
    </div>
  );
}
