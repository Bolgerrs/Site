import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-page-content-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });
  const created: Array<{
    collection: "pages" | "page-sections";
    id: number | string;
  }> = [];

  try {
    const heroSection = await payload.create({
      collection: "page-sections",
      data: {
        internalCode: "SEC_SMOKE_HOME_HERO",
        pageFamiliesAllowed: ["home", "brand-editorial", "direction-landing"],
        previewLabel: "Home hero",
        primaryLocale: "en",
        sectionKey: "home-hero",
        sectionType: "hero",
        sourceOfTruthArtifact:
          "docs/strategy/artifacts/MNT-ADMIN-002B-site-content-editability-contract.md",
        status: "published",
        title: "Montelar quiet luxury",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "page-sections", id: heroSection.id });

    const overviewSection = await payload.create({
      collection: "page-sections",
      data: {
        body: "Route-owned editorial overview for public page smoke coverage.",
        internalCode: "SEC_SMOKE_OVERVIEW",
        pageFamiliesAllowed: ["home", "brand-editorial", "contact", "request", "category-landing"],
        previewLabel: "Overview",
        primaryLocale: "en",
        sectionKey: "overview",
        sectionType: "overview",
        status: "published",
        title: "Overview",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "page-sections", id: overviewSection.id });

    const ctaSection = await payload.create({
      collection: "page-sections",
      data: {
        ctaContent: {
          primaryLabel: "Request a consultation",
          primaryTarget: "/contact",
        },
        internalCode: "SEC_SMOKE_CTA",
        pageFamiliesAllowed: ["home", "contact", "request", "projects"],
        previewLabel: "Primary CTA",
        primaryLocale: "en",
        sectionKey: "primary-cta",
        sectionType: "cta",
        status: "published",
        title: "Primary CTA",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "page-sections", id: ctaSection.id });

    const productGridSection = await payload.create({
      collection: "page-sections",
      data: {
        internalCode: "SEC_SMOKE_GRID",
        pageFamiliesAllowed: ["home", "direction-landing", "category-landing"],
        previewLabel: "Category product grid",
        primaryLocale: "en",
        productGridContent: {
          gridMode: "category-spotlight",
          maxItems: 6,
        },
        sectionKey: "category-grid",
        sectionType: "product-grid",
        status: "published",
        title: "Category product grid",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "page-sections", id: productGridSection.id });

    const gallerySection = await payload.create({
      collection: "page-sections",
      data: {
        internalCode: "SEC_SMOKE_GALLERY",
        pageFamiliesAllowed: ["projects", "brand-editorial"],
        previewLabel: "Projects gallery",
        primaryLocale: "en",
        sectionKey: "projects-gallery",
        sectionType: "gallery",
        status: "draft",
        title: "Projects gallery",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "page-sections", id: gallerySection.id });

    const homePage = await payload.create({
      collection: "pages",
      data: {
        approvalStatus: "approved",
        canonicalPath: "/",
        heroPrimaryCtaLabel: "Discover directions",
        heroPrimaryCtaTarget: "/audio",
        heroSummary: "Quiet-luxury homepage route.",
        internalCode: "PAGE_SMOKE_HOME",
        layoutMode: "brand-editorial",
        pageFamily: "home",
        previewPath: "/",
        primaryLocale: "en",
        routePath: "/",
        sections: [
          { order: 10, section: heroSection.id, visible: true },
          { order: 20, section: overviewSection.id, visible: true },
          { order: 30, section: ctaSection.id, visible: true },
        ],
        seo: {
          description: "Homepage smoke description",
          title: "Montelar | Home",
        },
        showInHeader: false,
        showInFooter: false,
        slug: "home",
        status: "published",
        title: "Home",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "pages", id: homePage.id });

    const categoryPage = await payload.create({
      collection: "pages",
      data: {
        approvalStatus: "approved",
        canonicalPath: "/audio/speakers",
        heroSummary: "Category landing route.",
        internalCode: "PAGE_SMOKE_AUDIO_SPEAKERS",
        layoutMode: "catalog-landing",
        pageFamily: "category-landing",
        previewPath: "/audio/speakers",
        primaryLocale: "en",
        routePath: "/audio/speakers",
        sections: [
          { order: 10, section: overviewSection.id, visible: true },
          { order: 20, section: productGridSection.id, visible: true },
        ],
        seo: {
          description: "Category landing smoke description",
          title: "Speakers | Montelar",
        },
        slug: "audio-speakers",
        status: "published",
        title: "Audio speakers",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "pages", id: categoryPage.id });

    const requestPage = await payload.create({
      collection: "pages",
      data: {
        approvalStatus: "approved",
        canonicalPath: "/request/vision-max-premium",
        heroSummary: "Request route mapping.",
        internalCode: "PAGE_SMOKE_REQUEST_VISION_MAX",
        layoutMode: "contact-service",
        pageFamily: "request",
        previewPath: "/request/vision-max-premium",
        primaryLocale: "en",
        routePath: "/request/vision-max-premium",
        sections: [
          { order: 10, section: overviewSection.id, visible: true },
          { order: 20, section: ctaSection.id, visible: true },
        ],
        seo: {
          description: "Request landing smoke description",
          title: "Request Vision MAX Premium | Montelar",
        },
        slug: "request-vision-max-premium",
        status: "published",
        title: "Request Vision MAX Premium",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "pages", id: requestPage.id });

    const publishedPages = await payload.find({
      collection: "pages",
      depth: 1,
      limit: 20,
      overrideAccess: false,
      pagination: false,
      req: {
        user: null,
      } as never,
      where: {
        status: {
          equals: "published",
        },
      },
    });

    const routePaths = new Set(
      (publishedPages.docs as Array<{ routePath?: string }>).map((doc) => doc.routePath),
    );

    assert.equal(routePaths.has("/"), true);
    assert.equal(routePaths.has("/audio/speakers"), true);
    assert.equal(routePaths.has("/request/vision-max-premium"), true);

    let invalidSectionBlocked = false;

    try {
      await payload.create({
        collection: "pages",
        data: {
          approvalStatus: "approved",
          canonicalPath: "/contact",
          heroSummary: "This should fail because gallery is not allowed for contact.",
          internalCode: "PAGE_SMOKE_INVALID_CONTACT",
          layoutMode: "contact-service",
          pageFamily: "contact",
          previewPath: "/contact",
          primaryLocale: "en",
          routePath: "/contact",
          sections: [
            { order: 10, section: gallerySection.id, visible: true },
          ],
          seo: {
            description: "Invalid contact route",
            title: "Contact | Montelar",
          },
          slug: "contact",
          status: "published",
          title: "Contact",
        },
        draft: false,
        overrideAccess: true,
        showHiddenFields: true,
      });
    } catch (error) {
      invalidSectionBlocked =
        error instanceof Error &&
        error.message.includes("cannot use section type gallery");
    }

    assert.equal(invalidSectionBlocked, true);
  } finally {
    for (const entry of created.reverse()) {
      await payload.delete({
        collection: entry.collection,
        id: entry.id,
        overrideAccess: true,
      });
    }

    if (typeof payload.db.destroy === "function") {
      await payload.db.destroy();
    }
    await rm(localSmokeDatabasePath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
