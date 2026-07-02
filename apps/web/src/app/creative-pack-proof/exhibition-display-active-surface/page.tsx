import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/exhibition-display-active-surface";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Exhibition Display active surface proof | Montelar",
    description:
      "Hidden Montelar browser proof for the Embedded/Fedor active-surface Exhibition Display candidate.",
    path: "/creative-pack-proof/exhibition-display-active-surface",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function ExhibitionDisplayActiveSurfaceProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--exhibition-display">
      <section className="creative-proof-hero" aria-labelledby="exhibition-display-active-surface-proof-title">
        <p className="eyebrow">Exhibition Display</p>
        <h1 id="exhibition-display-active-surface-proof-title">Active fins and table.</h1>
        <p>
          A hidden browser proof for the strongest current Embedded/Fedor active-surface candidate:
          table plus freestanding fins, no inner screen rectangles, no readable labels and no
          production rollout claim.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/exhibition-displays", locale)}>Open direction</Link>
          <Link href={withLocale("/request/exhibition-wall", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Exhibition Display active-surface proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The scene reads as a use case, not a framed panel set.</h2>
          <p>
            The crop keeps the table, museum floor contact and three active glass fins in one
            application scene. The secondary frame shows the quieter candidate only as a comparison
            guardrail, while the primary stage remains the richer product story.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Exhibition Display table and active glass fins in a warm museum interior"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Quieter Exhibition Display active-surface comparison candidate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/alternate-candidate.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Exhibition Display active-surface review evidence">
        <figure>
          <Image
            alt="Current-only contact sheet for Exhibition Display active-surface candidates"
            fill
            quality={82}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/contact-sheet.webp`}
            style={{ objectFit: "contain" }}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Reference-only, still gated.</h2>
          <p>
            This route proves browser framing for the latest current-only package. The asset remains
            native 1376x768 with visible edge/base hardware, so final rollout still requires
            owner/reviewer acceptance plus native 2K or an explicit exception.
          </p>
        </div>
      </section>
    </main>
  );
}
