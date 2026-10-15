import { Link } from "wouter";
import type { Article, EntryLight } from "@workspace/api-client-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { displayValue } from "@/lib/diario-analytics";
import { stripHtml } from "@/lib/strip-html";

type Weekly = {
  key: string; label: string; previous: number | null; current: number | null;
  delta: number | null; trend: "better" | "worse" | "same" | null; unit: string; decimals: number;
};

export function HomeError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="home-error" role="alert">
      <span className="home-label">{label} NON DISPONIBILE</span>
      <button type="button" className="home-btn home-btn-ghost" onClick={onRetry} data-testid={`button-retry-${label.toLowerCase()}`}>RIPROVA</button>
    </div>
  );
}

export function FrictionQuote({ entry }: { entry: EntryLight }) {
  return (
    <section className="home-section home-wrap">
      <Link href={`/giorno/${entry.numero}`} className="home-quote" data-testid="link-latest-attrito">
        <span className="home-label" style={{ color: "var(--h-red)" }}>ATTRITO · GIORNO {entry.numero}</span>
        <q data-testid="text-latest-attrito">{entry.attrito?.trim()}</q>
      </Link>
    </section>
  );
}

const WEEK_KEYS = ["allenamenti", "sonno", "peso", "uscite"];

export function WeekBlock({ weekly }: { weekly: Weekly[] }) {
  const rows = WEEK_KEYS.map((k) => weekly.find((w) => w.key === k)).filter((w): w is Weekly => Boolean(w));
  return (
    <div>
      {rows.map((row) => {
        const diff = row.previous == null || row.current == null ? null : row.current - row.previous;
        const arrow = diff == null ? "" : diff > 0 ? "▲" : diff < 0 ? "▼" : "→";
        const pct = row.delta == null ? "—" : `${displayValue(Math.abs(row.delta), "%", 1)}`;
        return (
          <div key={row.key} className="home-week-row" data-testid={`row-week-${row.key}`}>
            <span className="home-label" style={{ color: "var(--h-ivory)" }}>{row.label}</span>
            <span className="home-week-prev hidden sm:block">PREC {displayValue(row.previous, row.unit, row.decimals)}</span>
            <span className="home-week-val">{displayValue(row.current, row.unit, row.decimals)}</span>
            <span className={`home-week-delta col-span-2 sm:col-span-1 home-${row.trend ?? "same"}`}>
              {diff == null ? "—" : `${arrow} ${pct}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function readingTime(content: string | null | undefined): string {
  const words = content ? stripHtml(content).trim().split(/\s+/).filter(Boolean).length : 0;
  return words ? `${Math.max(1, Math.round(words / 220))} MIN` : "—";
}

export function ArticleCard({ article }: { article: Article }) {
  const src = article.immagine ? getPhotoUrl(article.immagine) ?? article.immagine : null;
  return (
    <Link href={`/a/${article.slug}`} className="home-article" data-testid={`card-article-${article.id}`}>
      <div className="cover">
        {src ? <img src={src} alt={article.titolo} loading="lazy" /> : <div className="nophoto home-label">NESSUNA FOTO</div>}
      </div>
      <div style={{ padding: 18 }}>
        <div className="home-label flex justify-between gap-3">
          <span style={{ color: "var(--h-red)" }}>{article.categoria}</span>
          <span>{readingTime(article.contenuto)}</span>
        </div>
        <h3>{article.titolo}</h3>
      </div>
    </Link>
  );
}

export function SeasonBlock({ maxDay }: { maxDay: number }) {
  if (maxDay >= 180) return null;
  return (
    <section className="home-section home-wrap">
      <div className="home-season" data-testid="block-season-2">
        <span className="home-label lbl">STAGIONE 2</span>
        <h2 className="home-h2"><span className="home-mono">180</span> GIORNI PER MIGLIORARLA</h2>
        <div className="count" data-testid="text-season-countdown">TRA {180 - maxDay} GIORNI</div>
        <p style={{ marginTop: 14, fontSize: 16, color: "var(--h-gray)" }}>Corpo. Soldi. Testa. Ogni settimana deve battere la precedente.</p>
      </div>
    </section>
  );
}
