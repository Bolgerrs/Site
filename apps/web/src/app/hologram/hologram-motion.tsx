"use client";

import { useEffect } from "react";

export function HologramMotion() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 820px)").matches) return;
    const els = Array.from(
      document.querySelectorAll(".holo-spec [data-reveal], .holo-pitch[data-reveal]"),
    );
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // re-trigger every time the block enters / leaves the viewport
          e.target.classList.toggle("in", e.isIntersecting);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -12% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
