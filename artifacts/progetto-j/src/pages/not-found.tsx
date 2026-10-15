import { Link } from "wouter";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <main className="min-h-[calc(100vh-5rem)] px-5 pb-20 pt-28 sm:px-6">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col justify-center">
          <span className="page-label">ERRORE 404</span>
          <div className="mt-5 flex items-start gap-4">
            <h1 className="font-serif text-[clamp(64px,16vw,160px)] leading-[0.8] tracking-wide text-foreground bebas">
              PAGINA<br />NON TROVATA
            </h1>
          </div>
          <p className="mt-8 max-w-lg border-l-2 border-primary pl-4 font-sans text-[15px] leading-relaxed text-muted-foreground">
            Questo percorso non esiste o non è più disponibile. Torna al diario e continua da lì.
          </p>
          <Link href="/" className="btn-primary mt-8 w-fit">
            Torna alla home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
