import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";

type FormValues = {
  nome: string;
  contatto: string;
  progetto: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = { nome: "", contatto: "", progetto: "" };

function isValidContact(value: string) {
  const contact = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    || contact.startsWith("@")
    || /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(contact);
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.nome.trim()) errors.nome = "Inserisci il tuo nome.";
  if (!values.contatto.trim()) errors.contatto = "Inserisci un contatto.";
  else if (!isValidContact(values.contatto)) errors.contatto = "Inserisci un'email o un contatto valido.";
  if (values.progetto.trim().length < 100) errors.progetto = "Racconta almeno 100 caratteri.";
  return errors;
}

export function AccessoBlock() {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ nome: true, contatto: true, progetto: true });
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/candidature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: values.nome.trim(),
          contatto: values.contatto.trim(),
          progetto: values.progetto.trim(),
        }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || "Non è stato possibile inviare la richiesta. Riprova.");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Non è stato possibile inviare la richiesta. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Reveal>
      <section id="accesso" className="accesso-block bracket-corners">
        <div className="max-w-3xl">
          {isSubmitted ? (
            <div className="accesso-form-enter py-3" role="status">
              <span className="font-mono text-[12px] tracking-[0.2em] text-primary">ACCESSO SU RICHIESTA</span>
              <h2 className="mt-5 font-serif text-[clamp(46px,8vw,76px)] leading-[0.85] text-foreground bebas">RICHIESTA RICEVUTA</h2>
              <p className="mt-5 max-w-xl font-sans text-[16px] leading-relaxed text-foreground/70">Se quello che stai costruendo ha senso, ti contatto io.</p>
              <p className="mt-8 font-mono text-[11px] tracking-[0.15em] text-foreground/35">IC XC NIKA</p>
            </div>
          ) : (
            <>
              <span className="font-mono text-[12px] tracking-[0.2em] text-primary">ACCESSO SU RICHIESTA</span>
              <h2 className="mt-5 max-w-3xl font-serif text-[clamp(46px,8vw,76px)] leading-[0.85] text-foreground bebas">PROGETTO J NON CERCA FOLLOWER</h2>
              <p className="mt-5 max-w-xl font-sans text-[16px] leading-relaxed text-foreground/70">
                Un gruppo chiuso di persone che stanno costruendo qualcosa e hanno la disciplina per portarlo a terra.
              </p>
              <p className="mt-7 font-mono text-[13px] tracking-[0.15em] text-foreground/50">BUSINESS · CRESCITA · SPORT</p>
              <p className="mt-5 font-sans text-[16px] text-foreground">Lascia i tuoi dati. Ti contatto io.</p>

              {!isOpen ? (
                <div className="mt-8">
                  <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
                    VEDIAMO SE HA SENSO
                  </button>
                  <p className="mt-4 font-mono text-[11px] tracking-[0.12em] text-foreground/35">Non tutti ricevono risposta.</p>
                </div>
              ) : (
                <form className="accesso-form-enter mt-8 max-w-2xl space-y-6" noValidate onSubmit={submit}>
                  <div>
                    <label htmlFor="accesso-nome" className="accesso-label">NOME</label>
                    <input
                      id="accesso-nome"
                      value={values.nome}
                      onChange={(event) => updateField("nome", event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, nome: true }))}
                      maxLength={60}
                      autoComplete="name"
                      className="accesso-input"
                      aria-invalid={Boolean(touched.nome && errors.nome)}
                      aria-describedby={touched.nome && errors.nome ? "accesso-nome-error" : undefined}
                    />
                    {touched.nome && errors.nome && <p id="accesso-nome-error" className="accesso-error">{errors.nome}</p>}
                  </div>

                  <div>
                    <label htmlFor="accesso-contatto" className="accesso-label">CONTATTO</label>
                    <input
                      id="accesso-contatto"
                      value={values.contatto}
                      onChange={(event) => updateField("contatto", event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, contatto: true }))}
                      maxLength={120}
                      autoComplete="email"
                      placeholder="Instagram o email"
                      className="accesso-input"
                      aria-invalid={Boolean(touched.contatto && errors.contatto)}
                      aria-describedby={touched.contatto && errors.contatto ? "accesso-contatto-error" : undefined}
                    />
                    {touched.contatto && errors.contatto && <p id="accesso-contatto-error" className="accesso-error">{errors.contatto}</p>}
                  </div>

                  <div>
                    <label htmlFor="accesso-progetto" className="accesso-label">COSA STAI COSTRUENDO ADESSO?</label>
                    <textarea
                      id="accesso-progetto"
                      value={values.progetto}
                      onChange={(event) => updateField("progetto", event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, progetto: true }))}
                      minLength={100}
                      maxLength={800}
                      rows={5}
                      className="accesso-input resize-y"
                      aria-invalid={Boolean(touched.progetto && errors.progetto)}
                      aria-describedby="accesso-progetto-counter"
                    />
                    <p id="accesso-progetto-counter" className={`mt-2 font-mono text-[11px] tracking-[0.1em] ${values.progetto.trim().length < 100 ? "text-primary" : "text-foreground/40"}`}>
                      {values.progetto.trim().length} / 100 minimo
                    </p>
                    {touched.progetto && errors.progetto && <p className="accesso-error">{errors.progetto}</p>}
                  </div>

                  <button type="submit" disabled={!isValid || isSubmitting} className="btn-primary disabled:cursor-not-allowed disabled:opacity-30">
                    {isSubmitting ? "INVIO IN CORSO" : "INVIA RICHIESTA"}
                  </button>
                  {submitError && <p className="font-mono text-[11px] tracking-[0.08em] text-primary" role="alert">{submitError}</p>}
                  <p className="font-mono text-[11px] leading-relaxed tracking-[0.08em] text-foreground/40">
                    Inviando accetti il trattamento dei dati per essere ricontattato. <Link href="/privacy" className="underline decoration-primary underline-offset-4 hover:text-foreground">Privacy</Link>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </Reveal>
  );
}