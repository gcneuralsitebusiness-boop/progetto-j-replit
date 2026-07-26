import { useRoute } from "wouter";
import { useGetPage } from "@workspace/api-client-react";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";

export default function Pagina() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug ?? "";

  const { data: page, isLoading, isError } = useGetPage(slug, {
    query: { queryKey: ["getPage", slug], enabled: !!slug, retry: false },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-2xl text-muted-foreground pt-16">
        Caricamento...
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 pt-16">
        <span className="font-serif text-[96px] leading-[0.8] text-primary bebas">404</span>
        <p className="font-sans text-muted-foreground text-[15px] uppercase tracking-[0.2em]">Pagina non trovata.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-4xl mx-auto px-5 sm:px-6">
      <Reveal>
        <div className="mb-6">
          <span className="page-label">PAGINA</span>
          <h1 className="font-serif text-[clamp(48px,10vw,96px)] leading-[0.85] tracking-wide bebas text-foreground mt-2 uppercase">
            {page.titolo}
          </h1>
        </div>
      </Reveal>

      <Reveal>
        <div className="text-[16px] sm:text-[17px] font-sans text-foreground/90 leading-[1.8] whitespace-pre-wrap border-l-2 border-primary pl-5 sm:pl-6">
          {page.contenuto}
        </div>
      </Reveal>

      <div className="mt-20">
        <Cross />
      </div>
    </div>
  );
}
