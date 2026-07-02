import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import {
  assertNoRawModuleSettingsOutput,
  executeModuleSettingsCommand,
  getModuleSettingsSnapshot,
} from "../lib/admin-bff/module-settings-commands.ts";
import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { syncEditorialPagesSectionsAndNavigation } from "../lib/payload/page-seed.ts";
import { syncWaveZeroPlatform } from "../lib/payload/platform-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-hero-scene-settings-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function getRelationId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "number" || typeof id === "string") {
      return String(id);
    }
  }

  return null;
}

async function requireFirstRelationId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: "pages" | "product-categories" | "products",
) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
  });
  const id = getRelationId(result.docs[0]?.id);

  assert.ok(id, `Smoke needs a seeded ${collection} row.`);

  return id;
}

async function main() {
  const { adminRuntime } = await import("../lib/runtime.ts");
  const { default: config } = await import("../payload.config.ts");
  const probeImagePath = path.resolve(adminRuntime.tempDir, "hero-scene-settings-smoke.png");
  const payload = await getPayload({ config, cron: true });

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

    await syncWaveZeroPlatform(payload);
    await syncCatalogHierarchyAndProducts(payload);
    await syncEditorialPagesSectionsAndNavigation(payload);

    const ownerReq = {
      payload,
      user: {
        role: "owner",
      },
    } as never;
    const siteAdminReq = {
      payload,
      user: {
        role: "admin",
      },
    } as never;
    const mediaAsset = await payload.create({
      collection: "media-assets",
      data: {
        altText: "Hero scene smoke media",
        approvalStatus: "approved",
        assetTitle: "Hero scene smoke media",
        assetType: "image",
        audienceMode: "public",
        internalCode: `MAS_HERO_SCENE_${Date.now()}`,
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
    const linkedMediaId = getRelationId(mediaAsset.id);
    const linkedProductId = await requireFirstRelationId(payload, "products");
    const linkedCategoryId = await requireFirstRelationId(payload, "product-categories");
    const linkedPageId = await requireFirstRelationId(payload, "pages");

    assert.ok(linkedMediaId, "Smoke linked media should have an id.");

    const firstRead = await getModuleSettingsSnapshot(payload, ownerReq, {
      locale: "ru",
      moduleId: "homepage.hero-product-scene",
    });
    assert.equal(firstRead.selectedModule?.moduleId, "homepage.hero-product-scene");
    assert.ok(firstRead.selectedModule?.settings.heroScene, "Hero scene settings DTO should be present.");
    assert.ok(
      firstRead.selectedModule.settings.commandGroups.includes("Продуктовые зоны"),
      "Hero scene should expose a focused hotspot command group.",
    );
    assert.equal(firstRead.selectedModule.validation.publishReady, false);
    assert.deepEqual(assertNoRawModuleSettingsOutput(firstRead), []);

    const ctaSaved = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.save-draft",
      locale: "ru",
      moduleId: "homepage.hero-product-scene",
      settings: {
        heroScene: {
          brandText: "Montelar",
          ctaButtonHref: "/contact",
          ctaButtonLabel: "Обсудить проект",
          ctaText: "Персональная настройка изображения, звука и пространства.",
          ctaTitle: "Архитектура изображения, звука и AI дизайна",
          desktopMediaId: linkedMediaId,
          mobileMediaId: linkedMediaId,
          sloganText: "Тихая роскошь",
        },
      },
    });
    assert.equal(ctaSaved.selectedModule?.settings.heroScene?.media.desktopImageId, linkedMediaId);
    assert.equal(ctaSaved.selectedModule?.settings.heroScene?.ctaPlaque.buttonHref, "/contact");

    await assert.rejects(
      () =>
        executeModuleSettingsCommand(payload, ownerReq, {
          action: "module-settings.save-draft",
          locale: "ru",
          moduleId: "homepage.hero-product-scene",
          settings: {
            heroScene: {
              desktopHoverBehavior: "quiet",
              focalDesktopX: 12,
              mobileCycleDurationMs: 900,
              mobileEasing: "linear",
              hotspots: [
                {
                  autoHighlightDurationMs: 700,
                  easing: "linear",
                  height: 18,
                  hitAreaPath: "M0 0 H10 V10 H0 Z",
                  id: "vision-screen",
                  mobileCycleOrder: 8,
                  visualContourPath: "M1 1 H9 V9 H1 Z",
                  width: 18,
                  x: 14,
                  y: 16,
                },
              ],
            },
          },
        }),
      /Owner role cannot edit site-admin\/developer hero scene tuning fields/,
    );

    const tunedBySiteAdmin = await executeModuleSettingsCommand(payload, siteAdminReq, {
      action: "module-settings.save-draft",
      locale: "ru",
      moduleId: "homepage.hero-product-scene",
      settings: {
        heroScene: {
          desktopHoverBehavior: "highlight-contour",
          focalDesktopX: 48,
          focalDesktopY: 54,
          focalMobileX: 50,
          focalMobileY: 42,
          mobileBehavior: "auto-cycle",
          mobileCycleDurationMs: 2400,
          mobileEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
          reducedMotionFallback: "static-first-frame",
          hotspots: [
            {
              height: 36,
              hitAreaPath: "M34 18 H66 V52 H34 Z",
              id: "vision-screen",
              mobileCycleOrder: 1,
              visualContourPath: "M36 20 H64 V50 H36 Z",
              width: 34,
              x: 50,
              y: 34,
            },
            {
              height: 44,
              hitAreaPath: "M13 32 H31 V76 H13 Z",
              id: "left-speaker",
              mobileCycleOrder: 2,
              visualContourPath: "M15 34 H29 V74 H15 Z",
              width: 18,
              x: 22,
              y: 54,
            },
            {
              height: 16,
              hitAreaPath: "M44 62 H72 V78 H44 Z",
              id: "electronics-console",
              mobileCycleOrder: 3,
              visualContourPath: "M46 64 H70 V76 H46 Z",
              width: 28,
              x: 58,
              y: 70,
            },
          ],
        },
      },
    });
    assert.equal(tunedBySiteAdmin.selectedModule?.settings.heroScene?.behavior.mobileCycleDurationMs, 2400);
    assert.equal(tunedBySiteAdmin.selectedModule?.settings.heroScene?.hotspots[0]?.geometry.x, 50);
    assert.equal(tunedBySiteAdmin.selectedModule?.settings.heroScene?.hotspots[0]?.visualContourPath, "M36 20 H64 V50 H36 Z");

    await assert.rejects(
      () =>
        executeModuleSettingsCommand(payload, ownerReq, {
          action: "module-settings.mark-ready",
          locale: "ru",
          moduleId: "homepage.hero-product-scene",
          settings: {
            heroScene: {
              hotspots: [
                {
                  displayName: "Экран Vision MAX",
                  id: "vision-screen",
                  targetKind: "product",
                },
              ],
            },
          },
        }),
      /Выберите товар для зоны/,
    );

    const ready = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.mark-ready",
      locale: "ru",
      moduleId: "homepage.hero-product-scene",
      settings: {
        heroScene: {
          hotspots: [
            {
              displayName: "Экран Vision MAX",
              id: "vision-screen",
              linkedProductId,
              targetKind: "product",
            },
            {
              displayName: "Акустика",
              id: "left-speaker",
              linkedCategoryId,
              targetKind: "category",
            },
            {
              displayName: "О технологии",
              id: "electronics-console",
              linkedPageId,
              targetKind: "page",
            },
          ],
        },
      },
    });
    const readyScene = ready.selectedModule?.settings.heroScene;
    assert.equal(ready.selectedModule?.settings.publicationState, "ready-for-publish");
    assert.equal(readyScene?.hotspots[0]?.linkedTarget.productId, linkedProductId);
    assert.equal(readyScene?.hotspots[1]?.linkedTarget.categoryId, linkedCategoryId);
    assert.equal(readyScene?.hotspots[2]?.linkedTarget.pageId, linkedPageId);
    assert.equal(readyScene?.warnings.length, 0);

    const settings = await payload.find({
      collection: "site-settings",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        locale: {
          equals: "ru",
        },
      },
    });
    const settingsRecord = settings.docs[0] as unknown as Record<string, unknown>;
    const rows = Array.isArray(settingsRecord.customModuleSettings)
      ? (settingsRecord.customModuleSettings as Array<Record<string, unknown>>)
      : [];
    const sceneRow = rows.find((row) => row.moduleId === "homepage.hero-product-scene");
    const heroScene = sceneRow?.heroScene as Record<string, unknown> | undefined;
    const hotspots = Array.isArray(heroScene?.hotspots)
      ? (heroScene.hotspots as Array<Record<string, unknown>>)
      : [];

    assert.equal(getRelationId(heroScene?.desktopMedia), linkedMediaId);
    assert.equal(hotspots.length, 3);
    assert.equal(getRelationId(hotspots[0]?.linkedProduct), linkedProductId);
    assert.equal(getRelationId(hotspots[1]?.linkedCategory), linkedCategoryId);
    assert.equal(getRelationId(hotspots[2]?.linkedPage), linkedPageId);

    const auditEvents = await payload.find({
      collection: "audit-events",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "-happenedAt",
    });
    assert.ok(auditEvents.docs.some((event) => event.action === "module-settings-save-draft"));
    assert.ok(auditEvents.docs.some((event) => event.action === "module-settings-ready"));

    console.log("hero-scene-settings-smoke: ok");
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
