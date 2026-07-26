import { useRoute } from "wouter";
import { useGetArticle } from "@workspace/api-client-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";

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

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-4xl mx-auto px-5 sm:px-6">
      <Reveal>
        <div className="mb-6">
          <span className="page-label">{article.categoria}</span>
          <h1 className="font-serif text-[clamp(40px,8vw,72px)] leading-[0.85] tracking-wide bebas text-foreground mt-2 uppercase">
            {article.titolo}
          </h1>
          <div className="text-[12px] font-sans text-muted-foreground uppercase tracking-[0.2em] mt-4">
            {format(new Date(article.data), "d MMMM yyyy", { locale: it })}
          </div>
        </div>
      </Reveal>

      {article.immagine && (
        <Reveal>
          <div className="border border-border bg-card overflow-hidden mb-10">
            <img src={article.immagine} alt={article.titolo} className="w-full max-h-[400px] object-cover" />
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="text-[16px] sm:text-[17px] font-sans text-foreground/90 leading-[1.8] whitespace-pre-wrap border-l-2 border-primary pl-5 sm:pl-6">
          {article.contenuto}
        </div>
      </Reveal>

      <div className="mt-20">
        <Cross />
      </div>
    </div>
  );
}
