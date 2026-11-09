import "./_group.css";

export function CenteredDayHero() {
  return (
    <main className="pj-home-preview" data-season="2">
      <section className="pj-home-preview__hero" aria-labelledby="restored-home-title">
        <div className="pj-home-preview__inner">
          <p className="pj-home-preview__mono pj-home-preview__label">PROJECT J · STAGIONE 2</p>
          <p className="pj-home-preview__mono pj-home-preview__counter">GIORNO 001 / 180</p>
          <h1
            id="restored-home-title"
            className="pj-home-preview__restored-title"
            aria-label="Giorno 1"
          >
            001
          </h1>
          <p className="pj-home-preview__copy">
            130 chili. Dipendente. Una vita finita a 20 anni.
            Battere la dipendenza mi ha insegnato a combattere — non il contrario.
          </p>
          <div className="pj-home-preview__progress">
            <div className="pj-home-preview__progress-labels pj-home-preview__mono">
              <span>STAGIONE 2</span>
              <span>179 GIORNI RIMANENTI</span>
            </div>
            <div
              className="pj-home-preview__track"
              role="progressbar"
              aria-label="Avanzamento della Stagione 2"
              aria-valuemin={0}
              aria-valuemax={180}
              aria-valuenow={1}
            >
              <div className="pj-home-preview__fill" />
            </div>
          </div>
          <a className="pj-home-preview__cta" href="#diario">APRI IL DIARIO</a>
        </div>
      </section>
    </main>
  );
}
