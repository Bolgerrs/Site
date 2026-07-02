import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import {
  productCategorySeeds,
  productDirectionSeeds,
  productLineSeeds,
  productSeeds,
  syncCatalogHierarchyAndProducts,
} from "../lib/payload/catalog-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-catalog-hierarchy-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    const firstRun = await syncCatalogHierarchyAndProducts(payload);
    const secondRun = await syncCatalogHierarchyAndProducts(payload);

    const directions = await payload.find({
      collection: "product-directions",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    });
    const categories = await payload.find({
      collection: "product-categories",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    });
    const lines = await payload.find({
      collection: "product-lines",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    });
    const products = await payload.find({
      collection: "products",
      depth: 0,
      limit: 30,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    });

    assert.equal(directions.docs.length, productDirectionSeeds.length);
    assert.equal(categories.docs.length, productCategorySeeds.length);
    assert.equal(lines.docs.length, productLineSeeds.length);
    assert.equal(products.docs.length, productSeeds.length);
    assert.equal(firstRun.productCount, productSeeds.length);
    assert.equal(secondRun.directionOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.categoryOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.lineOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.productOperations.every((entry) => entry.operation === "updated"), true);
    assert.deepEqual(
      directions.docs.map((entry) => entry.slug),
      productDirectionSeeds.map((entry) => entry.slug),
    );
    assert.deepEqual(
      categories.docs.map((entry) => entry.slug),
      productCategorySeeds.map((entry) => entry.slug),
    );
    assert.deepEqual(
      lines.docs.map((entry) => entry.slug),
      productLineSeeds.map((entry) => entry.slug),
    );
    assert.equal(directions.docs[0]?.canonicalPath, "/vision-max");
    assert.equal(categories.docs[4]?.canonicalPath, "/audio/perfect-conductors");
    assert.equal(lines.docs[1]?.canonicalPath, "/audio/perfect-conductors/prima-materia-lux");
    assert.equal(products.docs[0]?.canonicalPath, "/products/prima-materia-premium-interconnect");
    assert.equal(products.docs[9]?.slug, "prima-materia-lux-blackrok");
    assert.equal(products.docs[9]?.status, "draft");
    assert.equal(products.docs[10]?.slug, "vision-max-premium");
    assert.equal(products.docs[17]?.slug, "exhibition-rail");
    assert.equal(products.docs[17]?.visibilityInNavigation, false);
    assert.equal(secondRun.productStatusBreakdown.review, 13);
    assert.equal(secondRun.productStatusBreakdown.draft, 5);

    console.log(
      JSON.stringify(
        {
          categoryCount: categories.docs.length,
          directionCount: directions.docs.length,
          draftProducts: products.docs
            .filter((entry) => entry.status === "draft")
            .map((entry) => entry.slug),
          lineCount: lines.docs.length,
          navDirectionSlugs: directions.docs
            .filter((entry) => entry.visibilityInNavigation)
            .map((entry) => entry.slug),
          navHiEndAudioCategories: categories.docs
            .filter((entry) => entry.visibilityInNavigation)
            .map((entry) => entry.slug),
          productCount: products.docs.length,
          reviewProducts: products.docs.filter((entry) => entry.status === "review").length,
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
