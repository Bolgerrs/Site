"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SequenceLabel = {
  title: string;
  text: string;
  at: number;
};

type ScrollFrameSequenceProps = {
  frameCount: number;
  frameBasePath: string;
  frameFit?: "cover" | "contain";
  frameScale?: number;
  poster: string;
  labels: SequenceLabel[];
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function findDrawableFrame(frames: HTMLImageElement[], targetIndex: number, previousIndex: number) {
  const target = frames[targetIndex];

  if (target?.complete && target.naturalWidth) {
    return targetIndex;
  }

  for (let offset = 1; offset <= 8; offset += 1) {
    const nextIndex = targetIndex + offset;
    const previousCandidateIndex = targetIndex - offset;
    const next = frames[nextIndex];
    const previous = frames[previousCandidateIndex];

    if (next?.complete && next.naturalWidth) {
      return nextIndex;
    }

    if (previous?.complete && previous.naturalWidth) {
      return previousCandidateIndex;
    }
  }

  return previousIndex >= 0 ? previousIndex : 0;
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  frameScale: number,
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight) * frameScale;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

export function ScrollFrameSequence({
  frameCount,
  frameBasePath,
  frameFit = "cover",
  frameScale = 1,
  poster,
  labels,
}: ScrollFrameSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(-1);
  const activeLabelRef = useRef(0);
  const animateProgressRef = useRef<() => void>(() => {});
  const rafRef = useRef<number | null>(null);
  const smoothRafRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeLabel, setActiveLabel] = useState(0);

  const orderedLabels = useMemo(
    () => [...labels].sort((first, second) => first.at - second.at),
    [labels],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      const image = framesRef.current[index];

      if (!canvas || !image?.complete || !image.naturalWidth) {
        return;
      }

      resizeCanvas();

      const context = canvas.getContext("2d", { alpha: true });

      if (!context) {
        return;
      }

      if (frameFit === "contain") {
        drawContain(context, image, canvas.width, canvas.height, frameScale);
      } else {
        drawCover(context, image, canvas.width, canvas.height);
      }
      frameIndexRef.current = index;
    },
    [frameFit, frameScale, resizeCanvas],
  );

  const drawProgress = useCallback(
    (progress: number) => {
      const targetFrame = Math.round(progress * (frameCount - 1));
      const nextFrame = findDrawableFrame(framesRef.current, targetFrame, frameIndexRef.current);

      if (nextFrame !== frameIndexRef.current) {
        drawFrame(nextFrame);
      }

      let nextLabel = 0;
      for (let index = 0; index < orderedLabels.length; index += 1) {
        const label = orderedLabels[index];

        if (label && progress >= label.at) {
          nextLabel = index;
        }
      }

      if (nextLabel !== activeLabelRef.current) {
        activeLabelRef.current = nextLabel;
        setActiveLabel(nextLabel);
      }
    },
    [drawFrame, frameCount, orderedLabels],
  );

  const animateProgress = useCallback(() => {
    smoothRafRef.current = null;

    if (reducedMotion) {
      return;
    }

    const targetProgress = targetProgressRef.current;
    const displayProgress = displayProgressRef.current;
    const delta = targetProgress - displayProgress;

    if (Math.abs(delta) <= 0.0015) {
      displayProgressRef.current = targetProgress;
      drawProgress(targetProgress);
      return;
    }

    const maxStep = window.innerWidth <= 900 ? 0.04 : 0.032;
    const easedStep = delta * 0.18;
    const step = Math.sign(delta) * Math.min(Math.abs(easedStep), maxStep);
    const nextProgress = clamp(displayProgress + step);

    displayProgressRef.current = nextProgress;
    drawProgress(nextProgress);
    smoothRafRef.current = window.requestAnimationFrame(() => animateProgressRef.current());
  }, [drawProgress, reducedMotion]);

  useEffect(() => {
    animateProgressRef.current = animateProgress;
  }, [animateProgress]);

  const requestSmoothProgress = useCallback(() => {
    if (smoothRafRef.current !== null || reducedMotion) {
      return;
    }

    smoothRafRef.current = window.requestAnimationFrame(animateProgress);
  }, [animateProgress, reducedMotion]);

  const updateFromScroll = useCallback(() => {
    rafRef.current = null;

    const section = sectionRef.current;

    if (!section || reducedMotion) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const viewportHeight = Math.max(1, window.innerHeight);
    const fullVisibilityStartTop = Math.max(0, viewportHeight - rect.height);
    const fullVisibilityTravel = Math.max(1, fullVisibilityStartTop);
    const isDesktopHold = window.innerWidth > 900 && rect.height > viewportHeight;
    const progress = isDesktopHold
      ? clamp(-rect.top / Math.max(1, rect.height - viewportHeight))
      : rect.height <= viewportHeight
        ? clamp((fullVisibilityStartTop - rect.top) / fullVisibilityTravel)
        : clamp((viewportHeight * 0.56 - rect.top) / (viewportHeight * 0.54));

    targetProgressRef.current = progress;
    requestSmoothProgress();
  }, [reducedMotion, requestSmoothProgress]);

  const requestScrollUpdate = useCallback(() => {
    if (rafRef.current !== null) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(updateFromScroll);
  }, [updateFromScroll]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReducedMotion(mediaQuery.matches);

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);

    return () => mediaQuery.removeEventListener("change", syncReducedMotion);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const frames = Array.from({ length: frameCount }, () => new Image());

    framesRef.current = frames;

    frames.forEach((image, index) => {
      image.decoding = "async";
      image.onload = () => {
        loaded += 1;

        if (!cancelled && loaded >= Math.min(6, frameCount)) {
          canvasRef.current?.closest(".scroll-frame-sequence__stage")?.classList.add("is-ready");
          setIsReady(true);
          drawFrame(frameIndexRef.current >= 0 ? frameIndexRef.current : 0);
        }
      };
      image.src = `${frameBasePath}/frame-${String(index + 1).padStart(3, "0")}.webp`;

      if (image.complete && image.naturalWidth) {
        image.onload?.(new Event("load"));
      }
    });

    return () => {
      cancelled = true;
      framesRef.current = [];
    };
  }, [drawFrame, frameBasePath, frameCount]);

  useEffect(() => {
    resizeCanvas();
    displayProgressRef.current = reducedMotion ? 1 : 0;
    targetProgressRef.current = displayProgressRef.current;
    drawProgress(displayProgressRef.current);

    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    requestScrollUpdate();

    return () => {
      window.removeEventListener("resize", requestScrollUpdate);
      window.removeEventListener("scroll", requestScrollUpdate);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      if (smoothRafRef.current !== null) {
        window.cancelAnimationFrame(smoothRafRef.current);
      }
    };
  }, [drawProgress, reducedMotion, requestScrollUpdate, resizeCanvas]);

  return (
    <section className="scroll-frame-sequence" ref={sectionRef}>
      <div className="scroll-frame-sequence__sticky">
        <div
          className="scroll-frame-sequence__stage"
          data-frame-base-path={frameBasePath}
          data-frame-count={frameCount}
          data-frame-fit={frameFit}
          data-frame-scale={frameScale}
        >
          <img
            alt=""
            aria-hidden="true"
            className="scroll-frame-sequence__poster"
            draggable={false}
            src={poster}
          />
          <canvas
            aria-label="Scroll controlled Montelar product film"
            className={`scroll-frame-sequence__canvas${isReady ? " is-ready" : ""}`}
            ref={canvasRef}
          />
          <div className="scroll-frame-sequence__shade" aria-hidden="true" />
          <div className="scroll-frame-sequence__readout">
            <span>{String(activeLabel + 1).padStart(2, "0")}</span>
            <strong>{orderedLabels[activeLabel]?.title}</strong>
            <p>{orderedLabels[activeLabel]?.text}</p>
          </div>
          <ol className="scroll-frame-sequence__steps" aria-label="Product film sequence">
            {orderedLabels.map((label, index) => (
              <li className={index === activeLabel ? "is-active" : undefined} key={label.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{label.title}</strong>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
