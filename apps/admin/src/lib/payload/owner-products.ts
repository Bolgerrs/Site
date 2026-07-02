import type { Payload, PayloadRequest } from "payload";

import { getAdminUser } from "./access.ts";
import { getProductPublicUrl } from "./product-editor.ts";
import { hasAdminRole, type AdminRole } from "./roles.ts";

const productReadRoles = ["owner", "admin", "content-editor", "developer"] as const satisfies readonly AdminRole[];

type GenericRecord = Record<string, unknown>;

type ProductPreviewMedia = {
  alt: string;
  src: string;
};

export type OwnerProductMediaOption = {
  alt: string;
  id: string;
  label: string;
  src: string;
  status: string;
};

export type OwnerProductMediaItem = {
  assetId: string;
  altText: string;
  fileName: string;
  fileSizeLabel: string;
  fileUrl: string;
  href: string;
  id: string;
  label: string;
  mimeType: string;
  previewUrl: string;
  slot: string;
  status: string;
};

export type OwnerProductDocumentItem = {
  fileName: string;
  fileSizeLabel: string;
  fileUrl: string;
  href: string;
  id: string;
  label: string;
  previewUrl: string;
  status: string;
  type: string;
};

export type OwnerProductCard = {
  availabilityMode: string;
  coverCardAssetId: string;
  categoryId: string;
  categoryLabel: string;
  checksHref: string;
  commandHref: string;
  description: string;
  directionId: string;
  directionLabel: string;
  editorHref: string;
  formId: string;
  formHref: string;
  formStatus: string;
  formTitle: string;
  hasCategory: boolean;
  hasForm: boolean;
  hasHero: boolean;
  hasSeo: boolean;
  heroAssetId: string;
  id: string;
  issueLabels: string[];
  label: string;
  lineId: string;
  lineLabel: string;
  launchStage: string;
  mediaHref: string;
  locale: string;
  publicHref: string;
  previewMedia: ProductPreviewMedia | null;
  productKey: string;
  productDocuments: OwnerProductDocumentItem[];
  productMedia: OwnerProductMediaItem[];
  seoDescription: string;
  seoEntryId: string;
  seoTitle: string;
  status: string;
  translationsHref: string;
};

export type OwnerProductHierarchyOption = {
  categoryId?: string;
  directionId?: string;
  id: string;
  label: string;
  order: number;
  slug: string;
  status: string;
};

export type OwnerProductHierarchy = {
  categories: OwnerProductHierarchyOption[];
  directions: OwnerProductHierarchyOption[];
  lines: OwnerProductHierarchyOption[];
};

export type OwnerProductsSnapshot = {
  canRead: boolean;
  cards: OwnerProductCard[];
  commandEndpoint: string;
  generatedAt: string;
  hierarchy: OwnerProductHierarchy;
  mediaOptions: OwnerProductMediaOption[];
  selectedProduct: OwnerProductCard | null;
  selectedProductId: string | null;
  totals: {
    missingCategory: number;
    missingForm: number;
    missingHero: number;
    missingSeo: number;
    published: number;
    total: number;
  };
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRecordId(value: unknown) {
  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

function getRelationLabel(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as GenericRecord;
    return getText(record.publicLabel) || getText(record.name) || getText(record.title) || getText(record.slug);
  }

  return "";
}

function getRelationId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    return getRecordId((value as GenericRecord).id);
  }

  return "";
}

function getMediaPreview(value: unknown): ProductPreviewMedia | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as GenericRecord;
  const src = getText(record.thumbnailURL) || getText(record.url);

  if (!src) {
    return null;
  }

  return {
    alt: getText(record.altText) || getText(record.assetTitle) || "Preview image",
    src,
  };
}

function getFileUrl(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as GenericRecord;
  return getText(record.url) || getText(record.thumbnailURL);
}

function getPreviewUrl(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as GenericRecord;
  return getText(record.thumbnailURL) || getText(record.url);
}

function getFileSizeLabel(value: unknown) {
  return typeof value === "number" ? `${Math.round(value / 1024)} KB` : "";
}

function buildProductIssues(card: Pick<OwnerProductCard, "hasCategory" | "hasForm" | "hasHero" | "hasSeo" | "status">) {
  const issues: string[] = [];

  if (!card.hasCategory) {
    issues.push("Не выбрана категория каталога.");
  }

  if (!card.hasHero) {
    issues.push("Нужно фото для карточки и hero.");
  }

  if (!card.hasForm) {
    issues.push("Нет привязанной формы заявки.");
  }

  if (!card.hasSeo) {
    issues.push("Не подготовлены SEO title/description.");
  }

  if (card.status !== "published") {
    issues.push("Не опубликован на сайте.");
  }

  return issues;
}

function assertReadAccess(req: PayloadRequest) {
  const user = getAdminUser(req.user);

  if (!hasAdminRole(user, productReadRoles)) {
    throw new Error("forbidden");
  }
}

export async function getOwnerProductsSnapshot(
  payload: Payload,
  req: PayloadRequest,
  options: { selectedProductId?: string | null } = {},
): Promise<OwnerProductsSnapshot> {
  assertReadAccess(req);

  const [
    productsResult,
    formsResult,
    seoResult,
    directionsResult,
    categoriesResult,
    linesResult,
    mediaResult,
    productMediaResult,
    productDocumentsResult,
  ] = await Promise.all([
    payload.find({
      collection: "products",
      depth: 1,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      sort: "name",
    }),
    payload.find({
      collection: "productInquiryForms",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
    }),
    payload.find({
      collection: "seo-entries",
      depth: 0,
      limit: 300,
      overrideAccess: true,
      pagination: false,
      where: {
        ownerType: {
          equals: "product",
        },
      },
    }),
    payload.find({
      collection: "product-directions",
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    }),
    payload.find({
      collection: "product-categories",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    }),
    payload.find({
      collection: "product-lines",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    }),
    payload.find({
      collection: "media-assets",
      depth: 0,
      limit: 80,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    payload.find({
      collection: "product-media",
      depth: 1,
      limit: 400,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    }),
    payload.find({
      collection: "product-documents",
      depth: 1,
      limit: 400,
      overrideAccess: true,
      pagination: false,
      sort: "order",
    }),
  ]);
  const formsByProductId = new Map<string, GenericRecord[]>();
  const seoByProductId = new Map<string, GenericRecord[]>();
  const productMediaByKey = new Map<string, OwnerProductMediaItem[]>();
  const productDocumentsByKey = new Map<string, OwnerProductDocumentItem[]>();

  for (const form of (formsResult.docs as unknown) as GenericRecord[]) {
    const productId = getRelationId(form.product);

    if (!productId) {
      continue;
    }

    const current = formsByProductId.get(productId) ?? [];
    current.push(form);
    formsByProductId.set(productId, current);
  }

  for (const seoEntry of (seoResult.docs as unknown) as GenericRecord[]) {
    const productId = getRelationId(seoEntry.ownerProduct);

    if (!productId) {
      continue;
    }

    const current = seoByProductId.get(productId) ?? [];
    current.push(seoEntry);
    seoByProductId.set(productId, current);
  }

  for (const item of (productMediaResult.docs as unknown) as GenericRecord[]) {
    const productKey = getText(item.productKey);
    if (!productKey) {
      continue;
    }
    const mediaAsset = item.mediaAsset as GenericRecord | string | number | null | undefined;

    const mediaItem: OwnerProductMediaItem = {
      assetId: getRelationId(item.mediaAsset),
      altText: mediaAsset && typeof mediaAsset === "object" ? getText(mediaAsset.altText) : "",
      fileName: mediaAsset && typeof mediaAsset === "object" ? getText(mediaAsset.filename) : "",
      fileSizeLabel: mediaAsset && typeof mediaAsset === "object" ? getFileSizeLabel(mediaAsset.filesize) : "",
      fileUrl: getFileUrl(mediaAsset),
      href: `/admin/products?productKey=${encodeURIComponent(productKey)}&panel=media&focus=productPlacement`,
      id: getRecordId(item.id),
      label: getText(item.productLabelSnapshot) || productKey,
      mimeType: mediaAsset && typeof mediaAsset === "object" ? getText(mediaAsset.mimeType) : "",
      previewUrl: getPreviewUrl(mediaAsset),
      slot: getText(item.slot) || "gallery-object",
      status: getText(item.status) || "draft",
    };
    const current = productMediaByKey.get(productKey) ?? [];
    current.push(mediaItem);
    productMediaByKey.set(productKey, current);
    productMediaByKey.set(productKey.toLowerCase(), current);
  }

  for (const item of (productDocumentsResult.docs as unknown) as GenericRecord[]) {
    const productKey = getText(item.productKey);
    if (!productKey) {
      continue;
    }
    const previewAsset = item.previewAsset as GenericRecord | string | number | null | undefined;

    const documentItem: OwnerProductDocumentItem = {
      fileName: getText(item.filename),
      fileSizeLabel: getFileSizeLabel(item.filesize),
      fileUrl: getFileUrl(item),
      href: `/admin/products?productKey=${encodeURIComponent(productKey)}&panel=media&focus=productDocument`,
      id: getRecordId(item.id),
      label: getText(item.documentTitle) || getText(item.publicLabel) || "Документ",
      previewUrl: getPreviewUrl(previewAsset) || getPreviewUrl(item),
      status: getText(item.status) || "draft",
      type: getText(item.documentType) || "document",
    };
    const current = productDocumentsByKey.get(productKey) ?? [];
    current.push(documentItem);
    productDocumentsByKey.set(productKey, current);
    productDocumentsByKey.set(productKey.toLowerCase(), current);
  }

  const hierarchy: OwnerProductHierarchy = {
    categories: ((categoriesResult.docs as unknown) as GenericRecord[]).map((category) => ({
      directionId: getRelationId(category.direction),
      id: getRecordId(category.id),
      label: getText(category.publicLabel) || getText(category.name) || "Категория",
      order: typeof category.order === "number" ? category.order : 0,
      slug: getText(category.slug),
      status: getText(category.status) || "draft",
    })),
    directions: ((directionsResult.docs as unknown) as GenericRecord[]).map((direction) => ({
      id: getRecordId(direction.id),
      label: getText(direction.publicLabel) || getText(direction.name) || "Направление",
      order: typeof direction.order === "number" ? direction.order : 0,
      slug: getText(direction.slug),
      status: getText(direction.status) || "draft",
    })),
    lines: ((linesResult.docs as unknown) as GenericRecord[]).map((line) => ({
      categoryId: getRelationId(line.category),
      directionId: getRelationId(line.direction),
      id: getRecordId(line.id),
      label: getText(line.publicLabel) || getText(line.name) || "Подкатегория",
      order: typeof line.order === "number" ? line.order : 0,
      slug: getText(line.slug),
      status: getText(line.status) || "draft",
    })),
  };

  const cards = ((productsResult.docs as unknown) as GenericRecord[]).map((product) => {
    const id = getRecordId(product.id);
    const formEntries = formsByProductId.get(id) ?? [];
    const seoEntries = seoByProductId.get(id) ?? [];
    const primaryForm = formEntries[0] ?? null;
    const previewMedia = getMediaPreview(product.heroAsset) ?? getMediaPreview(product.coverCardAsset);
    const hasForm = formEntries.length > 0;
    const hasHero = Boolean(getRelationId(product.heroAsset) || getRelationId(product.coverCardAsset));
    const hasCategory = Boolean(getRelationId(product.category));
    const productSeo = product.seo as GenericRecord | null | undefined;
    const hasProductSeo = Boolean(getText(productSeo?.title) && getText(productSeo?.description));
    const hasSeo = hasProductSeo || seoEntries.length > 0;
    const primarySeo = seoEntries[0] ?? null;
    const status = getText(product.status) || "draft";
    const productKey = getText(product.slug) || getText(product.internalCode) || id;
    const productMedia = [
      ...(productMediaByKey.get(productKey) ?? []),
      ...(productMediaByKey.get(productKey.toLowerCase()) ?? []),
      ...(productMediaByKey.get(id) ?? []),
    ].filter((item, index, list) => item.id && list.findIndex((entry) => entry.id === item.id) === index);
    const productDocuments = [
      ...(productDocumentsByKey.get(productKey) ?? []),
      ...(productDocumentsByKey.get(productKey.toLowerCase()) ?? []),
      ...(productDocumentsByKey.get(id) ?? []),
    ].filter((item, index, list) => item.id && list.findIndex((entry) => entry.id === item.id) === index);
    const card = {
      availabilityMode: getText(product.availabilityMode),
      coverCardAssetId: getRelationId(product.coverCardAsset),
      categoryId: getRelationId(product.category),
      categoryLabel: getRelationLabel(product.category) || "Категория не выбрана",
      checksHref: `/admin/products?product=${encodeURIComponent(id)}&panel=publish&focus=checks`,
      commandHref: `/api/internal/owner-product-commands?selectedProductId=${encodeURIComponent(id)}`,
      description: getText(product.shortDescription) || "Описание не заполнено.",
      directionId: getRelationId(product.direction),
      directionLabel: getRelationLabel(product.direction) || "Направление не выбрано",
      editorHref: `/admin/products?product=${encodeURIComponent(id)}`,
      formId: primaryForm ? getRecordId(primaryForm.id) : "",
      formHref: `/admin/products?product=${encodeURIComponent(id)}&panel=form`,
      formStatus: primaryForm ? getText(primaryForm.status) || "draft" : "",
      formTitle: primaryForm ? getText(primaryForm.title) || getText(primaryForm.shortLabel) : "",
      hasCategory,
      hasForm,
      hasHero,
      hasSeo,
      heroAssetId: getRelationId(product.heroAsset),
      id,
      issueLabels: [] as string[],
      label: getText(product.publicLabel) || getText(product.name) || "Без названия",
      lineId: getRelationId(product.line),
      lineLabel: getRelationLabel(product.line),
      launchStage: getText(product.launchStage),
      mediaHref: `/admin/products?product=${encodeURIComponent(id)}&panel=media`,
      locale: (getText(product.primaryLocale) || "en").toUpperCase(),
      publicHref: getProductPublicUrl(product),
      previewMedia,
      productDocuments,
      productKey,
      productMedia,
      seoDescription: getText(productSeo?.description) || getText(primarySeo?.metaDescription),
      seoEntryId: primarySeo ? getRecordId(primarySeo.id) : "",
      seoTitle: getText(productSeo?.title) || getText(primarySeo?.metaTitle),
      status,
      translationsHref: `/admin/products?product=${encodeURIComponent(id)}&panel=translations`,
    } satisfies OwnerProductCard;

    card.issueLabels = buildProductIssues(card);

    return card;
  });
  const selectedProductId = options.selectedProductId ?? cards[0]?.id ?? null;
  const selectedProduct = cards.find((card) => card.id === selectedProductId) ?? null;

  return {
    canRead: true,
    cards,
    commandEndpoint: "/api/internal/owner-product-commands",
    generatedAt: new Date().toISOString(),
    hierarchy,
    mediaOptions: ((mediaResult.docs as unknown) as GenericRecord[])
      .map((asset) => {
        const preview = getMediaPreview(asset);

        return {
          alt: preview?.alt ?? getText(asset.altText) ?? "Media asset",
          id: getRecordId(asset.id),
          label: getText(asset.assetTitle) || getText(asset.internalCode) || "Медиа",
          src: preview?.src ?? "",
          status: getText(asset.status) || "draft",
        };
      })
      .filter((asset) => asset.id),
    selectedProduct,
    selectedProductId,
    totals: {
      missingCategory: cards.filter((card) => !card.hasCategory).length,
      missingForm: cards.filter((card) => !card.hasForm).length,
      missingHero: cards.filter((card) => !card.hasHero).length,
      missingSeo: cards.filter((card) => !card.hasSeo).length,
      published: cards.filter((card) => card.status === "published").length,
      total: cards.length,
    },
  };
}
