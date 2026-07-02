import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/hologram-device-no-text";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Hologram no-text proof | Montelar",
    description: "Hidden Montelar browser proof for the no-text Hologram device creative pair.",
    path: "/creative-pack-proof/hologram-device-no-text",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function HologramDeviceNoTextProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--hologram">
      <section className="creative-proof-hero" aria-labelledby="hologram-device-proof-title">
        <p className="eyebrow">Hologram Device</p>
        <h1 id="hologram-device-proof-title">Contained light without labels.</h1>
        <p>
          A hidden browser proof for the latest no-text Hologram pair: visible cabinet hardware,
          luminous content anchored inside the device, clean keyable object evidence and no fake
          marks or placeholder lettering.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/hologram", locale)}>Open direction</Link>
          <Link href={withLocale("/request/hologram-vitrine", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Hologram no-text creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The effect stays attached to a physical vitrine.</h2>
          <p>
            The desktop crop gives the device room to breathe while preserving base, glass boundary
            and light volume. Mobile keeps the object contained instead of turning it into a cropped
            abstract glow.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Premium hologram vitrine scene with no visible text or fake logo marks"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="No-text Hologram device keyable object on dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Hologram no-text review evidence">
        <figure>
          <Image
            alt="Contact sheet for the Hologram no-text route and mask proof"
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
            This route validates browser framing for the corrected no-text pair. Native 2K source,
            production matte/despill and owner rollout acceptance are still open gates.
          </p>
        </div>
      </section>
    </main>
  );
}
