import type { Payload, PayloadRequest } from "payload";

import { createAuditEvent } from "../payload/audit.ts";
import { getAdminUser } from "../payload/access.ts";
import {
  getMediaWorkspaceSnapshot,
  type MediaWorkspaceSnapshot,
} from "../payload/media-workspace.ts";
import { hasAdminRole, mediaOperatorRoles, type AdminRole } from "../payload/roles.ts";

const mediaCommandRoles = mediaOperatorRoles satisfies readonly AdminRole[];
const taskArtifact = "docs/tasks/MNT-ADMIN-BFF-006-media-upload-replace-usage-crop-api.md";

type GenericRecord = Record<string, unknown>;
type CropPreset = "desktop" | "mobile";

type OwnerMediaCommandAction =
  | "media.upload"
  | "media.batch-upload"
  | "media.replace"
  | "media.metadata.save"
  | "media.crop.save"
  | "media.assign"
  | "media.where-used"
  | "document.upload"
  | "document.replace";

export type OwnerMediaCommandInput = {
  action: OwnerMediaCommandAction;
  payload?: Record<string, unknown>;
};

export type OwnerMediaCommandResult = {
  action: OwnerMediaCommandAction;
  assetId: string | null;
  documentId?: string | null;
  ok: true;
  snapshot: MediaWorkspaceSnapshot;
  whereUsed?: NonNullable<MediaWorkspaceSnapshot["assetDetail"]>["linkedPages"];
};

function getText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function getBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
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

function normalizeInternalCode(prefix: string, value: unknown, fallback: string) {
  const explicit = getText(value);
  if (explicit) {
    return explicit;
  }

  return `${prefix}_${fallback
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}_${Date.now()}`;
}

function normalizeCropBox(value: unknown) {
  const source = value && typeof value === "object" ? (value as GenericRecord) : {};
  const box = {
    focalX: getNumber(source.focalX, 0.5),
    focalY: getNumber(source.focalY, 0.5),
    height: getNumber(source.height, 1),
    width: getNumber(source.width, 1),
    x: getNumber(source.x, 0),
    y: getNumber(source.y, 0),
  };

  for (const [key, nextValue] of Object.entries(box)) {
    if (nextValue < 0 || nextValue > 1) {
      throw createCommandError("invalid-input", `${key} must be between 0 and 1.`);
    }
  }

  if (box.width <= 0 || box.height <= 0) {
    throw createCommandError("invalid-input", "Crop width and height must be greater than 0.");
  }

  return box;
}

async function getAsset(payload: Payload, assetId: number | string) {
  const asset = (await payload.findByID({
    collection: "media-assets",
    depth: 0,
    id: assetId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!asset) {
    throw createCommandError("invalid-input", "Media asset was not found.");
  }

  return asset;
}

async function getDocument(payload: Payload, documentId: number | string) {
  const document = (await payload.findByID({
    collection: "product-documents",
    depth: 0,
    id: documentId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!document) {
    throw createCommandError("invalid-input", "Document was not found.");
  }

  return document;
}

function getRecordId(record: GenericRecord | null | undefined) {
  const id = record?.id;
  return typeof id === "number" || typeof id === "string" ? String(id) : "";
}

function getInputId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "number" || typeof id === "string" ? String(id) : "";
  }

  return "";
}

function getAssetTitle(asset: GenericRecord) {
  return getText(asset.assetTitle) || getText(asset.filename) || getText(asset.internalCode) || "Media";
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
    eventGroup: "media-governance",
    summary: input.summary,
    target: input.target,
  });
}

function buildAuditTarget(collection: string, record: GenericRecord) {
  return {
    collection,
    id: getRecordId(record),
    label: getAssetTitle(record),
  };
}

async function getUpdatedSnapshot(payload: Payload, req: PayloadRequest, selected: number | string | null) {
  return getMediaWorkspaceSnapshot(payload, req, {
    selected: selected == null ? null : String(selected),
  });
}

function getUploadData(input: GenericRecord, fallbackTitle: string) {
  return {
    approvalStatus: getText(input.approvalStatus, "pending"),
    assetRole: getText(input.assetRole, "owner upload"),
    assetTitle: getText(input.assetTitle, fallbackTitle),
    assetType: getText(input.assetType, "image"),
    audienceMode: getText(input.audienceMode, "public"),
    caption: getText(input.caption),
    creditLine: getText(input.creditLine),
    editorialSummary: getText(input.editorialSummary),
    internalCode: normalizeInternalCode("MAS_OWNER_UPLOAD", input.internalCode, fallbackTitle),
    primaryLocale: getText(input.primaryLocale, "en"),
    publicationReadiness: getText(input.publicationReadiness, "blocked"),
    referenceOnlyNotProductionAsset: getBoolean(input.referenceOnlyNotProductionAsset, false),
    rightsStatus: getText(input.rightsStatus, "generated-pending-review"),
    sourceCategory: getText(input.sourceCategory, "owner-provided"),
    sourceOfTruthArtifact: taskArtifact,
    status: getText(input.status, "draft"),
    translationPriority: getText(input.translationPriority, "normal"),
    usageRestrictions: getText(input.usageRestrictions),
    altText: getText(input.altText),
  };
}

async function uploadMedia(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const filePath = requireString(input.filePath, "filePath");
  const fallbackTitle = getText(input.fileName, "Owner uploaded media");
  const asset = (await payload.create({
    collection: "media-assets",
    data: getUploadData(input, fallbackTitle) as never,
    draft: false,
    filePath,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-media-upload",
    details: getText(input.fileName),
    summary: `Media uploaded: ${getAssetTitle(asset)}.`,
    target: buildAuditTarget("media-assets", asset),
  });

  return getRecordId(asset);
}

async function batchUploadMedia(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const files = asArray<GenericRecord>(input.files);
  if (files.length === 0) {
    throw createCommandError("invalid-input", "files are required.");
  }

  let lastId: string | null = null;
  for (const file of files) {
    lastId = await uploadMedia(payload, req, {
      ...input,
      ...file,
      files: undefined,
    });
  }

  return lastId;
}

async function replaceMedia(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const assetId = requireId(input.assetId ?? input.targetId, "assetId");
  const filePath = requireString(input.filePath, "filePath");
  const current = await getAsset(payload, assetId);
  const data: GenericRecord = {
    changeReason: getText(input.changeReason, "Owner-guided file replacement; existing usage links preserved."),
  };

  for (const field of ["altText", "assetTitle", "caption", "creditLine", "editorialSummary"] as const) {
    if (field in input) {
      data[field] = getText(input[field]);
    }
  }

  const updated = (await payload.update({
    collection: "media-assets",
    data: data as never,
    depth: 0,
    filePath,
    id: assetId,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-media-replace",
    details: `Previous file: ${getText(current.filename) || "unknown"}.`,
    summary: `Media file replaced while keeping usage links: ${getAssetTitle(updated)}.`,
    target: buildAuditTarget("media-assets", updated),
  });

  return String(assetId);
}

function getDocumentData(input: GenericRecord, fallbackTitle: string) {
  const productKey = getText(input.productKey);
  return {
    approvalStatus: getText(input.approvalStatus, "pending"),
    attachmentScope: getText(input.attachmentScope, "product-default"),
    documentTitle: getText(input.documentTitle, fallbackTitle),
    documentType: getText(input.documentType, "brochure"),
    downloadBehavior: getText(input.downloadBehavior, "direct-download"),
    internalCode: normalizeInternalCode("DOC_OWNER_UPLOAD", input.internalCode, fallbackTitle),
    order: getNumber(input.order, 10),
    overrideMode: getText(input.overrideMode, "inherit-parent"),
    primaryLocale: getText(input.primaryLocale, "en"),
    productKey,
    productLabelSnapshot: getText(input.productLabel, productKey || "Product"),
    rightsStatus: getText(input.rightsStatus, "generated-pending-review"),
    sourceCategory: getText(input.sourceCategory, "owner-provided"),
    sourceOfTruthArtifact: taskArtifact,
    status: getText(input.status, "draft"),
    surfaceTargets: asArray<string>(input.surfaceTargets).length > 0 ? asArray<string>(input.surfaceTargets) : ["pdp-downloads"],
    translationPriority: getText(input.translationPriority, "normal"),
    visibilityMode: getText(input.visibilityMode, "preview-only"),
  };
}

async function uploadDocument(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const filePath = requireString(input.filePath, "filePath");
  const fallbackTitle = getText(input.fileName, "Owner uploaded document");
  const document = (await payload.create({
    collection: "product-documents",
    data: getDocumentData(input, fallbackTitle) as never,
    draft: false,
    filePath,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-document-upload",
    details: getText(input.fileName),
    summary: `Product document uploaded: ${getText(document.documentTitle) || fallbackTitle}.`,
    target: { collection: "product-documents", id: getRecordId(document), label: getText(document.documentTitle) },
  });

  return getRecordId(document);
}

async function replaceDocument(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const documentId = requireId(input.documentId ?? input.targetId, "documentId");
  const filePath = requireString(input.filePath, "filePath");
  const data: GenericRecord = {};

  for (const field of ["documentTitle", "publicLabel", "versionLabel"] as const) {
    if (field in input) {
      data[field] = getText(input[field]);
    }
  }

  const updated = (await payload.update({
    collection: "product-documents",
    data: data as never,
    depth: 0,
    filePath,
    id: documentId,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-document-replace",
    details: getText(input.fileName),
    summary: `Product document file replaced: ${getText(updated.documentTitle) || documentId}.`,
    target: { collection: "product-documents", id: documentId, label: getText(updated.documentTitle) },
  });

  return String(documentId);
}

async function saveMetadata(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const assetId = requireId(input.assetId ?? input.targetId, "assetId");
  const data: GenericRecord = {};

  for (const field of ["altText", "assetTitle", "caption", "creditLine", "editorialSummary", "usageRestrictions"] as const) {
    if (field in input) {
      data[field] = getText(input[field]);
    }
  }

  if (Object.keys(data).length === 0) {
    throw createCommandError("no-op", "No media metadata was supplied.");
  }

  const updated = (await payload.update({
    collection: "media-assets",
    data: data as never,
    depth: 0,
    id: assetId,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-media-metadata-save",
    details: Object.keys(data).join(", "),
    summary: `Media metadata updated: ${getAssetTitle(updated)}.`,
    target: buildAuditTarget("media-assets", updated),
  });

  return String(assetId);
}

async function saveCrop(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const assetId = requireId(input.assetId ?? input.targetId, "assetId");
  const preset = getText(input.preset, "desktop") as CropPreset;
  if (preset !== "desktop" && preset !== "mobile") {
    throw createCommandError("invalid-input", "preset must be desktop or mobile.");
  }

  const current = await getAsset(payload, assetId);
  const currentCrop = (current.responsiveCrop && typeof current.responsiveCrop === "object"
    ? (current.responsiveCrop as GenericRecord)
    : {}) as GenericRecord;
  const nextCrop = {
    ...currentCrop,
    [preset]: normalizeCropBox(input.crop ?? input),
    notes: getText(input.notes, getText(currentCrop.notes)),
  };
  const updated = (await payload.update({
    collection: "media-assets",
    data: { responsiveCrop: nextCrop } as never,
    depth: 0,
    id: assetId,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-media-crop-save",
    details: `${preset}: ${JSON.stringify(nextCrop[preset])}`,
    summary: `Media ${preset} crop saved: ${getAssetTitle(updated)}.`,
    target: buildAuditTarget("media-assets", updated),
  });

  return String(assetId);
}

async function assignToPage(payload: Payload, req: PayloadRequest, input: GenericRecord, mediaId: number | string) {
  const pageId = requireId(input.pageId ?? input.ownerId, "pageId");
  const slot = getText(input.slot, "hero");
  const field = slot === "cover" ? "coverMedia" : slot === "seo" ? "seoOgImage" : "heroMedia";
  const page = (await payload.update({
    collection: "pages",
    data: { [field]: mediaId } as never,
    depth: 0,
    id: pageId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-media-assign-page",
    details: `${field}: ${mediaId}`,
    summary: `Media assigned to page ${field}: ${getText(page.title) || pageId}.`,
    target: { collection: "pages", id: pageId, label: getText(page.title) },
  });
}

async function assignDocumentToPage(payload: Payload, req: PayloadRequest, input: GenericRecord, documentId: number | string) {
  const pageId = requireId(input.pageId ?? input.ownerId, "pageId");
  const document = await getDocument(payload, documentId);
  const page = (await payload.findByID({
    collection: "pages",
    depth: 0,
    id: pageId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!page) {
    throw createCommandError("invalid-input", "Page was not found.");
  }

  const replaceDocumentId = getInputId(input.replaceDocumentId);
  const current = asArray<unknown>(page.relatedDocuments).filter((item) => {
    const id = getInputId(item);
    return id && id !== String(documentId) && (!replaceDocumentId || id !== replaceDocumentId);
  });
  const next = [...current, documentId];

  const updated = (await payload.update({
    collection: "pages",
    data: { relatedDocuments: next } as never,
    depth: 0,
    id: pageId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-document-assign-page",
    details: `relatedDocuments: ${documentId}`,
    summary: `Document assigned to page: ${getText(document.documentTitle) || documentId}.`,
    target: { collection: "pages", id: pageId, label: getText(updated.title) },
  });
}

async function assignToBlock(payload: Payload, req: PayloadRequest, input: GenericRecord, mediaId: number | string) {
  const blockId = requireId(input.blockId ?? input.ownerId, "blockId");
  const slot = getText(input.slot, "hero");
  const block = (await payload.findByID({
    collection: "page-sections",
    depth: 0,
    id: blockId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!block) {
    throw createCommandError("invalid-input", "Block was not found.");
  }

  const data =
    slot === "gallery"
      ? {
          galleryItems: [
            ...asArray<GenericRecord>(block.galleryItems),
            {
              asset: mediaId,
              caption: getText(input.caption),
            },
          ],
        }
      : {
          heroContent: {
            ...((block.heroContent ?? {}) as GenericRecord),
            heroMedia: mediaId,
          },
        };

  const updated = (await payload.update({
    collection: "page-sections",
    data: data as never,
    depth: 0,
    id: blockId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-media-assign-block",
    details: `${slot}: ${mediaId}`,
    summary: `Media assigned to block: ${getText(updated.previewLabel) || blockId}.`,
    target: { collection: "page-sections", id: blockId, label: getText(updated.previewLabel) },
  });
}

async function assignDocumentToBlock(payload: Payload, req: PayloadRequest, input: GenericRecord, documentId: number | string) {
  const blockId = requireId(input.blockId ?? input.ownerId, "blockId");
  const document = await getDocument(payload, documentId);
  const block = (await payload.findByID({
    collection: "page-sections",
    depth: 0,
    id: blockId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!block) {
    throw createCommandError("invalid-input", "Block was not found.");
  }

  const replaceDocumentId = getInputId(input.replaceDocumentId);
  const current = asArray<unknown>(((block.journalDownloadsContent ?? {}) as GenericRecord).documents).filter((item) => {
    const id = getInputId(item);
    return id && id !== String(documentId) && (!replaceDocumentId || id !== replaceDocumentId);
  });
  const next = [...current, documentId];

  const updated = (await payload.update({
    collection: "page-sections",
    data: {
      journalDownloadsContent: {
        ...((block.journalDownloadsContent ?? {}) as GenericRecord),
        documents: next,
      },
    } as never,
    depth: 0,
    id: blockId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-document-assign-block",
    details: `journalDownloadsContent.documents: ${documentId}`,
    summary: `Document assigned to block: ${getText(document.documentTitle) || documentId}.`,
    target: { collection: "page-sections", id: blockId, label: getText(updated.previewLabel) },
  });
}

async function assignToProduct(payload: Payload, req: PayloadRequest, input: GenericRecord, mediaId: number | string) {
  const productKey = requireString(input.productKey, "productKey");
  const slot = getText(input.slot, "hero");
  const placement = (await payload.create({
    collection: "product-media",
    data: {
      approvalStatus: getText(input.approvalStatus, "pending"),
      attachmentScope: "product-default",
      fallbackBehavior: "use-product-default",
      internalCode: normalizeInternalCode("PMM_OWNER_ASSIGN", input.internalCode, `${productKey}-${slot}`),
      mediaAsset: mediaId,
      order: getNumber(input.order, 10),
      overrideMode: "inherit-parent",
      ownerReviewRequired: false,
      primaryLocale: getText(input.primaryLocale, "en"),
      productKey,
      productLabelSnapshot: getText(input.productLabel, productKey),
      rightsStatus: getText(input.rightsStatus, "generated-pending-review"),
      slot,
      sourceCategory: getText(input.sourceCategory, "owner-provided"),
      status: getText(input.status, "draft"),
      surfaceTargets: asArray<string>(input.surfaceTargets).length > 0 ? asArray<string>(input.surfaceTargets) : ["pdp"],
      translationPriority: "normal",
      usageIntent: getText(input.usageIntent, "editorial-preview"),
      visibilityMode: getText(input.visibilityMode, "preview-only"),
    } as never,
    depth: 0,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-media-assign-product",
    details: `${slot}: ${mediaId}`,
    summary: `Media assigned to product: ${getText(placement.productLabelSnapshot) || productKey}.`,
    target: { collection: "product-media", id: getRecordId(placement), label: getText(placement.productLabelSnapshot) },
  });
}

async function assignDocumentToProduct(payload: Payload, req: PayloadRequest, input: GenericRecord, documentId: number | string) {
  const document = await getDocument(payload, documentId);
  const productKey = requireString(input.productKey, "productKey");
  const productLabel = getText(input.productLabel, productKey);
  const replaceDocumentId = getInputId(input.replaceDocumentId);
  const data: GenericRecord = {
    attachmentScope: getText(input.attachmentScope, "product-default"),
    productKey,
    productLabelSnapshot: productLabel,
    status: getText(input.status, getText(document.status, "draft")),
    surfaceTargets: asArray<string>(input.surfaceTargets).length > 0 ? asArray<string>(input.surfaceTargets) : ["pdp-downloads"],
    visibilityMode: getText(input.visibilityMode, getText(document.visibilityMode, "preview-only")),
  };

  if (replaceDocumentId && replaceDocumentId !== String(documentId)) {
    data.overrideMode = "replace-type";
    data.replacesProductDocument = replaceDocumentId;
  }

  const updated = (await payload.update({
    collection: "product-documents",
    data: data as never,
    depth: 0,
    id: documentId,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-document-assign-product",
    details: replaceDocumentId ? `productKey: ${productKey}; replaces: ${replaceDocumentId}` : `productKey: ${productKey}`,
    summary: `Document assigned to product: ${getText(updated.documentTitle) || documentId}.`,
    target: { collection: "product-documents", id: documentId, label: getText(updated.documentTitle) },
  });
}

async function assignMedia(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const targetType = getText(input.targetType);
  const slot = getText(input.slot);

  if (slot === "document" || input.documentId != null) {
    const documentId = requireId(input.documentId ?? input.mediaId ?? input.assetId, "documentId");

    if (targetType === "page") {
      await assignDocumentToPage(payload, req, input, documentId);
    } else if (targetType === "block") {
      await assignDocumentToBlock(payload, req, input, documentId);
    } else if (targetType === "product") {
      await assignDocumentToProduct(payload, req, input, documentId);
    } else {
      throw createCommandError("invalid-input", "Document assignment targetType must be page, block or product.");
    }

    return null;
  }

  const mediaId = requireId(input.mediaId ?? input.assetId, "mediaId");
  await getAsset(payload, mediaId);

  if (targetType === "page") {
    await assignToPage(payload, req, input, mediaId);
  } else if (targetType === "block") {
    await assignToBlock(payload, req, input, mediaId);
  } else if (targetType === "product") {
    await assignToProduct(payload, req, input, mediaId);
  } else {
    throw createCommandError("invalid-input", "targetType must be page, block or product.");
  }

  return String(mediaId);
}

async function getWhereUsed(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const assetId = requireId(input.assetId ?? input.targetId, "assetId");
  await getAsset(payload, assetId);
  return String(assetId);
}

export async function executeOwnerMediaCommand(
  payload: Payload,
  req: PayloadRequest,
  input: OwnerMediaCommandInput,
): Promise<OwnerMediaCommandResult> {
  requireCommandRole(req, mediaCommandRoles);
  validateCommandObject(input);
  validateCommandObject(input.payload ?? {}, "Command payload");

  const commandPayload = input.payload ?? {};
  let selectedId: string | null = null;
  let selectedDocumentId: string | null = null;

  switch (input.action) {
    case "document.upload":
      selectedDocumentId = await uploadDocument(payload, req, commandPayload);
      break;
    case "document.replace":
      selectedDocumentId = await replaceDocument(payload, req, commandPayload);
      break;
    case "media.upload":
      selectedId = await uploadMedia(payload, req, commandPayload);
      break;
    case "media.batch-upload":
      selectedId = await batchUploadMedia(payload, req, commandPayload);
      break;
    case "media.replace":
      selectedId = await replaceMedia(payload, req, commandPayload);
      break;
    case "media.metadata.save":
      selectedId = await saveMetadata(payload, req, commandPayload);
      break;
    case "media.crop.save":
      selectedId = await saveCrop(payload, req, commandPayload);
      break;
    case "media.assign":
      selectedId = await assignMedia(payload, req, commandPayload);
      break;
    case "media.where-used":
      selectedId = await getWhereUsed(payload, req, commandPayload);
      break;
    default:
      throw createCommandError("invalid-input", "Unsupported media command.");
  }

  const snapshot = await getUpdatedSnapshot(payload, req, selectedDocumentId ? `document:${selectedDocumentId}` : selectedId);
  return {
    action: input.action,
    assetId: selectedId,
    documentId: selectedDocumentId,
    ok: true,
    snapshot,
    ...(snapshot.assetDetail?.linkedPages ? { whereUsed: snapshot.assetDetail.linkedPages } : {}),
  };
}
