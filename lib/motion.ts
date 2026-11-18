"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import type Lenis from "lenis";

/**
 * DVERSO STUDIO — centralised motion system.
 * Every duration, ease, delay, breakpoint and reusable animation lives here
 * so the whole site shares one rhythm.
 */

let registered = false;
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  // Signature curve: slow start, decisive middle, soft landing.
  CustomEase.create("dverso", "0.76, 0, 0.24, 1");
  CustomEase.create("dversoOut", "0.16, 1, 0.3, 1");
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

export const EASE = {
  out: "power3.out",
  outStrong: "power4.out",
  expo: "expo.out",
  inOut: "circ.inOut",
  signature: "dverso",
  signatureOut: "dversoOut",
  soft: "power2.out",
} as const;

export const DUR = {
  micro: 0.35,
  short: 0.6,
  base: 0.9,
  long: 1.2,
  cinematic: 1.6,
} as const;

export const STAGGER = {
  chars: 0.022,
  words: 0.06,
  lines: 0.11,
  items: 0.09,
} as const;

export const DELAY = { short: 0.12, base: 0.25 } as const;

export const BP = {
  mobile: "(max-width: 767px)",
  desktop: "(min-width: 768px)",
  reduce: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;

export const TRIGGER = {
  enter: "top 86%",
  enterLate: "top 78%",
} as const;

export const SESSION_KEY = "dverso-seen";
export const EVT_READY = "dverso:ready";

/* ---------- Lenis singleton ---------- */
let lenisInstance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenisInstance = l; };
export const getLenis = () => lenisInstance;

export function scrollToTarget(target: string | number | HTMLElement, immediate = false) {
  const l = lenisInstance;
  if (l) {
    l.scrollTo(target as never, {
      duration: immediate ? 0 : 1.7,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      immediate,
    });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (el instanceof HTMLElement) el.scrollIntoView({ behavior: "smooth" });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
}

/* ---------- Reusable animations ---------- */

type SplitKind = "lines" | "words" | "chars";

/**
 * Masked text reveal. `lines` and `words` use line masks (rising from below);
 * `chars` staggers characters inside the same mask. Text stays real DOM text
 * (SplitText adds aria-labels), so accessibility and SEO are untouched.
 * Returns the SplitText instance (auto re-splits on resize / font load).
 */
export function revealText(
  el: HTMLElement,
  kind: SplitKind,
  opts: { trigger?: gsap.DOMTarget; start?: string; delay?: number; scrollTrigger?: boolean } = {}
) {
  const { trigger = el, start = TRIGGER.enter, delay = 0, scrollTrigger = true } = opts;
  const stagger = kind === "chars" ? STAGGER.chars : kind === "words" ? STAGGER.words : STAGGER.lines;
  return SplitText.create(el, {
    type: kind === "chars" ? "lines,chars" : kind === "words" ? "lines,words" : "lines",
    mask: "lines",
    autoSplit: true,
    linesClass: "split-line",
    onSplit(self) {
      gsap.set(el, { visibility: "visible" });
      const targets = kind === "chars" ? self.chars : kind === "words" ? self.words : self.lines;
      return gsap.from(targets, {
        yPercent: 115,
        duration: kind === "lines" ? DUR.long : DUR.base,
        ease: EASE.expo,
        stagger,
        delay,
        scrollTrigger: scrollTrigger
          ? { trigger, start, once: true }
          : undefined,
      });
    },
  });
}

/** Words fade from dim to full as the user scrolls through them. */
export function scrubWords(el: HTMLElement, start = "top 82%", end = "bottom 48%") {
  return SplitText.create(el, {
    type: "words",
    autoSplit: true,
    onSplit(self) {
      gsap.set(el, { visibility: "visible" });
      return gsap.fromTo(
        self.words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.5,
          scrollTrigger: { trigger: el, start, end, scrub: 0.6 },
        }
      );
    },
  });
}

/** Magnetic pull for buttons. Returns a cleanup function. */
export function magnetic(el: HTMLElement, strength = 0.35) {
  const inner = el.querySelector<HTMLElement>("[data-magnetic-inner]");
  const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: EASE.outStrong });
  const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: EASE.outStrong });
  const ixTo = inner ? gsap.quickTo(inner, "x", { duration: 0.8, ease: EASE.outStrong }) : null;
  const iyTo = inner ? gsap.quickTo(inner, "y", { duration: 0.8, ease: EASE.outStrong }) : null;

  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    xTo(dx * strength);
    yTo(dy * strength);
    ixTo?.(dx * strength * 0.45);
    iyTo?.(dy * strength * 0.45);
  };
  const leave = () => { xTo(0); yTo(0); ixTo?.(0); iyTo?.(0); };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
    gsap.set([el, inner].filter(Boolean) as HTMLElement[], { clearProps: "transform" });
  };
}

export { gsap, ScrollTrigger, SplitText };

