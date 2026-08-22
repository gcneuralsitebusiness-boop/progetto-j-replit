import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LabelList,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  overview: { today: number; last7d: number; last30d: number };
  dailySeries: { date: string; views: number }[];
  topPages: { path: string; views: number; avgDuration: number | null; avgScroll: number | null }[];
  articles: { path: string; titolo: string; views: number; avgDuration: number | null; avgScroll: number | null; completionRate: number | null }[];
  diary: { path: string; giorno: string; views: number; avgDuration: number | null; avgScroll: number | null }[];
  sources: { name: string; count: number }[];
  devices: { mobile: number; desktop: number; mobileCount: number; desktopCount: number };
  realtime: { total: number; pages: { path: string; count: number }[] };
}

type Period = "today" | "7d" | "30d" | "all";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Oggi" },
  { id: "7d", label: "7 Giorni" },
  { id: "30d", label: "30 Giorni" },
  { id: "all", label: "Tutto" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(sec: number | null): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function fmtScroll(pct: number | null): string {
  return pct == null ? "—" : `${pct}%`;
}

function appPath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === base || normalized.startsWith(`${base}/`)
    ? normalized
    : `${base}${normalized}`;
}

function adminArticlePath(slug: string): string {
  return `${import.meta.env.BASE_URL}admin?editArticle=${encodeURIComponent(slug)}`;
}

function adminDiaryPath(day: string): string {
  return `${import.meta.env.BASE_URL}admin?editDay=${encodeURIComponent(day)}`;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-6 md:p-8">
      <h3 className="text-[20px] font-serif tracking-[0.1em] uppercase text-foreground mb-6">{title}</h3>
      {children}
    </div>
  );
}

// ─── Sortable articles table ──────────────────────────────────────────────────

type ArticleSortKey = "views" | "avgDuration" | "avgScroll" | "completionRate";

function ArticlesTable({ articles }: { articles: AnalyticsData["articles"] }) {
  const [sortKey, setSortKey] = useState<ArticleSortKey>("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...articles].sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [articles, sortKey, sortDir]);

  const toggleSort = (key: ArticleSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const th = (label: string, key?: ArticleSortKey) => (
    <th
      onClick={key ? () => toggleSort(key) : undefined}
      className={`text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3 ${key ? "cursor-pointer hover:text-foreground select-none" : ""}`}
    >
      {label}{key && sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
    </th>
  );

  if (articles.length === 0) return <p className="text-muted-foreground font-sans text-[14px]">Nessun dato ancora.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {th("Titolo")}
            {th("Views", "views")}
            {th("Tempo medio", "avgDuration")}
            {th("Scroll medio", "avgScroll")}
            {th("Completamento", "completionRate")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.path} className="border-b border-border/50 hover:bg-[#141414] transition-colors">
              <td className="py-2.5 px-3 font-sans text-[14px] text-foreground max-w-[300px] truncate">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a
                    href={appPath(a.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {a.titolo}
                  </a>
                  <a
                    href={adminArticlePath(a.path.replace(/^\/a\//, ""))}
                    className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                  >
                    Modifica
                  </a>
                </div>
              </td>
              <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-foreground">{a.views}</td>
              <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-muted-foreground">{fmtDuration(a.avgDuration)}</td>
              <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-muted-foreground">{fmtScroll(a.avgScroll)}</td>
              <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-[#B87333]">{a.completionRate == null ? "—" : `${a.completionRate}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function AnalyticsTab() {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: Period) => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  // Realtime auto-refresh every 30 s, but never while the tab is hidden.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") load(period);
    };
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [period, load]);

  if (error) return <p className="text-primary font-sans">Errore nel caricamento delle statistiche.</p>;
  if (!data) return <p className="text-muted-foreground font-serif text-xl animate-pulse">Caricamento...</p>;

  const maxSource = Math.max(1, ...data.sources.map((s) => s.count));

  return (
    <div className="space-y-10">
      {/* ── Period filter ── */}
      <div className="flex gap-0 border border-border w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            data-testid={`period-${p.id}`}
            className={`px-5 py-2 font-serif text-[13px] tracking-[0.1em] uppercase transition-colors ${
              period === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Realtime ── */}
      <div className="bg-card border border-border p-6 md:p-8 text-center">
        <div className="text-[64px] md:text-[80px] font-serif text-primary leading-none tabular-nums" data-testid="realtime-count">
          {data.realtime.total}
        </div>
        <div className="text-[13px] uppercase tracking-[0.2em] text-muted-foreground font-serif mt-2">
          {data.realtime.total === 1 ? "Persona sul sito ora" : "Persone sul sito ora"}
        </div>
        {data.realtime.pages.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {data.realtime.pages.map((p) => (
              <span key={p.path} className="text-[12px] font-sans text-foreground bg-[#141414] border border-border px-3 py-1">
                {p.path} <span className="text-[#B87333] tabular-nums">×{p.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Overview ── */}
      <Section title="Panoramica">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Oggi", value: data.overview.today },
            { label: "Ultimi 7 giorni", value: data.overview.last7d },
            { label: "Ultimi 30 giorni", value: data.overview.last30d },
          ].map((s) => (
            <div key={s.label} className="border border-border p-4 md:p-6 text-center">
              <div className="text-[36px] md:text-[48px] font-serif text-foreground leading-none tabular-nums">{s.value}</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-2 font-serif">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailySeries} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6E6A65", fontSize: 11, fontFamily: "Bebas Neue" }}
                stroke="#6E6A65"
                tickFormatter={(d: string) => d.slice(5).replace("-", "/")}
              />
              <YAxis tick={{ fill: "#6E6A65", fontSize: 11, fontFamily: "Bebas Neue" }} stroke="#6E6A65" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0A0A0A", border: "1px solid #262626", fontFamily: "Inter", fontSize: 12 }}
                labelStyle={{ color: "#E8E4DE" }}
                itemStyle={{ color: "#B81D1D" }}
              />
              <Line
                type="monotone"
                dataKey="views"
                name="Visitatori"
                stroke="#B81D1D"
                strokeWidth={2}
                dot={{ fill: "#B87333", r: 3, strokeWidth: 0 }}
                activeDot={{ fill: "#B87333", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── Top pages ── */}
      <Section title="Pagine più viste">
        {data.topPages.length === 0 ? (
          <p className="text-muted-foreground font-sans text-[14px]">Nessun dato ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Pagina</th>
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Views</th>
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Tempo medio</th>
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Scroll medio</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((p) => (
                <tr key={p.path} className="border-b border-border/50 hover:bg-[#141414] transition-colors">
                    <td className="py-2.5 px-3 font-sans text-[14px] text-foreground max-w-[300px] truncate">
                      <a href={appPath(p.path)} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        {p.path}
                      </a>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-foreground">{p.views}</td>
                    <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-muted-foreground">{fmtDuration(p.avgDuration)}</td>
                    <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-muted-foreground">{fmtScroll(p.avgScroll)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Articles ── */}
      <Section title="Articoli">
        <ArticlesTable articles={data.articles} />
      </Section>

      {/* ── Diary ── */}
      <Section title="Diario">
        {data.diary.length === 0 ? (
          <p className="text-muted-foreground font-sans text-[14px]">Nessun dato ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Giorno</th>
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Views</th>
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Tempo medio</th>
                  <th className="text-left text-[11px] uppercase tracking-widest text-muted-foreground font-normal py-2 px-3">Scroll medio</th>
                </tr>
              </thead>
              <tbody>
                {data.diary.map((d) => (
                  <tr key={d.path} className="border-b border-border/50 hover:bg-[#141414] transition-colors">
                    <td className="py-2.5 px-3 font-serif text-[16px] text-primary">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <a href={appPath(d.path)} target="_blank" rel="noopener noreferrer" className="hover:text-primary/80 transition-colors">
                          GIORNO {d.giorno}
                        </a>
                        <a href={adminDiaryPath(d.giorno)} className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
                          Modifica
                        </a>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-foreground">{d.views}</td>
                    <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-muted-foreground">{fmtDuration(d.avgDuration)}</td>
                    <td className="py-2.5 px-3 font-sans text-[14px] tabular-nums text-muted-foreground">{fmtScroll(d.avgScroll)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Sources ── */}
      <Section title="Provenienza">
        <div className="space-y-3">
          {data.sources.map((s) => (
            <div key={s.name} className="flex items-center gap-4">
              <div className="w-24 text-[12px] uppercase tracking-widest text-muted-foreground font-serif shrink-0">{s.name}</div>
              <div className="flex-1 h-6 bg-[#141414] relative">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(s.count / maxSource) * 100}%` }}
                />
              </div>
              <div className="w-12 text-right text-[14px] font-sans tabular-nums text-foreground shrink-0">{s.count}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Devices ── */}
      <Section title="Dispositivi">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border p-6 md:p-10 text-center">
            <div className="text-[56px] md:text-[72px] font-serif text-primary leading-none tabular-nums">{data.devices.mobile}%</div>
            <div className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground mt-3 font-serif">Mobile</div>
          </div>
          <div className="border border-border p-6 md:p-10 text-center">
            <div className="text-[56px] md:text-[72px] font-serif text-[#B87333] leading-none tabular-nums">{data.devices.desktop}%</div>
            <div className="text-[12px] uppercase tracking-[0.2em] text-muted-foreground mt-3 font-serif">Desktop</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
