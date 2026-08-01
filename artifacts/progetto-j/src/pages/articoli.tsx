import { useListArticles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

export default function Articoli() {
  const { data: articles, isLoading, isError } = useListArticles();
  const [filter, setFilter] = useState<string>("Tutte");

  const categories = useMemo(() => {
    const set = new Set(articles?.map((a) => a.categoria) ?? []);
    return ["Tutte", ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    if (!articles) return [];
    if (filter === "Tutte") return articles;
    return articles.filter((a) => a.categoria === filter);
  }, [articles, filter]);

  if (isError) {
    return (
      <>
        <DataErrorState />
        <SiteFooter />
      </>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-5xl mx-auto px-5 sm:px-6">
      <Reveal>
        <div className="mb-6">
          <span className="page-label">SCRITTI</span>
          <h1 className="font-serif text-[clamp(56px,12vw,112px)] leading-[0.85] tracking-wide bebas text-foreground mt-2">
            ARTICOLI
          </h1>
        </div>
      </Reveal>

      <Reveal>
        <p className="text-[15px] sm:text-[16px] font-sans text-foreground/80 leading-relaxed mb-10 max-w-2xl ink-line">
          Pensieri, dati e analisi. Finanza, fede, sport, mindset, business. Senza fronzoli.
        </p>
      </Reveal>

      {/* Category filter */}
      <Reveal>
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-[11px] font-sans uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors ${
                filter === cat ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground font-sans text-[14px] uppercase tracking-[0.2em]">
            Gli articoli arrivano presto.
          </div>
        ) : (
          filtered.map((a) => (
            <Reveal key={a.id}>
              <Link href={`/a/${a.slug}`}>
                <article className="group block border border-border bg-card p-5 metallic-sheen hover:border-primary transition-colors h-full">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-primary">{a.categoria}</span>
                    <span className="text-[11px] font-sans text-muted-foreground">
                      {format(new Date(a.data), "d MMM yyyy", { locale: it })}
                    </span>
                  </div>
                  <h3 className="font-serif text-[28px] leading-none text-foreground bebas mb-3">{a.titolo}</h3>
                  <p className="text-[13px] font-sans text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {a.contenuto.slice(0, 160)}...
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-sans uppercase tracking-[0.15em] text-primary group-hover:text-foreground transition-colors">
                    Leggi <ArrowRight size={14} />
                  </div>
                </article>
              </Link>
            </Reveal>
          ))
        )}
      </div>

      <div className="mt-16 flex justify-center">
        <Cross />
      </div>
      <SiteFooter />
    </div>
  );
}
