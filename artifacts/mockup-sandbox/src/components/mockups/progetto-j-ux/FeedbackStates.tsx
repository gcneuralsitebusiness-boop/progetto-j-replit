import "../progetto-j-home/_group.css";
import { AlertTriangle, ArrowRight, Check, LoaderCircle, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";

type StateCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  tone?: "quiet" | "alert";
};

function StateCard({ eyebrow, title, description, children, tone = "quiet" }: StateCardProps) {
  return (
    <section className={`feedback-card ${tone === "alert" ? "feedback-card--alert" : ""}`}>
      <div className="feedback-card__topline">
        <span className="pj-eyebrow">{eyebrow}</span>
        <span className="pj-mono feedback-card__index">STATO / {tone === "alert" ? "03" : eyebrow === "IN ATTESA" ? "01" : "02"}</span>
      </div>
      <div className="feedback-card__copy">
        <h2 className="pj-serif">{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <StateCard
      eyebrow="IN ATTESA"
      title="Stiamo ricomponendo il diario."
      description="Un momento: prendiamo gli ultimi dati del percorso e li mettiamo in ordine."
    >
      <div className="loading-sheet" aria-label="Caricamento dati">
        <div className="loading-sheet__bar loading-sheet__bar--wide" />
        <div className="loading-sheet__bar loading-sheet__bar--short" />
        <div className="loading-sheet__row">
          <span className="loading-sheet__block" />
          <span className="loading-sheet__block loading-sheet__block--small" />
        </div>
        <div className="loading-sheet__caption pj-mono">
          <LoaderCircle size={13} /> AGGIORNAMENTO IN CORSO
        </div>
      </div>
    </StateCard>
  );
}

function EmptyState() {
  const [added, setAdded] = useState(false);
  return (
    <StateCard
      eyebrow="SPAZIO VUOTO"
      title="Qui comincia la traccia."
      description="Non hai ancora registrato una giornata. Anche una riga basta per lasciare il primo segno."
    >
      <div className="empty-sheet">
        <div className="empty-sheet__number pj-serif">01</div>
        <div className="empty-sheet__rule" />
        <div className="empty-sheet__note">
          <span className="pj-mono">GIORNO 001</span>
          <strong>{added ? "Prima traccia salvata." : "Nessuna nota ancora."}</strong>
        </div>
        <button className="pj-button feedback-button" onClick={() => setAdded(true)}>
          {added ? "REGISTRATA" : "INIZIA ORA"} <ArrowRight size={15} />
        </button>
        {added && <span className="empty-sheet__confirmed"><Check size={14} /> La tua giornata è pronta.</span>}
      </div>
    </StateCard>
  );
}

function ErrorState() {
  const [retrying, setRetrying] = useState(false);
  return (
    <StateCard
      eyebrow="DATI FERMI"
      title="Il diario non risponde."
      description="Il percorso è intatto, ma in questo momento non riusciamo a raggiungerlo. Riprova tra poco."
      tone="alert"
    >
      <div className="error-sheet">
        <div className="error-sheet__mark"><AlertTriangle size={19} /></div>
        <div>
          <span className="pj-mono error-sheet__code">ERRORE 503 / CONNESSIONE</span>
          <p>Ultimo salvataggio verificato alle 08:42.</p>
        </div>
        <button
          className="pj-button pj-button--quiet feedback-button"
          onClick={() => {
            setRetrying(true);
            window.setTimeout(() => setRetrying(false), 900);
          }}
        >
          <RefreshCw size={14} className={retrying ? "feedback-spin" : ""} /> {retrying ? "CONTROLLO" : "RIPROVA"}
        </button>
      </div>
    </StateCard>
  );
}

export function FeedbackStates() {
  return (
    <main className="pj-home feedback-page">
      <header className="feedback-header">
        <div>
          <span className="pj-eyebrow">PROGETTO J / COMPONENTI DI SISTEMA</span>
          <h1 className="pj-serif">Stati che dicono<br /><em>la verità.</em></h1>
        </div>
        <div className="feedback-header__meta pj-mono">
          <span>DIARIO PUBBLICO</span>
          <span>180 GIORNI / 03 STATI</span>
        </div>
      </header>
      <div className="pj-divider" />
      <div className="feedback-intro">
        <p>Quando i dati mancano, l’interfaccia non deve inventare. Deve orientare: cosa sta succedendo, cosa puoi fare, cosa resta al sicuro.</p>
        <span className="pj-mono">LIVELLO 01 — FEEDBACK</span>
      </div>
      <div className="feedback-grid">
        <LoadingState />
        <EmptyState />
        <ErrorState />
      </div>
      <footer className="feedback-footer pj-mono">
        <span><i /> SISTEMA OPERATIVO</span>
        <span>PROGETTO J — 2024</span>
      </footer>
      <style>{`
        .feedback-page { padding: 0 34px 34px; background: #0a0a0a; }
        .feedback-header { width: min(1120px, 100%); margin: 0 auto; padding: 43px 0 34px; display:flex; justify-content:space-between; gap:30px; }
        .feedback-header h1 { margin: 22px 0 0; color:#f4eee2; font-size:clamp(46px,7vw,86px); line-height:.85; text-transform:uppercase; }
        .feedback-header h1 em { color:var(--pj-red); font-style:normal; }
        .feedback-header__meta { display:flex; flex-direction:column; align-items:flex-end; gap:9px; padding-top:7px; color:#6e6e6e; font-size:10px; letter-spacing:.14em; }
        .feedback-intro { width:min(1120px,100%); margin:0 auto; padding:25px 0 29px; display:flex; justify-content:space-between; align-items:flex-end; gap:36px; }
        .feedback-intro p { max-width:520px; margin:0; color:#a3a09a; font-size:14px; line-height:1.6; }
        .feedback-intro .pj-mono { color:#656565; font-size:9px; letter-spacing:.15em; white-space:nowrap; }
        .feedback-grid { width:min(1120px,100%); margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); border:1px solid #262626; }
        .feedback-card { min-height:455px; padding:22px; display:flex; flex-direction:column; border-right:1px solid #262626; background:#101010; }
        .feedback-card:last-child { border-right:0; }
        .feedback-card--alert { background:#120e0e; }
        .feedback-card__topline { display:flex; justify-content:space-between; align-items:center; }
        .feedback-card__index { color:#555; font-size:9px; letter-spacing:.13em; }
        .feedback-card__copy { margin:48px 0 30px; }
        .feedback-card__copy h2 { max-width:250px; margin:0; color:#f4eee2; font-size:31px; line-height:.93; text-transform:uppercase; }
        .feedback-card__copy p { max-width:285px; margin:16px 0 0; color:#898989; font-size:12px; line-height:1.55; }
        .loading-sheet, .empty-sheet, .error-sheet { margin-top:auto; border:1px solid #252525; background:#0b0b0b; }
        .loading-sheet { padding:20px; }
        .loading-sheet__bar, .loading-sheet__block { display:block; background:#1d1d1d; animation:feedback-pulse 1.7s ease-in-out infinite; }
        .loading-sheet__bar { height:12px; margin-bottom:12px; }
        .loading-sheet__bar--wide { width:78%; } .loading-sheet__bar--short { width:42%; }
        .loading-sheet__row { display:flex; gap:10px; margin-top:25px; }
        .loading-sheet__block { height:54px; flex:1; } .loading-sheet__block--small { flex:.56; animation-delay:.2s; }
        .loading-sheet__caption { display:flex; align-items:center; gap:8px; margin-top:19px; color:#666; font-size:9px; letter-spacing:.1em; }
        .empty-sheet { padding:15px 18px 18px; }
        .empty-sheet__number { color:var(--pj-red); font-size:43px; line-height:1; }
        .empty-sheet__rule { height:1px; margin:10px 0 15px; background:#343434; }
        .empty-sheet__note { display:flex; flex-direction:column; gap:8px; }
        .empty-sheet__note span { color:#6d6d6d; font-size:9px; letter-spacing:.14em; } .empty-sheet__note strong { color:#d4d0c6; font-size:13px; font-weight:500; }
        .feedback-button { min-height:40px; width:100%; margin-top:20px; padding:0 15px; justify-content:space-between; font-size:10px; }
        .empty-sheet__confirmed { display:flex; align-items:center; gap:7px; margin-top:14px; color:var(--pj-green); font:10px "JetBrains Mono",monospace; }
        .error-sheet { padding:16px; }
        .error-sheet__mark { width:35px; height:35px; display:grid; place-items:center; color:var(--pj-red); border:1px solid #632323; margin-bottom:17px; }
        .error-sheet__code { color:#c75d5d; font-size:9px; letter-spacing:.12em; }
        .error-sheet p { margin:8px 0 0; color:#888; font-size:11px; line-height:1.45; }
        .error-sheet .feedback-button { margin-top:22px; color:#d9d2c7; }
        .feedback-spin { animation:feedback-spin .75s linear infinite; }
        .feedback-footer { width:min(1120px,100%); margin:20px auto 0; padding-top:19px; display:flex; justify-content:space-between; color:#5d5d5d; font-size:9px; letter-spacing:.14em; }
        .feedback-footer i { display:inline-block; width:6px; height:6px; margin-right:7px; background:var(--pj-green); border-radius:50%; }
        @keyframes feedback-pulse { 50% { opacity:.45; } } @keyframes feedback-spin { to { transform:rotate(360deg); } }
        @media (max-width:760px) { .feedback-page { padding-inline:18px; } .feedback-header { padding-top:30px; flex-direction:column; } .feedback-header__meta { align-items:flex-start; } .feedback-intro { flex-direction:column; align-items:flex-start; gap:18px; } .feedback-grid { grid-template-columns:1fr; } .feedback-card { min-height:380px; border-right:0; border-bottom:1px solid #262626; } .feedback-card:last-child { border-bottom:0; } }
      `}</style>
    </main>
  );
}