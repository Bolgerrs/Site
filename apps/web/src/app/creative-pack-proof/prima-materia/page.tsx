import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const assetBase = "/images/site-vis-021a/prima-materia";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Prima Materia proof | Montelar",
    description: "Hidden Montelar prototype proof for the Prima Materia keyable cable candidate.",
    path: "/creative-pack-proof/prima-materia",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function PrimaMateriaProofPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--prima-materia">
      <section className="creative-proof-hero" aria-labelledby="prima-materia-proof-title">
        <p className="eyebrow">Prima Materia</p>
        <h1 id="prima-materia-proof-title">Cable geometry, isolated.</h1>
        <p>
          A hidden browser proof for the owner-approved prototype keying candidate: complete cable
          silhouette, coherent terminations, visible jacket texture and enough green-margin history
          to support future mask and product-film tests.
        </p>
        <div className="creative-proof-actions">
          <Link href={withLocale("/audio/perfect-conductors/prima-materia", locale)}>Open line</Link>
          <Link href={withLocale("/request/prima-materia-lux-speaker", locale)}>Request consultation</Link>
        </div>
      </section>

      <section className="creative-proof-stage" aria-label="Prima Materia creative proof stage">
        <div className="creative-proof-stage__copy">
          <p className="eyebrow">Route proof</p>
          <h2>The cable stays functional, not ornamental.</h2>
          <p>
            The proof keeps the connector barrels, cable curve and full object silhouette visible
            beside a controlled copy zone. The object layer uses only a slow verification drift; the
            reduced-motion state disables it.
          </p>
        </div>
        <div className="creative-proof-stage__media">
          <figure className="creative-proof-frame creative-proof-frame--context">
            <Image
              alt="Prima Materia route-stage proof with cable object isolated beside a quiet copy zone"
              fill
              priority
              quality={82}
              sizes="(max-width: 900px) 92vw, 64vw"
              src={`${assetBase}/route-stage.webp`}
            />
          </figure>
          <figure className="creative-proof-frame creative-proof-frame--keyable">
            <Image
              alt="Keyed Prima Materia cable object with complete connector barrels and cable route"
              fill
              quality={82}
              sizes="(max-width: 900px) 88vw, 42vw"
              src={`${assetBase}/keyable-object-on-dark.webp`}
            />
          </figure>
        </div>
      </section>

      <section className="creative-proof-review" aria-label="Prima Materia review evidence">
        <figure>
          <Image
            alt="Current-only contact sheet for Prima Materia owner-approved prototype keying candidate"
            fill
            quality={82}
            sizes="(max-width: 900px) 92vw, 46vw"
            src={`${assetBase}/contact-sheet.webp`}
          />
        </figure>
        <div>
          <p className="eyebrow">Reviewer caveat</p>
          <h2>Prototype keying only.</h2>
          <p>
            Owner feedback approves this cable for prototype keying, not direct rollout. Production
            use still needs page integration, route copy, performance notes and final reviewer
            acceptance in the downstream visual rollout.
          </p>
        </div>
      </section>
    </main>
  );
}
