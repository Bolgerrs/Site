"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { PointerEvent } from "react";
import type { SiteLocale } from "@/config/i18n";

type ProductSceneTarget = {
  id: "screen" | "speakers" | "amp-left" | "amp-left-center" | "amp-center" | "amp-right";
  label: string;
  title: string;
  description: string;
  href: string;
};

type ProductScenePrototypeProps = {
  targets: ProductSceneTarget[];
  locale: SiteLocale;
  showCaption?: boolean;
};

type HotspotStyle = CSSProperties & {
  "--scene-x": string;
  "--scene-y": string;
  "--scene-w": string;
  "--scene-h": string;
};

const hotspotGeometry: Record<ProductSceneTarget["id"], HotspotStyle[]> = {
  screen: [
    {
      "--scene-x": "25.8%",
      "--scene-y": "8.8%",
      "--scene-w": "48.4%",
      "--scene-h": "61.2%",
    },
  ],
  speakers: [
    {
      "--scene-x": "11.2%",
      "--scene-y": "34.3%",
      "--scene-w": "7.6%",
      "--scene-h": "50.2%",
    },
    {
      "--scene-x": "80.8%",
      "--scene-y": "34.5%",
      "--scene-w": "7.8%",
      "--scene-h": "50.1%",
    },
  ],
  "amp-left": [
    {
      "--scene-x": "26.3%",
      "--scene-y": "72.7%",
      "--scene-w": "12.7%",
      "--scene-h": "7.8%",
    },
  ],
  "amp-left-center": [
    {
      "--scene-x": "39.0%",
      "--scene-y": "71.8%",
      "--scene-w": "8.0%",
      "--scene-h": "6.0%",
    },
  ],
  "amp-center": [
    {
      "--scene-x": "52.9%",
      "--scene-y": "71.8%",
      "--scene-w": "8.0%",
      "--scene-h": "6.1%",
    },
  ],
  "amp-right": [
    {
      "--scene-x": "60.3%",
      "--scene-y": "72.5%",
      "--scene-w": "13.5%",
      "--scene-h": "8.1%",
    },
  ],
};

const sceneLayers: {
  targetId: ProductSceneTarget["id"];
  layerClass: string;
  src: string;
  style: CSSProperties;
}[] = [
  {
    targetId: "screen",
    layerClass: "screen",
    src: "/images/home/product-scene/screen-logo-ai-slogan-20260613v2.webp",
    style: { left: "25.8111%", top: "8.7988%", width: "48.3348%", height: "61.1324%" },
  },
  {
    targetId: "speakers",
    layerClass: "speaker-left",
    src: "/images/home/product-scene/speaker-left.webp",
    style: { left: "11.4269%", top: "34.4810%", width: "7.0342%", height: "49.5792%" },
  },
  {
    targetId: "speakers",
    layerClass: "speaker-right",
    src: "/images/home/product-scene/speaker-right.webp",
    style: { left: "81.0365%", top: "34.6595%", width: "7.1347%", height: "49.3242%" },
  },
  {
    targetId: "amp-left",
    layerClass: "amp-left",
    src: "/images/home/product-scene/amp-left.webp",
    style: { left: "26.5576%", top: "72.9916%", width: "12.0873%", height: "7.0645%" },
  },
  {
    targetId: "amp-left-center",
    layerClass: "amp-left-center",
    src: "/images/home/product-scene/amp-left-center.webp",
    style: { left: "39.2908%", top: "72.0735%", width: "7.3213%", height: "5.2283%" },
  },
  {
    targetId: "amp-center",
    layerClass: "amp-center",
    src: "/images/home/product-scene/amp-center.webp",
    style: { left: "53.2013%", top: "72.0224%", width: "7.3643%", height: "5.2793%" },
  },
  {
    targetId: "amp-right",
    layerClass: "amp-right",
    src: "/images/home/product-scene/amp-right.webp",
    style: { left: "60.5943%", top: "72.8641%", width: "12.8912%", height: "7.4216%" },
  },
];

function isCoarsePointerEvent(event: PointerEvent<HTMLElement>) {
  return event.pointerType === "touch" || event.pointerType === "pen";
}

export function ProductScenePrototype({ targets, locale, showCaption = true }: ProductScenePrototypeProps) {
  const [activeId, setActiveId] = useState<ProductSceneTarget["id"] | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isCycleNeutral, setIsCycleNeutral] = useState(false);
  const [isBaseImageReady, setIsBaseImageReady] = useState(false);
  const [areObjectLayersReady, setAreObjectLayersReady] = useState(false);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const activeIndex = Math.max(0, targets.findIndex((target) => target.id === activeId));
  const activeTarget = activeId ? (targets[activeIndex] ?? null) : null;

  const rootClassName = useMemo(
    () =>
      `product-scene-prototype${isBaseImageReady ? " is-scene-ready" : ""}${activeTarget ? ` is-active-${activeTarget.id}` : ""}${isCycleNeutral && !activeTarget ? " is-cycle-neutral" : ""}`,
    [activeTarget, isBaseImageReady, isCycleNeutral],
  );

  useEffect(() => {
    if (baseImageRef.current?.complete) {
      setIsBaseImageReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const layerSources = sceneLayers.map((layer) => layer.src);

    Promise.all(
      layerSources.map(
        (src) =>
          new Promise<void>((resolve) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = src;
          }),
      ),
    ).then(() => {
      if (!cancelled) {
        setAreObjectLayersReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    if (prefersReducedMotion || !coarsePointer || isPaused || !isBaseImageReady || !areObjectLayersReady || targets.length <= 1) {
      return;
    }

    const neutralDelay = 640;
    const cycleDelay = 2380;
    let targetIndex = -1;
    let neutralTimeout: number | undefined;

    const revealNextTarget = () => {
      targetIndex = (targetIndex + 1) % targets.length;
      setIsCycleNeutral(false);
      setActiveId(targets[targetIndex]?.id ?? null);
    };

    neutralTimeout = window.setTimeout(revealNextTarget, 420);

    const interval = window.setInterval(() => {
      setIsCycleNeutral(true);
      setActiveId(null);
      neutralTimeout = window.setTimeout(revealNextTarget, neutralDelay);
    }, cycleDelay);

    return () => {
      window.clearInterval(interval);

      if (neutralTimeout) {
        window.clearTimeout(neutralTimeout);
      }
    };
  }, [areObjectLayersReady, isBaseImageReady, isPaused, targets]);

  useEffect(() => {
    if (!isPaused) {
      return;
    }

    const timeout = window.setTimeout(() => setIsPaused(false), 6800);

    return () => window.clearTimeout(timeout);
  }, [isPaused]);

  return (
    <section
      aria-label={showCaption ? undefined : locale === "ru" ? "Интерактивная продуктовая сцена" : "Interactive product scene"}
      aria-labelledby={showCaption ? "product-scene-prototype-title" : undefined}
      className={rootClassName}
    >
      <div
        className="product-scene-prototype__frame"
        onMouseLeave={() => {
          setIsCycleNeutral(false);
          setActiveId(null);
        }}
      >
        <div className="product-scene-prototype__scene">
          <picture>
            <source
              media="(max-width: 900px)"
              sizes="100vw"
              srcSet="/images/home/product-scene/hero-upscaled-logo-ai-slogan-960-20260613v2.webp 960w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-1440-20260613v2.webp 1440w"
            />
            <img
              alt=""
              className="product-scene-prototype__image"
              decoding="async"
              onLoad={() => setIsBaseImageReady(true)}
              ref={baseImageRef}
              draggable={false}
              fetchPriority={showCaption ? "auto" : "high"}
              sizes={showCaption ? "(max-width: 1440px) 100vw, 1440px" : "100vw"}
              src="/images/home/product-scene/hero-upscaled-logo-ai-slogan-20260613v2.webp"
              srcSet="/images/home/product-scene/hero-upscaled-logo-ai-slogan-1920-20260613v2.webp 1920w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-2880-20260613v2.webp 2880w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-3840-20260613v2.webp 3840w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-20260613v2.webp 6966w"
              translate="no"
            />
          </picture>
          <span className="product-scene-prototype__shade" aria-hidden="true" />
          {sceneLayers.map((layer) => (
            <img
              alt=""
              aria-hidden="true"
              className={`product-scene-prototype__object-layer is-${layer.targetId} is-${layer.layerClass}`}
              draggable={false}
              key={layer.layerClass}
              src={layer.src}
              style={layer.style}
              translate="no"
            />
          ))}

          <nav className="product-scene-prototype__hotspots" aria-label={locale === "ru" ? "Выбор продукта на сцене" : "Product selection on the scene"}>
            {targets.flatMap((target) => {
              const isActive = target.id === activeId;

              return hotspotGeometry[target.id].map((geometry, index) => (
                <Link
                  aria-current={isActive ? "true" : undefined}
                  aria-label={target.title}
                  className={`product-scene-prototype__hotspot is-${target.id}${isActive ? " is-active" : ""}`}
                  href={target.href}
                  key={`${target.id}-${index}`}
                  onFocus={() => {
                    setIsCycleNeutral(false);
                    setActiveId(target.id);
                  }}
                  onMouseEnter={() => {
                    setIsCycleNeutral(false);
                    setActiveId(target.id);
                  }}
                  onMouseLeave={() => {
                    setIsCycleNeutral(false);
                    setActiveId(null);
                  }}
                  onBlur={() => {
                    setIsCycleNeutral(false);
                    setActiveId(null);
                  }}
                  onPointerDown={(event) => {
                    setIsCycleNeutral(false);
                    setActiveId(target.id);
                    setIsPaused(isCoarsePointerEvent(event));
                  }}
                  style={geometry}
                >
                  <span>{target.label}</span>
                </Link>
              ));
            })}
          </nav>
        </div>
      </div>
      {showCaption && activeTarget ? (
        <Link className="product-scene-prototype__caption" href={activeTarget.href}>
          <span>{activeTarget.label}</span>
          <strong id="product-scene-prototype-title">{activeTarget.title}</strong>
          <small>{activeTarget.description}</small>
        </Link>
      ) : null}
    </section>
  );
}
