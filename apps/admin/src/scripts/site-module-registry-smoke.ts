import assert from "node:assert/strict";

import {
  assertNoRawSiteModuleRegistryOutput,
  getSiteModuleRegistry,
} from "../lib/admin-bff/site-module-registry.ts";

const docsByCollection: Record<string, readonly unknown[]> = {
  locales: [
    { id: "locale-en", code: "en", englishLabel: "English", launchOrder: 1, publicSiteEnabled: true },
    { id: "locale-ru", code: "ru", nativeLabel: "Русский", launchOrder: 2, publicSiteEnabled: true },
  ],
  "media-assets": [
    {
      id: "media-home-hero",
      altText: "Homepage hero",
      assetRole: "hero",
      assetTitle: "Homepage hero still",
      filename: "homepage-hero.jpg",
    },
  ],
  "navigation-menus": [
    {
      id: "menu-primary",
      items: [{ href: "/", label: "Home" }],
      menuKey: "primary-header",
      placement: "header",
      title: "Primary header",
    },
    {
      id: "menu-products",
      items: [{ href: "/vision-max", label: "Vision MAX" }],
      menuKey: "products-mega",
      placement: "header",
      title: "Products menu",
    },
    {
      id: "menu-footer",
      items: [{ href: "/contact", label: "Contact" }],
      menuKey: "footer-legal",
      placement: "footer",
      title: "Footer legal",
    },
    {
      id: "menu-contact",
      items: [{ href: "/contact", label: "Consultation" }],
      menuKey: "contact-surfaces",
      placement: "contact",
      title: "Contact surfaces",
    },
  ],
  pages: [
    {
      id: "page-home",
      heroMedia: "media-home-hero",
      heroPrimaryCtaLabel: "Discuss a project",
      heroPrimaryCtaTarget: "/contact",
      heroSummary: "Private cinema, hi-end audio and spatial display systems.",
      routePath: "/",
      slug: "home",
      title: "Home",
    },
    {
      id: "page-contact",
      routePath: "/contact",
      slug: "contact",
      title: "Contact",
    },
  ],
  "page-sections": [
    {
      id: "section-home-hero",
      heroContent: { supportingLabel: "Quiet luxury" },
      previewLabel: "Hero",
      sectionType: "hero",
      title: "Montelar",
    },
  ],
  "product-categories": [
    {
      id: "category-speakers",
      label: "Speakers",
      routePath: "/audio/speakers",
      slug: "speakers",
    },
  ],
  "product-directions": [
    {
      id: "direction-vision-max",
      name: "Vision MAX",
      routePath: "/vision-max",
      slug: "vision-max",
    },
    {
      id: "direction-audio",
      name: "Hi-end Audio",
      routePath: "/audio",
      slug: "hi-end-audio",
    },
  ],
  products: [
    {
      id: "product-vision-max",
      name: "Vision MAX Premium",
      routePath: "/products/vision-max-premium",
      slug: "vision-max-premium",
    },
  ],
  "site-settings": [
    {
      id: "settings-en",
      brandName: "Montelar",
      contactEmail: "atelier@example.com",
      contactPhoneDisplay: "+31 20 555 0101",
      contactPrimaryHref: "/contact",
      contactPrimaryLabel: "Request consultation",
      footerCopyright: "2026 Montelar",
      footerLegalName: "Montelar",
      settingsScope: "public-site",
    },
  ],
};

async function main() {
  const payload = {
    find: async ({ collection }: { collection: string }) => ({
      docs: docsByCollection[collection] ?? [],
    }),
  };

  const registry = await getSiteModuleRegistry(payload as never);
  const failures = assertNoRawSiteModuleRegistryOutput(registry);
  const moduleIds = new Set(registry.modules.map((module) => module.id));

  assert.equal(failures.length, 0, `Owner-visible registry output should stay clean: ${failures.join(", ")}`);
  assert.ok(moduleIds.has("homepage.hero-product-scene"), "Homepage product scene module should be present.");
  assert.ok(moduleIds.has("homepage.hero-plaque"), "Homepage plaque module should be present.");
  assert.ok(moduleIds.has("global.header-desktop"), "Header module should be present.");
  assert.ok(moduleIds.has("global.products-mega-menu"), "Products mega menu module should be present.");
  assert.ok(moduleIds.has("global.mobile-menu-language-logo"), "Mobile menu/language/logo module should be present.");
  assert.ok(moduleIds.has("routes.banner-media-crops"), "Secondary route banner module should be present.");
  assert.ok(moduleIds.has("global.footer-legal-contact"), "Footer module should be present.");
  assert.ok(
    registry.modules.some((module) => module.routePaths.includes("/vision-max")),
    "At least one non-home route should be mapped.",
  );
  assert.ok(
    registry.modules.some((module) => module.linkedMedia.some((media) => media.src.includes("/product-scene/"))),
    "Homepage scene media should be linked.",
  );
  assert.ok(
    registry.modules.some((module) => module.editableFields.some((field) => field.status === "not-cms-backed")),
    "Registry should record explicit non-CMS-backed gaps.",
  );
  assert.deepEqual(
    registry.modules.flatMap((module) => module.actions).filter((action) => action.href?.includes("/admin/collections")),
    [],
    "Module actions should not expose direct technical collection links.",
  );

  const homeOnly = await getSiteModuleRegistry(payload as never, { routePath: "/" });
  assert.ok(homeOnly.modules.length > 0, "Route filtering should return homepage modules.");
  assert.ok(
    homeOnly.modules.every((module) => module.routePaths.includes("/")),
    "Route filtering should only return modules used by the requested route.",
  );

  const headerOnly = await getSiteModuleRegistry(payload as never, { moduleId: "global.header-desktop" });
  assert.equal(headerOnly.modules.length, 1, "Module filtering should return one module.");
  assert.equal(headerOnly.modules[0]?.id, "global.header-desktop");
  assert.ok(
    headerOnly.modules[0]?.editableFields.some((field) => field.fieldPath === "headerMenuLanguage.motion"),
    "Header registry should expose protected motion settings.",
  );
  assert.equal(
    headerOnly.modules[0]?.gaps.some((gap) => gap.laterTaskId === "MNT-ADMIN-BFF-010D"),
    false,
    "Header registry should not keep the 010D protected-settings gap.",
  );

  const productsMenu = registry.modules.find((module) => module.id === "global.products-mega-menu");
  assert.ok(
    productsMenu?.editableFields.some((field) => field.fieldPath === "headerMenuLanguage.closeBehavior"),
    "Products menu should expose close/open behavior settings.",
  );

  const mobileMenu = registry.modules.find((module) => module.id === "global.mobile-menu-language-logo");
  assert.ok(
    mobileMenu?.editableFields.some((field) => field.fieldPath === "headerMenuLanguage.languageSwitcherDisplay"),
    "Mobile menu should expose language switcher display behavior.",
  );
  assert.ok(
    mobileMenu?.actions.some((action) => action.href?.includes("moduleId=global.mobile-menu-language-logo")),
    "Mobile language and motion settings should link to module settings.",
  );

  console.log("site-module-registry-smoke: ok");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
