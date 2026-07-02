import assert from "node:assert/strict";
import { access, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { syncInquiryFormsAndSampleLeads } from "../lib/payload/inquiry-seed.ts";
import { syncMediaDocumentsAndCreativeRecords } from "../lib/payload/media-seed.ts";
import { syncEditorialPagesSectionsAndNavigation } from "../lib/payload/page-seed.ts";
import { adminRuntime } from "../lib/runtime.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(
  appRoot,
  ".tmp",
  "payload-media-documents-and-creative-seed-smoke.db",
);

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function copyIfExists(sourcePath: string, targetPath: string) {
  try {
    await access(sourcePath);
    await copyFile(sourcePath, targetPath);
  } catch {
    // The smoke DB can still be created from scratch if the baseline file is absent.
  }
}

async function prepareSmokeDatabase() {
  await copyIfExists(adminRuntime.defaultSqlitePath, localSmokeDatabasePath);
  await copyIfExists(`${adminRuntime.defaultSqlitePath}-wal`, `${localSmokeDatabasePath}-wal`);
  await copyIfExists(`${adminRuntime.defaultSqlitePath}-shm`, `${localSmokeDatabasePath}-shm`);
}

async function main() {
  await prepareSmokeDatabase();
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncCatalogHierarchyAndProducts(payload);
    await syncEditorialPagesSectionsAndNavigation(payload);
    await syncInquiryFormsAndSampleLeads(payload);

    const firstRun = await syncMediaDocumentsAndCreativeRecords(payload);
    const secondRun = await syncMediaDocumentsAndCreativeRecords(payload);

    const mediaAssets = await payload.find({
      collection: "media-assets",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      sort: "internalCode",
      where: {
        internalCode: {
          like: "MAS_",
        },
      },
    });
    const productMedia = await payload.find({
      collection: "product-media",
      depth: 1,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      sort: "internalCode",
      where: {
        internalCode: {
          like: "PMM_",
        },
      },
    });
    const productDocuments = await payload.find({
      collection: "product-documents",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      sort: "internalCode",
      where: {
        internalCode: {
          like: "DOC_",
        },
      },
    });
    const homePage = await payload.find({
      collection: "pages",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      where: {
        internalCode: {
          equals: "PAGE_HOME",
        },
      },
    });
    const downloadsPage = await payload.find({
      collection: "pages",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      where: {
        internalCode: {
          equals: "PAGE_DOWNLOADS",
        },
      },
    });

    assert.equal(firstRun.mediaAssetCount, 7);
    assert.equal(firstRun.productMediaCount, 4);
    assert.equal(firstRun.productDocumentCount, 2);
    assert.equal(secondRun.mediaAssetOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.productMediaOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.productDocumentOperations.every((entry) => entry.operation === "updated"), true);

    const creativeBoard = mediaAssets.docs.find(
      (entry) => entry.internalCode === "MAS_CREATIVE_BRIEF_BOARD_01",
    );
    const creativeCandidatePlacement = productMedia.docs.find(
      (entry) => entry.internalCode === "PMM_VISION_MAX_CREATIVE_REVIEW_01",
    );
    const privateCreativeBrief = productDocuments.docs.find(
      (entry) => entry.internalCode === "DOC_LIVING_GLASS_CREATIVE_REVIEW_01",
    );
    const publicBrochure = productDocuments.docs.find(
      (entry) => entry.internalCode === "DOC_VISION_MAX_PUBLIC_OVERVIEW_01",
    );

    assert.equal(creativeBoard?.rightsStatus, "reference-only");
    assert.equal(creativeBoard?.referenceOnlyNotProductionAsset, true);
    assert.equal(creativeCandidatePlacement?.visibilityMode, "preview-only");
    assert.equal(creativeCandidatePlacement?.usageIntent, "creative-review");
    assert.equal(creativeCandidatePlacement?.rightsStatus, "reference-only");
    assert.equal(privateCreativeBrief?.visibilityMode, "internal-only");
    assert.equal(privateCreativeBrief?.rightsStatus, "reference-only");
    assert.equal(publicBrochure?.visibilityMode, "public");

    const homePageDoc = homePage.docs[0];
    const downloadsPageDoc = downloadsPage.docs[0];

    assert.equal(typeof homePageDoc?.heroMedia, "number");
    assert.equal(Array.isArray(downloadsPageDoc?.relatedDocuments), true);
    assert.equal(
      downloadsPageDoc?.relatedDocuments?.some((value: number | { id?: number | string }) =>
        typeof value === "number"
          ? value === publicBrochure?.id
          : value?.id === publicBrochure?.id,
      ),
      true,
    );

    let blockedUnsafePromotion = false;

    try {
      await payload.create({
        collection: "product-media",
        data: {
          approvalStatus: "approved",
          attachmentScope: "product-default",
          fallbackBehavior: "use-product-default",
          internalCode: "PMM_SMOKE_UNSAFE_CREATIVE_PROMOTION",
          mediaAsset: creativeBoard?.id,
          order: 100,
          overrideMode: "replace-slot",
          ownerReviewRequired: false,
          primaryLocale: "en",
          productKey: "vision-max-premium",
          productLabelSnapshot: "Vision MAX Premium",
          rightsStatus: "reference-only",
          slot: "hero",
          sourceCategory: "internal",
          status: "published",
          surfaceTargets: ["pdp"],
          translationPriority: "low",
          usageIntent: "production",
          visibilityMode: "public",
        },
        draft: false,
        overrideAccess: true,
        showHiddenFields: true,
      });
    } catch (error) {
      blockedUnsafePromotion = /product media validation failed/i.test(
        error instanceof Error ? error.message : String(error),
      );
    }

    assert.equal(blockedUnsafePromotion, true);

    console.log("media-documents-and-creative-seed-smoke: ok");
  } finally {
    await payload.destroy();
    await rm(localSmokeDatabasePath, { force: true });
    await rm(`${localSmokeDatabasePath}-wal`, { force: true });
    await rm(`${localSmokeDatabasePath}-shm`, { force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
