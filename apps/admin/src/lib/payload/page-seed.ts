import type { Payload } from "payload";

import { syncCatalogHierarchyAndProducts } from "./catalog-seed.ts";
import { getPublicNavigationMenu } from "./public-site.ts";

type SeedOperation = {
  id: number | string;
  operation: "created" | "updated";
  slug: string;
};

type SectionSeed = {
  body?: string;
  ctaContent?: {
    primaryLabel: string;
    primaryTarget: string;
    secondaryLabel?: string;
    secondaryTarget?: string;
  };
  directionSlugs?: string[];
  eyebrow?: string;
  heroContent?: {
    supportingLabel?: string;
  };
  internalCode: string;
  journalDownloadsContent?: {
    linkLabel?: string;
    linkTarget?: string;
  };
  lead?: string;
  materialsStory?: Array<{
    material: string;
    narrative: string;
  }>;
  pageFamiliesAllowed: string[];
  previewLabel: string;
  previewNotes?: string;
  proofModules?: Array<{
    body: string;
    label: string;
  }>;
  sectionKey: string;
  sectionType:
    | "hero"
    | "overview"
    | "product-grid"
    | "technology-proof"
    | "materials-story"
    | "gallery"
    | "cta"
    | "journal-downloads";
  sourceOfTruthArtifact: string;
  status: "draft" | "review" | "published";
  title: string;
  translationPriority?: "normal" | "high" | "critical";
};

type PageSeed = {
  approvalStatus: "approved" | "pending" | "needs-review" | "rejected";
  canonicalPath: string;
  headerLabelOverride?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaTarget?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaTarget?: string;
  heroSummary: string;
  indexable?: boolean;
  internalCode: string;
  introBody?: string;
  layoutMode:
    | "brand-editorial"
    | "catalog-landing"
    | "storytelling-longform"
    | "contact-service"
    | "minimal-system";
  navigationGroup?: string;
  navigationLabel?: string;
  navigationOrder: number;
  ownerReviewRequired?: boolean;
  pageFamily:
    | "home"
    | "brand-editorial"
    | "technology-editorial"
    | "craftsmanship-editorial"
    | "projects"
    | "journal-index"
    | "downloads"
    | "contact"
    | "request"
    | "dealer-or-partner"
    | "legal-or-policy"
    | "hidden-preview";
  pagePurpose: string;
  previewNotes?: string;
  previewPath: string;
  primaryLocale: "en";
  relatedDirectionSlugs?: string[];
  relatedProductSlugs?: string[];
  routePath: string;
  sectionCodes?: string[];
  sectionPlan?: Array<{
    expectedType?:
      | "hero"
      | "overview"
      | "product-grid"
      | "technology-proof"
      | "materials-story"
      | "gallery"
      | "cta"
      | "journal-downloads";
    notes?: string;
    sectionKey: string;
  }>;
  seo?: {
    description: string;
    title: string;
  };
  showInFooter: boolean;
  showInHeader: boolean;
  slug: string;
  sourceArtifactReferences?: Array<{
    artifactPath: string;
    note?: string;
  }>;
  sourceOfTruthArtifact: string;
  status: "draft" | "review" | "published";
  title: string;
  translationPriority?: "normal" | "high" | "critical";
};

type MenuSeedItem = {
  categorySlug?: string;
  children?: MenuSeedItem[];
  directionSlug?: string;
  href?: string;
  itemKey: string;
  label?: string;
  lineSlug?: string;
  opensInNewTab?: boolean;
  overrideHref?: string;
  overrideLabel?: string;
  pageSlug?: string;
  productSlug?: string;
  sourceType: "page" | "product-direction" | "product-category" | "product-line" | "product" | "custom-url";
  summary?: string;
  useSourceHref?: boolean;
  useSourceLabel?: boolean;
  visible?: boolean;
};

type NavigationMenuSeed = {
  derivedFromHierarchy: boolean;
  internalCode: string;
  items: MenuSeedItem[];
  locale: "en";
  menuKey:
    | "primary-header"
    | "products-mega"
    | "footer-primary"
    | "footer-legal"
    | "contact-surfaces";
  placement: "header" | "products" | "footer" | "contact" | "system";
  primaryLocale: "en";
  publicDescription: string;
  sourceOfTruthArtifact: string;
  status: "draft" | "review" | "published";
  title: string;
};

const pageSeedSourceArtifact =
  "docs/strategy/artifacts/MNT-ADMIN-019-page-navigation-seed.md";

export const editorialSectionSeeds: SectionSeed[] = [
  {
    eyebrow: "Montelar",
    heroContent: {
      supportingLabel: "Quiet luxury",
    },
    internalCode: "SEC_HOME_SIGNATURE_HERO",
    lead: "Calm first-fold narrative for the homepage while final luxury copy remains editable in CMS.",
    pageFamiliesAllowed: ["home"],
    previewLabel: "Homepage signature hero",
    sectionKey: "home-signature-hero",
    sectionType: "hero",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Architecture of image, sound and AI design",
    translationPriority: "high",
  },
  {
    directionSlugs: [
      "vision-max",
      "hi-end-audio",
      "living-glass",
      "hologram",
      "pictorial-art-display",
      "display-for-exhibition",
    ],
    internalCode: "SEC_HOME_DIRECTION_SPOTLIGHT",
    lead: "Launch directions are present now so admin previews and future navigation work from the same hierarchy.",
    pageFamiliesAllowed: ["home", "direction-landing"],
    previewLabel: "Direction spotlight grid",
    previewNotes: "Keeps the homepage tied to the frozen direction set without hardcoding final luxury narratives.",
    sectionKey: "direction-spotlight-grid",
    sectionType: "product-grid",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Launch directions",
    translationPriority: "high",
  },
  {
    body: "Compact editorial skeleton for page ownership, preview-safe summaries and later luxury copy replacement.",
    internalCode: "SEC_EDITORIAL_OVERVIEW",
    lead: "Reusable overview block for core editorial, support and route-owned contact surfaces.",
    pageFamiliesAllowed: [
      "brand-editorial",
      "technology-editorial",
      "craftsmanship-editorial",
      "projects",
      "journal-index",
      "downloads",
      "contact",
      "request",
      "dealer-or-partner",
      "legal-or-policy",
      "hidden-preview",
    ],
    previewLabel: "Editorial overview",
    sectionKey: "editorial-overview",
    sectionType: "overview",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Editorial overview",
    translationPriority: "high",
  },
  {
    internalCode: "SEC_TECHNOLOGY_PROOF_LEDGER",
    pageFamiliesAllowed: ["home", "technology-editorial", "direction-landing"],
    previewLabel: "Technology proof ledger",
    proofModules: [
      {
        body: "Room-first engineering, integration choreography and owner review checkpoints stay explicit from the seed stage.",
        label: "Engineering posture",
      },
      {
        body: "Final public claims remain editable; the seed only establishes the controlled proof structure and translation priority.",
        label: "Governed claims",
      },
    ],
    sectionKey: "technology-proof-ledger",
    sectionType: "technology-proof",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Technology proof points",
    translationPriority: "normal",
  },
  {
    internalCode: "SEC_MATERIALS_STORY_FOUNDATION",
    materialsStory: [
      {
        material: "Material restraint",
        narrative: "Finish, proportion and composition stay intentionally calm until richer luxury storytelling is approved.",
      },
      {
        material: "Architectural integration",
        narrative: "Every product family is framed as part of an environment, not a detached product card collection.",
      },
    ],
    pageFamiliesAllowed: ["home", "brand-editorial", "craftsmanship-editorial"],
    previewLabel: "Materials story foundation",
    sectionKey: "materials-story-foundation",
    sectionType: "materials-story",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Material and finish notes",
    translationPriority: "normal",
  },
  {
    ctaContent: {
      primaryLabel: "Request a consultation",
      primaryTarget: "/contact",
      secondaryLabel: "Explore Hi-end Audio",
      secondaryTarget: "/audio",
    },
    internalCode: "SEC_CONCIERGE_INQUIRY_CTA",
    pageFamiliesAllowed: [
      "home",
      "brand-editorial",
      "technology-editorial",
      "craftsmanship-editorial",
      "projects",
      "journal-index",
      "downloads",
      "contact",
      "request",
      "dealer-or-partner",
      "legal-or-policy",
    ],
    previewLabel: "Concierge inquiry button",
    sectionKey: "concierge-inquiry-cta",
    sectionType: "cta",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Private consultation button",
    translationPriority: "high",
  },
  {
    internalCode: "SEC_JOURNAL_DOWNLOADS_BRIDGE",
    journalDownloadsContent: {
      linkLabel: "Preview supporting materials",
      linkTarget: "/downloads",
    },
    pageFamiliesAllowed: ["home", "journal-index", "downloads"],
    previewLabel: "Journal and downloads bridge",
    sectionKey: "journal-downloads-bridge",
    sectionType: "journal-downloads",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Supporting materials",
    translationPriority: "normal",
  },
];

export const editorialPageSeeds: PageSeed[] = [
  {
    approvalStatus: "approved",
    canonicalPath: "/",
    heroPrimaryCtaLabel: "Explore directions",
    heroPrimaryCtaTarget: "/audio",
    heroSecondaryCtaLabel: "Request a consultation",
    heroSecondaryCtaTarget: "/contact",
    heroSummary: "Главная закрепляет концепцию Montelar и остается редактируемой из кабинета владельца.",
    internalCode: "PAGE_HOME",
    introBody: "Wave-two editorial seed for the homepage. It establishes route ownership, key section hooks and a governed navigation hand-off.",
    layoutMode: "brand-editorial",
    navigationOrder: 10,
    pageFamily: "home",
    pagePurpose: "Own the public homepage route and keep later visual and multilingual work attached to a governed page record.",
    previewPath: "/",
    primaryLocale: "en",
    relatedDirectionSlugs: [
      "vision-max",
      "hi-end-audio",
      "living-glass",
      "hologram",
      "pictorial-art-display",
      "display-for-exhibition",
    ],
    routePath: "/",
    sectionCodes: [
      "SEC_HOME_SIGNATURE_HERO",
      "SEC_HOME_DIRECTION_SPOTLIGHT",
      "SEC_TECHNOLOGY_PROOF_LEDGER",
      "SEC_CONCIERGE_INQUIRY_CTA",
      "SEC_JOURNAL_DOWNLOADS_BRIDGE",
    ],
    seo: {
      description: "Montelar homepage seed for quiet-luxury image, sound and design architecture.",
      title: "Montelar | Quiet luxury",
    },
    showInFooter: false,
    showInHeader: false,
    slug: "home",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Home",
    translationPriority: "high",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/brand",
    heroPrimaryCtaLabel: "Request a consultation",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Brand worldview, positioning and luxury posture live here as editable CMS-owned content.",
    internalCode: "PAGE_BRAND",
    introBody: "Seeded as a calm editorial landing owned by CMS, not by hardcoded route copy.",
    layoutMode: "brand-editorial",
    navigationLabel: "Brand",
    navigationOrder: 70,
    pageFamily: "brand-editorial",
    pagePurpose: "Own the brand route for future storytelling, media and translation layers.",
    previewPath: "/brand",
    primaryLocale: "en",
    routePath: "/brand",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_MATERIALS_STORY_FOUNDATION", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Brand story, positioning and quiet-luxury worldview.",
      title: "Brand | Montelar",
    },
    showInFooter: true,
    showInHeader: true,
    slug: "brand",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Brand",
    translationPriority: "high",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/technology",
    heroPrimaryCtaLabel: "View Vision MAX",
    heroPrimaryCtaTarget: "/vision-max",
    heroSummary: "Technology route for engineering narratives and proof structure.",
    internalCode: "PAGE_TECHNOLOGY",
    introBody: "The seed keeps the technology route owned by CMS while later technical storytelling remains editable.",
    layoutMode: "storytelling-longform",
    navigationOrder: 80,
    pageFamily: "technology-editorial",
    pagePurpose: "Hold engineering, proof and innovation narratives without reopening route ownership later.",
    previewPath: "/technology",
    primaryLocale: "en",
    relatedDirectionSlugs: ["vision-max", "hi-end-audio", "living-glass"],
    routePath: "/technology",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_TECHNOLOGY_PROOF_LEDGER", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Technology narratives, engineering philosophy and innovation surfaces.",
      title: "Technology | Montelar",
    },
    showInFooter: true,
    showInHeader: false,
    slug: "technology",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Technology",
    translationPriority: "high",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/craftsmanship",
    heroPrimaryCtaLabel: "Contact Montelar",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Craftsmanship route for materiality, finishing and assembly standards.",
    internalCode: "PAGE_CRAFTSMANSHIP",
    introBody: "Material and assembly narratives stay compact for now but fully owned by the CMS model.",
    layoutMode: "storytelling-longform",
    navigationOrder: 90,
    pageFamily: "craftsmanship-editorial",
    pagePurpose: "Own the craftsmanship route for future finish stories, process media and translations.",
    previewPath: "/craftsmanship",
    primaryLocale: "en",
    routePath: "/craftsmanship",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_MATERIALS_STORY_FOUNDATION", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Materiality, finishing and production standards.",
      title: "Craftsmanship | Montelar",
    },
    showInFooter: true,
    showInHeader: false,
    slug: "craftsmanship",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Craftsmanship",
    translationPriority: "normal",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/projects",
    heroPrimaryCtaLabel: "Start a project conversation",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Projects route for case-study storytelling and environment-led proof.",
    internalCode: "PAGE_PROJECTS",
    introBody: "The CMS seed establishes the route, a published overview and a gallery placeholder plan for later case studies.",
    layoutMode: "storytelling-longform",
    navigationLabel: "Projects",
    navigationOrder: 100,
    pageFamily: "projects",
    pagePurpose: "Hold case-study and installation storytelling without route churn.",
    previewPath: "/projects",
    primaryLocale: "en",
    relatedDirectionSlugs: ["vision-max", "display-for-exhibition", "living-glass"],
    routePath: "/projects",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_CONCIERGE_INQUIRY_CTA"],
    sectionPlan: [
      {
        expectedType: "gallery",
        notes: "Gallery remains a planned editorial surface until approved project media is seeded.",
        sectionKey: "projects-gallery",
      },
    ],
    seo: {
      description: "Case-study and installation storytelling.",
      title: "Projects | Montelar",
    },
    showInFooter: true,
    showInHeader: true,
    slug: "projects",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Projects",
    translationPriority: "high",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/journal",
    heroPrimaryCtaLabel: "Browse downloads",
    heroPrimaryCtaTarget: "/downloads",
    heroSummary: "Editorial updates, launches and cultural notes.",
    internalCode: "PAGE_JOURNAL",
    introBody: "Journal remains intentionally compact in the first seed while admin and navigation work gain a governed owner record.",
    layoutMode: "brand-editorial",
    navigationOrder: 110,
    pageFamily: "journal-index",
    pagePurpose: "Own the journal index route for later editorial publishing and translation work.",
    previewPath: "/journal",
    primaryLocale: "en",
    routePath: "/journal",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_JOURNAL_DOWNLOADS_BRIDGE", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Editorial updates, launches and cultural notes.",
      title: "Journal | Montelar",
    },
    showInFooter: true,
    showInHeader: false,
    slug: "journal",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Journal",
    translationPriority: "normal",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/downloads",
    heroPrimaryCtaLabel: "Contact Montelar",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Brochures, technical documents and future gated assets.",
    internalCode: "PAGE_DOWNLOADS",
    introBody: "Seeded now so document workflows, future preview mode and navigation records can target one stable page owner.",
    layoutMode: "minimal-system",
    navigationOrder: 120,
    pageFamily: "downloads",
    pagePurpose: "Own the downloads route before media and document tasks seed richer records.",
    previewPath: "/downloads",
    primaryLocale: "en",
    routePath: "/downloads",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_JOURNAL_DOWNLOADS_BRIDGE", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Brochures, technical documents and future gated assets.",
      title: "Downloads | Montelar",
    },
    showInFooter: true,
    showInHeader: false,
    slug: "downloads",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Downloads",
    translationPriority: "normal",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/contact",
    heroPrimaryCtaLabel: "Request a consultation",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Dealer, partnership and direct brand contact surface.",
    internalCode: "PAGE_CONTACT",
    introBody: "Primary contact routing page for concierge, dealer and project intake flows.",
    layoutMode: "contact-service",
    navigationLabel: "Contact",
    navigationOrder: 130,
    pageFamily: "contact",
    pagePurpose: "Own the main consultation and follow-up route used across navigation and request surfaces.",
    previewPath: "/contact",
    primaryLocale: "en",
    routePath: "/contact",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Dealer, partnership and direct brand contact surface.",
      title: "Contact | Montelar",
    },
    showInFooter: true,
    showInHeader: true,
    slug: "contact",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Contact",
    translationPriority: "high",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/request/vision-max-premium",
    heroPrimaryCtaLabel: "Continue to contact",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Preview-safe product request landing for Vision MAX Premium.",
    indexable: false,
    internalCode: "PAGE_REQUEST_VISION_MAX_PREMIUM",
    introBody: "One request-surface page is seeded now so the public request route has a governed CMS owner before the full forms pass.",
    layoutMode: "contact-service",
    navigationGroup: "requests",
    navigationOrder: 210,
    ownerReviewRequired: false,
    pageFamily: "request",
    pagePurpose: "Provide a real CMS-owned request route that future inquiry forms, preview mode and lead routing can attach to.",
    previewPath: "/request/vision-max-premium",
    primaryLocale: "en",
    relatedProductSlugs: ["vision-max-premium"],
    routePath: "/request/vision-max-premium",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_CONCIERGE_INQUIRY_CTA"],
    showInFooter: false,
    showInHeader: false,
    slug: "vision-max-premium",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Request Vision MAX Premium",
    translationPriority: "high",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/dealer-partner",
    heroPrimaryCtaLabel: "Start a dealer conversation",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Dealer and partner routing surface for regional follow-up and controlled onboarding.",
    internalCode: "PAGE_DEALER_PARTNER",
    introBody: "This page keeps dealer and partner follow-up editable without merging it into the main contact copy too early.",
    layoutMode: "contact-service",
    navigationLabel: "Dealer & Partner",
    navigationOrder: 140,
    pageFamily: "dealer-or-partner",
    pagePurpose: "Separate partner and dealer routing from the main contact narrative while keeping both inside CMS governance.",
    previewPath: "/dealer-partner",
    primaryLocale: "en",
    routePath: "/dealer-partner",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Dealer and partner routing surface for regional follow-up.",
      title: "Dealer & Partner | Montelar",
    },
    showInFooter: true,
    showInHeader: false,
    slug: "dealer-partner",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Dealer & Partner",
    translationPriority: "normal",
  },
  {
    approvalStatus: "approved",
    canonicalPath: "/privacy-policy",
    heroPrimaryCtaLabel: "Contact Montelar",
    heroPrimaryCtaTarget: "/contact",
    heroSummary: "Legal and privacy baseline page for footer governance and later policy expansion.",
    internalCode: "PAGE_PRIVACY_POLICY",
    introBody: "The seed keeps legal ownership explicit without pretending the final legal copy is complete.",
    layoutMode: "minimal-system",
    navigationOrder: 150,
    pageFamily: "legal-or-policy",
    pagePurpose: "Own a first legal route so footer governance, SEO and policy updates have a stable CMS record.",
    previewPath: "/privacy-policy",
    primaryLocale: "en",
    routePath: "/privacy-policy",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW", "SEC_CONCIERGE_INQUIRY_CTA"],
    seo: {
      description: "Legal and privacy baseline page for footer governance.",
      title: "Privacy Policy | Montelar",
    },
    showInFooter: false,
    showInHeader: false,
    slug: "privacy-policy",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Privacy Policy",
    translationPriority: "normal",
  },
  {
    approvalStatus: "pending",
    canonicalPath: "/preview/admin-preview",
    heroSummary: "Hidden preview utility page for internal editorial checks.",
    indexable: false,
    internalCode: "PAGE_ADMIN_PREVIEW",
    introBody: "Kept as a draft utility owner record for preview-safe internal wiring.",
    layoutMode: "minimal-system",
    navigationOrder: 999,
    ownerReviewRequired: false,
    pageFamily: "hidden-preview",
    pagePurpose: "Reserve a CMS-owned utility route for future preview-mode and editorial QA wiring.",
    previewNotes: "Hidden utility page. Keep out of public navigation and indexing.",
    previewPath: "/preview/admin-preview",
    primaryLocale: "en",
    routePath: "/preview/admin-preview",
    sectionCodes: ["SEC_EDITORIAL_OVERVIEW"],
    showInFooter: false,
    showInHeader: false,
    slug: "admin-preview",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "draft",
    title: "Admin Preview Utility",
    translationPriority: "normal",
  },
];

export const navigationMenuSeeds: NavigationMenuSeed[] = [
  {
    derivedFromHierarchy: true,
    internalCode: "NAV_PRIMARY_HEADER_EN",
    items: [
      {
        children: [
          { directionSlug: "vision-max", itemKey: "vision-max", sourceType: "product-direction" },
          { directionSlug: "hi-end-audio", itemKey: "audio", sourceType: "product-direction" },
          { directionSlug: "living-glass", itemKey: "living-glass", sourceType: "product-direction" },
          { directionSlug: "hologram", itemKey: "hologram", sourceType: "product-direction" },
          { directionSlug: "pictorial-art-display", itemKey: "pictorial", sourceType: "product-direction" },
          { directionSlug: "display-for-exhibition", itemKey: "exhibition", sourceType: "product-direction" },
        ],
        href: "/audio",
        itemKey: "products",
        label: "Products",
        sourceType: "custom-url",
        summary: "Launch directions seeded from the frozen Montelar hierarchy.",
      },
      {
        itemKey: "brand",
        pageSlug: "brand",
        sourceType: "page",
        summary: "Brand narrative and quiet-luxury positioning.",
      },
      {
        itemKey: "projects",
        pageSlug: "projects",
        sourceType: "page",
        summary: "Environment-led project and installation storytelling.",
      },
      {
        itemKey: "contact",
        pageSlug: "contact",
        sourceType: "page",
        summary: "Consultation, dealer and direct contact routing.",
      },
    ],
    locale: "en",
    menuKey: "primary-header",
    placement: "header",
    primaryLocale: "en",
    publicDescription: "Primary public header navigation.",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Primary Header",
  },
  {
    derivedFromHierarchy: true,
    internalCode: "NAV_PRODUCTS_MEGA_EN",
    items: [
      {
        children: [
          { categorySlug: "speakers", itemKey: "speakers", sourceType: "product-category" },
          { categorySlug: "streamers", itemKey: "streamers", sourceType: "product-category" },
          { categorySlug: "dac", itemKey: "dac", sourceType: "product-category" },
          { categorySlug: "amplifiers", itemKey: "amplifiers", sourceType: "product-category" },
          { categorySlug: "perfect-conductors", itemKey: "perfect-conductors", sourceType: "product-category" },
        ],
        directionSlug: "hi-end-audio",
        itemKey: "audio",
        sourceType: "product-direction",
        summary: "Hi-end Audio categories.",
      },
      {
        children: [
          { itemKey: "vision-max-premium", productSlug: "vision-max-premium", sourceType: "product" },
        ],
        directionSlug: "vision-max",
        itemKey: "vision-max",
        sourceType: "product-direction",
        summary: "Private cinema programs.",
      },
      {
        children: [
          { itemKey: "living-glass-oled", productSlug: "living-glass-oled", sourceType: "product" },
        ],
        directionSlug: "living-glass",
        itemKey: "living-glass",
        sourceType: "product-direction",
        summary: "Transparent display systems.",
      },
      {
        directionSlug: "hologram",
        itemKey: "hologram",
        sourceType: "product-direction",
        summary: "Spatial presentation direction.",
      },
      {
        children: [
          { itemKey: "pictorial-canvas", productSlug: "pictorial-canvas", sourceType: "product" },
        ],
        directionSlug: "pictorial-art-display",
        itemKey: "pictorial",
        sourceType: "product-direction",
        summary: "Framed digital art objects.",
      },
      {
        children: [
          { itemKey: "exhibition-wall", productSlug: "exhibition-wall", sourceType: "product" },
          { itemKey: "exhibition-table", productSlug: "exhibition-table", sourceType: "product" },
        ],
        directionSlug: "display-for-exhibition",
        itemKey: "exhibition",
        sourceType: "product-direction",
        summary: "Embedded exhibition touch surfaces.",
      },
    ],
    locale: "en",
    menuKey: "products-mega",
    placement: "products",
    primaryLocale: "en",
    publicDescription: "Hierarchy-derived products mega menu baseline.",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Products Mega Menu",
  },
  {
    derivedFromHierarchy: false,
    internalCode: "NAV_FOOTER_PRIMARY_EN",
    items: [
      { itemKey: "brand", pageSlug: "brand", sourceType: "page" },
      { itemKey: "technology", pageSlug: "technology", sourceType: "page" },
      { itemKey: "craftsmanship", pageSlug: "craftsmanship", sourceType: "page" },
      { itemKey: "projects", pageSlug: "projects", sourceType: "page" },
      { itemKey: "journal", pageSlug: "journal", sourceType: "page" },
      { itemKey: "downloads", pageSlug: "downloads", sourceType: "page" },
      { itemKey: "contact", pageSlug: "contact", sourceType: "page" },
      { itemKey: "dealer-partner", pageSlug: "dealer-partner", sourceType: "page" },
    ],
    locale: "en",
    menuKey: "footer-primary",
    placement: "footer",
    primaryLocale: "en",
    publicDescription: "Primary footer navigation for editorial and support routes.",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Footer Primary",
  },
  {
    derivedFromHierarchy: false,
    internalCode: "NAV_FOOTER_LEGAL_EN",
    items: [
      { itemKey: "privacy-policy", pageSlug: "privacy-policy", sourceType: "page" },
    ],
    locale: "en",
    menuKey: "footer-legal",
    placement: "footer",
    primaryLocale: "en",
    publicDescription: "Legal footer navigation.",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Footer Legal",
  },
  {
    derivedFromHierarchy: false,
    internalCode: "NAV_CONTACT_SURFACES_EN",
    items: [
      { itemKey: "contact", pageSlug: "contact", sourceType: "page", summary: "Primary consultation route." },
      {
        itemKey: "request-vision-max-premium",
        pageSlug: "vision-max-premium",
        sourceType: "page",
        summary: "Seeded request landing tied to a real product route.",
      },
      {
        itemKey: "dealer-partner",
        pageSlug: "dealer-partner",
        sourceType: "page",
        summary: "Dealer and partner follow-up surface.",
      },
    ],
    locale: "en",
    menuKey: "contact-surfaces",
    placement: "contact",
    primaryLocale: "en",
    publicDescription: "Consultation and partner routing menu.",
    sourceOfTruthArtifact: pageSeedSourceArtifact,
    status: "published",
    title: "Contact Surfaces",
  },
];

function requireDocumentId(
  value: { id?: number | string } | null,
  label: string,
): number | string {
  if (!value || (typeof value.id !== "number" && typeof value.id !== "string")) {
    throw new Error(`Page seed failed: missing ${label}.`);
  }

  return value.id;
}

async function findOneByField(
  payload: Payload,
  collection: string,
  field: string,
  value: string,
): Promise<{ id?: number | string } | null> {
  const result = await payload.find({
    collection: collection as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      [field]: {
        equals: value,
      },
    },
  });

  return (result.docs[0] as { id?: number | string } | undefined) ?? null;
}

async function findSectionByInternalCode(payload: Payload, internalCode: string) {
  return findOneByField(payload, "page-sections", "internalCode", internalCode);
}

async function findPageBySlug(payload: Payload, slug: string) {
  return findOneByField(payload, "pages", "slug", slug);
}

async function findDirectionBySlug(payload: Payload, slug: string) {
  return findOneByField(payload, "product-directions", "slug", slug);
}

async function findCategoryBySlug(payload: Payload, slug: string) {
  return findOneByField(payload, "product-categories", "slug", slug);
}

async function findProductBySlug(payload: Payload, slug: string) {
  return findOneByField(payload, "products", "slug", slug);
}

async function buildSectionData(payload: Payload, seed: SectionSeed) {
  const data: Record<string, unknown> = {
    body: seed.body,
    eyebrow: seed.eyebrow,
    heroContent: seed.heroContent,
    internalCode: seed.internalCode,
    journalDownloadsContent: seed.journalDownloadsContent,
    lead: seed.lead,
    materialsStory: seed.materialsStory,
    pageFamiliesAllowed: seed.pageFamiliesAllowed,
    previewLabel: seed.previewLabel,
    previewNotes: seed.previewNotes,
    proofModules: seed.proofModules,
    sectionKey: seed.sectionKey,
    sectionType: seed.sectionType,
    sourceOfTruthArtifact: seed.sourceOfTruthArtifact,
    status: seed.status,
    title: seed.title,
    translationPriority: seed.translationPriority ?? "normal",
  };

  if (seed.ctaContent) {
    data.ctaContent = seed.ctaContent;
  }

  if (seed.directionSlugs?.length) {
    const directionIds: Array<number | string> = [];

    for (const slug of seed.directionSlugs) {
      const direction = await findDirectionBySlug(payload, slug);
      directionIds.push(requireDocumentId(direction, `direction ${slug} for section ${seed.internalCode}`));
    }

    data.productGridContent = {
      directions: directionIds,
      gridMode: "direction-spotlight",
      maxItems: directionIds.length,
    };
  }

  return data;
}

async function upsertSection(payload: Payload, seed: SectionSeed): Promise<SeedOperation> {
  const existing = await findSectionByInternalCode(payload, seed.internalCode);
  const data = await buildSectionData(payload, seed);

  if (existing) {
    const updated = await payload.update({
      collection: "page-sections",
      data: data as never,
      id: requireDocumentId(existing, `section ${seed.internalCode}`),
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, operation: "updated", slug: seed.sectionKey };
  }

  const created = await payload.create({
    collection: "page-sections",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, operation: "created", slug: seed.sectionKey };
}

async function buildPageData(payload: Payload, seed: PageSeed) {
  const data: Record<string, unknown> = {
    approvalStatus: seed.approvalStatus,
    canonicalPath: seed.canonicalPath,
    heroPrimaryCtaLabel: seed.heroPrimaryCtaLabel,
    heroPrimaryCtaTarget: seed.heroPrimaryCtaTarget,
    heroSecondaryCtaLabel: seed.heroSecondaryCtaLabel,
    heroSecondaryCtaTarget: seed.heroSecondaryCtaTarget,
    heroSummary: seed.heroSummary,
    indexable: seed.indexable ?? true,
    internalCode: seed.internalCode,
    introBody: seed.introBody,
    layoutMode: seed.layoutMode,
    navigationGroup: seed.navigationGroup,
    navigationLabel: seed.navigationLabel,
    navigationOrder: seed.navigationOrder,
    ownerReviewRequired: seed.ownerReviewRequired ?? false,
    pageFamily: seed.pageFamily,
    pagePurpose: seed.pagePurpose,
    previewNotes: seed.previewNotes,
    previewPath: seed.previewPath,
    primaryLocale: seed.primaryLocale,
    routePath: seed.routePath,
    sectionPlan: seed.sectionPlan,
    seo: seed.seo,
    showInFooter: seed.showInFooter,
    showInHeader: seed.showInHeader,
    slug: seed.slug,
    sourceArtifactReferences: seed.sourceArtifactReferences,
    sourceOfTruthArtifact: seed.sourceOfTruthArtifact,
    status: seed.status,
    title: seed.title,
    translationPriority: seed.translationPriority ?? "normal",
  };

  if (seed.sectionCodes?.length) {
    const sections = [];

    for (const [index, sectionCode] of seed.sectionCodes.entries()) {
      const section = await findSectionByInternalCode(payload, sectionCode);

      sections.push({
        order: (index + 1) * 10,
        section: requireDocumentId(section, `section ${sectionCode} for page ${seed.slug}`),
        visible: true,
      });
    }

    data.sections = sections;
  }

  if (seed.relatedDirectionSlugs?.length) {
    const directionIds: Array<number | string> = [];

    for (const slug of seed.relatedDirectionSlugs) {
      const direction = await findDirectionBySlug(payload, slug);
      directionIds.push(requireDocumentId(direction, `direction ${slug} for page ${seed.slug}`));
    }

    data.relatedDirections = directionIds;
  }

  if (seed.relatedProductSlugs?.length) {
    const productIds: Array<number | string> = [];

    for (const slug of seed.relatedProductSlugs) {
      const product = await findProductBySlug(payload, slug);
      productIds.push(requireDocumentId(product, `product ${slug} for page ${seed.slug}`));
    }

    data.relatedProducts = productIds;
  }

  return data;
}

async function upsertPage(payload: Payload, seed: PageSeed): Promise<SeedOperation> {
  const existing = await findPageBySlug(payload, seed.slug);
  const data = await buildPageData(payload, seed);

  if (existing) {
    const updated = await payload.update({
      collection: "pages",
      data: data as never,
      id: requireDocumentId(existing, `page ${seed.slug}`),
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, operation: "updated", slug: seed.slug };
  }

  const created = await payload.create({
    collection: "pages",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, operation: "created", slug: seed.slug };
}

async function buildMenuItem(
  payload: Payload,
  item: MenuSeedItem,
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {
    itemKey: item.itemKey,
    opensInNewTab: item.opensInNewTab ?? false,
    overrideHref: item.overrideHref,
    overrideLabel: item.overrideLabel,
    sourceType: item.sourceType,
    summary: item.summary,
    useSourceHref: item.useSourceHref ?? true,
    useSourceLabel: item.useSourceLabel ?? true,
    visible: item.visible ?? true,
  };

  if (item.sourceType === "custom-url") {
    data.href = item.href;
    data.label = item.label;
  }

  if (item.pageSlug) {
    const page = await findPageBySlug(payload, item.pageSlug);
    data.sourcePage = requireDocumentId(page, `page ${item.pageSlug} for menu ${item.itemKey}`);
  }

  if (item.directionSlug) {
    const direction = await findDirectionBySlug(payload, item.directionSlug);
    data.sourceDirection = requireDocumentId(
      direction,
      `direction ${item.directionSlug} for menu ${item.itemKey}`,
    );
  }

  if (item.categorySlug) {
    const category = await findCategoryBySlug(payload, item.categorySlug);
    data.sourceCategory = requireDocumentId(
      category,
      `category ${item.categorySlug} for menu ${item.itemKey}`,
    );
  }

  if (item.lineSlug) {
    const line = await findOneByField(payload, "product-lines", "slug", item.lineSlug);
    data.sourceLine = requireDocumentId(line, `line ${item.lineSlug} for menu ${item.itemKey}`);
  }

  if (item.productSlug) {
    const product = await findProductBySlug(payload, item.productSlug);
    data.sourceProduct = requireDocumentId(
      product,
      `product ${item.productSlug} for menu ${item.itemKey}`,
    );
  }

  if (item.children?.length) {
    data.children = [];

    for (const child of item.children) {
      (data.children as Array<Record<string, unknown>>).push(await buildMenuItem(payload, child));
    }
  }

  return data;
}

async function upsertNavigationMenu(
  payload: Payload,
  seed: NavigationMenuSeed,
): Promise<SeedOperation> {
  const existing = await findOneByField(payload, "navigation-menus", "internalCode", seed.internalCode);
  const items = [];

  for (const item of seed.items) {
    items.push(await buildMenuItem(payload, item));
  }

  const data = {
    derivedFromHierarchy: seed.derivedFromHierarchy,
    internalCode: seed.internalCode,
    items,
    locale: seed.locale,
    menuKey: seed.menuKey,
    placement: seed.placement,
    primaryLocale: seed.primaryLocale,
    publicDescription: seed.publicDescription,
    sourceOfTruthArtifact: seed.sourceOfTruthArtifact,
    status: seed.status,
    title: seed.title,
  };

  if (existing) {
    const updated = await payload.update({
      collection: "navigation-menus",
      data: data as never,
      id: requireDocumentId(existing, `navigation menu ${seed.internalCode}`),
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, operation: "updated", slug: seed.menuKey };
  }

  const created = await payload.create({
    collection: "navigation-menus",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, operation: "created", slug: seed.menuKey };
}

export async function syncEditorialPagesSectionsAndNavigation(payload: Payload) {
  const catalogSummary = await syncCatalogHierarchyAndProducts(payload);
  const sectionOperations: SeedOperation[] = [];
  const pageOperations: SeedOperation[] = [];
  const navigationOperations: SeedOperation[] = [];

  for (const seed of editorialSectionSeeds) {
    sectionOperations.push(await upsertSection(payload, seed));
  }

  for (const seed of editorialPageSeeds) {
    pageOperations.push(await upsertPage(payload, seed));
  }

  for (const seed of navigationMenuSeeds) {
    navigationOperations.push(await upsertNavigationMenu(payload, seed));
  }

  const primaryHeader = await getPublicNavigationMenu(payload, "en", "primary-header");
  const productsMega = await getPublicNavigationMenu(payload, "en", "products-mega");

  return {
    ...catalogSummary,
    navigationCount: navigationMenuSeeds.length,
    navigationOperations,
    pageCount: editorialPageSeeds.length,
    pageOperations,
    publicNavigationChecks: {
      primaryHeaderItems: primaryHeader?.items.length ?? 0,
      productsMegaItems: productsMega?.items.length ?? 0,
    },
    sectionCount: editorialSectionSeeds.length,
    sectionOperations,
  };
}
