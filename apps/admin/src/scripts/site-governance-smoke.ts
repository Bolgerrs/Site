import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { syncLaunchLocales } from "../lib/payload/locales.ts";
import {
  getPublicNavigationMenu,
  getPublicSiteSettings,
  listPublicSeoEntries,
} from "../lib/payload/public-site.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-site-governance-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });
  const created: Array<{ collection: string; id: number | string }> = [];

  try {
    await syncLaunchLocales(payload);

    const direction = await payload.create({
      collection: "product-directions",
      data: {
        canonicalPath: "/audio",
        directionFamily: "audio",
        indexable: true,
        internalCode: "DIR_SMOKE_AUDIO",
        name: "Hi-end Audio",
        order: 10,
        primaryLocale: "en",
        publicLabel: "Hi-end Audio",
        routeSegment: "audio",
        shortDescription: "Reference route for navigation and SEO allowlist smoke coverage.",
        slug: "audio",
        sourceOfTruthArtifact:
          "docs/strategy/artifacts/MNT-ADMIN-002B-site-content-editability-contract.md",
        status: "published",
        translationPriority: "high",
        visibilityInNavigation: true,
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "product-directions", id: direction.id });

    const page = await payload.create({
      collection: "pages",
      data: {
        approvalStatus: "approved",
        canonicalPath: "/brand",
        heroSummary: "Brand route for site governance smoke.",
        internalCode: "PAGE_SMOKE_BRAND",
        layoutMode: "brand-editorial",
        pageFamily: "brand-editorial",
        previewPath: "/brand",
        primaryLocale: "en",
        routePath: "/brand",
        sectionPlan: [{ expectedType: "overview", sectionKey: "brand-overview" }],
        seo: {
          description: "Brand route smoke metadata",
          title: "Brand | Montelar",
        },
        showInFooter: true,
        showInHeader: true,
        slug: "brand",
        status: "published",
        title: "Brand",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "pages", id: page.id });

    const siteSettings = await payload.create({
      collection: "site-settings",
      data: {
        addressShort: "Keizersgracht 210, Amsterdam",
        brandName: "Montelar",
        brandShortName: "MNTL",
        contactEmail: "concierge@montelar.example",
        contactFallbackLocale: "en",
        contactHeadline: "Private consultation",
        contactPhoneDisplay: "+31 20 555 0100",
        contactPhoneE164: "+31205550100",
        contactPrimaryHref: "/contact",
        contactPrimaryLabel: "Request a consultation",
        contactWhatsappLabel: "WhatsApp",
        contactWhatsappUrl: "https://wa.me/31205550100",
        footerCopyright: "Montelar. All rights reserved.",
        footerLegalName: "Montelar B.V.",
        internalCode: "SETTINGS_SMOKE_PUBLIC_EN",
        locale: "en",
        primaryLocale: "en",
        settingsScope: "public-site",
        showroomCity: "Amsterdam",
        showroomCountry: "Netherlands",
        showroomLabel: "Private showroom",
        siteConcept: "Quiet luxury",
        siteTagline: "Architecture of image, sound and AI design",
        socialLinks: [
          {
            href: "https://example.com/instagram/montelar",
            label: "Instagram",
          },
        ],
        sourceOfTruthArtifact:
          "docs/strategy/artifacts/MNT-ADMIN-002B-site-content-editability-contract.md",
        status: "published",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "site-settings", id: siteSettings.id });

    const navigationMenu = await payload.create({
      collection: "navigation-menus",
      data: {
        derivedFromHierarchy: true,
        internalCode: "NAV_SMOKE_PRIMARY_EN",
        items: [
          {
            itemKey: "audio",
            sourceDirection: direction.id,
            sourceType: "product-direction",
            summary: "Direction entry",
            visible: true,
          },
          {
            children: [
              {
                itemKey: "brand-story",
                sourcePage: page.id,
                sourceType: "page",
                visible: true,
              },
            ],
            itemKey: "editorial",
            label: "Editorial",
            sourceType: "custom-url",
            summary: "Page cluster",
            visible: true,
            href: "/brand",
          },
        ],
        locale: "en",
        menuKey: "primary-header",
        placement: "header",
        primaryLocale: "en",
        sourceOfTruthArtifact:
          "docs/strategy/artifacts/MNT-ADMIN-002B-site-content-editability-contract.md",
        status: "published",
        title: "Primary Header",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "navigation-menus", id: navigationMenu.id });

    const seoEntryEn = await payload.create({
      collection: "seo-entries",
      data: {
        approvalStatus: "approved",
        canonicalMode: "owner-default",
        includeInSitemap: true,
        indexingMode: "index,follow",
        internalCode: "SEO_SMOKE_AUDIO_EN",
        locale: "en",
        metaDescription: "Hi-end Audio direction metadata.",
        metaTitle: "Hi-end Audio | Montelar",
        ownerDirection: direction.id,
        ownerType: "product-direction",
        primaryLocale: "en",
        publicationReadiness: "production-ready",
        routePath: "/audio",
        socialCardStyle: "summary_large_image",
        sourceOfTruthArtifact:
          "docs/strategy/artifacts/MNT-ADMIN-002B-site-content-editability-contract.md",
        status: "published",
        translationPriority: "normal",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "seo-entries", id: seoEntryEn.id });

    const seoEntryRu = await payload.create({
      collection: "seo-entries",
      data: {
        approvalStatus: "approved",
        canonicalMode: "owner-default",
        hreflangEnabled: true,
        includeInSitemap: true,
        indexingMode: "index,follow",
        internalCode: "SEO_SMOKE_AUDIO_RU",
        locale: "ru",
        metaDescription: "Hi-end Audio metadata for Russian locale.",
        metaTitle: "Hi-end Audio | Montelar",
        ownerDirection: direction.id,
        ownerType: "product-direction",
        primaryLocale: "en",
        publicationReadiness: "production-ready",
        routePath: "/audio",
        socialCardStyle: "summary_large_image",
        sourceOfTruthArtifact:
          "docs/strategy/artifacts/MNT-ADMIN-002B-site-content-editability-contract.md",
        status: "published",
        translationPriority: "normal",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "seo-entries", id: seoEntryRu.id });

    const publicSettings = await getPublicSiteSettings(payload, "en");
    const publicNavigation = await getPublicNavigationMenu(payload, "en", "primary-header");
    const publicSeoEntries = await listPublicSeoEntries(payload, "en");

    assert.ok(publicSettings);
    assert.equal(publicSettings?.brandName, "Montelar");
    assert.equal("auditNotes" in (publicSettings as object), false);

    assert.ok(publicNavigation);
    assert.equal(publicNavigation?.items[0]?.label, "Hi-end Audio");
    assert.equal(publicNavigation?.items[0]?.href, "/audio");
    assert.equal(publicNavigation?.items[1]?.children[0]?.href, "/brand");

    assert.equal(publicSeoEntries.length, 1);
    assert.equal(publicSeoEntries[0]?.includeInSitemap, true);
    assert.equal(publicSeoEntries[0]?.alternates.ru, "/audio");
    assert.equal(publicSeoEntries[0]?.title, "Hi-end Audio | Montelar");

    console.log("site-governance-smoke: ok");
  } finally {
    for (const entry of created.reverse()) {
      try {
        await payload.delete({
          collection: entry.collection as never,
          id: entry.id,
          overrideAccess: true,
        });
      } catch {
        // ignore cleanup failures in smoke mode
      }
    }

    await payload.db.destroy?.();
    await rm(localSmokeDatabasePath, { force: true });
  }
}

void main();
