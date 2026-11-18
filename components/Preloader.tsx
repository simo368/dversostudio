"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap, EASE, DUR, SESSION_KEY, EVT_READY, SplitText } from "@/lib/motion";

/**
 * Cinematic preloader. Shown once per session (the inline script in layout.tsx
 * flags `html[data-seen]` before paint, which hides it via CSS).
 * Not blocking: the page is already rendered underneath; this only gates the intro.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGsap();
    const html = document.documentElement;
    const el = root.current;
    if (!el) return;
    if (html.dataset.seen) { el.style.display = "none"; return; }

    let cancelled = false;
    const state = { v: 0 };
    const logo = el.querySelector<HTMLElement>(".preloader-logo")!;

    const ctx = gsap.context(() => {
      const split = SplitText.create(logo, { type: "chars" });
      gsap.set(logo, { visibility: "visible" });
      gsap.set(split.chars, { yPercent: 110, opacity: 0 });
      gsap.set(".preloader-sub, .preloader-meta", { opacity: 0, y: 10 });

      const intro = gsap.timeline();
      intro
        .to(split.chars, { yPercent: 0, opacity: 1, duration: DUR.base, ease: EASE.expo, stagger: 0.06 })
        .to(".preloader-sub", { opacity: 1, y: 0, duration: DUR.short, ease: EASE.out }, "-=0.5")
        .to(".preloader-meta", { opacity: 1, y: 0, duration: DUR.short, ease: EASE.out }, "-=0.45");

      // Progress 0 → 100 (minimum 1.6s so the reveal reads, capped by real readiness).
      const progress = gsap.to(state, {
        v: 100,
        duration: 1.7,
        ease: "power2.inOut",
        onUpdate() {
          if (counter.current) counter.current.textContent = String(Math.round(state.v)).padStart(3, "0");
          if (bar.current) bar.current.style.transform = `scaleX(${state.v / 100})`;
        },
      });
      progress.pause();

      const ready = Promise.race([
        Promise.all([
          document.readyState === "complete"
            ? Promise.resolve()
            : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true })),
          document.fonts ? document.fonts.ready : Promise.resolve(),
        ]),
        new Promise((r) => setTimeout(r, 4500)),
      ]);

      progress.play();
      Promise.all([ready, new Promise<void>((r) => progress.eventCallback("onComplete", () => r()))]).then(() => {
        if (cancelled) return;
        const out = gsap.timeline({
          defaults: { ease: EASE.signature },
          onComplete() {
            try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
            html.dataset.seen = "1";
            el.style.display = "none";
          },
        });
        out
          .to([".preloader-meta", ".preloader-sub"], { opacity: 0, y: -12, duration: 0.45, ease: EASE.out })
          .to(split.chars, { yPercent: -110, opacity: 0, duration: 0.7, stagger: 0.03, ease: EASE.signature }, "<0.05")
          .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.15 }, "-=0.2")
          .add(() => window.dispatchEvent(new Event(EVT_READY)), "-=0.85");
      });
    }, el);

    return () => { cancelled = true; ctx.revert(); };
  }, []);

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="preloader-inner">
        <div className="preloader-logo">DVERSO</div>
        <div className="preloader-sub">STUDIO</div>
      </div>
      <div className="preloader-meta">
        <span>INDEPENDENT CREATIVE &amp; DIGITAL AGENCY</span>
        <span className="preloader-count"><span ref={counter}>000</span>%</span>
      </div>
      <span className="preloader-bar"><span ref={bar} /></span>
    </div>
  );
}

