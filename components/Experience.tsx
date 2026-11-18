"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import {
  gsap, ScrollTrigger, SplitText, registerGsap, revealText, scrubWords, magnetic,
  setLenis, getLenis, scrollToTarget, EASE, DUR, BP, EVT_READY,
} from "@/lib/motion";

const q = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  gsap.utils.toArray<T>(sel, root as Element);

/**
 * Scroll choreography + intro for the whole page.
 * Structure:
 *  1. Intro effect  — hero entrance, plays once (after preloader, or immediately if already seen).
 *  2. Scroll effect — Lenis + ScrollTrigger inside gsap.matchMedia (desktop / mobile / reduced-motion).
 * Everything is created inside a gsap.context / matchMedia, so it is fully reverted on unmount,
 * on breakpoint change and on reduced-motion change. No listeners are left behind.
 */
export default function Experience() {
  const bar = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ */
  /* 1 · HERO INTRO                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    registerGsap();
    const html = document.documentElement;
    if (window.matchMedia(BP.reduce).matches) { html.removeAttribute("data-motion"); return; }

    let started = false;
    const abort = new AbortController();
    const ctx = gsap.context(() => {
      const heroLines = q(".hero-title-line");
      const splits = heroLines.map((l) => SplitText.create(l, { type: "chars" }));
      const chars = splits.map((s) => s.chars);
      const wm = SplitText.create(".wordmark", { type: "chars" });

      // Initial (hidden) states — CSS already hides them pre-hydration under html[data-motion].
      gsap.set(".hero-title", { visibility: "visible" });
      gsap.set(".wordmark", { opacity: 1 });
      gsap.set(chars, { yPercent: 118 });
      gsap.set(wm.chars, { yPercent: 105, opacity: 0 });
      gsap.set(".hero-image", { clipPath: "inset(9% 6% 9% 6%)", scale: 1.32 });
      gsap.set(".hero-kicker", { y: 20 });
      gsap.set(".hero-meta, .hero-index", { y: 10 });
      gsap.set(".header-social, .header-right", { y: -10 });
      gsap.set(".scroll-cue", { scaleY: 0, transformOrigin: "top" });

      const play = () => {
        if (started) return;
        started = true;
        html.dataset.intro = "1";
        const tl = gsap.timeline({
          defaults: { ease: EASE.expo },
          onComplete() { getLenis()?.start(); ScrollTrigger.refresh(); },
        });
        // Lead: the visual. Background enters with a soft clip + settling scale.
        tl.to(".hero-image", { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1.12, duration: 2.1, ease: EASE.signature }, 0)
          // Support: brand mark, then the title rises line by line (each line a beat behind, decreasing gap).
          .to(wm.chars, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.04 }, 0.35)
          .to(".header-social, .header-right", { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.55);
        chars.forEach((c, i) => {
          tl.to(c, { yPercent: 0, duration: 1.25, stagger: { each: 0.035, ease: "power2.out" } }, 0.55 + i * 0.16);
        });
        tl.to(".hero-kicker", { opacity: 1, y: 0, duration: 1 }, 1.15)
          .to(".hero-meta", { opacity: 1, y: 0, duration: 0.9 }, 1.45)
          .to(".hero-index", { opacity: 1, y: 0, duration: 0.9 }, 1.6)
          .to(".scroll-cue", { scaleY: 1, duration: 1.2, ease: EASE.signature }, 1.7);
      };

      if (html.dataset.seen) play();
      else {
        window.addEventListener(EVT_READY, play, { once: true, signal: abort.signal });
        // Failsafe: never leave the hero hidden if the preloader signal is lost.
        const fs = window.setTimeout(play, 10000);
        abort.signal.addEventListener("abort", () => window.clearTimeout(fs));
      }
    });

    return () => { abort.abort(); ctx.revert(); };
  }, []);

  /* ------------------------------------------------------------------ */
  /* 2 · SMOOTH SCROLL + SCROLL CHOREOGRAPHY                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    registerGsap();
    const html = document.documentElement;

    // Anchor navigation always goes through the same scroll engine (Lenis, or native fallback).
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href") || "";
      if (hash.length < 2) return;
      const target = hash === "#top" ? 0 : document.querySelector<HTMLElement>(hash);
      if (target === null) return;
      e.preventDefault();
      scrollToTarget(target as number | HTMLElement);
    };
    document.addEventListener("click", onAnchor);

    const mm = gsap.matchMedia();
    mm.add(
      { desktop: BP.desktop, mobile: BP.mobile, reduce: BP.reduce, fine: BP.finePointer },
      (ctx) => {
        const { desktop, reduce, fine } = ctx.conditions as Record<string, boolean>;
        if (reduce) { html.removeAttribute("data-motion"); return; }

        const cleanups: Array<() => void> = [];

        /* ---------- Lenis ↔ ScrollTrigger ---------- */
        const lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
        setLenis(lenis);
        if (!html.dataset.intro && !html.dataset.seen) lenis.stop();
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (t: number) => lenis.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        cleanups.push(() => { gsap.ticker.remove(tick); lenis.destroy(); setLenis(null); });

        /* ---------- Scroll progress ---------- */
        if (bar.current) {
          gsap.fromTo(bar.current, { scaleX: 0 }, {
            scaleX: 1, ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: true },
          });
        }

        /* ---------- HERO: exit + mouse parallax ---------- */
        gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
          .to(".hero-image", { yPercent: desktop ? 8 : 4, ease: "none" }, 0)
          .to(".hero-content", { y: desktop ? -90 : -40, opacity: 0.1, ease: "none" }, 0)
          .to(".hero-index", { opacity: 0, ease: "none" }, 0);

        if (fine) {
          const ix = gsap.quickTo(".hero-image", "x", { duration: 1.4, ease: "power3.out" });
          const iy = gsap.quickTo(".hero-image", "y", { duration: 1.4, ease: "power3.out" });
          const tx = gsap.quickTo(".hero-title", "x", { duration: 1.1, ease: "power3.out" });
          const ty = gsap.quickTo(".hero-title", "y", { duration: 1.1, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            if (window.scrollY > window.innerHeight) return;
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            ix(-nx * 26); iy(-ny * 16); // image drifts against the pointer (depth)
            tx(nx * 14); ty(ny * 8);    // title follows, gently
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          cleanups.push(() => window.removeEventListener("pointermove", onMove));
        }

        /* ---------- Section labels: hairline draws in ---------- */
        q(".section-label").forEach((el) => {
          const line = el.querySelector(".label-line");
          gsap.fromTo(line, { scaleX: 0 }, {
            scaleX: 1, duration: 1.6, ease: EASE.signature,
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
          gsap.from(el.querySelectorAll(":scope > span"), {
            opacity: 0, y: 8, duration: 0.9, ease: EASE.out, stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        /* ---------- Typography: masked reveals ---------- */
        q("[data-reveal-chars]").forEach((el) => revealText(el, "chars"));
        q("[data-reveal-words]").forEach((el) => revealText(el, "words"));
        q("[data-reveal-lines]").forEach((el) => revealText(el, "lines"));
        q("[data-scrub-words]").forEach((el) => scrubWords(el));

        // Links / small CTAs: wiped in from the left (distinct from text rise).
        q("[data-reveal-wipe]").forEach((el) => {
          gsap.fromTo(el, { clipPath: "inset(0 100% 0 0)", opacity: 1 }, {
            clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: EASE.signature,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        /* ---------- Image reveals (clip + counter-scale + inner parallax) ---------- */
        q(".image-reveal").forEach((el) => {
          const img = el.querySelector("img");
          gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, {
            clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: EASE.signature,
            scrollTrigger: { trigger: el, start: "top 84%", once: true },
          });
          if (img) {
            gsap.fromTo(img, { scale: 1.4, yPercent: desktop ? -7 : -3 }, {
              scale: 1.14, yPercent: desktop ? 7 : 3, ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.5 },
            });
          }
        });

        /* ---------- STATEMENT: exit ---------- */
        gsap.to(".statement-inner", {
          y: -60, scale: 0.96, opacity: 0.15, ease: "none",
          scrollTrigger: { trigger: ".statement", start: "bottom 70%", end: "bottom 5%", scrub: true },
        });

        /* ---------- SOCIAL SHOWCASE ---------- */
        const phones = q(".phone");
        phones.forEach((p, i) => {
          gsap.fromTo(p, { clipPath: "inset(100% 0% 0% 0%)" }, {
            clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: EASE.signature, delay: [0.15, 0, 0.3][i] ?? 0,
            scrollTrigger: { trigger: ".social-stage", start: "top 78%", once: true },
          });
        });
        // Different depths → different speeds (controlled parallax). Mobile renders all 3 phones fanned, softer speeds.
        const speeds: Record<string, number> = desktop
          ? { ".phone-left": -7, ".phone-center": -15, ".phone-right": -4 }
          : { ".phone-left": -4, ".phone-center": -10, ".phone-right": -5 };
        Object.entries(speeds).forEach(([sel, yp]) => {
          gsap.to(sel, {
            yPercent: yp, ease: "none",
            scrollTrigger: { trigger: ".social-stage", start: "top bottom", end: "bottom top", scrub: 0.6 },
          });
        });
        if (!desktop) {
          const stage = document.querySelector<HTMLElement>(".social-stage");
          const onPhoneTap = (e: MouseEvent) => {
            const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".phone");
            if (!card) return;
            const wasFront = card.classList.contains("is-front");
            phones.forEach((p) => p.classList.remove("is-front"));
            if (!wasFront && !card.classList.contains("phone-center")) card.classList.add("is-front");
          };
          stage?.addEventListener("click", onPhoneTap);
          cleanups.push(() => stage?.removeEventListener("click", onPhoneTap));
        }
        gsap.from(".note-left", { x: -34, opacity: 0, duration: 1.2, ease: EASE.expo, scrollTrigger: { trigger: ".social-stage", start: "top 78%", once: true } });
        gsap.from(".note-right", { x: 34, opacity: 0, duration: 1.2, ease: EASE.expo, delay: 0.15, scrollTrigger: { trigger: ".social-stage", start: "top 78%", once: true } });

        /* ---------- PORTFOLIO: pinned horizontal story (desktop) / swipe carousel (mobile) ---------- */
        const vp = document.querySelector<HTMLElement>(".project-viewport");
        const track = document.querySelector<HTMLElement>(".project-grid");
        const barEl = document.querySelector<HTMLElement>(".project-progress-bar");
        const countEl = document.querySelector<HTMLElement>(".project-count");
        const panels = q(".project");
        const N = panels.length;
        const setProgress = (p: number) => {
          if (barEl) barEl.style.transform = `scaleX(${p})`;
          if (countEl) countEl.textContent = `${String(Math.round(p * (N - 1)) + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
        };

        if (vp && track && panels.length) {
          const reveal = (panel: HTMLElement) =>
            gsap.timeline({ paused: true })
              .fromTo(panel.querySelector(".project-image"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: EASE.signature }, 0)
              .fromTo(panel.querySelector(".project-info"), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, ease: EASE.expo }, 0.55);

          panels.forEach((p) => {
            gsap.set(p.querySelector(".project-image"), { clipPath: "inset(100% 0% 0% 0%)" });
            gsap.set(p.querySelector(".project-info"), { opacity: 0 });
          });

          if (desktop) {
            const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
            const h = gsap.to(track, {
              x: () => -dist(), ease: "none",
              scrollTrigger: {
                trigger: vp, pin: true, scrub: true, start: "top top",
                end: () => "+=" + dist(), invalidateOnRefresh: true, anticipatePin: 1,
                onUpdate: (self) => setProgress(self.progress),
              },
            });
            panels.forEach((p, i) => {
              const t = reveal(p);
              if (i < 2) ScrollTrigger.create({ trigger: vp, start: "top 72%", once: true, onEnter: () => t.play() });
              else ScrollTrigger.create({ trigger: p, containerAnimation: h, start: "left 94%", once: true, onEnter: () => t.play() });
              // Controlled scale: images settle as each panel travels into the frame.
              const img = p.querySelector("img");
              if (img) {
                gsap.fromTo(img, { scale: 1.3 }, {
                  scale: 1.04, ease: "none",
                  scrollTrigger: { trigger: p, containerAnimation: h, start: "left 100%", end: "left 35%", scrub: true },
                });
              }
            });
            setProgress(0);
          } else {
            // Mobile: native horizontal swipe (never traps vertical scroll), deterministic IO reveals + active card tracking.
            const timelines = panels.map((p) => reveal(p));
            const played = new Set<number>();
            const playPanel = (i: number) => {
              if (played.has(i)) return;
              played.add(i);
              timelines[i].play();
            };

            let inView = false;
            const io = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (!entry.isIntersecting) return;
                  const idx = panels.indexOf(entry.target as HTMLElement);
                  if (idx !== -1 && inView) playPanel(idx);
                });
              },
              { root: track, threshold: 0.12 }
            );
            panels.forEach((p) => io.observe(p));
            cleanups.push(() => io.disconnect());

            ScrollTrigger.create({
              trigger: track,
              start: "top 86%",
              once: true,
              onEnter: () => {
                inView = true;
                playPanel(0);
                playPanel(1);
              },
            });

            const updateActive = () => {
              const max = track.scrollWidth - track.clientWidth;
              setProgress(max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0);
              const center = track.scrollLeft + track.clientWidth / 2;
              let best = 0;
              let bestDist = Infinity;
              panels.forEach((p, idx) => {
                const c = p.offsetLeft + p.offsetWidth / 2;
                const d = Math.abs(c - center);
                if (d < bestDist) { bestDist = d; best = idx; }
              });
              panels.forEach((p, idx) => {
                p.classList.toggle("is-active", idx === best);
                if (inView && idx === best) playPanel(idx);
              });
            };
            track.addEventListener("scroll", updateActive, { passive: true });
            updateActive();
            cleanups.push(() => track.removeEventListener("scroll", updateActive));
          }
        }

        /* ---------- SERVICES ---------- */
        q(".service-row").forEach((row) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } });
          tl.fromTo(row.querySelector(".service-line"), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: EASE.signature }, 0)
            .from(row.querySelector(".service-number"), { opacity: 0, x: -12, duration: 0.8, ease: EASE.out }, 0.15)
            .from(row.querySelector(".service-name"), { yPercent: 70, opacity: 0, duration: 1.1, ease: EASE.expo }, 0.1)
            .from(row.querySelector(".service-arrow"), { opacity: 0, x: -8, y: 8, duration: 0.8, ease: EASE.out }, 0.5);
          // On hover devices the description is revealed by the hover state itself (CSS); on touch it is animated in and cleared so CSS .is-active drives opacity.
          const desc = row.querySelector<HTMLElement>(".service-description");
          if (!fine && desc) {
            tl.fromTo(desc, { opacity: 0, y: 12 }, { opacity: 0.55, y: 0, duration: 0.9, ease: EASE.out, clearProps: "opacity,transform" }, 0.35);
          }

          // Touch has no hover: the row nearest the centre of the viewport takes the "active" state instead.
          if (!fine) {
            ScrollTrigger.create({
              trigger: row, start: "top 54%", end: "bottom 46%",
              toggleClass: { targets: row, className: "is-active" },
            });
          }
        });

        /* ---------- TESTIMONIALS: exit ---------- */
        gsap.to(".testimonial-copy", {
          y: -40, opacity: 0.2, ease: "none",
          scrollTrigger: { trigger: ".testimonial-section", start: "bottom 65%", end: "bottom 10%", scrub: true },
        });

        /* ---------- FINAL CTA ---------- */
        gsap.fromTo(".cta-section", { backgroundColor: "#0d0d0d" }, {
          backgroundColor: "#19140d", ease: "none",
          scrollTrigger: { trigger: ".cta-section", start: "top 85%", end: "top 15%", scrub: true },
        });
        gsap.from(".cta-copy .cta-button", {
          opacity: 0, y: 26, duration: 1.1, ease: EASE.expo, delay: 0.5,
          scrollTrigger: { trigger: ".cta-copy", start: "top 70%", once: true },
        });
        gsap.from(".cta-copy > p:not(.eyebrow)", {
          opacity: 0, y: 18, duration: 1, ease: EASE.out, delay: 0.35,
          scrollTrigger: { trigger: ".cta-copy", start: "top 70%", once: true },
        });

        /* ---------- CONTACT FORM ---------- */
        gsap.from(".contact-form > *", {
          opacity: 0, y: 34, duration: 1.1, ease: EASE.expo,
          stagger: { each: 0.09, ease: "power2.out" },
          scrollTrigger: { trigger: ".contact-form", start: "top 82%", once: true },
        });

        /* ---------- FOOTER ---------- */
        gsap.from(".footer-bottom > *", {
          opacity: 0, y: 14, duration: 0.9, ease: EASE.out, stagger: 0.08,
          scrollTrigger: { trigger: ".footer-bottom", start: "top 96%", once: true },
        });

        /* ---------- Magnetic buttons (pointer devices only) ---------- */
        if (fine) {
          q("[data-magnetic]").forEach((el) => cleanups.push(magnetic(el, Number(el.dataset.magneticStrength) || 0.35)));
        }

        /* ---------- Refresh once fonts / images settle (layout is stable → no CLS) ---------- */
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        document.fonts?.ready.then(refresh);
        cleanups.push(() => window.removeEventListener("load", refresh));

        return () => cleanups.forEach((fn) => fn());
      }
    );

    return () => {
      document.removeEventListener("click", onAnchor);
      mm.revert();
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true"><div ref={bar} /></div>;
}
