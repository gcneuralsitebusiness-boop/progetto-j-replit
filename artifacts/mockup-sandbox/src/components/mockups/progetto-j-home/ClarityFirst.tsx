import "./_group.css";
import { ArrowRight, BookOpen, ChartNoAxesCombined, CircleCheck } from "lucide-react";

const routes = [
  { icon: BookOpen, title: "Segui il diario", text: "Ogni giorno, ogni dato, senza filtri.", action: "Apri il giorno 105" },
  { icon: ChartNoAxesCombined, title: "Leggi i numeri", text: "Peso, allenamento, sonno e disciplina.", action: "Esplora statistiche" },
  { icon: CircleCheck, title: "Capisci il metodo", text: "Un percorso costruito sui dati, non sulle promesse.", action: "Scopri il protocollo" },
];

export function ClarityFirst() {
  return (
    <main className="pj-home">
      <nav className="pj-nav" aria-label="Navigazione principale">
        <span className="pj-logo">J</span>
        <div className="pj-navlinks">
          <span>Il progetto</span><span>Journaling</span><span>Numeri</span><span>Articoli</span><span>Richiedi accesso</span>
        </div>
        <span className="pj-mobile-menu" aria-label="Apri menu" />
      </nav>

      <section className="relative mx-auto grid max-w-[1040px] items-end gap-10 px-5 pb-12 pt-16 md:min-h-[590px] md:grid-cols-[1fr_auto] md:pb-16">
        <div className="max-w-[620px]">
          <span className="pj-eyebrow">Un esperimento pubblico di 180 giorni</span>
          <h1 className="pj-serif mt-5 text-[clamp(62px,9vw,124px)] leading-[.78]">
            CAMBIARE<br /><span className="text-[#ca1c1c]">CON I DATI.</span>
          </h1>
          <p className="mt-7 max-w-[510px] text-[17px] leading-7 text-[#bbb]">
            Progetto J documenta una trasformazione fisica e mentale giorno dopo giorno:
            allenamento, alimentazione, sonno, lavoro e quello che non ha funzionato.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="pj-button">Entra nel diario <ArrowRight size={15} /></button>
            <button className="pj-button pj-button--quiet">Come funziona</button>
          </div>
        </div>

        <aside className="relative border-l border-[#363636] pl-5 pb-1 md:w-[216px]">
          <span className="pj-eyebrow">Oggi</span>
          <div className="pj-serif mt-3 text-[102px] leading-[.7] text-[#ca1c1c]">105</div>
          <p className="pj-mono mt-4 text-[10px] leading-5 tracking-[.12em] text-[#999]">GIORNI REGISTRATI<br />SU 180 PUBBLICI</p>
          <p className="pj-mono mt-5 text-[11px] tracking-[.08em]"><span className="line-through text-[#777]">130 KG</span> <span className="text-[#ca1c1c]">→</span> <span className="text-[#36ba79]">83 KG</span></p>
        </aside>
      </section>

      <section className="border-y border-[#262626] bg-[#0e0e0e] px-5 py-5">
        <div className="mx-auto max-w-[1040px]">
          <Metrics />
        </div>
      </section>

      <section className="mx-auto max-w-[1040px] px-5 py-16 md:py-20">
        <div className="flex items-end justify-between gap-5">
          <div>
            <span className="pj-eyebrow">Da dove cominciare</span>
            <h2 className="pj-serif mt-3 text-[clamp(46px,6vw,72px)] leading-[.85]">SCEGLI IL TUO PUNTO<br />DI INGRESSO.</h2>
          </div>
          <span className="hidden pb-2 text-right font-mono text-[10px] uppercase tracking-[.16em] text-[#777] md:block">Nessun filtro.<br />Solo contesto.</span>
        </div>

        <div className="mt-10 grid gap-px bg-[#262626] md:grid-cols-3">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <article key={route.title} className="group min-h-[220px] bg-[#101010] p-6 transition-colors hover:bg-[#151515]">
                <Icon size={21} className="text-[#ca1c1c]" strokeWidth={1.5} />
                <h3 className="pj-serif mt-8 text-3xl">{route.title}</h3>
                <p className="mt-3 text-[14px] leading-6 text-[#9b9b9b]">{route.text}</p>
                <button className="mt-7 inline-flex items-center gap-2 border-0 bg-transparent p-0 font-mono text-[10px] uppercase tracking-[.13em] text-[#f4eee2]">
                  {route.action} <ArrowRight size={14} className="text-[#ca1c1c]" />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Metrics() {
  return (
    <div className="pj-metric-grid">
      <div className="pj-metric"><span>GIORNI PUBBLICI</span><strong>105</strong></div>
      <div className="pj-metric"><span>KM PERCORSI</span><strong>186,7</strong></div>
      <div className="pj-metric"><span>KCAL REGISTRATE</span><strong>182K</strong></div>
      <div className="pj-metric"><span>PESO DAL VIA</span><strong><em>−47 KG</em></strong></div>
    </div>
  );
}