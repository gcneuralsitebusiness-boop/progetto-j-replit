import { Link } from "wouter";
import { ArrowLeft, Check } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";

export default function Grazie() {
  const type = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tipo")
    : null;
  const isReport = type === "report";

  return (
    <>
      <main className="min-h-[calc(100vh-5rem)] px-5 pb-20 pt-28 sm:px-6">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col justify-center">
          <span className="page-label">RICEVUTO</span>
          <div className="mt-5 flex items-start gap-5">
            <div className="mt-2 border border-primary p-3 text-primary">
              <Check size={24} />
            </div>
            <h1 className="font-serif text-[clamp(56px,13vw,128px)] leading-[0.82] tracking-wide text-foreground bebas">
              GRAZIE
            </h1>
          </div>
          <p className="mt-8 max-w-xl border-l-2 border-primary pl-4 font-sans text-[15px] leading-relaxed text-muted-foreground">
            {isReport
              ? "La tua email è stata registrata. Quando il report del giorno 180 sarà pronto, riceverai il documento."
              : "Il tuo messaggio è arrivato. Ti risponderemo appena possibile."}
          </p>
          <Link href="/" className="btn-primary mt-8 w-fit">
            <ArrowLeft size={16} /> Torna alla home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}