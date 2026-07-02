import type { Metadata } from "next";
import Image from "next/image";

import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const proofItems = [
  {
    eyebrow: "Living Glass",
    title: "Gostiny Dvor display study",
    href: "/creative-pack-proof/living-glass-gostiny-dvor",
    image: "/images/site-vis-021a/living-glass-gostiny-dvor/web-context.webp",
    outcome: "Owner-positive web-context plus keyable pair; proof-only matte remains the caveat.",
  },
  {
    eyebrow: "Living Glass",
    title: "Baikal full-surface glass",
    href: "/creative-pack-proof/living-glass-baikal-clean",
    image: "/images/site-vis-021a/living-glass-baikal-clean/web-context.webp",
    outcome: "Clean no-text storefront candidate now has a real hidden Next.js proof route; rollout remains gated.",
  },
  {
    eyebrow: "Living Glass",
    title: "Interactive glass partition",
    href: "/creative-pack-proof/living-glass-interactive-partition-full-surface",
    image: "/images/site-vis-021a/living-glass-interactive-partition-full-surface/web-context.webp",
    outcome:
      "Latest interactive partition pair has route and mask proof; owner/reviewer, native 2K and rollout gates remain open.",
  },
  {
    eyebrow: "Vision MAX",
    title: "Private cinema assembly",
    href: "/creative-pack-proof/vision-max",
    image: "/images/site-vis-021a/vision-max/web-context.webp",
    outcome: "Route framing passed; Flow/Veo frame sequence is still the production motion gate.",
  },
  {
    eyebrow: "Vision MAX",
    title: "Scroll-motion proof",
    href: "/creative-pack-proof/vision-max-scroll-motion",
    image: "/images/site-vis-021a/vision-max-scroll-motion/poster.webp",
    outcome: "Fresh Flow/Veo frames now run in a hidden scroll proof; source remains prototype-only.",
  },
  {
    eyebrow: "Hi-end Audio",
    title: "Composed listening system",
    href: "/creative-pack-proof/hi-end-audio",
    image: "/images/site-vis-021a/hi-end-audio/web-context-clean-faceplates-20260524.webp",
    outcome:
      "Latest clean-faceplates web-context plus keyable pair now has hidden browser proof; native 2K, matte cleanup and rollout approval remain gated.",
  },
  {
    eyebrow: "Prima Materia",
    title: "Cable geometry proof",
    href: "/creative-pack-proof/prima-materia",
    image: "/images/site-vis-021a/prima-materia/route-stage.webp",
    outcome: "Owner-positive keying candidate now has a hidden browser proof; rollout remains gated.",
  },
  {
    eyebrow: "Hologram",
    title: "Physical light, contained",
    href: "/creative-pack-proof/hologram-vitrine",
    image: "/images/site-vis-021a/hologram-vitrine/web-context.webp",
    outcome: "Vitrine framing works as hidden proof; production isolation needs a cleaner pass.",
  },
  {
    eyebrow: "Hologram",
    title: "No-text device proof",
    href: "/creative-pack-proof/hologram-device-no-text",
    image: "/images/site-vis-021a/hologram-device-no-text/web-context.webp",
    outcome:
      "Latest no-text Hologram pair now has hidden browser framing; native 2K and rollout approval remain gated.",
  },
  {
    eyebrow: "Exhibition Display",
    title: "Totem and touch table",
    href: "/creative-pack-proof/exhibition-display",
    image: "/images/site-vis-021a/exhibition-display/web-context.webp",
    outcome: "Owner-positive single totem now has a route/mask proof; native 2K remains gated.",
  },
  {
    eyebrow: "Exhibition Display",
    title: "Active fins and table",
    href: "/creative-pack-proof/exhibition-display-active-surface",
    image: "/images/site-vis-021a/exhibition-display-active-surface/web-context.webp",
    outcome: "Latest Embedded/Fedor active-surface candidate has browser proof; edge/base and native 2K gates remain open.",
  },
  {
    eyebrow: "Exhibition Display",
    title: "Edgeless media plane",
    href: "/creative-pack-proof/exhibition-display-edgeless-media-plane",
    image: "/images/site-vis-021a/exhibition-display-edgeless-media-plane/web-context.webp",
    outcome:
      "Clean retry reduces the framed-appliance read; owner/reviewer, product-story and native 2K gates remain open.",
  },
  {
    eyebrow: "Pictorial Art Display",
    title: "Painting, not wallpaper",
    href: "/creative-pack-proof/pictorial-art-display",
    image: "/images/site-vis-021a/pictorial-art-display/web-context.webp",
    outcome:
      "Latest painterly keyable candidate now has route proof; native 2K, matte/despill and owner/reviewer gates remain open.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Creative pack proof hub | Montelar",
    description: "Hidden Montelar QA hub for MNT-SITE-VIS-021A creative proof routes.",
    path: "/creative-pack-proof",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function CreativePackProofHubPage() {
  const locale = await getRequestLocale();

  return (
    <main className="creative-proof-page creative-proof-page--hub">
      <section className="creative-proof-hero creative-proof-hub-hero" aria-labelledby="creative-proof-hub-title">
        <p className="eyebrow">MNT-SITE-VIS-021A</p>
        <h1 id="creative-proof-hub-title">Creative proof routes.</h1>
        <p>
          A hidden review hub for the current production-candidate creative pack. Each route keeps
          the selected web-context and keyable evidence isolated from the production homepage while
          preserving browser screenshots, motion checks and rollout caveats.
        </p>
      </section>

      <section className="creative-proof-hub-list" aria-label="Creative proof route index">
        {proofItems.map((item, index) => (
          <a
            className="creative-proof-hub-row"
            data-proof-route={item.href}
            href={withLocale(item.href, locale)}
            key={item.href}
          >
            <span className="creative-proof-hub-row__number">{String(index + 1).padStart(2, "0")}</span>
            <span className="creative-proof-hub-row__media">
              <Image
                alt={`${item.eyebrow} proof route preview`}
                fill
                quality={75}
                sizes="(max-width: 900px) 34vw, 220px"
                src={item.image}
              />
            </span>
            <span className="creative-proof-hub-row__body">
              <span className="eyebrow">{item.eyebrow}</span>
              <span className="creative-proof-hub-row__title">{item.title}</span>
              <span className="creative-proof-hub-row__outcome">{item.outcome}</span>
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}
