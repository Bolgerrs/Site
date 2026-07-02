import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { syncLaunchLocales } from "../lib/payload/locales.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-media-governance-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const probeImagePath = path.resolve(adminRuntime.tempDir, "media-governance-smoke.png");
  let payload:
    | Awaited<ReturnType<typeof getPayload>>
    | null = null;
  const createdIds: Array<{
    collection: "media-assets" | "product-media" | "product-documents";
    id: number | string;
  }> = [];

  try {
    await mkdir(adminRuntime.tempDir, { recursive: true });
    await mkdir(adminRuntime.uploadsDir, { recursive: true });
    await writeFile(
      probeImagePath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
        "base64",
      ),
    );

    payload = await getPayload({ config, cron: true });
    await syncLaunchLocales(payload);

    const mediaAsset = await payload.create({
      collection: "media-assets",
      data: {
        approvalStatus: "approved",
        assetTitle: "Montelar approved hero still",
        assetType: "image",
        audienceMode: "public",
        internalCode: "MAS_SMOKE_HERO_01",
        primaryLocale: "en",
        publicationReadiness: "production-ready",
        referenceOnlyNotProductionAsset: false,
        rightsStatus: "production-approved",
        sourceCategory: "internal",
        status: "published",
        altText: "Approved hero asset",
        translationPriority: "normal",
      },
      draft: false,
      filePath: probeImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });

    createdIds.push({ collection: "media-assets", id: mediaAsset.id });

    let blockedReferencePublish = false;

    try {
      await payload.create({
        collection: "product-media",
        data: {
          approvalStatus: "approved",
          attachmentScope: "product-default",
          internalCode: "PMM_SMOKE_REFERENCE_BLOCK",
        mediaAsset: mediaAsset.id,
        order: 1,
        ownerReviewRequired: false,
        primaryLocale: "en",
        productKey: "smoke-product",
        productLabelSnapshot: "Smoke Product",
        rightsStatus: "reference-only",
          slot: "hero",
          sourceCategory: "internal",
          status: "published",
          surfaceTargets: ["pdp"],
          translationPriority: "normal",
          usageIntent: "production",
          visibilityMode: "public",
          overrideMode: "inherit-parent",
          fallbackBehavior: "use-product-default",
          referenceOnlyReason: "Research-only still",
        },
        draft: false,
        overrideAccess: true,
        showHiddenFields: true,
      });
    } catch (error) {
      blockedReferencePublish = /product media validation failed/i.test(
        error instanceof Error ? error.message : String(error),
      );
    }

    assert.equal(blockedReferencePublish, true);

    const productMedia = await payload.create({
      collection: "product-media",
      data: {
        approvalStatus: "approved",
        attachmentScope: "product-default",
        internalCode: "PMM_SMOKE_HERO_01",
        mediaAsset: mediaAsset.id,
        order: 1,
        ownerReviewRequired: false,
        primaryLocale: "en",
        productKey: "smoke-product",
        productLabelSnapshot: "Smoke Product",
        rightsStatus: "production-approved",
        slot: "hero",
        sourceCategory: "internal",
        status: "published",
        surfaceTargets: ["pdp", "listing-card"],
        translationPriority: "normal",
        usageIntent: "production",
        visibilityMode: "public",
        overrideMode: "inherit-parent",
        fallbackBehavior: "use-product-default",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    createdIds.push({ collection: "product-media", id: productMedia.id });

    const productDocument = await payload.create({
      collection: "product-documents",
      data: {
        approvalStatus: "approved",
        attachmentScope: "product-default",
        documentTitle: "Smoke Brochure",
        documentType: "brochure",
        downloadBehavior: "direct-download",
        internalCode: "DOC_SMOKE_BROCHURE_EN",
        order: 1,
        ownerReviewRequired: false,
        previewAsset: mediaAsset.id,
        primaryLocale: "en",
        productKey: "smoke-product",
        productLabelSnapshot: "Smoke Product",
        rightsStatus: "production-approved",
        sourceCategory: "internal",
        status: "published",
        surfaceTargets: ["pdp-downloads"],
        translationPriority: "normal",
        visibilityMode: "public",
        overrideMode: "inherit-parent",
      },
      draft: false,
      filePath: probeImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });

    createdIds.push({ collection: "product-documents", id: productDocument.id });

    const mediaSummary = await payload.find({
      collection: "product-media",
      depth: 1,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      where: {
        productKey: {
          equals: "smoke-product",
        },
      },
    });

    const documentSummary = await payload.find({
      collection: "product-documents",
      depth: 1,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      where: {
        productKey: {
          equals: "smoke-product",
        },
      },
    });

    assert.equal(mediaSummary.docs.length, 1);
    assert.equal(documentSummary.docs.length, 1);

    console.log(
      JSON.stringify(
        {
          blockedReferencePublish,
          mediaAssetId: mediaAsset.id,
          productMediaId: mediaSummary.docs[0]?.id ?? null,
          productDocumentId: documentSummary.docs[0]?.id ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    if (payload) {
      for (const entry of createdIds.reverse()) {
        await payload.delete({
          collection: entry.collection,
          id: entry.id,
          overrideAccess: true,
        });
      }
    }

    await rm(probeImagePath, { force: true });
    if (process.env.DATABASE_URL === `file:${localSmokeDatabasePath}`) {
      await rm(localSmokeDatabasePath, { force: true });
    }
    await payload?.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
