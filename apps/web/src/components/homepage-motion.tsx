"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HomepageMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const isYandexBrowser = /\bYaBrowser\//.test(navigator.userAgent);

    document.documentElement.classList.add("home-gsap-motion");
    if (isYandexBrowser) {
      document.documentElement.classList.add("home-yandex-performance");
    }

    const context = gsap.context(() => {
      ScrollTrigger.saveStyles([
        ".home-hero-visual",
        ".home-hero-copy",
        ".home-system-story-inner",
        ".home-system-copy",
        ".home-system-visual",
        ".home-system-axis span",
        ".home-product-sequence-head",
        ".home-product-reel-item",
        ".home-product-reel-item figure",
        ".home-product-reel-item figure img",
        ".home-product-reel-item div",
        ".home-display-copy",
        ".home-display-surface",
        ".home-display-surface img",
        ".home-display-surface figcaption",
        ".home-private-briefing-head",
        ".home-private-briefing-body",
        ".home-private-signature span",
      ]);

      gsap.set(".home-motion-clip", {
        clipPath: "inset(0% 0% 0% 0%)",
      });

      const yandexScrub = isYandexBrowser ? 1.55 : 1;
      const yandexDistance = isYandexBrowser ? 0.74 : 1;

      gsap.fromTo(
        ".home-hero-visual",
        { autoAlpha: 0.94 },
        {
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
        },
      );

      gsap.fromTo(
        ".home-hero-copy",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 1.05, delay: 0.35, ease: "power3.out" },
      );

      gsap.to(".home-hero-visual", {
        yPercent: -1.15,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".home-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.25 * yandexScrub,
        },
      });

      gsap.to(".home-hero-copy", {
        y: -16,
        autoAlpha: 0.42,
        ease: "none",
        scrollTrigger: {
          trigger: ".home-hero",
          start: "72% top",
          end: "bottom top",
          scrub: 1.1 * yandexScrub,
        },
      });

      const desktop = window.matchMedia("(min-width: 901px)").matches;

      if (desktop) {
        const systemTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".home-system-story",
            start: "top 72%",
            end: "center 48%",
            scrub: 0.7 * yandexScrub,
          },
        });

        systemTimeline
          .fromTo(
            ".home-system-visual",
            { scale: 0.96, autoAlpha: 0.72, y: 28 * yandexDistance },
            {
              scale: 1,
              autoAlpha: 1,
              y: 0,
              duration: 0.48,
              ease: "power2.out",
            },
          )
          .fromTo(
            ".home-system-copy",
            { autoAlpha: 0.35, y: 24 * yandexDistance },
            { autoAlpha: 1, y: 0, duration: 0.36, ease: "power2.out" },
            0.08,
          )
          .fromTo(
            ".home-system-axis span",
            { autoAlpha: 0, y: 16 * yandexDistance },
            { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.06, ease: "power2.out" },
            0.48,
          );
      } else {
        gsap.fromTo(
          [".home-system-copy", ".home-system-visual"],
          { autoAlpha: 0, y: 34 * yandexDistance },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.16,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".home-system-story",
              start: "top 72%",
            },
          },
        );
      }

      gsap.fromTo(
        ".home-product-sequence-head",
        { autoAlpha: 0, y: 42 * yandexDistance },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".home-product-sequence",
            start: "top 66%",
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".home-product-reel-item").forEach((item) => {
        const figure = item.querySelector("figure");
        const image = item.querySelector("figure img");
        const copy = item.querySelector("div");

        gsap.fromTo(
          item,
          { autoAlpha: 0.55, y: 44 * yandexDistance },
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top 82%",
              end: "center 54%",
              scrub: 0.65 * yandexScrub,
            },
          },
        );

        if (figure) {
          gsap.fromTo(
            figure,
            { autoAlpha: 0.76, y: 18 * yandexDistance },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top 78%",
                end: "center 45%",
                scrub: 0.75 * yandexScrub,
              },
            },
          );
        }

        if (image) {
          gsap.fromTo(
            image,
            { scale: 1.08 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top 86%",
                end: "bottom 38%",
                scrub: 0.8 * yandexScrub,
              },
            },
          );
        }

        if (copy) {
          gsap.fromTo(
            copy,
            { autoAlpha: 0, y: 26 * yandexDistance },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top 72%",
                end: "center 52%",
                scrub: 0.6 * yandexScrub,
              },
            },
          );
        }
      });

      gsap.utils.toArray<HTMLElement>(".home-display-surfaces").forEach((section) => {
        const copy = section.querySelector(".home-display-copy");
        const surface = section.querySelector(".home-display-surface");
        const image = section.querySelector(".home-display-surface img");

        if (copy) {
          gsap.fromTo(
            copy,
            { autoAlpha: 0, y: 26 * yandexDistance },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top 72%",
                end: "center 52%",
                scrub: 0.6 * yandexScrub,
              },
            },
          );
        }

        if (surface) {
          gsap.fromTo(
            surface,
            { autoAlpha: 0.76, y: 18 * yandexDistance },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top 78%",
                end: "center 45%",
                scrub: 0.75 * yandexScrub,
              },
            },
          );
        }

        if (image) {
          gsap.fromTo(
            image,
            { scale: 1.08 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top 86%",
                end: "bottom 38%",
                scrub: 0.8 * yandexScrub,
              },
            },
          );
        }
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".home-private-briefing",
            start: "top 70%",
            end: "center 52%",
            scrub: 0.7 * yandexScrub,
          },
        })
        .fromTo(".home-private-briefing-head", { autoAlpha: 0, y: 36 * yandexDistance }, { autoAlpha: 1, y: 0, duration: 0.42 })
        .fromTo(".home-private-briefing-body", { autoAlpha: 0, y: 34 * yandexDistance }, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.18)
        .fromTo(".home-private-signature span", { autoAlpha: 0, y: 14 * yandexDistance }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.22 }, 0.5);

      ScrollTrigger.refresh();
    });

    return () => {
      context.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      document.documentElement.classList.remove("home-gsap-motion");
      document.documentElement.classList.remove("home-yandex-performance");
    };
  }, []);

  return null;
}
