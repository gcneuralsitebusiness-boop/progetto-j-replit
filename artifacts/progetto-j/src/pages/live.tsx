import { useEffect, useMemo, useState } from "react";
import { getGetLiveQueryKey, useGetLive } from "@workspace/api-client-react";
import type { LiveScheduleItem, LiveStatus } from "@workspace/api-client-react";
import "./live.css";

const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
const ACTIVITY_LABELS: Record<string, string> = {
  SONNO: "Sonno",
  LAVORO: "Lavoro",
  ALLENAMENTO: "Allenamento",
  LIBERO: "Tempo libero",
};
const COLORS: Record<string, string> = {
  SONNO: "sleep",
  LAVORO: "work",
  ALLENAMENTO: "training",
  LIBERO: "free",
};

function useRomeClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

function minuteOfDay(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function todaySchedule(status: LiveStatus) {
  return status.programma
    .filter((item) => item.giorno === status.giorno)
    .slice()
    .sort((a, b) => minuteOfDay(a.inizio) - minuteOfDay(b.inizio));
}

function Timeline({ items, currentTime }: { items: LiveScheduleItem[]; currentTime: string }) {
  const currentMinute = minuteOfDay(currentTime);
  const marker = Math.min(100, Math.max(0, (currentMinute / 1440) * 100));
  return (
    <div className="live-timeline-wrap">
      <div className="live-timeline" aria-label="Programma proporzionale delle 24 ore">
        {items.map((item) => {
          const start = minuteOfDay(item.inizio);
          const end = minuteOfDay(item.fine);
          const width = ((end - start) / 1440) * 100;
          return (
            <div
              key={item.id}
              className={`live-segment live-${COLORS[item.attivita] ?? "free"}`}
              style={{ left: `${(start / 1440) * 100}%`, width: `${width}%` }}
              title={`${item.inizio}–${item.fine} · ${ACTIVITY_LABELS[item.attivita] ?? item.attivita}`}
            >
              {width > 8 && <span>{ACTIVITY_LABELS[item.attivita] ?? item.attivita}</span>}
            </div>
          );
        })}
        <span className="live-now-marker" style={{ left: `${marker}%` }} aria-hidden="true" />
      </div>
      <div className="live-time-scale" aria-hidden="true">
        {[0, 6, 12, 18, 24].map((hour) => <span key={hour}>{String(hour).padStart(2, "0")}:00</span>)}
      </div>
    </div>
  );
}

function QuietTrace({ label, index }: { label: string; index: number }) {
  const paths = ["M0 19H240", "M0 13H240", "M0 22H240"];
  return (
    <div className="live-trace">
      <div className="live-trace-label">{label}<span>NON DISPONIBILE</span></div>
      <svg viewBox="0 0 240 40" preserveAspectRatio="none" role="img" aria-label={`${label}: nessun dato disponibile`}>
        <path d={paths[index]} />
      </svg>
    </div>
  );
}

function ScheduleList({ items }: { items: LiveScheduleItem[] }) {
  if (!items.length) return <p className="live-muted">Il programma di oggi non è disponibile.</p>;
  return (
    <ol className="live-schedule-list">
      {items.map((item, index) => (
        <li key={item.id} className="live-schedule-row">
          <span className="live-schedule-index">{String(index + 1).padStart(2, "0")}</span>
          <time>{item.inizio}</time><span className="live-schedule-dash">—</span><time>{item.fine}</time>
          <span className={`live-activity-tag live-tag-${COLORS[item.attivita] ?? "free"}`}>{ACTIVITY_LABELS[item.attivita] ?? item.attivita}</span>
        </li>
      ))}
    </ol>
  );
}

function LoadingPanel() {
  return (
    <main className="live-page">
      <div className="live-shell">
        <div className="live-kicker">J IN TEMPO REALE / 180 GIORNI</div>
        <div className="live-skeleton live-skeleton-title" />
        <div className="live-skeleton live-skeleton-panel" />
        <div className="live-skeleton live-skeleton-panel short" />
      </div>
    </main>
  );
}

export default function LivePage() {
  const { data, error, isLoading, isError, refetch, dataUpdatedAt } = useGetLive({
    query: { queryKey: getGetLiveQueryKey(), refetchInterval: 60_000, refetchIntervalInBackground: true },
  });
  const clock = useRomeClock();
  const todaysItems = useMemo(() => data ? todaySchedule(data) : [], [data]);

  if (isLoading) return <LoadingPanel />;
  if (isError || !data) {
    const message = error instanceof Error && error.message.includes("401")
      ? "Il servizio è momentaneamente non accessibile."
      : "Non riesco a leggere lo stato live in questo momento.";
    return (
      <main className="live-page">
        <div className="live-shell live-error-shell">
          <p className="live-kicker">J IN TEMPO REALE / CONNESSIONE</p>
          <h1>Il diario continua.<br /><em>La trasmissione no.</em></h1>
          <p className="live-muted" role="alert">{message}</p>
          <button className="live-outline-button" onClick={() => refetch()} data-testid="button-retry-live">Riprova</button>
        </div>
      </main>
    );
  }

  return (
    <main className="live-page">
      <div className="live-shell">
        <header className="live-masthead">
          <div>
            <p className="live-kicker">PROGETTO J <span>/</span> OSSERVAZIONE APERTA</p>
            <h1>J IN TEMPO<br /><em>REALE.</em></h1>
          </div>
          <div className="live-clock-block">
            <span className="live-label">ORA DI ROMA</span>
            <time className="live-clock" dateTime={data.ora}>{clock}</time>
            <span className="live-zone">EUROPE / ROME</span>
          </div>
        </header>

        <section className="live-current" aria-labelledby="live-current-title">
          <div className="live-current-top">
            <p className="live-kicker">STATO ATTUALE <span>·</span> {DAYS[data.giorno] ?? "OGGI"}</p>
            <span className="live-public-mark"><i /> IN AGGIORNAMENTO</span>
          </div>
          <div className="live-current-main">
            <div>
              <span className="live-label">IN QUESTO MOMENTO</span>
              <h2 id="live-current-title">{data.nome}</h2>
              <p className="live-current-meta">{ACTIVITY_LABELS[data.attivita] ?? data.attivita} <span>/</span> dalle {formatTime(data.da)}</p>
            </div>
            {data.prossima && (
              <div className="live-next">
                <span className="live-label">POI, ALLE {data.prossima.inizio}</span>
                <strong>{data.prossima.nome}</strong>
                <span>{ACTIVITY_LABELS[data.prossima.attivita] ?? data.prossima.attivita}</span>
              </div>
            )}
          </div>
          {data.overrideFino && (
            <p className="live-override-note">Stato temporaneo fino alle {formatTime(data.overrideFino)}.</p>
          )}
        </section>

        <section className="live-day-section" aria-labelledby="live-day-title">
          <div className="live-section-heading">
            <div><p className="live-kicker">IL RITMO DI OGGI</p><h2 id="live-day-title">Ventiquattro ore,<br /><em>senza montaggio.</em></h2></div>
            <p className="live-section-note">Il programma reale della giornata.<br />La linea indica l’ora presente.</p>
          </div>
          <Timeline items={todaysItems} currentTime={clock.slice(0, 5)} />
          <ScheduleList items={todaysItems} />
        </section>

        <section className="live-sensor" aria-labelledby="sensor-heading">
          <div className="live-sensor-intro">
            <div><p className="live-kicker">TELEMETRIA</p><h2 id="sensor-heading">Niente da<br /><em>nascondere.</em></h2></div>
            <div className="live-sensor-status"><span className="live-offline-dot" /> SENSORE IN ATTESA</div>
          </div>
          <div className="live-traces">
            <QuietTrace label="Battito" index={0} />
            <QuietTrace label="Movimento" index={1} />
            <QuietTrace label="Riposo" index={2} />
          </div>
          <p className="live-sensor-foot">Nessun dato biometrico viene mostrato mentre il sensore è offline.</p>
        </section>

        <footer className="live-footer">
          <span>UN DIARIO PUBBLICO, NON UNA DIRETTA.</span>
          <span>AGGIORNAMENTO DATI · 60 SEC <b>·</b> {new Date(dataUpdatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
        </footer>
      </div>
    </main>
  );
}
