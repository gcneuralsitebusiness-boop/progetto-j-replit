import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { ScrollProgress } from "@/components/ScrollProgress";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  children,
  external = false,
  onClick,
  itemRef,
  accent = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  onClick?: () => void;
  itemRef?: (element: HTMLElement | null) => void;
  accent?: boolean;
}) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));
  const baseClasses = cn(
    location === "/diario" ? "text-[13px] font-mono uppercase tracking-[0.2em] transition-colors" : "text-[12px] font-sans uppercase tracking-[0.2em] transition-colors",
    accent ? "text-[#B81D1D] hover:text-foreground" : isActive ? "nav-active text-foreground" : "text-muted-foreground hover:text-iron"
  );

  if (external) {
    return (
    <a ref={itemRef} href={href} target="_blank" rel="noopener noreferrer" className={baseClasses} onClick={onClick}>
        {children}
      </a>
    );
  }
  if (href.includes("#")) {
    return <a ref={itemRef} href={href} className={baseClasses} onClick={onClick}>{children}</a>;
  }
  return (
    <Link href={href} ref={itemRef} className={baseClasses} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRefs = useRef<Record<string, HTMLElement | null>>({});
  const [underline, setUnderline] = useState({ x: 0, width: 0, visible: false });
  const [hasScrolled, setHasScrolled] = useState(false);
  const navigationItems = [
    { href: "/chi-sono", label: "Chi Sono" },
    { href: "/obiettivi", label: "Obiettivi" },
    { href: "/diario", label: "Diario" },
    { href: "/viaggio", label: "Il Viaggio" },
    { href: "/articoli", label: "Articoli" },
    { href: "/#accesso", label: "Richiedi accesso", accent: true },
  ];

  const updateUnderline = () => {
    const active = navigationItems.find((item) => location === item.href || location.startsWith(item.href));
    const element = active ? navRefs.current[active.href] : null;
    setUnderline({
      x: element?.offsetLeft ?? 0,
      width: element?.offsetWidth ?? 0,
      visible: Boolean(element),
    });
  };

  useEffect(() => {
    updateUnderline();
    const onResize = () => window.requestAnimationFrame(updateUnderline);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [location]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setHasScrolled(window.scrollY >= 24);
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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
      <header
        className="fixed top-0 w-full z-50"
        style={{
          backgroundColor: hasScrolled ? "#0A0A0A" : "transparent",
          borderBottom: `1px solid ${hasScrolled ? "rgba(245,240,232,0.12)" : "transparent"}`,
          transition: "background-color 200ms linear, border-color 200ms linear",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-[32px] text-primary leading-none bebas tracking-wide"
            style={{ position: "relative", zIndex: 10000, ...(location === "/diario" ? { fontFamily: '"Bebas Neue", sans-serif' } : {}) }}
          >
            J
          </Link>

          <nav className="relative hidden lg:flex items-center gap-6 xl:gap-8">
            {navigationItems.map((item) => (
              <NavLink key={item.href} href={item.href} accent={item.accent} itemRef={(element) => { navRefs.current[item.href] = element; }}>
                {item.label}
              </NavLink>
            ))}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                bottom: "-6px",
                width: `${underline.width}px`,
                height: "2px",
                background: "#B81D1D",
                transform: `translateX(${underline.x}px) scaleX(${underline.visible ? 1 : 0})`,
                transformOrigin: "left center",
                transition: "transform var(--dur-base) var(--ease-out)",
                pointerEvents: "none",
              }}
            />
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
            {location === "/diario" ? <span className="font-mono text-[13px]" aria-hidden="true">{mobileMenuOpen ? "CHIUDI" : "MENU"}</span> : <span className={`hamburger-icon ${mobileMenuOpen ? "is-open" : ""}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>}
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
              <NavLink key={item.href} href={item.href} accent={item.accent} onClick={closeMenu}>
              <span className="mobile-nav-item py-3 text-[clamp(24px,7vw,38px)] leading-none" style={{ animationDelay: `${80 + index * 45}ms` }}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
