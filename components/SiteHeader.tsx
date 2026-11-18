"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, registerGsap, EASE, SplitText, getLenis } from "@/lib/motion";

const ITEMS = [
  { n: "01", label: "Home", href: "#top", img: "photo-1490481651871-ab68de25d43d" },
  { n: "02", label: "About", href: "#about", img: "photo-1529139574466-a303027c1d8b" },
  { n: "03", label: "Work", href: "#work", img: "photo-1539109136881-3be0616acf4b" },
  { n: "04", label: "Services", href: "#services", img: "photo-1513364776144-60967b0f800f" },
  { n: "05", label: "Contact", href: "#contact", img: "photo-1494438639946-1ebd1d20bf85" },
];

function Roll({ children }: { children: string }) {
  return <span className="roll" data-text={children}><span>{children}</span></span>;
}

/**
 * Header + full-screen menu.
 * Choreography: open = overlay wipe (lead) → big words rise (support, varied stagger) → secondary info.
 * Close = everything leaves together and fast (exits are simultaneous and shorter than entrances).
 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const splits = useRef<SplitText[]>([]);

  /* Build the open timeline once; close just reverses it faster. */
  useEffect(() => {
    registerGsap();
    const el = overlay.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      splits.current = gsap.utils.toArray<HTMLElement>(".menu-word").map((w) => SplitText.create(w, { type: "chars" }));
      const chars = splits.current.map((s) => s.chars);

      gsap.set(el, { clipPath: "inset(0% 0% 100% 0%)", visibility: "hidden" });
      gsap.set(".menu-word", { visibility: "visible" });
      gsap.set(chars, { yPercent: 115 });
      gsap.set(".menu-line", { scaleX: 0 });
      gsap.set(".menu-num, .menu-secondary > *, .menu-close", { opacity: 0, y: 14 });
      gsap.set(".menu-previews", { clipPath: "inset(100% 0% 0% 0%)" });

      tl.current = gsap
        .timeline({
          paused: true,
          defaults: { ease: EASE.signature },
          onReverseComplete: () => { gsap.set(el, { visibility: "hidden" }); },
        })
        .set(el, { visibility: "visible" })
        .to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.95 })
        .to(".menu-previews", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: EASE.signature }, "-=0.6")
        // Varied stagger: first items lead, later ones follow faster (non-metronomic).
        .to(chars.flat(), { yPercent: 0, duration: 1.0, ease: EASE.expo, stagger: { each: 0.018, ease: "power2.out", amount: 0.55 } }, "-=0.45")
        .to(".menu-line", { scaleX: 1, duration: 0.9, stagger: 0.07 }, "<0.05")
        .to(".menu-num", { opacity: 1, y: 0, duration: 0.6, ease: EASE.out, stagger: 0.07 }, "<0.1")
        .to(".menu-secondary > *, .menu-close", { opacity: 1, y: 0, duration: 0.6, ease: EASE.out, stagger: 0.06 }, "-=0.35");
    }, el);
    return () => {
      tl.current?.kill();
      splits.current.forEach((s) => s.revert());
      ctx.revert();
    };
  }, []);

  const openMenu = useCallback(() => {
    if (!tl.current) return;
    setOpen(true);
    setArmed(true); // preview images are only requested once the menu is first opened
    getLenis()?.stop();
    tl.current.timeScale(1).play();
  }, []);

  const closeMenu = useCallback(() => {
    if (!tl.current) return;
    setOpen(false);
    tl.current.timeScale(1.8).reverse(); // simultaneous + faster exit
    getLenis()?.start();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  /* Floating menu button appears after the hero. */
  useEffect(() => {
    const onScroll = () => fab.current?.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Hover: expand active word, dim the others, swap the preview image. */
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <header className="site-header">
        <div className="header-social">
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="roll-link"><Roll>IG</Roll></a>
          <span>·</span>
          <a href="https://www.pinterest.com/" target="_blank" rel="noreferrer" className="roll-link"><Roll>PIN</Roll></a>
        </div>
        <a className="wordmark" href="#top" aria-label="DVERSO Studio home">DVERSO<span>STUDIO</span></a>
        <div className="header-right">
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#top" className="roll-link"><Roll>HOME</Roll></a>
            <a href="#about" className="roll-link"><Roll>ABOUT US</Roll></a>
            <a href="#contact" className="roll-link"><Roll>CONTACT</Roll></a>
          </nav>
          <button type="button" className="menu-btn" data-magnetic data-magnetic-strength="0.25" aria-expanded={open} aria-controls="site-menu" onClick={openMenu}>
            <span className="menu-btn-dots" aria-hidden="true"><i /><i /></span>
            <Roll>MENU</Roll>
          </button>
        </div>
      </header>

      <button type="button" ref={fab} className="menu-fab" aria-expanded={open} aria-controls="site-menu" onClick={openMenu}>
        <span className="menu-btn-dots" aria-hidden="true"><i /><i /></span>
        <Roll>MENU</Roll>
      </button>

      <div className="menu-overlay" id="site-menu" ref={overlay} role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!open} {...(!open ? { inert: true } : {})} data-lenis-prevent>
        <div className="menu-top">
          <span className="menu-brand">DVERSO<em>STUDIO</em></span>
          <button type="button" className="menu-close" onClick={closeMenu}><Roll>CLOSE</Roll> <span aria-hidden="true">✕</span></button>
        </div>

        <div className="menu-body">
          <nav className={`menu-list${active !== null ? " has-active" : ""}`} aria-label="Menu">
            {ITEMS.map((item, i) => (
              <a
                key={item.n}
                href={item.href}
                className={`menu-item${active === i ? " is-active" : ""}`}
                onClick={closeMenu}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
              >
                <span className="menu-num">{item.n}</span>
                <span className="menu-word">{item.label}</span>
                <span className="menu-line" aria-hidden="true" />
              </a>
            ))}
          </nav>

          <div className="menu-previews" aria-hidden="true">
            {ITEMS.map((item, i) => (
              <div
                key={item.n}
                className={`menu-preview${active === i || (active === null && i === 0) ? " is-on" : ""}`}
                style={armed ? { backgroundImage: `url(https://images.unsplash.com/${item.img}?auto=format&fit=crop&w=900&q=70)` } : undefined}
              />
            ))}
          </div>
        </div>

        <div className="menu-secondary">
          <a href="mailto:hello@dversostudio.com" className="roll-link"><Roll>HELLO@DVERSOSTUDIO.COM</Roll></a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="roll-link"><Roll>INSTAGRAM ↗</Roll></a>
          <a href="https://www.pinterest.com/" target="_blank" rel="noreferrer" className="roll-link"><Roll>PINTEREST ↗</Roll></a>
          <span>ITALY — WORKING EVERYWHERE</span>
        </div>
      </div>
    </>
  );
}
