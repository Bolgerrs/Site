"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MotionReadyFrameSequenceProps = {
  frameBasePath: string;
  frameCount: number;
  fit: "contain" | "cover";
  posterSrc: string;
  reducedMotionSrc: string;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function findLoadedFrame(frames: HTMLImageElement[], targetIndex: number, previousIndex: number) {
  const direct = frames[targetIndex];

  if (direct?.complete && direct.naturalWidth) {
    return targetIndex;
  }

  for (let offset = 1; offset <= 6; offset += 1) {
    const next = frames[targetIndex + offset];
    const previous = frames[targetIndex - offset];

    if (next?.complete && next.naturalWidth) {
      return targetIndex + offset;
    }

    if (previous?.complete && previous.naturalWidth) {
      return targetIndex - offset;
    }
  }

  return previousIndex >= 0 ? previousIndex : 0;
}

function drawFrameImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  fit: "contain" | "cover",
) {
  const scale =
    fit === "contain"
      ? Math.min(width / image.naturalWidth, height / image.naturalHeight) * 1.04
      : Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

export function MotionReadyFrameSequence({
  frameBasePath,
  frameCount,
  fit,
  posterSrc,
  reducedMotionSrc,
}: MotionReadyFrameSequenceProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const smoothRafRef = useRef<number | null>(null);
  const animateProgressRef = useRef<() => void>(() => {});
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

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
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      const image = framesRef.current[frameIndex];

      if (!canvas || !image?.complete || !image.naturalWidth) {
        return;
      }

      resizeCanvas();
      const context = canvas.getContext("2d", { alpha: true });

      if (!context) {
        return;
      }

      drawFrameImage(context, image, canvas.width, canvas.height, fit);
      currentFrameRef.current = frameIndex;

      if (rootRef.current) {
        rootRef.current.dataset.currentFrame = String(frameIndex + 1);
      }
    },
    [fit, resizeCanvas],
  );

  const drawProgress = useCallback(
    (progress: number) => {
      const targetFrame = Math.round(clamp(progress) * (frameCount - 1));
      const drawableFrame = findLoadedFrame(framesRef.current, targetFrame, currentFrameRef.current);

      if (drawableFrame !== currentFrameRef.current) {
        drawFrame(drawableFrame);
      }
    },
    [drawFrame, frameCount],
  );

  const animateProgress = useCallback(() => {
    smoothRafRef.current = null;

    if (reducedMotion) {
      return;
    }

    const delta = targetProgressRef.current - displayProgressRef.current;

    if (Math.abs(delta) <= 0.002) {
      displayProgressRef.current = targetProgressRef.current;
      drawProgress(targetProgressRef.current);
      return;
    }

    const maxStep = window.innerWidth <= 900 ? 0.048 : 0.034;
    const step = Math.sign(delta) * Math.min(Math.abs(delta * 0.2), maxStep);

    displayProgressRef.current = clamp(displayProgressRef.current + step);
    drawProgress(displayProgressRef.current);
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

    if (reducedMotion) {
      return;
    }

    const host = rootRef.current?.closest(".motion-ready-stage");

    if (!host) {
      return;
    }

    const rect = host.getBoundingClientRect();
    const viewportHeight = Math.max(1, window.innerHeight);
    const start = viewportHeight * (window.innerWidth <= 900 ? 0.68 : 0.62);
    const travel = Math.max(1, rect.height - viewportHeight * 0.46);
    const progress = clamp((start - rect.top) / travel);

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
    if (reducedMotion) {
      return undefined;
    }

    let cancelled = false;
    let loaded = 0;
    const root = rootRef.current;
    const frames = Array.from({ length: frameCount }, () => new window.Image());

    framesRef.current = frames;
    root?.classList.remove("is-ready");

    frames.forEach((image, index) => {
      image.decoding = "async";
      image.onload = () => {
        loaded += 1;

        if (!cancelled && loaded >= Math.min(8, frameCount)) {
          root?.classList.add("is-ready");
          drawFrame(currentFrameRef.current >= 0 ? currentFrameRef.current : 0);
          requestScrollUpdate();
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
      currentFrameRef.current = -1;
      root?.classList.remove("is-ready");
    };
  }, [drawFrame, frameBasePath, frameCount, reducedMotion, requestScrollUpdate]);

  useEffect(() => {
    resizeCanvas();
    drawProgress(reducedMotion ? 1 : displayProgressRef.current);
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
    <div
      className="motion-ready-stage__sequence"
      data-current-frame="0"
      data-frame-base-path={frameBasePath}
      data-frame-count={frameCount}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      ref={rootRef}
    >
      <img
        alt=""
        aria-hidden="true"
        className="motion-ready-stage__sequence-poster"
        decoding="async"
        draggable={false}
        loading="lazy"
        src={reducedMotion ? reducedMotionSrc : posterSrc}
      />
      <canvas
        aria-label="Scroll controlled Montelar product film"
        className="motion-ready-stage__sequence-canvas"
        ref={canvasRef}
      />
    </div>
  );
}
