"use client";

import { useEffect } from "react";

export function AudioReworkMotion() {
  useEffect(() => {
    const root = document.querySelector(".rwk") as HTMLElement | null;
    if (!root) return;

    const header = document.querySelector(".shell-header") as HTMLElement | null;
    const setHeadH = () =>
      root.style.setProperty("--rwk-headh", `${header ? Math.round(header.getBoundingClientRect().height) || 92 : 92}px`);
    setHeadH();

    const io = new IntersectionObserver(
      (es) => { for (const e of es) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } } },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    root.querySelectorAll(".hero [data-reveal]").forEach((el) => el.classList.add("in"));

    const hero = root.querySelector("#heroMedia") as HTMLElement | null;
    const atmos = root.querySelector("#atmosMedia") as HTMLElement | null;
    const heroReveal = root.querySelector("#heroReveal") as HTMLElement | null;
    const heroDim = root.querySelector("#heroDim") as HTMLElement | null;
    const heroCue = root.querySelector("#heroCue") as HTMLElement | null;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight || 1;
        if (header) header.classList.toggle("rwk-solid", y > 70);
        // hero: text shown on load, fades out fast on scroll; photo starts softly blurred and sharpens
        const prog = Math.min(1, Math.max(0, y / (vh * 0.16)));
        if (hero) {
          hero.style.transform = `translateY(${y * 0.16}px)`;
          hero.style.filter = `blur(${(1 - prog) * 2.5}px)`;
        }
        const tprog = Math.min(1, prog * 1.6); // text fades fastest
        if (heroReveal) {
          heroReveal.style.opacity = String(1 - tprog);
          heroReveal.style.transform = `translateY(${-tprog * 46}px)`;
        }
        if (heroDim) heroDim.style.opacity = String((1 - tprog) * 0.6);
        if (heroCue) heroCue.style.opacity = String(Math.max(0, 1 - prog * 2.4));
        void atmos;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", setHeadH);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", setHeadH);
      io.disconnect();
      header?.classList.remove("rwk-solid");
    };
  }, []);

  return null;
}
