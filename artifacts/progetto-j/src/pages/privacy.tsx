import { Link } from "wouter";
import { SiteFooter } from "@/components/SiteFooter";

export default function Privacy() {
  return (
    <>
      <main className="min-h-screen px-5 pb-20 pt-28 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
            Torna alla home
          </Link>
          <span className="page-label">INFORMAZIONI LEGALI</span>
          <h1 className="mt-3 font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide text-foreground bebas">
            PRIVACY
          </h1>
          <p className="mt-6 border-l-2 border-primary pl-4 font-sans text-[15px] leading-relaxed text-muted-foreground">
            Questa pagina descrive in modo semplice quali dati vengono raccolti quando usi Progetto J.
          </p>
          <div className="prose prose-invert mt-12 max-w-none font-sans prose-headings:font-serif prose-headings:tracking-wide prose-a:text-primary">
            <h2>Dati del diario</h2>
            <p>I dati del percorso pubblicati sul sito appartengono al progetto editoriale di Progetto J e vengono mostrati come diario documentale.</p>
            <h2>Analytics anonimi</h2>
            <p>Il sito raccoglie statistiche anonime sulle visite, come pagina consultata, dispositivo, orari e durata approssimativa. Nell’area privata queste pageview possono essere raggruppate in sessioni tecniche per ricostruire la sequenza di navigazione, senza nome, email, indirizzo IP o fingerprint. Non viene usato un account pubblico e il tracker non memorizza cookie identificativi.</p>
            <h2>Newsletter e contatti</h2>
            <p>Se invii il tuo indirizzo email o un messaggio tramite i moduli, i dati vengono usati esclusivamente per rispondere alla richiesta o inviare il report richiesto.</p>
            <h2>Richieste</h2>
            <p>Per domande sulla gestione dei dati puoi scrivere all’indirizzo email pubblicato nella pagina Coaching.</p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}