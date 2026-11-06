import { Link } from "wouter";
import { useGetSiteContent } from "@workspace/api-client-react";
import { Cross } from "@/components/Cross";
import { EmailCapture } from "@/components/EmailCapture";

export function SiteFooter() {
  const { data: siteContent } = useGetSiteContent();
  const footerMantra = (siteContent as { global_footer_mantra?: string } | undefined)?.global_footer_mantra;

  return (
    <>
      <div id="email-capture">
        <EmailCapture />
      </div>
      <footer className="border-t border-border py-12 mt-12 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex flex-col items-center gap-6">
          <Cross />
          <span className="font-serif text-[18px] text-primary bebas">
              {footerMantra || "IC XC NIKA"}
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-[13px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/journaling" className="hover:text-primary transition-colors">Diario</Link>
            <Link href="/statistiche" className="hover:text-primary transition-colors">Statistiche</Link>
            <Link href="/fase-1" className="hover:text-primary transition-colors">Stagione 1</Link>
            <Link href="/articoli" className="hover:text-primary transition-colors">Articoli</Link>
            <Link href="/chi-sono" className="hover:text-primary transition-colors">Chi sono</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/termini" className="hover:text-primary transition-colors">Termini</Link>
            <a href={siteContent?.instagram_url ?? "#"} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] normal-case tracking-normal text-foreground/40 hover:text-foreground transition-colors">Instagram</a>
          </nav>
        </div>
      </footer>
    </>
  );
}