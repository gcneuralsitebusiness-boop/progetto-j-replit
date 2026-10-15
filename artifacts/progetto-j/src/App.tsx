import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import { ScrollToTop } from '@/components/ScrollToTop';
import { PageChromeProvider, usePageChrome } from '@/lib/page-chrome';
import { PublicDesignScope } from '@/components/PublicDesignScope';

const Home = lazy(() => import('@/pages/home'));
const Diario = lazy(() => import('@/pages/diario'));
const ChiSono = lazy(() => import('@/pages/chi-sono'));
const Admin = lazy(() => import('@/pages/admin'));
const NotFound = lazy(() => import('@/pages/not-found'));
const Pagina = lazy(() => import('@/pages/Pagina'));
const Social = lazy(() => import('@/pages/social'));
const Sponsor = lazy(() => import('@/pages/sponsor'));
const Articoli = lazy(() => import('@/pages/articoli'));
const Articolo = lazy(() => import('@/pages/articolo'));
const Viaggio = lazy(() => import('@/pages/viaggio'));
const ArticoloPreview = lazy(() => import('@/pages/articolo-preview'));
const Coaching = lazy(() => import('@/pages/coaching'));
const GiornoDetail = lazy(() => import('@/pages/giorno'));
const Obiettivi = lazy(() => import('@/pages/obiettivi'));
const Privacy = lazy(() => import('@/pages/privacy'));
const Termini = lazy(() => import('@/pages/termini'));
const Grazie = lazy(() => import('@/pages/grazie'));
const Card = lazy(() => import('@/pages/card'));
const CardArticolo = lazy(() => import('@/pages/card-articolo'));
const CardReel = lazy(() => import('@/pages/card-reel'));
const Clip = lazy(() => import('@/pages/clip'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Public content changes infrequently; keep it warm while navigating.
      staleTime: 60_000,
      // Keep recently visited data available for back/forward navigation.
      gcTime: 10 * 60_000,
      // Returning to the browser should not trigger a request storm.
      refetchOnWindowFocus: false,
      // Refetch on mount only when the cached data is actually stale.
      refetchOnMount: true,
      // One retry is enough for a transient network failure. Auth failures
      // should be shown immediately instead of being retried.
      retry: (failureCount, error) => {
        const message = error instanceof Error ? error.message : String(error);
        return failureCount < 1 && !/\b40[13]\b/.test(message);
      },
    },
  },
});

/** The IG card page and admin article preview are clean canvases: no Navbar. */
function ConditionalNavbar() {
  const [location] = useLocation();
  const { navigationHidden } = usePageChrome();
  if (navigationHidden) return null;
  if (location.startsWith('/card/')) return null;
  if (location.startsWith('/clip/')) return null;
  if (location.startsWith('/admin/articoli/') && location.endsWith('/preview')) return null;
  if (location === '/admin' || location.startsWith('/admin/')) return null;
  return <Navbar />;
}

function PageFade({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [isExiting, setIsExiting] = useState(false);
  const latestChildren = useRef(children);
  latestChildren.current = children;

  useEffect(() => {
    if (location === displayedLocation) return;

    setIsExiting(true);
    const timeout = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      setDisplayedChildren(latestChildren.current);
      setDisplayedLocation(location);
      setIsExiting(false);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [displayedLocation, location]);

  return (
    <div
      key={displayedLocation}
      className={`page-transition${isExiting ? " page-transition--exit" : ""}`}
    >
      {displayedChildren}
    </div>
  );
}

function PageMetadata() {
  const [location] = useLocation();
  useEffect(() => {
    const metadata: Record<string, { title: string; description: string }> = {
      "/": { title: "Progetto J — 180 Giorni Documentati", description: "180 giorni di trasformazione documentata. Dati reali, zero filtri. Corpo, mente, business." },
      "/diario": { title: "Diario — Project J", description: "Ogni giorno, tutti i numeri. Anche quelli brutti." },
      "/obiettivi": { title: "Obiettivi — Progetto J", description: "Obiettivi del ciclo in corso, stato avanzamento e tappe di Progetto J." },
      "/chi-sono": { title: "Chi sono — Progetto J", description: "La storia, il metodo e la persona dietro Progetto J." },
      "/viaggio": { title: "Il viaggio di J — Progetto J", description: "Otto paesi visitati, quattro da prendere. Quattro discipline, quattro posti dove sono nate." },
      "/articoli": { title: "Articoli — Progetto J", description: "Riflessioni, metodo e lezioni raccolte durante il percorso Progetto J." },
      "/coaching": { title: "Coaching — Progetto J", description: "Un protocollo di 12 settimane basato su allenamento, nutrizione, sonno e dati." },
      "/social": { title: "Social — Progetto J", description: "Segui Progetto J sui canali social e contatta il progetto." },
      "/privacy": { title: "Privacy — Progetto J", description: "Come Progetto J gestisce analytics anonimi, newsletter e richieste di contatto." },
      "/termini": { title: "Termini — Progetto J", description: "Termini essenziali per consultare e condividere i contenuti di Progetto J." },
      "/grazie": { title: "Grazie — Progetto J", description: "Richiesta ricevuta da Progetto J." },
    };
    const isClipRoute = location.startsWith("/clip/");
    const current = metadata[location] ?? (location.startsWith("/giorno/") ? {
      title: `Giorno ${location.split("/").pop()} — Progetto J`,
      description: "Un giorno del diario documentale di Progetto J.",
    } : isClipRoute ? {
      title: "Clip — Progetto J",
      description: "Strumento video di Progetto J.",
    } : metadata["/"]);
    document.title = current.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", current.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", current.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", current.description);

    const robots = document.querySelector('meta[name="robots"]');
    robots?.setAttribute("content", isClipRoute ? "noindex, nofollow" : "index, follow");
    const canonical = document.querySelector('link[rel="canonical"]');
    if (isClipRoute) {
      canonical?.remove();
    } else if (!canonical) {
      const restoredCanonical = document.createElement("link");
      restoredCanonical.rel = "canonical";
      restoredCanonical.href = "https://projectj180day.com";
      document.head.appendChild(restoredCanonical);
    }
  }, [location]);
  return null;
}

function RouteLoading() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <span className="text-muted-foreground font-sans uppercase tracking-widest text-[12px] animate-pulse">
        Caricamento...
      </span>
    </div>
  );
}

function LegacyDiaryRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(`/diario${window.location.search}${window.location.hash}`, { replace: true });
  }, [navigate]);
  return null;
}

function AppRoutes() {
  const [location] = useLocation();
  const isClipRoute = location.startsWith('/clip/');
  const routes = (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/diario" component={Diario} />
      <Route path="/journaling" component={LegacyDiaryRedirect} />
      <Route path="/obiettivi" component={Obiettivi} />
      <Route path="/statistiche" component={LegacyDiaryRedirect} />
      <Route path="/chi-sono" component={ChiSono} />
      <Route path="/social" component={Social} />
      <Route path="/sponsor" component={Sponsor} />
      <Route path="/viaggio" component={Viaggio} />
      <Route path="/articoli" component={Articoli} />
      <Route path="/articoli/:slug" component={Articolo} />
      <Route path="/a/:slug" component={Articolo} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/giorno/:id" component={GiornoDetail} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/termini" component={Termini} />
      <Route path="/grazie" component={Grazie} />
      <Route path="/card/articolo/:slug/story" component={CardArticolo} />
      <Route path="/card/articolo/:slug" component={CardArticolo} />
      <Route path="/card/:giorno/reel-minimal" component={CardReel} />
      <Route path="/card/:giorno/reel" component={CardReel} />
      <Route path="/card/:giorno" component={Card} />
      <Route path="/clip/:numero" component={Clip} />
      <Route path="/admin/articoli/:slug/preview" component={ArticoloPreview} />
      <Route path="/admin" component={Admin} />
      <Route path="/p/:slug" component={Pagina} />
      <Route component={NotFound} />
    </Switch>
  );

  if (isClipRoute) {
    return <Suspense fallback={null}>{routes}</Suspense>;
  }
  return (
    <PageFade>
      <Suspense fallback={<RouteLoading />}>{routes}</Suspense>
    </PageFade>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <PageChromeProvider>
        <PublicDesignScope />
        <ScrollToTop />
        <PageMetadata />
        <ConditionalNavbar />
        <AppRoutes />
        </PageChromeProvider>
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
