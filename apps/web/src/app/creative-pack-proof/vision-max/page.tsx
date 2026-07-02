import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/vision-max";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Vision MAX proof | Montelar",
    description: "Hidden Montelar prototype proof for the Vision MAX creative pair.",
    path: "/creative-pack-proof/vision-max",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function VisionMaxProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--vision-max">
      <section className="creative-proof-hero" aria-labelledby="vision-max-proof-title">
        <p className="eyebrow">Vision MAX</p>
        <h1 id="vision-max-proof-title">Private cinema, assembled.</h1>
        <p>
          A hidden browser proof for the current Vision MAX Chinese UST web-context and matched
          keyable source lane: projector, screen/canvas, loudspeakers and electronics prepared for
          the later scroll-film prototype.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/vision-max", locale)}>Open direction</Link>
          <Link href={withLocale("/request/vision-max-premium", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Vision MAX creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The room reads as a system, not a TV wall.</h2>
          <p>
            The browser crop keeps the UST projector lane, screen plane and cinema room geometry
            readable. The keyable source assembly is proof-only and waits for the later
            Flow/Veo scroll-motion pass.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Vision MAX private cinema with projection screen, ultra short throw projector and architectural room geometry"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyable Vision MAX UST projector source assembly on dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Vision MAX review evidence">
        <figure>
          <Image
            alt="Contact sheet for Vision MAX route and keyable source proof"
            fill
            quality={75}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/contact-sheet.webp`}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Prototype proof only.</h2>
          <p>
            The proof validates hidden-route framing and the UST keyable branch. Production still
            needs the Flow/Veo video, frame extraction, matte cleanup and final owner/reviewer
            rollout acceptance.
          </p>
        </div>
      </section>
    </main>
  );
}
