import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type PayloadRequest } from "payload";

import { buildEditableFieldHref } from "../lib/admin-bff/surface-registry.ts";
import {
  applyMediaWorkspaceUpdate,
  getMediaWorkspaceSnapshot,
} from "../lib/payload/media-workspace.ts";
import { syncLaunchLocales } from "../lib/payload/locales.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-media-workspace-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const probeImagePath = path.resolve(adminRuntime.tempDir, "media-workspace-smoke.png");
  let payload: Awaited<ReturnType<typeof getPayload>> | null = null;
  const createdIds: Array<{
    collection: "media-assets" | "page-sections" | "pages" | "product-documents" | "product-media";
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

    const req = {
      payload,
      user: {
        id: "smoke-admin",
        role: "admin",
      },
    } as unknown as PayloadRequest;

    const mediaAsset = await payload.create({
      collection: "media-assets",
      data: {
        approvalStatus: "pending",
        assetTitle: "Montelar smoke asset",
        assetType: "image",
        audienceMode: "public",
        internalCode: "MAS_MEDIA_WORKSPACE_SMOKE_01",
        primaryLocale: "en",
        publicationReadiness: "blocked",
        referenceOnlyNotProductionAsset: false,
        rightsStatus: "generated-pending-review",
        sourceCategory: "internal",
        status: "draft",
        translationPriority: "normal",
      },
      draft: false,
      filePath: probeImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "media-assets", id: mediaAsset.id });

    const placement = await payload.create({
      collection: "product-media",
      data: {
        approvalStatus: "pending",
        attachmentScope: "product-default",
        fallbackBehavior: "use-product-default",
        internalCode: "PMM_MEDIA_WORKSPACE_SMOKE_01",
        mediaAsset: mediaAsset.id,
        order: 1,
        overrideMode: "inherit-parent",
        ownerReviewRequired: false,
        primaryLocale: "en",
        productKey: "smoke-product",
        productLabelSnapshot: "Smoke Product",
        rightsStatus: "generated-pending-review",
        slot: "hero",
        sourceCategory: "internal",
        status: "draft",
        surfaceTargets: ["pdp"],
        translationPriority: "normal",
        usageIntent: "editorial-preview",
        visibilityMode: "preview-only",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "product-media", id: placement.id });

    let snapshot = await getMediaWorkspaceSnapshot(payload, req, {
      selected: String(mediaAsset.id),
    });
    assert.equal(
      snapshot.filters.some((filter) => filter.id === "heavy"),
      true,
      "Media workspace should expose a heavy-file queue.",
    );
    assert.equal(snapshot.assetDetail?.publicationReadiness, "blocked");
    assert.equal(snapshot.assetDetail?.placementEditor?.visibilityMode, "preview-only");

    await applyMediaWorkspaceUpdate(payload, req, {
      altText: "Smoke asset ready for public placement",
      approvalStatus: "approved",
      audienceMode: "public",
      publicationReadiness: "production-ready",
      rightsStatus: "production-approved",
      status: "published",
      targetId: String(mediaAsset.id),
      targetType: "asset",
    });

    await applyMediaWorkspaceUpdate(payload, req, {
      approvalStatus: "approved",
      rightsStatus: "production-approved",
      status: "published",
      surfaceTargets: ["pdp", "listing-card"],
      targetId: String(placement.id),
      targetType: "placement",
      usageIntent: "production",
      visibilityMode: "public",
    });

    const document = await payload.create({
      collection: "product-documents",
      data: {
        approvalStatus: "pending",
        attachmentScope: "product-default",
        documentTitle: "Smoke overview",
        documentType: "brochure",
        downloadBehavior: "open-viewer",
        internalCode: "DOC_MEDIA_WORKSPACE_SMOKE_01",
        order: 1,
        ownerReviewRequired: false,
        previewAsset: mediaAsset.id,
        primaryLocale: "en",
        productKey: "smoke-product",
        productLabelSnapshot: "Smoke Product",
        rightsStatus: "production-approved",
        sourceCategory: "internal",
        status: "draft",
        surfaceTargets: ["admin-sidebar"],
        translationPriority: "normal",
        visibilityMode: "preview-only",
        overrideMode: "inherit-parent",
      },
      draft: false,
      filePath: probeImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "product-documents", id: document.id });

    await applyMediaWorkspaceUpdate(payload, req, {
      approvalStatus: "approved",
      downloadBehavior: "direct-download",
      publicLabel: "Overview PDF",
      rightsStatus: "production-approved",
      status: "published",
      surfaceTargets: ["pdp-downloads"],
      targetId: String(document.id),
      targetType: "document",
      versionLabel: "v1.0",
      visibilityMode: "public",
    });

    const heroSection = await payload.create({
      collection: "page-sections",
      data: {
        heroContent: {
          heroMedia: mediaAsset.id,
        },
        internalCode: "SEC_MEDIA_WORKSPACE_SMOKE_HOME",
        pageFamiliesAllowed: ["home"],
        previewLabel: "Homepage smoke hero",
        primaryLocale: "en",
        sectionKey: "home-media-smoke",
        sectionType: "hero",
        status: "published",
        title: "Homepage smoke hero",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "page-sections", id: heroSection.id });

    const homePage = await payload.create({
      collection: "pages",
      data: {
        approvalStatus: "approved",
        canonicalPath: "/",
        heroSummary: "Homepage media smoke route",
        internalCode: "PAGE_MEDIA_WORKSPACE_SMOKE_HOME",
        layoutMode: "brand-editorial",
        pageFamily: "home",
        previewPath: "/en",
        primaryLocale: "en",
        relatedDocuments: [document.id],
        routePath: "/",
        seo: {
          description: "Homepage media smoke description",
          title: "Montelar | Homepage media smoke",
        },
        sections: [{ order: 10, section: heroSection.id, visible: true }],
        slug: "home",
        status: "published",
        title: "Home",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });
    createdIds.push({ collection: "pages", id: homePage.id });

    snapshot = await getMediaWorkspaceSnapshot(payload, req, {
      selected: String(mediaAsset.id),
    });
    assert.equal(snapshot.assetDetail?.publicationReadiness, "production-ready");
    assert.equal(snapshot.assetDetail?.placementEditor?.status, "published");
    assert.equal(snapshot.assetDetail?.placementEditor?.visibilityMode, "public");

    const homepageSnapshot = await getMediaWorkspaceSnapshot(payload, req, {
      context: "homepage",
      selected: String(mediaAsset.id),
    });
    assert.equal(homepageSnapshot.activeContext, "homepage");
    assert.equal(
      homepageSnapshot.focusPageHref,
      buildEditableFieldHref({
        fieldPath: "media",
        ownerId: homePage.id,
        ownerType: "page",
      }),
    );
    assert.equal(
      homepageSnapshot.cards.some((card) => card.recordType === "asset" && card.recordId === String(mediaAsset.id)),
      true,
    );
    assert.equal(
      homepageSnapshot.assetDetail?.linkedPages.some((entry) => entry.meta.includes("homepage")),
      true,
    );
    assert.equal(
      homepageSnapshot.assetDetail?.linkedDocuments.some(
        (entry) =>
          entry.href.startsWith("/admin/media?filter=documents&selected=document%3A") ||
          entry.href.startsWith("/admin/media?filter=documents&selected=document:"),
      ),
      true,
      "Linked document preview rows should stay inside the media workspace, not raw collections.",
    );
    assert.equal(
      homepageSnapshot.assetDetail?.linkedDocuments.some((entry) => entry.href.includes("/admin/collections")),
      false,
      "Linked document preview rows must not expose direct raw collections.",
    );

    const documentSnapshot = await getMediaWorkspaceSnapshot(payload, req, {
      filter: "documents",
      selected: String(document.id),
    });
    assert.equal(documentSnapshot.documentDetail?.versionLabel, "v1.0");
    assert.equal(documentSnapshot.documentDetail?.visibilityMode, "public");

    console.log(
      JSON.stringify(
        {
          assetId: mediaAsset.id,
          documentId: document.id,
          placementId: placement.id,
          readiness: snapshot.assetDetail?.publicationReadiness ?? null,
          visibilityMode: snapshot.assetDetail?.placementEditor?.visibilityMode ?? null,
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
