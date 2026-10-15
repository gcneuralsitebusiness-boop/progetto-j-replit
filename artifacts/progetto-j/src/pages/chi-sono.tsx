import { Fragment } from "react";
import { useGetSiteContent } from "@workspace/api-client-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { Reveal } from "@/components/Reveal";
import { AccessoBlock } from "@/components/AccessoBlock";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { ChiJourneyMap } from "@/components/chi/ChiJourneyMap";
import "@/styles/editorial.css";

const DEFAULTS = {
  chi_sono_il_progetto:
    "180 giorni. Tutti documentati. Peso, battito, sonno, soldi, allenamento. Pubblicati ogni giorno sul sito con i dati reali.\n\nNessun filtro sull'immagine. Nessuna storia costruita a posteriori. Se un giorno vado male, lo scrivo. Se un giorno non mi alleno, è nel tracking. Se guadagno poco, è nei numeri.\n\nLa trasformazione è reale perché i dati sono reali. Ogni altra versione è marketing.",
  chi_sono_la_motivazione:
    "Non l'ho fatto per i follower. Non l'ho fatto per dimostrare niente a nessuno.\n\nL'ho fatto perché dove ero prima ho pregato per tutto questo. Per alzarmi la mattina e avere qualcosa da fare. Per sentire la fatica nel corpo invece di quell'altra cosa. Per avere una direzione invece di un solo giorno dopo.\n\nLa fede ortodossa è il centro. Il resto — MMA, Muay Thai, BJJ, il lavoro, il business — è la struttura che la fede regge.",
  chi_sono_la_promessa:
    "Non so chi sarò al giorno 180.\n\nSo che sarà documentato. Ogni errore, ogni giorno perso, ogni numero che va nella direzione sbagliata — resterà sul sito.\n\nSe fallisco, lo sapete.\nSe ce la faccio, lo sapete.\n\nIC XC NIKA",
};

const STORY_PARAGRAPHS = [
  "Mi chiamo J, ho 21 anni, vivo vicino a Bologna.",
  "Pesavo 130 chili ed ero dipendente.",
  "Ho smesso e sono entrato in una palestra.",
  "Il primo giorno ho vomitato dopo sei minuti.",
  "Sono tornato il giorno dopo.",
  "Oggi lavoro in quota: antenne, tralicci, tratte radio in tutto il nord Italia.",
  "La sera mi alleno. K1, MMA, BJJ.",
  "Sono cristiano ortodosso. Firmo ogni giorno IC XC NIKA.",
];

const PUBLIC_REASON =
  "Avere gente che guarda è il motivo per non essere pigro. Mi serve lo sguardo addosso, non il giudizio. Voglio dimostrare che i social possono migliorare le persone invece di far perdere tempo.";

const SEASONS = [
  { id: 1, label: "STAGIONE 1", title: "180 GIORNI PER CAMBIARE VITA", body: "Togliere quello che mi stava uccidendo.", accent: "#B81D1D", tag: null },
  { id: 2, label: "STAGIONE 2", title: "180 GIORNI PER MIGLIORARLA", body: "Corpo, soldi, testa. Ogni settimana deve battere la precedente.", accent: "var(--season, #3FA34D)", tag: "IN ARRIVO" },
];

function HeroBlock({ path }: { path: string | null | undefined }) {
  const url = getPhotoUrl(path ?? null);
  return (
    <div className="relative left-1/2 mb-16 w-screen -translate-x-1/2 overflow-hidden" style={{ height: "clamp(420px, 65vh, 640px)" }}>
      {url ? (
        <img src={url} alt="J" className="absolute inset-0 h-full w-full object-cover object-top grayscale" />
      ) : (
        <div className="absolute inset-0 crosshatch opacity-30" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-4xl px-5 pb-10 sm:px-6">
        <span className="pj-mono text-[13px] uppercase tracking-[0.2em] text-[#C9C4BD]">DOSSIER</span>
        <h1 className="mt-3 font-serif bebas uppercase text-[clamp(72px,16vw,140px)] leading-[0.82] text-[#E8E4DE]">
          CHI<br />SONO
        </h1>
        <p className="mt-4 pj-mono text-[13px] uppercase tracking-[0.2em] text-[#C9C4BD]">Bologna · 21 anni · IC XC NIKA</p>
      </div>
    </div>
  );
}

function SectionShell({ index, title, children, testId }: { index: number; title: string; children: React.ReactNode; testId?: string }) {
  return (
    <section className="grid grid-cols-1 gap-x-10 border-t border-[#1A1A1A] py-12 md:grid-cols-[160px_1fr]" data-testid={testId}>
      <div className="self-start mb-6 md:sticky md:top-24 md:mb-0">
        <div className="select-none pj-mono text-[clamp(40px,7vw,64px)] leading-none text-[#2A2A2A]">{String(index).padStart(2, "0")}</div>
        <h2 className="mt-3 font-serif bebas text-[28px] leading-none text-[#E8E4DE]">{title}</h2>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const bodyCls = "font-sans text-[17px] leading-[1.75] text-[#E8E4DE]/85";

export default function ChiSono() {
  const { data: content, isLoading, isError } = useGetSiteContent();

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
        <div className="min-h-[100dvh] pt-28 max-w-4xl mx-auto px-5 animate-pulse" aria-label="Caricamento">
          <div className="h-[50vh] bg-[#111]" />
          <div className="mt-12 space-y-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-4 bg-[#141414]" style={{ width: `${88 - i * 9}%` }} />)}</div>
        </div>
        <SiteFooter />
      </>
    );
  }

  const editable = [
    { key: "IL PROGETTO", body: content?.chi_sono_il_progetto ?? DEFAULTS.chi_sono_il_progetto },
    { key: "LA MOTIVAZIONE", body: content?.chi_sono_la_motivazione ?? DEFAULTS.chi_sono_la_motivazione },
    { key: "LA PROMESSA", body: content?.chi_sono_la_promessa ?? DEFAULTS.chi_sono_la_promessa },
  ];

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 max-w-4xl mx-auto px-5 sm:px-6 overflow-x-hidden">
      <HeroBlock path={content?.chi_sono_foto} />

      <Reveal>
        <SectionShell index={1} title="LA STORIA" testId="section-chi-story">
          <div className={`space-y-5 ${bodyCls}`}>
            {STORY_PARAGRAPHS.map((p, i) => <p key={p} data-testid={`text-story-${i}`}>{p}</p>)}
          </div>
        </SectionShell>
      </Reveal>

      <Reveal>
        <SectionShell index={2} title="PERCHÉ È PUBBLICO" testId="section-chi-public-reason">
          <p className="font-serif bebas text-[clamp(30px,5vw,44px)] leading-[1] text-[#E8E4DE] border-l-[3px] border-[#B81D1D] pl-6">
            {PUBLIC_REASON}
          </p>
        </SectionShell>
      </Reveal>

      <Reveal>
        <SectionShell index={3} title="LE STAGIONI" testId="section-chi-seasons">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {SEASONS.map((s) => (
              <div key={s.id} className="pj-season" style={{ ["--accent" as string]: s.accent }} data-testid={`card-season-${s.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="pj-mono text-[13px] uppercase tracking-[0.2em]" style={{ color: s.accent }}>{s.label}</span>
                  {s.tag && <span className="pj-mono text-[13px] uppercase tracking-[0.18em] border px-2 py-0.5" style={{ color: s.accent, borderColor: s.accent }}>{s.tag}</span>}
                </div>
                <h3 className="mt-5 font-serif bebas text-[clamp(32px,4.5vw,40px)] leading-[0.95] text-[#E8E4DE]">{s.title}</h3>
                <p className="mt-4 font-sans text-[16px] leading-[1.6] text-[#E8E4DE]/80">{s.body}</p>
              </div>
            ))}
          </div>
        </SectionShell>
      </Reveal>

      {editable.map((section, i) => (
        <Fragment key={section.key}>
          <Reveal>
            <SectionShell index={i + 4} title={section.key}>
              <p className={`whitespace-pre-wrap ${bodyCls}`}>{section.body}</p>
            </SectionShell>
          </Reveal>
        </Fragment>
      ))}

      <div className="border-t-2 border-[#B81D1D] py-12 text-center">
        <span className="block font-serif bebas text-[clamp(48px,10vw,88px)] leading-none text-[#B81D1D]">IC XC NIKA</span>
        <p className="mt-4 pj-mono text-[13px] uppercase tracking-[0.25em] text-[#C9C4BD]">Cristo vince · sempre</p>
      </div>

      <div className="mt-4">
        <AccessoBlock />
      </div>

      <div className="mt-16">
        <ChiJourneyMap />
      </div>
      <SiteFooter />
    </div>
  );
}
