import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/exhibition-display-edgeless-media-plane";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Exhibition Display edgeless media-plane proof | Montelar",
    description:
      "Hidden Montelar browser proof for the Embedded/Fedor edgeless media-plane Exhibition Display candidate.",
    path: "/creative-pack-proof/exhibition-display-edgeless-media-plane",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function ExhibitionDisplayEdgelessMediaPlaneProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--exhibition-display">
      <section className="creative-proof-hero" aria-labelledby="exhibition-display-edgeless-proof-title">
        <p className="eyebrow">Exhibition Display</p>
        <h1 id="exhibition-display-edgeless-proof-title">Edgeless media plane.</h1>
        <p>
          A hidden browser proof for the latest Embedded/Fedor correction: the active surface reads
          as a quiet architectural media plane rather than a framed appliance, while remaining
          reference-only and outside the production homepage.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/exhibition-displays", locale)}>Open direction</Link>
          <Link href={withLocale("/request/exhibition-wall", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Exhibition Display edgeless media-plane proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The product becomes a calm active surface.</h2>
          <p>
            The primary crop keeps the exhibition room sparse and lets the active fins behave as
            embedded media planes. The alternate candidate stays visible as a comparison guardrail
            because it is warmer, but weaker as a complete product story.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Embedded exhibition media planes in a restrained dark gallery room"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Alternate Embedded/Fedor edgeless media-plane reference candidate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/alternate-candidate.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Exhibition Display edgeless media-plane review evidence">
        <figure>
          <Image
            alt="Current-only contact sheet for Exhibition Display edgeless media-plane candidates"
            fill
            quality={82}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/contact-sheet.webp`}
            style={{ objectFit: "contain" }}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Better frame discipline, still gated.</h2>
          <p>
            This route proves browser framing for the clean retry package. The asset remains native
            1376x768 and the product story is intentionally quiet, so final use still needs
            owner/reviewer acceptance plus native 2K or an explicit exception.
          </p>
        </div>
      </section>
    </main>
  );
}
