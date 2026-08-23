import "../progetto-j-home/_group.css";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock3, Mail, ShieldCheck } from "lucide-react";

type Fit = "si" | "no" | null;

const fitQuestions = [
  "Hai già iniziato a raccogliere dati su di te, ma non sai come usarli?",
  "Sei disposto a seguire un piano per 12 settimane, anche quando la motivazione cala?",
  "Cerchi un confronto diretto, non una lista di consigli generici?",
];

const deliverables = [
  ["01", "Lettura iniziale", "Partiamo dai tuoi numeri: peso, sonno, movimento, alimentazione e contesto reale."],
  ["02", "Piano settimanale", "Una direzione concreta, con poche azioni misurabili e adattate al tuo punto di partenza."],
  ["03", "Controllo continuo", "Ogni settimana guardiamo cosa è successo, correggiamo il tiro e decidiamo il prossimo passo."],
];

export function CoachingPath() {
  const [answers, setAnswers] = useState<Fit[]>([null, null, null]);
  const [requested, setRequested] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const answered = answers.filter(Boolean).length;
  const isReady = answered === 3;
  const fits = answers.every((answer) => answer === "si");

  const updateAnswer = (index: number, answer: Fit) => {
    setAnswers((current) => current.map((item, i) => (i === index ? answer : item)));
    setRequested(false);
  };

  return (
    <main className="pj-home" style={{ minHeight: "100dvh" }}>
      <nav className="pj-nav">
        <div className="pj-logo">PJ<span style={{ color: "var(--pj-ink)" }}>180</span></div>
        <div className="pj-navlinks"><span>DIARIO</span><span>DATI</span><span>COACHING</span></div>
        <div className="pj-mobile-menu" aria-label="Apri menu" />
      </nav>

      <div style={{ width: "min(1040px, calc(100% - 40px))", margin: "0 auto", padding: "44px 0 72px" }}>
        <header style={{ maxWidth: 790, animation: "pj-rise .6s ease both" }}>
          <span className="pj-eyebrow">ACCESSO SU RICHIESTA / 12 SETTIMANE</span>
          <h1 className="pj-serif" style={{ fontSize: "clamp(64px, 11vw, 142px)", lineHeight: .82, margin: "20px 0 22px", maxWidth: 770 }}>
            NON TI SERVE<br /><span style={{ color: "var(--pj-red)" }}>PIÙ VOLONTÀ.</span>
          </h1>
          <p style={{ color: "#c4c0b7", fontSize: 17, lineHeight: 1.65, maxWidth: 600, margin: 0 }}>
            Ti serve un sistema che regga anche nelle settimane storte. Il coaching di Progetto J trasforma il tuo diario in decisioni precise, senza promesse facili.
          </p>
        </header>

        <section style={{ marginTop: 52, borderTop: "1px solid var(--pj-line)", paddingTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 18 }}>
            <div>
              <span className="pj-eyebrow">PRIMA DI SCRIVERE</span>
              <h2 className="pj-serif" style={{ fontSize: 36, lineHeight: .95, margin: "11px 0 0" }}>È IL MOMENTO GIUSTO?</h2>
            </div>
            <span className="pj-mono" style={{ color: "var(--pj-muted)", fontSize: 10 }}>{answered}/3 RISPOSTE</span>
          </div>

          <div style={{ border: "1px solid var(--pj-line)", background: "var(--pj-surface)" }}>
            {fitQuestions.map((question, index) => (
              <div key={question} style={{ borderBottom: index < 2 ? "1px solid var(--pj-line)" : "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "42px 1fr auto", alignItems: "center", gap: 14, padding: "18px 20px" }}>
                  <span className="pj-mono" style={{ color: "var(--pj-red)", fontSize: 12 }}>0{index + 1}</span>
                  <span style={{ color: "var(--pj-ink)", fontSize: 14, lineHeight: 1.45 }}>{question}</span>
                  <div style={{ display: "flex", gap: 7 }}>
                    {(["si", "no"] as const).map((value) => (
                      <button key={value} onClick={() => updateAnswer(index, value)} style={{
                        border: `1px solid ${answers[index] === value ? (value === "si" ? "var(--pj-green)" : "var(--pj-red)") : "#444"}`,
                        background: answers[index] === value ? (value === "si" ? "rgba(54,186,121,.12)" : "rgba(202,28,28,.12)") : "transparent",
                        color: answers[index] === value ? (value === "si" ? "var(--pj-green)" : "#e56a6a") : "#878787",
                        padding: "9px 12px", font: "600 10px JetBrains Mono, monospace", letterSpacing: ".1em", cursor: "pointer",
                      }}>{value === "si" ? "SÌ" : "NO"}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {isReady && !fits && (
            <p style={{ color: "#db8585", fontSize: 12, lineHeight: 1.5, margin: "12px 0 0" }}>
              Nessun problema. Il coaching funziona quando c’è spazio per mettersi in gioco. Puoi continuare il diario e tornare qui più avanti.
            </p>
          )}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.08fr) minmax(280px, .92fr)", gap: 46, marginTop: 62 }}>
          <div>
            <span className="pj-eyebrow">COSA SUCCEDE DENTRO</span>
            <h2 className="pj-serif" style={{ fontSize: 50, lineHeight: .88, margin: "14px 0 28px" }}>UN METODO<br />CHE SI VEDE.</h2>
            <div>
              {deliverables.map(([number, title, text], index) => (
                <div key={number} style={{ display: "grid", gridTemplateColumns: "42px 1fr 22px", gap: 12, padding: "18px 0", borderTop: "1px solid var(--pj-line)" }}>
                  <span className="pj-mono" style={{ color: "var(--pj-red)", fontSize: 11 }}>{number}</span>
                  <div>
                    <button onClick={() => setOpen(open === index ? null : index)} style={{ border: 0, padding: 0, background: "none", color: "var(--pj-ink)", cursor: "pointer", textAlign: "left", font: "600 14px Inter, sans-serif" }}>{title}</button>
                    {open === index && <p style={{ color: "var(--pj-muted)", fontSize: 13, lineHeight: 1.6, margin: "9px 0 0", maxWidth: 430 }}>{text}</p>}
                  </div>
                  <ChevronDown size={16} style={{ color: "var(--pj-muted)", transform: open === index ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </div>
              ))}
            </div>
          </div>

          <aside style={{ border: "1px solid var(--pj-red)", padding: 25, alignSelf: "start", background: "linear-gradient(135deg, rgba(202,28,28,.08), transparent 65%)" }}>
            <span className="pj-eyebrow">LA PROMESSA</span>
            <p className="pj-serif" style={{ fontSize: 34, lineHeight: .95, margin: "18px 0 22px" }}>NON TI LASCIO<br /><span style={{ color: "var(--pj-red)" }}>SOLO CON I DATI.</span></p>
            <div className="pj-divider" style={{ marginBottom: 18 }} />
            <div style={{ display: "flex", gap: 10, alignItems: "start", marginBottom: 16 }}>
              <Clock3 size={16} color="var(--pj-red)" />
              <span style={{ color: "#b6b2aa", fontSize: 12, lineHeight: 1.5 }}>Check-in ogni settimana, con un punto chiaro da cui ripartire.</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
              <ShieldCheck size={16} color="var(--pj-red)" />
              <span style={{ color: "#b6b2aa", fontSize: 12, lineHeight: 1.5 }}>Numeri onesti. Nessun protocollo copia-incolla.</span>
            </div>
          </aside>
        </section>

        <section style={{ marginTop: 64, padding: "27px 0 0", borderTop: "1px solid var(--pj-line)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 26, alignItems: "center" }}>
            <div style={{ maxWidth: 550 }}>
              <span className="pj-eyebrow">IL PROSSIMO PASSO</span>
              <h2 className="pj-serif" style={{ fontSize: 42, lineHeight: .9, margin: "13px 0 12px" }}>PARLIAMONE<br />SENZA FILTRI.</h2>
              <p style={{ color: "var(--pj-muted)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>Scrivimi con due righe su dove sei oggi. Ti rispondo personalmente entro 48 ore: se non è il percorso giusto, te lo dico.</p>
            </div>
            <div style={{ minWidth: 250 }}>
              {requested ? (
                <div style={{ border: "1px solid var(--pj-green)", padding: 18, color: "var(--pj-green)", fontSize: 13, lineHeight: 1.5 }}>
                  <Check size={18} style={{ verticalAlign: "middle", marginRight: 8 }} /> Richiesta ricevuta. Controlla la tua inbox.
                </div>
              ) : (
                <button disabled={!fits} onClick={() => setRequested(true)} className="pj-button" style={{ width: "100%", opacity: fits ? 1 : .42, cursor: fits ? "pointer" : "not-allowed" }}>
                  {fits ? "Richiedi accesso" : "Completa il check-in"} <ArrowRight size={15} style={{ marginLeft: 10 }} />
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#777", fontSize: 10, marginTop: 12 }}>
                <Mail size={13} /> Risposta personale, non automatica
              </div>
            </div>
          </div>
        </section>
      </div>
      <style>{`@keyframes pj-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } } @media (max-width: 700px) { .pj-home section[style*="grid-template-columns"] { grid-template-columns: 1fr !important; gap: 34px !important; } .pj-home h1 { font-size: 68px !important; } .pj-home section > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; } .pj-home section > div[style*="grid-template-columns"] > div:last-child { min-width: 100%; } }`}</style>
    </main>
  );
}