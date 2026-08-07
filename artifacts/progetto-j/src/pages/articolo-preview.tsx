import { useRoute, Link, useLocation } from "wouter";
import { useAdminMe, getAdminMeQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Reveal } from "@/components/Reveal";
import { Cross } from "@/components/Cross";
import { SiteFooter } from "@/components/SiteFooter";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { ArrowLeft } from "lucide-react";
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

async function fetchArticlePreview(slug: string) {
  const res = await fetch(`/api/admin/articles/${encodeURIComponent(slug)}/preview`, {
    credentials: "include",
  });
  if (res.status === 401) throw new Error("401");
  if (res.status === 404) throw new Error("404");
  if (!res.ok) throw new Error("error");
  return res.json();
}

export default function ArticoloPreview() {
  const [, params] = useRoute("/admin/articoli/:slug/preview");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();

  const { data: adminData, isLoading: adminLoading } = useAdminMe({
    query: { queryKey: getAdminMeQueryKey(), retry: false },
  });

  const { data: article, isLoading, isError, error } = useQuery({
    queryKey: ["adminArticlePreview", slug],
    queryFn: () => fetchArticlePreview(slug),
    enabled: !!slug && adminData?.authenticated === true,
    retry: false,
  });

  // Not authenticated
  if (!adminLoading && !adminData?.authenticated) {
    navigate("/admin");
    return null;
  }

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-2xl text-muted-foreground pt-16">
        Caricamento...
      </div>
    );
  }

  if (isError || !article) {
    const is404 = error instanceof Error && error.message === "404";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 pt-16">
        <span className="font-serif text-[96px] leading-[0.8] text-primary bebas">{is404 ? "404" : "ERR"}</span>
        <p className="font-sans text-muted-foreground text-[15px] uppercase tracking-[0.2em]">
          {is404 ? "Articolo non trovato." : "Errore nel caricamento dell'articolo."}
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={13} /> Torna all'admin
        </Link>
      </div>
    );
  }

  const imgUrl = resolveImgUrl(article.immagine);
  const minutes = readingTime(article.contenuto);
  const isDraft = !article.pubblicato;

  return (
    <div className="min-h-screen pt-20 pb-20 max-w-4xl mx-auto px-5 sm:px-6">
      {/* Draft banner */}
      {isDraft && (
        <div className="mb-6 border border-primary/60 bg-primary/10 px-4 py-3 flex items-center justify-between gap-4">
          <span className="text-[12px] font-sans uppercase tracking-[0.2em] text-primary">
            Anteprima bozza · non visibile ai lettori
          </span>
          <Link
            href="/admin"
            className="text-[11px] font-sans uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            ← Admin
          </Link>
        </div>
      )}

      {!isDraft && (
        <div className="mb-6 border border-border bg-card px-4 py-3 flex items-center justify-between gap-4">
          <span className="text-[12px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
            Anteprima admin · articolo pubblicato
          </span>
          <Link
            href="/admin"
            className="text-[11px] font-sans uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            ← Admin
          </Link>
        </div>
      )}

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
          {isDraft && (
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] border border-primary/60 px-2 py-0.5 text-primary">
              Bozza
            </span>
          )}
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
