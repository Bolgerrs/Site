import Link from "next/link";
import type { CSSProperties } from "react";
import { MotionReadyFrameSequence } from "@/components/motion-ready-frame-sequence";

export type ProductMotionStage = {
  id: string;
  mode: "poster" | "frame-sequence" | "video" | "three";
  productFamily: string;
  posterSrc: string;
  frameBasePath?: string;
  frameCount?: number;
  videoSrc?: string;
  objectFit: "contain" | "cover";
  desktopFocalPoint: { x: number; y: number };
  mobileFocalPoint: { x: number; y: number };
  copySafeZone: "left" | "right" | "top" | "bottom" | "none";
  reducedMotionSrc: string;
};

export type MotionReadyProductStageProps = {
  stage: ProductMotionStage;
  eyebrow: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  steps: readonly string[];
};

export function MotionReadyProductStage({
  stage,
  eyebrow,
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  steps,
}: MotionReadyProductStageProps) {
  return (
    <section
      className={`motion-ready-stage motion-ready-stage--${stage.productFamily} motion-ready-stage--safe-${stage.copySafeZone}`}
      data-motion-stage-id={stage.id}
      data-motion-stage-mode={stage.mode}
      style={
        {
          "--motion-stage-desktop-x": `${stage.desktopFocalPoint.x}%`,
          "--motion-stage-desktop-y": `${stage.desktopFocalPoint.y}%`,
          "--motion-stage-mobile-x": `${stage.mobileFocalPoint.x}%`,
          "--motion-stage-mobile-y": `${stage.mobileFocalPoint.y}%`,
        } as CSSProperties
      }
    >
      <div className="motion-ready-stage__sticky">
        <figure className="motion-ready-stage__media">
          {stage.mode === "frame-sequence" && stage.frameBasePath && stage.frameCount ? (
            <MotionReadyFrameSequence
              fit={stage.objectFit}
              frameBasePath={stage.frameBasePath}
              frameCount={stage.frameCount}
              posterSrc={stage.posterSrc}
              reducedMotionSrc={stage.reducedMotionSrc}
            />
          ) : (
            <img
              alt=""
              aria-hidden="true"
              className="motion-ready-stage__image"
              decoding="async"
              draggable={false}
              loading="lazy"
              src={stage.posterSrc}
              style={{ objectFit: stage.objectFit }}
            />
          )}
          <span className="motion-ready-stage__glass" aria-hidden="true" />
        </figure>

        <div className="motion-ready-stage__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{body}</p>
          <ol className="motion-ready-stage__steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="motion-ready-stage__actions">
            <Link className="motion-ready-stage__primary" href={primaryHref}>
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link className="motion-ready-stage__secondary" href={secondaryHref}>
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
