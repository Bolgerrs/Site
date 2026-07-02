import type { Metadata } from "next";
import Image from "next/image";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/living-glass-interactive-partition-full-surface";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Living Glass interactive partition proof | Montelar",
    description: "Hidden Montelar browser proof for the Living Glass interactive partition candidate.",
    path: "/creative-pack-proof/living-glass-interactive-partition-full-surface",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function LivingGlassInteractivePartitionProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--living-glass">
      <section className="creative-proof-hero" aria-labelledby="living-glass-interactive-proof-title">
        <p className="eyebrow">Living Glass / Interactive Partition</p>
        <h1 id="living-glass-interactive-proof-title">Active glass partition proof.</h1>
        <p>
          A hidden browser proof for the current interactive partition pair. The stage checks that
          the vivid media layer reads as part of a full-height transparent surface, not as a normal
          monitor, poster or standalone lightbox.
        </p>
        <div className="creative-proof-actions">
          <a href={withLocale("/invisible-display", locale)}>Open direction</a>
          <a href={withLocale("/request/living-glass-oled", locale)}>Request consultation</a>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Living Glass interactive partition route proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>Glass plane, bright content, room depth.</h2>
          <p>
            The web-context candidate keeps the active botanical image on the transparent partition
            while the interior remains quiet and dimensional. The matching keyable plate is kept as
            a rough control mask only until owner/reviewer approval and native production assets.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Premium interior with a full-height interactive Living Glass partition carrying vivid botanical media"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyable Living Glass partition control plate isolated on a dark verification surface"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Living Glass interactive partition review evidence">
        <figure>
          <Image
            alt="Contact sheet for the Living Glass interactive partition route and mask proof"
            fill
            quality={82}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/contact-sheet.webp`}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Reference-only browser proof.</h2>
          <p>
            This route closes the hidden browser proof gap for the latest interactive partition
            pair. It is still not rollout approval: native Flow output is 1376x768, the matte is a
            local chroma smoke, and final owner/reviewer acceptance remains open.
          </p>
        </div>
      </section>
    </main>
  );
}
