"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, registerGsap, EASE, SplitText } from "@/lib/motion";

/**
 * Editorial testimonials.
 * Content is intentionally a single "reserved" slot: the original copy states this space is for
 * verified client feedback shared with permission, so no testimonials are invented.
 * Add real entries to STORIES and the navigation (arrows, counter, animated progress) activates
 * automatically; transitions are interruption-safe (a new change kills the running one).
 */
type Story = { quote: string; note: string; label: string; status: string; image: string };

const STORIES: Story[] = [
  {
    quote: "Your next favourite collaboration could start here.",
    note: "We believe trust is built through the work. This space is reserved for verified client feedback, shared with permission.",
    label: "CLIENT STORIES",
    status: "COMING SOON",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const quote = useRef<HTMLParagraphElement>(null);
  const busy = useRef<gsap.core.Timeline | null>(null);
  const split = useRef<SplitText | null>(null);
  const first = useRef(false); // true after the first user navigation
  const story = STORIES[index];
  const many = STORIES.length > 1;

  useEffect(() => {
    registerGsap();
    const el = quote.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFirst = !first.current; // `first.current` flips to true once the user navigates
    const s = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line" });
    split.current = s;
    gsap.set(el, { visibility: "visible" });
    if (reduce) return () => s.revert();
    busy.current?.kill();
    // First entrance is scroll-triggered; later changes play immediately (and replace any running one).
    const st = isFirst ? { trigger: el, start: "top 84%", once: true } : undefined;
    busy.current = gsap
      .timeline({ scrollTrigger: st })
      .from(s.lines, { yPercent: 110, duration: 1.1, ease: EASE.expo, stagger: 0.1 })
      .from(".t-meta", { opacity: 0, y: 12, duration: 0.7, ease: EASE.out, stagger: 0.07 }, "-=0.8")
      .fromTo(".t-bar", { scaleX: 0 }, { scaleX: 1, duration: 1, ease: EASE.signature }, "-=0.9");
    return () => { busy.current?.scrollTrigger?.kill(); busy.current?.kill(); s.revert(); };
  }, [index]);

  const go = useCallback((dir: 1 | -1) => {
    first.current = true;
    setIndex((i) => (i + dir + STORIES.length) % STORIES.length);
  }, []);

  return (
    <div className="testimonial-layout" ref={root}>
      <div className="testimonial-image image-reveal" data-cursor="view" data-cursor-label="VIEW">
        <img key={story.image} src={story.image} alt="Light-filled creative studio interior" loading="lazy" decoding="async" />
      </div>
      <div className="testimonial-copy">
        <p className="quote-mark serif-italic t-meta" aria-hidden="true">“</p>
        <p className="testimonial-placeholder" key={index} ref={quote} style={{ visibility: "hidden" }}>{story.quote}</p>
        <p className="testimonial-note t-meta">{story.note}</p>
        <div className="testimonial-attribution t-meta">
          <span>{story.label}</span>
          <span>{story.status}</span>
        </div>
        <div className="testimonial-nav t-meta">
          <span className="t-count">{String(index + 1).padStart(2, "0")} / {String(STORIES.length).padStart(2, "0")}</span>
          <span className="t-track" aria-hidden="true"><span className="t-bar" /></span>
          {many && (
            <span className="t-arrows">
              <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial">←</button>
              <button type="button" onClick={() => go(1)} aria-label="Next testimonial">→</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
