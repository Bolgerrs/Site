import type { Metadata } from "next";
import Image from "next/image";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/living-glass-baikal-clean";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Living Glass Baikal clean proof | Montelar",
    description: "Hidden Montelar browser proof for the Living Glass Baikal full-surface clean no-text candidate.",
    path: "/creative-pack-proof/living-glass-baikal-clean",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function LivingGlassBaikalCleanProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--living-glass">
      <section className="creative-proof-hero" aria-labelledby="living-glass-baikal-proof-title">
        <p className="eyebrow">Living Glass / Baikal</p>
        <h1 id="living-glass-baikal-proof-title">Full-surface glass proof.</h1>
        <p>
          A hidden Next.js browser proof for the clean no-text Baikal candidate. The route keeps the
          active media plane readable as integrated architectural glass, not as a framed monitor or
          loose decorative screen.
        </p>
        <div className="creative-proof-actions">
          <a href={withLocale("/invisible-display", locale)}>Open direction</a>
          <a href={withLocale("/request/living-glass-oled", locale)}>Request consultation</a>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Living Glass Baikal route proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>Continuous glass, no frame object.</h2>
          <p>
            The browser stage preserves the storefront-scale transparent surface, calm negative
            space and no-text constraint from the latest owner correction. The keyable layer remains
            proof-only until a cleaner production matte exists.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Architectural storefront with Living Glass media filling the transparent glass plane"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/web-context.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyable Living Glass surface proof isolated on a dark verification plate"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Living Glass Baikal review evidence">
        <figure>
          <Image
            alt="Contact sheet for Living Glass Baikal route, mask and browser proof"
            fill
            quality={82}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/contact-sheet.webp`}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Hidden proof only.</h2>
          <p>
            This route closes the real Next.js proof gap for the current Baikal pair, but it is not
            rollout approval: native Flow output is still 1376x768 and the matte/despill layer is
            only local route-smoke evidence.
          </p>
        </div>
      </section>
    </main>
  );
}
