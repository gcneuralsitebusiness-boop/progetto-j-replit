import { useListArticles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getArticlePlainText } from "@/components/ArticleContent";
import { ARTICLE_CATEGORIES } from "@/constants/articleCategories";

function resolveImgUrl(immagine: string | null | undefined): string | null {
  if (!immagine) return null;
  const obj = getPhotoUrl(immagine);
  if (obj) return obj;
  if (immagine.startsWith("http")) return immagine;
  return null;
}

function readingTime(testo: string): number {
  const plainText = getArticlePlainText(testo);
  const words = plainText ? plainText.split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 200));
}

function excerpt(contenuto: string, maxChars = 120): string {
  const clean = getArticlePlainText(contenuto);
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
}

export default function Articoli() {
  const { data: articles, isLoading, isError } = useListArticles();
  const [filter, setFilter] = useState<string>("Tutte");

  const categories = useMemo(() => {
    const legacyCategories = Array.from(new Set(
      (articles ?? [])
        .map((article) => article.categoria)
        .filter((category) => !ARTICLE_CATEGORIES.includes(category as (typeof ARTICLE_CATEGORIES)[number])),
    ));
    return ["Tutte", ...ARTICLE_CATEGORIES, ...legacyCategories];
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
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 min-h-10 text-[11px] font-sans uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors ${
                filter === cat ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-iron hover:text-iron"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Article grid — 1-col mobile / 2-col tablet+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Caricamento articoli">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-[360px] border border-border bg-card animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground font-sans text-[14px] uppercase tracking-[0.2em]">
            Gli articoli arrivano presto.
          </div>
        ) : (
          filtered.map((a) => {
            const imgUrl = resolveImgUrl(a.immagine);
            const minutes = readingTime(a.contenuto);
            const ex = excerpt(a.contenuto);

            return (
              <Reveal key={a.id}>
                <Link href={`/a/${a.slug}`}>
                  <article className="group block border border-border bg-card hover:border-iron transition-colors h-full flex flex-col card-lift bracket-hover">
                    {/* Cover image — 16:9 */}
                    <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                      {imgUrl ? (
                        <>
                          <img
                            src={imgUrl}
                            alt={a.titolo}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 h-full w-full border border-iron bg-[#0A0A0A]">
                          <div className="crosshatch absolute inset-0 opacity-30" />
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-sans uppercase tracking-[0.2em] text-[#3A3A3A]">
                            NESSUNA IMMAGINE
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Category badge + date */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-sans uppercase tracking-[0.2em] border border-border px-2 py-1 text-muted-foreground">
                          {a.categoria}
                        </span>
                        <span className="text-[11px] font-sans text-muted-foreground">
                          {format(new Date(a.data), "d MMM yyyy", { locale: it })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-[26px] leading-none text-foreground bebas mb-3 group-hover:text-primary transition-colors">
                        {a.titolo}
                      </h3>

                      {/* Excerpt — 2 lines */}
                      <p className="text-[13px] font-sans text-muted-foreground leading-relaxed line-clamp-2 flex-1 mb-4">
                        {ex}
                      </p>

                      {/* Reading time */}
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-sans uppercase tracking-[0.15em] text-primary">
                        {minutes} min di lettura <ArrowRight size={13} aria-hidden="true" />
                      </span>
                    </div>
                  </article>
                </Link>
              </Reveal>
            );
          })
        )}
      </div>

      <div className="mt-16 flex justify-center">
        <Cross />
      </div>
      <SiteFooter />
    </div>
  );
}
