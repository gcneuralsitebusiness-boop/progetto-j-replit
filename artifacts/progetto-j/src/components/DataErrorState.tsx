export function DataErrorState() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-24 text-center">
      <p className="font-serif text-[clamp(32px,7vw,56px)] leading-none bebas text-foreground">
        DATI NON DISPONIBILI
      </p>
      <p className="mt-4 font-sans text-[14px] text-muted-foreground">
        Il server non risponde. Riprova tra qualche istante.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 h-[48px] px-7 bg-primary text-white font-sans text-[13px] font-bold uppercase tracking-[0.12em] hover:opacity-90"
      >
        RICARICA
      </button>
    </div>
  );
}