import "./_group.css";

const ticker = [
  ["●", "105", "GIORNI"],
  ["⌁", "186,7", "KM"],
  ["♡", "182.212", "KCAL"],
  ["□", "€5.839", "ENTRATE"],
];

export function Current() {
  return (
    <main className="pj-home">
      <nav className="pj-nav" aria-label="Navigazione principale">
        <span className="pj-logo">J</span>
        <div className="pj-navlinks">
          <span>Chi sono</span><span>Journaling</span><span>Statistiche</span><span>Articoli</span><span>Richiedi accesso</span>
        </div>
        <span className="pj-mobile-menu" aria-label="Apri menu" />
      </nav>

      <section className="relative flex min-h-[620px] flex-col items-center justify-center px-5 text-center md:min-h-[680px]">
        <div className="absolute inset-x-0 top-[24%] h-72 bg-[radial-gradient(ellipse_at_center,rgba(64,64,64,.42),transparent_64%)]" />
        <div className="relative">
          <span className="pj-eyebrow">Giorno 105 / 180</span>
          <div className="pj-serif mt-4 text-[clamp(136px,23vw,264px)] leading-[.73] text-[#ca1c1c]">105</div>
          <div className="pj-mono mt-5 text-[12px] tracking-[.12em] text-[#777]">
            <span className="line-through">130 KG</span> <span className="mx-2 text-[#ca1c1c]">→</span> <span className="text-[#36ba79]">83 KG</span>
          </div>
          <p className="mx-auto mt-6 max-w-md text-[14px] uppercase tracking-[.17em] text-[#aaa]">
            Non è motivazione. Sono numeri. 180 giorni, tutti pubblici.
          </p>
          <button className="pj-button mt-8">Cosa è successo oggi →</button>
        </div>
        <div className="mt-12 h-7 border-l border-[#ca1c1c]" />
      </section>

      <section className="overflow-hidden">
        <div className="pj-ticker">
          {[...ticker, ...ticker].map(([icon, value, label], index) => (
            <div className="pj-ticker-item" key={`${label}-${index}`}>
              <span>{icon}</span><strong>{value}</strong><span>{label}</span>
            </div>
          ))}
        </div>
        <div className="mx-5 my-5 hidden sm:block">
          <Metrics />
        </div>
      </section>

      <section className="mx-auto max-w-[1040px] px-5 pb-28 pt-20">
        <div className="pj-divider" />
        <span className="pj-eyebrow mt-10">La trasformazione</span>
        <h2 className="pj-serif mt-2 text-[clamp(46px,8vw,82px)] leading-[.84]">GIORNO 1 → GIORNO 105</h2>
        <div className="mt-12 grid gap-8 border-t border-[#262626] pt-5 md:grid-cols-2">
          <div><span className="pj-mono text-[10px] tracking-[.17em] text-[#777]">PRIMA</span><p className="pj-serif mt-4 text-5xl">130 KG</p></div>
          <div><span className="pj-mono text-[10px] tracking-[.17em] text-[#777]">ORA</span><p className="pj-serif mt-4 text-5xl text-[#ca1c1c]">83 KG</p></div>
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