import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";

import { adminRuntime } from "../runtime.ts";

type SeedOperation = {
  id: number | string;
  internalCode: string;
  operation: "created" | "updated";
};

type SeedSummary = {
  mediaAssetCount: number;
  mediaAssetOperations: SeedOperation[];
  pageLinkCount: number;
  pageLinkOperations: SeedOperation[];
  productDocumentCount: number;
  productDocumentOperations: SeedOperation[];
  productLinkCount: number;
  productLinkOperations: SeedOperation[];
  productMediaCount: number;
  productMediaOperations: SeedOperation[];
  sectionLinkCount: number;
  sectionLinkOperations: SeedOperation[];
};

type AnyDoc = Record<string, unknown> & {
  id: number | string;
};

type LoosePayloadMutations = {
  create(options: Record<string, unknown>): Promise<AnyDoc>;
  update(options: Record<string, unknown>): Promise<AnyDoc>;
};

const sourceOfTruthArtifact =
  "docs/strategy/artifacts/MNT-ADMIN-021-media-documents-and-creative-seed.md";

const onePixelPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=";

const mediaAssetSeeds = [
  {
    altText: "Quiet-luxury Montelar homepage hero placeholder still.",
    approvalStatus: "approved",
    assetRole: "home-hero",
    assetTitle: "Montelar home hero placeholder still",
    assetType: "image",
    audienceMode: "public",
    caption: "Public-safe placeholder for homepage hero governance.",
    editorialSummary:
      "Public-safe baseline still for homepage hero, used to exercise page and section media ownership before final production assets exist.",
    fileName: "mnt-admin-021-home-hero.png",
    internalCode: "MAS_HOME_HERO_PLACEHOLDER_01",
    primaryLocale: "en",
    publicationReadiness: "production-ready",
    referenceOnlyNotProductionAsset: false,
    rightsStatus: "production-approved",
    sourceCategory: "internal",
    sourceName: "Montelar admin seed",
    status: "published",
    translationPriority: "high",
  },
  {
    altText: "Montelar category card placeholder still.",
    approvalStatus: "approved",
    assetRole: "direction-card",
    assetTitle: "Montelar direction card placeholder still",
    assetType: "image",
    audienceMode: "public",
    caption: "Public-safe placeholder for direction and product cards.",
    editorialSummary:
      "Public-safe card still used by seeded catalog and page relationships until approved imagery is available.",
    fileName: "mnt-admin-021-direction-card.png",
    internalCode: "MAS_DIRECTION_CARD_PLACEHOLDER_01",
    primaryLocale: "en",
    publicationReadiness: "production-ready",
    referenceOnlyNotProductionAsset: false,
    rightsStatus: "production-approved",
    sourceCategory: "internal",
    sourceName: "Montelar admin seed",
    status: "published",
    translationPriority: "normal",
  },
  {
    altText: "Vision MAX product detail placeholder hero still.",
    approvalStatus: "approved",
    assetRole: "product-hero",
    assetTitle: "Vision MAX Premium product hero placeholder",
    assetType: "image",
    audienceMode: "public",
    caption: "Public-safe placeholder for product hero and request-route preview.",
    editorialSummary:
      "Production-safe placeholder still for Vision MAX product hero, request page and brochure preview surfaces.",
    fileName: "mnt-admin-021-vision-max-hero.png",
    internalCode: "MAS_VISION_MAX_HERO_PLACEHOLDER_01",
    primaryLocale: "en",
    publicationReadiness: "production-ready",
    referenceOnlyNotProductionAsset: false,
    rightsStatus: "production-approved",
    sourceCategory: "internal",
    sourceName: "Montelar admin seed",
    status: "published",
    translationPriority: "high",
  },
  {
    altText: "Living Glass interior-context placeholder still.",
    approvalStatus: "approved",
    assetRole: "product-context",
    assetTitle: "Living Glass OLED context placeholder",
    assetType: "image",
    audienceMode: "public",
    caption: "Public-safe placeholder for interior context and gallery surfaces.",
    editorialSummary:
      "Production-safe context placeholder for Living Glass catalog coverage and product-media governance.",
    fileName: "mnt-admin-021-living-glass-context.png",
    internalCode: "MAS_LIVING_GLASS_CONTEXT_PLACEHOLDER_01",
    primaryLocale: "en",
    publicationReadiness: "production-ready",
    referenceOnlyNotProductionAsset: false,
    rightsStatus: "production-approved",
    sourceCategory: "internal",
    sourceName: "Montelar admin seed",
    status: "published",
    translationPriority: "normal",
  },
  {
    altText: "Document preview placeholder for seeded brochure records.",
    approvalStatus: "approved",
    assetRole: "document-preview",
    assetTitle: "Document preview placeholder",
    assetType: "document-preview",
    audienceMode: "public",
    caption: "Public-safe preview placeholder for brochure and download surfaces.",
    editorialSummary:
      "Public-safe preview asset used by seeded downloadable product documents.",
    fileName: "mnt-admin-021-document-preview.png",
    internalCode: "MAS_DOCUMENT_PREVIEW_PLACEHOLDER_01",
    primaryLocale: "en",
    publicationReadiness: "production-ready",
    referenceOnlyNotProductionAsset: false,
    rightsStatus: "production-approved",
    sourceCategory: "internal",
    sourceName: "Montelar admin seed",
    status: "published",
    translationPriority: "normal",
  },
  {
    altText: "Internal-only creative brief board placeholder.",
    approvalStatus: "needs-review",
    assetRole: "creative-brief-board",
    assetTitle: "Living Glass creative brief board",
    assetType: "creative-reference",
    audienceMode: "internal-only",
    caption: "Reference-only internal creative brief board.",
    editorialSummary:
      "Internal-only brief board seed used to verify creative-review and reference-only guardrails without enabling public production use.",
    fileName: "mnt-admin-021-creative-brief-board.png",
    internalCode: "MAS_CREATIVE_BRIEF_BOARD_01",
    ownerReviewRequired: true,
    primaryLocale: "en",
    publicationReadiness: "blocked",
    referenceOnlyNotProductionAsset: true,
    rightsStatus: "reference-only",
    sourceCategory: "internal",
    sourceName: "Montelar admin seed",
    status: "review",
    translationPriority: "low",
  },
  {
    altText: "Owner-review creative candidate placeholder for Vision MAX.",
    approvalStatus: "needs-review",
    assetRole: "creative-candidate",
    assetTitle: "Vision MAX creative candidate placeholder",
    assetType: "ui-preview",
    audienceMode: "owner-review",
    caption: "Generated-style candidate held in review only.",
    editorialSummary:
      "Review-only creative candidate seed kept outside production until rights and owner approval are complete.",
    fileName: "mnt-admin-021-creative-candidate.png",
    internalCode: "MAS_CREATIVE_CANDIDATE_VISION_MAX_01",
    ownerReviewRequired: true,
    primaryLocale: "en",
    publicationReadiness: "preview-only",
    referenceOnlyNotProductionAsset: true,
    rightsStatus: "generated-pending-review",
    sourceCategory: "generated",
    sourceName: "Montelar creative candidate seed",
    status: "review",
    translationPriority: "low",
  },
] as const;

async function ensureSeedFiles() {
  const seedDir = path.resolve(adminRuntime.tempDir, "seed-media");
  await mkdir(seedDir, { recursive: true });

  const fileMap = {
    "mnt-admin-021-home-hero.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-direction-card.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-vision-max-hero.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-living-glass-context.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-document-preview.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-creative-brief-board.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-creative-candidate.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-vision-max-brochure.png": Buffer.from(onePixelPngBase64, "base64"),
    "mnt-admin-021-living-glass-creative-brief.png": Buffer.from(onePixelPngBase64, "base64"),
  } as const;

  for (const [fileName, contents] of Object.entries(fileMap)) {
    await writeFile(path.join(seedDir, fileName), contents);
  }

  return {
    creativeBriefDocumentPath: path.join(seedDir, "mnt-admin-021-living-glass-creative-brief.png"),
    mediaFilePaths: Object.fromEntries(
      mediaAssetSeeds.map((seed) => [seed.internalCode, path.join(seedDir, seed.fileName)]),
    ) as Record<(typeof mediaAssetSeeds)[number]["internalCode"], string>,
    publicBrochurePath: path.join(seedDir, "mnt-admin-021-vision-max-brochure.png"),
  };
}

async function findByInternalCode(
  payload: Payload,
  collection:
    | "media-assets"
    | "page-sections"
    | "pages"
    | "product-documents"
    | "product-media"
    | "products",
  internalCode: string,
) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
    where: {
      internalCode: {
        equals: internalCode,
      },
    },
  });

  return (result.docs[0] as AnyDoc | undefined) ?? null;
}

async function requireByInternalCode(
  payload: Payload,
  collection:
    | "page-sections"
    | "pages"
    | "products",
  internalCode: string,
) : Promise<AnyDoc> {
  const doc = await findByInternalCode(payload, collection, internalCode);

  if (!doc) {
    throw new Error(`Media seed failed: ${collection} record ${internalCode} was not found.`);
  }

  return doc;
}

async function upsertMediaAsset(
  payload: Payload,
  seed: (typeof mediaAssetSeeds)[number],
  filePath: string,
): Promise<SeedOperation> {
  const payloadApi = payload as unknown as LoosePayloadMutations;
  const existing = await findByInternalCode(payload, "media-assets", seed.internalCode);

  if (existing) {
    const updated = await payloadApi.update({
      collection: "media-assets",
      data: {
        ...seed,
        creditLine: seed.sourceName,
        sourceOfTruthArtifact,
      },
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

  const created = await payloadApi.create({
    collection: "media-assets",
    data: {
      ...seed,
      creditLine: seed.sourceName,
      sourceOfTruthArtifact,
    },
    filePath,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return {
    id: created.id,
    internalCode: seed.internalCode,
    operation: "created",
  };
}

function mergeUniqueIds(
  existing: unknown,
  additions: Array<number | string>,
) {
  const seen = new Set<string>();
  const merged: Array<number | string> = [];

  for (const entry of Array.isArray(existing) ? existing : []) {
    const value =
      typeof entry === "number" || typeof entry === "string"
        ? entry
        : entry && typeof entry === "object" && "id" in entry
          ? ((entry as { id?: unknown }).id as number | string | undefined)
          : undefined;

    if (typeof value !== "number" && typeof value !== "string") {
      continue;
    }

    const key = String(value);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(value);
  }

  for (const value of additions) {
    const key = String(value);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(value);
  }

  return merged;
}

async function updateProductLinks(
  payload: Payload,
  params: {
    coverCardAssetId?: number | string;
    heroAssetId?: number | string;
    internalCode: string;
  },
): Promise<SeedOperation> {
  const payloadApi = payload as unknown as LoosePayloadMutations;
  const product = await requireByInternalCode(payload, "products", params.internalCode);
  const updated = await payloadApi.update({
    collection: "products",
    data: {
      coverCardAsset: params.coverCardAssetId ?? ((product as AnyDoc).coverCardAsset ?? null),
      heroAsset: params.heroAssetId ?? ((product as AnyDoc).heroAsset ?? null),
    },
    id: product.id as number | string,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return {
    id: updated.id,
    internalCode: params.internalCode,
    operation: "updated",
  };
}

async function updatePageLinks(
  payload: Payload,
  params: {
    coverMediaId?: number | string;
    heroMediaId?: number | string;
    internalCode: string;
    relatedDocumentIds?: Array<number | string>;
    seoOgImageId?: number | string;
  },
): Promise<SeedOperation> {
  const payloadApi = payload as unknown as LoosePayloadMutations;
  const page = await requireByInternalCode(payload, "pages", params.internalCode);
  const updated = await payloadApi.update({
    collection: "pages",
    data: {
      coverMedia: params.coverMediaId ?? ((page as AnyDoc).coverMedia ?? null),
      heroMedia: params.heroMediaId ?? ((page as AnyDoc).heroMedia ?? null),
      relatedDocuments: mergeUniqueIds((page as AnyDoc).relatedDocuments, params.relatedDocumentIds ?? []),
      seoOgImage: params.seoOgImageId ?? ((page as AnyDoc).seoOgImage ?? null),
    },
    id: page.id as number | string,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return {
    id: updated.id,
    internalCode: params.internalCode,
    operation: "updated",
  };
}

async function updateSectionLinks(
  payload: Payload,
  params: {
    heroMediaId: number | string;
    internalCode: string;
  },
): Promise<SeedOperation> {
  const payloadApi = payload as unknown as LoosePayloadMutations;
  const section = await requireByInternalCode(payload, "page-sections", params.internalCode);
  const heroContent =
    typeof section.heroContent === "object" && section.heroContent !== null
      ? (section.heroContent as Record<string, unknown>)
      : {};
  const updated = await payloadApi.update({
    collection: "page-sections",
    data: {
      heroContent: {
        ...heroContent,
        heroMedia: params.heroMediaId,
      },
    },
    id: section.id as number | string,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return {
    id: updated.id,
    internalCode: params.internalCode,
    operation: "updated",
  };
}

async function upsertProductMedia(
  payload: Payload,
  data: Record<string, unknown>,
): Promise<SeedOperation> {
  const payloadApi = payload as unknown as LoosePayloadMutations;
  const internalCode = String(data.internalCode);
  const existing = await findByInternalCode(payload, "product-media", internalCode);

  if (existing) {
    const updated = await payloadApi.update({
      collection: "product-media",
      data,
      id: existing.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, internalCode, operation: "updated" };
  }

  const created = await payloadApi.create({
    collection: "product-media",
    data,
    draft: false,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, internalCode, operation: "created" };
}

async function upsertProductDocument(
  payload: Payload,
  data: Record<string, unknown>,
  filePath: string,
): Promise<SeedOperation> {
  const payloadApi = payload as unknown as LoosePayloadMutations;
  const internalCode = String(data.internalCode);
  const existing = await findByInternalCode(payload, "product-documents", internalCode);

  if (existing) {
    const updated = await payloadApi.update({
      collection: "product-documents",
      data,
      id: existing.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    return { id: updated.id, internalCode, operation: "updated" };
  }

  const created = await payloadApi.create({
    collection: "product-documents",
    data,
    draft: false,
    filePath,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return { id: created.id, internalCode, operation: "created" };
}

export async function syncMediaDocumentsAndCreativeRecords(
  payload: Payload,
): Promise<SeedSummary> {
  const files = await ensureSeedFiles();

  const mediaAssetOperations: SeedOperation[] = [];
  for (const seed of mediaAssetSeeds) {
    mediaAssetOperations.push(
      await upsertMediaAsset(payload, seed, files.mediaFilePaths[seed.internalCode]),
    );
  }

  const mediaIds = Object.fromEntries(
    mediaAssetOperations.map((entry) => [entry.internalCode, entry.id]),
  ) as Record<(typeof mediaAssetSeeds)[number]["internalCode"], number | string>;

  await requireByInternalCode(payload, "products", "PROD_VISION_MAX_PREMIUM");
  await requireByInternalCode(payload, "products", "PROD_LIVING_GLASS_OLED");

  const productMediaOperations = [
    await upsertProductMedia(payload, {
      approvalStatus: "approved",
      aspectRatioHint: "cinematic",
      attachmentScope: "product-default",
      fallbackBehavior: "use-product-default",
      governanceNotes: "Seeded public hero placement for Payload admin realism checks.",
      internalCode: "PMM_VISION_MAX_HERO_PUBLIC_01",
      isPrimary: true,
      localizedAltOverride: "Vision MAX Premium product hero placeholder.",
      mediaAsset: mediaIds.MAS_VISION_MAX_HERO_PLACEHOLDER_01,
      motionRelation: "Static placeholder until approved motion/video references are available.",
      order: 1,
      overrideMode: "replace-slot",
      ownerReviewRequired: false,
      primaryLocale: "en",
      productKey: "vision-max-premium",
      productLabelSnapshot: "Vision MAX Premium",
      publicationNotes: "Public-safe placeholder only.",
      rightsStatus: "production-approved",
      roomContextNotes: "Private cinema interior placeholder.",
      slot: "hero",
      slotRole: "primary product hero",
      sourceCategory: "internal",
      sourceOfTruthArtifact,
      status: "published",
      stylingNotes: "Use for admin and request-route preview until final approved media arrives.",
      surfaceTargets: ["pdp", "listing-card"],
      translationPriority: "high",
      usageIntent: "production",
      visibilityMode: "public",
    }),
    await upsertProductMedia(payload, {
      approvalStatus: "approved",
      aspectRatioHint: "landscape",
      attachmentScope: "product-default",
      fallbackBehavior: "use-product-default",
      governanceNotes: "Seeded card placement for product and direction listing surfaces.",
      internalCode: "PMM_VISION_MAX_CARD_PUBLIC_01",
      isPrimary: true,
      localizedCaptionOverride: "Quiet-luxury card placeholder for Vision MAX.",
      mediaAsset: mediaIds.MAS_DIRECTION_CARD_PLACEHOLDER_01,
      order: 2,
      ownerReviewRequired: false,
      primaryLocale: "en",
      productKey: "vision-max-premium",
      productLabelSnapshot: "Vision MAX Premium",
      rightsStatus: "production-approved",
      slot: "card",
      slotRole: "listing card",
      sourceCategory: "internal",
      sourceOfTruthArtifact,
      status: "published",
      surfaceTargets: ["listing-card"],
      translationPriority: "normal",
      usageIntent: "production",
      visibilityMode: "public",
    }),
    await upsertProductMedia(payload, {
      approvalStatus: "approved",
      aspectRatioHint: "landscape",
      attachmentScope: "product-default",
      fallbackBehavior: "use-product-default",
      governanceNotes: "Seeded context placement for Living Glass PDP and gallery preview.",
      internalCode: "PMM_LIVING_GLASS_CONTEXT_PUBLIC_01",
      isPrimary: true,
      mediaAsset: mediaIds.MAS_LIVING_GLASS_CONTEXT_PLACEHOLDER_01,
      order: 1,
      ownerReviewRequired: false,
      primaryLocale: "en",
      productKey: "living-glass-oled",
      productLabelSnapshot: "Living Glass OLED",
      rightsStatus: "production-approved",
      roomContextNotes: "Architectural interior context placeholder.",
      slot: "gallery-context",
      slotRole: "interior context",
      sourceCategory: "internal",
      sourceOfTruthArtifact,
      status: "published",
      surfaceTargets: ["gallery", "detail-panel"],
      translationPriority: "normal",
      usageIntent: "production",
      visibilityMode: "public",
    }),
    await upsertProductMedia(payload, {
      approvalStatus: "needs-review",
      aspectRatioHint: "landscape",
      attachmentScope: "internal-reference",
      fallbackBehavior: "hide-if-missing",
      governanceNotes:
        "Creative review candidate only. Must not move to public production without owner approval and rights promotion.",
      internalCode: "PMM_VISION_MAX_CREATIVE_REVIEW_01",
      isPrimary: false,
      mediaAsset: mediaIds.MAS_CREATIVE_CANDIDATE_VISION_MAX_01,
      order: 99,
      ownerReviewRequired: true,
      primaryLocale: "en",
      productKey: "vision-max-premium",
      productLabelSnapshot: "Vision MAX Premium",
      publicationNotes:
        "Review-only placement kept out of public surfaces while MNT-CRE-011 remains blocked.",
      referenceOnlyReason:
        "Creative candidate pending owner selection and production-rights policy.",
      rightsStatus: "reference-only",
      slot: "admin-preview",
      slotRole: "creative review candidate",
      sourceCategory: "generated",
      sourceOfTruthArtifact,
      status: "review",
      surfaceTargets: ["admin-preview"],
      translationPriority: "low",
      usageIntent: "creative-review",
      visibilityMode: "preview-only",
    }),
  ];

  const productDocumentOperations = [
    await upsertProductDocument(
      payload,
      {
        approvalStatus: "approved",
        attachmentScope: "product-default",
        documentTitle: "Vision MAX Premium overview",
        documentType: "brochure",
        documentGroupKey: "vision-max-overview",
        downloadBehavior: "direct-download",
        featuredWeight: 10,
        governanceNotes: "Public-safe brochure placeholder for downloads and request-route proof.",
        internalCode: "DOC_VISION_MAX_PUBLIC_OVERVIEW_01",
        isPrimary: true,
        order: 1,
        overrideMode: "inherit-parent",
        ownerReviewRequired: false,
        previewAsset: mediaIds.MAS_DOCUMENT_PREVIEW_PLACEHOLDER_01,
        previewLabel: "Overview preview",
        primaryLocale: "en",
        productKey: "vision-max-premium",
        productLabelSnapshot: "Vision MAX Premium",
        publicLabel: "Overview brochure",
        rightsStatus: "production-approved",
        sourceCategory: "internal",
        sourceOfTruthArtifact,
        status: "published",
        surfaceTargets: ["pdp-downloads", "after-inquiry"],
        translationPriority: "high",
        versionLabel: "Seed v1",
        visibilityMode: "public",
      },
      files.publicBrochurePath,
    ),
    await upsertProductDocument(
      payload,
      {
        approvalStatus: "needs-review",
        attachmentScope: "internal-reference",
        documentTitle: "Living Glass creative review pack",
        documentType: "other",
        documentGroupKey: "living-glass-creative-review",
        downloadBehavior: "admin-only",
        governanceNotes:
          "Internal-only creative brief placeholder for review workflow coverage while the dedicated creative workspace remains deferred.",
        internalCode: "DOC_LIVING_GLASS_CREATIVE_REVIEW_01",
        order: 1,
        overrideMode: "inherit-parent",
        ownerReviewRequired: true,
        previewAsset: mediaIds.MAS_CREATIVE_BRIEF_BOARD_01,
        previewLabel: "Creative brief board",
        primaryLocale: "en",
        productKey: "living-glass-oled",
        productLabelSnapshot: "Living Glass OLED",
        publicationNotes:
          "Reference-only internal document. Do not attach to public downloads until rights and owner approval change.",
        referenceOnlyReason:
          "Creative brief pack is for internal review only and should not become a public deliverable.",
        rightsStatus: "reference-only",
        sourceCategory: "internal",
        sourceOfTruthArtifact,
        status: "review",
        surfaceTargets: ["admin-sidebar"],
        translationPriority: "low",
        versionLabel: "Seed review pack",
        visibilityMode: "internal-only",
      },
      files.creativeBriefDocumentPath,
    ),
  ];

  const productDocumentIds = Object.fromEntries(
    productDocumentOperations.map((entry) => [entry.internalCode, entry.id]),
  ) as Record<"DOC_VISION_MAX_PUBLIC_OVERVIEW_01" | "DOC_LIVING_GLASS_CREATIVE_REVIEW_01", number | string>;

  const productLinkOperations = [
    await updateProductLinks(payload, {
      coverCardAssetId: mediaIds.MAS_DIRECTION_CARD_PLACEHOLDER_01,
      heroAssetId: mediaIds.MAS_VISION_MAX_HERO_PLACEHOLDER_01,
      internalCode: "PROD_VISION_MAX_PREMIUM",
    }),
    await updateProductLinks(payload, {
      coverCardAssetId: mediaIds.MAS_DIRECTION_CARD_PLACEHOLDER_01,
      heroAssetId: mediaIds.MAS_LIVING_GLASS_CONTEXT_PLACEHOLDER_01,
      internalCode: "PROD_LIVING_GLASS_OLED",
    }),
  ];

  const pageLinkOperations = [
    await updatePageLinks(payload, {
      coverMediaId: mediaIds.MAS_DIRECTION_CARD_PLACEHOLDER_01,
      heroMediaId: mediaIds.MAS_HOME_HERO_PLACEHOLDER_01,
      internalCode: "PAGE_HOME",
      seoOgImageId: mediaIds.MAS_HOME_HERO_PLACEHOLDER_01,
    }),
    await updatePageLinks(payload, {
      internalCode: "PAGE_DOWNLOADS",
      relatedDocumentIds: [productDocumentIds.DOC_VISION_MAX_PUBLIC_OVERVIEW_01],
    }),
    await updatePageLinks(payload, {
      heroMediaId: mediaIds.MAS_VISION_MAX_HERO_PLACEHOLDER_01,
      internalCode: "PAGE_REQUEST_VISION_MAX_PREMIUM",
      relatedDocumentIds: [productDocumentIds.DOC_VISION_MAX_PUBLIC_OVERVIEW_01],
    }),
  ];

  const sectionLinkOperations = [
    await updateSectionLinks(payload, {
      heroMediaId: mediaIds.MAS_HOME_HERO_PLACEHOLDER_01,
      internalCode: "SEC_HOME_SIGNATURE_HERO",
    }),
  ];

  return {
    mediaAssetCount: mediaAssetOperations.length,
    mediaAssetOperations,
    pageLinkCount: pageLinkOperations.length,
    pageLinkOperations,
    productDocumentCount: productDocumentOperations.length,
    productDocumentOperations,
    productLinkCount: productLinkOperations.length,
    productLinkOperations,
    productMediaCount: productMediaOperations.length,
    productMediaOperations,
    sectionLinkCount: sectionLinkOperations.length,
    sectionLinkOperations,
  };
}
