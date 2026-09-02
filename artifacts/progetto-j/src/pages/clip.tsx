import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { getPhotoUrl } from "@workspace/object-storage-web";

const GOAL_DAYS = 180;
const CLIP_API_PATH = `${import.meta.env.BASE_URL}api/giorni`;

type ClipData = {
  numeroGiorno: number;
  rimasti: number;
  data: string;
  sonnoOre: number | null;
  entrateEur: number | null;
  usciteEur: number | null;
  attrito: string | null;
  fotoClipUrl: string | null;
};

type ClipStatus = "loading" | "ready" | "not-found" | "error";

function easeOutExpo(progress: number): number {
  return progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
}

function formatHours(value: number): string {
  return `${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)} h`;
}

const euroFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatEuro(value: number): string {
  const parts = euroFormatter.formatToParts(value);
  const currency = parts.find((part) => part.type === "currency")?.value ?? "€";
  const number = parts
    .filter((part) => part.type !== "currency" && part.type !== "literal")
    .map((part) => part.value)
    .join("");
  return `${currency}\u00a0${number}`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (
    typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useClipCounters(data: ClipData, reduced: boolean) {
  const [day, setDay] = useState(reduced ? data.numeroGiorno : 0);
  const [sonno, setSonno] = useState(reduced ? (data.sonnoOre ?? 0) : 0);
  const [entrate, setEntrate] = useState(reduced ? (data.entrateEur ?? 0) : 0);
  const [uscite, setUscite] = useState(reduced ? (data.usciteEur ?? 0) : 0);

  useEffect(() => {
    if (reduced) {
      setDay(data.numeroGiorno);
      setSonno(data.sonnoOre ?? 0);
      setEntrate(data.entrateEur ?? 0);
      setUscite(data.usciteEur ?? 0);
      return;
    }

    const frames = new Set<number>();
    let dayTimer = 0;
    let metricsTimer = 0;

    const animate = (
      target: number,
      duration: number,
      setter: (value: number) => void,
    ) => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        setter(target * easeOutExpo(progress));
        if (progress < 1) {
          const nextFrame = window.requestAnimationFrame(tick);
          frames.add(nextFrame);
        }
      };
      const firstFrame = window.requestAnimationFrame(tick);
      frames.add(firstFrame);
    };

    dayTimer = window.setTimeout(() => {
      animate(data.numeroGiorno, 950, setDay);
    }, 250);
    metricsTimer = window.setTimeout(() => {
      animate(data.sonnoOre ?? 0, 650, setSonno);
      animate(data.entrateEur ?? 0, 650, setEntrate);
      animate(data.usciteEur ?? 0, 650, setUscite);
    }, 850);

    return () => {
      window.clearTimeout(dayTimer);
      window.clearTimeout(metricsTimer);
      frames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, [data, reduced]);

  return { day, sonno, entrate, uscite };
}

function ClipAnimation({ data, onReplay }: { data: ClipData; onReplay: () => void }) {
  const reduced = usePrefersReducedMotion();
  const counters = useClipCounters(data, reduced);
  const [rulerActive, setRulerActive] = useState(reduced);
  const photoUrl = getPhotoUrl(data.fotoClipUrl);

  useEffect(() => {
    if (reduced) {
      setRulerActive(true);
      return;
    }
    setRulerActive(false);
    const timer = window.setTimeout(() => setRulerActive(true), 1_500);
    return () => window.clearTimeout(timer);
  }, [reduced, data.numeroGiorno]);

  return (
    <main
      className={`clip-viewport${reduced ? " clip-viewport--reduced" : ""}`}
      onClick={onReplay}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onReplay();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Progetto J, giorno ${data.numeroGiorno}`}
    >
      <div className={`clip-stage${reduced ? " clip-stage--reduced" : ""}`}>
        <header className="clip-header">
          <span>PROGETTO J</span>
          <span>{data.rimasti} RIMASTI</span>
        </header>

        <div className="clip-hero">
          {photoUrl ? (
            <img className="clip-photo" src={photoUrl} alt="" />
          ) : (
            <div className="clip-no-photo">NESSUNA FOTO</div>
          )}
          <div className="clip-veil" aria-hidden="true" />
          <div className="clip-day-number" aria-label={`Giorno ${data.numeroGiorno}`}>
            {Math.round(counters.day)}
          </div>
        </div>

        <section className="clip-data-band" aria-label="Dati del giorno">
          <div className="clip-overprint" aria-hidden="true" />
          <div className="clip-stat">
            <span>SONNO</span>
            <strong>{data.sonnoOre == null ? "—" : formatHours(counters.sonno)}</strong>
          </div>
          <div className="clip-stat">
            <span>ENTRATE</span>
            <strong>{data.entrateEur == null ? "—" : formatEuro(counters.entrate)}</strong>
          </div>
          <div className="clip-stat">
            <span>USCITE</span>
            <strong>{data.usciteEur == null ? "—" : formatEuro(counters.uscite)}</strong>
          </div>
        </section>

        {data.attrito && (
          <section className="clip-friction">
            <span>ATTRITO</span>
            <p>{data.attrito}</p>
          </section>
        )}

        <div className={`clip-ruler${rulerActive ? " clip-ruler--active" : ""}`} aria-label={`${data.numeroGiorno} giorni completati su ${GOAL_DAYS}`}>
          {Array.from({ length: GOAL_DAYS }, (_, index) => {
            const tick = index + 1;
            const isCurrent = tick === data.numeroGiorno;
            const isComplete = tick < data.numeroGiorno;
            const delay = isCurrent
              ? 380
              : (Math.max(0, Math.min(data.numeroGiorno - 1, tick - 1)) / Math.max(1, data.numeroGiorno - 1)) * 380;
            return (
              <span
                key={tick}
                className={`clip-tick${isCurrent ? " clip-tick--current" : ""}`}
                style={{
                  height: isCurrent ? 22 : tick % 10 === 0 ? 14 : 7,
                  "--tick-color": isComplete ? "#B81D1D" : isCurrent ? "#F0EBE3" : "#262322",
                  transitionDelay: `${delay}ms`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>

        <footer className="clip-footer">PROJECTJ180DAY.COM</footer>
      </div>
    </main>
  );
}

export default function Clip() {
  const { numero: rawNumero } = useParams<{ numero: string }>();
  const isValidNumero = /^\d+$/.test(rawNumero ?? "");
  const parsedNumero = isValidNumero ? Number(rawNumero) : NaN;
  const validNumero = Number.isInteger(parsedNumero) && parsedNumero >= 1 && parsedNumero <= GOAL_DAYS;
  const [status, setStatus] = useState<ClipStatus>(validNumero ? "loading" : "not-found");
  const [data, setData] = useState<ClipData | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (!validNumero) {
      setStatus("not-found");
      setData(null);
      return;
    }

    let cancelled = false;
    let animationTimer = 0;
    setStatus("loading");
    setData(null);
    fetch(`${CLIP_API_PATH}/${parsedNumero}/clip`)
      .then(async (response) => {
        if (response.status === 404) throw new Error("not-found");
        if (!response.ok) throw new Error("error");
        return response.json() as Promise<ClipData>;
      })
      .then((payload) => {
        if (cancelled) return;
        animationTimer = window.setTimeout(() => {
          if (cancelled) return;
          setData(payload);
          setStatus("ready");
        }, 400);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus(error instanceof Error && error.message === "not-found" ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(animationTimer);
    };
  }, [parsedNumero, validNumero]);

  if (status === "ready" && data) {
    return (
      <ClipAnimation
        key={replayKey}
        data={data}
        onReplay={() => setReplayKey((key) => key + 1)}
      />
    );
  }

  if (status === "not-found") {
    return <main className="clip-state">GIORNO NON TROVATO</main>;
  }
  if (status === "error") {
    return <main className="clip-state">ERRORE</main>;
  }
  return <main className="clip-state" aria-hidden="true" />;
}