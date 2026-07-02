import type { Payload, PayloadRequest } from "payload";

import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";
import { buildEditableFieldHref } from "../admin-bff/surface-registry.ts";

import { getAdminUser } from "./access.ts";
import {
  getRelationId,
  governanceApprovalStatusOptions,
  governanceRightsStatusOptions,
  hasExpiredDate,
  isProductionSafeMediaAsset,
  mediaAssetSourceCategoryOptions,
  mediaAssetTypeOptions,
  publicationReadinessOptions,
} from "./media-governance.ts";
import { hasAdminRole, mediaOperatorRoles, type AdminRole } from "./roles.ts";

const mediaWorkspaceReadRoles = mediaOperatorRoles;
const mediaWorkspaceUpdateRoles = mediaOperatorRoles;

const mediaWorkspaceFilterIds = [
  "all",
  "needs-rights",
  "needs-approval",
  "reference-only",
  "expiry-risk",
  "missing-metadata",
  "production-ready",
  "documents",
  "heavy",
  "unlinked",
] as const;

const mediaUsageOptions = [
  "any",
  "product-placement",
  "document-preview",
  "page-surface",
  "unused",
] as const;

const mediaContextOptions = ["all", "homepage"] as const;
const referenceStateOptions = ["all", "only", "exclude"] as const;
const mediaLibraryOptions = ["all", "photo", "video", "document"] as const;

type MediaWorkspaceFilterId = (typeof mediaWorkspaceFilterIds)[number];
type MediaWorkspaceContext = (typeof mediaContextOptions)[number];
type MediaUsageFilter = (typeof mediaUsageOptions)[number];
type MediaReferenceState = (typeof referenceStateOptions)[number];
type MediaLibraryKind = (typeof mediaLibraryOptions)[number];
type MediaWorkspaceRecordType = "asset" | "document";

type WorkspaceRecord = Record<string, unknown>;
type LinkedSurfaceType = "product" | "page" | "document" | "placement";

type MediaWorkspaceQuery = {
  approvalStatus?: string | null;
  assetType?: string | null;
  context?: string | null;
  filter?: string | null;
  library?: string | null;
  locale?: string | null;
  pageId?: string | null;
  q?: string | null;
  referenceOnly?: string | null;
  sourceCategory?: string | null;
  selected?: string | null;
  usage?: string | null;
  rightsStatus?: string | null;
};

type LinkedSurfaceSummary = {
  href: string;
  id: string;
  label: string;
  meta: string;
  type: LinkedSurfaceType;
};

type MediaWorkspaceCard = {
  approvalStatus: string;
  assetType: string;
  href: string;
  id: string;
  isReferenceOnly: boolean;
  kindLabel: string;
  linkedPageIds: string[];
  locale: string;
  placementCount: number;
  pageCount: number;
  primaryWarning: string | null;
  productionSafetyLabel: string;
  recordId: string;
  recordType: MediaWorkspaceRecordType;
  referenceBadge: string;
  rightsStatus: string;
  sourceCategory: string;
  status: string;
  subtitle: string;
  title: string;
  usageLabel: string;
  usageTitle: string;
  warnings: string[];
};

type MediaWorkspaceFilterSummary = {
  count: number;
  description: string;
  id: MediaWorkspaceFilterId;
  label: string;
};

type MediaWorkspaceLibrarySummary = {
  count: number;
  description: string;
  id: MediaLibraryKind;
  label: string;
};

type MediaWorkspaceFacetOption = {
  count: number;
  label: string;
  value: string;
};

type MediaWorkspaceFacet = {
  id:
    | "approvalStatus"
    | "assetType"
    | "locale"
    | "referenceOnly"
    | "rightsStatus"
    | "sourceCategory"
    | "usage";
  label: string;
  options: MediaWorkspaceFacetOption[];
};

type MediaWorkspacePlacementEditor = {
  approvalStatus: string;
  href: string;
  id: string;
  productLabel: string;
  productKey: string;
  rightsStatus: string;
  slot: string;
  status: string;
  surfaceTargets: string[];
  usageIntent: string;
  variantLabel: string;
  visibilityMode: string;
};

type MediaWorkspaceCropBox = {
  focalX: number;
  focalY: number;
  height: number;
  width: number;
  x: number;
  y: number;
};

type MediaWorkspaceAssetDetail = {
  approvalStatus: string;
  assetRole: string;
  assetTitle: string;
  assetType: string;
  audienceMode: string;
  caption: string;
  creditLine: string;
  editorialSummary: string;
  fileMeta: string[];
  governanceNotes: string;
  href: string;
  id: string;
  internalCode: string;
  isReferenceOnly: boolean;
  licenseExpiryAt: string;
  linkedDocuments: LinkedSurfaceSummary[];
  linkedPages: LinkedSurfaceSummary[];
  linkedPlacements: LinkedSurfaceSummary[];
  locale: string;
  placementEditor: MediaWorkspacePlacementEditor | null;
  primaryPreviewLabel: string;
  publicationReadiness: string;
  replaceGuidance: string;
  replaceHref: string;
  referenceOnlyReason: string;
  responsiveCrop: {
    desktop: MediaWorkspaceCropBox;
    mobile: MediaWorkspaceCropBox;
    notes: string;
  };
  rightsStatus: string;
  sourceCategory: string;
  sourceName: string;
  sourceUrl: string;
  status: string;
  cropSupportLabel: string;
  fileSizeBytes: number;
  optimizationStatus: string;
  usageRestrictions: string;
  warnings: string[];
  altText: string;
};

type MediaWorkspaceDocumentDetail = {
  approvalStatus: string;
  documentTitle: string;
  documentType: string;
  downloadBehavior: string;
  href: string;
  id: string;
  internalCode: string;
  linkedPages: LinkedSurfaceSummary[];
  linkedProducts: LinkedSurfaceSummary[];
  locale: string;
  previewAssetLabel: string;
  productLabel: string;
  publicLabel: string;
  replaceGuidance: string;
  replaceHref: string;
  requiresInquiryContext: boolean;
  rightsStatus: string;
  status: string;
  surfaceTargets: string[];
  variantLabel: string;
  versionLabel: string;
  visibilityMode: string;
  warnings: string[];
  fileSizeBytes: number;
};

export type MediaWorkspaceSnapshot = {
  activeApprovalStatus: string;
  activeAssetType: string;
  activeContext: MediaWorkspaceContext;
  activeFilter: MediaWorkspaceFilterId;
  activeLibrary: MediaLibraryKind;
  activeLocale: string;
  activePageId: string;
  activeReferenceOnly: MediaReferenceState;
  activeRightsStatus: string;
  activeSearch: string;
  activeSourceCategory: string;
  activeUsage: MediaUsageFilter;
  assetDetail: MediaWorkspaceAssetDetail | null;
  canUpdate: boolean;
  cards: MediaWorkspaceCard[];
  documentDetail: MediaWorkspaceDocumentDetail | null;
  emptyState: string;
  facets: MediaWorkspaceFacet[];
  filters: MediaWorkspaceFilterSummary[];
  focusLabel: string;
  focusPageHref: string | null;
  focusPublicUrl: string | null;
  generatedAt: string;
  libraries: MediaWorkspaceLibrarySummary[];
  totalVisibleCards: number;
};

type MediaWorkspaceUpdateInput = Record<string, unknown>;

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value: unknown) {
  return value === true;
}

function getArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toRecord(value: unknown) {
  return value && typeof value === "object" ? (value as WorkspaceRecord) : null;
}

function getId(value: unknown) {
  return getRelationId(
    value as number | string | { id: number | string } | null | undefined,
  );
}

export function canReadMediaWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), mediaWorkspaceReadRoles);
}

export function canUpdateMediaWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), mediaWorkspaceUpdateRoles);
}

function buildCollectionHref(collection: string, id?: string | number) {
  return typeof id === "undefined"
    ? buildAdvancedCollectionHref(collection, {
        label: "Расширенная медиазапись",
      })
    : buildAdvancedCollectionHref(collection, {
        id,
        label: "Расширенная медиазапись",
      });
}

function buildMediaWorkspaceQuery(entries: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(entries)) {
    if (!value || value === "all" || value === "any") {
      continue;
    }

    params.set(key, value);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildMediaWorkspaceHref(options?: {
  context?: MediaWorkspaceContext;
  filter?: MediaWorkspaceFilterId;
  pageId?: string | null;
  selected?: string | null;
  usage?: MediaUsageFilter;
}) {
  const query = buildMediaWorkspaceQuery({
    context: options?.context,
    filter: options?.filter,
    pageId: options?.pageId,
    selected: options?.selected,
    usage: options?.usage,
  });

  return `/admin/media${query}`;
}

function normalizeFilter(value: string | null | undefined): MediaWorkspaceFilterId {
  return mediaWorkspaceFilterIds.includes(value as MediaWorkspaceFilterId)
    ? (value as MediaWorkspaceFilterId)
    : "all";
}

function normalizeUsage(value: string | null | undefined): MediaUsageFilter {
  return mediaUsageOptions.includes(value as MediaUsageFilter) ? (value as MediaUsageFilter) : "any";
}

function normalizeContext(value: string | null | undefined): MediaWorkspaceContext {
  return mediaContextOptions.includes(value as MediaWorkspaceContext)
    ? (value as MediaWorkspaceContext)
    : "all";
}

function normalizeReferenceState(value: string | null | undefined): MediaReferenceState {
  return referenceStateOptions.includes(value as MediaReferenceState)
    ? (value as MediaReferenceState)
    : "all";
}

function normalizeLibrary(value: string | null | undefined): MediaLibraryKind {
  return mediaLibraryOptions.includes(value as MediaLibraryKind)
    ? (value as MediaLibraryKind)
    : "all";
}

function getFileSize(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getCropNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getCropBox(value: unknown): MediaWorkspaceCropBox {
  const record = toRecord(value);
  return {
    focalX: getCropNumber(record?.focalX, 0.5),
    focalY: getCropNumber(record?.focalY, 0.5),
    height: getCropNumber(record?.height, 1),
    width: getCropNumber(record?.width, 1),
    x: getCropNumber(record?.x, 0),
    y: getCropNumber(record?.y, 0),
  };
}

function isVideoAsset(asset: WorkspaceRecord) {
  const mimeType = getText(asset.mimeType);
  const assetType = getText(asset.assetType);
  return mimeType.startsWith("video/") || assetType === "video-reference" || assetType === "motion-poster";
}

function classifyCardLibrary(card: MediaWorkspaceCard): MediaLibraryKind {
  if (card.recordType === "document") {
    return "document";
  }

  return card.assetType === "video-reference" || card.assetType === "motion-poster" ? "video" : "photo";
}

function getHeavyAssetThresholdBytes(asset: WorkspaceRecord) {
  if (isVideoAsset(asset)) {
    return 80 * 1024 * 1024;
  }

  return 8 * 1024 * 1024;
}

function getHeavyDocumentThresholdBytes() {
  return 20 * 1024 * 1024;
}

function getOptimizationStatus(asset: WorkspaceRecord) {
  const fileSizeBytes = getFileSize(asset.filesize);
  if (!fileSizeBytes) {
    return "Вес файла не определён";
  }

  return fileSizeBytes > getHeavyAssetThresholdBytes(asset)
    ? "Нужен более лёгкий экспорт"
    : "Вес файла в рабочем диапазоне";
}

function getUsageTitle(value: string) {
  switch (value) {
    case "product-placement":
      return "Продуктовое размещение";
    case "document-preview":
      return "Превью документа";
    case "page-surface":
      return "Страница или homepage";
    default:
      return "Не привязан";
  }
}

function getOwnerMediaTitle(value: string, fallback: string) {
  const title = value.trim();

  if (!title) {
    return fallback;
  }

  const normalized = title.toLowerCase();
  const replacements: Array<[RegExp, string]> = [
    [/browser qa homepage still/i, "Фото главного экрана для проверки"],
    [/vision max creative candidate placeholder/i, "Черновой визуал Vision MAX"],
    [/document preview placeholder/i, "Превью документа"],
    [/living glass oled context placeholder/i, "Интерьерный визуал Living Glass OLED"],
    [/vision max premium product hero placeholder/i, "Главный визуал Vision MAX Premium"],
    [/montelar direction card placeholder still/i, "Визуал направления Montelar"],
    [/montelar home hero placeholder still/i, "Главный визуал Montelar"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(title)) {
      return replacement;
    }
  }

  if (normalized.includes("placeholder")) {
    return title.replace(/\s*placeholder\s*/gi, " ").replace(/\s{2,}/g, " ").trim();
  }

  if (normalized.includes("browser qa")) {
    return title.replace(/browser qa/gi, "проверочный").replace(/\s{2,}/g, " ").trim();
  }

  return title;
}

function getProductionSafetyLabel(args: {
  approvalStatus: string;
  isReferenceOnly: boolean;
  publicationReadiness?: string;
  rightsStatus: string;
  visibilityMode?: string;
}) {
  const { approvalStatus, isReferenceOnly, publicationReadiness, rightsStatus, visibilityMode } = args;

  if (isReferenceOnly || rightsStatus === "reference-only") {
    return "Reference-only";
  }

  if (publicationReadiness === "production-ready") {
    return "Production-safe";
  }

  if (visibilityMode === "public" || visibilityMode === "gated") {
    return approvalStatus === "approved" && rightsStatus === "production-approved"
      ? "Production-safe"
      : "Not safe for production";
  }

  if (publicationReadiness === "preview-only" || visibilityMode === "preview-only") {
    return "Preview-only";
  }

  return approvalStatus === "approved" && rightsStatus === "production-approved"
    ? "Ready after publish wiring"
    : "Not safe for production";
}

function getPageLabel(page: WorkspaceRecord) {
  return getText(page.title) || getText(page.routePath) || getText(page.internalCode) || "Page";
}

function getSectionLabel(section: WorkspaceRecord) {
  return getText(section.previewLabel) || getText(section.title) || getText(section.internalCode) || "Section";
}

function getProductPlacementLabel(record: WorkspaceRecord) {
  const productLabel = getText(record.productLabelSnapshot) || getText(record.productKey) || "Product";
  const variantLabel = getText(record.variantLabelSnapshot);
  return variantLabel ? `${productLabel} · ${variantLabel}` : productLabel;
}

function buildProductPlacementHref(record: WorkspaceRecord, productIdByKey: Map<string, string>) {
  const productKey = getText(record.productKey);
  const productId = productIdByKey.get(productKey) ?? productIdByKey.get(productKey.toLowerCase()) ?? "";
  const params = new URLSearchParams();
  params.set("panel", "media");
  params.set("focus", "productPlacement");

  if (productId) {
    params.set("product", productId);
  } else if (productKey) {
    params.set("productKey", productKey);
  }

  return `/admin/products?${params.toString()}`;
}

function buildProductDocumentHref(record: WorkspaceRecord, productIdByKey: Map<string, string>) {
  const productKey = getText(record.productKey);
  const productId = productIdByKey.get(productKey) ?? productIdByKey.get(productKey.toLowerCase()) ?? "";
  const params = new URLSearchParams();
  params.set("panel", "media");
  params.set("focus", "productDocument");

  if (productId) {
    params.set("product", productId);
  } else if (productKey) {
    params.set("productKey", productKey);
  }

  return `/admin/products?${params.toString()}`;
}

function getWarningListForAsset(args: {
  asset: WorkspaceRecord;
  linkedDocumentCount: number;
  linkedPageCount: number;
  linkedPlacementCount: number;
  publicUsageConflict: boolean;
}) {
  const { asset, linkedDocumentCount, linkedPageCount, linkedPlacementCount, publicUsageConflict } = args;
  const warnings: string[] = [];
  const licenseExpiryAt = getText(asset.licenseExpiryAt);
  const publicationReadiness = getText(asset.publicationReadiness);
  const approvalStatus = getText(asset.approvalStatus);
  const audienceMode = getText(asset.audienceMode);
  const referenceOnly = getBoolean(asset.referenceOnlyNotProductionAsset) || getText(asset.rightsStatus) === "reference-only";

  if (hasExpiredDate(licenseExpiryAt)) {
    warnings.push("License expired or no longer valid for production use.");
  }

  if (getFileSize(asset.filesize) > getHeavyAssetThresholdBytes(asset)) {
    warnings.push("Heavy file: prepare a lighter export before wide public placement.");
  }

  if (
    audienceMode === "public" &&
    publicationReadiness === "production-ready" &&
    approvalStatus === "approved" &&
    !getBoolean(asset.languageNeutral) &&
    !getText(asset.altText)
  ) {
    warnings.push("Alt text is missing for a public production-ready asset.");
  }

  if (
    audienceMode === "public" &&
    publicationReadiness === "production-ready" &&
    approvalStatus === "approved" &&
    !getBoolean(asset.languageNeutral) &&
    !getText(asset.altText) &&
    !getText(asset.caption)
  ) {
    warnings.push("Public-safe metadata is incomplete: add alt text or caption.");
  }

  if (referenceOnly && publicUsageConflict) {
    warnings.push("Reference-only asset is still linked to a publishable production surface.");
  }

  if (linkedPlacementCount + linkedPageCount + linkedDocumentCount === 0) {
    warnings.push("Unused asset: no current product, page or document linkage detected.");
  }

  return warnings;
}

function getWarningListForDocument(args: {
  document: WorkspaceRecord;
  previewAsset: WorkspaceRecord | null;
  pageCount: number;
}) {
  const { document, previewAsset, pageCount } = args;
  const warnings: string[] = [];
  const visibilityMode = getText(document.visibilityMode);
  const rightsStatus = getText(document.rightsStatus);

  if (hasExpiredDate(getText(document.expiryDate))) {
    warnings.push("Document effective window has expired.");
  }

  if (getFileSize(document.filesize) > getHeavyDocumentThresholdBytes()) {
    warnings.push("Heavy file: compress the PDF or split the pack before public delivery.");
  }

  if ((visibilityMode === "public" || visibilityMode === "gated") && !getText(document.versionLabel)) {
    warnings.push("Version label is missing for a public or gated document.");
  }

  if ((visibilityMode === "public" || visibilityMode === "gated") && rightsStatus === "reference-only") {
    warnings.push("Reference-only document cannot stay on a public or gated surface.");
  }

  if (
    (visibilityMode === "public" || visibilityMode === "gated") &&
    (!previewAsset || !isProductionSafeMediaAsset(previewAsset))
  ) {
    warnings.push("Public/gated document requires a production-safe preview asset.");
  }

  if (pageCount === 0 && visibilityMode !== "internal-only") {
    warnings.push("Document is publishable but not linked from any page or section surface.");
  }

  return warnings;
}

function getAssetUsageKind(args: {
  linkedDocumentCount: number;
  linkedPageCount: number;
  linkedPlacementCount: number;
}) {
  const { linkedDocumentCount, linkedPageCount, linkedPlacementCount } = args;
  if (linkedPlacementCount > 0) {
    return "product-placement";
  }
  if (linkedDocumentCount > 0) {
    return "document-preview";
  }
  if (linkedPageCount > 0) {
    return "page-surface";
  }
  return "unused";
}

function matchesFilter(card: MediaWorkspaceCard, filter: MediaWorkspaceFilterId) {
  switch (filter) {
    case "needs-rights":
      return (
        card.rightsStatus === "reference-only" ||
        card.rightsStatus === "supplier-restricted" ||
        card.rightsStatus === "generated-pending-review"
      );
    case "needs-approval":
      return ["pending", "needs-review", "expired"].includes(card.approvalStatus);
    case "reference-only":
      return card.isReferenceOnly;
    case "expiry-risk":
      return card.warnings.some((warning) => warning.toLowerCase().includes("expired"));
    case "missing-metadata":
      return card.warnings.some((warning) => warning.toLowerCase().includes("metadata"));
    case "production-ready":
      return card.recordType === "asset" && card.rightsStatus !== "reference-only" && card.approvalStatus === "approved";
    case "documents":
      return card.recordType === "document";
    case "heavy":
      return card.warnings.some((warning) => warning.toLowerCase().includes("heavy file"));
    case "unlinked":
      return card.recordType === "asset" && card.usageLabel === "unused";
    default:
      return true;
  }
}

function matchesFacet(card: MediaWorkspaceCard, query: Required<Pick<
  MediaWorkspaceSnapshot,
  | "activeApprovalStatus"
  | "activeAssetType"
  | "activeLocale"
  | "activeReferenceOnly"
  | "activeRightsStatus"
  | "activeSearch"
  | "activeSourceCategory"
  | "activeUsage"
>>) {
  if (query.activeAssetType !== "all" && card.assetType !== query.activeAssetType) {
    return false;
  }

  if (query.activeSourceCategory !== "all" && card.sourceCategory !== query.activeSourceCategory) {
    return false;
  }

  if (query.activeRightsStatus !== "all" && card.rightsStatus !== query.activeRightsStatus) {
    return false;
  }

  if (query.activeApprovalStatus !== "all" && card.approvalStatus !== query.activeApprovalStatus) {
    return false;
  }

  if (query.activeLocale !== "all" && card.locale !== query.activeLocale) {
    return false;
  }

  if (query.activeUsage !== "any" && card.usageLabel !== query.activeUsage) {
    return false;
  }

  if (query.activeReferenceOnly === "only" && !card.isReferenceOnly) {
    return false;
  }

  if (query.activeReferenceOnly === "exclude" && card.isReferenceOnly) {
    return false;
  }

  if (query.activeSearch) {
    const haystack = `${card.title} ${card.subtitle} ${card.kindLabel}`.toLowerCase();
    if (!haystack.includes(query.activeSearch.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function createFacet(id: MediaWorkspaceFacet["id"], label: string, values: string[], cards: MediaWorkspaceCard[]) {
  const options: MediaWorkspaceFacetOption[] = values.map((value) => ({
    count:
      value === "all" || value === "any"
        ? cards.length
        : value === "only"
          ? cards.filter((card) => card.isReferenceOnly).length
          : value === "exclude"
            ? cards.filter((card) => !card.isReferenceOnly).length
            : cards.filter((card) => {
                switch (id) {
                  case "assetType":
                    return card.assetType === value;
                  case "sourceCategory":
                    return card.sourceCategory === value;
                  case "rightsStatus":
                    return card.rightsStatus === value;
                  case "approvalStatus":
                    return card.approvalStatus === value;
                  case "locale":
                    return card.locale === value;
                  case "usage":
                    return card.usageLabel === value;
                  case "referenceOnly":
                    return value === "only" ? card.isReferenceOnly : !card.isReferenceOnly;
                  default:
                    return false;
                }
              }).length,
    label: value,
    value,
  }));

  return { id, label, options };
}

export async function getMediaWorkspaceSnapshot(
  payload: Payload,
  req: PayloadRequest,
  query: MediaWorkspaceQuery,
): Promise<MediaWorkspaceSnapshot> {
  if (!canReadMediaWorkspace(req)) {
    throw new Error("forbidden");
  }

  const activeContext = normalizeContext(query.context);
  const activeFilter = normalizeFilter(query.filter);
  const activeLibrary = normalizeLibrary(query.library);
  const activeAssetType = getText(query.assetType) || "all";
  const activeSourceCategory = getText(query.sourceCategory) || "all";
  const activeRightsStatus = getText(query.rightsStatus) || "all";
  const activeApprovalStatus = getText(query.approvalStatus) || "all";
  const activeLocale = getText(query.locale) || "all";
  const activeUsage = normalizeUsage(query.usage);
  const activePageId = getText(query.pageId);
  const activeReferenceOnly = normalizeReferenceState(query.referenceOnly);
  const activeSearch = getText(query.q);

  const [assetsResult, documentsResult, placementsResult, pagesResult, sectionsResult, productsResult] = await Promise.all([
    payload.find({
      collection: "media-assets",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "product-documents",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "product-media",
      depth: 0,
      limit: 400,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "pages",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "page-sections",
      depth: 0,
      limit: 400,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "products",
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
    }),
  ]);

  const assets = assetsResult.docs as unknown as WorkspaceRecord[];
  const documents = documentsResult.docs as unknown as WorkspaceRecord[];
  const placements = placementsResult.docs as unknown as WorkspaceRecord[];
  const pages = pagesResult.docs as unknown as WorkspaceRecord[];
  const sections = sectionsResult.docs as unknown as WorkspaceRecord[];
  const products = productsResult.docs as unknown as WorkspaceRecord[];
  const productIdByKey = new Map<string, string>();

  for (const product of products) {
    const id = getId(product.id);
    if (id === null) {
      continue;
    }
    for (const key of [getText(product.slug), getText(product.internalCode), String(id)]) {
      if (key) {
        productIdByKey.set(key, String(id));
        productIdByKey.set(key.toLowerCase(), String(id));
      }
    }
  }

  const assetById = new Map<string, WorkspaceRecord>();
  for (const asset of assets) {
    const id = getId(asset.id);
    if (id !== null) {
      assetById.set(String(id), asset);
    }
  }

  const sectionById = new Map<string, WorkspaceRecord>();
  for (const section of sections) {
    const id = getId(section.id);
    if (id !== null) {
      sectionById.set(String(id), section);
    }
  }

  const pageLinksByAssetId = new Map<string, LinkedSurfaceSummary[]>();
  const pageLinksByDocumentId = new Map<string, LinkedSurfaceSummary[]>();
  const pageIdsByAssetId = new Map<string, Set<string>>();
  const pageIdsByDocumentId = new Map<string, Set<string>>();
  const homepagePageIds = new Set<string>();

  for (const page of pages) {
    const pageId = getId(page.id);
    if (pageId === null) {
      continue;
    }

    const slug = getText(page.slug);
    const routePath = getText(page.routePath) || "/";

    if (slug === "home" || routePath === "/") {
      homepagePageIds.add(String(pageId));
    }
  }

  function pushSummary(map: Map<string, LinkedSurfaceSummary[]>, key: string, summary: LinkedSurfaceSummary) {
    const existing = map.get(key) ?? [];
    if (!existing.some((entry) => entry.id === summary.id && entry.meta === summary.meta)) {
      existing.push(summary);
      map.set(key, existing);
    }
  }

  function pushPageLinkId(map: Map<string, Set<string>>, key: string, pageId: string) {
    const existing = map.get(key) ?? new Set<string>();
    existing.add(pageId);
    map.set(key, existing);
  }

  for (const page of pages) {
    const pageId = getId(page.id);
    if (pageId === null) {
      continue;
    }

    const pageIdText = String(pageId);
    const isHomepage = homepagePageIds.has(pageIdText);
    const pageLabel = getPageLabel(page);
    const pageHref = buildEditableFieldHref({
      fieldPath: "media",
      ownerId: pageId,
      ownerType: "page",
    });

    for (const [field, meta] of [
      [page.heroMedia, "page hero"],
      [page.coverMedia, "page cover"],
      [page.seoOgImage, "seo share image"],
    ] as const) {
      const relationId = getId(field);
      if (relationId !== null) {
        const relationIdText = String(relationId);
        pushSummary(pageLinksByAssetId, String(relationId), {
          href: pageHref,
          id: `page-${pageIdText}-${meta}`,
          label: pageLabel,
          meta: isHomepage ? `homepage · ${meta}` : meta,
          type: "page",
        });
        pushPageLinkId(pageIdsByAssetId, relationIdText, pageIdText);
      }
    }

    for (const document of getArray<unknown>(page.relatedDocuments)) {
      const relationId = getId(document);
      if (relationId !== null) {
        const relationIdText = String(relationId);
        pushSummary(pageLinksByDocumentId, String(relationId), {
          href: pageHref,
          id: `page-${pageIdText}-document-${relationIdText}`,
          label: pageLabel,
          meta: isHomepage ? "homepage · page related document" : "page related document",
          type: "page",
        });
        pushPageLinkId(pageIdsByDocumentId, relationIdText, pageIdText);
      }
    }

    for (const entry of getArray<WorkspaceRecord>(page.sections)) {
      const sectionId = getId(entry.section);
      if (sectionId === null) {
        continue;
      }

      const section = sectionById.get(String(sectionId));
      if (!section) {
        continue;
      }

      const sectionLabel = `${pageLabel} · ${getSectionLabel(section)}`;
      const sectionHref = buildEditableFieldHref({
        fieldPath: "media",
        ownerId: String(sectionId),
        ownerType: "block",
        pageId,
      });
      const heroMediaId = getId(toRecord(section.heroContent)?.heroMedia);
      if (heroMediaId !== null) {
        const heroMediaIdText = String(heroMediaId);
        pushSummary(pageLinksByAssetId, String(heroMediaId), {
          href: sectionHref,
          id: `section-${sectionId}-hero`,
          label: sectionLabel,
          meta: isHomepage ? "homepage · section hero" : "section hero",
          type: "page",
        });
        pushPageLinkId(pageIdsByAssetId, heroMediaIdText, pageIdText);
      }

      for (const item of getArray<WorkspaceRecord>(section.galleryItems)) {
        const assetId = getId(item.asset);
        if (assetId !== null) {
          const assetIdText = String(assetId);
          pushSummary(pageLinksByAssetId, String(assetId), {
            href: sectionHref,
            id: `section-${sectionId}-gallery-${assetId}`,
            label: sectionLabel,
            meta: isHomepage ? "homepage · gallery item" : "gallery item",
            type: "page",
          });
          pushPageLinkId(pageIdsByAssetId, assetIdText, pageIdText);
        }
      }

      for (const document of getArray<unknown>(toRecord(section.journalDownloadsContent)?.documents)) {
        const relationId = getId(document);
        if (relationId !== null) {
          const relationIdText = String(relationId);
          pushSummary(pageLinksByDocumentId, String(relationId), {
            href: sectionHref,
            id: `section-${sectionId}-document-${relationId}`,
            label: sectionLabel,
            meta: isHomepage ? "homepage · section download" : "section download",
            type: "page",
          });
          pushPageLinkId(pageIdsByDocumentId, relationIdText, pageIdText);
        }
      }
    }
  }

  const placementLinksByAssetId = new Map<string, LinkedSurfaceSummary[]>();
  const primaryPlacementByAssetId = new Map<string, MediaWorkspacePlacementEditor>();

  for (const placement of placements) {
    const mediaAssetId = getId(placement.mediaAsset);
    if (mediaAssetId === null) {
      continue;
    }

    const placementId = getId(placement.id);
    const productEditorHref = buildProductPlacementHref(placement, productIdByKey);
    const summary: LinkedSurfaceSummary = {
      href: productEditorHref,
      id: `placement-${placementId ?? mediaAssetId}`,
      label: getProductPlacementLabel(placement),
      meta: `${getText(placement.slot) || "slot"} · ${getText(placement.visibilityMode) || "preview-only"}`,
      type: "product",
    };
    pushSummary(placementLinksByAssetId, String(mediaAssetId), summary);

    if (!primaryPlacementByAssetId.has(String(mediaAssetId))) {
      primaryPlacementByAssetId.set(String(mediaAssetId), {
        approvalStatus: getText(placement.approvalStatus),
        href: productEditorHref,
        id: String(placementId ?? mediaAssetId),
        productKey: getText(placement.productKey),
        productLabel: getText(placement.productLabelSnapshot),
        rightsStatus: getText(placement.rightsStatus),
        slot: getText(placement.slot),
        status: getText(placement.status),
        surfaceTargets: getArray<string>(placement.surfaceTargets).map(getText).filter(Boolean),
        usageIntent: getText(placement.usageIntent),
        variantLabel: getText(placement.variantLabelSnapshot),
        visibilityMode: getText(placement.visibilityMode),
      });
    }
  }

  const documentPreviewLinksByAssetId = new Map<string, LinkedSurfaceSummary[]>();
  const documentDetailById = new Map<string, MediaWorkspaceDocumentDetail>();

  for (const document of documents) {
    const documentId = getId(document.id);
    const previewAssetId = getId(document.previewAsset);
    const pageLinks = documentId !== null ? pageLinksByDocumentId.get(String(documentId)) ?? [] : [];
    const previewAsset = previewAssetId !== null ? assetById.get(String(previewAssetId)) ?? null : null;
    const warnings = getWarningListForDocument({
      document,
      pageCount: pageLinks.length,
      previewAsset,
    });

    if (previewAssetId !== null) {
      const linkedPageIds = Array.from(pageIdsByDocumentId.get(String(documentId ?? "")) ?? []);
      for (const linkedPageId of linkedPageIds) {
        if (linkedPageId) {
          pushPageLinkId(pageIdsByAssetId, String(previewAssetId), linkedPageId);
        }
      }
      pushSummary(documentPreviewLinksByAssetId, String(previewAssetId), {
        href:
          documentId !== null
            ? buildMediaWorkspaceHref({ filter: "documents", selected: `document:${documentId}` })
            : buildMediaWorkspaceHref({ filter: "documents" }),
        id: `document-preview-${documentId ?? previewAssetId}`,
          label: getOwnerMediaTitle(getText(document.documentTitle) || getText(document.publicLabel), "Документ"),
        meta: `${getText(document.visibilityMode) || "preview-only"} · ${getText(document.documentType) || "document"}`,
        type: "document",
      });
    }

    if (documentId !== null) {
      const productHref = buildProductDocumentHref(document, productIdByKey);
      const productKey = getText(document.productKey);
      const linkedProducts = productKey
        ? [
            {
              href: productHref,
              id: `product-document-${documentId}`,
              label: getText(document.productLabelSnapshot) || productKey,
              meta: `${getText(document.documentType) || "document"} · ${getText(document.visibilityMode) || "preview-only"}`,
              type: "product" as const,
            },
          ]
        : [];
      documentDetailById.set(String(documentId), {
        approvalStatus: getText(document.approvalStatus),
        documentTitle: getText(document.documentTitle),
        documentType: getText(document.documentType),
        downloadBehavior: getText(document.downloadBehavior),
        href: productHref,
        id: String(documentId),
        internalCode: getText(document.internalCode),
        linkedPages: pageLinks,
        linkedProducts,
        locale: getText(document.primaryLocale) || "en",
        previewAssetLabel: getOwnerMediaTitle(
          getText(previewAsset?.assetTitle),
          previewAssetId !== null ? `Файл ${previewAssetId}` : "Превью не выбрано",
        ),
        productLabel: getText(document.productLabelSnapshot) || getText(document.productKey),
        publicLabel: getText(document.publicLabel),
        replaceGuidance:
          "Замена PDF или документа делается в исходной карточке. После этого проверьте версию, превью и связанные страницы.",
        replaceHref: productHref,
        requiresInquiryContext: getBoolean(document.requiresInquiryContext),
        rightsStatus: getText(document.rightsStatus),
        status: getText(document.status),
        surfaceTargets: getArray<string>(document.surfaceTargets).map(getText).filter(Boolean),
        variantLabel: getText(document.variantLabelSnapshot),
        versionLabel: getText(document.versionLabel),
        visibilityMode: getText(document.visibilityMode),
        warnings,
        fileSizeBytes: getFileSize(document.filesize),
      });
    }
  }

  const cards: MediaWorkspaceCard[] = [];
  const assetDetailsById = new Map<string, MediaWorkspaceAssetDetail>();

  for (const asset of assets) {
    const assetId = getId(asset.id);
    if (assetId === null) {
      continue;
    }

    const linkedPages = pageLinksByAssetId.get(String(assetId)) ?? [];
    const linkedPageIds = Array.from(pageIdsByAssetId.get(String(assetId)) ?? []);
    const linkedPlacements = placementLinksByAssetId.get(String(assetId)) ?? [];
    const linkedDocuments = documentPreviewLinksByAssetId.get(String(assetId)) ?? [];
    const publicUsageConflict =
      linkedPlacements.some((entry) => entry.meta.includes("public")) ||
      linkedPages.length > 0 ||
      linkedDocuments.some((entry) => entry.meta.includes("public") || entry.meta.includes("gated"));
    const warnings = getWarningListForAsset({
      asset,
      linkedDocumentCount: linkedDocuments.length,
      linkedPageCount: linkedPages.length,
      linkedPlacementCount: linkedPlacements.length,
      publicUsageConflict,
    });
    const usageLabel = getAssetUsageKind({
      linkedDocumentCount: linkedDocuments.length,
      linkedPageCount: linkedPages.length,
      linkedPlacementCount: linkedPlacements.length,
    });

    const productionSafetyLabel = getProductionSafetyLabel({
      approvalStatus: getText(asset.approvalStatus) || "pending",
      isReferenceOnly:
        getBoolean(asset.referenceOnlyNotProductionAsset) || getText(asset.rightsStatus) === "reference-only",
      publicationReadiness: getText(asset.publicationReadiness) || "blocked",
      rightsStatus: getText(asset.rightsStatus) || "reference-only",
    });
    const fileSizeBytes = getFileSize(asset.filesize);
    const responsiveCrop = toRecord(asset.responsiveCrop);
    const card: MediaWorkspaceCard = {
      approvalStatus: getText(asset.approvalStatus) || "pending",
      assetType: getText(asset.assetType) || "image",
      href: buildCollectionHref("media-assets", assetId),
      id: `asset:${assetId}`,
      isReferenceOnly:
        getBoolean(asset.referenceOnlyNotProductionAsset) || getText(asset.rightsStatus) === "reference-only",
      kindLabel: getText(asset.assetRole) || "Медиафайл",
      linkedPageIds,
      locale: getText(asset.primaryLocale) || "en",
      placementCount: linkedPlacements.length,
      pageCount: linkedPages.length,
      primaryWarning: warnings[0] ?? null,
      productionSafetyLabel,
      recordId: String(assetId),
      recordType: "asset",
      referenceBadge:
        getBoolean(asset.referenceOnlyNotProductionAsset) || getText(asset.rightsStatus) === "reference-only"
          ? "reference-only"
          : getText(asset.publicationReadiness) || "blocked",
      rightsStatus: getText(asset.rightsStatus) || "reference-only",
      sourceCategory: getText(asset.sourceCategory) || "internal",
      status: getText(asset.status) || "draft",
      subtitle: getText(asset.internalCode),
      title: getOwnerMediaTitle(getText(asset.assetTitle), "Файл без названия"),
      usageLabel,
      usageTitle: getUsageTitle(usageLabel),
      warnings,
    };
    cards.push(card);

    assetDetailsById.set(String(assetId), {
      approvalStatus: card.approvalStatus,
      assetRole: getText(asset.assetRole),
      assetTitle: card.title,
      assetType: card.assetType,
      audienceMode: getText(asset.audienceMode) || "public",
      caption: getText(asset.caption),
      creditLine: getText(asset.creditLine),
      editorialSummary: getText(asset.editorialSummary),
      fileMeta: [
        getText(asset.filename),
        getText(asset.mimeType),
        asset.filesize ? `${asset.filesize} bytes` : "",
      ].filter(Boolean),
      governanceNotes: getText(asset.governanceNotes),
      href: card.href,
      id: String(assetId),
      internalCode: card.subtitle,
      isReferenceOnly: card.isReferenceOnly,
      licenseExpiryAt: getText(asset.licenseExpiryAt),
      linkedDocuments,
      linkedPages,
      linkedPlacements,
      locale: card.locale,
      placementEditor: primaryPlacementByAssetId.get(String(assetId)) ?? null,
      primaryPreviewLabel: getText(asset.filename) || getText(asset.assetRole) || "Загруженный файл",
      publicationReadiness: getText(asset.publicationReadiness) || "blocked",
      replaceGuidance:
        "Замените файл через owner-команду ниже: связи со страницами, продуктами и документами останутся на этой же записи.",
      replaceHref: "/api/internal/owner-media-commands",
      referenceOnlyReason: getText(asset.usageRestrictions),
      responsiveCrop: {
        desktop: getCropBox(responsiveCrop?.desktop),
        mobile: getCropBox(responsiveCrop?.mobile),
        notes: getText(responsiveCrop?.notes),
      },
      rightsStatus: card.rightsStatus,
      sourceCategory: card.sourceCategory,
      sourceName: getText(asset.sourceName),
      sourceUrl: getText(asset.sourceUrl),
      status: card.status,
      cropSupportLabel:
        "Desktop/mobile crop сохраняется как метадата owner-команды. Публичный слой сможет использовать её без замены файла.",
      fileSizeBytes,
      optimizationStatus: getOptimizationStatus(asset),
      usageRestrictions: getText(asset.usageRestrictions),
      warnings,
      altText: getText(asset.altText),
    });
  }

  for (const document of documents) {
    const documentId = getId(document.id);
    if (documentId === null) {
      continue;
    }

    const detail = documentDetailById.get(String(documentId));
    const linkedPageIds = Array.from(pageIdsByDocumentId.get(String(documentId)) ?? []);
    const productionSafetyLabel = getProductionSafetyLabel({
      approvalStatus: getText(document.approvalStatus) || "pending",
      isReferenceOnly: getText(document.rightsStatus) === "reference-only",
      rightsStatus: getText(document.rightsStatus) || "reference-only",
      visibilityMode: getText(document.visibilityMode) || "preview-only",
    });
    const card: MediaWorkspaceCard = {
      approvalStatus: getText(document.approvalStatus) || "pending",
      assetType: getText(document.documentType) || "document",
      href: detail?.href ?? buildMediaWorkspaceHref({ filter: "documents", selected: `document:${documentId}` }),
      id: `document:${documentId}`,
      isReferenceOnly: getText(document.rightsStatus) === "reference-only",
      kindLabel: getText(document.visibilityMode) || "preview-only",
      linkedPageIds,
      locale: getText(document.primaryLocale) || "en",
      placementCount: 0,
      pageCount: detail?.linkedPages.length ?? 0,
      primaryWarning: detail?.warnings[0] ?? null,
      productionSafetyLabel,
      recordId: String(documentId),
      recordType: "document",
      referenceBadge: getText(document.visibilityMode) || "preview-only",
      rightsStatus: getText(document.rightsStatus) || "reference-only",
      sourceCategory: getText(document.sourceCategory) || "internal",
      status: getText(document.status) || "draft",
      subtitle: getText(document.internalCode),
      title: getOwnerMediaTitle(getText(document.documentTitle), "Документ без названия"),
      usageLabel: "document-preview",
      usageTitle: getUsageTitle("document-preview"),
      warnings: detail?.warnings ?? [],
    };
    cards.push(card);
  }

  const filteredCards = cards
    .filter((card) => activeLibrary === "all" || classifyCardLibrary(card) === activeLibrary)
    .filter((card) => {
      if (activeContext === "homepage") {
        return card.linkedPageIds.some((pageId) => homepagePageIds.has(pageId));
      }

      if (activePageId) {
        return card.linkedPageIds.includes(activePageId);
      }

      return true;
    })
    .filter((card) => matchesFilter(card, activeFilter))
    .filter((card) =>
      matchesFacet(card, {
        activeApprovalStatus,
        activeAssetType,
        activeLocale,
        activeReferenceOnly,
        activeRightsStatus,
        activeSearch,
        activeSourceCategory,
        activeUsage,
      }),
    );

  const requestedSelectedId = getText(query.selected);
  const selectedCard =
    filteredCards.find((card) => card.id === requestedSelectedId) ??
    filteredCards.find((card) => {
      if (requestedSelectedId.includes(":")) {
        return false;
      }
      if (activeLibrary === "document" || activeFilter === "documents") {
        return card.recordType === "document" && card.recordId === requestedSelectedId;
      }
      return card.recordType === "asset" && card.recordId === requestedSelectedId;
    }) ??
    filteredCards.find((card) => card.recordId === requestedSelectedId) ??
    filteredCards[0] ??
    null;
  const assetDetail =
    selectedCard?.recordType === "asset" ? assetDetailsById.get(selectedCard.recordId) ?? null : null;
  const documentDetail =
    selectedCard?.recordType === "document" ? documentDetailById.get(selectedCard.recordId) ?? null : null;

  const focusPage =
    activeContext === "homepage"
      ? pages.find((page) => homepagePageIds.has(String(getId(page.id) ?? ""))) ?? null
      : activePageId
        ? pages.find((page) => String(getId(page.id) ?? "") === activePageId) ?? null
        : null;
  const focusPageId = focusPage ? String(getId(focusPage.id) ?? "") : "";
  const focusLabel =
    activeContext === "homepage"
      ? "Медиа главной: hero, секции и превью документов"
      : focusPage
        ? `${getPageLabel(focusPage)}: связанные медиа и документы`
        : "Вся рабочая медиатека и документы";

  const filters: MediaWorkspaceFilterSummary[] = mediaWorkspaceFilterIds.map((id) => ({
    count: cards.filter((card) => matchesFilter(card, id)).length,
    description:
      id === "needs-rights"
        ? "Проблемы с правами и готовностью к публикации."
        : id === "needs-approval"
          ? "Очередь на согласование."
          : id === "reference-only"
            ? "Референсы и внутренние материалы."
            : id === "expiry-risk"
              ? "Истёкшие лицензии и устаревшие документы."
              : id === "missing-metadata"
                ? "Не хватает alt-текста, подписи или других редакторских данных."
                : id === "production-ready"
                  ? "Файлы, готовые к публикации на сайте."
                  : id === "documents"
                    ? "PDF и документы с контролем версии и доступа."
                    : id === "heavy"
                      ? "Тяжёлые изображения, видео и PDF для оптимизации."
                    : id === "unlinked"
                      ? "Файлы пока никуда не привязаны."
                      : "Все записи медиатеки и документов.",
    id,
    label:
      id === "needs-rights"
        ? "Права"
        : id === "needs-approval"
          ? "Согласование"
          : id === "reference-only"
            ? "Референсы"
            : id === "expiry-risk"
              ? "Сроки"
              : id === "missing-metadata"
                ? "Данные"
                : id === "production-ready"
                  ? "Готово"
                  : id === "documents"
                    ? "Документы"
                    : id === "heavy"
                      ? "Тяжёлые"
                    : id === "unlinked"
                      ? "Не привязано"
                      : "Все",
  }));

  return {
    activeApprovalStatus,
    activeAssetType,
    activeContext,
    activeFilter,
    activeLibrary,
    activeLocale,
    activePageId,
    activeReferenceOnly,
    activeRightsStatus,
    activeSearch,
    activeSourceCategory,
    activeUsage,
    assetDetail,
    canUpdate: canUpdateMediaWorkspace(req),
    cards: filteredCards,
    documentDetail,
    emptyState: "По текущим фильтрам не найдено ни медиафайлов, ни документов.",
    facets: [
      createFacet("assetType", "Тип", ["all", ...mediaAssetTypeOptions, "brochure", "spec-sheet", "other"], cards),
      createFacet("sourceCategory", "Источник", ["all", ...mediaAssetSourceCategoryOptions], cards),
      createFacet("rightsStatus", "Права", ["all", ...governanceRightsStatusOptions], cards),
      createFacet("approvalStatus", "Согласование", ["all", ...governanceApprovalStatusOptions], cards),
      createFacet(
        "locale",
        "Язык файла",
        ["all", ...Array.from(new Set(cards.map((card) => card.locale))).sort()],
        cards,
      ),
      createFacet("usage", "Использование", ["any", ...mediaUsageOptions.filter((entry) => entry !== "any")], cards),
      createFacet("referenceOnly", "Только референсы", ["all", "only", "exclude"], cards),
    ],
    filters,
    focusLabel,
    focusPageHref: focusPage
      ? buildEditableFieldHref({
          fieldPath: "media",
          ownerId: focusPageId,
          ownerType: "page",
        })
      : null,
    focusPublicUrl:
      focusPage && focusPageId
        ? `${process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, "") || "http://89.150.34.66:8093"}${getText(focusPage.previewPath || focusPage.routePath) || "/"}`
        : null,
    generatedAt: new Date().toISOString(),
    libraries: mediaLibraryOptions.map((id) => ({
      count: cards.filter((card) => id === "all" || classifyCardLibrary(card) === id).length,
      description:
        id === "photo"
          ? "Фотографии, обложки, логотипы и основные визуальные файлы."
          : id === "video"
            ? "Видео и файлы для проверки движения."
            : id === "document"
              ? "PDF, брошюры, спецификации и другие документы."
              : "Вся рабочая медиатека и документы.",
      id,
      label:
        id === "photo"
          ? "Фото"
          : id === "video"
            ? "Видео"
            : id === "document"
              ? "PDF и документы"
              : "Все файлы",
    })),
    totalVisibleCards: filteredCards.length,
  };
}

function getAllowedValue(value: unknown, allowed: readonly string[]) {
  const text = getText(value);
  return allowed.includes(text) ? text : "";
}

function getAllowedStringArray(value: unknown, allowed: readonly string[]) {
  return getArray<unknown>(value)
    .map(getText)
    .filter((entry) => allowed.includes(entry));
}

async function updateAsset(payload: Payload, id: string, input: MediaWorkspaceUpdateInput) {
  const data: Record<string, unknown> = {};

  for (const key of [
    "assetTitle",
    "assetRole",
    "altText",
    "caption",
    "creditLine",
    "editorialSummary",
    "sourceName",
    "sourceUrl",
    "usageRestrictions",
    "governanceNotes",
    "licenseExpiryAt",
  ] as const) {
    if (key in input) {
      data[key] = getText(input[key]);
    }
  }

  const assetType = getAllowedValue(input.assetType, mediaAssetTypeOptions);
  if (assetType) {
    data.assetType = assetType;
  }

  const sourceCategory = getAllowedValue(input.sourceCategory, mediaAssetSourceCategoryOptions);
  if (sourceCategory) {
    data.sourceCategory = sourceCategory;
  }

  const rightsStatus = getAllowedValue(input.rightsStatus, governanceRightsStatusOptions);
  if (rightsStatus) {
    data.rightsStatus = rightsStatus;
  }

  const approvalStatus = getAllowedValue(input.approvalStatus, governanceApprovalStatusOptions);
  if (approvalStatus) {
    data.approvalStatus = approvalStatus;
  }

  const publicationReadiness = getAllowedValue(input.publicationReadiness, publicationReadinessOptions);
  if (publicationReadiness) {
    data.publicationReadiness = publicationReadiness;
  }

  const audienceMode = getAllowedValue(input.audienceMode, [
    "public",
    "dealer",
    "owner-review",
    "internal-only",
  ]);
  if (audienceMode) {
    data.audienceMode = audienceMode;
  }

  if ("referenceOnlyNotProductionAsset" in input) {
    data.referenceOnlyNotProductionAsset = getBoolean(input.referenceOnlyNotProductionAsset);
  }

  if ("status" in input) {
    const status = getAllowedValue(input.status, ["draft", "review", "approved", "published", "archived"]);
    if (status) {
      data.status = status;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("no-op");
  }

  await payload.update({
    collection: "media-assets",
    data,
    id,
    overrideAccess: true,
    showHiddenFields: true,
  });
}

async function updatePlacement(payload: Payload, id: string, input: MediaWorkspaceUpdateInput) {
  const data: Record<string, unknown> = {};

  for (const key of ["publicationNotes"] as const) {
    if (key in input) {
      data[key] = getText(input[key]);
    }
  }

  const status = getAllowedValue(input.status, ["draft", "review", "approved", "published", "archived"]);
  if (status) {
    data.status = status;
  }

  const visibilityMode = getAllowedValue(input.visibilityMode, ["public", "internal-only", "preview-only"]);
  if (visibilityMode) {
    data.visibilityMode = visibilityMode;
  }

  const slot = getAllowedValue(input.slot, [
    "hero",
    "card",
    "gallery-object",
    "gallery-context",
    "gallery-detail",
    "detail",
    "document-preview",
    "admin-preview",
  ]);
  if (slot) {
    data.slot = slot;
  }

  const rightsStatus = getAllowedValue(input.rightsStatus, governanceRightsStatusOptions);
  if (rightsStatus) {
    data.rightsStatus = rightsStatus;
  }

  const approvalStatus = getAllowedValue(input.approvalStatus, governanceApprovalStatusOptions);
  if (approvalStatus) {
    data.approvalStatus = approvalStatus;
  }

  const usageIntent = getAllowedValue(input.usageIntent, [
    "production",
    "editorial-preview",
    "creative-review",
    "supplier-handoff",
  ]);
  if (usageIntent) {
    data.usageIntent = usageIntent;
  }

  if ("surfaceTargets" in input) {
    data.surfaceTargets = getAllowedStringArray(input.surfaceTargets, [
      "listing-card",
      "pdp",
      "gallery",
      "detail-panel",
      "document-preview",
      "admin-preview",
    ]);
  }

  if (Object.keys(data).length === 0) {
    throw new Error("no-op");
  }

  await payload.update({
    collection: "product-media",
    data,
    id,
    overrideAccess: true,
    showHiddenFields: true,
  });
}

async function updateDocument(payload: Payload, id: string, input: MediaWorkspaceUpdateInput) {
  const data: Record<string, unknown> = {};

  for (const key of ["documentTitle", "publicLabel", "versionLabel", "localizedTitleOverride", "localizedSummaryOverride"] as const) {
    if (key in input) {
      data[key] = getText(input[key]);
    }
  }

  const visibilityMode = getAllowedValue(input.visibilityMode, [
    "public",
    "gated",
    "preview-only",
    "internal-only",
  ]);
  if (visibilityMode) {
    data.visibilityMode = visibilityMode;
  }

  const downloadBehavior = getAllowedValue(input.downloadBehavior, [
    "direct-download",
    "open-viewer",
    "request-access",
    "admin-only",
  ]);
  if (downloadBehavior) {
    data.downloadBehavior = downloadBehavior;
  }

  const status = getAllowedValue(input.status, ["draft", "review", "approved", "published", "archived"]);
  if (status) {
    data.status = status;
  }

  const rightsStatus = getAllowedValue(input.rightsStatus, governanceRightsStatusOptions);
  if (rightsStatus) {
    data.rightsStatus = rightsStatus;
  }

  const approvalStatus = getAllowedValue(input.approvalStatus, governanceApprovalStatusOptions);
  if (approvalStatus) {
    data.approvalStatus = approvalStatus;
  }

  if ("requiresInquiryContext" in input) {
    data.requiresInquiryContext = getBoolean(input.requiresInquiryContext);
  }

  if ("surfaceTargets" in input) {
    data.surfaceTargets = getAllowedStringArray(input.surfaceTargets, [
      "pdp-downloads",
      "variant-panel",
      "after-inquiry",
      "dealer-pack",
      "admin-sidebar",
    ]);
  }

  if (Object.keys(data).length === 0) {
    throw new Error("no-op");
  }

  await payload.update({
    collection: "product-documents",
    data,
    id,
    overrideAccess: true,
    showHiddenFields: true,
  });
}

export async function applyMediaWorkspaceUpdate(
  payload: Payload,
  req: PayloadRequest,
  input: MediaWorkspaceUpdateInput,
) {
  if (!canUpdateMediaWorkspace(req)) {
    throw new Error("forbidden");
  }

  const targetType = getText(input.targetType);
  const targetId = getText(input.targetId);

  if (!targetType || !targetId) {
    throw new Error("invalid-input");
  }

  if (targetType === "asset") {
    await updateAsset(payload, targetId, input);
    return;
  }

  if (targetType === "placement") {
    await updatePlacement(payload, targetId, input);
    return;
  }

  if (targetType === "document") {
    await updateDocument(payload, targetId, input);
    return;
  }

  throw new Error("invalid-input");
}

export function getMediaWorkspaceRoleLabel(role: AdminRole | null | undefined) {
  switch (role) {
    case "owner":
      return "Владелец утверждает исключения, безопасные для публикации, и финальный выпуск материалов.";
    case "admin":
      return "Администратор следит за правами, готовностью и согласованностью размещения на всех поверхностях.";
    case "media-manager":
      return "Медиа-менеджер ведёт метаданные файла, права, согласования и производственный поток размещения.";
    case "developer":
      return "Разработчик может проверить низкоуровневые связи, не ломая управляемый рабочий слой.";
    default:
      return "Медиатека доступна только ролям, которые ведут управляемый операционный контур.";
  }
}

export function getMediaDashboardHref(filter: MediaWorkspaceFilterId = "needs-rights") {
  return buildMediaWorkspaceHref({ filter });
}
