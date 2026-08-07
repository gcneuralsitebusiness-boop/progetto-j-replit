import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
    isActive ? "nav-active text-foreground" : "text-muted-foreground hover:text-iron"
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
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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
  const navigationItems = [
    { href: "/chi-sono", label: "Chi Sono" },
    { href: "/journaling", label: "Journaling" },
    ...(articles && articles.length > 0 ? [{ href: "/articoli", label: "Articoli" }] : []),
    { href: "/coaching", label: "Coaching" },
    { href: "/social", label: "Social" },
    { href: "/sponsor", label: "Sponsor" },
    ...publishedPages.map((page) => ({ href: `/p/${page.slug}`, label: page.titolo })),
  ];

  useEffect(() => {
    if (!mobileMenuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <ScrollProgress />
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-[12px] border-b border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-[32px] text-primary leading-none bebas tracking-wide"
            style={{ position: "relative", zIndex: 10000 }}
          >
            J
          </Link>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navigationItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
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
            ref={menuButtonRef}
            className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center text-foreground hover:text-primary transition-colors"
            style={{ position: "relative", zIndex: 10000 }}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav
          ref={menuRef}
          id="mobile-navigation"
          className="lg:hidden menu-slide"
          aria-label="Menu di navigazione"
          style={{
            position: "fixed",
            inset: 0,
            height: "100dvh",
            width: "100vw",
            backgroundColor: "#0A0A0A",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "0.45rem",
            alignItems: "flex-start",
            padding: "5.5rem max(1.25rem, env(safe-area-inset-left)) max(2rem, env(safe-area-inset-bottom))",
            overflowY: "auto",
          }}
        >
          {navigationItems.map((item, index) => (
            <NavLink key={item.href} href={item.href} onClick={closeMenu}>
              <span className="mobile-nav-item py-3 text-[clamp(24px,7vw,38px)] leading-none" style={{ animationDelay: `${80 + index * 45}ms` }}>
                {item.label}
              </span>
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
