import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import { ScrollToTop } from '@/components/ScrollToTop';
import Home from '@/pages/home';
import Journaling from '@/pages/journaling';
import ChiSono from '@/pages/chi-sono';
import Admin from '@/pages/admin';
import NotFound from '@/pages/not-found';
import Pagina from '@/pages/Pagina';
import Social from '@/pages/social';
import Sponsor from '@/pages/sponsor';
import Articoli from '@/pages/articoli';
import Articolo from '@/pages/articolo';
import Coaching from '@/pages/coaching';
import GiornoDetail from '@/pages/giorno';

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

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ScrollToTop />
        <Navbar />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/journaling" component={Journaling} />
          <Route path="/chi-sono" component={ChiSono} />
          <Route path="/social" component={Social} />
          <Route path="/sponsor" component={Sponsor} />
          <Route path="/articoli" component={Articoli} />
          <Route path="/a/:slug" component={Articolo} />
          <Route path="/coaching" component={Coaching} />
          <Route path="/giorno/:id" component={GiornoDetail} />
          <Route path="/admin" component={Admin} />
          <Route path="/p/:slug" component={Pagina} />
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
