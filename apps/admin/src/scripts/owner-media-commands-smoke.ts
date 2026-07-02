import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { executeOwnerMediaCommand } from "../lib/admin-bff/media-commands.ts";
import { getMediaWorkspaceSnapshot } from "../lib/payload/media-workspace.ts";
import { syncLaunchLocales } from "../lib/payload/locales.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-owner-media-commands-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function getRelationId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return null;
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const firstImagePath = path.resolve(adminRuntime.tempDir, "owner-media-command-first.png");
  const replacementImagePath = path.resolve(adminRuntime.tempDir, "owner-media-command-replacement.png");
  const payload = await getPayload({ config, cron: true });
  const req = {
    payload,
    user: { role: "owner" },
  } as never;
  const suffix = Date.now();
  const createdIds: Array<{
    collection: "media-assets" | "page-sections" | "pages" | "product-documents" | "product-media";
    id: number | string;
  }> = [];

  try {
    await mkdir(adminRuntime.tempDir, { recursive: true });
    await mkdir(adminRuntime.uploadsDir, { recursive: true });
    const probePng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
      "base64",
    );
    await writeFile(firstImagePath, probePng);
    await writeFile(replacementImagePath, probePng);

    await syncLaunchLocales(payload);

    const upload = await executeOwnerMediaCommand(payload, req, {
      action: "media.upload",
      payload: {
        altText: "Owner uploaded hero candidate",
        assetTitle: "Owner media command upload",
        fileName: "owner-media-command-first.png",
        filePath: firstImagePath,
        internalCode: `MAS_OWNER_MEDIA_COMMAND_${suffix}`,
      },
    });
    assert.equal(upload.ok, true);
    assert.ok(upload.assetId, "Upload command should return an asset id.");
    const uploadedAssetId = Number(upload.assetId);
    assert.equal(Number.isFinite(uploadedAssetId), true, "Uploaded asset id should be numeric in sqlite smoke.");
    createdIds.push({ collection: "media-assets", id: upload.assetId });

    const replace = await executeOwnerMediaCommand(payload, req, {
      action: "media.replace",
      payload: {
        assetId: upload.assetId,
        changeReason: "Smoke replacement while preserving usage links.",
        fileName: "owner-media-command-replacement.png",
        filePath: replacementImagePath,
      },
    });
    assert.equal(replace.assetId, upload.assetId);

    await executeOwnerMediaCommand(payload, req, {
      action: "media.metadata.save",
      payload: {
        altText: "Owner command updated alt text",
        assetId: upload.assetId,
        caption: "Owner command caption",
      },
    });

    const desktopCrop = await executeOwnerMediaCommand(payload, req, {
      action: "media.crop.save",
      payload: {
        assetId: upload.assetId,
        crop: {
          focalX: 0.37,
          focalY: 0.49,
          height: 0.82,
          width: 0.91,
          x: 0.03,
          y: 0.07,
        },
        preset: "desktop",
      },
    });
    assert.equal(desktopCrop.snapshot.assetDetail?.responsiveCrop.desktop.focalX, 0.37);

    const crop = await executeOwnerMediaCommand(payload, req, {
      action: "media.crop.save",
      payload: {
        assetId: upload.assetId,
        crop: {
          focalX: 0.42,
          focalY: 0.58,
          height: 0.8,
          width: 0.9,
          x: 0.05,
          y: 0.1,
        },
        preset: "mobile",
      },
    });
    assert.equal(crop.snapshot.assetDetail?.responsiveCrop.mobile.focalX, 0.42);

    const document = await payload.create({
      collection: "product-documents",
      data: {
        approvalStatus: "pending",
        attachmentScope: "product-default",
        documentTitle: "Owner media command document",
        documentType: "brochure",
        downloadBehavior: "direct-download",
        internalCode: `DOC_OWNER_MEDIA_COMMAND_${suffix}`,
        order: 10,
        overrideMode: "inherit-parent",
        primaryLocale: "en",
        productKey: "owner-media-command-product",
        productLabelSnapshot: "Owner media command product",
        rightsStatus: "generated-pending-review",
        sourceCategory: "owner-provided",
        sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-BFF-014-media-workspace-plug-play-rebuild.md",
        status: "draft",
        surfaceTargets: ["pdp-downloads"],
        translationPriority: "normal",
        visibilityMode: "preview-only",
      },
      draft: false,
      filePath: firstImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "product-documents", id: document.id });

    const section = await payload.create({
      collection: "page-sections",
      data: {
        heroContent: {
          heroMedia: uploadedAssetId,
        },
        internalCode: `SEC_OWNER_MEDIA_COMMAND_${suffix}`,
        pageFamiliesAllowed: ["home"],
        previewLabel: "Owner media command section",
        primaryLocale: "en",
        sectionKey: `owner-media-command-${suffix}`,
        sectionType: "hero",
        sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-BFF-006-media-upload-replace-usage-crop-api.md",
        status: "draft",
        title: "Owner media command section",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "page-sections", id: section.id });

    const page = await payload.create({
      collection: "pages",
      data: {
        approvalStatus: "pending",
        canonicalPath: `/preview/owner-media-command-${suffix}`,
        heroSummary: "Owner media command page.",
        internalCode: `PAGE_OWNER_MEDIA_COMMAND_${suffix}`,
        layoutMode: "brand-editorial",
        pageFamily: "hidden-preview",
        previewPath: `/preview/owner-media-command-${suffix}`,
        primaryLocale: "en",
        routePath: `/preview/owner-media-command-${suffix}`,
        sections: [{ order: 10, section: section.id, visible: true }],
        seo: {
          description: "Owner media command page.",
          title: "Owner media command page",
        },
        slug: `owner-media-command-${suffix}`,
        sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-BFF-006-media-upload-replace-usage-crop-api.md",
        status: "draft",
        title: "Owner media command page",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "pages", id: page.id });

    await executeOwnerMediaCommand(payload, req, {
      action: "media.assign",
      payload: {
        mediaId: upload.assetId,
        pageId: page.id,
        slot: "cover",
        targetType: "page",
      },
    });
    const updatedPage = (await payload.findByID({
      collection: "pages",
      depth: 0,
      id: page.id,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;
    assert.equal(String(getRelationId(updatedPage.coverMedia)), String(upload.assetId));

    await executeOwnerMediaCommand(payload, req, {
      action: "media.assign",
      payload: {
        documentId: document.id,
        pageId: page.id,
        slot: "document",
        targetType: "page",
      },
    });
    const pageWithDocument = (await payload.findByID({
      collection: "pages",
      depth: 0,
      id: page.id,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;
    assert.equal(
      (Array.isArray(pageWithDocument.relatedDocuments) ? pageWithDocument.relatedDocuments : []).some(
        (entry) => String(getRelationId(entry)) === String(document.id),
      ),
      true,
      "Page document assignment should update relatedDocuments.",
    );

    await executeOwnerMediaCommand(payload, req, {
      action: "media.assign",
      payload: {
        blockId: section.id,
        mediaId: upload.assetId,
        slot: "hero",
        targetType: "block",
      },
    });

    await executeOwnerMediaCommand(payload, req, {
      action: "media.assign",
      payload: {
        blockId: section.id,
        documentId: document.id,
        slot: "document",
        targetType: "block",
      },
    });
    const blockWithDocument = (await payload.findByID({
      collection: "page-sections",
      depth: 0,
      id: section.id,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;
    const blockDocuments = ((blockWithDocument.journalDownloadsContent ?? {}) as { documents?: unknown[] }).documents ?? [];
    assert.equal(
      blockDocuments.some((entry) => String(getRelationId(entry)) === String(document.id)),
      true,
      "Block document assignment should update journalDownloadsContent.documents.",
    );

    await executeOwnerMediaCommand(payload, req, {
      action: "media.assign",
      payload: {
        mediaId: upload.assetId,
        productKey: "owner-media-command-product",
        productLabel: "Owner media command product",
        slot: "hero",
        targetType: "product",
      },
    });
    const productPlacements = await payload.find({
      collection: "product-media",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        productKey: {
          equals: "owner-media-command-product",
        },
      },
    });
    const placement = productPlacements.docs[0] as unknown as Record<string, unknown> | undefined;
    assert.ok(placement?.id, "Product media assignment should create a placement.");
    createdIds.push({ collection: "product-media", id: placement.id as string | number });

    await executeOwnerMediaCommand(payload, req, {
      action: "media.assign",
      payload: {
        documentId: document.id,
        productKey: "owner-media-command-product",
        productLabel: "Owner media command product",
        slot: "document",
        targetType: "product",
      },
    });
    const productDocument = (await payload.findByID({
      collection: "product-documents",
      depth: 0,
      id: document.id,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;
    assert.equal(productDocument.productKey, "owner-media-command-product");

    const replacedProductDocument = await executeOwnerMediaCommand(payload, req, {
      action: "document.replace",
      payload: {
        documentId: document.id,
        fileName: "owner-media-command-replacement.png",
        filePath: replacementImagePath,
        versionLabel: "replacement-smoke",
      },
    });
    assert.equal(replacedProductDocument.documentId, String(document.id));
    const productDocumentAfterReplace = (await payload.findByID({
      collection: "product-documents",
      depth: 0,
      id: document.id,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;
    assert.equal(productDocumentAfterReplace.productKey, "owner-media-command-product");
    assert.equal(productDocumentAfterReplace.versionLabel, "replacement-smoke");

    const usage = await executeOwnerMediaCommand(payload, req, {
      action: "media.where-used",
      payload: {
        assetId: upload.assetId,
      },
    });
    assert.equal(
      usage.snapshot.assetDetail?.linkedPages.some((entry) => entry.label.includes("Owner media command page")),
      true,
      "Where-used graph should include the owner page.",
    );
    assert.equal(
      usage.snapshot.assetDetail?.linkedPlacements.some((entry) => entry.label.includes("Owner media command product")),
      true,
      "Where-used graph should include product placement.",
    );

    const snapshot = await getMediaWorkspaceSnapshot(payload, req, {
      selected: upload.assetId,
    });
    assert.equal(snapshot.assetDetail?.altText, "Owner command updated alt text");
    assert.equal(snapshot.assetDetail?.responsiveCrop.mobile.focalY, 0.58);
    assert.equal(
      snapshot.assetDetail?.linkedPlacements.some((entry) => entry.href.includes("/admin/products") && entry.href.includes("panel=media")),
      true,
      "Asset product where-used link should return to the product media editor.",
    );
    const documentSnapshot = await getMediaWorkspaceSnapshot(payload, req, {
      filter: "documents",
      selected: `document:${document.id}`,
    });
    assert.equal(
      documentSnapshot.documentDetail?.linkedProducts.some((entry) => entry.href.includes("/admin/products") && entry.href.includes("panel=media")),
      true,
      "Document where-used link should return to the product media editor.",
    );

    console.log(
      JSON.stringify(
        {
          assetId: upload.assetId,
          documentProductLinks: documentSnapshot.documentDetail?.linkedProducts.length ?? 0,
          linkedPages: snapshot.assetDetail?.linkedPages.length ?? 0,
          linkedPlacements: snapshot.assetDetail?.linkedPlacements.length ?? 0,
          documentCommand: true,
          documentReplaceCommand: true,
          desktopFocalX: snapshot.assetDetail?.responsiveCrop.desktop.focalX ?? null,
          productDocumentCommand: true,
          productWhereUsedHref: snapshot.assetDetail?.linkedPlacements[0]?.href ?? null,
          mobileFocalX: snapshot.assetDetail?.responsiveCrop.mobile.focalX ?? null,
          uploadCommand: true,
        },
        null,
        2,
      ),
    );
  } finally {
    for (const entry of createdIds.reverse()) {
      await payload.delete({
        collection: entry.collection,
        id: entry.id,
        overrideAccess: true,
      });
    }
    await rm(firstImagePath, { force: true });
    await rm(replacementImagePath, { force: true });
    if (process.env.DATABASE_URL === `file:${localSmokeDatabasePath}`) {
      await rm(localSmokeDatabasePath, { force: true });
    }
    await payload.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
