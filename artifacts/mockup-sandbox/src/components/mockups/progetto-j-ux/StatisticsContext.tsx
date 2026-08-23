import { useMemo, useState } from "react";
import "../progetto-j-home/_group.css";
import "./StatisticsContext.css";

type PeriodKey = "7G" | "30G" | "180G";

const periods: Record<PeriodKey, {
  label: string;
  range: string;
  days: string;
  completed: string;
  weight: string;
  delta: string;
  sleep: string;
  sessions: string;
  insight: string;
  note: string;
  bars: number[];
}> = {
  "7G": {
    label: "Ultimi 7 giorni",
    range: "12 — 18 AGO 2026",
    days: "7 / 7",
    completed: "100%",
    weight: "−1,4 kg",
    delta: "−0,7 kg / settimana",
    sleep: "7h 18m",
    sessions: "4",
    insight: "Settimana solida. Il volume resta alto mentre il recupero sale.",
    note: "Il dato più recente pesa di più nella lettura di questa finestra.",
    bars: [72, 86, 54, 79, 91, 68, 88],
  },
  "30G": {
    label: "Ultimi 30 giorni",
    range: "20 LUG — 18 AGO 2026",
    days: "27 / 30",
    completed: "90%",
    weight: "−3,8 kg",
    delta: "−0,9 kg / settimana",
    sleep: "6h 52m",
    sessions: "16",
    insight: "La traiettoria è netta: più costanza, meno peso, nessun crollo nel sonno.",
    note: "Confronto con i 30 giorni precedenti. Non è una previsione.",
    bars: [46, 59, 63, 55, 75, 71, 64, 82, 77, 88, 69, 91],
  },
  "180G": {
    label: "Intero percorso",
    range: "20 FEB — 18 AGO 2026",
    days: "163 / 180",
    completed: "91%",
    weight: "−47,0 kg",
    delta: "−1,8 kg / settimana",
    sleep: "6h 41m",
    sessions: "74",
    insight: "163 giorni registrati. La direzione non è un’impressione: è una sequenza.",
    note: "Dati raccolti dal giorno 1. I giorni senza nota restano visibili.",
    bars: [32, 38, 45, 41, 52, 59, 57, 66, 63, 74, 79, 86],
  },
};

function Rule({ className = "" }: { className?: string }) {
  return <div className={`pj-divider ${className}`} aria-hidden="true" />;
}

function Metric({
  label,
  value,
  detail,
  tone = "ink",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "ink" | "red" | "green";
}) {
  return (
    <div className="pj-context-metric">
      <span>{label}</span>
      <strong className={`pj-context-${tone}`}>{value}</strong>
      <em>{detail}</em>
    </div>
  );
}

export function StatisticsContext() {
  const [period, setPeriod] = useState<PeriodKey>("30G");
  const current = periods[period];
  const chartData = useMemo(() => current.bars, [current]);

  return (
    <main className="pj-home pj-context-shell">
      <header className="pj-nav pj-context-nav">
        <div className="pj-logo">PJ<span className="pj-context-slash">/</span>180</div>
        <div className="pj-navlinks">
          <span>DIARIO</span>
          <span className="pj-context-active">STATISTICHE</span>
          <span>METODO</span>
        </div>
        <button className="pj-mobile-menu" aria-label="Apri menu" type="button" />
      </header>

      <section className="pj-context-wrap">
        <div className="pj-context-kicker pj-eyebrow">QUADRO DI CONTROLLO · AGGIORNATO OGGI</div>
        <div className="pj-context-heading">
          <div>
            <h1 className="pj-serif">STATI<span>STICHE</span></h1>
            <p className="pj-context-deck">
              Un numero senza il suo periodo è solo rumore.
              <br />
              Qui ogni variazione ha una direzione.
            </p>
          </div>
          <div className="pj-context-period-stamp">
            <span>GIORNO DEL PERCORSO</span>
            <strong>163 <small>/ 180</small></strong>
            <div className="pj-context-stamp-line"><i style={{ width: "90.5%" }} /></div>
            <em>17 giorni alla chiusura</em>
          </div>
        </div>

        <Rule className="pj-context-rule" />

        <div className="pj-context-controls">
          <div>
            <span className="pj-context-label">FINESTRA DI LETTURA</span>
            <div className="pj-context-tabs" role="tablist" aria-label="Seleziona periodo">
              {(Object.keys(periods) as PeriodKey[]).map((key) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={period === key}
                  className={period === key ? "is-selected" : ""}
                  onClick={() => setPeriod(key)}
                  key={key}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="pj-context-reading">
            <span className="pj-context-label">STAI LEGGENDO</span>
            <strong>{current.label.toUpperCase()}</strong>
            <em>{current.range}</em>
          </div>
        </div>

        <section className="pj-context-summary">
          <div className="pj-context-summary-copy">
            <span className="pj-context-label">LA LETTURA, PRIMA DEL NUMERO</span>
            <h2>{current.insight}</h2>
            <p>{current.note}</p>
          </div>
          <div className="pj-context-direction">
            <div className="pj-context-direction-arrow">↘</div>
            <div>
              <span>DIREZIONE</span>
              <strong>IN DISCESA</strong>
              <em>{current.delta}</em>
            </div>
          </div>
        </section>

        <section className="pj-context-metrics" aria-label={`Metriche ${current.label}`}>
          <Metric label="GIORNI PRESENTI" value={current.days} detail={`${current.completed} del periodo`} />
          <Metric label="PESO" value={current.weight} detail="variazione netta" tone="red" />
          <Metric label="SONNO MEDIO" value={current.sleep} detail="obiettivo: 7h 30m" />
          <Metric label="SESSIONI" value={current.sessions} detail="allenamenti registrati" tone="green" />
        </section>

        <section className="pj-context-trend">
          <div className="pj-context-section-head">
            <div>
              <span className="pj-context-label">01 / PESO</span>
              <h2>La linea va giù.</h2>
            </div>
            <div className="pj-context-legend"><i /> PESO MEDIO GIORNALIERO</div>
          </div>
          <div className="pj-context-chart">
            <div className="pj-context-yaxis"><span>100 KG</span><span>90 KG</span><span>80 KG</span></div>
            <div className="pj-context-plot">
              <div className="pj-context-gridline" />
              <div className="pj-context-gridline mid" />
              <div className="pj-context-gridline low" />
              <svg viewBox="0 0 720 180" preserveAspectRatio="none" role="img" aria-label="Grafico del peso in discesa">
                <path d="M0 23 C58 28 85 39 130 42 S204 54 245 67 S307 72 356 89 S430 90 478 108 S550 115 590 132 S666 142 720 160" />
                <circle cx="720" cy="160" r="5" />
              </svg>
              <div className="pj-context-chart-end"><strong>83,0</strong><span>KG · OGGI</span></div>
            </div>
          </div>
          <div className="pj-context-chart-foot"><span>INIZIO · 130,0 KG</span><span>{current.range}</span><span>−36,2% DAL GIORNO 1</span></div>
        </section>

        <section className="pj-context-lower">
          <div className="pj-context-bars">
            <div className="pj-context-section-head">
              <div><span className="pj-context-label">02 / PRESENZA</span><h2>La costanza<br />fa il lavoro.</h2></div>
              <strong className="pj-context-big-number">{current.completed}</strong>
            </div>
            <div className="pj-context-bar-field" aria-label="Presenza giornaliera">
              {chartData.map((height, index) => <i key={`${height}-${index}`} style={{ height: `${height}%` }} className={height > 80 ? "peak" : ""} />)}
            </div>
            <div className="pj-context-chart-foot"><span>GIORNO 1</span><span>OGGI</span></div>
          </div>
          <aside className="pj-context-key">
            <span className="pj-context-label">COME LEGGERLO</span>
            <h2>Non cercare il giorno perfetto.</h2>
            <p>Guarda la forma della serie. I picchi sono utili, ma è la parte bassa che decide se il percorso regge.</p>
            <Rule />
            <div className="pj-context-key-row"><b className="red-dot" /> <span>giorno registrato</span></div>
            <div className="pj-context-key-row"><b className="green-dot" /> <span>giorno con allenamento</span></div>
          </aside>
        </section>

        <footer className="pj-context-footer">
          <span>PROGETTO J / DATI PUBBLICI / NESSUN FILTRO</span>
          <span>ULTIMA SINCERITÀ: 18.08.2026 · 06:42</span>
        </footer>
      </section>
    </main>
  );
}

export default StatisticsContext;