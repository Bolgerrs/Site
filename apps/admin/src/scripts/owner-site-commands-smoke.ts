import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { executeOwnerSiteCommand, getOwnerSitePageTree } from "../lib/admin-bff/page-commands.ts";
import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";
import { syncLaunchLocales } from "../lib/payload/locales.ts";
import { syncEditorialPagesSectionsAndNavigation } from "../lib/payload/page-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-owner-site-commands-smoke.db");

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

function assertNoDirectRawHrefs(scope: string, hrefs: Array<string | undefined>) {
  const leaks = hrefs.filter((href): href is string => Boolean(href && isRawAdminHref(href)));
  assert.deepEqual(leaks, [], `${scope} should not expose direct raw collection hrefs.`);
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const probeImagePath = path.resolve(adminRuntime.tempDir, "owner-site-commands-smoke.png");
  const payload = await getPayload({ config, cron: true });
  const req = {
    payload,
    user: { role: "owner" },
  } as never;
  const suffix = Date.now();

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
        altText: "Owner command smoke hero image",
        approvalStatus: "approved",
        assetTitle: "Owner command smoke still",
        assetType: "image",
        audienceMode: "public",
        internalCode: `MAS_OWNER_COMMAND_${suffix}`,
        primaryLocale: "en",
        publicationReadiness: "production-ready",
        referenceOnlyNotProductionAsset: false,
        rightsStatus: "production-approved",
        sourceCategory: "internal",
        status: "published",
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
    const pageId = String(homepage.id);
    const sections = Array.isArray(homepage.sections) ? homepage.sections : [];
    const heroBlockId = getRelationId(sections[0]?.section);

    assert.ok(heroBlockId, "Homepage hero block should exist after page seed.");

    const tree = await getOwnerSitePageTree(payload, req, { selected: pageId });
    assert.ok(tree.pages.some((page) => page.id === pageId), "Owner page tree should include homepage.");

    const contentResult = await executeOwnerSiteCommand(payload, req, {
      action: "page.content.save",
      payload: {
        heroPrimaryCtaLabel: "Book a private viewing",
        heroPrimaryCtaTarget: "/contact",
        heroSummary: "Owner command smoke updated homepage hero copy.",
        pageId,
      },
    });
    assert.equal(contentResult.ok, true);
    assert.equal(contentResult.siteWorkspace.selectedPage?.summary, "Owner command smoke updated homepage hero copy.");

    await executeOwnerSiteCommand(payload, req, {
      action: "block.content.save",
      payload: {
        blockId: heroBlockId,
        pageId,
        supportingLabel: "Owner API media-ready hero",
        title: "Owner command hero title",
      },
    });

    await executeOwnerSiteCommand(payload, req, {
      action: "block.media.replace",
      payload: {
        altText: "Updated through owner site command smoke",
        blockId: heroBlockId,
        mediaId: mediaAsset.id,
        pageId,
        slot: "hero",
      },
    });

    await executeOwnerSiteCommand(payload, req, {
      action: "block.visibility.set",
      payload: {
        blockId: heroBlockId,
        pageId,
        visible: false,
      },
    });
    const visibleAgain = await executeOwnerSiteCommand(payload, req, {
      action: "block.visibility.set",
      payload: {
        blockId: heroBlockId,
        pageId,
        visible: true,
      },
    });
    assert.equal(visibleAgain.siteWorkspace.selectedPage?.blocks.find((block) => block.id === String(heroBlockId))?.visible, true);

    const reordered = await executeOwnerSiteCommand(payload, req, {
      action: "block.reorder",
      payload: {
        orderedBlockIds: sections
          .slice()
          .reverse()
          .map((row: Record<string, unknown>) => getRelationId(row.section))
          .filter(Boolean),
        pageId,
      },
    });
    assert.equal(reordered.siteWorkspace.selectedPage?.blocks[0]?.order, 10);

    const added = await executeOwnerSiteCommand(payload, req, {
      action: "block.add",
      payload: {
        body: "Temporary owner command smoke block.",
        internalCode: `SEC_OWNER_COMMAND_${suffix}`,
        pageId,
        previewLabel: "Owner command temporary block",
        sectionKey: `owner-command-${suffix}`,
        sectionType: "overview",
        title: "Owner command temporary block",
        visible: true,
      },
    });
    const addedBlock = added.siteWorkspace.selectedPage?.blocks.find((block) => block.label === "Owner command temporary block");
    assert.ok(addedBlock, "Add block command should return new block in focused workspace state.");

    await executeOwnerSiteCommand(payload, req, {
      action: "block.delete",
      payload: {
        blockId: addedBlock?.id,
        pageId,
      },
    });

    const duplicate = await executeOwnerSiteCommand(payload, req, {
      action: "page.duplicate",
      payload: {
        internalCode: `PAGE_OWNER_COMMAND_DUP_${suffix}`,
        slug: `owner-command-copy-${suffix}`,
        sourcePageId: pageId,
        title: "Owner command page copy",
      },
    });
    assert.ok(duplicate.selectedPageId, "Duplicate command should focus the new page.");

    await executeOwnerSiteCommand(payload, req, {
      action: "page.order",
      payload: {
        navigationOrder: 15,
        pageId: duplicate.selectedPageId,
      },
    });
    await executeOwnerSiteCommand(payload, req, {
      action: "page.visibility.set",
      payload: {
        pageId: duplicate.selectedPageId,
        visible: false,
      },
    });
    await executeOwnerSiteCommand(payload, req, {
      action: "page.seo.save",
      payload: {
        locale: "en",
        metaDescription: "Owner command smoke SEO description.",
        metaTitle: "Owner Command Smoke SEO",
        pageId,
      },
    });

    const updatedHomepage = await payload.findByID({
      collection: "pages",
      depth: 1,
      id: pageId,
      overrideAccess: true,
    }) as unknown as Record<string, unknown>;
    const updatedHero = await payload.findByID({
      collection: "page-sections",
      depth: 0,
      id: heroBlockId,
      overrideAccess: true,
    }) as unknown as Record<string, unknown>;
    const updatedMedia = await payload.findByID({
      collection: "media-assets",
      depth: 0,
      id: mediaAsset.id,
      overrideAccess: true,
    }) as unknown as Record<string, unknown>;
    const auditEvents = await payload.find({
      collection: "audit-events",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "-happenedAt",
    });

    assert.equal(updatedHomepage.heroPrimaryCtaLabel, "Book a private viewing");
    assert.equal(updatedHero.title, "Owner command hero title");
    assert.equal(updatedMedia.altText, "Updated through owner site command smoke");
    assert.ok(auditEvents.docs.some((event) => event.action === "owner-page-content-save"));
    assert.ok(auditEvents.docs.some((event) => event.action === "owner-block-media-replace"));
    assertNoDirectRawHrefs("owner command selected page tabs", contentResult.siteWorkspace.selectedPage?.tabs.map((entry) => entry.href) ?? []);
    assertNoDirectRawHrefs("owner command selected page blocks", contentResult.siteWorkspace.selectedPage?.blocks.map((entry) => entry.editHref) ?? []);

    console.log("owner-site-commands-smoke: ok");
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
