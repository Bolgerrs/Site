import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/exhibition-display";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Exhibition Display totem proof | Montelar",
    description: "Hidden Montelar prototype proof for the Exhibition Display table and single-totem creative pair.",
    path: "/creative-pack-proof/exhibition-display",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function ExhibitionDisplayProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--exhibition-display">
      <section className="creative-proof-hero" aria-labelledby="exhibition-display-proof-title">
        <p className="eyebrow">Exhibition Display</p>
        <h1 id="exhibition-display-proof-title">Totem and table.</h1>
        <p>
          A hidden browser proof for the current Exhibition Display table scene and the owner-positive
          single-totem keyable candidate: freestanding hardware, glass face, base logic and a blank
          physical badge without unsafe generated text.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/exhibition-displays", locale)}>Open direction</Link>
          <Link href={withLocale("/request/exhibition-wall", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Exhibition Display creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The object reads as exhibition hardware, not a poster.</h2>
          <p>
            The browser crop keeps the table, freestanding display, frame depth and floor contact
            visible while reserving a stable copy zone. The keyed object layer uses only a slow
            verification drift, with reduced-motion disabled.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Exhibition Display table and freestanding totem in a warm architectural interior"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Single freestanding Exhibition Display totem on dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Exhibition Display review evidence">
        <figure>
          <Image
            alt="Contact sheet for Exhibition Display route and mask proof"
            fill
            quality={82}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/contact-sheet.webp`}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Prototype proof only.</h2>
          <p>
            The route validates first browser framing and rough isolation. Production use still
            needs native 2K or an explicit exception, cleaner despill/matte work and final
            owner/reviewer rollout acceptance.
          </p>
        </div>
      </section>
    </main>
  );
}
