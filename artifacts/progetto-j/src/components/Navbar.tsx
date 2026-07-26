import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetSiteContent, useListPages, useListArticles } from "@workspace/api-client-react";
import { ScrollProgress } from "@/components/ScrollProgress";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  children,
  external = false,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  onClick?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));
  const baseClasses = cn(
    "text-[12px] font-sans uppercase tracking-[0.2em] transition-colors",
    isActive ? "nav-active text-foreground" : "text-muted-foreground hover:text-primary"
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={baseClasses} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: content } = useGetSiteContent();
  const { data: pages } = useListPages();
  const { data: articles } = useListArticles();
  const instagramUrl = content?.instagram_url ?? "#";

  const publishedPages = pages?.filter((p) => p.pubblicata) ?? [];

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <ScrollProgress />
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-[12px] border-b border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-[32px] text-primary leading-none bebas tracking-wide glow-red"
            style={{ position: "relative", zIndex: 10000 }}
          >
            J
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/chi-sono">Chi Sono</NavLink>
            <NavLink href="/journaling">Journaling</NavLink>
            {articles && articles.length > 0 && <NavLink href="/articoli">Articoli</NavLink>}
            <NavLink href="/coaching">Coaching</NavLink>
            <NavLink href="/social">Social</NavLink>
            <NavLink href="/sponsor">Sponsor</NavLink>
            {publishedPages.map((page) => (
              <NavLink key={page.id} href={`/p/${page.slug}`}>
                {page.titolo}
              </NavLink>
            ))}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary !px-4 !py-2 !text-[11px]"
            >
              Instagram
            </a>
          </nav>

          <button
            className="md:hidden text-foreground hover:text-primary transition-colors"
            style={{ position: "relative", zIndex: 10000 }}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav
          className="md:hidden menu-slide"
          style={{
            position: "fixed",
            inset: 0,
            height: "100dvh",
            width: "100vw",
            backgroundColor: "#0A0A0A",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            alignItems: "flex-start",
            padding: "5rem 1.25rem 2rem",
            overflowY: "auto",
          }}
        >
          <NavLink href="/chi-sono" onClick={closeMenu}>Chi Sono</NavLink>
          <NavLink href="/journaling" onClick={closeMenu}>Journaling</NavLink>
          <NavLink href="/articoli" onClick={closeMenu}>Articoli</NavLink>
          <NavLink href="/coaching" onClick={closeMenu}>Coaching</NavLink>
          <NavLink href="/social" onClick={closeMenu}>Social</NavLink>
          <NavLink href="/sponsor" onClick={closeMenu}>Sponsor</NavLink>
          {publishedPages.map((page) => (
            <NavLink key={page.id} href={`/p/${page.slug}`} onClick={closeMenu}>
              {page.titolo}
            </NavLink>
          ))}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !px-4 !py-2 !text-[11px]"
            onClick={closeMenu}
          >
            Instagram
          </a>
        </nav>
      )}
    </>
  );
}
