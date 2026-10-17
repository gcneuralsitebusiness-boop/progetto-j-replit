import { Link } from "wouter";
import { useGetSiteContent } from "@workspace/api-client-react";
import { EmailCapture } from "@/components/EmailCapture";

export function SiteFooter({ hideEmailCapture = false }: { hideEmailCapture?: boolean }) {
  const { data: siteContent } = useGetSiteContent();
  const footerMantra = (siteContent as { global_footer_mantra?: string } | undefined)?.global_footer_mantra;

  return (
    <>
      {!hideEmailCapture && <div id="email-capture">
        <EmailCapture />
      </div>}
      <footer className="border-t border-border py-12 mt-12 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex flex-col items-center gap-6">
          <span className="font-mono text-[18px] text-primary">
              {footerMantra || "IC XC NIKA"}
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-[13px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/chi-sono" className="hover:text-primary transition-colors">Chi Sono</Link>
            <Link href="/diario" className="hover:text-primary transition-colors">Diario</Link>
            <Link href="/live" className="hover:text-primary transition-colors">Live</Link>
            <Link href="/viaggio" className="hover:text-primary transition-colors">Il viaggio</Link>
            <Link href="/articoli" className="hover:text-primary transition-colors">Articoli</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/termini" className="hover:text-primary transition-colors">Termini</Link>
            <a href={siteContent?.instagram_url ?? "#"} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] normal-case tracking-normal text-foreground/40 hover:text-foreground transition-colors">Instagram</a>
          </nav>
        </div>
      </footer>
    </>
  );
}