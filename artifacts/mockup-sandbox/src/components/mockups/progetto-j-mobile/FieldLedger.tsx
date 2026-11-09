import { useState } from "react";
import "./fieldledger.css";

type JournalDay = {
  day: number;
  date: string;
  weekday: string;
  title: string;
  note: string;
  metrics: { label: string; value: string }[];
  tag: string;
};

const journalDays: JournalDay[] = [
  {
    day: 130,
    date: "18",
    weekday: "LUN",
    title: "La costanza non fa rumore.",
    note: "Oggi niente grandi promesse. Solo il giro lungo, fatto anche quando la testa cercava una scusa.",
    metrics: [
      { label: "KM", value: "8.4" },
      { label: "SONNO", value: "7.2h" },
      { label: "PESO", value: "83.6" },
    ],
    tag: "MOVIMENTO",
  },
  {
    day: 129,
    date: "17",
    weekday: "DOM",
    title: "Una giornata alla volta.",
    note: "Ho chiuso il cerchio con un allenamento breve. Non serviva altro.",
    metrics: [
      { label: "KM", value: "4.1" },
      { label: "KCAL", value: "2.180" },
      { label: "FLEX", value: "42" },
    ],
    tag: "ALLENAMENTO",
  },
  {
    day: 128,
    date: "16",
    weekday: "SAB",
    title: "Il corpo si ricorda.",
    note: "Riposo attivo e un pasto semplice. Piccole scelte, ripetute.",
    metrics: [
      { label: "SONNO", value: "8.0h" },
      { label: "PESO", value: "83.9" },
      { label: "ENTRATE", value: "€24" },
    ],
    tag: "RITMO",
  },
];

const filters = ["TUTTI", "MOVIMENTO", "RITMO"] as const;

export function FieldLedger() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("TUTTI");
  const [selectedDay, setSelectedDay] = useState<JournalDay | null>(null);
  const [activeTab, setActiveTab] = useState("DIARIO");
  const visibleDays =
    filter === "TUTTI"
      ? journalDays
      : journalDays.filter((entry) => entry.tag === filter || (filter === "MOVIMENTO" && entry.tag === "ALLENAMENTO"));

  return (
    <main className="fl-shell">
      <header className="fl-topbar">
        <div className="fl-brand-mark">J<span>·</span></div>
        <div className="fl-top-meta">
          <span>PROGETTO J</span>
          <span className="fl-live"><i /> STAGIONE 02</span>
        </div>
        <button className="fl-avatar" aria-label="Apri profilo" onClick={() => setActiveTab("PROFILO")}>J</button>
      </header>

      <section className="fl-intro">
        <div className="fl-kicker"><span>IL PERCORSO, GIORNO PER GIORNO</span><b>2025</b></div>
        <div className="fl-current">
          <div>
            <p className="fl-overline">LUNEDÌ · 18 AGOSTO</p>
            <h1>Il diario<span>.</span></h1>
          </div>
          <div className="fl-progress">
            <strong>130</strong><span>/ 180<br />GIORNI</span>
          </div>
        </div>
        <div className="fl-progress-track"><span /></div>
        <div className="fl-progress-caption"><span>STAGIONE IN CORSO</span><span>50 GIORNI AL TRAGUARDO</span></div>
      </section>

      <section className="fl-focus" aria-label="Giorno corrente">
        <div className="fl-focus-date">
          <div className="fl-date-stamp"><strong>18</strong><span>AGO</span></div>
          <div className="fl-focus-copy">
            <span className="fl-tiny-label">ULTIMO AGGIORNAMENTO</span>
            <h2>La costanza<br />non fa rumore.</h2>
          </div>
          <span className="fl-edition">#130</span>
        </div>
        <p className="fl-focus-note">Oggi niente grandi promesse. Solo il giro lungo, fatto anche quando la testa cercava una scusa.</p>
        <div className="fl-focus-stats">
          <div><strong>8.4</strong><span>KM</span></div>
          <div><strong>7.2</strong><span>ORE DI SONNO</span></div>
          <div><strong>83.6</strong><span>KG</span></div>
        </div>
        <button className="fl-read" onClick={() => setSelectedDay(journalDays[0])}>
          APRI LA GIORNATA <span>↗</span>
        </button>
      </section>

      <section className="fl-archive">
        <div className="fl-archive-head">
          <div><span className="fl-overline">TRACCIA DEL TEMPO</span><h2>Giorni recenti</h2></div>
          <button className="fl-calendar" aria-label="Selettore calendario" onClick={() => setFilter("TUTTI")}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="5" width="14" height="12" rx="1"/><path d="M6 3v4M14 3v4M3 9h14"/></svg>
          </button>
        </div>
        <div className="fl-filters" role="tablist" aria-label="Filtra diario">
          {filters.map((item) => (
            <button key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)} role="tab" aria-selected={filter === item}>{item}</button>
          ))}
        </div>
        <div className="fl-timeline">
          {visibleDays.map((entry, index) => (
            <button className="fl-entry" key={entry.day} onClick={() => setSelectedDay(entry)}>
              <div className="fl-entry-date"><strong>{entry.date}</strong><span>{entry.weekday}</span></div>
              <div className="fl-entry-marker"><i className={index === 0 ? "is-current" : ""} /></div>
              <div className="fl-entry-body">
                <span className="fl-entry-tag">GIORNO {entry.day} <b>·</b> {entry.tag}</span>
                <strong>{entry.title}</strong>
                <span className="fl-entry-metrics">{entry.metrics.slice(0, 2).map((metric) => `${metric.value} ${metric.label}`).join("   /   ")}</span>
              </div>
              <span className="fl-entry-arrow">↗</span>
            </button>
          ))}
          {visibleDays.length === 0 && <div className="fl-filter-empty">Nessuna giornata in questa traccia.</div>}
        </div>
        <button className="fl-history" onClick={() => setFilter(filter === "TUTTI" ? "MOVIMENTO" : "TUTTI")}>
          ESPLORA TUTTI I GIORNI <span>↓</span>
        </button>
      </section>

      <nav className="fl-bottom-nav" aria-label="Navigazione">
        {[
          { label: "DIARIO", icon: "▤" },
          { label: "DATI", icon: "⌁" },
          { label: "STORIA", icon: "◷" },
        ].map((item) => (
          <button key={item.label} onClick={() => setActiveTab(item.label)} className={activeTab === item.label ? "is-active" : ""}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>

      {selectedDay && (
        <div className="fl-overlay" role="presentation" onClick={() => setSelectedDay(null)}>
          <section className="fl-sheet" role="dialog" aria-modal="true" aria-label={`Giorno ${selectedDay.day}`} onClick={(event) => event.stopPropagation()}>
            <div className="fl-sheet-grip" />
            <div className="fl-sheet-top"><span>PROGETTO J · ARCHIVIO</span><button onClick={() => setSelectedDay(null)} aria-label="Chiudi">×</button></div>
            <p className="fl-overline">{selectedDay.weekday} {selectedDay.date} AGOSTO · GIORNO {selectedDay.day}</p>
            <h2>{selectedDay.title}</h2>
            <p className="fl-sheet-note">{selectedDay.note}</p>
            <div className="fl-sheet-metrics">
              {selectedDay.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
            </div>
            <button className="fl-sheet-close" onClick={() => setSelectedDay(null)}>TORNA AL DIARIO</button>
          </section>
        </div>
      )}
    </main>
  );
}
