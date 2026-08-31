import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TAPPE, VISITATI, type TappaViaggio } from "@/data/viaggio";
import { usePageMeta } from "@/hooks/use-page-meta";

const PAGE_TITLE = "Il viaggio di J — Progetto J";
const PAGE_DESCRIPTION =
  "Otto paesi visitati, quattro da prendere. Quattro discipline, quattro posti dove sono nate.";
const PAGE_URL = "https://projectj180day.com/viaggio";
const PAGE_IMAGE = "https://projectj180day.com/og-image.jpg";

type MapState = "loading" | "ready" | "error";

function formatDateTime(value: string): string {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year} ${time}`;
}

function markerCoordinates(tappa: TappaViaggio) {
  // The checked-in Highmaps geometry uses a compact projected coordinate
  // system rather than a raw equirectangular latitude scale.
  const left = 50 + tappa.lng * 0.257;
  const top = 29 - tappa.lat * 0.3;
  return { left, top };
}

function markerPosition(tappa: TappaViaggio): CSSProperties {
  const { left, top } = markerCoordinates(tappa);
  return {
    left: `${left}%`,
    top: `${top}%`,
  };
}

function prepareMapSvg(source: string): string {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(source, "image/svg+xml");
  if (documentNode.querySelector("parsererror")) {
    throw new Error("Invalid map SVG");
  }

  documentNode.querySelectorAll("script, foreignObject").forEach((node) => node.remove());
  documentNode.querySelectorAll("*").forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      if (attribute.name.toLowerCase().startsWith("on")) {
        node.removeAttribute(attribute.name);
      }
    }
  });

  const svg = documentNode.documentElement;
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("preserveAspectRatio", "none");

  documentNode.querySelectorAll("path").forEach((path) => {
    path.classList.add("paese");
    path.removeAttribute("style");
  });

  for (const paese of VISITATI) {
    documentNode.getElementById(paese.iso)?.classList.add("paese--visitato");
  }

  for (const tappa of TAPPE) {
    if (tappa.coloraPaese) {
      documentNode.getElementById(tappa.iso)?.classList.add("paese--pianificato");
    }
  }

  return new XMLSerializer().serializeToString(svg);
}

function Marker({
  tappa,
  active,
  onActivate,
}: {
  tappa: TappaViaggio;
  active: boolean;
  onActivate: (tappa: TappaViaggio) => void;
}) {
  const alignLeft = markerCoordinates(tappa).left > 50;

  return (
    <div
      className="journey-marker"
      style={markerPosition(tappa)}
      data-testid={`marker-${tappa.id}`}
    >
      <button
        type="button"
        className="journey-marker-button"
        onClick={() => onActivate(tappa)}
        aria-label={`${String(tappa.ordine).padStart(2, "0")} · ${tappa.disciplina}, ${tappa.citta}`}
        aria-expanded={active}
        aria-controls={`marker-panel-${tappa.id}`}
        data-testid={`button-marker-${tappa.id}`}
      >
        <span className="journey-marker-core" aria-hidden="true" />
      </button>
      <span
        className={`journey-marker-label${alignLeft ? " journey-marker-label--left" : ""}`}
        aria-hidden="true"
      >
        {String(tappa.ordine).padStart(2, "0")} · {tappa.disciplina}
      </span>
      {active && (
        <div
          id={`marker-panel-${tappa.id}`}
          className={`journey-marker-panel${alignLeft ? " journey-marker-panel--left" : ""}`}
          role="status"
          data-testid={`panel-marker-${tappa.id}`}
        >
          <strong>{tappa.citta}</strong>
          <span>{tappa.disciplina}</span>
          <span>{tappa.palestra}</span>
          <span>{formatDateTime(tappa.partenza)}</span>
          <span>{formatDateTime(tappa.ritorno)}</span>
        </div>
      )}
    </div>
  );
}

export default function Viaggio() {
  const [mapState, setMapState] = useState<MapState>("loading");
  const [mapSvg, setMapSvg] = useState("");
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [highlightCycle, setHighlightCycle] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);

  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    image: PAGE_IMAGE,
    url: PAGE_URL,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${import.meta.env.BASE_URL}mappa-mondo.svg`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Map request failed");
        return response.text();
      })
      .then((source) => {
        setMapSvg(prepareMapSvg(source));
        setMapState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMapState("error");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const closeMarker = (event: PointerEvent) => {
      if (!activeMarker || mapRef.current?.contains(event.target as Node)) return;
      setActiveMarker(null);
    };

    document.addEventListener("pointerdown", closeMarker);
    return () => document.removeEventListener("pointerdown", closeMarker);
  }, [activeMarker]);

  const activateMarker = (tappa: TappaViaggio) => {
    setActiveMarker((current) => (current === tappa.id ? null : tappa.id));
    setHighlightedCard(tappa.id);
    setHighlightCycle((cycle) => cycle + 1);

    const target = document.getElementById(`tappa-${tappa.id}`);
    if (!target) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8E4DE]">
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-6 sm:pb-32 sm:pt-36">
        <header className="border-b border-[#1A1A1A] pb-12 sm:pb-16">
          <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#6E6A66]">
            Progetto J · Mappa
          </p>
          <h1 className="mt-7 font-serif uppercase leading-[0.78]">
            <span className="block text-[48px] tracking-[0.02em] text-[#E8E4DE] sm:text-[72px]">
              Il viaggio
            </span>
            <span className="block text-[84px] tracking-[-0.03em] text-[#F0EBE3] sm:text-[128px]">
              Di J
            </span>
          </h1>
          <p className="mt-8 max-w-[46ch] text-[18px] leading-[1.5] text-[#8E8A85]">
            Quattro discipline. Quattro posti dove sono nate.
          </p>
        </header>

        <section aria-label="Numeri del viaggio" className="grid grid-cols-3 border-b border-[#1A1A1A]">
          {[
            { value: VISITATI.length, label: "Visitati" },
            { value: TAPPE.length, label: "Da prendere" },
            { value: new Set(TAPPE.map((tappa) => tappa.disciplina)).size, label: "Discipline" },
          ].map((counter, index) => (
            <div
              key={counter.label}
              className={`py-8 text-center sm:py-12${index > 0 ? " border-l border-[#1A1A1A]" : ""}`}
              data-testid={`stat-viaggio-${counter.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <strong className="block font-serif text-[56px] leading-none tabular text-[#F0EBE3] sm:text-[88px]">
                {counter.value}
              </strong>
              <span className="mt-3 block font-mono text-[9px] uppercase tracking-[0.16em] text-[#6E6A66] sm:text-[11px] sm:tracking-[0.22em]">
                {counter.label}
              </span>
            </div>
          ))}
        </section>

        <section aria-labelledby="mappa-heading" className="pt-12 sm:pt-16">
          <h2 id="mappa-heading" className="sr-only">Mappa dei paesi visitati e delle tappe pianificate</h2>
          <div
            ref={mapRef}
            className="journey-map relative aspect-[2/1] w-full overflow-hidden border border-[#1A1A1A] bg-[#0A0A0A]"
            data-testid="map-viaggio"
          >
            {mapState === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#6E6A66]">
                  Caricamento mappa
                </span>
              </div>
            )}
            {mapState === "error" && (
              <div className="absolute inset-0 flex items-center justify-center border border-[#1A1A1A]">
                <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#6E6A66]">
                  Mappa non disponibile
                </span>
              </div>
            )}
            {mapState === "ready" && (
              <div
                className="journey-map-svg absolute inset-0"
                dangerouslySetInnerHTML={{ __html: mapSvg }}
              />
            )}
            {mapState === "ready" && (
              <div className="absolute inset-0 pointer-events-none">
                {TAPPE.map((tappa) => (
                  <Marker
                    key={tappa.id}
                    tappa={tappa}
                    active={activeMarker === tappa.id}
                    onActivate={activateMarker}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-[#1A1A1A] py-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8E8A85]">
            <span className="inline-flex items-center gap-3">
              <span className="h-[9px] w-[9px] bg-[#B81D1D]" aria-hidden="true" />
              Visitato
            </span>
            <span className="inline-flex items-center gap-3">
              <span className="h-[9px] w-[9px] bg-[#8B6914]" aria-hidden="true" />
              Da prendere
            </span>
          </div>
        </section>

        <section aria-labelledby="tappe-heading" className="mt-10 sm:mt-14">
          <h2 id="tappe-heading" className="sr-only">Tappe di allenamento pianificate</h2>
          {TAPPE.map((tappa) => (
            <article
              id={`tappa-${tappa.id}`}
              key={`${tappa.id}-${highlightedCard === tappa.id ? highlightCycle : 0}`}
              className={`journey-stop grid scroll-mt-24 grid-cols-1 gap-6 border-b border-[#1A1A1A] py-10 sm:grid-cols-[64px_1fr] sm:gap-8${
                highlightedCard === tappa.id ? " journey-stop--highlighted" : ""
              }`}
              data-testid={`card-tappa-${tappa.id}`}
            >
              <div className="font-serif text-[56px] leading-none tabular text-[#B81D1D]">
                {String(tappa.ordine).padStart(2, "0")}
              </div>
              <div>
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <h3 className="font-serif text-[44px] uppercase leading-none text-[#F0EBE3]">
                    {tappa.paese}
                  </h3>
                  <span className="border border-[#8B6914] px-[10px] py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8B6914]">
                    {tappa.stato}
                  </span>
                </div>
                <p className="mt-3 font-serif text-[30px] uppercase leading-none text-[#B81D1D]">
                  {tappa.disciplina}
                </p>
                <p className="mt-3 text-[16px] text-[#8E8A85]">
                  {tappa.palestra} · {tappa.citta}
                </p>

                <dl className="mt-8 grid grid-cols-1 gap-7 border-t border-[#1A1A1A] pt-7 sm:grid-cols-3">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A66]">
                      Partenza
                    </dt>
                    <dd className="mt-2 font-mono text-[14px] tabular text-[#E8E4DE]">
                      {formatDateTime(tappa.partenza)}
                      <span className="mt-1 block text-[#8E8A85]">{tappa.partenzaDa}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A66]">
                      Ritorno
                    </dt>
                    <dd className="mt-2 font-mono text-[14px] tabular text-[#E8E4DE]">
                      {formatDateTime(tappa.ritorno)}
                      <span className="mt-1 block text-[#8E8A85]">{tappa.ritornoDa}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6A66]">
                      Durata
                    </dt>
                    <dd className="mt-2 font-mono text-[14px] tabular uppercase text-[#E8E4DE]">
                      {tappa.durataGiorni} giorni
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </section>

        <footer className="border-b border-[#1A1A1A] py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6E6A66] sm:text-[12px] sm:tracking-[0.2em]">
            Date pianificate — Nessun volo prenotato
          </p>
        </footer>
      </main>
    </div>
  );
}