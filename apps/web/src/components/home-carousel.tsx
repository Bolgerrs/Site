"use client";

import { useEffect, useRef, useState } from "react";

type Slide = { src: string; name: string; category: string; desc: string; href: string };
type Props = { eyebrow: string; title: string; ctaLabel: string; slides: Slide[] };

const INTERVAL = 5600;

export function HomeCarousel({ eyebrow, title, ctaLabel, slides }: Props) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const n = slides.length;
  const startX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // previous index — incoming slide fades in over the still-painted previous (no dip)
  const prevRef = useRef(0);
  const prev = prevRef.current;
  useEffect(() => { prevRef.current = i; }, [i]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setRevealed(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setRevealed(true); io.disconnect(); }
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), INTERVAL);
    return () => clearInterval(t);
  }, [paused, n, i]);

  const go = (d: number) => setI((p) => (p + d + n) % n);
  const onDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onUp = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 44) go(dx < 0 ? 1 : -1);
  };

  const cur = slides[i];

  return (
    <section ref={sectionRef} className={`hc-section${revealed ? " is-in" : ""}`} aria-label={title}>
      <div className="hc-head">
        <span className="hc-eyebrow">{eyebrow}</span>
        <h2 className="hc-title">{title}</h2>
      </div>

      <div className="hc">
        <div
          className="hc-visual"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={() => { startX.current = null; }}
        >
          <div className="hc-stage">
            {slides.map((s, idx) => (
              <div
                className={`hc-slide${idx === i ? " is-active" : ""}${idx === prev && idx !== i ? " is-prev" : ""}`}
                key={s.src}
                aria-hidden={idx !== i}
              >
                <img src={s.src} alt={s.name} draggable={false} />
              </div>
            ))}
          </div>
          <div className="hc-scrim" />
        </div>

        <aside className="hc-panel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="hc-panel-top" key={i}>
            <span className="hc-index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
              <i>/{String(n).padStart(2, "0")}</i>
            </span>
            <span className="hc-cat">{cur?.category}</span>
            <h3 className="hc-name">{cur?.name}</h3>
            <p className="hc-desc">{cur?.desc}</p>
            <a className="hc-link" href={cur?.href}>
              <span>{ctaLabel}</span>
              <i className="hc-link-line" />
            </a>
          </div>

          <div className="hc-controls">
            <div className="hc-bars">
              {slides.map((s, idx) => (
                <button
                  key={s.src}
                  type="button"
                  className={`hc-bar${idx === i ? " is-active" : ""}`}
                  onClick={() => setI(idx)}
                  aria-label={s.name}
                  aria-current={idx === i}
                >
                  <i style={idx === i ? { animationPlayState: paused ? "paused" : "running" } : undefined} />
                </button>
              ))}
            </div>
            <div className="hc-nav">
              <button type="button" className="hc-arrow" onClick={() => go(-1)} aria-label="Previous">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
              </button>
              <button type="button" className="hc-arrow" onClick={() => go(1)} aria-label="Next">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
