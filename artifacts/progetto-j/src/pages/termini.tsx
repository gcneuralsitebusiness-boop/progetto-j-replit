import { Link } from "wouter";
import { SiteFooter } from "@/components/SiteFooter";

export default function Termini() {
  return (
    <>
      <main className="min-h-screen px-5 pb-20 pt-28 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
            Torna alla home
          </Link>
          <span className="page-label">INFORMAZIONI LEGALI</span>
          <h1 className="mt-3 font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide text-foreground bebas">
            TERMINI
          </h1>
          <p className="mt-6 border-l-2 border-primary pl-4 font-sans text-[15px] leading-relaxed text-muted-foreground">
            Regole essenziali per consultare e condividere i contenuti di Progetto J.
          </p>
          <div className="prose prose-invert mt-12 max-w-none font-sans prose-headings:font-serif prose-headings:tracking-wide prose-a:text-primary">
            <h2>Uso dei contenuti</h2>
            <p>Il diario, gli articoli e le grafiche sono pubblicati per documentare un percorso personale. Puoi consultarli e condividere i link mantenendo il riferimento al progetto.</p>
            <h2>Informazioni non mediche</h2>
            <p>I contenuti e le statistiche non costituiscono diagnosi, prescrizioni mediche o garanzia di risultati. Ogni persona deve valutare il proprio percorso con professionisti qualificati quando necessario.</p>
            <h2>Disponibilità del sito</h2>
            <p>Il sito può essere aggiornato, sospeso o modificato per manutenzione. I dati storici pubblicati possono essere corretti o integrati nel tempo.</p>
            <h2>Contatti</h2>
            <p>Per richieste sui contenuti o sulle collaborazioni puoi usare i recapiti e i moduli presenti nelle pagine Social e Coaching.</p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}