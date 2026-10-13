import { useEffect } from "react";
import { usePageChrome } from "@/lib/page-chrome";
import { usePageMeta } from "@/hooks/use-page-meta";

export function CurrentDayPending({ numero }: { numero: number }) {
  const { setNavigationHidden } = usePageChrome();
  usePageMeta({
    title: "Giornata in corso — Progetto J",
    description: "Giornata in corso. Attendi completamento.",
    url: `/giorno/${numero}`,
  });
  useEffect(() => {
    setNavigationHidden(true);
    return () => setNavigationHidden(false);
  }, [setNavigationHidden]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6" data-testid="current-day-pending">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-6 text-center">
        <span className="day-progress-ring" aria-hidden="true" />
        <div>
          <h1 className="font-serif text-[28px] tracking-wider text-foreground">GIORNATA IN CORSO</h1>
          <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Attendi completamento</p>
        </div>
      </div>
    </main>
  );
}
