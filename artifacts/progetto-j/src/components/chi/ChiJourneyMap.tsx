import { useEffect, useState } from "react";
import { Link } from "wouter";
import { TAPPE, VISITATI, type TappaViaggio } from "@/data/viaggio";

type MapState = "loading" | "ready" | "error";

// Same calibrated projection as pages/viaggio.tsx for the checked-in, cropped 2:1 Highmaps SVG.
function markerCoordinates(tappa: TappaViaggio) {
  return { left: 50 + tappa.lng * 0.257, top: 29 - tappa.lat * 0.3 };
}

function prepareMapSvg(source: string): string {
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid map SVG");
  doc.querySelectorAll("script, foreignObject").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      if (attribute.name.toLowerCase().startsWith("on")) node.removeAttribute(attribute.name);
    }
  });
  const svg = doc.documentElement;
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("preserveAspectRatio", "none");
  doc.querySelectorAll("path").forEach((path) => {
    path.classList.add("paese");
    path.removeAttribute("style");
  });
  for (const paese of VISITATI) doc.getElementById(paese.iso)?.classList.add("paese--visitato");
  for (const tappa of TAPPE) {
    if (tappa.coloraPaese) doc.getElementById(tappa.iso)?.classList.add("paese--pianificato");
  }
  return new XMLSerializer().serializeToString(svg);
}

export function ChiJourneyMap() {
  const [state, setState] = useState<MapState>("loading");
  const [svg, setSvg] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}mappa-mondo.svg`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Map request failed");
        return r.text();
      })
      .then((source) => {
        setSvg(prepareMapSvg(source));
        setState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("error");
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="border-t border-[#1A1A1A] py-14" data-testid="section-chi-map">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pj-mono text-[13px] uppercase tracking-[0.2em] text-[#C9C4BD]">
            {VISITATI.length} visitati · {TAPPE.length} da prendere
          </p>
          <h2 className="mt-3 font-serif bebas text-[clamp(48px,10vw,88px)] leading-[0.85] text-[#E8E4DE]">IL VIAGGIO</h2>
        </div>
        <Link href="/viaggio" className="pj-mono text-[13px] uppercase tracking-[0.18em] text-[#B81D1D] hover:text-[#E8E4DE]" data-testid="link-chi-viaggio">
          Apri la mappa →
        </Link>
      </div>
      <Link href="/viaggio" aria-label="Apri la mappa del viaggio" className="mt-8 block" data-testid="link-chi-map">
        <div className="journey-map pj-chi-map relative aspect-[2/1] w-full overflow-hidden border border-[#1A1A1A] bg-[#0A0A0A]">
          {state === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center pj-mono text-[13px] uppercase tracking-[0.2em] text-[#6E6A66] animate-pulse">Caricamento mappa</div>
          )}
          {state === "error" && (
            <div className="absolute inset-0 flex items-center justify-center pj-mono text-[13px] uppercase tracking-[0.2em] text-[#6E6A66]">Mappa non disponibile</div>
          )}
          {state === "ready" && (
            <>
              <div className="journey-map-svg absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />
              <div className="absolute inset-0 pointer-events-none">
                {TAPPE.map((t) => {
                  const { left, top } = markerCoordinates(t);
                  return <span key={t.id} className="pj-chi-dot" style={{ left: `${left}%`, top: `${top}%` }} />;
                })}
              </div>
            </>
          )}
        </div>
      </Link>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 pj-mono text-[13px] uppercase tracking-[0.16em] text-[#C9C4BD]">
        <span className="inline-flex items-center gap-3"><span className="h-[9px] w-[9px] bg-[#B81D1D]" aria-hidden="true" />Visitato</span>
        <span className="inline-flex items-center gap-3"><span className="h-[9px] w-[9px] bg-[#8B6914]" aria-hidden="true" />Da prendere</span>
      </div>
    </section>
  );
}
