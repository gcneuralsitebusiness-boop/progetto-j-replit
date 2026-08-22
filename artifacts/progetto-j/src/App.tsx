import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import { ScrollToTop } from '@/components/ScrollToTop';

const Home = lazy(() => import('@/pages/home'));
const Journaling = lazy(() => import('@/pages/journaling'));
const Statistiche = lazy(() => import('@/pages/statistiche'));
const ChiSono = lazy(() => import('@/pages/chi-sono'));
const Admin = lazy(() => import('@/pages/admin'));
const NotFound = lazy(() => import('@/pages/not-found'));
const Pagina = lazy(() => import('@/pages/Pagina'));
const Social = lazy(() => import('@/pages/social'));
const Sponsor = lazy(() => import('@/pages/sponsor'));
const Articoli = lazy(() => import('@/pages/articoli'));
const Articolo = lazy(() => import('@/pages/articolo'));
const ArticoloPreview = lazy(() => import('@/pages/articolo-preview'));
const Coaching = lazy(() => import('@/pages/coaching'));
const GiornoDetail = lazy(() => import('@/pages/giorno'));
const Privacy = lazy(() => import('@/pages/privacy'));
const Termini = lazy(() => import('@/pages/termini'));
const Grazie = lazy(() => import('@/pages/grazie'));
const Card = lazy(() => import('@/pages/card'));
const CardArticolo = lazy(() => import('@/pages/card-articolo'));
const CardReel = lazy(() => import('@/pages/card-reel'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Always consider data stale so React Query refetches on every mount
      staleTime: 0,
      // Keep unused data in cache for 5 minutes to avoid redundant re-fetches
      // when navigating between pages in the same session
      gcTime: 5 * 60_000,
      // Refetch whenever the tab regains focus (user comes back to the site)
      refetchOnWindowFocus: true,
      // Always refetch when a component mounts, even if data is in cache
      refetchOnMount: true,
      // Retry failed requests twice before showing an error
      retry: 2,
    },
  },
});

/** The IG card page and admin article preview are clean canvases: no Navbar. */
function ConditionalNavbar() {
  const [location] = useLocation();
  if (location.startsWith('/card/')) return null;
  if (location.startsWith('/admin/articoli/') && location.endsWith('/preview')) return null;
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
      "/journaling": { title: "Journaling — Progetto J", description: "Il diario operativo di Progetto J: giorni, dati, allenamento e disciplina." },
      "/statistiche": { title: "Statistiche — Progetto J", description: "I dati aggregati del percorso Progetto J: peso, sonno, allenamento e progressi." },
      "/chi-sono": { title: "Chi sono — Progetto J", description: "La storia, il metodo e la persona dietro Progetto J." },
      "/articoli": { title: "Articoli — Progetto J", description: "Riflessioni, metodo e lezioni raccolte durante il percorso Progetto J." },
      "/coaching": { title: "Coaching — Progetto J", description: "Un protocollo di 12 settimane basato su allenamento, nutrizione, sonno e dati." },
      "/social": { title: "Social — Progetto J", description: "Segui Progetto J sui canali social e contatta il progetto." },
      "/privacy": { title: "Privacy — Progetto J", description: "Come Progetto J gestisce analytics anonimi, newsletter e richieste di contatto." },
      "/termini": { title: "Termini — Progetto J", description: "Termini essenziali per consultare e condividere i contenuti di Progetto J." },
      "/grazie": { title: "Grazie — Progetto J", description: "Richiesta ricevuta da Progetto J." },
    };
    const current = metadata[location] ?? (location.startsWith("/giorno/") ? {
      title: `Giorno ${location.split("/").pop()} — Progetto J`,
      description: "Un giorno del diario documentale di Progetto J.",
    } : metadata["/"]);
    document.title = current.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", current.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", current.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", current.description);
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

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ScrollToTop />
        <PageMetadata />
        <ConditionalNavbar />
        <PageFade>
          <Suspense fallback={<RouteLoading />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/journaling" component={Journaling} />
              <Route path="/statistiche" component={Statistiche} />
              <Route path="/chi-sono" component={ChiSono} />
              <Route path="/social" component={Social} />
              <Route path="/sponsor" component={Sponsor} />
              <Route path="/articoli" component={Articoli} />
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
              <Route path="/admin/articoli/:slug/preview" component={ArticoloPreview} />
              <Route path="/admin" component={Admin} />
              <Route path="/p/:slug" component={Pagina} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </PageFade>
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
