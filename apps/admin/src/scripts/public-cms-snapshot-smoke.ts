import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { getPublicCmsSnapshot } from "../lib/payload/public-cms.ts";
import { syncPublicCmsBaseline } from "../lib/payload/public-cms-baseline.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-public-cms-baseline-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  await rm(localSmokeDatabasePath, { force: true });
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    const firstRun = await syncPublicCmsBaseline(payload);
    const secondRun = await syncPublicCmsBaseline(payload);
    const englishSnapshot = await getPublicCmsSnapshot(payload, "en");
    const frenchSnapshot = await getPublicCmsSnapshot(payload, "fr");
    const translations = await payload.find({
      collection: "translations",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
    });
    const seoEntries = await payload.find({
      collection: "seo-entries",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
    });

    assert.equal(firstRun.seoCount, 4);
    assert.equal(firstRun.translationCount, 3);
    assert.equal(secondRun.seoOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(
      secondRun.translationOperations.every((entry) => entry.operation === "updated"),
      true,
    );

    assert.equal(englishSnapshot.siteSettings?.brandName, "Montelar");
    assert.ok(
      englishSnapshot.navigationMenus.some((menu) => menu.menuKey === "primary-header"),
      "Expected seeded primary-header navigation menu.",
    );
    assert.ok(
      englishSnapshot.pages.some((page) => page.routePath === "/"),
      "Expected homepage page in the public snapshot.",
    );
    assert.ok(
      englishSnapshot.directions.some(
        (direction) => direction.slug === "vision-max" && Boolean(direction.coverCardMedia),
      ) ||
        englishSnapshot.pages.some((page) => Boolean(page.heroMedia)),
      "Expected representative public media references to resolve through Payload.",
    );
    assert.ok(
      englishSnapshot.inquiryForms.some((form) => form.productSlug === "vision-max-premium"),
      "Expected representative product inquiry form in the public snapshot.",
    );
    assert.ok(
      englishSnapshot.products.some((product) => product.slug === "vision-max-premium"),
      "Expected a representative published product in the public snapshot.",
    );
    assert.ok(
      englishSnapshot.seoEntries.some((entry) => entry.path === "/vision-max"),
      "Expected production-ready direction SEO entry in the public snapshot.",
    );
    assert.ok(
      englishSnapshot.seoEntries.some((entry) => entry.path === "/products/vision-max-premium"),
      "Expected representative product SEO entry in the public snapshot.",
    );
    assert.ok(
      frenchSnapshot.seoEntries.some((entry) => entry.path === "/fr"),
      "Expected representative French SEO entry in the public snapshot.",
    );
    assert.ok(
      englishSnapshot.directions.some((direction) => direction.slug === "vision-max"),
      "Expected direction records to come from Payload.",
    );
    assert.ok(
      translations.docs.some((entry) => entry.ownerCollection === "pages"),
      "Expected representative page translation records.",
    );
    assert.ok(
      translations.docs.some((entry) => entry.ownerCollection === "products"),
      "Expected representative product translation records.",
    );
    assert.ok(
      translations.docs.some((entry) => entry.ownerCollection === "product-inquiry-forms"),
      "Expected representative form translation records.",
    );
    assert.ok(
      seoEntries.docs.some((entry) => entry.internalCode === "SEO_PUBLIC_HOME_EN"),
      "Expected representative homepage SEO record.",
    );
    assert.ok(
      seoEntries.docs.some((entry) => entry.internalCode === "SEO_PUBLIC_VISION_MAX_PREMIUM_PRODUCT_EN"),
      "Expected representative product SEO record in the Payload collection.",
    );

    console.log(
      JSON.stringify(
        {
          directions: englishSnapshot.directions.length,
          inquiryForms: englishSnapshot.inquiryForms.length,
          navigationMenus: englishSnapshot.navigationMenus.length,
          pages: englishSnapshot.pages.length,
          products: englishSnapshot.products.length,
          seoEntries: seoEntries.docs.length,
          translations: translations.docs.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await payload.destroy();

    if (process.env.DATABASE_URL === `file:${localSmokeDatabasePath}`) {
      await rm(localSmokeDatabasePath, { force: true });
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
