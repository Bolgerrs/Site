import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type PayloadRequest } from "payload";

import { executeOwnerProductCommand, getOwnerProductCommandState } from "../lib/admin-bff/product-commands.ts";
import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";
import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-owner-product-commands-smoke.db");

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

function assertNoFirstLayerRawLinks(snapshot: Awaited<ReturnType<typeof getOwnerProductCommandState>>) {
  const hrefs = snapshot.cards.flatMap((card) => [
    card.checksHref,
    card.commandHref,
    card.editorHref,
    card.formHref,
    card.mediaHref,
    card.translationsHref,
  ]);
  const directRawLeaks = hrefs.filter((href) => isRawAdminHref(href));
  const advancedRawLeaks = hrefs.filter((href) => href.startsWith("/admin/advanced?raw="));

  assert.deepEqual(directRawLeaks, [], "Owner product cards must not expose direct raw collection hrefs.");
  assert.deepEqual(advancedRawLeaks, [], "Owner product cards must not use advanced raw handoff for first-layer actions.");
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const probeImagePath = path.resolve(adminRuntime.tempDir, "owner-product-command-media.png");
  const payload = await getPayload({ config, cron: true });

  try {
    await mkdir(adminRuntime.tempDir, { recursive: true });
    await writeFile(
      probeImagePath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
        "base64",
      ),
    );
    await syncCatalogHierarchyAndProducts(payload);

    const req = createReq(payload, "owner");
    const suffix = Date.now();
    const initial = await getOwnerProductCommandState(payload, req);
    const direction = initial.hierarchy.directions.find((entry) => entry.slug === "hi-end-audio") ?? initial.hierarchy.directions[0];

    assert.ok(direction, "Seeded product direction is required.");
    assertNoFirstLayerRawLinks(initial);

    const created = await executeOwnerProductCommand(payload, req, {
      action: "product.create",
      payload: {
        directionId: direction.id,
        internalCode: `PRD_OWNER_COMMAND_${suffix}`,
        name: `Owner Command Product ${suffix}`,
        publicLabel: `Owner Command Product ${suffix}`,
        shortDescription: "Draft product created through the owner command BFF smoke.",
        slug: `owner-command-product-${suffix}`,
      },
    });

    assert.ok(created.selectedProductId, "Create command should return a focused product id.");
    assert.equal(created.ok, true);

    const createdCard = created.products.cards.find((card) => card.id === created.selectedProductId);
    assert.ok(createdCard, "Created product should be present in the returned product state.");
    assert.equal(createdCard?.hasCategory, false);

    const category = created.products.hierarchy.categories.find((entry) => entry.directionId === direction.id);
    assert.ok(category, "Seeded category under the selected direction is required.");

    const assigned = await executeOwnerProductCommand(payload, req, {
      action: "product.category.assign",
      payload: {
        categoryId: category.id,
        directionId: direction.id,
        productId: created.selectedProductId,
      },
    });
    assert.equal(assigned.products.selectedProduct?.hasCategory, true);

    await executeOwnerProductCommand(payload, req, {
      action: "product.core.save",
      payload: {
        availabilityMode: "on-request",
        launchStage: "planned",
        productId: created.selectedProductId,
        shortDescription: "Updated through owner product command smoke.",
      },
    });

    const formResult = await executeOwnerProductCommand(payload, req, {
      action: "product.form.save",
      payload: {
        productId: created.selectedProductId,
        title: "Owner command inquiry",
      },
    });
    assert.equal(formResult.products.selectedProduct?.hasForm, true);

    const seoResult = await executeOwnerProductCommand(payload, req, {
      action: "product.seo.save",
      payload: {
        metaDescription: "Owner command smoke SEO description for a guided draft product.",
        metaTitle: "Owner Command Product SEO",
        productId: created.selectedProductId,
      },
    });
    assert.equal(seoResult.products.selectedProduct?.hasSeo, true);

    const mediaAsset = await payload.create({
      collection: "media-assets",
      data: {
        approvalStatus: "pending",
        assetRole: "Owner product command cover",
        assetTitle: "Owner product command cover",
        assetType: "image",
        audienceMode: "public",
        internalCode: `MAS_OWNER_PRODUCT_COMMAND_${suffix}`,
        primaryLocale: "en",
        publicationReadiness: "blocked",
        referenceOnlyNotProductionAsset: false,
        rightsStatus: "generated-pending-review",
        sourceCategory: "owner-provided",
        sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-BFF-014-media-workspace-plug-play-rebuild.md",
        status: "draft",
        translationPriority: "normal",
        altText: "Owner product command cover alt",
      },
      draft: false,
      filePath: probeImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });
    const mediaResult = await executeOwnerProductCommand(payload, req, {
      action: "product.media.save",
      payload: {
        coverCardAssetId: mediaAsset.id,
        heroAssetId: mediaAsset.id,
        productId: created.selectedProductId,
      },
    });
    assert.equal(mediaResult.products.selectedProduct?.hasHero, true);
    assert.equal(mediaResult.products.selectedProduct?.heroAssetId, String(mediaAsset.id));

    await executeOwnerProductCommand(payload, req, {
      action: "product.order",
      payload: {
        order: 7,
        productId: created.selectedProductId,
      },
    });
    await executeOwnerProductCommand(payload, req, {
      action: "product.visibility.set",
      payload: {
        productId: created.selectedProductId,
        visible: false,
      },
    });
    await executeOwnerProductCommand(payload, req, {
      action: "product.visibility.set",
      payload: {
        productId: created.selectedProductId,
        status: "review",
        visible: true,
      },
    });

    const duplicated = await executeOwnerProductCommand(payload, req, {
      action: "product.duplicate",
      payload: {
        publicLabel: `Owner Command Product Copy ${suffix}`,
        productId: created.selectedProductId,
        slug: `owner-command-product-copy-${suffix}`,
      },
    });
    assert.ok(duplicated.selectedProductId, "Duplicate command should focus the copied product.");

    await executeOwnerProductCommand(payload, req, {
      action: "category.create",
      payload: {
        directionId: direction.id,
        internalCode: `CAT_OWNER_COMMAND_${suffix}`,
        name: `Owner Command Category ${suffix}`,
        publicLabel: `Owner Command Category ${suffix}`,
        shortDescription: "Draft category created through the owner command BFF smoke.",
        slug: `owner-command-category-${suffix}`,
      },
    });
    const categoryState = await getOwnerProductCommandState(payload, req, {
      selectedProductId: created.selectedProductId,
    });
    const newCategory = categoryState.hierarchy.categories.find((entry) => entry.slug === `owner-command-category-${suffix}`);
    assert.ok(newCategory, "Category create command should add a hierarchy node.");

    await executeOwnerProductCommand(payload, req, {
      action: "category.content.save",
      payload: {
        categoryId: newCategory.id,
        shortDescription: "Updated category through owner product command smoke.",
      },
    });
    await executeOwnerProductCommand(payload, req, {
      action: "category.order",
      payload: {
        categoryId: newCategory.id,
        order: 99,
      },
    });
    await executeOwnerProductCommand(payload, req, {
      action: "category.visibility.set",
      payload: {
        categoryId: newCategory.id,
        visible: false,
      },
    });
    await executeOwnerProductCommand(payload, req, {
      action: "line.create",
      payload: {
        categoryId: newCategory.id,
        directionId: direction.id,
        internalCode: `LINE_OWNER_COMMAND_${suffix}`,
        name: `Owner Command Line ${suffix}`,
        publicLabel: `Owner Command Line ${suffix}`,
        shortDescription: "Draft line created through the owner command BFF smoke.",
        slug: `owner-command-line-${suffix}`,
      },
    });

    const finalState = await getOwnerProductCommandState(payload, req, {
      selectedProductId: created.selectedProductId,
    });
    assertNoFirstLayerRawLinks(finalState);
    assert.ok(finalState.hierarchy.lines.some((entry) => entry.slug === `owner-command-line-${suffix}`));
    assert.equal(finalState.selectedProduct?.hasCategory, true);

    const auditEvents = await payload.find({
      collection: "audit-events",
      depth: 0,
      limit: 40,
      overrideAccess: true,
      pagination: false,
      sort: "-happenedAt",
    });
    assert.ok(auditEvents.docs.some((event) => event.action === "owner-product-create"));
    assert.ok(auditEvents.docs.some((event) => event.action === "owner-product-category-assign"));
    assert.ok(auditEvents.docs.some((event) => event.action === "owner-product-seo-save"));

    await assert.rejects(
      () => getOwnerProductCommandState(payload, createReq(payload, "translator")),
      /forbidden/,
    );

    console.log("owner-product-commands-smoke: ok");
  } finally {
    await payload.destroy();
    await rm(probeImagePath, { force: true });

    if (process.env.DATABASE_URL === `file:${localSmokeDatabasePath}`) {
      await rm(localSmokeDatabasePath, { force: true });
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
