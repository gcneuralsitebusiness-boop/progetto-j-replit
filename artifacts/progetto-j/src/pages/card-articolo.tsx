import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetArticle, useUpdateArticle, useAdminMe } from "@workspace/api-client-react";
import type { Article } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { toPngWithEmbeddedAssets } from "@/lib/export-image";
import { getArticlePlainText } from "@/components/ArticleContent";
import CardCustomizer, {
  CARD_OVERLAY_DEFAULT,
  customizationFromRecord,
  type CardCustomization,
} from "@/components/CardCustomizer";

const CARD_W = 1080;
const RED = "#B81D1D";
const GREY = "#6E6A65";
const SITE_DOMAIN = "PROGETTOJ.IT";

type Format = "feed" | "story";

const FORMATS: Record<Format, { height: number; titleSize: number }> = {
  feed: { height: 1350, titleSize: 104 },
  story: { height: 1920, titleSize: 116 },
};

function resolveCoverUrl(immagine: string | null | undefined): string | null {
  if (!immagine) return null;
  const obj = getPhotoUrl(immagine);
  if (obj) return obj;
  if (immagine.startsWith("http")) return immagine;
  return null;
}

/** Word count from HTML-stripped content, rounded to the hundred above 1000, Italian thousands separator. */
function wordCountLabel(contenuto: string): string {
  const plain = getArticlePlainText(contenuto);
  const count = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  const rounded = count > 1000 ? Math.round(count / 100) * 100 : count;
  return `${rounded.toLocaleString("it-IT")} PAROLE`;
}

function articleExcerpt(contenuto: string, limit = 175): string {
  const plain = getArticlePlainText(contenuto).replace(/\s+/g, " ").trim();
  if (!plain) return "Una nuova pagina del percorso.";
  if (plain.length <= limit) return plain;
  return `${plain.slice(0, limit).replace(/\s+\S*$/, "")}…`;
}

/** Title that shrinks from the base size down to 76px before clamping to 4 lines with ellipsis. */
function FitTitle({ title, baseSize }: { title: string; baseSize: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(baseSize);

  useLayoutEffect(() => {
    setSize(baseSize);
  }, [title, baseSize]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const maxHeight = size * 0.94 * 4 + 2;
    if (el.scrollHeight > maxHeight && size > 76) {
      setSize((s) => Math.max(76, s - 4));
    }
  }, [size, title]);

  return (
    <div
      ref={ref}
      className="bebas font-serif"
      style={{
        fontSize: size,
        lineHeight: 0.94,
        letterSpacing: "0.01em",
        color: "#FFFFFF",
        textTransform: "uppercase",
        textAlign: "left",
        maxWidth: 880,
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {title}
    </div>
  );
}

function ArticleCard({
  article,
  custom,
  format,
  cardRef,
}: {
  article: Article;
  custom: CardCustomization;
  format: Format;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { height, titleSize } = FORMATS[format];
  // Customization with fallback: null fields always use the original published values.
  const customCover = custom.cardImmagine ? getPhotoUrl(custom.cardImmagine) : null;
  const coverUrl = customCover ?? resolveCoverUrl(article.immagine);
  const titolo = custom.cardTitolo ?? article.titolo;
  const categoria = custom.cardSottotitolo ?? article.categoria;
  const overlay = Math.min(0.95, (custom.cardOverlay ?? CARD_OVERLAY_DEFAULT) / 100 + 0.2);
  const showWords = custom.cardMostraParole ?? true;
  const words = wordCountLabel(article.contenuto);
  const excerpt = articleExcerpt(article.contenuto, format === "feed" ? 175 : 145);

  const meta = (
    <div>
      {showWords && (
        <div className="bebas font-serif" style={{ fontSize: 32, letterSpacing: "0.2em", color: GREY, textTransform: "uppercase" }}>
          {words}
        </div>
      )}
      <div className="bebas font-serif" style={{ fontSize: 28, letterSpacing: "0.26em", color: GREY, marginTop: 10 }}>
        {SITE_DOMAIN}
      </div>
    </div>
  );

  const textBlock = (
    <div>
      <div className="bebas font-serif" style={{ fontSize: 34, letterSpacing: "0.26em", color: RED, textTransform: "uppercase", marginBottom: 28 }}>
        {categoria}
      </div>
      <FitTitle title={titolo} baseSize={titleSize} />
       <p
         style={{
           margin: "28px 0 0", maxWidth: 760, color: "#C2BFBA",
           fontFamily: "Inter, Arial, sans-serif", fontSize: format === "feed" ? 25 : 23,
           lineHeight: 1.45, letterSpacing: "0.015em",
           display: "-webkit-box", WebkitLineClamp: format === "feed" ? 3 : 4,
           WebkitBoxOrient: "vertical", overflow: "hidden",
         }}
       >
         {excerpt}
       </p>
       <div style={{ width: 90, height: 4, backgroundColor: RED, marginTop: 30 }} />
       {format === "story" && <div style={{ marginTop: 36 }}>{meta}</div>}
    </div>
  );

  return (
    <div
      ref={cardRef}
      style={{ width: CARD_W, height, position: "relative", overflow: "hidden", backgroundColor: "#0A0A0A" }}
    >
      {coverUrl && (
        <>
          <img
            src={coverUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${overlay.toFixed(2)})` }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0) 55%)" }} />
        </>
      )}

      {/* Logo J */}
      <div
        className="bebas font-serif"
        style={{
          position: "absolute", top: 70, left: 70,
          width: 70, height: 70, border: `3px solid ${RED}`, color: RED,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, lineHeight: 1,
        }}
      >
        J
      </div>

      {format === "feed" ? (
        <>
          {/* Vertically centered text block */}
          <div style={{ position: "absolute", top: 0, left: 70, right: 70, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {textBlock}
          </div>
          {/* Bottom-left meta */}
          <div style={{ position: "absolute", left: 70, bottom: 90 }}>{meta}</div>
        </>
      ) : (
        /* Story: everything between 25% and 72% of card height */
        <div
          style={{
            position: "absolute", left: 70, right: 70,
            top: height * 0.25, height: height * 0.47,
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}
        >
          {textBlock}
        </div>
      )}

      {/* Bottom red bar */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, backgroundColor: RED }} />
    </div>
  );
}

export default function CardArticolo() {
  const [matchStory, storyParams] = useRoute("/card/articolo/:slug/story");
  const [, feedParams] = useRoute("/card/articolo/:slug");
  const format: Format = matchStory ? "story" : "feed";
  const slug = (matchStory ? storyParams?.slug : feedParams?.slug) ?? "";

  const { data: article, isLoading, isError } = useGetArticle(slug, {
    query: { queryKey: ["getArticle", slug], enabled: !!slug, retry: false },
  });
  const { data: auth } = useAdminMe();
  const queryClient = useQueryClient();

  const cardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const height = FORMATS[format].height;

  // Card customization: shared between feed and story (same saved values).
  const [custom, setCustom] = useState<CardCustomization>(customizationFromRecord(null));
  const [initializedFor, setInitializedFor] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const updateMutation = useUpdateArticle();

  useEffect(() => {
    if (article && initializedFor !== article.id) {
      setCustom(customizationFromRecord(article));
      setInitializedFor(article.id);
    }
  }, [article, initializedFor]);

  const handleCustomChange = (patch: Partial<CardCustomization>) => {
    setCustom((c) => ({ ...c, ...patch }));
    setSaved(false);
  };

  const handleSaveCustom = () => {
    if (!article) return;
    setSaveError(null);
    updateMutation.mutate(
      { id: article.id, data: { ...custom } },
      {
        onSuccess: () => {
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: ["getArticle", slug] });
        },
        onError: () => setSaveError("Errore durante il salvataggio. Riprova."),
      }
    );
  };

  useEffect(() => {
    const compute = () => {
      const available = (wrapperRef.current?.clientWidth ?? window.innerWidth) - 8;
      setScale(Math.min(1, available / CARD_W));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const dataUrl = await toPngWithEmbeddedAssets(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        canvasWidth: CARD_W,
        canvasHeight: height,
        backgroundColor: "#0A0A0A",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `progettoj-${slug}-${format}.png`;
      a.click();
    } catch {
      setDownloadError("Errore durante la generazione del PNG. Riprova.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground font-sans uppercase tracking-widest text-[12px] animate-pulse">Caricamento...</span>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <span className="font-serif text-[96px] leading-[0.8] text-primary bebas">404</span>
        <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-muted-foreground">Articolo non trovato</span>
        <Link href="/admin" className="btn-primary text-[12px]">Torna all'admin</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-2 flex flex-col items-center gap-6">
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-muted-foreground">
          CARD {format === "feed" ? "FEED · 1080×1350" : "STORY · 1080×1920"} — {slug}
        </span>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-primary text-primary-foreground font-serif text-[16px] px-6 py-2.5 tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {downloading ? "Generazione..." : "Scarica PNG"}
        </button>
      </div>
      {downloadError && <p className="text-[12px] font-sans text-primary">{downloadError}</p>}

      <div ref={wrapperRef} className="w-full flex justify-center">
        <div style={{ width: CARD_W * scale, height: height * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <ArticleCard article={article} custom={custom} format={format} cardRef={cardRef} />
          </div>
        </div>
      </div>

      {/* PERSONALIZZA panel — admin only, never included in the PNG export */}
      {auth?.authenticated && (
        <CardCustomizer
          value={custom}
          onChange={handleCustomChange}
          onSave={handleSaveCustom}
          saving={updateMutation.isPending}
          saved={saved}
          error={saveError}
          titlePlaceholder={article.titolo}
          subtitlePlaceholder={article.categoria}
          wordToggleLabel="Mostra conteggio parole"
        />
      )}
    </div>
  );
}
