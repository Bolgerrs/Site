import assert from "node:assert/strict";

import {
  assertNoRawSurfaceRegistryLabels,
  findEditableSurfaceUsage,
  getEditableSurfaceRegistry,
} from "../lib/admin-bff/surface-registry.ts";

const media = [
  {
    id: "media-home-hero",
    assetTitle: "Homepage hero still",
    filename: "homepage-hero.jpg",
  },
  {
    id: "media-product-hero",
    assetTitle: "Vision MAX product still",
    filename: "vision-max.jpg",
  },
] as const;

const sections = [
  {
    id: "section-home-hero",
    body: "Quiet product story from a governed homepage block.",
    ctaContent: {
      primaryLabel: "Open private consultation",
      primaryTarget: "/contact",
    },
    heroContent: {
      heroMedia: "media-home-hero",
      supportingLabel: "Architecture of image, sound and AI design",
    },
    previewLabel: "Hero",
    sectionType: "hero",
    title: "Montelar",
  },
] as const;

const pages = [
  {
    id: "page-home",
    heroMedia: "media-home-hero",
    heroPrimaryCtaLabel: "Arrange a private consultation",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Quiet luxury homepage summary.",
    introBody: "Homepage intro text.",
    pageFamily: "home",
    primaryLocale: "en",
    relatedProducts: ["product-vision-max"],
    routePath: "/",
    sections: [{ order: 10, section: "section-home-hero", visible: true }],
    slug: "home",
    title: "Home",
  },
  {
    id: "page-contact",
    heroPrimaryCtaLabel: "Send request",
    heroSummary: "Contact page for private consultations.",
    introBody: "Contact intro text.",
    pageFamily: "contact",
    primaryLocale: "en",
    routePath: "/contact",
    sections: [],
    slug: "contact",
    title: "Contact",
  },
] as const;

const products = [
  {
    id: "product-vision-max",
    canonicalPath: "/products/vision-max-premium",
    coverCardAsset: "media-product-hero",
    heroAsset: "media-product-hero",
    name: "Vision MAX Premium",
    primaryLocale: "en",
    shortDescription: "Private cinema product page.",
    slug: "vision-max-premium",
  },
] as const;

const forms = [
  {
    id: "form-vision-max",
    product: "product-vision-max",
    slug: "vision-max-form",
    title: "Vision MAX request form",
  },
] as const;

const seoEntries = [
  {
    id: "seo-home",
    locale: "en",
    metaTitle: "Montelar | Quiet Luxury",
    ownerPage: "page-home",
    ownerType: "page",
  },
  {
    id: "seo-product",
    locale: "en",
    metaTitle: "Vision MAX Premium | Montelar",
    ownerProduct: "product-vision-max",
    ownerType: "product",
  },
] as const;

const translations = [
  {
    id: "tr-home-ru",
    locale: "ru",
    ownerLabelSnapshot: "Главная",
    ownerRecordKey: "home",
    sourceText: "Home",
  },
] as const;

const docsByCollection: Record<string, readonly unknown[]> = {
  "media-assets": media,
  "page-sections": sections,
  "pages": pages,
  "productInquiryForms": forms,
  "products": products,
  "seo-entries": seoEntries,
  translations,
};

async function main() {
  const payload = {
    find: async ({ collection }: { collection: string }) => ({
      docs: docsByCollection[collection] ?? [],
    }),
  };

  const registry = await getEditableSurfaceRegistry(payload as never);
  const labelsWithRawTerms = assertNoRawSurfaceRegistryLabels(registry);
  const homepage = registry.routes.find((route) => route.routePath === "/");
  const product = registry.routes.find((route) => route.routePath === "/products/vision-max-premium");
  const contact = registry.routes.find((route) => route.routePath === "/contact");

  assert.equal(labelsWithRawTerms.length, 0, `Registry labels should be owner-safe: ${labelsWithRawTerms.join(", ")}`);
  assert.ok(homepage, "Homepage editable surface should be discoverable by route.");
  assert.ok(product, "Product editable surface should be discoverable by route.");
  assert.ok(contact, "Contact editable surface should be discoverable by route.");
  assert.equal(homepage.blocks.length, 1, "Homepage should expose editable blocks.");
  assert.ok(homepage.fields.some((field) => field.kind === "button"), "Homepage should expose button targets.");
  assert.ok(homepage.fields.some((field) => field.kind === "media"), "Homepage should expose media targets.");
  assert.ok(homepage.fields.some((field) => field.kind === "form"), "Homepage should expose related form targets.");
  assert.ok(homepage.fields.some((field) => field.kind === "seo"), "Homepage should expose SEO targets.");
  assert.ok(homepage.fields.some((field) => field.kind === "translation"), "Homepage should expose translation targets.");
  assert.ok(
    homepage.blocks[0]?.fields.some((field) => field.editHref.includes("/admin/site?")),
    "Block fields should deep-link to the guided site editor.",
  );

  const imageUsage = findEditableSurfaceUsage(registry, {
    kind: "media",
    sourceId: "media-home-hero",
  });
  const buttonUsage = findEditableSurfaceUsage(registry, {
    kind: "button",
    value: "Arrange a private consultation",
  });
  const textUsage = findEditableSurfaceUsage(registry, {
    kind: "text",
    value: "Quiet luxury homepage summary",
  });

  assert.ok(imageUsage.some((usage) => usage.routePath === "/"), "Registry should answer where a homepage image is used.");
  assert.ok(buttonUsage.some((usage) => usage.routePath === "/"), "Registry should answer where a button is used.");
  assert.ok(textUsage.some((usage) => usage.routePath === "/"), "Registry should answer where text is used.");
  assert.deepEqual(
    registry.usageIndex.filter((usage) => usage.editHref.includes("/admin/collections")),
    [],
    "Registry usage should not expose direct raw collection links.",
  );

  const homepageOnly = await getEditableSurfaceRegistry(payload as never, {
    routePath: "/",
  });
  assert.equal(homepageOnly.routes.length, 1, "Route filter should return only requested surface.");

  console.log("surface-registry-smoke: ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
