import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/pictorial-art-display";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Pictorial Art Display proof | Montelar",
    description: "Hidden Montelar prototype proof for the Pictorial Art Display creative pair.",
    path: "/creative-pack-proof/pictorial-art-display",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function PictorialArtDisplayProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--pictorial-art-display">
      <section className="creative-proof-hero" aria-labelledby="pictorial-art-display-proof-title">
        <p className="eyebrow">Pictorial Art Display</p>
        <h1 id="pictorial-art-display-proof-title">Painting, not wallpaper.</h1>
        <p>
          A hidden browser proof for the current Pictorial Art Display web-context and latest
          painterly keyable candidate: a physical framed digital art object where the image surface
          reads as artwork rather than a generic screen poster.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/pictorial-art-display", locale)}>Open direction</Link>
          <Link href={withLocale("/request/pictorial-canvas", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Pictorial Art Display creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The frame stays physical; the image reads as painting.</h2>
          <p>
            The browser crop keeps the framed object, wall depth and painterly surface readable
            while reserving a stable copy zone. The new keyable layer keeps the full black frame,
            safe margin and brush-textured landscape content for route proof only.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Pictorial Art Display framed digital canvas with painterly artwork in a warm interior"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyable Pictorial Art Display object on dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Pictorial Art Display review evidence">
        <figure>
          <Image
            alt="Contact sheet for Pictorial Art Display route and mask proof"
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
            The route validates browser framing and rough isolation for the latest painterly
            keyable plate. Production use still needs native 2K or an explicit exception,
            production matte/despill and final owner/reviewer acceptance.
          </p>
        </div>
      </section>
    </main>
  );
}
