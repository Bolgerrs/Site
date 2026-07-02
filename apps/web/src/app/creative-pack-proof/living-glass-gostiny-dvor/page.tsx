import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/living-glass-gostiny-dvor";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Living Glass Gostiny Dvor proof | Montelar",
    description: "Hidden Montelar prototype proof for the Living Glass Gostiny Dvor creative pair.",
    path: "/creative-pack-proof/living-glass-gostiny-dvor",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function LivingGlassGostinyDvorProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--living-glass">
      <section className="creative-proof-hero" aria-labelledby="living-glass-proof-title">
        <p className="eyebrow">Living Glass</p>
        <h1 id="living-glass-proof-title">Gostiny Dvor display study.</h1>
        <p>
          A hidden browser proof for the paired web-context and keyable Living Glass candidate:
          arched transparent display surfaces, colorful Russian folk content and controlled
          Montelar crop space.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/invisible-display", locale)}>Open direction</Link>
          <Link href={withLocale("/request/living-glass-oled", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Living Glass creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>Screen content stays visible without turning into a flat mural.</h2>
          <p>
            The browser crop keeps product edges, support logic and negative space visible across
            desktop and mobile. Motion is intentionally restrained and disabled under reduced
            motion.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Gostiny Dvor arcade with Living Glass screens showing colorful Russian folk artwork"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyable Living Glass arched display object on dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Living Glass review evidence">
        <figure>
          <Image
            alt="Contact sheet for Living Glass Gostiny Dvor route and mask proof"
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
            The matte proves the first isolation path, but production compositing still needs a
            cleaner segmentation pass for the green-tinted transparent glass body.
          </p>
        </div>
      </section>
    </main>
  );
}
