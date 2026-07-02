import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ScrollFrameSequence } from "@/components/scroll-frame-sequence";
import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/vision-max-scroll-motion";
const frameBasePath = `${assetBase}/frames`;
const frameCount = 48;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Vision MAX scroll-motion proof | Montelar",
    description: "Hidden Montelar browser proof for the Vision MAX Flow/Veo frame sequence.",
    path: "/creative-pack-proof/vision-max-scroll-motion",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function VisionMaxScrollMotionProofPage() {
  const locale = await getRequestLocale();
  const labels = [
    {
      at: 0,
      title: "Screen housing",
      text: "The updated Flow/Veo retry starts from the projection canvas housing, with speakers, projector and electronics already locked to one room.",
    },
    {
      at: 0.42,
      title: "Canvas unrolls",
      text: "Scroll advances the generated screen-unroll motion and keeps the projector body, speaker bases and equipment shelf readable.",
    },
    {
      at: 0.78,
      title: "Projector wakes",
      text: "The sequence finishes with a quiet projector-light hold. It remains prototype-only because Flow still returned 1280x720 source media.",
    },
  ];

  return (
    <main className="creative-proof-page creative-proof-page--vision-max-scroll-motion">
      <section className="creative-proof-hero" aria-labelledby="vision-max-scroll-proof-title">
        <p className="eyebrow">Vision MAX / Flow-Veo</p>
        <h1 id="vision-max-scroll-proof-title">Scroll-motion proof.</h1>
        <p>
          A hidden browser proof for the latest Vision MAX Flow/Veo screen-unroll retry. The page
          uses the extracted WebP frames as a scroll-controlled product film before any public route
          is allowed to consume the asset.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/creative-pack-proof/vision-max", locale)}>Static route proof</Link>
          <Link href={withLocale("/request/vision-max-premium", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-motion-brief" aria-label="Vision MAX motion contract">
        <div>
          <p className="eyebrow">Motion contract</p>
          <h2>Generated video, not a static collage.</h2>
        </div>
        <p>
          The current retry improves the screen-unroll story, but stays marked as prototype-only:
          Flow still returned 1280x720 source media, below the final 2K rollout gate.
        </p>
      </section>

      <ScrollFrameSequence
        frameBasePath={frameBasePath}
        frameCount={frameCount}
        frameFit="cover"
        labels={labels}
        poster={`${assetBase}/poster.webp`}
      />

      <section className="creative-proof-review creative-proof-review--motion" aria-label="Vision MAX frame extraction evidence">
        <figure>
          <Image
            alt="Vision MAX scroll video frame extraction contact sheet"
            fill
            quality={75}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/frame-contact-sheet.webp`}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Motion source only.</h2>
          <p>
            The route proves browser playback, scroll progression, frame loading and reduced-motion
            fallback. Final rollout still requires a higher-resolution or cleaner generated source,
            matte cleanup and explicit owner/reviewer acceptance.
          </p>
        </div>
      </section>
    </main>
  );
}
