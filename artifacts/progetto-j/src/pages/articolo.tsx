import { useRoute, Link } from "wouter";
import { useGetArticle } from "@workspace/api-client-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { ArrowLeft } from "lucide-react";

function resolveImgUrl(immagine: string | null | undefined): string | null {
  if (!immagine) return null;
  const obj = getPhotoUrl(immagine);
  if (obj) return obj;
  if (immagine.startsWith("http")) return immagine;
  return null;
}

function readingTime(testo: string): number {
  const words = testo.trim() ? testo.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 200));
}

// ─── Rendered content ─────────────────────────────────────────────────────────

function ArticleContent({ contenuto }: { contenuto: string }) {
  // Split on double newlines into paragraphs
  const blocks = contenuto
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="mt-8">
      {blocks.map((block, i) => {
        const headingMatch = block.match(/^\*\*(.+)\*\*$/);
        if (headingMatch) {
          return (
            <h2
              key={i}
              className="font-serif text-[22px] uppercase tracking-wider text-primary bebas mt-10 mb-3 first:mt-0"
            >
              {headingMatch[1].trim()}
            </h2>
          );
        }
        return (
          <p
            key={i}
            className="font-sans text-[17px] text-foreground leading-[1.8] max-w-[65ch] mb-5"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default function Articolo() {
  const [, params] = useRoute("/a/:slug");
  const slug = params?.slug ?? "";

  const { data: article, isLoading, isError } = useGetArticle(slug, {
    query: { queryKey: ["getArticle", slug], enabled: !!slug, retry: false },
  });

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

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-4xl mx-auto px-5 sm:px-6">
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
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] border border-border px-2 py-0.5 text-muted-foreground">
            {article.categoria}
          </span>
          <span className="text-[11px] font-sans text-muted-foreground">· {minutes} min di lettura</span>
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
            <img src={imgUrl} alt={article.titolo} className="w-full max-h-[400px] object-cover" />
          </div>
        </Reveal>
      )}

      <Reveal>
        <ArticleContent contenuto={article.contenuto} />
      </Reveal>

      <div className="mt-20">
        <Cross />
      </div>
      <SiteFooter />
    </div>
  );
}
