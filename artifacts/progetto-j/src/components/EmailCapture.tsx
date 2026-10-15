import { useState } from "react";
import { useLocation } from "wouter";

const DEFAULT_INTRO = "Quando finisco, mando il documento completo: tutti i dati, il metodo, cosa ha funzionato e cosa no.";

export function EmailCapture({ intro = DEFAULT_INTRO }: { intro?: string } = {}) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Errore durante l'iscrizione.");
      }
      setLocation("/grazie?tipo=report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'iscrizione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full border-y border-border bg-[#0A0A0A] px-5 py-16">
      <div className="mx-auto max-w-[640px] text-center">
        {submitted ? (
          <p className="font-serif text-[clamp(32px,8vw,48px)] uppercase leading-none text-foreground bebas">
            FATTO. CI SENTIAMO AL GIORNO 180.
          </p>
        ) : (
          <>
            <h2 className="font-serif text-[clamp(32px,8vw,48px)] uppercase leading-none text-foreground bebas">
              IL REPORT DEL GIORNO 180
            </h2>
            <p className="mt-5 font-sans text-[15px] leading-[1.7] text-muted-foreground">
              {intro}
            </p>
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="LA TUA EMAIL"
                aria-label="La tua email"
                className="h-[52px] min-w-0 flex-1 rounded-none border border-[#242424] bg-[#141414] px-4 font-sans text-[13px] uppercase tracking-[0.12em] text-foreground placeholder:text-[#666666] focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[52px] bg-primary px-7 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "INVIO..." : "MANDAMELO"}
              </button>
            </form>
            {error && <p className="mt-3 text-left font-sans text-[12px] text-red-500">{error}</p>}
            <p className="mt-4 text-center font-sans text-[12px] text-[#666666]">Niente spam.</p>
          </>
        )}
      </div>
    </section>
  );
}