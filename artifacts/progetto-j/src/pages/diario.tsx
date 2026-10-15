import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useDiaryMetrics } from "@/hooks/use-diary-metrics";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  correlations, displayValue, januaryDays, monthlyMoney, moneyTotals, periodEntries,
  personalRecords, totalsFor, weeklyLoad,
} from "@/lib/diario-analytics";
import {
  CalendarHeatmap, ChartTitle, ForceCharts, MoneyChart, PulseChart, SleepChart, WeeklyLoadChart, WeightChart,
} from "@/components/diario/charts";
import { DayList } from "@/components/diario/DayList";
import "@/components/diario/diario.css";

const SECTIONS = [
  { id: "totali", label: "TOTALI" },
  { id: "settimana", label: "SETTIMANA" },
  { id: "corpo", label: "CORPO" },
  { id: "soldi", label: "SOLDI" },
  { id: "recupero", label: "RECUPERO" },
  { id: "forza", label: "FORZA" },
  { id: "record", label: "RECORD" },
  { id: "calendario", label: "CALENDARIO" },
  { id: "giorni", label: "GIORNI" },
] as const;

const PERIODS = [
  { id: 7, label: "7G" },
  { id: 30, label: "30G" },
  { id: 90, label: "90G" },
  { id: 0, label: "TUTTO" },
] as const;

const GOAL = 1000;

function Section({ id, title, kicker, children, money = false }: { id: string; title: string; kicker?: string; children: React.ReactNode; money?: boolean }) {
  return (
    <section id={id} data-testid={`section-${id}`} className="border-t d-line py-12 md:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h2 className={`d-title text-[clamp(40px,7vw,64px)] ${money ? "d-money" : ""}`}>{title}</h2>
        {kicker && <span className="d-label">{kicker}</span>}
      </div>
      {children}
    </section>
  );
}

function scrollToId(id: string, smooth = true) {
  document.getElementById(id)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-12" aria-busy="true" aria-label="Caricamento diario">
      <div className="d-skel h-[13px] w-40" />
      <div className="d-skel mt-4 h-20 w-[min(520px,100%)]" />
      <div className="mt-12 grid grid-cols-2 gap-px md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="d-skel h-28" />)}
      </div>
      <div className="d-skel mt-12 h-[300px]" />
    </div>
  );
}

export default function Diario() {
  usePageMeta({
    title: "Diario — Project J",
    description: "Il diario pubblico dei 180 giorni: totali, settimana, corpo, soldi, recupero, forza, record e ogni giorno documentato.",
    url: "https://projectj180day.com/diario",
  });

  const { entries: all, weekly, today, isLoading, isError, refetch, isFetching } = useDiaryMetrics();
  const [period, setPeriod] = useState<number>(30);
  const [active, setActive] = useState<string>("totali");

  const model = useMemo(() => {
    const scoped = periodEntries(all, period, today);
    const currentMonth = today.slice(0, 7);
    return {
      maxDay: all.reduce((m, e) => Math.max(m, e.numero), 0),
      scoped,
      totals: totalsFor(all),
      weeks: weekly,
      money: monthlyMoney(scoped),
      moneyAll: moneyTotals(all),
      monthMoney: moneyTotals(all.filter((e) => e.data.startsWith(currentMonth))),
      records: personalRecords(all),
      corr: correlations(all),
      load: weeklyLoad(scoped),
      january: januaryDays(today),
    };
  }, [all, period, today, weekly]);

  // Active section tracking.
  useEffect(() => {
    if (isLoading || isError) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el != null);
    const observer = new IntersectionObserver((items) => {
      const hit = items.filter((i) => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: "-130px 0px -55% 0px" });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isLoading, isError]);

  // Honour initial hash and browser back/forward.
  useEffect(() => {
    if (isLoading || isError) return;
    const go = () => {
      const id = window.location.hash.slice(1);
      if (id && document.getElementById(id)) { scrollToId(id, false); setActive(id); }
    };
    const t = window.setTimeout(go, 60);
    window.addEventListener("popstate", go);
    window.addEventListener("hashchange", go);
    return () => { window.clearTimeout(t); window.removeEventListener("popstate", go); window.removeEventListener("hashchange", go); };
  }, [isLoading, isError]);

  const onNav = useCallback((event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    setActive(id);
    scrollToId(id);
  }, []);

  useEffect(() => {
    document.querySelector<HTMLElement>(`.d-nav a[href="#${active}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const goalPct = model.monthMoney.saldo != null ? (model.monthMoney.saldo / GOAL) * 100 : null;
  const goalFill = goalPct != null ? Math.min(100, Math.max(0, goalPct)) : 0;

  return (
    <div className="diario-root pt-16" data-testid="page-diario">
      {isLoading ? <Skeleton /> : isError ? (
        <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-start justify-center px-5">
          <span className="d-label d-red">ERRORE DI RETE</span>
          <h1 className="d-title mt-3 text-[56px]">DATI NON DISPONIBILI.</h1>
          <p className="mt-3 text-[15px] d-muted">Il diario non ha risposto. Nessun numero mostrato finché non arrivano quelli veri.</p>
          <button type="button" className="d-btn mt-6" onClick={() => refetch()} disabled={isFetching} data-testid="button-riprova">
            {isFetching ? "RIPROVO…" : "RIPROVA"}
          </button>
        </div>
      ) : (
        <>
          <header className="mx-auto max-w-6xl px-5 pb-10 pt-12 md:pt-16">
            <span className="d-label d-red">DIARIO PUBBLICO</span>
            <h1 className="d-title mt-3 text-[clamp(56px,10vw,128px)]" data-testid="text-giorno-corrente">
              GIORNO <span className="d-mono">{model.maxDay || "—"}</span><span className="d-mono d-muted whitespace-nowrap"> / 180</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed">Ogni giorno, tutti i numeri. Anche quelli brutti.</p>
          </header>

          <nav className="d-nav" aria-label="Sezioni del diario">
            <div className="d-nav-scroll px-2">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined} onClick={(e) => onNav(e, s.id)} data-testid={`nav-${s.id}`}>
                  {s.label}
                </a>
              ))}
            </div>
          </nav>

          <main className="mx-auto max-w-6xl px-5">
            {/* TOTALI */}
            <Section id="totali" title="TOTALI" kicker="TUTTO IL PERCORSO">
              <div className="grid grid-cols-2 border-l border-t d-line md:grid-cols-4">
                {model.totals.map((t) => (
                  <div key={t.key} className="border-b border-r d-line p-4 md:p-6" data-testid={`total-${t.key}`}>
                    <div className="d-mono text-[clamp(30px,6vw,56px)] leading-none">
                      {t.value == null ? "—" : (
                        <AnimatedNumber animate={false} value={t.value} formatter={(n) => `${n.toLocaleString("it-IT", { minimumFractionDigits: t.decimals, maximumFractionDigits: t.decimals })}${"suffix" in t && typeof t.suffix === "string" ? t.suffix : ""}`} />
                      )}
                    </div>
                    <div className="d-label mt-3">{t.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[14px] d-muted">Allenamenti e ore usano solo durata e tipo registrati. Le attività storiche prive di questi campi non permettono di ricostruire il numero completo degli allenamenti.</p>
            </Section>

            {/* SETTIMANA */}
            <Section id="settimana" title="SETTIMANA" kicker="LUN–DOM · EUROPE/ROME">
              <p className="mb-6 text-[17px]">Questa settimana vs la precedente.</p>
              <div className="border-t d-line">
                <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 border-b d-line py-3 md:grid">
                  <span className="d-label">METRICA</span><span className="d-label text-right">PRECEDENTE</span>
                  <span className="d-label text-right">QUESTA</span><span className="d-label text-right">DELTA</span>
                </div>
                {model.weeks.map((w) => {
                  const color = w.trend === "better" ? "#B81D1D" : "#C9C4BD";
                  const delta = w.delta == null ? "—" : `${w.delta > 0 ? "▲" : w.delta < 0 ? "▼" : "→"} ${Math.abs(w.delta).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`;
                  return (
                    <div key={w.key} className="grid grid-cols-3 gap-x-3 gap-y-1 border-b d-line py-4 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-4" data-testid={`week-${w.key}`}>
                      <span className="d-mono col-span-3 text-[15px] md:col-span-1">{w.label}{w.unit && <span className="d-muted"> · {w.unit}</span>}</span>
                      <span className="d-mono text-[15px] d-muted md:text-right"><span className="d-label mr-2 md:hidden">PREC</span>{displayValue(w.previous, "", w.decimals)}</span>
                      <span className="d-mono text-[15px] md:text-right"><span className="d-label mr-2 md:hidden">ORA</span>{displayValue(w.current, "", w.decimals)}</span>
                      <span className="d-mono text-right text-[15px]" style={{ color: w.delta == null ? "#C9C4BD" : color }}>{delta}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[14px] d-muted">Rosso = meglio. Grigio = peggio. "—" quando una settimana non ha dati.</p>
            </Section>

            {/* Period selector — applies to CORPO, SOLDI chart, RECUPERO, FORZA */}
            <div className="flex flex-wrap items-center gap-4 border-t d-line py-6" data-testid="period-selector">
              <span className="d-label">PERIODO GRAFICI</span>
              <div className="flex">
                {PERIODS.map((p) => (
                  <button key={p.id} type="button" className="d-btn -ml-px first:ml-0" aria-pressed={period === p.id} onClick={() => setPeriod(p.id)} data-testid={`period-${p.label}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <span className="text-[14px] d-muted">Vale per corpo, grafico soldi, recupero e forza.</span>
            </div>

            {/* CORPO */}
            <Section id="corpo" title="CORPO" kicker={period === 0 ? "TUTTO IL PERCORSO" : `ULTIMI ${period} GIORNI`}>
              <ChartTitle note="KG">PESO</ChartTitle>
              <WeightChart entries={model.scoped} />
            </Section>

            {/* SOLDI */}
            <Section id="soldi" title="SOLDI" kicker="EURO" money>
              <ChartTitle note={period === 0 ? "MENSILE · TUTTO" : `MENSILE · ULTIMI ${period} GIORNI`}>ENTRATE, USCITE, SALDO</ChartTitle>
              <MoneyChart months={model.money} />
              <div className="mt-3 flex flex-wrap gap-5 d-label">
                <span className="flex items-center gap-2"><span className="inline-block h-[13px] w-[13px]" style={{ background: "var(--money)" }} />ENTRATE</span>
                <span className="flex items-center gap-2"><span className="inline-block h-[13px] w-[13px]" style={{ background: "#6E6A65" }} />USCITE</span>
                <span className="flex items-center gap-2"><span className="inline-block h-[2px] w-[18px]" style={{ background: "#E8E4DE" }} />SALDO</span>
              </div>

              <div className="mt-10 border d-line p-5 md:p-8" style={{ borderColor: "var(--money)" }} data-testid="block-obiettivo">
                <div className="d-label d-money">OBIETTIVO: 1.000 € AL MESE FINO A GENNAIO</div>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <span className="d-mono text-[clamp(36px,8vw,64px)] leading-none d-money" data-testid="text-saldo-mese">{displayValue(model.monthMoney.saldo, " €", 2)}</span>
                  <span className="d-mono text-[17px] d-muted">/ 1.000 €</span>
                  {goalPct != null && <span className="d-mono text-[17px]">{goalPct.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</span>}
                </div>
                <div className="d-bar-track mt-5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(goalFill)} aria-label="Saldo del mese rispetto a 1.000 €">
                  <div className="d-bar-fill" style={{ transform: `scaleX(${goalFill / 100})` }} />
                </div>
                {model.monthMoney.saldo == null && (
                  <p className="mt-3 text-[14px] d-muted">Saldo del mese non calcolabile: servono sia entrate sia uscite registrate questo mese.</p>
                )}
                <div className="d-mono mt-6 text-[17px]" data-testid="text-giorni-gennaio">GIORNI A GENNAIO: {model.january}</div>
              </div>

              <div className="mt-8 grid grid-cols-1 border-l border-t d-line sm:grid-cols-3">
                {([["ENTRATE TOTALI", model.moneyAll.entrate], ["USCITE TOTALI", model.moneyAll.uscite], ["SALDO", model.moneyAll.saldo]] as const).map(([label, v]) => (
                  <div key={label} className="border-b border-r d-line p-5">
                    <div className="d-mono text-[clamp(28px,5vw,40px)] leading-none d-money">{displayValue(v, " €", 2)}</div>
                    <div className="d-label mt-3">{label}</div>
                  </div>
                ))}
              </div>
              {model.moneyAll.saldo == null && (model.moneyAll.entrate != null || model.moneyAll.uscite != null) && (
                <p className="mt-3 text-[14px] d-muted">Il saldo appare quando sono registrate sia entrate sia uscite.</p>
              )}
            </Section>

            {/* RECUPERO */}
            <Section id="recupero" title="RECUPERO" kicker="SCALE SEPARATE">
              <div className="grid gap-8 md:grid-cols-2">
                <div><ChartTitle note="ORE">SONNO</ChartTitle><SleepChart entries={model.scoped} /></div>
                <div><ChartTitle note="BPM A RIPOSO">BATTITO</ChartTitle><PulseChart entries={model.scoped} /></div>
              </div>
            </Section>

            {/* FORZA */}
            <Section id="forza" title="FORZA" kicker="OGNI PROVA HA LA SUA SCALA">
              <ForceCharts entries={model.scoped} />
              <div className="mt-10">
                <ChartTitle note="MINUTI × INTENSITÀ">CARICO SETTIMANALE</ChartTitle>
                <WeeklyLoadChart weeks={model.load} />
              </div>
            </Section>

            {/* RECORD */}
            <Section id="record" title="RECORD" kicker="CALCOLATI DAI DATI">
              <div className="grid grid-cols-1 border-l border-t d-line sm:grid-cols-2 lg:grid-cols-4">
                {model.records.map((r) => (
                  <div key={r.key} className="flex flex-col justify-between gap-4 border-b border-r d-line p-5" data-testid={`record-${r.key}`}>
                    <div className="d-label">{r.label}</div>
                    <div className="d-mono text-[clamp(32px,5vw,48px)] leading-none">
                      {displayValue(r.value, "", 1)}{r.value != null && r.unit && <span className="text-[15px] d-muted"> {r.unit}</span>}
                    </div>
                    {r.numero != null
                      ? <Link href={`/giorno/${r.numero}`} className="d-link d-mono text-[14px]" data-testid={`link-record-${r.key}`}>GIORNO {r.numero} →</Link>
                      : <span className="d-mono text-[14px] d-muted">—</span>}
                  </div>
                ))}
              </div>
            </Section>

            {/* CORRELAZIONI — only when the helper returns valid groups */}
            {model.corr.length > 0 && (
              <section id="correlazioni" data-testid="section-correlazioni" className="border-t d-line py-12 md:py-16">
                <h2 className="d-title mb-8 text-[clamp(40px,7vw,64px)]">CORRELAZIONI</h2>
                <div className="space-y-6">
                  {model.corr.map((c) => (
                    <p key={c.key} className="max-w-3xl border-l-2 pl-5 text-[clamp(18px,2.4vw,24px)] leading-snug" style={{ borderColor: "#B81D1D" }}>
                      {c.text.split(/(\d+(?:[.,]\d+)*)/g).map((part, index) => /^\d/.test(part) ? <span key={index} className="d-mono">{part}</span> : part)}
                    </p>
                  ))}
                </div>
                <p className="mt-6 text-[14px] d-muted">Confronti descrittivi, minimo 8 giorni per gruppo. Non sono diagnosi.</p>
              </section>
            )}

            {/* CALENDARIO */}
            <Section id="calendario" title="CALENDARIO" kicker="TOCCA UN GIORNO">
              <CalendarHeatmap entries={all} today={today} />
            </Section>

            {/* GIORNI */}
            <Section id="giorni" title="GIORNI" kicker={`${all.length} DOCUMENTATI`}>
              {all.length === 0 ? (
                <div className="border d-line px-6 py-14 text-center"><p className="d-title text-[36px]">IL PRIMO GIORNO ARRIVA PRESTO.</p></div>
              ) : <DayList entries={all} today={today} />}
            </Section>
          </main>
        </>
      )}
      <div className="diario-footer mt-10"><SiteFooter /></div>
    </div>
  );
}
