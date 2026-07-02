"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Momentum smooth scroll (Lenis). Inertial, eased wheel scrolling.
 * Disabled under prefers-reduced-motion. Native touch (no smoothTouch).
 */
export function SmoothWheelScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    document.documentElement.dataset.smoothWheel = "lenis";
    let id = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      delete document.documentElement.dataset.smoothWheel;
    };
  }, []);

  return <span aria-hidden="true" data-smooth-wheel-scroll="" hidden />;
}
