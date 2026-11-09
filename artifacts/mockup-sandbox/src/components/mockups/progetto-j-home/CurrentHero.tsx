import "./_group.css";

export function CurrentHero() {
  return (
    <main className="pj-home-preview" data-season="2">
      <section className="pj-home-preview__hero" aria-labelledby="current-home-title">
        <div className="pj-home-preview__inner">
          <p className="pj-home-preview__mono pj-home-preview__label">PROJECT J · STAGIONE 2</p>
          <h1 id="current-home-title" className="pj-home-preview__title">
            <span>130 chili. Dipendente. Una vita finita a 20 anni.</span>
            <span>Battere la dipendenza mi ha insegnato a combattere — non il contrario.</span>
            <span>Oggi documento la risalita. Ogni giorno, senza nascondere niente.</span>
          </h1>
          <p className="pj-home-preview__meta">
            Project J · la mia trasformazione documentata ogni giorno, dati veri inclusi · Giorno 1
          </p>
        </div>
      </section>
    </main>
  );
}
