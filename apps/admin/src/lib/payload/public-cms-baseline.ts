import type { Payload, Where } from "payload";

import { syncCatalogHierarchyAndProducts } from "./catalog-seed.ts";
import { syncInquiryFormsAndSampleLeads } from "./inquiry-seed.ts";
import { launchLocaleSeeds } from "./locales.ts";
import { syncMediaDocumentsAndCreativeRecords } from "./media-seed.ts";
import { syncEditorialPagesSectionsAndNavigation } from "./page-seed.ts";
import { syncWaveZeroPlatform } from "./platform-seed.ts";

type AnyDoc = Record<string, unknown> & {
  id: number | string;
};

type SeedOperation = {
  id: number | string;
  internalCode: string;
  operation: "created" | "updated";
};

type SeoSeed = {
  approvalStatus?: "approved" | "pending";
  internalCode: string;
  locale: string;
  metaDescription: string;
  metaTitle: string;
  ownerType: "page" | "product-direction" | "product";
  previewOnly?: boolean;
  publicationReadiness?: "blocked" | "preview-only" | "production-ready";
  routePath: string;
  sourceToken: string;
  sourceType: "page-route" | "product-direction-slug" | "product-slug";
};

type TranslationSeed = {
  fallbackMode: "allow-explicit-source-fallback" | "allow-source-preview-only" | "no-public-fallback";
  fieldScope: "editorial-copy" | "form-copy" | "full-record";
  formLabelSnapshot?: string;
  internalNotes: string;
  localizedExcerpt?: string;
  ownerCollection: "pages" | "product-inquiry-forms" | "products";
  ownerKey: string;
  ownerLabelSnapshot: string;
  publishReadiness: "blocked" | "not-ready" | "ready" | "ready-with-fallback";
  routeLocalizationRequired: boolean;
  sourceRoutePathSnapshot?: string;
  sourceTitleSnapshot: string;
  sourceToken: string;
  sourceType: "page-route" | "product-inquiry-form-slug" | "product-slug";
  status: "draft" | "review";
  structuredFieldMap: Array<{
    fieldKey: string;
    value: string;
    valueType?: "json" | "long-text" | "text";
  }>;
  targetLocale: string;
  targetRoutePath?: string;
  targetSlug?: string;
  targetTitle?: string;
  workflowStage: "human-edit" | "machine-draft" | "queued" | "seo-review";
};

const sourceOfTruthArtifact = "docs/strategy/artifacts/MNT-ADMIN-038-mock-data-migration.md";
const representativePublishedProductSlugs = ["vision-max-premium"] as const;

const seoSeeds: SeoSeed[] = [
  {
    internalCode: "SEO_PUBLIC_HOME_EN",
    locale: "en",
    metaDescription:
      "Montelar homepage metadata migrated from mock runtime into governed Payload publishing records.",
    metaTitle: "Montelar | Quiet luxury technology",
    ownerType: "page",
    routePath: "/",
    sourceToken: "/",
    sourceType: "page-route",
  },
  {
    internalCode: "SEO_PUBLIC_HOME_FR",
    locale: "fr",
    metaDescription:
      "Metadata homepage de Montelar geree depuis Payload pour les premieres surfaces publiques multilingues.",
    metaTitle: "Montelar | Luxe discret technologique",
    ownerType: "page",
    routePath: "/fr",
    sourceToken: "/",
    sourceType: "page-route",
  },
  {
    internalCode: "SEO_PUBLIC_VISION_MAX_DIRECTION_EN",
    locale: "en",
    metaDescription:
      "Vision MAX route metadata now lives in Payload instead of the mock CMS baseline.",
    metaTitle: "Vision MAX | Montelar",
    ownerType: "product-direction",
    routePath: "/vision-max",
    sourceToken: "vision-max",
    sourceType: "product-direction-slug",
  },
  {
    internalCode: "SEO_PUBLIC_VISION_MAX_PREMIUM_PRODUCT_EN",
    locale: "en",
    metaDescription:
      "Vision MAX Premium product metadata now resolves from Payload-backed SEO records.",
    metaTitle: "Vision MAX Premium | Montelar",
    ownerType: "product",
    routePath: "/products/vision-max-premium",
    sourceToken: "vision-max-premium",
    sourceType: "product-slug",
  },
];

const translationSeeds: TranslationSeed[] = [
  {
    fallbackMode: "allow-explicit-source-fallback",
    fieldScope: "editorial-copy",
    internalNotes:
      "Representative homepage localization queue item migrated out of mock-only runtime copy.",
    localizedExcerpt:
      "Architecture de l'image, du son et du design IA.",
    ownerCollection: "pages",
    ownerKey: "home",
    ownerLabelSnapshot: "Home",
    publishReadiness: "ready-with-fallback",
    routeLocalizationRequired: true,
    sourceRoutePathSnapshot: "/",
    sourceTitleSnapshot: "Home",
    sourceToken: "/",
    sourceType: "page-route",
    status: "review",
    structuredFieldMap: [
      {
        fieldKey: "title",
        value: "Accueil",
      },
      {
        fieldKey: "heroSummary",
        value: "Surface de reference pour la narration Montelar en luxe discret.",
        valueType: "long-text",
      },
    ],
    targetLocale: "fr",
    targetRoutePath: "/fr",
    targetSlug: "accueil",
    targetTitle: "Accueil",
    workflowStage: "human-edit",
  },
  {
    fallbackMode: "allow-source-preview-only",
    fieldScope: "full-record",
    internalNotes:
      "Representative product translation queue item for Payload-owned PDP localization readiness.",
    localizedExcerpt:
      "Система приватного кинозала с архитектурным уровнем интеграции.",
    ownerCollection: "products",
    ownerKey: "vision-max-premium",
    ownerLabelSnapshot: "Vision MAX Premium",
    publishReadiness: "not-ready",
    routeLocalizationRequired: true,
    sourceRoutePathSnapshot: "/products/vision-max-premium",
    sourceTitleSnapshot: "Vision MAX Premium",
    sourceToken: "vision-max-premium",
    sourceType: "product-slug",
    status: "draft",
    structuredFieldMap: [
      {
        fieldKey: "publicLabel",
        value: "Vision MAX Premium",
      },
      {
        fieldKey: "shortDescription",
        value: "Приватные кинотеатральные системы и иммерсивный screening премиального уровня.",
        valueType: "long-text",
      },
    ],
    targetLocale: "ru",
    targetRoutePath: "/ru/products/vision-max-premium",
    targetSlug: "vision-max-premium",
    targetTitle: "Vision MAX Premium",
    workflowStage: "queued",
  },
  {
    fallbackMode: "allow-explicit-source-fallback",
    fieldScope: "form-copy",
    formLabelSnapshot:
      "Anfrageformular fuer Vision MAX Premium",
    internalNotes:
      "Representative inquiry-form translation queue item so forms stop depending exclusively on mock locale copy.",
    ownerCollection: "product-inquiry-forms",
    ownerKey: "vision-max-premium-en",
    ownerLabelSnapshot: "Vision MAX Premium inquiry",
    publishReadiness: "ready-with-fallback",
    routeLocalizationRequired: false,
    sourceTitleSnapshot: "Vision MAX Premium inquiry",
    sourceToken: "vision-max-premium-en",
    sourceType: "product-inquiry-form-slug",
    status: "review",
    structuredFieldMap: [
      {
        fieldKey: "title",
        value: "Vision MAX Premium anfragen",
      },
      {
        fieldKey: "submitLabel",
        value: "Anfrage senden",
      },
      {
        fieldKey: "successTitle",
        value: "Anfrage erhalten",
      },
    ],
    targetLocale: "de",
    targetTitle: "Vision MAX Premium anfragen",
    workflowStage: "human-edit",
  },
];

async function findOne(
  payload: Payload,
  collection:
    | "locales"
    | "pages"
    | "product-directions"
    | "productInquiryForms"
    | "products"
    | "seo-entries"
    | "translations",
  where: Where,
  depth = 0,
) {
  const result = await payload.find({
    collection,
    depth,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
    where,
  });

  return (result.docs[0] as AnyDoc | undefined) ?? null;
}

async function requireSourceDoc(
  payload: Payload,
  sourceType: TranslationSeed["sourceType"] | SeoSeed["sourceType"],
  sourceToken: string,
) {
  if (sourceType === "page-route") {
    const page = await findOne(payload, "pages", {
      routePath: {
        equals: sourceToken,
      },
    });

    if (!page) {
      throw new Error(`Public CMS baseline seed failed: missing page route ${sourceToken}.`);
    }

    return page;
  }

  if (sourceType === "product-direction-slug") {
    const direction = await findOne(payload, "product-directions", {
      slug: {
        equals: sourceToken,
      },
    });

    if (!direction) {
      throw new Error(`Public CMS baseline seed failed: missing direction ${sourceToken}.`);
    }

    return direction;
  }

  if (sourceType === "product-inquiry-form-slug") {
    const form = await findOne(payload, "productInquiryForms", {
      slug: {
        equals: sourceToken,
      },
    });

    if (!form) {
      throw new Error(`Public CMS baseline seed failed: missing inquiry form ${sourceToken}.`);
    }

    return form;
  }

  const product = await findOne(payload, "products", {
    slug: {
      equals: sourceToken,
    },
  });

  if (!product) {
    throw new Error(`Public CMS baseline seed failed: missing product ${sourceToken}.`);
  }

  return product;
}

async function requireLocaleId(payload: Payload, code: string) {
  const locale = await findOne(payload, "locales", {
    code: {
      equals: code,
    },
  });

  if (!locale) {
    throw new Error(`Public CMS baseline seed failed: missing locale ${code}.`);
  }

  return locale.id;
}

async function upsertSeoEntry(payload: Payload, seed: SeoSeed): Promise<SeedOperation> {
  const ownerDoc = await requireSourceDoc(payload, seed.sourceType, seed.sourceToken);
  const ogImage = ownerDoc.heroMedia ?? ownerDoc.heroAsset ?? ownerDoc.coverCardAsset ?? null;
  const ownerField =
    seed.ownerType === "page"
      ? "ownerPage"
      : seed.ownerType === "product-direction"
        ? "ownerDirection"
        : "ownerProduct";
  const existing =
    (await findOne(payload, "seo-entries", {
      internalCode: {
        equals: seed.internalCode,
      },
    })) ??
    (await findOne(payload, "seo-entries", {
      and: [
        {
          locale: {
            equals: seed.locale,
          },
        },
        {
          [ownerField]: {
            equals: ownerDoc.id,
          },
        },
      ],
    }));

  const data: Record<string, unknown> = {
    approvalStatus: "approved",
    canonicalMode: "owner-default",
    hreflangEnabled: true,
    includeInSitemap: true,
    indexingMode: "index,follow",
    internalCode: seed.internalCode,
    locale: seed.locale,
    metaDescription: seed.metaDescription,
    metaTitle: seed.metaTitle,
    ownerType: seed.ownerType,
    previewOnly: seed.previewOnly ?? false,
    primaryLocale: "en",
    publicationReadiness: seed.publicationReadiness ?? "production-ready",
    routePath: seed.routePath,
    socialCardStyle: "summary_large_image",
    sourceOfTruthArtifact,
    status: "published",
    translationPriority: "normal",
    [ownerField]: ownerDoc.id,
  };

  if (ogImage) {
    data.ogImage = ogImage;
  }

  if (existing) {
    const updated = await payload.update({
      collection: "seo-entries",
      data: data as never,
      id: existing.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return {
      id: updated.id,
      internalCode: seed.internalCode,
      operation: "updated",
    };
  }

  const created = await payload.create({
    collection: "seo-entries",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return {
    id: created.id,
    internalCode: seed.internalCode,
    operation: "created",
  };
}

async function promoteRepresentativeProducts(payload: Payload) {
  const operations: SeedOperation[] = [];

  for (const slug of representativePublishedProductSlugs) {
    const product = await requireSourceDoc(payload, "product-slug", slug);
    const updated = await payload.update({
      collection: "products",
      data: {
        publicationNotes:
          "Published as the representative Payload-backed PDP baseline for MNT-ADMIN-038.",
        status: "published",
      } as never,
      id: product.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    operations.push({
      id: updated.id,
      internalCode: slug,
      operation: "updated",
    });
  }

  return operations;
}

async function upsertTranslation(payload: Payload, seed: TranslationSeed): Promise<SeedOperation> {
  const ownerDoc = await requireSourceDoc(payload, seed.sourceType, seed.sourceToken);
  const sourceLocaleId = await requireLocaleId(payload, "en");
  const targetLocaleId = await requireLocaleId(payload, seed.targetLocale);
  const existing = await findOne(payload, "translations", {
    and: [
      {
        ownerCollection: {
          equals: seed.ownerCollection,
        },
      },
      {
        ownerRecordKey: {
          equals: seed.ownerKey,
        },
      },
      {
        targetLocale: {
          equals: targetLocaleId,
        },
      },
    ],
  });
  const routePath =
    seed.sourceRoutePathSnapshot ??
    (typeof ownerDoc.routePath === "string"
      ? ownerDoc.routePath
      : typeof ownerDoc.canonicalPath === "string"
        ? ownerDoc.canonicalPath
        : null);
  const data: Record<string, unknown> = {
    changeReason: "Seed representative Payload translation records for the public CMS baseline.",
    fallbackMode: seed.fallbackMode,
    fieldScope: seed.fieldScope,
    internalNotes: seed.internalNotes,
    ownerCollection: seed.ownerCollection,
    ownerRecordKey: seed.ownerKey,
    ownerLabelSnapshot: seed.ownerLabelSnapshot,
    primaryLocale: sourceLocaleId,
    publishReadiness: seed.publishReadiness,
    routeLocalizationRequired: seed.routeLocalizationRequired,
    sourceLocale: sourceLocaleId,
    sourceOfTruthArtifact,
    sourceRevisionKey: `${seed.ownerCollection}:${seed.ownerKey}:baseline-v1`,
    sourceRoutePathSnapshot: routePath,
    sourceTitleSnapshot: seed.sourceTitleSnapshot,
    sourceUpdatedAtSnapshot:
      (typeof ownerDoc.updatedAt === "string" && ownerDoc.updatedAt) || new Date().toISOString(),
    staleSourceState: "fresh",
    status: seed.status,
    structuredFieldMap: seed.structuredFieldMap.map((entry) => ({
      fieldKey: entry.fieldKey,
      value: entry.value,
      valueType: entry.valueType ?? "text",
    })),
    targetLocale: targetLocaleId,
    targetTitle: seed.targetTitle,
    translationMethod: "human",
    workflowStage: seed.workflowStage,
  };

  if (seed.formLabelSnapshot) {
    data.formLabelSnapshot = seed.formLabelSnapshot;
  }

  if (seed.localizedExcerpt) {
    data.localizedExcerpt = seed.localizedExcerpt;
  }

  if (seed.targetSlug) {
    data.targetSlug = seed.targetSlug;
  }

  if (seed.targetRoutePath) {
    data.targetRoutePath = seed.targetRoutePath;
  }

  if (existing) {
    const updated = await payload.update({
      collection: "translations",
      data: data as never,
      id: existing.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return {
      id: updated.id,
      internalCode: `${seed.ownerCollection}:${seed.ownerKey}:${seed.targetLocale}`,
      operation: "updated",
    };
  }

  const created = await payload.create({
    collection: "translations",
    data: data as never,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return {
    id: created.id,
    internalCode: `${seed.ownerCollection}:${seed.ownerKey}:${seed.targetLocale}`,
    operation: "created",
  };
}

export async function syncPublicCmsBaseline(payload: Payload) {
  const waveZero = await syncWaveZeroPlatform(payload);
  const catalog = await syncCatalogHierarchyAndProducts(payload);
  const pages = await syncEditorialPagesSectionsAndNavigation(payload);
  const inquiry = await syncInquiryFormsAndSampleLeads(payload);
  const publishedProductOperations = await promoteRepresentativeProducts(payload);
  const media = await syncMediaDocumentsAndCreativeRecords(payload);

  const seoOperations: SeedOperation[] = [];

  for (const seed of seoSeeds) {
    seoOperations.push(await upsertSeoEntry(payload, seed));
  }

  const translationOperations: SeedOperation[] = [];

  for (const seed of translationSeeds) {
    translationOperations.push(await upsertTranslation(payload, seed));
  }

  return {
    catalog,
    inquiry,
    launchLocaleCount: launchLocaleSeeds.length,
    media,
    pages,
    publishedProductCount: publishedProductOperations.length,
    publishedProductOperations,
    seoCount: seoSeeds.length,
    seoOperations,
    translationCount: translationSeeds.length,
    translationOperations,
    waveZero,
  };
}
