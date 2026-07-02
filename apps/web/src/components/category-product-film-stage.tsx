"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type CategoryFilmProduct = {
  id: string;
  name: string;
  href: string;
  note: string;
};

type CategoryFilmLayer = {
  id: string;
  src: string;
  alt: string;
  productId?: string;
  className: string;
};

export type CategoryFilmScene = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  metric: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  products: CategoryFilmProduct[];
  layers: CategoryFilmLayer[];
};

type CategoryProductFilmStageProps = {
  scenes: CategoryFilmScene[];
  ariaLabel: string;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function CategoryProductFilmStage({ scenes, ariaLabel }: CategoryProductFilmStageProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeSceneId, setActiveSceneId] = useState(scenes[0]?.id ?? "");
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const activeSceneIndex = useMemo(
    () => Math.max(0, scenes.findIndex((scene) => scene.id === activeSceneId)),
    [activeSceneId, scenes],
  );

  const activeScene = scenes[activeSceneIndex] ?? scenes[0];
  const focusedProductBelongsToScene = Boolean(
    focusedProductId && activeScene?.products.some((product) => product.id === focusedProductId),
  );
  const activeProductId = focusedProductBelongsToScene ? focusedProductId : activeScene?.products[0]?.id ?? null;

  const updateFromScroll = useCallback(() => {
    rafRef.current = null;

    const section = sectionRef.current;

    if (!section || reducedMotion) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const viewportHeight = Math.max(1, window.innerHeight);
    const travel = Math.max(1, rect.height - viewportHeight);
    const nextProgress = window.innerWidth > 900
      ? clamp(-rect.top / travel)
      : clamp((viewportHeight * 0.56 - rect.top) / Math.max(1, rect.height * 0.64));
    const nextIndex = Math.min(scenes.length - 1, Math.floor(nextProgress * scenes.length));

    setProgress(nextProgress);
    setActiveSceneId((current) => (current === scenes[nextIndex]?.id ? current : scenes[nextIndex]?.id ?? current));
  }, [reducedMotion, scenes]);

  const requestScrollUpdate = useCallback(() => {
    if (rafRef.current !== null) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(updateFromScroll);
  }, [updateFromScroll]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      const shouldReduce = mediaQuery.matches;
      setReducedMotion(shouldReduce);

      if (shouldReduce) {
        setProgress(0);
        setActiveSceneId(scenes[0]?.id ?? "");
      }
    };

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);

    return () => mediaQuery.removeEventListener("change", syncReducedMotion);
  }, [scenes]);

  useEffect(() => {
    requestScrollUpdate();
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", requestScrollUpdate);
      window.removeEventListener("scroll", requestScrollUpdate);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [requestScrollUpdate]);

  return (
    <section
      aria-label={ariaLabel}
      className="category-film-stage"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      ref={sectionRef}
      style={{ "--category-film-progress": progress } as CSSProperties}
    >
      <div className="category-film-stage__sticky">
        <div className="category-film-stage__rail" aria-label={ariaLabel}>
          {scenes.map((scene, index) => (
            <button
              aria-current={scene.id === activeSceneId ? "true" : undefined}
              className="category-film-stage__rail-button"
              key={scene.id}
              onClick={() => {
                setActiveSceneId(scene.id);
                setFocusedProductId(null);
                setProgress(scenes.length <= 1 ? 0 : index / (scenes.length - 1));
              }}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{scene.eyebrow}</strong>
            </button>
          ))}
        </div>

        <div className="category-film-stage__visual" aria-live="polite">
          {scenes.map((scene, sceneIndex) => (
            <div
              className={`category-film-stage__scene is-${scene.id}${scene.id === activeSceneId ? " is-active" : ""}`}
              data-scene-index={sceneIndex}
              key={scene.id}
            >
              <div className="category-film-stage__material-grid" aria-hidden="true" />
              {scene.layers.map((layer) => (
                <figure
                  className={`category-film-stage__layer ${layer.className}${layer.productId && layer.productId === activeProductId ? " is-product-active" : ""}`}
                  key={layer.id}
                >
                  <img
                    alt={layer.alt}
                    decoding="async"
                    draggable={false}
                    loading="lazy"
                    src={layer.src}
                  />
                </figure>
              ))}
              <div className="category-film-stage__scene-line" aria-hidden="true" />
            </div>
          ))}
        </div>

        {activeScene ? (
          <div className="category-film-stage__copy">
            <p className="eyebrow">{activeScene.eyebrow}</p>
            <h1>{activeScene.title}</h1>
            <p>{activeScene.summary}</p>
            <div className="category-film-stage__metric">
              <span>{String(activeSceneIndex + 1).padStart(2, "0")}</span>
              <strong>{activeScene.metric}</strong>
            </div>
            <div className="category-film-stage__actions">
              <Link className="category-film-stage__primary" href={activeScene.primaryHref}>
                {activeScene.primaryLabel}
              </Link>
              <Link className="category-film-stage__secondary" href={activeScene.secondaryHref}>
                {activeScene.secondaryLabel}
              </Link>
            </div>
            <div className="category-film-stage__products" aria-label={activeScene.eyebrow}>
              {activeScene.products.map((product) => (
                <Link
                  className={product.id === activeProductId ? "is-active" : undefined}
                  href={product.href}
                  key={product.id}
                  onBlur={() => setFocusedProductId(null)}
                  onFocus={() => setFocusedProductId(product.id)}
                  onMouseEnter={() => setFocusedProductId(product.id)}
                  onMouseLeave={() => setFocusedProductId(null)}
                >
                  <span>{product.name}</span>
                  <small>{product.note}</small>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
