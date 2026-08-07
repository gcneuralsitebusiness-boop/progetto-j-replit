import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetArticle } from "@workspace/api-client-react";
import type { Article } from "@workspace/api-client-react";
import { toPng } from "html-to-image";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { getArticlePlainText } from "@/components/ArticleContent";

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
  format,
  cardRef,
}: {
  article: Article;
  format: Format;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { height, titleSize } = FORMATS[format];
  const coverUrl = resolveCoverUrl(article.immagine);
  const words = wordCountLabel(article.contenuto);

  const meta = (
    <div>
      <div className="bebas font-serif" style={{ fontSize: 32, letterSpacing: "0.2em", color: GREY, textTransform: "uppercase" }}>
        {words}
      </div>
      <div className="bebas font-serif" style={{ fontSize: 28, letterSpacing: "0.26em", color: GREY, marginTop: 10 }}>
        {SITE_DOMAIN}
      </div>
    </div>
  );

  const textBlock = (
    <div>
      <div className="bebas font-serif" style={{ fontSize: 34, letterSpacing: "0.26em", color: RED, textTransform: "uppercase", marginBottom: 28 }}>
        {article.categoria}
      </div>
      <FitTitle title={article.titolo} baseSize={titleSize} />
      <div style={{ width: 90, height: 4, backgroundColor: RED, marginTop: 40 }} />
      {format === "story" && <div style={{ marginTop: 44 }}>{meta}</div>}
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
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.78)" }} />
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

  const cardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const height = FORMATS[format].height;

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
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
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
            <ArticleCard article={article} format={format} cardRef={cardRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
