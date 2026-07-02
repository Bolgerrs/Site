import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/hi-end-audio";
const proofAsset = {
  contactSheet: `${assetBase}/contact-sheet-clean-faceplates-20260524.webp`,
  keyableObject: `${assetBase}/keyable-object-on-dark-clean-faceplates-20260524.webp`,
  webContext: `${assetBase}/web-context-clean-faceplates-20260524.webp`,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Hi-end Audio proof | Montelar",
    description: "Hidden Montelar prototype proof for the Hi-end Audio creative pair.",
    path: "/creative-pack-proof/hi-end-audio",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function HiEndAudioProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--hi-end-audio">
      <section className="creative-proof-hero" aria-labelledby="hi-end-audio-proof-title">
        <p className="eyebrow">Hi-end Audio</p>
        <h1 id="hi-end-audio-proof-title">A composed listening system.</h1>
        <p>
          A hidden browser proof for the latest clean-faceplates Hi-end Audio pair: floorstanding
          loudspeakers, electronics, restrained cable logic and warm architectural space for a
          product-film category stage.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/audio", locale)}>Open direction</Link>
          <Link href={withLocale("/request/hi-end-audio", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Hi-end Audio creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The system reads as product architecture, not a furniture scene.</h2>
          <p>
            The browser crop keeps the speakers, complete bases, electronics and rear cable route
            visible while leaving controlled negative space for category copy. The keyable layer
            uses a slow verification drift only, with reduced-motion disabled.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Hi-end Audio listening system with floorstanding loudspeakers and electronics in warm architectural light"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={proofAsset.webContext}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyable Hi-end Audio loudspeaker and electronics system on dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={proofAsset.keyableObject}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Hi-end Audio review evidence">
        <figure>
          <Image
            alt="Contact sheet for Hi-end Audio route and mask proof"
            fill
            quality={82}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={proofAsset.contactSheet}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Prototype proof only.</h2>
          <p>
            The route validates browser framing for Telegram packages 5112-5119 and 5120-5127.
            Production use still needs native 2K or an explicit exception, cleaner object-plate
            edges, cable cleanup and final owner/reviewer acceptance.
          </p>
        </div>
      </section>
    </main>
  );
}
