import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type PayloadRequest } from "payload";

import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";
import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { syncInquiryFormsAndSampleLeads } from "../lib/payload/inquiry-seed.ts";
import { getOwnerProductsSnapshot } from "../lib/payload/owner-products.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-owner-products-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function createReq(
  payload: Awaited<ReturnType<typeof getPayload>>,
  role: "owner" | "translator",
) {
  return {
    payload,
    user: {
      collection: "admin-users",
      email: `${role}@montelar.example`,
      fullName: `${role} smoke`,
      id: `${role}-smoke`,
      role,
    },
  } as unknown as PayloadRequest;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncCatalogHierarchyAndProducts(payload);
    await syncInquiryFormsAndSampleLeads(payload);

    const ownerReq = createReq(payload, "owner");
    const snapshot = await getOwnerProductsSnapshot(payload, ownerReq);
    const visionMax = snapshot.cards.find((card) => card.label === "Vision MAX Premium");

    assert.equal(snapshot.canRead, true);
    assert.ok(snapshot.totals.total >= 18);
    assert.equal(snapshot.cards.length, snapshot.totals.total);
    assert.ok(snapshot.hierarchy.directions.length > 0);
    assert.ok(snapshot.hierarchy.categories.length > 0);
    assert.ok(visionMax, "Expected seeded Vision MAX Premium card.");
    assert.equal(Boolean(visionMax?.previewMedia), true);
    assert.match(visionMax?.publicHref ?? "", /\/en\/products\/vision-max-premium$/);
    assert.equal(visionMax?.editorHref, `/admin/products?product=${visionMax?.id}`);
    assert.equal(isRawAdminHref(visionMax?.editorHref ?? ""), false);
    assert.equal((visionMax?.formHref ?? "").startsWith("/admin/advanced?raw="), false);
    assert.equal(Array.isArray(visionMax?.issueLabels), true);

    await assert.rejects(
      () => getOwnerProductsSnapshot(payload, createReq(payload, "translator")),
      /forbidden/,
    );

    console.log("owner-products-smoke: ok");
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
