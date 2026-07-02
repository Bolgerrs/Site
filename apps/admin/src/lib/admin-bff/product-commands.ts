import type { Payload, PayloadRequest } from "payload";

import { createAuditEvent } from "../payload/audit.ts";
import { getAdminUser } from "../payload/access.ts";
import { getOwnerProductsSnapshot, type OwnerProductsSnapshot } from "../payload/owner-products.ts";
import { getProductPublicUrl } from "../payload/product-editor.ts";
import { hasAdminRole, type AdminRole } from "../payload/roles.ts";

const productCommandRoles = ["owner", "admin", "content-editor", "developer"] as const satisfies readonly AdminRole[];
const taskArtifact = "docs/tasks/MNT-ADMIN-BFF-005-product-and-category-command-api.md";

type GenericRecord = Record<string, unknown>;

type OwnerProductCommandAction =
  | "product.create"
  | "product.duplicate"
  | "product.core.save"
  | "product.category.assign"
  | "product.media.save"
  | "product.form.save"
  | "product.seo.save"
  | "product.visibility.set"
  | "product.order"
  | "category.create"
  | "category.content.save"
  | "category.visibility.set"
  | "category.order"
  | "line.create";

export type OwnerProductCommandInput = {
  action: OwnerProductCommandAction;
  payload?: Record<string, unknown>;
};

export type OwnerProductCommandResult = {
  action: OwnerProductCommandAction;
  ok: true;
  products: OwnerProductsSnapshot;
  selectedProductId: string | null;
};

function getText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getRecordId(record: GenericRecord | null | undefined) {
  const id = record?.id;
  return typeof id === "number" || typeof id === "string" ? String(id) : "";
}

function createCommandError(code: "forbidden" | "invalid-input" | "no-op" | "unauthorized", message?: string) {
  return new Error(message ?? code);
}

function validateCommandObject(value: unknown, label = "Command input"): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createCommandError("invalid-input", `${label} must be an object.`);
  }
}

function requireCommandRole(req: PayloadRequest, roles: readonly AdminRole[]) {
  const user = getAdminUser(req.user);

  if (!user?.role) {
    throw createCommandError("unauthorized");
  }

  if (!hasAdminRole(user, roles)) {
    throw createCommandError("forbidden");
  }

  return user;
}

function getRelationId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return null;
}

function requireId(value: unknown, label: string) {
  const id = getRelationId(value);

  if (id == null || String(id).trim() === "") {
    throw createCommandError("invalid-input", `${label} is required.`);
  }

  if (typeof id === "string" && /^\d+$/.test(id)) {
    return Number(id);
  }

  return id;
}

function requireString(value: unknown, label: string) {
  const text = getText(value);

  if (!text) {
    throw createCommandError("invalid-input", `${label} is required.`);
  }

  return text;
}

function normalizeSlug(value: unknown, fallback = "draft") {
  const base = getText(value, fallback)
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || fallback;
}

function normalizeInternalCode(prefix: string, value: unknown, fallback: string) {
  return getText(value, `${prefix}_${normalizeSlug(fallback).replace(/-/g, "_").toUpperCase()}`);
}

function buildAuditTarget(collection: string, record: GenericRecord, labelFields: string[]) {
  const id = getRecordId(record);
  const label = labelFields.map((field) => getText(record[field])).find(Boolean) || id;

  return {
    collection,
    id,
    label,
  };
}

async function writeCommandAudit(
  req: PayloadRequest,
  input: {
    action: string;
    details?: string;
    summary: string;
    target: {
      collection: string;
      id: number | string;
      label?: string | null;
    };
  },
) {
  await createAuditEvent(req, {
    action: input.action,
    details: input.details ?? null,
    eventGroup: "publication-workflow",
    summary: input.summary,
    target: input.target,
  });
}

async function getProduct(payload: Payload, productId: number | string) {
  const product = (await payload.findByID({
    collection: "products",
    depth: 0,
    id: productId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!product) {
    throw createCommandError("invalid-input", "Product was not found.");
  }

  return product;
}

async function getCategory(payload: Payload, categoryId: number | string) {
  const category = (await payload.findByID({
    collection: "product-categories",
    depth: 0,
    id: categoryId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!category) {
    throw createCommandError("invalid-input", "Category was not found.");
  }

  return category;
}

async function getDirection(payload: Payload, directionId: number | string) {
  const direction = (await payload.findByID({
    collection: "product-directions",
    depth: 0,
    id: directionId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!direction) {
    throw createCommandError("invalid-input", "Direction was not found.");
  }

  return direction;
}

async function getNextOrder(payload: Payload, collection: "product-categories" | "product-lines" | "products") {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    sort: "-order",
  });
  const first = result.docs[0] as unknown as GenericRecord | undefined;

  return getNumber(first?.order, 0) + 10;
}

async function getUpdatedProductState(payload: Payload, req: PayloadRequest, selectedProductId: string | null) {
  return getOwnerProductsSnapshot(payload, req, {
    selectedProductId,
  });
}

function createDefaultFormFields() {
  return [
    {
      fieldKey: "name",
      fieldType: "text",
      label: "Name",
      leadMappingKey: "contactName",
      required: true,
      width: "half",
    },
    {
      fieldKey: "email",
      fieldType: "email",
      label: "Email",
      leadMappingKey: "email",
      required: true,
      width: "half",
    },
    {
      fieldKey: "message",
      fieldType: "textarea",
      label: "Project notes",
      leadMappingKey: "message",
      required: false,
      width: "full",
    },
  ];
}

async function createProduct(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const name = requireString(input.name ?? input.publicLabel, "name");
  const publicLabel = getText(input.publicLabel, name);
  const directionId = requireId(input.directionId ?? input.direction, "directionId");
  await getDirection(payload, directionId);
  const categoryId = input.categoryId || input.category ? requireId(input.categoryId ?? input.category, "categoryId") : null;
  const lineId = input.lineId || input.line ? requireId(input.lineId ?? input.line, "lineId") : null;
  const slug = normalizeSlug(input.slug, publicLabel);
  const created = (await payload.create({
    collection: "products",
    data: {
      availabilityMode: getText(input.availabilityMode, "on-request"),
      category: categoryId,
      direction: directionId,
      indexable: getBoolean(input.indexable, false),
      internalCode: normalizeInternalCode("PRD_OWNER", input.internalCode, `${slug}-${Date.now()}`),
      launchStage: getText(input.launchStage, "planned"),
      line: lineId,
      name,
      order: getNumber(input.order, await getNextOrder(payload, "products")),
      ownerReviewRequired: getBoolean(input.ownerReviewRequired, false),
      primaryInquiryType: getText(input.primaryInquiryType, "product-inquiry"),
      primaryLocale: getText(input.primaryLocale, "en"),
      productKind: getText(input.productKind, "physical-product"),
      publicLabel,
      routeSegment: normalizeSlug(input.routeSegment, slug),
      shortDescription: getText(input.shortDescription, "Draft product created from the owner product workspace."),
      slug,
      sourceOfTruthArtifact: taskArtifact,
      status: getText(input.status, "draft"),
      translationPriority: getText(input.translationPriority, "normal"),
      variantReadiness: {
        blockedPublicClaims: 0,
        publishedVariants: 0,
        readinessState: "no-variants",
        reviewVariants: 0,
        totalVariants: 0,
        validatedPublicClaims: 0,
      },
      visibilityInFilters: getBoolean(input.visibilityInFilters, true),
      visibilityInNavigation: getBoolean(input.visibilityInNavigation, true),
    } as never,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-product-create",
    summary: `Product draft created: ${getText(created.publicLabel) || getText(created.name)}.`,
    target: buildAuditTarget("products", created, ["publicLabel", "name", "internalCode"]),
  });

  return getRecordId(created);
}

async function duplicateProduct(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const sourceProductId = requireId(input.sourceProductId ?? input.productId, "sourceProductId");
  const source = await getProduct(payload, sourceProductId);
  const label = getText(input.publicLabel, `${getText(source.publicLabel) || getText(source.name)} copy`);
  const slug = normalizeSlug(input.slug, `${getText(source.slug, "product")}-copy-${Date.now()}`);
  const duplicate = (await payload.create({
    collection: "products",
    data: {
      availabilityMode: getText(source.availabilityMode, "on-request"),
      category: getRelationId(source.category),
      coverCardAsset: getRelationId(source.coverCardAsset),
      direction: requireId(source.direction, "source.direction"),
      heroAsset: getRelationId(source.heroAsset),
      indexable: false,
      internalCode: normalizeInternalCode("PRD_OWNER_COPY", input.internalCode, slug),
      launchStage: getText(source.launchStage, "planned"),
      line: getRelationId(source.line),
      longDescription: getText(source.longDescription),
      name: getText(input.name, label),
      order: getNumber(input.order, await getNextOrder(payload, "products")),
      ownerReviewRequired: true,
      positioningStatement: getText(source.positioningStatement),
      primaryInquiryType: getText(source.primaryInquiryType, "product-inquiry"),
      primaryLocale: getText(source.primaryLocale, "en"),
      productKind: getText(source.productKind, "physical-product"),
      publicLabel: label,
      routeSegment: normalizeSlug(input.routeSegment, slug),
      shortDescription: getText(source.shortDescription, "Draft product copy."),
      slug,
      sourceArtifactReferences: [
        {
          artifactPath: taskArtifact,
          note: `Duplicated from product ${sourceProductId}.`,
        },
      ],
      sourceOfTruthArtifact: taskArtifact,
      status: "draft",
      subtitle: getText(source.subtitle),
      tagline: getText(source.tagline),
      translationPriority: getText(source.translationPriority, "normal"),
      variantReadiness: source.variantReadiness ?? {
        blockedPublicClaims: 0,
        publishedVariants: 0,
        readinessState: "no-variants",
        reviewVariants: 0,
        totalVariants: 0,
        validatedPublicClaims: 0,
      },
      visibilityInFilters: getBoolean(source.visibilityInFilters, true),
      visibilityInNavigation: false,
    } as never,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-product-duplicate",
    details: `Source product: ${sourceProductId}`,
    summary: `Product duplicated: ${getText(duplicate.publicLabel) || getText(duplicate.name)}.`,
    target: buildAuditTarget("products", duplicate, ["publicLabel", "name", "internalCode"]),
  });

  return getRecordId(duplicate);
}

async function saveProductCore(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const productId = requireId(input.productId, "productId");
  await getProduct(payload, productId);
  const nextData: GenericRecord = {};

  for (const field of [
    "name",
    "publicLabel",
    "navigationLabel",
    "subtitle",
    "tagline",
    "shortDescription",
    "longDescription",
    "positioningStatement",
    "availabilityMode",
    "launchStage",
    "productKind",
    "primaryInquiryType",
    "leadRoutingNotes",
    "namingDecisionNotes",
    "publicationNotes",
  ]) {
    if (field in input) {
      nextData[field] = getText(input[field]);
    }
  }

  for (const field of [
    "requiresQualification",
    "ownerReviewRequired",
    "visibilityInFilters",
    "visibilityInNavigation",
    "isFeatured",
    "indexable",
  ]) {
    if (field in input) {
      nextData[field] = getBoolean(input[field], false);
    }
  }

  if ("slug" in input) {
    nextData.slug = normalizeSlug(input.slug, getText(input.publicLabel, "product"));
    nextData.routeSegment = normalizeSlug(input.routeSegment, nextData.slug as string);
  }

  if (Object.keys(nextData).length === 0) {
    throw createCommandError("no-op", "No product fields were supplied.");
  }

  const updated = (await payload.update({
    collection: "products",
    data: nextData as never,
    depth: 0,
    id: productId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-product-core-save",
    details: Object.keys(nextData).join(", "),
    summary: `Product updated: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("products", updated, ["publicLabel", "name", "internalCode"]),
  });

  return String(productId);
}

async function assignProductCategory(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const productId = requireId(input.productId, "productId");
  const product = await getProduct(payload, productId);
  const directionId = input.directionId || input.direction ? requireId(input.directionId ?? input.direction, "directionId") : getRelationId(product.direction);
  const categoryId = input.categoryId || input.category ? requireId(input.categoryId ?? input.category, "categoryId") : null;
  const lineId = input.lineId || input.line ? requireId(input.lineId ?? input.line, "lineId") : null;
  const updated = (await payload.update({
    collection: "products",
    data: {
      category: categoryId,
      direction: directionId,
      line: lineId,
    } as never,
    depth: 0,
    id: productId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-product-category-assign",
    summary: `Product hierarchy updated: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("products", updated, ["publicLabel", "name", "internalCode"]),
  });

  return String(productId);
}

async function saveProductMedia(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const productId = requireId(input.productId, "productId");
  const nextData: GenericRecord = {};

  if ("heroAsset" in input || "heroAssetId" in input) {
    nextData.heroAsset = input.heroAsset == null && input.heroAssetId == null
      ? null
      : requireId(input.heroAsset ?? input.heroAssetId, "heroAsset");
  }

  if ("coverCardAsset" in input || "coverCardAssetId" in input) {
    nextData.coverCardAsset = input.coverCardAsset == null && input.coverCardAssetId == null
      ? null
      : requireId(input.coverCardAsset ?? input.coverCardAssetId, "coverCardAsset");
  }

  if (Object.keys(nextData).length === 0) {
    throw createCommandError("no-op", "No product media fields were supplied.");
  }

  const updated = (await payload.update({
    collection: "products",
    data: nextData as never,
    depth: 0,
    id: productId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-product-media-save",
    details: Object.keys(nextData).join(", "),
    summary: `Product media updated: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("products", updated, ["publicLabel", "name", "internalCode"]),
  });

  return String(productId);
}

async function saveProductForm(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const productId = requireId(input.productId, "productId");
  const product = await getProduct(payload, productId);
  const locale = getText(input.locale, getText(product.primaryLocale, "en"));
  const formId = getRelationId(input.formId);
  const title = getText(input.title, `${getText(product.publicLabel) || getText(product.name)} inquiry`);
  const fields = Array.isArray(input.fields) && input.fields.length > 0 ? input.fields : createDefaultFormFields();
  const formData = {
    allowedVariantModes: getText(input.allowedVariantModes, "product-only"),
    approvalStatus: getText(input.approvalStatus, "pending"),
    capturesDocumentContext: false,
    consentProfile: getText(input.consentProfile, "global-policy"),
    consentText: getText(input.consentText, "I agree that Montelar may process this request and contact me about the project."),
    description: getText(input.description, "Private product inquiry form."),
    documentContextMode: "none",
    fields,
    fieldGroups: [
      {
        groupKey: "contact",
        groupType: "contact",
        title: "Contact",
      },
      {
        groupKey: "project",
        groupType: "project",
        title: "Project",
      },
    ],
    formMode: getText(input.formMode, getText(product.primaryInquiryType, "product-inquiry")),
    internalCode: normalizeInternalCode("FORM_OWNER", input.internalCode, `${getText(product.slug, "product")}-${locale}`),
    isPrimaryForLocale: getBoolean(input.isPrimaryForLocale, true),
    layoutMode: getText(input.layoutMode, "single-column"),
    locale,
    notificationEmails: [],
    primaryLocale: locale,
    privacyNoticeLinkMode: "global-policy",
    product: productId,
    shortLabel: getText(input.shortLabel, "Inquiry"),
    slug: normalizeSlug(input.slug, `${getText(product.slug, "product")}-${locale}-inquiry`),
    sourceOfTruthArtifact: taskArtifact,
    status: getText(input.status, "draft"),
    submissionChannel: getText(input.submissionChannel, "email-only-temp"),
    submitLabel: getText(input.submitLabel, "Send request"),
    successMessage: getText(input.successMessage, "Thank you. Montelar will review the request and contact you."),
    successRedirectMode: getText(input.successRedirectMode, "inline-message"),
    successTitle: getText(input.successTitle, "Request received"),
    title,
  };
  const saved = formId
    ? await payload.update({
        collection: "productInquiryForms",
        data: formData as never,
        depth: 0,
        id: formId,
        overrideAccess: true,
        req,
      })
    : await payload.create({
        collection: "productInquiryForms",
        data: formData as never,
        depth: 0,
        overrideAccess: true,
        req,
      });

  await writeCommandAudit(req, {
    action: formId ? "owner-product-form-save" : "owner-product-form-create",
    summary: `Product inquiry form saved: ${title}.`,
    target: buildAuditTarget("productInquiryForms", saved as unknown as GenericRecord, ["title", "internalCode", "slug"]),
  });

  return String(productId);
}

async function saveProductSeo(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const productId = requireId(input.productId, "productId");
  const product = await getProduct(payload, productId);
  const locale = getText(input.locale, getText(product.primaryLocale, "en"));
  const metaTitle = requireString(input.metaTitle, "metaTitle");
  const metaDescription = requireString(input.metaDescription, "metaDescription");

  await payload.update({
    collection: "products",
    data: {
      indexable: getBoolean(input.indexable, true),
      seo: {
        description: metaDescription,
        title: metaTitle,
      },
    } as never,
    depth: 0,
    id: productId,
    overrideAccess: true,
    req,
  });

  const existing = (await payload.find({
    collection: "seo-entries",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { ownerType: { equals: "product" } },
        { ownerProduct: { equals: productId } },
        { locale: { equals: locale } },
      ],
    },
  })).docs[0] as unknown as GenericRecord | undefined;

  const seoData = {
    approvalStatus: getText(input.approvalStatus, "pending"),
    canonicalMode: getText(input.canonicalMode, "owner-default"),
    hreflangEnabled: getBoolean(input.hreflangEnabled, true),
    includeInSitemap: getBoolean(input.includeInSitemap, true),
    indexingMode: getBoolean(input.indexable, true) ? "index,follow" : "noindex,follow",
    internalCode: normalizeInternalCode("SEO_PRODUCT_OWNER", input.internalCode, `${getText(product.slug, String(productId))}-${locale}`),
    locale,
    metaDescription,
    metaTitle,
    ownerLabel: getText(product.publicLabel) || getText(product.name),
    ownerProduct: productId,
    ownerType: "product",
    previewOnly: getBoolean(input.previewOnly, true),
    primaryLocale: locale,
    publicationReadiness: getText(input.publicationReadiness, "preview-only"),
    routePath: getText(product.canonicalPath, `/products/${getText(product.slug, String(productId))}`),
    socialCardStyle: getText(input.socialCardStyle, "summary_large_image"),
    sourceOfTruthArtifact: taskArtifact,
    status: getText(input.status, "review"),
    translationPriority: getText(input.translationPriority, "normal"),
  };
  const seoEntry = existing?.id
    ? await payload.update({
        collection: "seo-entries",
        data: seoData as never,
        depth: 0,
        id: existing.id as number | string,
        overrideAccess: true,
        req,
      })
    : await payload.create({
        collection: "seo-entries",
        data: seoData as never,
        depth: 0,
        overrideAccess: true,
        req,
      });

  await writeCommandAudit(req, {
    action: "owner-product-seo-save",
    summary: `Product SEO updated: ${getText(product.publicLabel) || getText(product.name)}.`,
    target: buildAuditTarget("seo-entries", seoEntry as unknown as GenericRecord, ["metaTitle", "ownerLabel", "internalCode"]),
  });

  return String(productId);
}

async function setProductVisibility(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const productId = requireId(input.productId, "productId");
  const visible = getBoolean(input.visible, true);
  const product = await getProduct(payload, productId);
  const updated = (await payload.update({
    collection: "products",
    data: {
      status: visible ? getText(input.status, getText(product.status, "review")) : "draft",
      visibilityInFilters: visible,
      visibilityInNavigation: visible,
    } as never,
    depth: 0,
    id: productId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: visible ? "owner-product-show" : "owner-product-hide",
    summary: `${visible ? "Product made visible" : "Product hidden"}: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("products", updated, ["publicLabel", "name", "internalCode"]),
  });

  return String(productId);
}

async function setProductOrder(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const productId = requireId(input.productId, "productId");
  const updated = (await payload.update({
    collection: "products",
    data: {
      order: getNumber(input.order, 100),
    } as never,
    depth: 0,
    id: productId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-product-order",
    summary: `Product order updated: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("products", updated, ["publicLabel", "name", "internalCode"]),
  });

  return String(productId);
}

async function createCategory(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const name = requireString(input.name ?? input.publicLabel, "name");
  const publicLabel = getText(input.publicLabel, name);
  const directionId = requireId(input.directionId ?? input.direction, "directionId");
  await getDirection(payload, directionId);
  const slug = normalizeSlug(input.slug, publicLabel);
  const created = (await payload.create({
    collection: "product-categories",
    data: {
      categoryKind: getText(input.categoryKind, "hardware-family"),
      defaultInquiryType: getText(input.defaultInquiryType, "product-inquiry"),
      direction: directionId,
      indexable: getBoolean(input.indexable, false),
      internalCode: normalizeInternalCode("CAT_OWNER", input.internalCode, `${slug}-${Date.now()}`),
      name,
      order: getNumber(input.order, await getNextOrder(payload, "product-categories")),
      primaryLocale: getText(input.primaryLocale, "en"),
      productLineMode: getText(input.productLineMode, "optional"),
      publicLabel,
      routeSegment: normalizeSlug(input.routeSegment, slug),
      shortDescription: getText(input.shortDescription, "Draft category created from the owner product workspace."),
      slug,
      sourceOfTruthArtifact: taskArtifact,
      status: getText(input.status, "draft"),
      translationPriority: getText(input.translationPriority, "normal"),
      visibilityInNavigation: getBoolean(input.visibilityInNavigation, true),
    } as never,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-category-create",
    summary: `Category created: ${getText(created.publicLabel) || getText(created.name)}.`,
    target: buildAuditTarget("product-categories", created, ["publicLabel", "name", "internalCode"]),
  });

  return null;
}

async function saveCategoryContent(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const categoryId = requireId(input.categoryId, "categoryId");
  await getCategory(payload, categoryId);
  const nextData: GenericRecord = {};

  for (const field of [
    "name",
    "publicLabel",
    "navigationLabel",
    "shortDescription",
    "description",
    "positioningStatement",
    "categoryKind",
    "productLineMode",
    "defaultInquiryType",
    "defaultLeadRoutingNotes",
    "namingDecisionNotes",
    "publicationNotes",
  ]) {
    if (field in input) {
      nextData[field] = getText(input[field]);
    }
  }

  if ("slug" in input) {
    nextData.slug = normalizeSlug(input.slug, getText(input.publicLabel, "category"));
    nextData.routeSegment = normalizeSlug(input.routeSegment, nextData.slug as string);
  }

  if (Object.keys(nextData).length === 0) {
    throw createCommandError("no-op", "No category fields were supplied.");
  }

  const updated = (await payload.update({
    collection: "product-categories",
    data: nextData as never,
    depth: 0,
    id: categoryId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-category-content-save",
    details: Object.keys(nextData).join(", "),
    summary: `Category updated: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("product-categories", updated, ["publicLabel", "name", "internalCode"]),
  });

  return null;
}

async function setCategoryVisibility(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const categoryId = requireId(input.categoryId, "categoryId");
  const visible = getBoolean(input.visible, true);
  const updated = (await payload.update({
    collection: "product-categories",
    data: {
      status: visible ? getText(input.status, "review") : "draft",
      visibilityInNavigation: visible,
    } as never,
    depth: 0,
    id: categoryId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: visible ? "owner-category-show" : "owner-category-hide",
    summary: `${visible ? "Category shown for review" : "Category hidden"}: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("product-categories", updated, ["publicLabel", "name", "internalCode"]),
  });

  return null;
}

async function setCategoryOrder(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const categoryId = requireId(input.categoryId, "categoryId");
  const updated = (await payload.update({
    collection: "product-categories",
    data: {
      order: getNumber(input.order, 100),
    } as never,
    depth: 0,
    id: categoryId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-category-order",
    summary: `Category order updated: ${getText(updated.publicLabel) || getText(updated.name)}.`,
    target: buildAuditTarget("product-categories", updated, ["publicLabel", "name", "internalCode"]),
  });

  return null;
}

async function createLine(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const name = requireString(input.name ?? input.publicLabel, "name");
  const publicLabel = getText(input.publicLabel, name);
  const directionId = requireId(input.directionId ?? input.direction, "directionId");
  await getDirection(payload, directionId);
  const categoryId = input.categoryId || input.category ? requireId(input.categoryId ?? input.category, "categoryId") : null;
  const slug = normalizeSlug(input.slug, publicLabel);
  const created = (await payload.create({
    collection: "product-lines",
    data: {
      category: categoryId,
      defaultInquiryType: getText(input.defaultInquiryType, "product-inquiry"),
      direction: directionId,
      indexable: getBoolean(input.indexable, false),
      internalCode: normalizeInternalCode("LINE_OWNER", input.internalCode, `${slug}-${Date.now()}`),
      lineKind: getText(input.lineKind, "family"),
      lineNarrativeMode: getText(input.lineNarrativeMode, "catalog"),
      name,
      order: getNumber(input.order, await getNextOrder(payload, "product-lines")),
      primaryLocale: getText(input.primaryLocale, "en"),
      productCountHint: 0,
      publicLabel,
      routeSegment: normalizeSlug(input.routeSegment, slug),
      shortDescription: getText(input.shortDescription, "Draft product line created from the owner product workspace."),
      slug,
      sourceOfTruthArtifact: taskArtifact,
      status: getText(input.status, "draft"),
      translationPriority: getText(input.translationPriority, "normal"),
      visibilityInNavigation: getBoolean(input.visibilityInNavigation, true),
    } as never,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-product-line-create",
    summary: `Product line created: ${getText(created.publicLabel) || getText(created.name)}.`,
    target: buildAuditTarget("product-lines", created, ["publicLabel", "name", "internalCode"]),
  });

  return null;
}

export async function getOwnerProductCommandState(
  payload: Payload,
  req: PayloadRequest,
  options: { selectedProductId?: string | null } = {},
) {
  requireCommandRole(req, productCommandRoles);
  return getUpdatedProductState(payload, req, options.selectedProductId ?? null);
}

export async function executeOwnerProductCommand(
  payload: Payload,
  req: PayloadRequest,
  input: OwnerProductCommandInput,
): Promise<OwnerProductCommandResult> {
  requireCommandRole(req, productCommandRoles);
  validateCommandObject(input);

  if (!input.action) {
    throw createCommandError("invalid-input", "Command action is required.");
  }

  const commandPayload = input.payload ?? {};
  validateCommandObject(commandPayload, "Command payload");

  let selectedProductId: string | null = null;

  switch (input.action) {
    case "product.create":
      selectedProductId = await createProduct(payload, req, commandPayload);
      break;
    case "product.duplicate":
      selectedProductId = await duplicateProduct(payload, req, commandPayload);
      break;
    case "product.core.save":
      selectedProductId = await saveProductCore(payload, req, commandPayload);
      break;
    case "product.category.assign":
      selectedProductId = await assignProductCategory(payload, req, commandPayload);
      break;
    case "product.media.save":
      selectedProductId = await saveProductMedia(payload, req, commandPayload);
      break;
    case "product.form.save":
      selectedProductId = await saveProductForm(payload, req, commandPayload);
      break;
    case "product.seo.save":
      selectedProductId = await saveProductSeo(payload, req, commandPayload);
      break;
    case "product.visibility.set":
      selectedProductId = await setProductVisibility(payload, req, commandPayload);
      break;
    case "product.order":
      selectedProductId = await setProductOrder(payload, req, commandPayload);
      break;
    case "category.create":
      selectedProductId = await createCategory(payload, req, commandPayload);
      break;
    case "category.content.save":
      selectedProductId = await saveCategoryContent(payload, req, commandPayload);
      break;
    case "category.visibility.set":
      selectedProductId = await setCategoryVisibility(payload, req, commandPayload);
      break;
    case "category.order":
      selectedProductId = await setCategoryOrder(payload, req, commandPayload);
      break;
    case "line.create":
      selectedProductId = await createLine(payload, req, commandPayload);
      break;
    default:
      throw createCommandError("invalid-input", "Unsupported product command action.");
  }

  return {
    action: input.action,
    ok: true,
    products: await getUpdatedProductState(payload, req, selectedProductId),
    selectedProductId,
  };
}

export function createOwnerProductPreviewSummary(product: GenericRecord) {
  return {
    label: getText(product.publicLabel) || getText(product.name),
    publicHref: getProductPublicUrl(product),
  };
}
