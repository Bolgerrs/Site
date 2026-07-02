import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { getPublicNavigationMenu } from "../lib/payload/public-site.ts";
import { syncEditorialPagesSectionsAndNavigation } from "../lib/payload/page-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-page-content-seed-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    const firstRun = await syncEditorialPagesSectionsAndNavigation(payload);
    const secondRun = await syncEditorialPagesSectionsAndNavigation(payload);

    assert.equal(firstRun.sectionCount, 7);
    assert.equal(firstRun.pageCount, 12);
    assert.equal(firstRun.navigationCount, 5);
    assert.equal(firstRun.publicNavigationChecks.primaryHeaderItems, 4);
    assert.equal(firstRun.publicNavigationChecks.productsMegaItems, 6);

    assert.equal(
      secondRun.sectionOperations.every((entry) => entry.operation === "updated"),
      true,
    );
    assert.equal(secondRun.pageOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(
      secondRun.navigationOperations.every((entry) => entry.operation === "updated"),
      true,
    );

    const publishedPages = await payload.find({
      collection: "pages",
      depth: 0,
      limit: 30,
      overrideAccess: true,
      pagination: false,
      where: {
        status: {
          equals: "published",
        },
      },
    });

    const publishedRoutePaths = new Set(
      publishedPages.docs.map((doc) => (doc as { routePath?: string }).routePath),
    );

    assert.equal(publishedRoutePaths.has("/"), true);
    assert.equal(publishedRoutePaths.has("/brand"), true);
    assert.equal(publishedRoutePaths.has("/technology"), true);
    assert.equal(publishedRoutePaths.has("/craftsmanship"), true);
    assert.equal(publishedRoutePaths.has("/projects"), true);
    assert.equal(publishedRoutePaths.has("/journal"), true);
    assert.equal(publishedRoutePaths.has("/downloads"), true);
    assert.equal(publishedRoutePaths.has("/contact"), true);
    assert.equal(publishedRoutePaths.has("/request/vision-max-premium"), true);
    assert.equal(publishedRoutePaths.has("/dealer-partner"), true);
    assert.equal(publishedRoutePaths.has("/privacy-policy"), true);

    const hiddenPreviewPage = await payload.find({
      collection: "pages",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        slug: {
          equals: "admin-preview",
        },
      },
    });

    assert.equal(hiddenPreviewPage.docs[0]?.status, "draft");

    const primaryHeader = await getPublicNavigationMenu(payload, "en", "primary-header");
    const productsMega = await getPublicNavigationMenu(payload, "en", "products-mega");
    const footerLegal = await getPublicNavigationMenu(payload, "en", "footer-legal");
    const contactSurfaces = await getPublicNavigationMenu(payload, "en", "contact-surfaces");

    assert.ok(primaryHeader);
    assert.equal(primaryHeader?.items[0]?.label, "Products");
    assert.equal(primaryHeader?.items[0]?.children.length, 6);
    assert.equal(primaryHeader?.items[1]?.href, "/brand");
    assert.equal(primaryHeader?.items[3]?.href, "/contact");

    assert.ok(productsMega);
    assert.equal(productsMega?.items[0]?.href, "/audio");
    assert.equal(productsMega?.items[0]?.children.length, 5);
    assert.equal(productsMega?.items[1]?.children[0]?.href, "/products/vision-max-premium");

    assert.ok(footerLegal);
    assert.equal(footerLegal?.items[0]?.href, "/privacy-policy");

    assert.ok(contactSurfaces);
    assert.equal(contactSurfaces?.items[1]?.href, "/request/vision-max-premium");

    console.log("page-content-seed-smoke: ok");
  } finally {
    await payload.db.destroy?.();
    await rm(localSmokeDatabasePath, { force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
