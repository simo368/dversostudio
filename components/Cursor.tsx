"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap, BP } from "@/lib/motion";

/**
 * Custom cursor — only on devices with a fine pointer + hover.
 * One delegated listener pair; states are driven by `data-cursor` attributes:
 *   data-cursor="view"  + optional data-cursor-label="VIEW PROJECT"
 *   data-cursor="drag"
 * Links and buttons get the "link" state automatically.
 * pointer-events: none → it can never intercept a click.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGsap();
    const mq = window.matchMedia(BP.finePointer);
    const el = dot.current;
    if (!el) return;
    const html = document.documentElement;
    let cleanup = () => {};

    const enable = () => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
      let shown = false;

      const move = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        if (!shown) {
          shown = true;
          gsap.set(el, { x: e.clientX, y: e.clientY });
          html.classList.add("has-cursor");
          gsap.to(el, { opacity: 1, duration: 0.3 });
        }
        xTo(e.clientX);
        yTo(e.clientY);
      };
      const setState = (state: string, text = "") => {
        el.dataset.state = state;
        if (label.current) label.current.textContent = text;
      };
      const over = (e: MouseEvent) => {
        const t = e.target as HTMLElement | null;
        const host = t?.closest<HTMLElement>("[data-cursor], a, button, input, textarea, select, label");
        if (!host) return setState("idle");
        const kind = host.dataset.cursor;
        if (kind === "view") setState("view", host.dataset.cursorLabel || "VIEW");
        else if (kind === "drag") setState("view", "DRAG");
        else if (host.matches("input, textarea, select")) setState("text");
        else setState("link");
      };
      const down = () => el.classList.add("is-down");
      const up = () => el.classList.remove("is-down");
      const leaveDoc = () => gsap.to(el, { opacity: 0, duration: 0.25 });
      const enterDoc = () => shown && gsap.to(el, { opacity: 1, duration: 0.25 });

      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("mouseover", over, { passive: true });
      window.addEventListener("pointerdown", down, { passive: true });
      window.addEventListener("pointerup", up, { passive: true });
      document.documentElement.addEventListener("mouseleave", leaveDoc);
      document.documentElement.addEventListener("mouseenter", enterDoc);

      cleanup = () => {
        window.removeEventListener("pointermove", move);
        document.removeEventListener("mouseover", over);
        window.removeEventListener("pointerdown", down);
        window.removeEventListener("pointerup", up);
        document.documentElement.removeEventListener("mouseleave", leaveDoc);
        document.documentElement.removeEventListener("mouseenter", enterDoc);
        html.classList.remove("has-cursor");
        gsap.set(el, { opacity: 0 });
      };
    };

    const sync = () => { cleanup(); cleanup = () => {}; if (mq.matches) enable(); };
    sync();
    mq.addEventListener("change", sync);
    return () => { mq.removeEventListener("change", sync); cleanup(); };
  }, []);

  return (
    <div className="cursor" ref={dot} data-state="idle" aria-hidden="true">
      <span className="cursor-ring" />
      <span className="cursor-label" ref={label} />
    </div>
  );
}

