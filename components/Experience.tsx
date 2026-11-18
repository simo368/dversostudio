"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import {
  gsap, ScrollTrigger, SplitText, registerGsap, revealText, scrubWords, magnetic,
  setLenis, getLenis, scrollToTarget, EASE, BP, EVT_READY,
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

        /* ---------- HERO: continuous exit + pointer/scroll depth ---------- */
        const heroExit = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        if (desktop) {
          heroExit
            .to(".hero-image", { yPercent: 8, ease: "none" }, 0)
            .to(".hero-content", { y: -90, opacity: 0.1, ease: "none" }, 0)
            .to(".hero-index", { opacity: 0, ease: "none" }, 0);
        } else {
          heroExit
            .to(".hero-image", { yPercent: 9, scale: 1.03, ease: "none" }, 0)
            .to(".hero-title", { scale: 0.91, ease: "none" }, 0)
            .to(".hero-content", { y: -52, opacity: 0.08, ease: "none" }, 0)
            .to(".hero-index, .scroll-cue", { opacity: 0, ease: "none" }, 0);
        }

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

        /* ---------- Section labels: number leads, label + hairline draw in ---------- */
        q(".section-label").forEach((el) => {
          const line = el.querySelector(".label-line");
          const num = el.querySelector(":scope > span:first-child");
          const title = el.querySelector(":scope > span:nth-child(2)");
          const st = { trigger: el, start: "top 92%", once: true };
          gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: EASE.signature, scrollTrigger: st });
          if (num) gsap.from(num, { opacity: 0, x: -10, duration: 0.8, ease: EASE.expo, scrollTrigger: st });
          if (title) gsap.from(title, { opacity: 0, y: 8, duration: 0.9, delay: 0.08, ease: EASE.out, scrollTrigger: st });
        });

        /* ---------- Typography: masked reveals ---------- */
        q("[data-reveal-chars]").forEach((el) => revealText(el, "chars"));
        q("[data-reveal-words]").forEach((el) => revealText(el, "words"));
        q("[data-reveal-lines]").forEach((el) => revealText(el, "lines"));
        q("[data-scrub-words]").forEach((el) => scrubWords(el));

        // Final CTA heading: regular words rise first, italic emphasis lands a beat later.
        const ctaHeading = document.querySelector<HTMLElement>("[data-cta-heading]");
        if (ctaHeading) {
          SplitText.create(ctaHeading, {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            linesClass: "split-line",
            onSplit(self) {
              gsap.set(ctaHeading, { visibility: "visible" });
              const em = ctaHeading.querySelector("em");
              const leadWords = self.words.filter((w) => !em || !em.contains(w));
              const emWords = self.words.filter((w) => em && em.contains(w));
              const tl = gsap.timeline({ scrollTrigger: { trigger: ctaHeading, start: "top 86%", once: true } });
              tl.from(leadWords, { yPercent: 115, duration: 0.95, ease: EASE.expo, stagger: 0.07 }, 0);
              if (emWords.length) {
                tl.from(emWords, { yPercent: 115, duration: 1.05, ease: EASE.expo, stagger: 0.08 }, 0.22);
              }
              return tl;
            },
          });
        }

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
            gsap.fromTo(img, { scale: 1.4, yPercent: desktop ? -7 : -4 }, {
              scale: 1.14, yPercent: desktop ? 7 : 4, ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.5 },
            });
          }
        });

        /* ---------- STATEMENT: exit ---------- */
        gsap.to(".statement-inner", {
          y: desktop ? -60 : -36, scale: 0.96, opacity: 0.15, ease: "none",
          scrollTrigger: { trigger: ".statement", start: "bottom 70%", end: "bottom 5%", scrub: true },
        });

        /* ---------- SOCIAL SHOWCASE ---------- */
        const stage = document.querySelector<HTMLElement>(".social-stage");
        const phones = q(".phone");
        if (desktop) {
          phones.forEach((p, i) => {
            gsap.fromTo(p, { clipPath: "inset(100% 0% 0% 0%)" }, {
              clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: EASE.signature, delay: [0.15, 0, 0.3][i] ?? 0,
              scrollTrigger: { trigger: ".social-stage", start: "top 78%", once: true },
            });
          });
          const speeds: Record<string, number> = { ".phone-left": -7, ".phone-center": -15, ".phone-right": -4 };
          Object.entries(speeds).forEach(([sel, yp]) => {
            gsap.to(sel, {
              yPercent: yp, ease: "none",
              scrollTrigger: { trigger: ".social-stage", start: "top bottom", end: "bottom top", scrub: 0.6 },
            });
          });
        } else {
          // Mobile: staggered 3D fanned entrance (left → center → right) + internal image settle + tap-to-focus.
          const mobileOrigins = [
            { xPercent: -14, yPercent: 10 },
            { xPercent: 0, yPercent: 18 },
            { xPercent: 14, yPercent: 10 },
          ];
          phones.forEach((p, i) => {
            const origin = mobileOrigins[i] ?? { xPercent: 0, yPercent: 12 };
            const tl = gsap.timeline({ scrollTrigger: { trigger: ".social-stage", start: "top 82%", once: true } });
            tl.fromTo(
              p,
              { clipPath: "inset(100% 0% 0% 0%)", xPercent: origin.xPercent, yPercent: origin.yPercent },
              { clipPath: "inset(0% 0% 0% 0%)", xPercent: 0, yPercent: 0, duration: 1.35, delay: i * 0.12, ease: EASE.signature, clearProps: "transform" },
              0
            );
            const mediaImg = p.querySelector<HTMLElement>(".phone-media img");
            if (mediaImg) {
              tl.fromTo(mediaImg, { scale: 1.24 }, { scale: 1, duration: 1.4, delay: i * 0.12, ease: EASE.expo, clearProps: "transform" }, 0);
            }
          });
          // Differential vertical parallax (center dominates, flanks lag for depth)
          const mobileSpeeds: Record<string, number> = { ".phone-left": -4, ".phone-center": -12, ".phone-right": -6 };
          Object.entries(mobileSpeeds).forEach(([sel, yp]) => {
            gsap.to(sel, {
              yPercent: yp, ease: "none",
              scrollTrigger: { trigger: ".social-stage", start: "top bottom", end: "bottom top", scrub: 0.6 },
            });
          });
          // Smoothly exit social stage into portfolio
          if (stage) {
            gsap.to(stage, {
              y: -26, opacity: 0.35, ease: "none",
              scrollTrigger: { trigger: ".social-section", start: "bottom 60%", end: "bottom 10%", scrub: true },
            });
            stage.dataset.focus = "1";
            const onPhoneTap = (e: MouseEvent) => {
              const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".phone");
              if (!card) return;
              const idx = phones.indexOf(card);
              if (idx === -1) return;
              const current = stage.dataset.focus ?? "1";
              // Tapping an already-focused side card returns focus to the center card.
              stage.dataset.focus = current === String(idx) && idx !== 1 ? "1" : String(idx);
            };
            stage.addEventListener("click", onPhoneTap);
            cleanups.push(() => {
              stage.removeEventListener("click", onPhoneTap);
              delete stage.dataset.focus;
            });
          }
        }
        gsap.from(".note-left", { x: -34, opacity: 0, duration: 1.2, ease: EASE.expo, scrollTrigger: { trigger: ".social-stage", start: "top 78%", once: true } });
        gsap.from(".note-right", { x: 34, opacity: 0, duration: 1.2, ease: EASE.expo, delay: 0.15, scrollTrigger: { trigger: ".social-stage", start: "top 78%", once: true } });

        /* ---------- PORTFOLIO: pinned horizontal story (desktop) / depth swipe stage (mobile) ---------- */
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
          if (desktop) {
            const reveal = (panel: HTMLElement) =>
              gsap.timeline({ paused: true })
                .fromTo(panel.querySelector(".project-image"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: EASE.signature }, 0)
                .fromTo(panel.querySelector(".project-info"), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, ease: EASE.expo }, 0.55);

            panels.forEach((p) => {
              gsap.set(p.querySelector(".project-image"), { clipPath: "inset(100% 0% 0% 0%)" });
              gsap.set(p.querySelector(".project-info"), { opacity: 0 });
            });

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
            // Mobile: scenographic per-card reveal + continuous swipe depth & internal image parallax.
            const revealMobile = (panel: HTMLElement) => {
              const box = panel.querySelector(".project-image");
              const img = panel.querySelector("img");
              const num = panel.querySelector(".project-number");
              const title = panel.querySelector(".project-info h3");
              const cat = panel.querySelector(".project-info p");
              const arrow = panel.querySelector(".project-info .arrow-circle");
              return gsap.timeline({ paused: true })
                .fromTo(box, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.45, ease: EASE.signature }, 0)
                .fromTo(img, { scale: 1.28 }, { scale: 1.06, duration: 1.55, ease: EASE.expo }, 0)
                .fromTo(num, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EASE.expo }, 0.35)
                .fromTo(title, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: EASE.expo }, 0.48)
                .fromTo(cat, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: EASE.out }, 0.6)
                .fromTo(arrow, { scale: 0.72, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.75, ease: EASE.expo }, 0.62);
            };

            panels.forEach((p) => {
              gsap.set(p.querySelector(".project-image"), { clipPath: "inset(100% 0% 0% 0%)" });
              gsap.set(p.querySelectorAll(".project-number, .project-info h3, .project-info p, .project-info .arrow-circle"), { opacity: 0 });
            });

            const timelines = panels.map((p) => revealMobile(p));
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

            // Vertical scroll parallax on the portfolio stage (never traps vertical scroll)
            gsap.to(".project-grid", {
              y: -18, ease: "none",
              scrollTrigger: { trigger: vp, start: "top bottom", end: "bottom top", scrub: 0.5 },
            });

            let rafId = 0;
            const updateSwipeDepth = () => {
              rafId = 0;
              const max = track.scrollWidth - track.clientWidth;
              setProgress(max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0);
              const viewCenter = track.scrollLeft + track.clientWidth / 2;
              const span = Math.max(1, track.clientWidth * 0.85);
              let best = 0;
              let bestDist = Infinity;

              panels.forEach((p, idx) => {
                const cardCenter = p.offsetLeft + p.offsetWidth / 2;
                const rawDelta = cardCenter - viewCenter;
                const absDelta = Math.abs(rawDelta);
                if (absDelta < bestDist) { bestDist = absDelta; best = idx; }

                // Normalized [-1, 1] offset from viewport center
                const d = Math.max(-1, Math.min(1, rawDelta / span));
                const ad = Math.abs(d);
                p.style.transform = `scale(${(1 - 0.065 * ad).toFixed(4)})`;
                p.style.opacity = `${(1 - 0.34 * ad).toFixed(3)}`;

                const img = p.querySelector<HTMLElement>(".project-image img");
                if (img) img.style.translate = `${(d * 7).toFixed(2)}% 0`;

                const info = p.querySelector<HTMLElement>(".project-info");
                if (info) info.style.transform = `translate3d(${(d * 18).toFixed(1)}px, 0, 0)`;
              });

              panels.forEach((p, idx) => {
                p.classList.toggle("is-active", idx === best);
                if (inView && idx === best) playPanel(idx);
              });
            };

            const onTrackScroll = () => {
              if (!rafId) rafId = window.requestAnimationFrame(updateSwipeDepth);
            };
            track.addEventListener("scroll", onTrackScroll, { passive: true });
            updateSwipeDepth();
            cleanups.push(() => {
              track.removeEventListener("scroll", onTrackScroll);
              if (rafId) window.cancelAnimationFrame(rafId);
              panels.forEach((p) => {
                p.style.transform = "";
                p.style.opacity = "";
                const img = p.querySelector<HTMLElement>(".project-image img");
                if (img) img.style.translate = "";
                const info = p.querySelector<HTMLElement>(".project-info");
                if (info) info.style.transform = "";
              });
            });
          }
        }

        /* ---------- SERVICES ---------- */
        const serviceRows = q(".service-row");
        serviceRows.forEach((row) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } });
          tl.fromTo(row.querySelector(".service-line"), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: EASE.signature }, 0)
            .from(row.querySelector(".service-number"), { opacity: 0, x: -12, duration: 0.8, ease: EASE.out }, 0.15)
            .from(row.querySelector(".service-name"), { yPercent: 70, opacity: 0, duration: 1.1, ease: EASE.expo }, 0.1)
            .from(row.querySelector(".service-arrow"), { opacity: 0, x: -8, y: 8, duration: 0.8, ease: EASE.out }, 0.5);

          // On hover devices the description is revealed by CSS hover; on touch it enters once and clears inline props so CSS .is-active drives opacity.
          const desc = row.querySelector<HTMLElement>(".service-description");
          if (!fine && desc) {
            tl.fromTo(desc, { opacity: 0, y: 12 }, { opacity: 0.5, y: 0, duration: 0.9, ease: EASE.out, clearProps: "opacity,transform" }, 0.35);
          }
        });

        // Touch has no hover: strictly ONE service row (nearest viewport center) stays active while scrolling the list.
        if (!fine && serviceRows.length) {
          const pickClosest = () => {
            const mid = window.innerHeight * 0.5;
            let best: HTMLElement | null = null;
            let bestDist = Infinity;
            serviceRows.forEach((row) => {
              const r = row.getBoundingClientRect();
              if (r.bottom < window.innerHeight * 0.18 || r.top > window.innerHeight * 0.82) return;
              const d = Math.abs(r.top + r.height / 2 - mid);
              if (d < bestDist) { bestDist = d; best = row; }
            });
            serviceRows.forEach((row) => row.classList.toggle("is-active", row === best));
          };
          ScrollTrigger.create({
            trigger: ".service-list",
            start: "top 82%",
            end: "bottom 18%",
            onUpdate: pickClosest,
            onEnter: pickClosest,
            onEnterBack: pickClosest,
            onLeave: () => serviceRows.forEach((row) => row.classList.remove("is-active")),
            onLeaveBack: () => serviceRows.forEach((row) => row.classList.remove("is-active")),
          });
        }

        /* ---------- TESTIMONIALS: exit ---------- */
        gsap.to(".testimonial-copy", {
          y: desktop ? -40 : -24, opacity: 0.2, ease: "none",
          scrollTrigger: { trigger: ".testimonial-section", start: "bottom 65%", end: "bottom 10%", scrub: true },
        });

        /* ---------- FINAL CTA ---------- */
        gsap.fromTo(".cta-section", { backgroundColor: "#0d0d0d" }, {
          backgroundColor: "#19140d", ease: "none",
          scrollTrigger: { trigger: ".cta-section", start: "top 85%", end: "top 15%", scrub: true },
        });
        gsap.from(".cta-copy .cta-button", {
          opacity: 0, y: 26, duration: 1.1, ease: EASE.expo, delay: 0.5,
          scrollTrigger: { trigger: ".cta-copy", start: "top 72%", once: true },
        });
        gsap.from(".cta-copy > p:not(.eyebrow)", {
          opacity: 0, y: 18, duration: 1, ease: EASE.out, delay: 0.35,
          scrollTrigger: { trigger: ".cta-copy", start: "top 72%", once: true },
        });

        /* ---------- Touch tap feedback on primary buttons (completes fill sweep even on quick taps) ---------- */
        if (!fine) {
          const btns = q(".cta-button, .form-bottom button");
          const timers = new Map<HTMLElement, number>();
          btns.forEach((btn) => {
            const onTapDown = (e: PointerEvent) => {
              if (e.pointerType === "mouse") return;
              btn.classList.add("is-tapped");
              const prev = timers.get(btn);
              if (prev) window.clearTimeout(prev);
              timers.set(btn, window.setTimeout(() => btn.classList.remove("is-tapped"), 360));
            };
            btn.addEventListener("pointerdown", onTapDown, { passive: true });
            cleanups.push(() => {
              btn.removeEventListener("pointerdown", onTapDown);
              const prev = timers.get(btn);
              if (prev) window.clearTimeout(prev);
            });
          });
        }

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

        /* ---------- Refresh once fonts / images / orientation settle (layout is stable → no CLS) ---------- */
        let orientTimer = 0;
        const refresh = () => ScrollTrigger.refresh();
        const onOrient = () => {
          if (orientTimer) window.clearTimeout(orientTimer);
          orientTimer = window.setTimeout(refresh, 240);
        };
        window.addEventListener("load", refresh);
        window.addEventListener("orientationchange", onOrient);
        document.fonts?.ready.then(refresh);
        cleanups.push(() => {
          window.removeEventListener("load", refresh);
          window.removeEventListener("orientationchange", onOrient);
          if (orientTimer) window.clearTimeout(orientTimer);
        });

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
