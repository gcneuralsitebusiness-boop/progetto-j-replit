import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react';
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

/**
 * A short fade on navigation. Restarts the CSS animation without keying the
 * routed subtree, so pages are never remounted (and queries never refetched)
 * just for the transition.
 */
function PageFade({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-fade');
    // Force a reflow so re-adding the class restarts the animation.
    void el.offsetWidth;
    el.classList.add('page-fade');
  }, [location]);
  return <div ref={ref}>{children}</div>;
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
