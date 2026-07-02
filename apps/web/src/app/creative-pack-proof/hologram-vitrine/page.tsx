import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/hologram-vitrine";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Hologram Vitrine proof | Montelar",
    description: "Hidden Montelar prototype proof for the Hologram Vitrine creative pair.",
    path: "/creative-pack-proof/hologram-vitrine",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function HologramVitrineProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--hologram">
      <section className="creative-proof-hero" aria-labelledby="hologram-proof-title">
        <p className="eyebrow">Hologram Vitrine</p>
        <h1 id="hologram-proof-title">Physical light, contained.</h1>
        <p>
          A hidden browser proof for the Hologram Vitrine web-context and keyable candidate:
          glass boundary, cabinet base, controlled content volume and safe crop space for the
          category product-film stage.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/hologram", locale)}>Open direction</Link>
          <Link href={withLocale("/request/hologram-vitrine", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Hologram Vitrine creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The emitter remains a product, not free-air magic.</h2>
          <p>
            The browser crop keeps the vitrine body, base and content layer readable across desktop
            and mobile. Motion is limited to a slow verification drift and is disabled when reduced
            motion is requested.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Premium hologram vitrine with a glass cabinet boundary and warm contained content"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyable Hologram Vitrine object on dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Hologram Vitrine review evidence">
        <figure>
          <Image
            alt="Contact sheet for Hologram Vitrine route and mask proof"
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
            The proof validates first browser framing and rough isolation. Production compositing
            still needs a cleaner matte for the green-tinted glass and content layer.
          </p>
        </div>
      </section>
    </main>
  );
}
