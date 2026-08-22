import { useRoute, Link } from "wouter";
import { useGetArticle, useListArticles, useListEntries } from "@workspace/api-client-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { ArrowLeft, ArrowRight, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { ArticleContent, getArticlePlainText } from "@/components/ArticleContent";
import { AccessoBlock } from "@/components/AccessoBlock";
import { normalizeArticleCategory } from "@/constants/articleCategories";

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

export default function Articolo() {
  const [, params] = useRoute("/a/:slug");
  const slug = params?.slug ?? "";

  const { data: article, isLoading, isError } = useGetArticle(slug, {
    query: { queryKey: ["getArticle", slug], enabled: !!slug, retry: false },
  });
  const { data: entries } = useListEntries();
  const { data: articles } = useListArticles();
  const [shareFeedback, setShareFeedback] = useState(false);
  const linkedDay = article ? entries?.find((e) => e.data === article.data) : undefined;
  const articleIndex = articles?.findIndex((item) => item.slug === slug) ?? -1;
  const nextArticle = articles && articles.length > 0
    ? articles[(articleIndex >= 0 ? articleIndex + 1 : 0) % articles.length]
    : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-2xl text-muted-foreground pt-16">
        Caricamento...
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 pt-16">
        <span className="font-serif text-[96px] leading-[0.8] text-primary bebas">404</span>
        <p className="font-sans text-muted-foreground text-[15px] uppercase tracking-[0.2em]">Articolo non trovato.</p>
      </div>
    );
  }

  const imgUrl = resolveImgUrl(article.immagine);
  const minutes = readingTime(article.contenuto);
  const shareArticle = async () => {
    try {
      const shareData = { title: article.titolo, text: article.titolo, url: window.location.href };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback(true);
        window.setTimeout(() => setShareFeedback(false), 2200);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareFeedback(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-4xl mx-auto px-5 sm:px-6">
      <Reveal>
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/articoli"
            className="inline-flex items-center gap-2 text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={13} /> Articoli
          </Link>
        </div>

        {/* Share stays outside the editorial hero. */}
        <div className="mb-4 flex justify-end">
          <button onClick={() => void shareArticle()} className="min-h-10 inline-flex items-center justify-center gap-2 border border-border px-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors" aria-label="Condividi articolo">
            {shareFeedback ? <Check size={15} /> : <Share2 size={15} />}
            <span className="hidden sm:inline text-[10px] font-sans uppercase tracking-[0.16em]">{shareFeedback ? "Copiato" : "Condividi"}</span>
          </button>
        </div>

        {imgUrl ? (
          <div className="relative left-1/2 -ml-[50vw] mt-8 mb-10 h-[50vh] min-h-[320px] max-h-[520px] w-screen overflow-hidden">
            <img src={imgUrl} alt={article.titolo} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-4xl px-5 pb-8 sm:px-6">
              <span className="mb-3 inline-block border border-border px-2 py-1 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                {normalizeArticleCategory(article.categoria)}
              </span>
              <h1 className="font-serif text-[clamp(40px,8vw,72px)] leading-[0.85] tracking-wide bebas text-foreground uppercase">
                {article.titolo}
              </h1>
              <div className="mt-4 flex items-center gap-3 text-[12px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                <span>{format(new Date(article.data), "d MMMM yyyy", { locale: it })}</span>
                <span>·</span>
                <span>{minutes} min</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="border border-border px-2 py-0.5 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                {normalizeArticleCategory(article.categoria)}
              </span>
              <span className="text-[11px] font-sans text-muted-foreground">· {minutes} min di lettura</span>
            </div>
            <h1 className="mt-2 font-serif text-[clamp(40px,8vw,72px)] leading-[0.85] tracking-wide bebas text-foreground uppercase">
              {article.titolo}
            </h1>
            <div className="mt-4 text-[12px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
              {format(new Date(article.data), "d MMMM yyyy", { locale: it })}
            </div>
          </>
        )}
      </Reveal>

      <Reveal>
        <ArticleContent contenuto={article.contenuto} />
      </Reveal>

      {linkedDay && (
        <Reveal>
          <Link
            href={`/giorno/${linkedDay.numero}`}
            className="group mt-14 flex items-center justify-between border border-border bg-card px-5 py-4 hover:border-iron transition-colors"
          >
            <div>
              <div className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Dal diario dello stesso giorno
              </div>
              <div className="font-serif text-[28px] leading-none bebas text-foreground group-hover:text-primary transition-colors">
                GIORNO {String(linkedDay.numero).padStart(3, "0")}
              </div>
            </div>
            <ArrowLeft size={16} className="text-primary rotate-180" />
          </Link>
        </Reveal>
      )}

      <div className="mt-16">
        <AccessoBlock />
      </div>

      {!linkedDay && (
        <div className="mt-20">
          <Cross />
        </div>
      )}

      {nextArticle && (
        <Reveal>
          <Link href={`/a/${nextArticle.slug}`} className="group mt-14 block border border-border bg-card overflow-hidden">
            {resolveImgUrl(nextArticle.immagine) && (
              <img src={resolveImgUrl(nextArticle.immagine) ?? undefined} alt="" className="h-48 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            )}
            <div className="p-5">
              <div className="mb-2 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                PROSSIMO ARTICOLO
              </div>
              <h3 className="font-serif text-[28px] leading-none bebas text-foreground transition-colors group-hover:text-primary">
                {nextArticle.titolo}
              </h3>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-sans uppercase tracking-[0.15em] text-primary">
                Leggi <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      {linkedDay && (
        <div className="mt-20">
          <Cross />
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
