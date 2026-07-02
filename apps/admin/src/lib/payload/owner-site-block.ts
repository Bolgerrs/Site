import type { Payload, PayloadRequest } from "payload";

import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";

import { getAdminUser } from "./access.ts";
import { hasAdminRole, type AdminRole } from "./roles.ts";

const siteBlockReadRoles = [
  "owner",
  "admin",
  "content-editor",
  "translator",
  "developer",
] as const satisfies readonly AdminRole[];

const siteBlockUpdateRoles = [
  "owner",
  "admin",
  "content-editor",
  "developer",
] as const satisfies readonly AdminRole[];

type GenericRecord = Record<string, unknown>;

export type OwnerSiteBlockFields = {
  body: string;
  eyebrow: string;
  lead: string;
  previewLabel: string;
  previewNotes: string;
  primaryLabel: string;
  primaryTarget: string;
  secondaryLabel: string;
  secondaryTarget: string;
  supportingLabel: string;
  title: string;
};

export type OwnerSiteBlockSnapshot = {
  canUpdate: boolean;
  canToggleVisibility: boolean;
  fields: OwnerSiteBlockFields;
  id: string;
  mediaHref: string;
  mediaSummary: string;
  pageEditorHref: string | null;
  pageRoutePath: string | null;
  rawEditorHref: string;
  sectionType: string;
  status: string;
  updatedAt: string;
  visibleOnPage: boolean | null;
};

export type OwnerSiteBlockUpdateInput = {
  fields: OwnerSiteBlockFields;
  pageId?: string;
  visibleOnPage?: boolean;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRecordId(value: unknown) {
  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
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

function assertReadAccess(req: PayloadRequest) {
  const user = getAdminUser(req.user);

  if (!hasAdminRole(user, siteBlockReadRoles)) {
    throw new Error("forbidden");
  }

  return user;
}

function assertUpdateAccess(req: PayloadRequest) {
  const user = getAdminUser(req.user);

  if (!hasAdminRole(user, siteBlockUpdateRoles)) {
    throw new Error("forbidden");
  }

  return user;
}

function extractFields(record: GenericRecord): OwnerSiteBlockFields {
  const ctaContent = (record.ctaContent ?? {}) as GenericRecord;
  const heroContent = (record.heroContent ?? {}) as GenericRecord;

  return {
    body: getText(record.body),
    eyebrow: getText(record.eyebrow),
    lead: getText(record.lead),
    previewLabel: getText(record.previewLabel),
    previewNotes: getText(record.previewNotes),
    primaryLabel: getText(ctaContent.primaryLabel),
    primaryTarget: getText(ctaContent.primaryTarget),
    secondaryLabel: getText(ctaContent.secondaryLabel),
    secondaryTarget: getText(ctaContent.secondaryTarget),
    supportingLabel: getText(heroContent.supportingLabel),
    title: getText(record.title),
  };
}

function normalizeFields(input: OwnerSiteBlockFields): OwnerSiteBlockFields {
  return {
    body: getText(input.body),
    eyebrow: getText(input.eyebrow),
    lead: getText(input.lead),
    previewLabel: getText(input.previewLabel),
    previewNotes: getText(input.previewNotes),
    primaryLabel: getText(input.primaryLabel),
    primaryTarget: getText(input.primaryTarget),
    secondaryLabel: getText(input.secondaryLabel),
    secondaryTarget: getText(input.secondaryTarget),
    supportingLabel: getText(input.supportingLabel),
    title: getText(input.title),
  };
}

function getMediaSummary(record: GenericRecord) {
  const heroMediaCount = getRelationId(((record.heroContent ?? {}) as GenericRecord).heroMedia) != null ? 1 : 0;
  const galleryCount = asArray<GenericRecord>(record.galleryItems).filter(
    (item) => getRelationId(item.asset) != null,
  ).length;
  const documentCount = asArray<unknown>(((record.journalDownloadsContent ?? {}) as GenericRecord).documents).filter(
    (item) => getRelationId(item) != null,
  ).length;

  const parts: string[] = [];

  if (heroMediaCount > 0) {
    parts.push("главное изображение");
  }
  if (galleryCount > 0) {
    parts.push(`${galleryCount} в галерее`);
  }
  if (documentCount > 0) {
    parts.push(`${documentCount} PDF/документов`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Медиа пока не привязаны";
}

async function getPagePlacement(
  payload: Payload,
  pageId: string | undefined,
  blockId: string,
) {
  if (!pageId) {
    return null;
  }

  const page = (await payload.findByID({
    collection: "pages",
    depth: 0,
    id: pageId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!page) {
    return null;
  }

  const sections = asArray<GenericRecord>(page.sections);
  const index = sections.findIndex((item) => getRecordId(item.section) === blockId);

  if (index < 0) {
    return null;
  }

  return {
    index,
    page,
    row: sections[index]!,
    sections,
  };
}

function toSnapshot(
  record: GenericRecord,
  canUpdate: boolean,
  options: {
    pageEditorHref?: string | null;
    pageRoutePath?: string | null;
    visibleOnPage?: boolean | null;
  } = {},
): OwnerSiteBlockSnapshot {
  return {
    canUpdate,
    canToggleVisibility: canUpdate && options.visibleOnPage !== null && typeof options.visibleOnPage !== "undefined",
    fields: extractFields(record),
    id: getRecordId(record.id),
    mediaHref: "/admin/media",
    mediaSummary: getMediaSummary(record),
    pageEditorHref: options.pageEditorHref ?? null,
    pageRoutePath: options.pageRoutePath ?? null,
    rawEditorHref: buildAdvancedCollectionHref("page-sections", {
      id: getRecordId(record.id),
      label: "Расширенный режим блока",
    }),
    sectionType: getText(record.sectionType),
    status: getText(record.status) || "draft",
    updatedAt: getText(record.updatedAt),
    visibleOnPage: options.visibleOnPage ?? null,
  };
}

export async function getOwnerSiteBlockSnapshot(
  payload: Payload,
  req: PayloadRequest,
  input: { id: string; pageId?: string },
): Promise<OwnerSiteBlockSnapshot> {
  assertReadAccess(req);

  const record = (await payload.findByID({
    collection: "page-sections",
    depth: 0,
    id: input.id,
    overrideAccess: true,
  })) as unknown as GenericRecord;

  const placement = await getPagePlacement(payload, input.pageId, input.id);

  return toSnapshot(record, hasAdminRole(getAdminUser(req.user), siteBlockUpdateRoles), {
    pageEditorHref: placement ? "/admin/site" : null,
    pageRoutePath: placement ? getText(placement.page.routePath) || null : null,
    visibleOnPage: placement ? placement.row.visible !== false : null,
  });
}

export async function updateOwnerSiteBlock(
  payload: Payload,
  req: PayloadRequest,
  input: { fields: OwnerSiteBlockFields; id: string; pageId?: string; visibleOnPage?: boolean },
): Promise<OwnerSiteBlockSnapshot> {
  assertUpdateAccess(req);

  const current = (await payload.findByID({
    collection: "page-sections",
    depth: 0,
    id: input.id,
    overrideAccess: true,
  })) as unknown as GenericRecord;
  const fields = normalizeFields(input.fields);
  const sectionType = getText(current.sectionType);
  const currentCta = ((current.ctaContent ?? {}) as GenericRecord) || {};
  const currentHero = ((current.heroContent ?? {}) as GenericRecord) || {};

  const data: GenericRecord = {
    body: fields.body,
    eyebrow: fields.eyebrow,
    lead: fields.lead,
    previewLabel: fields.previewLabel || fields.title || getText(current.previewLabel),
    previewNotes: fields.previewNotes,
    title: fields.title,
  };

  if (sectionType === "hero") {
    data.heroContent = {
      ...currentHero,
      supportingLabel: fields.supportingLabel,
    };
  }

  if (sectionType === "cta") {
    data.ctaContent = {
      ...currentCta,
      primaryLabel: fields.primaryLabel || getText(currentCta.primaryLabel),
      primaryTarget: fields.primaryTarget || getText(currentCta.primaryTarget),
      secondaryLabel: fields.secondaryLabel,
      secondaryTarget: fields.secondaryTarget,
    };
  }

  const updated = (await payload.update({
    collection: "page-sections",
    data,
    depth: 0,
    id: input.id,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  let placement = await getPagePlacement(payload, input.pageId, input.id);

  if (placement && typeof input.visibleOnPage === "boolean" && placement.row.visible !== input.visibleOnPage) {
    const placementIndex = placement.index;
    const nextSections = placement.sections.map((row, index) =>
      index === placementIndex
        ? {
            ...row,
            visible: input.visibleOnPage,
          }
        : row,
    );

    await payload.update({
      collection: "pages",
      data: {
        sections: nextSections,
      },
      depth: 0,
      id: getRecordId(placement.page.id),
      overrideAccess: true,
      req,
    });

    placement = await getPagePlacement(payload, input.pageId, input.id);
  }

  return toSnapshot(updated, true, {
    pageEditorHref: placement ? "/admin/site" : null,
    pageRoutePath: placement ? getText(placement.page.routePath) || null : null,
    visibleOnPage: placement ? placement.row.visible !== false : null,
  });
}
