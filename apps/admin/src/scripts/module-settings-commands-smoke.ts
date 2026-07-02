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
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-module-settings-commands-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function reqFor(role: string) {
  return {
    user: {
      role,
    },
  };
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
  const probeImagePath = path.resolve(adminRuntime.tempDir, "module-settings-commands-smoke.png");
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
    const firstRead = await getModuleSettingsSnapshot(payload, ownerReq, {
      locale: "ru",
      moduleId: "homepage.hero-plaque",
    });
    assert.equal(firstRead.selectedModule?.moduleId, "homepage.hero-plaque");
    assert.equal(firstRead.selectedModule?.settings.publicationState, "draft");
    assert.deepEqual(
      assertNoRawModuleSettingsOutput(firstRead),
      [],
      "Owner module settings snapshot should not expose raw/Payload vocabulary.",
    );

    const saved = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.save-draft",
      locale: "ru",
      moduleId: "homepage.hero-plaque",
      settings: {
        buttonHref: "/contact",
        buttonLabel: "Запросить консультацию",
        desktopCropX: 48,
        desktopCropY: 52,
        desktopPosition: "center",
        mobileCropX: 50,
        mobileCropY: 42,
        mobilePosition: "top",
        motionDurationMs: 640,
        motionEnabled: true,
        ownerNotes: "Smoke draft for guided module settings.",
        reducedMotionMode: "static-first-frame",
        targetKind: "url",
        text: "Тихая настройка текста hero plaque.",
        title: "Hero plaque smoke",
        visible: true,
      },
    });
    assert.equal(saved.successMessage, "Черновик настроек модуля сохранен.");
    assert.equal(saved.selectedModule?.settings.buttonHref, "/contact");
    assert.equal(saved.selectedModule?.settings.crop.desktop.x, 48);
    assert.equal(saved.selectedModule?.settings.motion.durationMs, 640);
    assert.equal(saved.selectedModule?.validation.publishReady, true);

    const mediaAsset = await payload.create({
      collection: "media-assets",
      data: {
        altText: "Module settings smoke linked media",
        approvalStatus: "approved",
        assetTitle: "Module settings smoke linked media",
        assetType: "image",
        audienceMode: "public",
        internalCode: `MAS_MODULE_SETTINGS_${Date.now()}`,
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

    const headerRead = await getModuleSettingsSnapshot(payload, ownerReq, {
      locale: "ru",
      moduleId: "global.header-desktop",
    });
    assert.equal(headerRead.selectedModule?.moduleId, "global.header-desktop");
    assert.ok(headerRead.selectedModule?.settings.headerMenuLanguage, "Header settings should be exposed.");
    assert.ok(
      headerRead.selectedModule?.settings.commandGroups.includes("Language switcher"),
      "Header settings should include language switcher command group.",
    );

    const mobileHeaderSaved = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.save-draft",
      locale: "ru",
      moduleId: "global.mobile-menu-language-logo",
      settings: {
        headerMenuLanguage: {
          closeBehavior: "after-selection",
          consultationCtaHref: "/contact",
          consultationCtaLabel: "Обсудить проект",
          defaultLanguageCode: "ru",
          enabledLanguageCodes: ["ru", "en", "de"],
          languageOrder: ["ru", "en", "de"],
          languageSwitcherDisplay: "short-code",
          logoAlignmentNote: "Mobile logo remains optically centered in open and closed states.",
          phoneButtonLabel: "Позвонить",
          phoneButtonVisible: true,
        },
      },
    });
    assert.equal(
      mobileHeaderSaved.selectedModule?.settings.headerMenuLanguage?.languageSwitcher.defaultLanguageCode,
      "ru",
    );
    assert.equal(
      mobileHeaderSaved.selectedModule?.settings.headerMenuLanguage?.megaMenu.closeBehavior,
      "after-selection",
    );

    await assert.rejects(
      () =>
        executeModuleSettingsCommand(payload, ownerReq, {
          action: "module-settings.save-draft",
          locale: "ru",
          moduleId: "global.products-mega-menu",
          settings: {
            headerMenuLanguage: {
              menuRevealDurationMs: 260,
              routeAlignmentNotes: "Owner should not tune route-specific header alignment.",
              stableColumnCount: 4,
            },
          },
        }),
      /Owner role cannot edit site-admin\/developer header tuning fields/,
    );

    const adminReq = {
      payload,
      user: {
        role: "admin",
      },
    } as never;
    const adminHeaderSaved = await executeModuleSettingsCommand(payload, adminReq, {
      action: "module-settings.save-draft",
      locale: "ru",
      moduleId: "global.products-mega-menu",
      settings: {
        headerMenuLanguage: {
          closeBehavior: "after-selection",
          defaultLanguageCode: "ru",
          desktopLayoutMode: "route-specific",
          enabledLanguageCodes: ["ru", "en", "de"],
          languageOrder: ["ru", "en", "de"],
          megaMenuGrouping: "direction-category-product",
          menuOpenBehavior: "hover-and-click",
          menuRevealDurationMs: 420,
          mobileLogoTransition: "crossfade-center",
          reducedMotionMode: "static-first-frame",
          stableColumnCount: 3,
        },
      },
    });
    assert.equal(adminHeaderSaved.selectedModule?.settings.headerMenuLanguage?.megaMenu.stableColumnCount, 3);

    await assert.rejects(
      () =>
        executeModuleSettingsCommand(payload, adminReq, {
          action: "module-settings.mark-ready",
          locale: "ru",
          moduleId: "global.mobile-menu-language-logo",
          settings: {
            headerMenuLanguage: {
              defaultLanguageCode: "it",
              enabledLanguageCodes: ["ru", "en"],
              languageOrder: ["ru", "en"],
            },
          },
        }),
      /default язык/,
    );

    const linkedProductSaved = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.save-draft",
      locale: "ru",
      moduleId: "homepage.hero-plaque",
      settings: {
        linkedMediaId,
        linkedProductId,
        targetKind: "product",
      },
    });
    assert.equal(linkedProductSaved.selectedModule?.settings.linkedTarget.mediaId, linkedMediaId);
    assert.equal(linkedProductSaved.selectedModule?.settings.linkedTarget.productId, linkedProductId);

    const linkedCategoryReady = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.mark-ready",
      locale: "ru",
      moduleId: "homepage.hero-plaque",
      settings: {
        linkedCategoryId,
        targetKind: "category",
      },
    });
    assert.equal(linkedCategoryReady.selectedModule?.settings.linkedTarget.categoryId, linkedCategoryId);
    assert.equal(linkedCategoryReady.selectedModule?.settings.publicationState, "ready-for-publish");

    const linkedPageSaved = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.save-draft",
      locale: "ru",
      moduleId: "homepage.hero-plaque",
      settings: {
        linkedPageId,
        targetKind: "page",
      },
    });
    assert.equal(linkedPageSaved.selectedModule?.settings.linkedTarget.pageId, linkedPageId);

    const ready = await executeModuleSettingsCommand(payload, ownerReq, {
      action: "module-settings.mark-ready",
      locale: "ru",
      moduleId: "homepage.hero-plaque",
      settings: {
        buttonHref: "/contact",
        buttonLabel: "Запросить консультацию",
        targetKind: "url",
      },
    });
    assert.equal(ready.selectedModule?.settings.publicationState, "ready-for-publish");

    await assert.rejects(
      () =>
        executeModuleSettingsCommand(payload, ownerReq, {
          action: "module-settings.mark-ready",
          locale: "ru",
          moduleId: "homepage.hero-plaque",
          settings: {
            linkedProductId: null,
            targetKind: "product",
            visible: true,
          },
        }),
      /Выберите товар для клика по усилителю/,
    );

    await getModuleSettingsSnapshot(payload, { payload, user: { role: "admin" } } as never, {
      locale: "ru",
      moduleId: "homepage.hero-plaque",
    });
    await getModuleSettingsSnapshot(payload, { payload, user: { role: "developer" } } as never, {
      locale: "ru",
      moduleId: "homepage.hero-plaque",
    });
    await assert.rejects(
      () =>
        getModuleSettingsSnapshot(payload, { payload, ...reqFor("translator") } as never, {
          locale: "ru",
          moduleId: "homepage.hero-plaque",
        }),
      /forbidden/,
    );

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
    assert.ok(
      rows.some(
        (row) =>
          row.moduleId === "homepage.hero-plaque" &&
          row.publicationState === "ready-for-publish" &&
          row.buttonHref === "/contact" &&
          getRelationId(row.linkedMedia) === linkedMediaId &&
          getRelationId(row.linkedProduct) === linkedProductId &&
          getRelationId(row.linkedCategory) === linkedCategoryId &&
          getRelationId(row.linkedPage) === linkedPageId,
      ),
      "Site settings should persist focused module settings with linked media/product/category/page relations.",
    );

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

    console.log("module-settings-commands-smoke: ok");
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
