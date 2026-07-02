"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type MotionCatalogDirection = {
  id: string;
  indexLabel: string;
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
  material: string;
  marker: string;
};

type MotionCatalogPrototypeProps = {
  eyebrow: string;
  title: string;
  intro: string;
  directions: MotionCatalogDirection[];
  ariaLabel: string;
};

function clampIndex(value: number, length: number) {
  return Math.max(0, Math.min(length - 1, value));
}

export function MotionCatalogPrototype({
  ariaLabel,
  directions,
  eyebrow,
  intro,
  title,
}: MotionCatalogPrototypeProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const activeDirection = directions[clampIndex(activeIndex, directions.length)] as MotionCatalogDirection;

  const rootStyle = useMemo(
    () => ({ "--motion-catalog-progress": `${directions.length > 1 ? activeIndex / (directions.length - 1) : 0}` }) as CSSProperties,
    [activeIndex, directions.length],
  );

  useEffect(() => {
    const root = rootRef.current;

    if (!root || directions.length <= 1) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 901px)").matches;

    if (prefersReducedMotion || !desktop) {
      return;
    }

    const isYandexBrowser = /\bYaBrowser\//.test(navigator.userAgent);
    const pin = root.querySelector<HTMLElement>(".motion-catalog__pin");
    const stage = root.querySelector<HTMLElement>(".motion-catalog__stage");
    const copy = root.querySelector<HTMLElement>(".motion-catalog__copy");

    if (!pin || !stage || !copy) {
      return;
    }

    const context = gsap.context(() => {
      ScrollTrigger.saveStyles([stage, copy]);

      gsap.fromTo(stage, { autoAlpha: 0.86, scale: 0.982 }, { autoAlpha: 1, scale: 1, duration: 0.72, ease: "power3.out" });
      gsap.fromTo(copy, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.58, delay: 0.12, ease: "power3.out" });

      ScrollTrigger.create({
        trigger: root,
        pin,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 1.72)}`,
        scrub: isYandexBrowser ? 1.45 : 0.85,
        onUpdate: (self) => {
          setActiveIndex(clampIndex(Math.round(self.progress * (directions.length - 1)), directions.length));
        },
      });
    }, root);

    return () => {
      context.revert();
    };
  }, [directions.length]);

  return (
    <section
      ref={rootRef}
      aria-label={ariaLabel}
      className={`motion-catalog motion-catalog--active-${activeDirection.id}`}
      style={rootStyle}
    >
      <div className="motion-catalog__pin">
        <div className="motion-catalog__intro">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>

        <div className="motion-catalog__stage-grid">
          <nav className="motion-catalog__rail" aria-label={ariaLabel}>
            {directions.map((direction, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  aria-current={isActive ? "true" : undefined}
                  className="motion-catalog__rail-button"
                  data-motion-catalog-direction={direction.id}
                  key={direction.id}
                  onBlur={() => undefined}
                  onFocus={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  type="button"
                >
                  <span>{direction.indexLabel}</span>
                  <strong>{direction.label}</strong>
                </button>
              );
            })}
          </nav>

          <div className="motion-catalog__stage" aria-live="polite">
            <div className="motion-catalog__scene">
              <img
                alt=""
                className="motion-catalog__base-image"
                decoding="async"
                draggable={false}
                src="/images/home/product-scene/hero-upscaled-1920.webp"
              />
              <span className="motion-catalog__room-shade" aria-hidden="true" />
              {directions.map((direction, index) => (
                <figure
                  aria-hidden={index === activeIndex ? undefined : "true"}
                  className={`motion-catalog__family motion-catalog__family--${direction.id}${index === activeIndex ? " is-active" : ""}`}
                  key={direction.id}
                >
                  <img alt="" decoding="async" draggable={false} src={direction.image} />
                </figure>
              ))}
              <div className="motion-catalog__marker" aria-hidden="true">
                <span>{activeDirection.marker}</span>
              </div>
            </div>
          </div>

          <div className="motion-catalog__copy" key={activeDirection.id}>
            <p>{activeDirection.material}</p>
            <h2>{activeDirection.title}</h2>
            <span>{activeDirection.description}</span>
            <Link className="motion-catalog__link" data-motion-catalog-active-link={activeDirection.id} href={activeDirection.href}>
              {activeDirection.cta}
            </Link>
          </div>
        </div>

        <div className="motion-catalog__mobile-reel" aria-label={ariaLabel}>
          {directions.map((direction) => (
            <article className="motion-catalog__mobile-panel" key={direction.id}>
              <figure>
                <img alt="" decoding="async" draggable={false} src={direction.image} />
              </figure>
              <div>
                <p>{direction.indexLabel} / {direction.label}</p>
                <h2>{direction.title}</h2>
                <span>{direction.description}</span>
                <Link className="motion-catalog__link" data-motion-catalog-mobile-link={direction.id} href={direction.href}>
                  {direction.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
