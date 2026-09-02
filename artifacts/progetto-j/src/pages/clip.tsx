import { useEffect, useState, type CSSProperties } from "react";
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
  }).format(value)} H`;
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

function useClipCounters(data: ClipData, reduced: boolean, animationStarted: boolean) {
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

    if (!animationStarted) {
      setDay(0);
      setSonno(0);
      setEntrate(0);
      setUscite(0);
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
          frames.add(window.requestAnimationFrame(tick));
        }
      };
      frames.add(window.requestAnimationFrame(tick));
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
  }, [animationStarted, data, reduced]);

  return { day, sonno, entrate, uscite };
}

function ClipAnimation({ data, onReplay }: { data: ClipData; onReplay: () => void }) {
  const reduced = usePrefersReducedMotion();
  const photoUrl = getPhotoUrl(data.fotoClipUrl);
  const [photoReady, setPhotoReady] = useState(!photoUrl);
  const [animationStarted, setAnimationStarted] = useState(reduced || !photoUrl);
  const [rulerActive, setRulerActive] = useState(reduced);
  const counters = useClipCounters(data, reduced, animationStarted);

  useEffect(() => {
    if (reduced || !photoUrl) {
      setAnimationStarted(true);
      return;
    }

    let cancelled = false;
    let readyTimer = 0;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setAnimationStarted(true);
    }, 3_000);
    if (photoReady) {
      readyTimer = window.setTimeout(() => {
        if (!cancelled) setAnimationStarted(true);
      }, 400);
    }
    return () => {
      cancelled = true;
      window.clearTimeout(readyTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [photoReady, photoUrl, reduced]);

  useEffect(() => {
    if (reduced) {
      setRulerActive(true);
      return;
    }
    if (!animationStarted) {
      setRulerActive(false);
      return;
    }
    setRulerActive(false);
    const timer = window.setTimeout(() => setRulerActive(true), 1_500);
    return () => window.clearTimeout(timer);
  }, [animationStarted, reduced]);

  return (
    <main
      className={`clip-frame${animationStarted ? " clip-frame--running" : ""}${reduced ? " clip-frame--reduced" : ""}`}
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
      <header className="clip-block-a">
        <div className="clip-brand">
          <span className="clip-brand-j">J</span>
          <span className="clip-brand-name">PROGETTO J</span>
        </div>
        <span className="clip-remaining">{data.rimasti} RIMASTI</span>
      </header>

      <section className="clip-block-b" aria-label={`Foto del giorno ${data.numeroGiorno}`}>
        {photoUrl && (
          <img
            className="clip-photo-v2"
            src={photoUrl}
            alt=""
            onLoad={() => setPhotoReady(true)}
            onError={() => setPhotoReady(true)}
          />
        )}
        <div className="clip-veil-v2" aria-hidden="true" />
        <div className="clip-day-number-v2" aria-label={`Giorno ${data.numeroGiorno}`}>
          {Math.round(counters.day)}
        </div>
      </section>

      <section className="clip-block-c" aria-label="Dati del giorno">
        <div className="clip-overprint-v2" aria-hidden="true" />
        <div className="clip-stat-v2">
          <span>SONNO</span>
          <strong>{data.sonnoOre == null ? "—" : formatHours(counters.sonno)}</strong>
        </div>
        <div className="clip-stat-v2">
          <span>ENTRATE</span>
          <strong>{data.entrateEur == null ? "—" : formatEuro(counters.entrate)}</strong>
        </div>
        <div className="clip-stat-v2">
          <span>USCITE</span>
          <strong>{data.usciteEur == null ? "—" : formatEuro(counters.uscite)}</strong>
        </div>
      </section>

      <section className="clip-block-d" aria-label="Attrito">
        <span>ATTRITO</span>
        <p>{data.attrito ?? ""}</p>
      </section>

      <div
        className={`clip-block-e${rulerActive ? " clip-block-e--active" : ""}`}
        aria-label={`${data.numeroGiorno} giorni completati su ${GOAL_DAYS}`}
      >
        {Array.from({ length: GOAL_DAYS }, (_, index) => {
          const tick = index + 1;
          const isCurrent = tick === data.numeroGiorno;
          const isComplete = tick < data.numeroGiorno;
          const delay = isCurrent
            ? 380
            : (Math.max(0, Math.min(data.numeroGiorno - 1, tick - 1)) / Math.max(1, data.numeroGiorno - 1)) * 380;
          const tickStyle = {
            "--tick-color": isComplete ? "#B81D1D" : isCurrent ? "#F0EBE3" : "#2A2725",
            height: isCurrent ? 26 : tick % 10 === 0 ? 16 : 8,
            width: isCurrent ? 2 : 1,
            transitionDelay: `${delay}ms`,
          } as CSSProperties;
          return <span key={tick} className="clip-tick-v2" style={tickStyle} />;
        })}
      </div>

      <footer className="clip-block-f">
        <span className="clip-footer-bar" aria-hidden="true" />
        <span>PROJECTJ180DAY.COM</span>
      </footer>
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
        setData(payload);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus(error instanceof Error && error.message === "not-found" ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
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
    return <main className="clip-state-v2">GIORNO NON TROVATO</main>;
  }
  if (status === "error") {
    return <main className="clip-state-v2">ERRORE</main>;
  }
  return <main className="clip-loading-v2" aria-hidden="true" />;
}