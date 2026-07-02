import type { Payload, PayloadRequest } from "payload";

import { createAuditEvent } from "../payload/audit.ts";
import { getAdminUser } from "../payload/access.ts";
import { getSiteWorkspaceSnapshot, type SiteWorkspaceSnapshot } from "../payload/site-workspace.ts";
import { hasAdminRole, type AdminRole } from "../payload/roles.ts";

const pageCommandRoles = ["owner", "admin", "content-editor", "developer"] as const satisfies readonly AdminRole[];

type GenericRecord = Record<string, unknown>;

type OwnerSiteCommandAction =
  | "page.create"
  | "page.duplicate"
  | "page.visibility.set"
  | "page.order"
  | "page.content.save"
  | "page.seo.save"
  | "block.add"
  | "block.content.save"
  | "block.visibility.set"
  | "block.delete"
  | "block.reorder"
  | "block.media.replace";

export type OwnerSiteCommandInput = {
  action: OwnerSiteCommandAction;
  payload?: Record<string, unknown>;
};

export type OwnerSiteCommandResult = {
  action: OwnerSiteCommandAction;
  ok: true;
  selectedPageId: string | null;
  siteWorkspace: SiteWorkspaceSnapshot;
};

export type OwnerSitePageTree = {
  generatedAt: string;
  groups: SiteWorkspaceSnapshot["groups"];
  pages: SiteWorkspaceSnapshot["pages"];
  selectedPage: SiteWorkspaceSnapshot["selectedPage"];
  selectedPageId: string | null;
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

  return id;
}

function requireString(value: unknown, label: string) {
  const text = getText(value);
  if (!text) {
    throw createCommandError("invalid-input", `${label} is required.`);
  }

  return text;
}

function normalizeSlug(value: unknown, fallback = "page") {
  const base = getText(value, fallback)
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || fallback;
}

function normalizePath(value: unknown, fallback: string) {
  const path = getText(value, fallback);
  return path.startsWith("/") ? path : `/${path}`;
}

function getRecordId(record: GenericRecord | null | undefined) {
  const id = record?.id;
  return typeof id === "number" || typeof id === "string" ? String(id) : "";
}

function getPageTitle(page: GenericRecord) {
  return getText(page.title) || getText(page.navigationLabel) || getText(page.slug) || "Страница";
}

function getPageSections(page: GenericRecord) {
  return asArray<GenericRecord>(page.sections);
}

function clonePageSectionRows(rows: GenericRecord[]) {
  return rows.map((row, index) => ({
    order: getSectionOrder(row, index),
    previewAnchor: getText(row.previewAnchor),
    section: getSectionId(row),
    visible: row.visible !== false,
  }));
}

function getSectionId(row: GenericRecord) {
  return getRelationId(row.section);
}

function getSectionOrder(row: GenericRecord, index: number) {
  return getNumber(row.order, index * 10 + 10);
}

async function getPage(payload: Payload, pageId: number | string) {
  const page = (await payload.findByID({
    collection: "pages",
    depth: 0,
    id: pageId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!page) {
    throw createCommandError("invalid-input", "Page was not found.");
  }

  return page;
}

async function getSection(payload: Payload, blockId: number | string) {
  const section = (await payload.findByID({
    collection: "page-sections",
    depth: 0,
    id: blockId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!section) {
    throw createCommandError("invalid-input", "Block was not found.");
  }

  return section;
}

async function getMedia(payload: Payload, mediaId: number | string) {
  const media = (await payload.findByID({
    collection: "media-assets",
    depth: 0,
    id: mediaId,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!media) {
    throw createCommandError("invalid-input", "Media asset was not found.");
  }

  return media;
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
    eventGroup?: "publication-workflow" | "settings";
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
    eventGroup: input.eventGroup ?? "publication-workflow",
    summary: input.summary,
    target: input.target,
  });
}

async function getUpdatedSnapshot(payload: Payload, req: PayloadRequest, selectedPageId: string | null) {
  return getSiteWorkspaceSnapshot(payload, req, {
    selected: selectedPageId,
  });
}

async function updatePageContent(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const pageId = requireId(input.pageId, "pageId");
  const page = await getPage(payload, pageId);
  const nextData: GenericRecord = {};

  for (const field of [
    "title",
    "eyebrow",
    "navigationLabel",
    "heroSummary",
    "introBody",
    "heroPrimaryCtaLabel",
    "heroPrimaryCtaTarget",
    "heroSecondaryCtaLabel",
    "heroSecondaryCtaTarget",
    "pagePurpose",
    "previewNotes",
  ]) {
    if (field in input) {
      nextData[field] = getText(input[field]);
    }
  }

  for (const field of ["heroMedia", "coverMedia"]) {
    if (field in input) {
      nextData[field] = input[field] == null || input[field] === "" ? null : requireId(input[field], field);
    }
  }

  if (Object.keys(nextData).length === 0) {
    throw createCommandError("no-op", "No page fields were supplied.");
  }

  const updated = (await payload.update({
    collection: "pages",
    data: nextData as never,
    depth: 0,
    id: pageId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-page-content-save",
    details: Object.keys(nextData).join(", "),
    summary: `Page content updated: ${getPageTitle(updated)}.`,
    target: buildAuditTarget("pages", updated, ["title", "routePath", "internalCode"]),
  });

  return getRecordId(page) || String(pageId);
}

async function setPageVisibility(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const pageId = requireId(input.pageId, "pageId");
  const visible = getBoolean(input.visible, true);
  const page = await getPage(payload, pageId);
  const status = visible ? getText(input.status, "review") : "draft";
  const updated = (await payload.update({
    collection: "pages",
    data: {
      showInFooter: visible && getBoolean(input.showInFooter, getBoolean(page.showInFooter, false)),
      showInHeader: visible && getBoolean(input.showInHeader, getBoolean(page.showInHeader, false)),
      status,
    } as never,
    depth: 0,
    id: pageId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: visible ? "owner-page-show" : "owner-page-hide",
    summary: `${visible ? "Page shown for review" : "Page hidden"}: ${getPageTitle(updated)}.`,
    target: buildAuditTarget("pages", updated, ["title", "routePath", "internalCode"]),
  });

  return String(pageId);
}

async function setPageOrder(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const pageId = requireId(input.pageId, "pageId");
  const navigationOrder = getNumber(input.navigationOrder, 100);
  const updated = (await payload.update({
    collection: "pages",
    data: { navigationOrder } as never,
    depth: 0,
    id: pageId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-page-order",
    summary: `Page order updated: ${getPageTitle(updated)}.`,
    target: buildAuditTarget("pages", updated, ["title", "routePath", "internalCode"]),
  });

  return String(pageId);
}

async function createPage(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const title = requireString(input.title, "title");
  const slug = normalizeSlug(input.slug, title);
  const pageFamily = getText(input.pageFamily, "hidden-preview");
  const routePath = normalizePath(input.routePath, pageFamily === "hidden-preview" ? `/preview/${slug}` : `/${slug}`);
  const status = getText(input.status, "draft");
  const created = (await payload.create({
    collection: "pages",
    data: {
      approvalStatus: getText(input.approvalStatus, "pending"),
      canonicalPath: normalizePath(input.canonicalPath, routePath),
      heroPrimaryCtaLabel: getText(input.heroPrimaryCtaLabel),
      heroPrimaryCtaTarget: getText(input.heroPrimaryCtaTarget),
      heroSummary: getText(input.heroSummary, "Draft page summary."),
      indexable: getBoolean(input.indexable, false),
      internalCode: getText(input.internalCode, `PAGE_OWNER_${slug.toUpperCase().replace(/-/g, "_")}`),
      introBody: getText(input.introBody),
      layoutMode: getText(input.layoutMode, "brand-editorial"),
      navigationOrder: getNumber(input.navigationOrder, 100),
      pageFamily,
      pagePurpose: getText(input.pagePurpose, "Owner-created page draft."),
      previewPath: normalizePath(input.previewPath, routePath),
      primaryLocale: getText(input.primaryLocale, "en"),
      routePath,
      sectionPlan: [],
      sections: [],
      seo: {
        description: getText(input.seoDescription, "Draft page metadata."),
        title,
      },
      showInFooter: getBoolean(input.showInFooter, false),
      showInHeader: getBoolean(input.showInHeader, false),
      slug,
      sourceOfTruthArtifact: getText(input.sourceOfTruthArtifact, "docs/tasks/MNT-ADMIN-BFF-004-page-and-block-command-api.md"),
      status,
      title,
      translationPriority: getText(input.translationPriority, "normal"),
    } as never,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-page-create",
    summary: `Page created: ${getPageTitle(created)}.`,
    target: buildAuditTarget("pages", created, ["title", "routePath", "internalCode"]),
  });

  return getRecordId(created);
}

async function duplicatePage(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const sourcePageId = requireId(input.sourcePageId ?? input.pageId, "sourcePageId");
  const source = await getPage(payload, sourcePageId);
  const title = getText(input.title, `${getPageTitle(source)} copy`);
  const slug = normalizeSlug(input.slug, `${getText(source.slug, "page")}-copy`);
  const routePath = normalizePath(input.routePath, `/preview/${slug}`);
  const duplicate = (await payload.create({
    collection: "pages",
    data: {
      approvalStatus: "pending",
      canonicalPath: routePath,
      coverMedia: getRelationId(source.coverMedia),
      heroMedia: getRelationId(source.heroMedia),
      heroPrimaryCtaLabel: getText(source.heroPrimaryCtaLabel),
      heroPrimaryCtaTarget: getText(source.heroPrimaryCtaTarget),
      heroSecondaryCtaLabel: getText(source.heroSecondaryCtaLabel),
      heroSecondaryCtaTarget: getText(source.heroSecondaryCtaTarget),
      heroSummary: getText(source.heroSummary),
      indexable: false,
      internalCode: getText(input.internalCode, `PAGE_OWNER_${slug.toUpperCase().replace(/-/g, "_")}`),
      introBody: getText(source.introBody),
      layoutMode: getText(source.layoutMode, "brand-editorial"),
      navigationOrder: getNumber(input.navigationOrder, getNumber(source.navigationOrder, 100) + 1),
      pageFamily: getText(input.pageFamily, "hidden-preview"),
      pagePurpose: getText(source.pagePurpose, "Owner duplicated page draft."),
      previewPath: routePath,
      primaryLocale: getText(source.primaryLocale, "en"),
      routePath,
      sectionPlan: source.sectionPlan,
      sections: clonePageSectionRows(getPageSections(source)),
      seo: {
        description: getText((source.seo as GenericRecord | undefined)?.description, "Draft page metadata."),
        title,
      },
      showInFooter: false,
      showInHeader: false,
      slug,
      sourceArtifactReferences: [
        {
          artifactPath: "docs/tasks/MNT-ADMIN-BFF-004-page-and-block-command-api.md",
          note: `Duplicated from page ${sourcePageId}.`,
        },
      ],
      sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-BFF-004-page-and-block-command-api.md",
      status: "draft",
      title,
      translationPriority: getText(source.translationPriority, "normal"),
    } as never,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-page-duplicate",
    details: `Source page: ${sourcePageId}`,
    summary: `Page duplicated: ${getPageTitle(duplicate)}.`,
    target: buildAuditTarget("pages", duplicate, ["title", "routePath", "internalCode"]),
  });

  return getRecordId(duplicate);
}

async function savePageSeo(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const pageId = requireId(input.pageId, "pageId");
  const page = await getPage(payload, pageId);
  const metaTitle = requireString(input.metaTitle, "metaTitle");
  const metaDescription = requireString(input.metaDescription, "metaDescription");
  const locale = getText(input.locale, getText(page.primaryLocale, "en"));
  const ownerPage = getRelationId(page.id) ?? pageId;

  await payload.update({
    collection: "pages",
    data: {
      indexable: input.indexable == null ? page.indexable !== false : getBoolean(input.indexable, true),
      seo: {
        description: metaDescription,
        title: metaTitle,
      },
      seoOgImage: input.seoOgImage == null || input.seoOgImage === "" ? null : requireId(input.seoOgImage, "seoOgImage"),
    } as never,
    depth: 0,
    id: pageId,
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
        { ownerType: { equals: "page" } },
        { ownerPage: { equals: ownerPage } },
        { locale: { equals: locale } },
      ],
    },
  })).docs[0] as unknown as GenericRecord | undefined;

  const seoData = {
    approvalStatus: getText(input.approvalStatus, "pending"),
    canonicalMode: getText(input.canonicalMode, "owner-default"),
    hreflangEnabled: getBoolean(input.hreflangEnabled, true),
    includeInSitemap: getBoolean(input.includeInSitemap, true),
    indexingMode: getText(input.indexingMode, "index,follow"),
    internalCode: getText(input.internalCode, `SEO_PAGE_${String(pageId).toUpperCase()}_${locale.toUpperCase()}`),
    locale,
    metaDescription,
    metaTitle,
    ownerPage,
    ownerType: "page",
    previewOnly: getBoolean(input.previewOnly, true),
    primaryLocale: getText(input.primaryLocale, locale),
    publicationReadiness: getText(input.publicationReadiness, "preview-only"),
    routePath: getText(page.routePath, "/"),
    socialCardStyle: getText(input.socialCardStyle, "summary_large_image"),
    sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-BFF-004-page-and-block-command-api.md",
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
    action: "owner-page-seo-save",
    summary: `SEO updated: ${getPageTitle(page)}.`,
    target: buildAuditTarget("seo-entries", seoEntry as unknown as GenericRecord, ["metaTitle", "ownerLabel", "internalCode"]),
  });

  return String(pageId);
}

async function addBlock(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const pageId = requireId(input.pageId, "pageId");
  const page = await getPage(payload, pageId);
  const pageFamily = getText(page.pageFamily, "hidden-preview");
  const sectionType = getText(input.sectionType, "overview");
  const label = getText(input.previewLabel, getText(input.title, "Новый блок"));
  const blockKey = normalizeSlug(input.sectionKey, `${getText(page.slug, "page")}-${sectionType}`);
  const status = getText(page.status) === "published" ? "published" : getText(input.status, "draft");
  const sectionData: GenericRecord = {
    body: getText(input.body),
    eyebrow: getText(input.eyebrow),
    internalCode: getText(input.internalCode, `SEC_OWNER_${blockKey.toUpperCase().replace(/-/g, "_")}`),
    lead: getText(input.lead),
    pageFamiliesAllowed: [pageFamily],
    previewLabel: label,
    previewNotes: getText(input.previewNotes),
    sectionKey: blockKey,
    sectionType,
    sourceOfTruthArtifact: "docs/tasks/MNT-ADMIN-BFF-004-page-and-block-command-api.md",
    status,
    title: getText(input.title, label),
    translationPriority: getText(input.translationPriority, "normal"),
  };

  if (sectionType === "hero") {
    sectionData.heroContent = {
      heroMedia: input.heroMedia == null || input.heroMedia === "" ? null : requireId(input.heroMedia, "heroMedia"),
      supportingLabel: getText(input.supportingLabel),
    };
  }

  if (sectionType === "cta") {
    sectionData.ctaContent = {
      primaryLabel: getText(input.primaryLabel, "Оставить заявку"),
      primaryTarget: getText(input.primaryTarget, "/contact"),
      secondaryLabel: getText(input.secondaryLabel),
      secondaryTarget: getText(input.secondaryTarget),
    };
  }

  const section = (await payload.create({
    collection: "page-sections",
    data: sectionData as never,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  const currentRows = getPageSections(page);
  const maxOrder = currentRows.reduce((max, row, index) => Math.max(max, getSectionOrder(row, index)), 0);
  const nextRows = [
    ...currentRows,
    {
      order: getNumber(input.order, maxOrder + 10),
      previewAnchor: getText(input.previewAnchor),
      section: getRelationId(section.id),
      visible: getBoolean(input.visible, true),
    },
  ];

  await payload.update({
    collection: "pages",
    data: { sections: nextRows } as never,
    depth: 0,
    id: pageId,
    overrideAccess: true,
    req,
  });

  await writeCommandAudit(req, {
    action: "owner-block-add",
    summary: `Block added to ${getPageTitle(page)}: ${label}.`,
    target: buildAuditTarget("page-sections", section, ["previewLabel", "title", "internalCode"]),
  });

  return String(pageId);
}

async function saveBlockContent(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const blockId = requireId(input.blockId, "blockId");
  const current = await getSection(payload, blockId);
  const sectionType = getText(current.sectionType);
  const data: GenericRecord = {};

  for (const field of ["title", "eyebrow", "lead", "body", "previewLabel", "previewNotes"]) {
    if (field in input) {
      data[field] = getText(input[field]);
    }
  }

  if (sectionType === "hero" && ("supportingLabel" in input || "heroMedia" in input)) {
    data.heroContent = {
      ...((current.heroContent ?? {}) as GenericRecord),
      ...(input.heroMedia == null || input.heroMedia === ""
        ? {}
        : { heroMedia: requireId(input.heroMedia, "heroMedia") }),
      ...(input.supportingLabel == null ? {} : { supportingLabel: getText(input.supportingLabel) }),
    };
  }

  if (sectionType === "cta") {
    const currentCta = (current.ctaContent ?? {}) as GenericRecord;
    data.ctaContent = {
      ...currentCta,
      primaryLabel: getText(input.primaryLabel, getText(currentCta.primaryLabel, "Оставить заявку")),
      primaryTarget: getText(input.primaryTarget, getText(currentCta.primaryTarget, "/contact")),
      secondaryLabel: getText(input.secondaryLabel, getText(currentCta.secondaryLabel)),
      secondaryTarget: getText(input.secondaryTarget, getText(currentCta.secondaryTarget)),
    };
  }

  if (Object.keys(data).length === 0) {
    throw createCommandError("no-op", "No block fields were supplied.");
  }

  const updated = (await payload.update({
    collection: "page-sections",
    data: data as never,
    depth: 0,
    id: blockId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-block-content-save",
    details: Object.keys(data).join(", "),
    summary: `Block content updated: ${getText(updated.previewLabel, String(blockId))}.`,
    target: buildAuditTarget("page-sections", updated, ["previewLabel", "title", "internalCode"]),
  });

  return getText(input.pageId) || null;
}

async function updatePageSections(
  payload: Payload,
  req: PayloadRequest,
  input: GenericRecord,
  updater: (rows: GenericRecord[], page: GenericRecord) => GenericRecord[],
  audit: { action: string; summary: string },
) {
  const pageId = requireId(input.pageId, "pageId");
  const page = await getPage(payload, pageId);
  const rows = getPageSections(page);
  const nextRows = updater(rows, page);

  const updated = (await payload.update({
    collection: "pages",
    data: { sections: nextRows } as never,
    depth: 0,
    id: pageId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: audit.action,
    summary: `${audit.summary}: ${getPageTitle(updated)}.`,
    target: buildAuditTarget("pages", updated, ["title", "routePath", "internalCode"]),
  });

  return String(pageId);
}

async function setBlockVisibility(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const blockId = requireId(input.blockId, "blockId");
  const visible = getBoolean(input.visible, true);

  return updatePageSections(
    payload,
    req,
    input,
    (rows) => {
      if (!rows.some((row) => String(getSectionId(row)) === String(blockId))) {
        throw createCommandError("invalid-input", "Block is not attached to this page.");
      }

      return rows.map((row) =>
        String(getSectionId(row)) === String(blockId)
          ? {
              ...row,
              visible,
            }
          : row,
      );
    },
    {
      action: visible ? "owner-block-show" : "owner-block-hide",
      summary: visible ? "Block shown" : "Block hidden",
    },
  );
}

async function deleteBlockPlacement(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const blockId = requireId(input.blockId, "blockId");

  return updatePageSections(
    payload,
    req,
    input,
    (rows) => {
      const nextRows = rows.filter((row) => String(getSectionId(row)) !== String(blockId));
      if (nextRows.length === rows.length) {
        throw createCommandError("invalid-input", "Block is not attached to this page.");
      }

      return nextRows;
    },
    {
      action: "owner-block-remove",
      summary: "Block removed from page",
    },
  );
}

async function reorderBlocks(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const orderedIds = asArray<unknown>(input.orderedBlockIds).map((entry) => String(requireId(entry, "orderedBlockIds")));

  if (orderedIds.length === 0) {
    throw createCommandError("invalid-input", "orderedBlockIds is required.");
  }

  return updatePageSections(
    payload,
    req,
    input,
    (rows) => {
      const byId = new Map(rows.map((row) => [String(getSectionId(row)), row]));
      const missing = orderedIds.filter((id) => !byId.has(id));
      if (missing.length > 0) {
        throw createCommandError("invalid-input", `Unknown block id in order: ${missing.join(", ")}.`);
      }

      const orderedRows = orderedIds.map((id, index) => ({
        ...byId.get(id)!,
        order: index * 10 + 10,
      }));
      const untouchedRows = rows
        .filter((row) => !orderedIds.includes(String(getSectionId(row))))
        .map((row, index) => ({
          ...row,
          order: orderedRows.length * 10 + index * 10 + 10,
        }));

      return [...orderedRows, ...untouchedRows];
    },
    {
      action: "owner-block-reorder",
      summary: "Block order updated",
    },
  );
}

async function replaceBlockMedia(payload: Payload, req: PayloadRequest, input: GenericRecord) {
  const blockId = requireId(input.blockId, "blockId");
  const mediaId = requireId(input.mediaId, "mediaId");
  const slot = getText(input.slot, "hero");
  const media = await getMedia(payload, mediaId);
  const section = await getSection(payload, blockId);
  const data: GenericRecord = {};

  if (slot === "hero") {
    data.heroContent = {
      ...((section.heroContent ?? {}) as GenericRecord),
      heroMedia: mediaId,
    };
  } else if (slot.startsWith("gallery")) {
    const index = getNumber(input.galleryIndex, 0);
    const items = asArray<GenericRecord>(section.galleryItems);
    const nextItems = items.length > 0 ? [...items] : [{ caption: "" }];
    nextItems[index] = {
      ...(nextItems[index] ?? {}),
      asset: mediaId,
      caption: getText(input.caption, getText(nextItems[index]?.caption)),
    };
    data.galleryItems = nextItems;
  } else {
    throw createCommandError("invalid-input", "Unsupported media slot.");
  }

  const altText = getText(input.altText);
  if (altText) {
    await payload.update({
      collection: "media-assets",
      data: { altText } as never,
      depth: 0,
      id: mediaId,
      overrideAccess: true,
      req,
    });
  }

  const updated = (await payload.update({
    collection: "page-sections",
    data: data as never,
    depth: 0,
    id: blockId,
    overrideAccess: true,
    req,
  })) as unknown as GenericRecord;

  await writeCommandAudit(req, {
    action: "owner-block-media-replace",
    details: `Slot: ${slot}. Media: ${getText(media.assetTitle, String(mediaId))}.`,
    summary: `Block media replaced: ${getText(updated.previewLabel, String(blockId))}.`,
    target: buildAuditTarget("page-sections", updated, ["previewLabel", "title", "internalCode"]),
  });

  return getText(input.pageId) || null;
}

async function executeCommandPayload(payload: Payload, req: PayloadRequest, input: OwnerSiteCommandInput) {
  const commandPayload = input.payload ?? {};

  switch (input.action) {
    case "page.content.save":
      return updatePageContent(payload, req, commandPayload);
    case "page.visibility.set":
      return setPageVisibility(payload, req, commandPayload);
    case "page.order":
      return setPageOrder(payload, req, commandPayload);
    case "page.create":
      return createPage(payload, req, commandPayload);
    case "page.duplicate":
      return duplicatePage(payload, req, commandPayload);
    case "page.seo.save":
      return savePageSeo(payload, req, commandPayload);
    case "block.add":
      return addBlock(payload, req, commandPayload);
    case "block.content.save":
      return saveBlockContent(payload, req, commandPayload);
    case "block.visibility.set":
      return setBlockVisibility(payload, req, commandPayload);
    case "block.delete":
      return deleteBlockPlacement(payload, req, commandPayload);
    case "block.reorder":
      return reorderBlocks(payload, req, commandPayload);
    case "block.media.replace":
      return replaceBlockMedia(payload, req, commandPayload);
    default:
      throw createCommandError("invalid-input", "Unknown owner site command.");
  }
}

export async function getOwnerSitePageTree(
  payload: Payload,
  req: PayloadRequest,
  input: { selected?: string | null } = {},
): Promise<OwnerSitePageTree> {
  requireCommandRole(req, pageCommandRoles);
  const siteWorkspace = await getUpdatedSnapshot(payload, req, input.selected ?? null);

  return {
    generatedAt: siteWorkspace.generatedAt,
    groups: siteWorkspace.groups,
    pages: siteWorkspace.pages,
    selectedPage: siteWorkspace.selectedPage,
    selectedPageId: siteWorkspace.selectedPageId,
  };
}

export async function executeOwnerSiteCommand(
  payload: Payload,
  req: PayloadRequest,
  input: OwnerSiteCommandInput,
): Promise<OwnerSiteCommandResult> {
  requireCommandRole(req, pageCommandRoles);
  validateCommandObject(input, "Owner site command");
  validateCommandObject(input.payload ?? {}, "Owner site command payload");

  if (!input.action) {
    throw createCommandError("invalid-input", "action is required.");
  }

  const selectedPageId = await executeCommandPayload(payload, req, input);
  const siteWorkspace = await getUpdatedSnapshot(payload, req, selectedPageId);

  return {
    action: input.action,
    ok: true,
    selectedPageId: siteWorkspace.selectedPageId,
    siteWorkspace,
  };
}
