import { useRoute, Link } from "wouter";
import { useGetArticle, useListEntries } from "@workspace/api-client-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { ArticleContent, getArticlePlainText } from "@/components/ArticleContent";

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
  const [shareFeedback, setShareFeedback] = useState(false);
  const linkedDay = article ? entries?.find((e) => e.data === article.data) : undefined;

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

        {/* Category badge + reading time */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] border border-border px-2 py-0.5 text-muted-foreground">
            {article.categoria}
          </span>
          <span className="text-[11px] font-sans text-muted-foreground">· {minutes} min di lettura</span>
          </div>
          <button onClick={() => void shareArticle()} className="min-h-10 inline-flex items-center justify-center gap-2 border border-border px-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors" aria-label="Condividi articolo">
            {shareFeedback ? <Check size={15} /> : <Share2 size={15} />}
            <span className="hidden sm:inline text-[10px] font-sans uppercase tracking-[0.16em]">{shareFeedback ? "Copiato" : "Condividi"}</span>
          </button>
        </div>

        <h1 className="font-serif text-[clamp(40px,8vw,72px)] leading-[0.85] tracking-wide bebas text-foreground mt-2 uppercase">
          {article.titolo}
        </h1>
        <div className="text-[12px] font-sans text-muted-foreground uppercase tracking-[0.2em] mt-4">
          {format(new Date(article.data), "d MMMM yyyy", { locale: it })}
        </div>
      </Reveal>

      {imgUrl && (
        <Reveal>
          <div className="border border-border bg-card overflow-hidden mb-10 mt-8">
            <img src={imgUrl} alt={article.titolo} className="w-full max-h-[520px] object-cover" />
          </div>
        </Reveal>
      )}

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

      <div className="mt-20">
        <Cross />
      </div>
      <SiteFooter />
    </div>
  );
}
