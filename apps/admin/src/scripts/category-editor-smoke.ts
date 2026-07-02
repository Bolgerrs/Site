import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";
import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import {
  canAccessCategorySystemFields,
  getCategoryEditorActionHrefs,
  getCategoryEditorSnapshot,
  getCategoryPublicUrl,
} from "../lib/payload/category-editor.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-category-editor-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function assertNoDirectRawHrefs(scope: string, hrefs: Array<string | undefined>) {
  const leaks = hrefs.filter((href): href is string => Boolean(href && isRawAdminHref(href)));
  assert.deepEqual(leaks, [], `${scope} should not expose direct raw collection hrefs.`);
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncCatalogHierarchyAndProducts(payload);

    const categories = await payload.find({
      collection: "product-categories",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    });
    const category = categories.docs.find((entry) => typeof entry.slug === "string" && entry.slug.length > 0);

    assert.ok(category, "Expected one seeded product category with a slug.");

    const snapshot = await getCategoryEditorSnapshot(payload, category);
    const actionHrefs = getCategoryEditorActionHrefs();

    assert.ok(
      snapshot.linkedWorkspaces.some((entry) => entry.id === "products"),
      "Category editor should expose a guided products workspace.",
    );
    assert.ok(
      snapshot.linkedWorkspaces.some((entry) => entry.id === "lines"),
      "Category editor should expose a guided product-line workspace.",
    );
    assertNoDirectRawHrefs("category editor action links", Object.values(actionHrefs));
    assertNoDirectRawHrefs(
      "category editor linked workspaces",
      snapshot.linkedWorkspaces.map((entry) => entry.href),
    );
    assertNoDirectRawHrefs(
      "category editor checklist",
      snapshot.checklist.map((entry) => entry.href),
    );
    assertNoDirectRawHrefs(
      "category editor blockers",
      snapshot.blockers.map((entry) => entry.href),
    );
    assert.match(
      getCategoryPublicUrl(category),
      /\/[a-z]{2}\//,
      "Public URL should stay locale-prefixed.",
    );
    assert.equal(canAccessCategorySystemFields({ role: "developer" }), true);
    assert.equal(canAccessCategorySystemFields({ role: "content-editor" }), false);
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
