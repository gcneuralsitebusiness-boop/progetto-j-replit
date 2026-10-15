import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetArticle, useListArticles } from "@workspace/api-client-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { SiteFooter } from "@/components/SiteFooter";
import { EmailCapture } from "@/components/EmailCapture";
import { ArticleContent, getArticlePlainText } from "@/components/ArticleContent";
import { normalizeArticleCategory } from "@/constants/articleCategories";
import { useDiaryMetrics } from "@/hooks/use-diary-metrics";
import { usePageMeta } from "@/hooks/use-page-meta";
import { dateKey, formatDateIt } from "@/lib/article-date";
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

function ReadingProgress({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const barRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = target.current;
      const bar = barRef.current;
      if (!el || !bar) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total <= 0 ? (rect.top <= 0 ? 1 : 0) : Math.min(1, Math.max(0, -rect.top / total));
      bar.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target]);
  return <div className="pj-progress" aria-hidden="true" data-testid="progress-reading"><span ref={barRef} /></div>;
}

function ArticleSkeleton() {
  return (
    <div className="min-h-[100dvh] pt-28 px-5" aria-label="Caricamento articolo">
      <div className="pj-article animate-pulse">
        <div className="h-[13px] w-40 bg-[#1A1A1A]" />
        <div className="mt-6 h-14 w-full bg-[#141414]" />
        <div className="mt-3 h-14 w-2/3 bg-[#141414]" />
        <div className="mt-10 space-y-4">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-[#141414]" style={{ width: `${92 - i * 7}%` }} />)}
        </div>
      </div>
    </div>
  );
}

export default function Articolo() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? "";
  const articleRef = useRef<HTMLElement>(null);

  const { data: article, isLoading, isError, refetch } = useGetArticle(slug, {
    query: { queryKey: ["getArticle", slug], enabled: !!slug, retry: false },
  });
  const { data: articles } = useListArticles({ publishedOnly: true });
  const { entries } = useDiaryMetrics();
  const [shareStatus, setShareStatus] = useState("");

  const articleDate = dateKey(article?.data);
  const linkedDay = useMemo(
    () => (articleDate ? entries.find((e) => dateKey(e.data) === articleDate) : undefined),
    [entries, articleDate],
  );

  const related = useMemo(() => {
    if (!article || !articles) return [];
    const others = articles.filter((a) => a.slug !== article.slug && a.id !== article.id);
    const cat = normalizeArticleCategory(article.categoria);
    const picked = others.filter((a) => normalizeArticleCategory(a.categoria) === cat).slice(0, 2);
    for (const a of others) {
      if (picked.length >= 2) break;
      if (!picked.some((p) => p.id === a.id)) picked.push(a);
    }
    return picked;
  }, [article, articles]);

  usePageMeta({
    title: article ? `${article.titolo} — Progetto J` : "Articolo — Progetto J",
    description: article ? getArticlePlainText(article.contenuto).slice(0, 160) : "Articoli di Progetto J.",
    image: resolveImgUrl(article?.immagine),
    url: `/articoli/${slug}`,
  });

  if (isLoading) return <ArticleSkeleton />;

  if (isError || !article) {
    return (
      <>
        <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-5 pt-16 text-center" data-testid="state-article-error">
          <span className="pj-mono text-[96px] leading-[0.8] text-[#B81D1D]">404</span>
          <p className="pj-mono text-[13px] uppercase tracking-[0.2em] text-[#C9C4BD]">Articolo non trovato o non raggiungibile.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="pj-btn" onClick={() => void refetch()} data-testid="button-article-retry">Riprova</button>
            <Link href="/articoli" className="pj-btn inline-flex items-center" data-testid="link-article-archive">Tutti gli articoli</Link>
          </div>
        </div>
        <SiteFooter hideEmailCapture />
      </>
    );
  }

  const imgUrl = resolveImgUrl(article.immagine);
  const minutes = readingTime(article.contenuto);
  const dateLabel = formatDateIt(article.data);
  const category = normalizeArticleCategory(article.categoria);

  const flash = (msg: string) => {
    setShareStatus(msg);
    window.setTimeout(() => setShareStatus(""), 2600);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("Link copiato");
    } catch {
      flash("Impossibile condividere. Copia l'indirizzo dalla barra del browser.");
    }
  };
  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.titolo, text: article.titolo, url: window.location.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <ReadingProgress target={articleRef} />
      <article ref={articleRef} className="pt-24 pb-6">
        <div className="px-5">
          <div className="pj-article">
            <Link href="/articoli" className="pj-mono text-[13px] uppercase tracking-[0.2em] text-[#C9C4BD] hover:text-[#B81D1D]" data-testid="link-back-articoli">
              ← Articoli
            </Link>
            <h1 className="mt-8 font-serif bebas uppercase text-[clamp(44px,9vw,80px)] leading-[0.88] text-[#E8E4DE] break-words" data-testid="text-article-title">
              {article.titolo}
            </h1>
            <p className="pj-meta mt-5" data-testid="text-article-meta">
              <span data-testid="text-article-category">{category}</span>
              <span> · </span>
              <span>{minutes} min</span>
              {dateLabel && <><span> · </span><span data-testid="text-article-date">{dateLabel}</span></>}
            </p>
          </div>
        </div>

        {imgUrl && (
          <div className="pj-cover mt-10" data-testid="img-article-cover">
            <img src={imgUrl} alt={article.titolo} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
          </div>
        )}

        <div className="px-5 mt-12">
          <div className="pj-article" data-testid="article-body">
            <ArticleContent contenuto={article.contenuto} />
          </div>
        </div>
      </article>

      {/* END BLOCK */}
      <section className="px-5 pb-20" data-testid="section-article-end">
        <div className="pj-article">
          <hr className="border-0 border-t border-[#1A1A1A]" />
          <p className="pj-mono mt-8 text-center text-[13px] tracking-[0.4em] text-[#E8E4DE]">IC XC NIKA</p>

          {linkedDay && (
            <Link href={`/giorno/${linkedDay.numero}`} className="pj-link-row mt-10 text-[#E8E4DE]" data-testid="link-matching-day">
              <span className="font-serif bebas text-[32px] leading-none">
                SCRITTO IL GIORNO <span className="pj-mono text-[28px]">{linkedDay.numero}</span>
              </span>
              <span className="pj-mono text-[18px] text-[#B81D1D]">→</span>
            </Link>
          )}
        </div>

        <div className="mt-12 -mx-5">
          <EmailCapture intro="Ogni domenica mando quello che ho imparato nella settimana." />
        </div>

        {related.length > 0 && (
          <div className="pj-article mt-14" data-testid="section-related">
            <h2 className="pj-mono text-[13px] uppercase tracking-[0.2em] text-[#C9C4BD]">ALTRI ARTICOLI</h2>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {related.map((a) => {
                const url = resolveImgUrl(a.immagine);
                return (
                  <Link key={a.id} href={`/articoli/${a.slug}`} className="pj-related block" data-testid={`card-related-${a.id}`}>
                    <div className="relative aspect-[16/10] overflow-hidden border border-[#1A1A1A] bg-[#0F0F0F]">
                      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="crosshatch absolute inset-0 opacity-30" />}
                    </div>
                    <p className="pj-meta mt-4">{normalizeArticleCategory(a.categoria)} · {readingTime(a.contenuto)} min</p>
                    <h3 className="mt-2 font-serif bebas text-[28px] leading-[0.95] text-[#E8E4DE] transition-colors break-words">{a.titolo}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="pj-article mt-14 flex items-center gap-4">
          <button type="button" className="pj-btn" onClick={() => void shareArticle()} data-testid="button-share-article">
            Condividi
          </button>
          <span role="status" aria-live="polite" className="font-sans text-[13px] text-[#C9C4BD]" data-testid="status-share">{shareStatus}</span>
        </div>
      </section>

      <SiteFooter hideEmailCapture />
    </div>
  );
}
