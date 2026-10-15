import { useListArticles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { DataErrorState } from "@/components/DataErrorState";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { getArticlePlainText } from "@/components/ArticleContent";
import { ARTICLE_CATEGORIES, normalizeArticleCategory } from "@/constants/articleCategories";
import { formatDateIt } from "@/lib/article-date";
import "@/styles/editorial.css";

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

function excerpt(contenuto: string, maxChars = 140): string {
  const clean = getArticlePlainText(contenuto);
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
}

export default function Articoli() {
  const { data: articles, isLoading, isError } = useListArticles({ publishedOnly: true });
  const [filter, setFilter] = useState<string>("Tutte");
  const categories = useMemo(() => ["Tutte", ...ARTICLE_CATEGORIES], []);

  const filtered = useMemo(() => {
    if (!articles) return [];
    if (filter === "Tutte") return articles;
    return articles.filter((a) => normalizeArticleCategory(a.categoria) === filter);
  }, [articles, filter]);
  const featured = filtered[0];
  const others = filtered.slice(1);

  if (isError) {
    return (
      <>
        <DataErrorState />
        <SiteFooter />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] pt-24 pb-20 max-w-5xl mx-auto px-5 sm:px-6 overflow-x-hidden">
      <Reveal>
        <span className="pj-mono text-[13px] uppercase tracking-[0.2em] text-[#C9C4BD]">SCRITTI</span>
        <h1 className="font-serif bebas text-[clamp(56px,12vw,112px)] leading-[0.85] text-[#E8E4DE] mt-2">ARTICOLI</h1>
        <p className="mt-6 mb-10 max-w-2xl font-sans text-[16px] leading-[1.7] text-[#E8E4DE]/80">
          Pensieri, dati, analisi. Niente di quello che non ho vissuto.
        </p>
      </Reveal>

      <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtra per categoria">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={filter === cat}
            onClick={() => setFilter(cat)}
            data-testid={`button-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
            className={`shrink-0 min-h-10 px-3 border pj-mono text-[13px] uppercase tracking-[0.14em] transition-colors ${
              filter === cat ? "bg-[#B81D1D] text-[#E8E4DE] border-[#B81D1D]" : "text-[#C9C4BD] border-[#1A1A1A] hover:border-[#B81D1D] hover:text-[#E8E4DE]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div aria-label="Caricamento articoli" className="animate-pulse">
          <div className="h-[420px] border border-[#1A1A1A] bg-[#111]" />
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            {[0, 1].map((i) => <div key={i} className="h-[320px] border border-[#1A1A1A] bg-[#111]" />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#1A1A1A] py-16 text-center" data-testid="state-articles-empty">
          <p className="font-serif bebas text-[40px] leading-none text-[#E8E4DE]">ANCORA NIENTE QUI</p>
          <p className="mt-3 pj-mono text-[13px] uppercase tracking-[0.18em] text-[#C9C4BD]">
            {filter === "Tutte" ? "Gli articoli arrivano presto." : `Nessun articolo in ${filter}.`}
          </p>
        </div>
      ) : (
        <>
          {featured && (
            <Reveal key={featured.id}>
              <Link href={`/articoli/${featured.slug}`} className="pj-related group block" data-testid={`card-article-featured-${featured.id}`}>
                <article className="relative flex min-h-[380px] flex-col justify-end overflow-hidden border border-[#1A1A1A] bg-[#0A0A0A] sm:min-h-[480px]">
                  {resolveImgUrl(featured.immagine) ? (
                    <img src={resolveImgUrl(featured.immagine) ?? undefined} alt={featured.titolo} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 crosshatch opacity-30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
                  <div className="relative p-6 sm:p-10">
                    <p className="pj-meta" data-testid="text-featured-category">
                      In evidenza · {normalizeArticleCategory(featured.categoria)} · {readingTime(featured.contenuto)} min
                      {formatDateIt(featured.data) ? ` · ${formatDateIt(featured.data)}` : ""}
                    </p>
                    <h2 className="mt-3 max-w-[720px] font-serif bebas uppercase text-[clamp(40px,7vw,72px)] leading-[0.9] text-[#E8E4DE] transition-colors break-words">
                      {featured.titolo}
                    </h2>
                    <p className="mt-4 max-w-[600px] font-sans text-[16px] leading-[1.6] text-[#E8E4DE]/75 line-clamp-2">{excerpt(featured.contenuto)}</p>
                    <span className="mt-5 inline-block pj-mono text-[13px] uppercase tracking-[0.16em] text-[#B81D1D]">Leggi →</span>
                  </div>
                </article>
              </Link>
            </Reveal>
          )}

          {others.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
              {others.map((a) => {
                const url = resolveImgUrl(a.immagine);
                const date = formatDateIt(a.data);
                return (
                  <Reveal key={a.id}>
                    <Link href={`/articoli/${a.slug}`} className="pj-related block" data-testid={`card-article-${a.id}`}>
                      <div className="relative aspect-[16/10] overflow-hidden border border-[#1A1A1A] bg-[#0F0F0F]">
                        {url ? <img src={url} alt={a.titolo} className="h-full w-full object-cover" /> : <div className="crosshatch absolute inset-0 opacity-30" />}
                      </div>
                      <p className="pj-meta mt-4">
                        {normalizeArticleCategory(a.categoria)} · {readingTime(a.contenuto)} min{date ? ` · ${date}` : ""}
                      </p>
                      <h3 className="mt-2 font-serif bebas text-[32px] leading-[0.95] text-[#E8E4DE] transition-colors break-words">{a.titolo}</h3>
                      <p className="mt-3 font-sans text-[15px] leading-[1.6] text-[#C9C4BD] line-clamp-2">{excerpt(a.contenuto, 120)}</p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
        </>
      )}

      <p className="pj-mono mt-20 text-center text-[13px] tracking-[0.4em] text-[#C9C4BD]">IC XC NIKA</p>
      <SiteFooter />
    </div>
  );
}
