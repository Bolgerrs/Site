import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";
import { getPageEditorSnapshot, getPagePreviewUrl } from "../lib/payload/page-editor.ts";
import { getSiteWorkspaceSnapshot } from "../lib/payload/site-workspace.ts";
import { syncLaunchLocales } from "../lib/payload/locales.ts";
import { syncEditorialPagesSectionsAndNavigation } from "../lib/payload/page-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-page-editor-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function assertNoDirectRawHrefs(scope: string, hrefs: Array<string | undefined>) {
  const leaks = hrefs.filter((href): href is string => Boolean(href && isRawAdminHref(href)));
  assert.deepEqual(leaks, [], `${scope} should not expose direct raw collection hrefs.`);
}

function assertNoFirstLayerRawHrefs(scope: string, hrefs: Array<string | undefined>) {
  assertNoDirectRawHrefs(scope, hrefs);

  const advancedLeaks = hrefs.filter((href): href is string => Boolean(href?.startsWith("/admin/advanced?raw=")));
  assert.deepEqual(advancedLeaks, [], `${scope} should not use advanced raw handoff for owner actions.`);
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const probeImagePath = path.resolve(adminRuntime.tempDir, "page-editor-smoke.png");
  const payload = await getPayload({ config, cron: true });
  const mediaInternalCode = `MAS_PAGE_EDITOR_SMOKE_${Date.now()}`;

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

    await syncLaunchLocales(payload);
    await syncEditorialPagesSectionsAndNavigation(payload);

    const mediaAsset = await payload.create({
      collection: "media-assets",
      data: {
        approvalStatus: "approved",
        assetTitle: "Page editor smoke hero still",
        assetType: "image",
        audienceMode: "public",
        internalCode: mediaInternalCode,
        primaryLocale: "en",
        publicationReadiness: "production-ready",
        referenceOnlyNotProductionAsset: false,
        rightsStatus: "production-approved",
        sourceCategory: "internal",
        status: "published",
        altText: "Smoke hero image",
        translationPriority: "normal",
      },
      draft: false,
      filePath: probeImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const homepage = (
      await payload.find({
        collection: "pages",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          pageFamily: {
            equals: "home",
          },
        },
      })
    ).docs[0] as unknown as Record<string, unknown>;

    const homepageSections = Array.isArray(homepage.sections) ? homepage.sections : [];
    const homepageHeroId = homepageSections[0]?.section?.id ?? homepageSections[0]?.section;

    assert.ok(homepageHeroId, "Homepage hero section should exist after page seed.");

    await payload.update({
      collection: "page-sections",
      id: homepageHeroId,
      data: {
        heroContent: {
          supportingLabel: "Quiet luxury",
          heroMedia: mediaAsset.id,
        },
      },
      overrideAccess: true,
      showHiddenFields: true,
    });

    const updatedHomepage = await payload.update({
      collection: "pages",
      id: homepage.id as number | string,
      data: {
        heroPrimaryCtaLabel: "Arrange a private consultation",
        heroPrimaryCtaTarget: "/contact",
        heroSummary: "Updated homepage copy from the curated page editor smoke.",
        introBody: "Homepage intro is editable without touching route code.",
        relatedDocuments: [],
        sections: [
          ...(homepageSections[1]
            ? [{ ...homepageSections[1], order: 10, visible: true }]
            : []),
          ...(homepageSections[0]
            ? [{ ...homepageSections[0], order: 20, visible: true }]
            : []),
          ...homepageSections.slice(2).map((section: Record<string, unknown>, index: number) => ({
            ...section,
            order: index * 10 + 30,
            visible: section.visible !== false,
          })),
        ],
      },
      depth: 1,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const brandPage = (
      await payload.find({
        collection: "pages",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          routePath: {
            equals: "/brand",
          },
        },
      })
    ).docs[0] as unknown as Record<string, unknown>;

    const brandSections = Array.isArray(brandPage.sections) ? brandPage.sections : [];

    const updatedBrandPage = await payload.update({
      collection: "pages",
      id: brandPage.id as number | string,
      data: {
        heroPrimaryCtaLabel: "Request a private brand presentation",
        heroPrimaryCtaTarget: "/contact",
        heroSummary: "Brand route copy changed through the curated page editor workspace.",
        sections: brandSections.map((section: Record<string, unknown>, index: number) => ({
          ...section,
          order: index === 0 ? 20 : 10,
          visible: true,
        })),
      },
      depth: 1,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const existingHomepageSeo = (
      await payload.find({
        collection: "seo-entries",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            {
              ownerType: {
                equals: "page",
              },
            },
            {
              ownerPage: {
                equals: updatedHomepage.id,
              },
            },
            {
              locale: {
                equals: "en",
              },
            },
          ],
        },
      })
    ).docs[0] as Record<string, unknown> | undefined;

    const homepageSeoData = {
      approvalStatus: "approved",
      canonicalMode: "owner-default",
      hreflangEnabled: true,
      includeInSitemap: true,
      indexingMode: "index,follow",
      internalCode: "SEO_PAGE_EDITOR_HOME_EN",
      locale: "en",
      metaDescription: "Homepage SEO metadata from page editor smoke.",
      metaTitle: "Montelar Home | Page Editor Smoke",
      ownerPage: updatedHomepage.id,
      ownerType: "page",
      previewOnly: false,
      primaryLocale: "en",
      publicationReadiness: "production-ready",
      routePath: "/",
      socialCardStyle: "summary_large_image",
      sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-027-page-section-editor-workspace.md",
      status: "published",
      translationPriority: "normal",
    } as const;

    if (existingHomepageSeo?.id != null) {
      await payload.update({
        collection: "seo-entries",
        data: homepageSeoData,
        draft: false,
        id: existingHomepageSeo.id as number | string,
        overrideAccess: true,
        showHiddenFields: true,
      });
    } else {
      await payload.create({
        collection: "seo-entries",
        data: homepageSeoData,
        draft: false,
        overrideAccess: true,
        showHiddenFields: true,
      });
    }

    const locales = await payload.find({
      collection: "locales",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
    });
    const enLocale = locales.docs.find((doc) => doc.code === "en");
    const frLocale = locales.docs.find((doc) => doc.code === "fr");

    assert.ok(enLocale && frLocale, "Expected locale seed to provide EN and FR.");

    await payload.create({
      collection: "translations",
      data: {
        fieldScope: "full-record",
        fallbackMode: "no-public-fallback",
        ownerCollection: "pages",
        ownerLabelSnapshot: "Home",
        ownerRecordKey: "home",
        primaryLocale: enLocale?.id,
        publishReadiness: "ready",
        reviewerAssignee: null,
        routeLocalizationRequired: true,
        sourceLocale: enLocale?.id,
        sourceRevisionKey: "page-editor-home-1",
        sourceRoutePathSnapshot: "/",
        sourceTitleSnapshot: "Home",
        sourceUpdatedAtSnapshot: new Date().toISOString(),
        staleSourceState: "fresh",
        status: "review",
        translationMethod: "human",
        targetLocale: frLocale?.id,
        targetRoutePath: "/fr",
        targetSlug: "accueil",
        targetTitle: "Accueil",
        workflowStage: "human-edit",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const homepageSnapshot = await getPageEditorSnapshot(
      payload,
      updatedHomepage as unknown as Record<string, unknown>,
    );
    const brandSnapshot = await getPageEditorSnapshot(
      payload,
      updatedBrandPage as unknown as Record<string, unknown>,
    );
    const siteSnapshot = await getSiteWorkspaceSnapshot(
      payload,
      {
        payload,
        user: { role: "owner" },
      } as never,
      { selected: String(updatedHomepage.id) },
    );
    const previewUrl = await getPagePreviewUrl(updatedHomepage as unknown as Record<string, unknown>, {
      payload,
      user: { role: "admin" },
    } as never);

    assert.ok(previewUrl);

    assert.equal(homepageSnapshot.sectionCount >= 2, true);
    assert.equal(homepageSnapshot.linkedMediaCount >= 1, true);
    assert.equal(homepageSnapshot.seoApprovedCount >= 1, true);
    assert.equal(homepageSnapshot.translationCount >= 1, true);
    assert.equal(homepageSnapshot.sectionSummaries[0]?.order, 10);
    assert.equal(
      homepageSnapshot.sectionSummaries[0]?.label !== homepageSnapshot.sectionSummaries[1]?.label,
      true,
    );
    assert.equal(previewUrl.includes("/api/preview"), true);
    assert.equal(previewUrl.includes("path=%2Fen"), true);
    assert.equal(brandSnapshot.sectionCount >= 1, true);
    assert.equal(brandSnapshot.listViews.some((entry) => entry.id === "family"), true);
    assertNoDirectRawHrefs("homepage editor linked workspaces", homepageSnapshot.linkedWorkspaces.map((entry) => entry.href));
    assertNoDirectRawHrefs("homepage editor list views", homepageSnapshot.listViews.map((entry) => entry.href));
    assertNoDirectRawHrefs("homepage editor sections", homepageSnapshot.sectionSummaries.map((entry) => entry.href));
    assertNoDirectRawHrefs("brand editor linked workspaces", brandSnapshot.linkedWorkspaces.map((entry) => entry.href));
    assert.ok(siteSnapshot.selectedPage, "Site workspace should expose selected page tabs.");
    assert.ok(siteSnapshot.selectedPage?.tabs.some((entry) => entry.id === "seo"));
    assert.ok(siteSnapshot.selectedPage?.tabs.some((entry) => entry.id === "media"));
    assertNoFirstLayerRawHrefs("site selected page tabs", siteSnapshot.selectedPage?.tabs.map((entry) => entry.href) ?? []);
    assertNoFirstLayerRawHrefs("site selected page actions", siteSnapshot.selectedPage?.actions.map((entry) => entry.href) ?? []);
    assertNoFirstLayerRawHrefs("site selected page blocks", siteSnapshot.selectedPage?.blocks.map((entry) => entry.editHref) ?? []);

    const publicCms = await payload.find({
      collection: "pages",
      depth: 2,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      where: {
        routePath: {
          in: ["/", "/brand"],
        },
      },
    });

    const publicHome = publicCms.docs.find((doc) => doc.routePath === "/") as Record<string, unknown> | undefined;
    const publicBrand = publicCms.docs.find((doc) => doc.routePath === "/brand") as Record<string, unknown> | undefined;

    assert.equal(publicHome?.heroPrimaryCtaLabel, "Arrange a private consultation");
    assert.equal(publicBrand?.heroPrimaryCtaLabel, "Request a private brand presentation");

    console.log("page-editor-smoke: ok");
  } finally {
    await payload.db.destroy?.();
    await rm(probeImagePath, { force: true });
    await rm(localSmokeDatabasePath, { force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
