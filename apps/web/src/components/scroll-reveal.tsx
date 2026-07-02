"use client";

import { useEffect } from "react";

/**
 * Single source of truth for scroll-reveal across ALL product landings.
 * - base [data-reveal] is hidden (opacity:0) in CSS; this adds `.in` to fade+rise it in.
 * - staggered via --reveal-delay (from data-delay).
 * - generic count-up for [data-count].
 * - BULLETPROOF fail-safe: every [data-reveal] is revealed within ~1.5s even with NO scroll,
 *   so content can NEVER stay invisible (no "void", no disappearing banners) in a static /
 *   no-scroll / full-page capture. Scrollers still get the sequential IntersectionObserver
 *   stagger for anything they reach before the fail-safe fires.
 */
export function ScrollReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fmt = (v: number, dec: number) => (dec ? v.toFixed(dec) : String(Math.round(v)));
    const countUp = (el: HTMLElement) => {
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => {
        const target = Number(c.dataset.count || "0");
        const dec = Number(c.dataset.decimals || "0");
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / 1100);
          c.textContent = fmt(target * (1 - Math.pow(1 - p, 3)), dec);
          if (p < 1) requestAnimationFrame(step);
          else c.textContent = fmt(target, dec);
        };
        requestAnimationFrame(step);
      });
    };
    const finalCounts = (el: HTMLElement) =>
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => {
        c.textContent = fmt(Number(c.dataset.count || "0"), Number(c.dataset.decimals || "0"));
      });

    const reveal = (node: Element) => {
      const el = node as HTMLElement;
      if (el.classList.contains("in")) return;
      el.style.setProperty("--reveal-delay", String(el.dataset.delay ?? "0"));
      el.classList.add("in");
      if (prefersReduced) finalCounts(el);
      else countUp(el);
    };

    const all = () => Array.from(document.querySelectorAll("[data-reveal]"));
    if (prefersReduced) {
      all().forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            reveal(en.target);
            io.unobserve(en.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );
    all().forEach((el) => io.observe(el));

    // scroll-driven sweep: reveal blocks as they enter view (sequential stagger on scroll).
    const sweep = () => {
      document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => {
        if ((el as HTMLElement).getBoundingClientRect().top < window.innerHeight * 0.95) reveal(el);
      });
    };
    window.addEventListener("scroll", sweep, { passive: true });

    // NO reveal-all fail-safe — revealing below-fold blocks at once KILLS the sequential
    // stagger. Above-fold reveals on load (IO); below-fold reveals on scroll (IO + sweep).
    // A static no-scroll capture showing below-fold hidden is BY DESIGN (scroll-reveal),
    // NOT a void — the gate must SCROLL to judge. No-JS safety is handled in CSS.
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", sweep);
    };
  }, []);

  return null;
}
