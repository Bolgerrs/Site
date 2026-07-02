import type { Payload } from "payload";

type GenericRecord = Record<string, unknown>;

export type SiteModuleLayer = "developer" | "owner" | "site-admin";

export type SiteModuleFieldStatus =
  | "editable-now"
  | "not-cms-backed"
  | "planned-command"
  | "read-only";

export type SiteModuleAction = {
  description: string;
  href?: string;
  id: string;
  label: string;
  layer: SiteModuleLayer;
  laterTaskId?: string;
  method?: "GET" | "POST";
};

export type SiteModuleEditableField = {
  editHref?: string;
  fieldPath: string;
  id: string;
  label: string;
  layer: SiteModuleLayer;
  linkedId?: string;
  source:
    | "component"
    | "locale"
    | "media"
    | "navigation"
    | "page"
    | "page-section"
    | "product"
    | "product-category"
    | "product-direction"
    | "settings";
  status: SiteModuleFieldStatus;
  valuePreview?: string;
};

export type SiteModuleLinkedMedia = {
  alt?: string;
  id: string;
  label: string;
  source: "cms-media" | "public-asset";
  src: string;
  status: SiteModuleFieldStatus;
};

export type SiteModuleLinkedContent = {
  id: string;
  label: string;
  routePath?: string;
  source:
    | "locale"
    | "navigation"
    | "page"
    | "page-section"
    | "product"
    | "product-category"
    | "product-direction"
    | "settings";
};

export type SiteModuleGap = {
  description: string;
  id: string;
  label: string;
  laterTaskId: "MNT-ADMIN-BFF-010B" | "MNT-ADMIN-BFF-010C" | "MNT-ADMIN-BFF-010D" | "MNT-ADMIN-BFF-010E";
  moduleId: string;
  severity: "blocker" | "follow-up" | "watch";
};

export type SiteModuleDefinition = {
  actions: SiteModuleAction[];
  componentFiles: string[];
  cssHooks: string[];
  description: string;
  editableFields: SiteModuleEditableField[];
  gaps: SiteModuleGap[];
  id: string;
  label: string;
  layer: SiteModuleLayer;
  linkedContent: SiteModuleLinkedContent[];
  linkedMedia: SiteModuleLinkedMedia[];
  publicUsage: string[];
  routePaths: string[];
};

export type SiteModuleRegistrySnapshot = {
  gaps: SiteModuleGap[];
  generatedAt: string;
  modules: SiteModuleDefinition[];
  routes: Array<{
    moduleIds: string[];
    routePath: string;
  }>;
  summary: {
    editableNow: number;
    gaps: number;
    modules: number;
    ownerModules: number;
    plannedCommands: number;
    routes: number;
    siteAdminModules: number;
  };
};

type RegistryInput = {
  moduleId?: string | null;
  routePath?: string | null;
};

type PayloadLike = Pick<Payload, "find">;

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray<T = GenericRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "number" || typeof id === "string") {
      return String(id);
    }
  }

  return "";
}

function normalizePath(path: string) {
  const trimmed = path.trim() || "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return withSlash !== "/" && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

function previewValue(value: unknown) {
  const normalized = getText(value).replace(/\s+/g, " ");

  return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
}

function searchHref(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
}

function firstBy<T extends GenericRecord>(items: T[], predicate: (item: T) => boolean) {
  return items.find(predicate) ?? null;
}

function routePage(pages: GenericRecord[], routePath: string) {
  const normalized = normalizePath(routePath);

  return firstBy(pages, (page) => normalizePath(getText(page.routePath) || getText(page.canonicalPath)) === normalized);
}

function homePage(pages: GenericRecord[]) {
  return routePage(pages, "/") ?? firstBy(pages, (page) => getText(page.slug) === "home");
}

function firstSection(sections: GenericRecord[], sectionType: string) {
  return firstBy(sections, (section) => getText(section.sectionType) === sectionType);
}

function relationId(value: unknown) {
  return getId(value);
}

function linkedPage(page: GenericRecord | null): SiteModuleLinkedContent[] {
  if (!page) {
    return [];
  }

  return [
    {
      id: getId(page.id) || getText(page.slug) || "page",
      label: getText(page.title) || getText(page.navigationLabel) || getText(page.slug) || "Page",
      routePath: normalizePath(getText(page.routePath) || "/"),
      source: "page",
    },
  ];
}

function linkedSection(section: GenericRecord | null): SiteModuleLinkedContent[] {
  if (!section) {
    return [];
  }

  return [
    {
      id: getId(section.id) || getText(section.sectionKey) || "section",
      label: getText(section.previewLabel) || getText(section.title) || getText(section.sectionType) || "Page section",
      source: "page-section",
    },
  ];
}

function field(input: Omit<SiteModuleEditableField, "id"> & { id?: string }): SiteModuleEditableField {
  return {
    id: input.id ?? `${input.source}:${input.fieldPath}`,
    ...input,
  };
}

function action(input: SiteModuleAction): SiteModuleAction {
  return input;
}

function gap(input: Omit<SiteModuleGap, "severity"> & { severity?: SiteModuleGap["severity"] }): SiteModuleGap {
  return {
    severity: input.severity ?? "follow-up",
    ...input,
  };
}

async function findDocs(payload: PayloadLike, collection: string, limit = 100) {
  const find = payload.find as unknown as (input: Record<string, unknown>) => Promise<{ docs?: unknown[] }>;
  const result = await find({
    collection,
    depth: 1,
    limit,
    overrideAccess: true,
    pagination: false,
  });

  return (result.docs ?? []) as GenericRecord[];
}

async function loadRegistryRecords(payload: PayloadLike) {
  const [
    locales,
    media,
    navigation,
    pages,
    products,
    productCategories,
    productDirections,
    sections,
    settings,
  ] = await Promise.all([
    findDocs(payload, "locales", 50),
    findDocs(payload, "media-assets", 100),
    findDocs(payload, "navigation-menus", 50),
    findDocs(payload, "pages", 100),
    findDocs(payload, "products", 100),
    findDocs(payload, "product-categories", 100),
    findDocs(payload, "product-directions", 100),
    findDocs(payload, "page-sections", 100),
    findDocs(payload, "site-settings", 50),
  ]);

  return {
    locales,
    media,
    navigation,
    pages,
    productCategories,
    productDirections,
    products,
    sections,
    settings,
  };
}

function mediaAsset(input: {
  alt?: string;
  id: string;
  label: string;
  src: string;
  status?: SiteModuleFieldStatus;
}): SiteModuleLinkedMedia {
  return {
    id: input.id,
    label: input.label,
    source: input.id.startsWith("public:") ? "public-asset" : "cms-media",
    src: input.src,
    status: input.status ?? (input.id.startsWith("public:") ? "not-cms-backed" : "editable-now"),
    ...(input.alt ? { alt: input.alt } : {}),
  };
}

function mediaFromCms(media: GenericRecord[], id: string, fallbackLabel: string) {
  const item = firstBy(media, (asset) => getId(asset.id) === id || getText(asset.filename) === id);
  const filename = getText(item?.filename);

  return item
    ? mediaAsset({
        alt: getText(item.altText),
        id: getId(item.id) || id,
        label: getText(item.assetTitle) || getText(item.title) || fallbackLabel,
        src: filename ? `/uploads/${filename}` : getText(item.publicUrl) || id,
      })
    : null;
}

function buildHomeModules(records: Awaited<ReturnType<typeof loadRegistryRecords>>) {
  const page = homePage(records.pages);
  const heroSection = firstSection(records.sections, "hero");
  const heroSectionId = getId(heroSection?.id);
  const homeId = getId(page?.id);
  const homeEditHref = searchHref("/admin/site", { route: "/" });
  const heroEditHref = heroSectionId
    ? searchHref("/admin/site", { route: "/", block: heroSectionId })
    : homeEditHref;
  const linkedMedia = [
    mediaAsset({
      id: "public:/images/home/product-scene/hero-upscaled.webp",
      label: "Interactive hero room base image",
      src: "/images/home/product-scene/hero-upscaled.webp",
    }),
    mediaAsset({
      id: "public:/images/home/product-scene/screen.webp",
      label: "Interactive hero screen layer",
      src: "/images/home/product-scene/screen.webp",
    }),
    mediaAsset({
      id: "public:/images/home/product-scene/speaker-left.webp",
      label: "Interactive hero loudspeaker layer",
      src: "/images/home/product-scene/speaker-left.webp",
    }),
    mediaAsset({
      id: "public:/videos/home/montelar-screen-product-loop.mp4",
      label: "Homepage product motion clip",
      src: "/videos/home/montelar-screen-product-loop.mp4",
    }),
  ];

  return [
    {
      id: "homepage.hero-product-scene",
      label: "Homepage interactive product scene",
      description: "First-screen room image with selectable image, sound and electronics zones.",
      layer: "owner",
      routePaths: ["/"],
      componentFiles: ["apps/web/src/app/page.tsx", "apps/web/src/components/product-scene-prototype.tsx"],
      cssHooks: [
        ".home-hero-visual",
        ".product-scene-prototype",
        ".product-scene-prototype__hotspot",
        ".product-scene-prototype__object-layer",
      ],
      publicUsage: [
        "Homepage first viewport when NEXT_PUBLIC_HOME_PRODUCT_SCENE is not false.",
        "Hotspots link to Vision MAX, audio categories and technology routes.",
      ],
      linkedContent: [
        ...linkedPage(page),
        ...records.productDirections.slice(0, 6).map((direction) => ({
          id: getId(direction.id) || getText(direction.slug),
          label: getText(direction.name) || getText(direction.slug),
          routePath: normalizePath(getText(direction.routePath) || `/${getText(direction.slug)}`),
          source: "product-direction" as const,
        })),
      ],
      linkedMedia,
      editableFields: [
        field({
          editHref: homeEditHref,
          fieldPath: "heroSummary",
          label: "Hero supporting text",
          layer: "owner",
          linkedId: homeId,
          source: "page",
          status: homeId ? "editable-now" : "planned-command",
          valuePreview: previewValue(page?.heroSummary),
        }),
        field({
          fieldPath: "heroScene.hotspots",
          label: "Hotspot labels and links",
          layer: "owner",
          source: "settings",
          status: "editable-now",
          valuePreview: "screen, speakers and electronics zones with product/category/page targets",
        }),
        field({
          fieldPath: "heroScene.hotspots.contours",
          label: "Visual contours and click zones",
          layer: "developer",
          source: "settings",
          status: "editable-now",
          valuePreview: "separate visible contours and larger touch hit areas",
        }),
        field({
          fieldPath: "heroScene.mediaAndCrop",
          label: "Scene media and responsive crop",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "desktop/mobile image or video source, focal point and reduced-motion fallback",
        }),
        field({
          fieldPath: "heroScene.ctaPlaque",
          label: "Scene CTA plaque",
          layer: "owner",
          source: "settings",
          status: "editable-now",
          valuePreview: "brand text, slogan, CTA title, copy, button and visibility",
        }),
      ],
      actions: [
        action({
          description: "Edit visible homepage copy in the guided site editor.",
          href: homeEditHref,
          id: "open-homepage-editor",
          label: "Open homepage editor",
          layer: "owner",
          method: "GET",
        }),
        action({
          description: "Open guided settings for scene media, CTA, hotspots and motion behavior.",
          href: searchHref("/api/internal/module-settings", { moduleId: "homepage.hero-product-scene" }),
          id: "open-scene-settings-api",
          label: "Open scene settings",
          layer: "site-admin",
          method: "GET",
        }),
      ],
      gaps: [],
    },
    {
      id: "homepage.hero-plaque",
      label: "Homepage text and consultation plaque",
      description: "Brand phrase, slogan, axis labels and primary consultation links in the hero copy layer.",
      layer: "owner",
      routePaths: ["/"],
      componentFiles: ["apps/web/src/app/page.tsx", "apps/web/src/components/slogan-composition.tsx"],
      cssHooks: [".home-hero-copy", ".home-slogan-composition", ".home-hero-axis", ".home-hero-actions"],
      publicUsage: ["Homepage hero copy and CTA stack."],
      linkedContent: [...linkedPage(page), ...linkedSection(heroSection)],
      linkedMedia: [],
      editableFields: [
        field({
          editHref: heroEditHref,
          fieldPath: "heroContent.supportingLabel",
          label: "Quiet luxury eyebrow",
          layer: "owner",
          linkedId: heroSectionId || homeId,
          source: heroSectionId ? "page-section" : "page",
          status: heroSectionId || homeId ? "editable-now" : "planned-command",
          valuePreview: previewValue(heroSection?.heroContent),
        }),
        field({
          editHref: homeEditHref,
          fieldPath: "heroPrimaryCtaLabel",
          label: "Primary consultation label",
          layer: "owner",
          linkedId: homeId,
          source: "page",
          status: homeId ? "editable-now" : "planned-command",
          valuePreview: previewValue(page?.heroPrimaryCtaLabel),
        }),
        field({
          editHref: homeEditHref,
          fieldPath: "heroPrimaryCtaTarget",
          label: "Primary consultation target",
          layer: "owner",
          linkedId: homeId,
          source: "page",
          status: homeId ? "editable-now" : "planned-command",
          valuePreview: previewValue(page?.heroPrimaryCtaTarget),
        }),
        field({
          fieldPath: "sloganComposition",
          label: "Slogan composition words",
          layer: "site-admin",
          source: "component",
          status: "not-cms-backed",
          valuePreview: "Architecture of image, sound and AI design",
        }),
      ],
      actions: [
        action({
          description: "Edit homepage text and CTA in one owner path.",
          href: homeEditHref,
          id: "edit-home-plaque",
          label: "Edit homepage plaque",
          layer: "owner",
          method: "GET",
        }),
      ],
      gaps: [
        gap({
          description: "Slogan word-by-word composition is localized in code and needs a settings command before owner editing.",
          id: "homepage-slogan-component-copy",
          label: "Slogan composition needs settings",
          laterTaskId: "MNT-ADMIN-BFF-010B",
          moduleId: "homepage.hero-plaque",
        }),
      ],
    },
    {
      id: "homepage.motion-and-hero-media",
      label: "Homepage hero media and motion",
      description: "GSAP reveal, scroll movement and hero media fallback used by the public homepage.",
      layer: "site-admin",
      routePaths: ["/"],
      componentFiles: ["apps/web/src/app/page.tsx", "apps/web/src/components/homepage-motion.tsx"],
      cssHooks: [".home-gsap-motion", ".home-hero-visual", ".home-yandex-performance", ".home-motion-clip"],
      publicUsage: ["Homepage reveal and scroll behavior across hero, system story and product sequence."],
      linkedContent: linkedPage(page),
      linkedMedia: [
        ...linkedMedia,
        mediaFromCms(records.media, relationId(page?.heroMedia), "Homepage CMS hero media"),
      ].filter((item): item is SiteModuleLinkedMedia => item !== null),
      editableFields: [
        field({
          fieldPath: "motionTimeline",
          label: "Homepage reveal and scroll timing",
          layer: "developer",
          source: "component",
          status: "not-cms-backed",
          valuePreview: "GSAP ScrollTrigger timeline",
        }),
        field({
          editHref: searchHref("/admin/media", { route: "/" }),
          fieldPath: "heroMedia",
          label: "Fallback hero media",
          layer: "owner",
          linkedId: relationId(page?.heroMedia),
          source: "media",
          status: relationId(page?.heroMedia) ? "editable-now" : "planned-command",
          valuePreview: relationId(page?.heroMedia) || "public image fallback",
        }),
      ],
      actions: [
        action({
          description: "Open media workspace for homepage media governance.",
          href: searchHref("/admin/media", { route: "/" }),
          id: "open-home-media",
          label: "Review homepage media",
          layer: "owner",
          method: "GET",
        }),
      ],
      gaps: [
        gap({
          description: "Motion timings are approved visual behavior and are not editable from admin yet.",
          id: "homepage-motion-settings",
          label: "Motion controls need protected settings",
          laterTaskId: "MNT-ADMIN-BFF-010D",
          moduleId: "homepage.motion-and-hero-media",
          severity: "watch",
        }),
      ],
    },
  ] satisfies SiteModuleDefinition[];
}

function buildHeaderModules(records: Awaited<ReturnType<typeof loadRegistryRecords>>) {
  const settings = firstBy(records.settings, (item) => getText(item.settingsScope) === "public-site") ?? records.settings[0] ?? null;
  const primaryMenu = firstBy(records.navigation, (item) => getText(item.menuKey) === "primary-header");
  const productsMenu = firstBy(records.navigation, (item) => getText(item.menuKey) === "products-mega");
  const locales = records.locales.filter((locale) => getText(locale.code));
  const settingsHref = "/admin/site-admin?section=header-footer";
  const languageHref = "/admin/site-admin?section=languages";
  const headerSettingsHref = searchHref("/api/internal/module-settings", { moduleId: "global.header-desktop" });
  const productsMenuSettingsHref = searchHref("/api/internal/module-settings", { moduleId: "global.products-mega-menu" });
  const mobileMenuSettingsHref = searchHref("/api/internal/module-settings", {
    moduleId: "global.mobile-menu-language-logo",
  });
  const routes = ["/", "/vision-max", "/audio", "/products/[slug]", "/contact"];

  return [
    {
      id: "global.header-desktop",
      label: "Desktop header layout",
      description: "Compact brand bar with contact shortcut, locale control, consultation CTA and quiet navigation.",
      layer: "site-admin",
      routePaths: routes,
      componentFiles: ["apps/web/src/components/site-header.tsx", "apps/web/src/components/locale-switcher.tsx"],
      cssHooks: [".shell-header", ".site-header-bar", ".header-action-stack", ".desktop-nav-frame"],
      publicUsage: ["Rendered by the public shell on all site routes."],
      linkedContent: [
        ...(settings
          ? [{
              id: getId(settings.id),
              label: getText(settings.brandName) || "Montelar settings",
              source: "settings" as const,
            }]
          : []),
        ...(primaryMenu
          ? [{
              id: getId(primaryMenu.id),
              label: getText(primaryMenu.title) || "Primary header menu",
              source: "navigation" as const,
            }]
          : []),
      ],
      linkedMedia: [
        mediaAsset({
          id: "public:/images/brand/montelar-logo-gold-20260511.png",
          label: "Header gold brand mark",
          src: "/images/brand/montelar-logo-gold-20260511.png",
        }),
      ],
      editableFields: [
        field({
          editHref: settingsHref,
          fieldPath: "contactPrimaryLabel",
          label: "Header consultation label",
          layer: "site-admin",
          linkedId: getId(settings?.id),
          source: "settings",
          status: settings ? "editable-now" : "planned-command",
          valuePreview: previewValue(settings?.contactPrimaryLabel),
        }),
        field({
          editHref: settingsHref,
          fieldPath: "contactPhoneDisplay",
          label: "Header phone display",
          layer: "site-admin",
          linkedId: getId(settings?.id),
          source: "settings",
          status: settings ? "editable-now" : "planned-command",
          valuePreview: previewValue(settings?.contactPhoneDisplay),
        }),
        field({
          editHref: settingsHref,
          fieldPath: "navigationBranches",
          label: "Navigation branch labels",
          layer: "site-admin",
          linkedId: getId(primaryMenu?.id),
          source: primaryMenu ? "navigation" : "component",
          status: primaryMenu ? "editable-now" : "planned-command",
          valuePreview: primaryMenu ? `${getArray(primaryMenu.items).length} menu items` : "derived from CMS pages and products",
        }),
        field({
          editHref: headerSettingsHref,
          fieldPath: "headerMenuLanguage.desktopLayoutMode",
          label: "Desktop header layout mode",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "brand-left-actions-right / centered-brand / route-specific",
        }),
        field({
          editHref: headerSettingsHref,
          fieldPath: "headerMenuLanguage.logoAsset",
          label: "Logo asset and optical alignment",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "gold brand mark plus alignment notes",
        }),
        field({
          editHref: headerSettingsHref,
          fieldPath: "headerMenuLanguage.phoneButton",
          label: "Phone button",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "visibility and short label",
        }),
        field({
          editHref: headerSettingsHref,
          fieldPath: "headerMenuLanguage.consultationCta",
          label: "Consultation CTA",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: previewValue(settings?.contactPrimaryLabel) || "label, link and visibility",
        }),
        field({
          editHref: headerSettingsHref,
          fieldPath: "headerMenuLanguage.motion",
          label: "Header reveal motion",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "timing, easing and reduced-motion fallback",
        }),
        field({
          editHref: headerSettingsHref,
          fieldPath: "headerMenuLanguage.routeAlignmentNotes",
          label: "Route-specific header alignment",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "protected notes for routes with optical shifts",
        }),
      ],
      actions: [
        action({
          description: "Edit header, footer, CTA and contact settings.",
          href: settingsHref,
          id: "edit-header-settings",
          label: "Edit header settings",
          layer: "site-admin",
          method: "GET",
        }),
        action({
          description: "Open protected layout, logo, CTA and motion settings for the public header.",
          href: headerSettingsHref,
          id: "edit-protected-header-behavior",
          label: "Edit protected header behavior",
          layer: "site-admin",
          method: "GET",
        }),
      ],
      gaps: [],
    },
    {
      id: "global.products-mega-menu",
      label: "Products mega menu",
      description: "Direction, category, product and inquiry paths in the Products branch.",
      layer: "site-admin",
      routePaths: routes,
      componentFiles: ["apps/web/src/components/site-header.tsx"],
      cssHooks: [".product-mega", ".product-mega-rail", ".product-menu-panel", ".desktop-product-menu"],
      publicUsage: ["Desktop products branch and mobile product branch drilldown."],
      linkedContent: [
        ...(productsMenu
          ? [{
              id: getId(productsMenu.id),
              label: getText(productsMenu.title) || "Products menu",
              source: "navigation" as const,
            }]
          : []),
        ...records.productDirections.map((direction) => ({
          id: getId(direction.id) || getText(direction.slug),
          label: getText(direction.name) || getText(direction.slug),
          routePath: normalizePath(getText(direction.routePath) || `/${getText(direction.slug)}`),
          source: "product-direction" as const,
        })),
        ...records.productCategories.slice(0, 8).map((category) => ({
          id: getId(category.id) || getText(category.slug),
          label: getText(category.label) || getText(category.slug),
          routePath: normalizePath(getText(category.routePath) || "/audio"),
          source: "product-category" as const,
        })),
      ],
      linkedMedia: [],
      editableFields: [
        field({
          editHref: settingsHref,
          fieldPath: "productDirectionOrder",
          label: "Direction order and labels",
          layer: "site-admin",
          source: "product-direction",
          status: records.productDirections.length ? "editable-now" : "planned-command",
          valuePreview: `${records.productDirections.length} launch directions`,
        }),
        field({
          editHref: settingsHref,
          fieldPath: "productMenuItems",
          label: "Products menu items",
          layer: "site-admin",
          linkedId: getId(productsMenu?.id),
          source: productsMenu ? "navigation" : "component",
          status: productsMenu ? "editable-now" : "planned-command",
          valuePreview: productsMenu ? `${getArray(productsMenu.items).length} configured items` : "derived from product hierarchy",
        }),
        field({
          editHref: productsMenuSettingsHref,
          fieldPath: "headerMenuLanguage.megaMenuGrouping",
          label: "Mega menu grouping rule",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "direction -> category -> product",
        }),
        field({
          editHref: productsMenuSettingsHref,
          fieldPath: "headerMenuLanguage.stableColumnCount",
          label: "Stable product columns",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "keeps open menu columns predictable",
        }),
        field({
          editHref: productsMenuSettingsHref,
          fieldPath: "headerMenuLanguage.closeBehavior",
          label: "Close menu after choosing",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "human setting, not click-handler wording",
        }),
        field({
          editHref: productsMenuSettingsHref,
          fieldPath: "headerMenuLanguage.menuOpenBehavior",
          label: "Menu open behavior",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "hover-and-click or click-only",
        }),
      ],
      actions: [
        action({
          description: "Open guided header/footer settings for product menu coverage.",
          href: settingsHref,
          id: "edit-products-menu",
          label: "Edit products menu",
          layer: "site-admin",
          method: "GET",
        }),
        action({
          description: "Open protected product menu grouping, column and close/open behavior settings.",
          href: productsMenuSettingsHref,
          id: "edit-products-menu-behavior",
          label: "Edit menu behavior",
          layer: "site-admin",
          method: "GET",
        }),
      ],
      gaps: [],
    },
    {
      id: "global.mobile-menu-language-logo",
      label: "Mobile menu, language and logo transition",
      description: "Mobile drawer, language switching and logo motion states used on small screens.",
      layer: "site-admin",
      routePaths: routes,
      componentFiles: ["apps/web/src/components/site-header.tsx", "apps/web/src/components/locale-switcher.tsx"],
      cssHooks: [".mobile-nav-toggle", ".mobile-nav-panel", ".header-locale-switcher", ".brand-logo-image"],
      publicUsage: ["Mobile header closed/open states and language dropdown across localized routes."],
      linkedContent: locales.map((locale) => ({
        id: getId(locale.id) || getText(locale.code),
        label: getText(locale.nativeLabel) || getText(locale.englishLabel) || getText(locale.code),
        source: "locale" as const,
      })),
      linkedMedia: [
        mediaAsset({
          id: "public:/images/brand/montelar-logo-gold-20260511.png",
          label: "Mobile gold brand mark",
          src: "/images/brand/montelar-logo-gold-20260511.png",
        }),
      ],
      editableFields: [
        field({
          editHref: languageHref,
          fieldPath: "localeOrder",
          label: "Language order and visibility",
          layer: "site-admin",
          source: "locale",
          status: locales.length ? "editable-now" : "planned-command",
          valuePreview: locales.map((locale) => getText(locale.code)).join(", "),
        }),
        field({
          editHref: mobileMenuSettingsHref,
          fieldPath: "headerMenuLanguage.defaultLanguageCode",
          label: "Default language",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: locales[0] ? getText(locales[0].code) : "ru",
        }),
        field({
          editHref: mobileMenuSettingsHref,
          fieldPath: "headerMenuLanguage.languageSwitcherDisplay",
          label: "Language switcher display",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "short code, name, or combined label",
        }),
        field({
          editHref: mobileMenuSettingsHref,
          fieldPath: "headerMenuLanguage.mobileLayoutMode",
          label: "Mobile header layout",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "logo centered with side actions",
        }),
        field({
          editHref: mobileMenuSettingsHref,
          fieldPath: "headerMenuLanguage.mobileLogoTransition",
          label: "Mobile logo transition",
          layer: "site-admin",
          source: "settings",
          status: "editable-now",
          valuePreview: "crossfade-center / slide-to-center / static",
        }),
      ],
      actions: [
        action({
          description: "Edit language switcher order and public visibility.",
          href: languageHref,
          id: "edit-language-switcher",
          label: "Edit language switcher",
          layer: "site-admin",
          method: "GET",
        }),
        action({
          description: "Open protected mobile menu, language display, logo transition and reduced-motion settings.",
          href: mobileMenuSettingsHref,
          id: "edit-mobile-menu-language-motion",
          label: "Edit mobile language and motion",
          layer: "site-admin",
          method: "GET",
        }),
      ],
      gaps: [],
    },
  ] satisfies SiteModuleDefinition[];
}

function buildRouteAndFooterModules(records: Awaited<ReturnType<typeof loadRegistryRecords>>) {
  const contactPage = firstBy(records.pages, (page) => getText(page.slug) === "contact") ?? routePage(records.pages, "/contact");
  const footerMenu = firstBy(records.navigation, (item) => getText(item.menuKey) === "footer-legal");
  const contactMenu = firstBy(records.navigation, (item) => getText(item.menuKey) === "contact-surfaces");
  const settings = firstBy(records.settings, (item) => getText(item.settingsScope) === "public-site") ?? records.settings[0] ?? null;
  const directionRoutes = records.productDirections
    .map((direction) => normalizePath(getText(direction.routePath) || `/${getText(direction.slug)}`))
    .filter(Boolean);
  const secondaryRoute = directionRoutes[0] ?? "/vision-max";
  const routeTemplateFiles = [
    "apps/web/src/components/route-page-template.tsx",
    "apps/web/src/components/direction-route-page.tsx",
    "apps/web/src/components/product-route-page.tsx",
  ];

  return [
    {
      id: "routes.banner-media-crops",
      label: "Route banners and media crops",
      description: "Reusable hero/banner layer for direction, product, request and editorial routes.",
      layer: "owner",
      routePaths: [secondaryRoute, "/products/[slug]", "/request/[productSlug]", "/brand", "/contact"],
      componentFiles: routeTemplateFiles,
      cssHooks: [".route-hero", ".route-hero-aside", ".product-hero-visual", ".request-hero-card"],
      publicUsage: [
        "Direction landing banners use RoutePageTemplate and direction presentation data.",
        "Product detail banners use product stage classes and product metadata.",
        "Request routes use product inquiry summary cards.",
      ],
      linkedContent: [
        ...records.productDirections.slice(0, 6).map((direction) => ({
          id: getId(direction.id) || getText(direction.slug),
          label: getText(direction.name) || getText(direction.slug),
          routePath: normalizePath(getText(direction.routePath) || `/${getText(direction.slug)}`),
          source: "product-direction" as const,
        })),
        ...records.products.slice(0, 8).map((product) => ({
          id: getId(product.id) || getText(product.slug),
          label: getText(product.name) || getText(product.slug),
          routePath: normalizePath(getText(product.routePath) || `/products/${getText(product.slug)}`),
          source: "product" as const,
        })),
      ],
      linkedMedia: records.media
        .filter((asset) => ["hero", "cover", "banner"].some((key) => getText(asset.assetRole).includes(key)))
        .slice(0, 8)
        .map((asset) => mediaAsset({
          alt: getText(asset.altText),
          id: getId(asset.id),
          label: getText(asset.assetTitle) || getText(asset.title) || getText(asset.filename) || "Route media",
          src: getText(asset.filename) ? `/uploads/${getText(asset.filename)}` : getText(asset.publicUrl),
        })),
      editableFields: [
        field({
          editHref: searchHref("/admin/site", { route: secondaryRoute }),
          fieldPath: "directionHeroText",
          label: "Direction hero text",
          layer: "owner",
          source: "product-direction",
          status: records.productDirections.length ? "editable-now" : "planned-command",
          valuePreview: `${records.productDirections.length} directions`,
        }),
        field({
          editHref: "/admin/media",
          fieldPath: "routeHeroMedia",
          label: "Route hero media and crops",
          layer: "owner",
          source: "media",
          status: records.media.length ? "editable-now" : "planned-command",
          valuePreview: `${records.media.length} media items`,
        }),
        field({
          fieldPath: "productStageObject",
          label: "Product visual object class",
          layer: "developer",
          source: "component",
          status: "not-cms-backed",
          valuePreview: "CSS-generated product stage",
        }),
      ],
      actions: [
        action({
          description: "Open the guided editor for a secondary public route.",
          href: searchHref("/admin/site", { route: secondaryRoute }),
          id: "open-secondary-route-editor",
          label: "Edit route banner",
          layer: "owner",
          method: "GET",
        }),
      ],
      gaps: [
        gap({
          description: "Product stage object visuals are generated by CSS and need module settings before owner tuning.",
          id: "route-banner-product-stage-settings",
          label: "Route visual stage needs settings",
          laterTaskId: "MNT-ADMIN-BFF-010B",
          moduleId: "routes.banner-media-crops",
        }),
      ],
    },
    {
      id: "global.contact-cta",
      label: "Global consultation and contact controls",
      description: "Header phone shortcut, primary CTA, contact route and inquiry handoff targets.",
      layer: "site-admin",
      routePaths: ["/", "/contact", "/request/[productSlug]"],
      componentFiles: [
        "apps/web/src/components/site-header.tsx",
        "apps/web/src/components/contact-route-page.tsx",
        "apps/web/src/components/product-request-route-page.tsx",
      ],
      cssHooks: [".header-phone-link", ".header-cta", ".home-primary-link", ".request-hero-card"],
      publicUsage: ["Header CTA, homepage CTA, contact route and product request routes."],
      linkedContent: [
        ...linkedPage(contactPage),
        ...(settings
          ? [{
              id: getId(settings.id),
              label: getText(settings.brandName) || "Contact settings",
              source: "settings" as const,
            }]
          : []),
        ...(contactMenu
          ? [{
              id: getId(contactMenu.id),
              label: getText(contactMenu.title) || "Contact surfaces",
              source: "navigation" as const,
            }]
          : []),
      ],
      linkedMedia: [],
      editableFields: [
        field({
          editHref: "/admin/site-admin?section=header-footer",
          fieldPath: "contactPrimaryHref",
          label: "Primary contact target",
          layer: "site-admin",
          linkedId: getId(settings?.id),
          source: "settings",
          status: settings ? "editable-now" : "planned-command",
          valuePreview: previewValue(settings?.contactPrimaryHref),
        }),
        field({
          editHref: "/admin/site-admin?section=header-footer",
          fieldPath: "contactEmail",
          label: "Contact email",
          layer: "site-admin",
          linkedId: getId(settings?.id),
          source: "settings",
          status: settings ? "editable-now" : "planned-command",
          valuePreview: previewValue(settings?.contactEmail),
        }),
      ],
      actions: [
        action({
          description: "Edit contact labels, phone and primary routes.",
          href: "/admin/site-admin?section=header-footer",
          id: "edit-contact-controls",
          label: "Edit contact controls",
          layer: "site-admin",
          method: "GET",
        }),
      ],
      gaps: [],
    },
    {
      id: "global.footer-legal-contact",
      label: "Footer, legal and support blocks",
      description: "Footer navigation, legal name, copyright note and support links.",
      layer: "site-admin",
      routePaths: ["/", "/brand", "/technology", "/downloads", "/contact"],
      componentFiles: ["apps/web/src/components/site-footer.tsx"],
      cssHooks: [".shell-footer", ".site-footer-grid", ".site-footer-link", ".site-footer-meta"],
      publicUsage: ["Rendered by the public shell on all site routes."],
      linkedContent: [
        ...(footerMenu
          ? [{
              id: getId(footerMenu.id),
              label: getText(footerMenu.title) || "Footer legal menu",
              source: "navigation" as const,
            }]
          : []),
        ...(settings
          ? [{
              id: getId(settings.id),
              label: getText(settings.brandName) || "Footer settings",
              source: "settings" as const,
            }]
          : []),
      ],
      linkedMedia: [],
      editableFields: [
        field({
          editHref: "/admin/site-admin?section=header-footer",
          fieldPath: "footerLegalName",
          label: "Footer legal name",
          layer: "site-admin",
          linkedId: getId(settings?.id),
          source: "settings",
          status: settings ? "editable-now" : "planned-command",
          valuePreview: previewValue(settings?.footerLegalName),
        }),
        field({
          editHref: "/admin/site-admin?section=header-footer",
          fieldPath: "footerCopyright",
          label: "Footer copyright note",
          layer: "site-admin",
          linkedId: getId(settings?.id),
          source: "settings",
          status: settings ? "editable-now" : "planned-command",
          valuePreview: previewValue(settings?.footerCopyright),
        }),
        field({
          editHref: "/admin/site-admin?section=header-footer",
          fieldPath: "footerLinks",
          label: "Footer links",
          layer: "site-admin",
          linkedId: getId(footerMenu?.id),
          source: footerMenu ? "navigation" : "page",
          status: footerMenu ? "editable-now" : "planned-command",
          valuePreview: footerMenu ? `${getArray(footerMenu.items).length} configured links` : "derived from footer pages",
        }),
      ],
      actions: [
        action({
          description: "Edit footer and legal settings.",
          href: "/admin/site-admin?section=header-footer",
          id: "edit-footer-settings",
          label: "Edit footer settings",
          layer: "site-admin",
          method: "GET",
        }),
      ],
      gaps: [],
    },
  ] satisfies SiteModuleDefinition[];
}

function buildRoutes(modules: SiteModuleDefinition[]) {
  const routeMap = new Map<string, string[]>();

  for (const module of modules) {
    for (const routePath of module.routePaths) {
      const normalized = normalizePath(routePath);
      routeMap.set(normalized, [...(routeMap.get(normalized) ?? []), module.id]);
    }
  }

  return Array.from(routeMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([routePath, moduleIds]) => ({
      moduleIds,
      routePath,
    }));
}

function filterSnapshot(snapshot: SiteModuleRegistrySnapshot, input: RegistryInput): SiteModuleRegistrySnapshot {
  const routePath = input.routePath ? normalizePath(input.routePath) : null;
  const moduleId = getText(input.moduleId);

  if (!routePath && !moduleId) {
    return snapshot;
  }

  const modules = snapshot.modules.filter((module) => {
    if (moduleId && module.id !== moduleId) {
      return false;
    }

    return !routePath || module.routePaths.some((moduleRoute) => normalizePath(moduleRoute) === routePath);
  });
  const gaps = modules.flatMap((module) => module.gaps);
  const routes = buildRoutes(modules);
  const editableNow = modules.flatMap((module) => module.editableFields).filter((item) => item.status === "editable-now").length;
  const plannedCommands = modules.flatMap((module) => module.editableFields).filter((item) => item.status === "planned-command").length;

  return {
    ...snapshot,
    gaps,
    modules,
    routes,
    summary: {
      editableNow,
      gaps: gaps.length,
      modules: modules.length,
      ownerModules: modules.filter((module) => module.layer === "owner").length,
      plannedCommands,
      routes: routes.length,
      siteAdminModules: modules.filter((module) => module.layer === "site-admin").length,
    },
  };
}

export async function getSiteModuleRegistry(
  payload: PayloadLike,
  input: RegistryInput = {},
): Promise<SiteModuleRegistrySnapshot> {
  const records = await loadRegistryRecords(payload);
  const modules = [
    ...buildHomeModules(records),
    ...buildHeaderModules(records),
    ...buildRouteAndFooterModules(records),
  ];
  const gaps = modules.flatMap((module) => module.gaps);
  const editableNow = modules.flatMap((module) => module.editableFields).filter((item) => item.status === "editable-now").length;
  const plannedCommands = modules.flatMap((module) => module.editableFields).filter((item) => item.status === "planned-command").length;
  const snapshot: SiteModuleRegistrySnapshot = {
    gaps,
    generatedAt: new Date().toISOString(),
    modules,
    routes: buildRoutes(modules),
    summary: {
      editableNow,
      gaps: gaps.length,
      modules: modules.length,
      ownerModules: modules.filter((module) => module.layer === "owner").length,
      plannedCommands,
      routes: buildRoutes(modules).length,
      siteAdminModules: modules.filter((module) => module.layer === "site-admin").length,
    },
  };

  return filterSnapshot(snapshot, input);
}

function ownerVisibleStrings(module: SiteModuleDefinition) {
  return [
    module.label,
    module.description,
    ...module.publicUsage,
    ...module.actions.map((item) => item.label),
    ...module.actions.map((item) => item.description),
    ...module.editableFields.map((item) => item.label),
    ...module.gaps.map((item) => item.label),
    ...module.gaps.map((item) => item.description),
    ...module.linkedContent.map((item) => item.label),
    ...module.linkedMedia.map((item) => item.label),
  ].filter(Boolean);
}

export function assertNoRawSiteModuleRegistryOutput(snapshot: SiteModuleRegistrySnapshot) {
  const forbiddenText = /\b(payload|collection|record|schema|raw|ownerRecordKey|productInquiryForms|pageSections)\b/i;
  const failures: string[] = [];

  for (const module of snapshot.modules) {
    for (const value of ownerVisibleStrings(module)) {
      if (forbiddenText.test(value)) {
        failures.push(`${module.id}: ${value}`);
      }
    }

    for (const actionItem of module.actions) {
      if (actionItem.href?.includes("/admin/collections")) {
        failures.push(`${module.id}: ${actionItem.href}`);
      }
    }

    for (const fieldItem of module.editableFields) {
      if (fieldItem.editHref?.includes("/admin/collections")) {
        failures.push(`${module.id}: ${fieldItem.editHref}`);
      }
    }
  }

  return failures;
}
