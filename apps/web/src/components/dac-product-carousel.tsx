"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import type { SiteLocale } from "@/config/i18n";
import { getLocaleCopy } from "@/lib/copy/site-copy";

// the WebGL backdrop (three + drei) is a separate lazy chunk — it never weighs down
// the rest of the site and only loads on this page, client-side
const DacSceneBackdrop = dynamic(
  () => import("@/components/dac-scene-backdrop").then((m) => m.DacSceneBackdrop),
  { ssr: false },
);

// The WebGL atmosphere is pure decoration layered UNDER the CSS warm canvas. It must NEVER
// take the page down: some headless/low-power/policy-restricted environments cannot create a
// WebGL context, and an uncaught three.js throw would otherwise bubble to the route error
// boundary and replace the whole page with a "Reload" fallback. This boundary swallows any
// backdrop failure and renders nothing — the carousel + CSS warm background carry on.
class BackdropBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallowed on purpose — the static warm canvas remains the visible background */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Cheap, synchronous capability probe so we never even attempt to mount the Canvas when the
// browser/environment has no WebGL — avoids the uncaught context-creation error entirely.
function webglSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// measure synchronously before paint so the first visible frame is already laid out
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type DacCarouselItem = {
  id: string;
  image: string;
  title: string;
  role: Record<SiteLocale, string>;
};

type DacProductCarouselProps = {
  locale: SiteLocale;
  // optional — defaults reproduce the original Prism Reference DAC coverflow exactly
  items?: DacCarouselItem[];
  title?: string;
  // "cutout" = transparent device cutouts on the floor (default);
  // "framed" = rectangular framed photo stills floating in the atmosphere
  variant?: "cutout" | "framed";
  // optional fixed aspect (w/h) for framed stills so the item box matches the photo
  // exactly → object-fit:contain fills edge-to-edge with no letterbox bars and no crop
  frameAspect?: number;
};

type Metrics = { itemW: number; itemH: number; spacing: number; dragUnit: number; flat: boolean };

const DEFAULT_DAC_ITEMS: DacCarouselItem[] = [
  {
    id: "dac-010",
    image: "/images/product-motion/dac-carousel/dac-010-trim.webp",
    title: "Prism Reference DAC",
    role: {
      en: "Reference conversion",
      de: "Referenz-Wandlung",
      es: "Conversión de referencia",
      fr: "Conversion de référence",
      zh: "参考级转换",
      ja: "リファレンス変換",
      ru: "Референсное преобразование",
    },
  },
  {
    id: "dac-017",
    image: "/images/product-motion/dac-carousel/dac-017-trim.webp",
    title: "Clocked Conversion Core",
    role: {
      en: "Clock and isolation",
      de: "Taktung und Isolation",
      es: "Reloj y aislamiento",
      fr: "Horloge et isolation",
      zh: "时钟与隔离",
      ja: "クロックとアイソレーション",
      ru: "Тактовая точность и изоляция",
    },
  },
  {
    id: "dac-019",
    image: "/images/product-motion/dac-carousel/dac-019-trim.webp",
    title: "Media Reference DAC",
    role: {
      en: "Screen and meters",
      de: "Anzeige und Meter",
      es: "Pantalla e indicadores",
      fr: "Écran et vumètres",
      zh: "屏幕与表头",
      ja: "スクリーンとメーター",
      ru: "Экран и стрелочные индикаторы",
    },
  },
  {
    id: "dac-011",
    image: "/images/product-motion/dac-carousel/dac-011-trim.webp",
    title: "Lattice Control DAC",
    role: {
      en: "Control layer",
      de: "Kontrollebene",
      es: "Capa de control",
      fr: "Couche de contrôle",
      zh: "控制层",
      ja: "コントロール層",
      ru: "Контрольный слой",
    },
  },
  {
    id: "dac-012",
    image: "/images/product-motion/dac-carousel/dac-012-trim.webp",
    title: "Metered Analog Stage",
    role: {
      en: "Visible signal calm",
      de: "Sichtbare Signalruhe",
      es: "Señal visible y calmada",
      fr: "Signal visible et calme",
      zh: "可见的信号稳定",
      ja: "見える信号の静けさ",
      ru: "Видимое спокойствие сигнала",
    },
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// One synchronized model: every item's transform derives from a single fractional `position`.
// Geometry is never distorted — only uniform scale, depth and blur change. The focused (centre)
// item is flat (rotateY 0) and sharp; receding items angle back and blur. Units share a baseline.
function itemStyle(index: number, position: number, m: Metrics): CSSProperties {
  const rel = clamp(index - position, -3, 3);
  const dist = Math.abs(rel);
  const spread = Math.sign(rel) * Math.abs(rel) ** 0.92;
  const x = spread * m.spacing;
  // no translateZ / CSS perspective: depth comes from scale + dimming (+ blur on desktop)
  // and the WebGL backdrop — so the unit size is fixed from the first frame, never
  // "settles" smaller once the 3D layer kicks in. No rotateY → no warp either.
  const scale = Math.max(0.6, 1 - dist * 0.135);
  const brightness = Math.max(0.5, 1 - dist * 0.16);
  const opacity = dist > 2.4 ? 0 : Math.max(0.14, 1 - dist * 0.32);
  // CSS blur re-rasterises every frame while dragging — skip it on touch/low-power so
  // the scroll stays smooth (depth still reads via scale + dimming)
  const blur = m.flat ? 0 : Math.min(7, dist * 3);

  return {
    width: `${m.itemW}px`,
    height: `${m.itemH}px`,
    transform: `translate(-50%, -100%) translateX(${x.toFixed(2)}px) scale(${scale.toFixed(3)})`,
    filter: blur > 0.01 ? `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(3)})` : `brightness(${brightness.toFixed(3)})`,
    opacity,
    zIndex: 100 - Math.round(dist * 10),
    pointerEvents: dist < 0.6 ? "auto" : "none",
  };
}

export function DacProductCarousel({
  locale,
  items = DEFAULT_DAC_ITEMS,
  title = "Prism Reference DAC",
  variant = "cutout",
  frameAspect,
}: DacProductCarouselProps) {
  const count = items.length;
  const max = count - 1;

  const [isMounted, setIsMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [backdropReady, setBackdropReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const loadedRef = useRef<Set<number>>(new Set());
  // show the product instantly — the units + name reveal as soon as the layout is measured
  // and the (tiny WebP) photos decode, WITHOUT waiting for the heavy WebGL chunk
  const isReady = isMeasured && imagesReady;
  // the atmosphere deepens in a beat later, on its own gentle fade, once its chunk has
  // loaded and committed a frame — never blocks the hero
  const isBgReady = backdropReady;

  const markLoaded = useCallback((index: number) => {
    loadedRef.current.add(index);
    if (loadedRef.current.size >= count) setImagesReady(true);
  }, [count]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const itemEls = useRef<Array<HTMLButtonElement | null>>([]);
  const metricsRef = useRef<Metrics>({ itemW: 480, itemH: 280, spacing: 460, dragUnit: 300, flat: false });

  const positionRef = useRef(0);
  const velocityRef = useRef(0); // position-units per SECOND
  const targetIndexRef = useRef(0);
  const draggingRef = useRef(false);
  const activeIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);

  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const movedRef = useRef(0);
  const suppressClickRef = useRef(false);

  const activeItem = items[activeIndex] ?? items[0]!;

  // imperative paint — no per-frame React render, no CSS transition fighting the loop
  const paint = useCallback((pos: number) => {
    const m = metricsRef.current;
    for (let i = 0; i < itemEls.current.length; i += 1) {
      const el = itemEls.current[i];
      if (!el) continue;
      const s = itemStyle(i, pos, m);
      el.style.width = s.width as string;
      el.style.height = s.height as string;
      el.style.transform = s.transform as string;
      el.style.filter = s.filter as string;
      el.style.opacity = String(s.opacity);
      el.style.zIndex = String(s.zIndex);
      el.style.pointerEvents = s.pointerEvents as string;
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    setWebglOk(webglSupported());
    // images already in cache won't fire onLoad after hydration — count them now
    itemEls.current.forEach((el, index) => {
      const img = el?.querySelector("img");
      if (img && img.complete && img.naturalWidth > 0) markLoaded(index);
    });
  }, [markLoaded]);

  // responsive metrics from the live stage size
  useIsoLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const apply = () => {
      const w = stage.clientWidth || 960;
      const h = stage.clientHeight || 460;
      const itemW = clamp(w * 0.42, 240, 540);
      const itemH = (variant === "framed" && frameAspect)
        ? itemW / frameAspect
        : clamp(h * 0.66, 150, 320);
      // no perspective pull-in any more, so plain spacing clears the neighbour from centre
      const spacing = itemW * 1.0;
      const dragUnit = clamp(spacing * 0.6, 150, 300); // px of drag per one item — light + responsive
      const flat = window.matchMedia("(hover: none), (max-width: 768px)").matches;
      metricsRef.current = { itemW, itemH, spacing, dragUnit, flat };
      paint(positionRef.current);
      setIsMeasured(true);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [paint]);

  // single continuous physics loop: one critically-damped spring carries momentum AND snaps,
  // so there is no hand-off stutter. Settles exactly on a detent without overshoot.
  useEffect(() => {
    // critical damping: c = 2*sqrt(k) → no bounce, fast soft settle (~350ms)
    const K = 150;
    const C = 2 * Math.sqrt(K);

    const frame = (now: number) => {
      const dt = clamp((now - (lastFrameRef.current || now)) / 1000, 0.001, 0.04);
      lastFrameRef.current = now;

      if (!draggingRef.current) {
        let pos = positionRef.current;
        let vel = velocityRef.current;
        const target = targetIndexRef.current;

        const x = pos - target;
        const accel = -K * x - C * vel;
        vel += accel * dt;
        pos += vel * dt;

        if (Math.abs(pos - target) < 0.0008 && Math.abs(vel) < 0.02) {
          pos = target;
          vel = 0;
        }
        positionRef.current = pos;
        velocityRef.current = vel;
      }

      paint(positionRef.current);

      const idx = clamp(Math.round(positionRef.current), 0, max);
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
      }

      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [paint, max]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerIdRef.current = event.pointerId;
    draggingRef.current = true;
    velocityRef.current = 0;
    movedRef.current = 0;
    lastXRef.current = event.clientX;
    lastTimeRef.current = performance.now();
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return;

    const now = performance.now();
    const deltaX = event.clientX - lastXRef.current;
    const dtMs = Math.max(8, now - lastTimeRef.current);
    const pos = positionRef.current;
    let deltaPos = -deltaX / metricsRef.current.dragUnit;
    // rubber-band resistance past the ends
    if ((pos < 0 && deltaPos < 0) || (pos > max && deltaPos > 0)) {
      deltaPos *= 0.32;
    }

    movedRef.current += Math.abs(deltaX);
    positionRef.current = clamp(pos + deltaPos, -0.5, max + 0.5);
    // velocity in position-units per SECOND, lightly smoothed to kill pointer noise
    const instVel = deltaPos / (dtMs / 1000);
    velocityRef.current = velocityRef.current * 0.4 + instVel * 0.6;
    lastXRef.current = event.clientX;
    lastTimeRef.current = now;
  }

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    pointerIdRef.current = null;
    setIsDragging(false);

    if (movedRef.current > 6) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 200);
    }
    // if the finger paused before release, the last velocity is stale → don't fling
    const idle = performance.now() - lastTimeRef.current > 70;
    const vel = idle ? 0 : velocityRef.current;
    velocityRef.current = vel;
    // choose the detent from a momentum projection, capped for controlled travel
    const pos = positionRef.current;
    const projected = pos + vel * 0.13;
    const base = Math.round(pos);
    const target = clamp(clamp(Math.round(projected), base - 2, base + 2), 0, max);
    targetIndexRef.current = target;
  }, [max]);

  function glideTo(index: number) {
    targetIndexRef.current = clamp(index, 0, max);
  }

  function selectItem(index: number) {
    if (suppressClickRef.current) return;
    glideTo(index);
  }

  function step(direction: number) {
    glideTo(targetIndexRef.current + direction);
  }

  return (
    <section
      className={`dac-three-scene${isReady ? " is-ready" : ""}${isBgReady ? " is-bg-ready" : ""}`}
      data-variant={variant}
      aria-labelledby="dac-three-title"
    >
      {isMounted && webglOk ? (
        <BackdropBoundary>
          <DacSceneBackdrop onReady={() => setBackdropReady(true)} />
        </BackdropBoundary>
      ) : null}

      <h2 id="dac-three-title" className="dac-three-srtitle">
        {title}
      </h2>

      <div
        className={`dac-coverflow${isDragging ? " is-dragging" : ""}`}
        ref={stageRef}
        data-dac-three-stage
        data-mounted={isMounted ? "true" : "false"}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
      >
        <div className="dac-coverflow-track">
          {items.map((item, index) => (
            <button
              type="button"
              className={`dac-coverflow-item${index === activeIndex ? " is-active" : ""}`}
              key={item.id}
              ref={(el) => {
                itemEls.current[index] = el;
              }}
              style={itemStyle(index, 0, metricsRef.current)}
              tabIndex={index === activeIndex ? 0 : -1}
              aria-hidden={index === activeIndex ? undefined : true}
              aria-label={item.title}
              onClick={() => selectItem(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.title}
                draggable={false}
                onLoad={() => markLoaded(index)}
                onError={() => markLoaded(index)}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Caption lives in its OWN zone (a sibling of the stage), never overlaying the product.
          On the default "cutout" (homepage) variant CSS keeps it as an absolute title overlay;
          on "framed" (product landing) it sits in its own grid row below the product. */}
      <div className="dac-three-caption" aria-live="polite">
        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
        <strong>{activeItem.title}</strong>
        <p>{getLocaleCopy(locale, activeItem.role)}</p>
      </div>

      <div
        className="dac-three-rail"
        aria-label={getLocaleCopy(locale, {
          en: "DAC options",
          de: "DAC-Optionen",
          es: "Opciones DAC",
          fr: "Options DAC",
          zh: "DAC 选项",
          ja: "DACオプション",
          ru: "Варианты ЦАП",
        })}
      >
        <button
          type="button"
          className="dac-three-arrow"
          onClick={() => step(-1)}
          disabled={activeIndex === 0}
          aria-label="Previous"
        >
          ‹
        </button>
        <div className="dac-three-dots">
          {items.map((item, index) => (
            <button
              type="button"
              className={index === activeIndex ? "is-active" : undefined}
              key={item.id}
              onClick={() => selectItem(index)}
              aria-label={item.title}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="dac-three-arrow"
          onClick={() => step(1)}
          disabled={activeIndex === max}
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </section>
  );
}
