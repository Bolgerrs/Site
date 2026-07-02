import type { Payload, PayloadRequest } from "payload";

import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";

import { getAdminUser } from "./access.ts";
import { launchLocaleSeeds } from "./locales.ts";
import { hasAdminRole, type AdminRole } from "./roles.ts";

const translationWorkspaceReadRoles = [
  "owner",
  "admin",
  "content-editor",
  "translator",
  "developer",
] as const satisfies readonly AdminRole[];
const translationWorkspaceUpdateRoles = [
  "owner",
  "admin",
  "translator",
  "developer",
] as const satisfies readonly AdminRole[];
const translationWorkspacePublishRoles = ["owner", "admin"] as const satisfies readonly AdminRole[];
const translationWorkspaceAssignRoles = ["owner", "admin", "developer"] as const satisfies readonly AdminRole[];
const workflowStatusValues = [
  "draft",
  "in-progress",
  "review",
  "approved",
  "published",
  "archived",
  "blocked",
] as const;
const workflowStageValues = [
  "queued",
  "machine-draft",
  "human-edit",
  "brand-review",
  "seo-review",
  "legal-review",
  "ready-for-publish",
] as const;
const publishReadinessValues = ["not-ready", "ready", "ready-with-fallback", "blocked"] as const;

type TranslationRecord = Record<string, unknown>;
type GenericRecord = Record<string, unknown>;
type LocaleRecord = Record<string, unknown>;
type AdminUserRecord = Record<string, unknown>;
type TranslationWorkspaceOwnerCollection =
  | "pages"
  | "page-sections"
  | "product-directions"
  | "product-categories"
  | "product-lines"
  | "products"
  | "product-variants"
  | "product-inquiry-forms"
  | "product-documents"
  | "media-assets"
  | "seo-entries";

export type TranslationWorkspaceFilterId =
  | "all"
  | "missing"
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "stale";

export type TranslationWorkspaceUserOption = {
  id: number | string;
  label: string;
  role: string;
};

export type TranslationWorkspaceContentValueType = "json" | "long-text" | "text";

export type TranslationWorkspaceContentSurface =
  | "body"
  | "button"
  | "document"
  | "form"
  | "media"
  | "route"
  | "seo"
  | "title";

export type TranslationWorkspaceContentField = {
  editorHref: string;
  fieldKey: string;
  isLayoutSensitive: boolean;
  label: string;
  longTextLimit: number | null;
  riskLabel: string;
  sourceValue: string;
  surface: TranslationWorkspaceContentSurface;
  targetValue: string;
  valueType: TranslationWorkspaceContentValueType;
};

export type TranslationWorkspaceLocaleSummary = {
  approved: number;
  code: string;
  draft: number;
  englishLabel: string;
  isPublicEnabled: boolean;
  missing: number;
  nativeLabel: string;
  published: number;
  review: number;
  stale: number;
  total: number;
};

export type TranslationWorkspaceFilterSummary = {
  count: number;
  description: string;
  id: TranslationWorkspaceFilterId;
  label: string;
};

export type TranslationWorkspaceCard = {
  changeReason: string;
  contentFields: TranslationWorkspaceContentField[];
  fieldScope: string;
  filterMatch: TranslationWorkspaceFilterId;
  id: string;
  internalNotes: string;
  isMissing: boolean;
  ownerCollection: TranslationWorkspaceOwnerCollection;
  ownerCollectionLabel: string;
  ownerHref: string;
  ownerKey: string;
  ownerLabel: string;
  ownerRoutePath: string;
  previewPath: string;
  publishBlockedReasons: string[];
  publishReadiness: string;
  publicRouteHint: string;
  recordId: number | string | null;
  reviewerAssigneeId: number | string | null;
  reviewerAssigneeLabel: string;
  seoWorkspaceHref: string;
  sourceLocale: string;
  sourceRevisionKey: string;
  sourceTitleSnapshot: string;
  staleReason: string;
  staleSourceState: string;
  status: string;
  structuredFieldCount: number;
  targetLocale: string;
  targetRoutePath: string;
  targetSlug: string;
  targetTitle: string;
  translatorAssigneeId: number | string | null;
  translatorAssigneeLabel: string;
  warningLabels: string[];
  workflowStage: string;
};

export type TranslationWorkspaceSnapshot = {
  activeFilter: TranslationWorkspaceFilterId;
  activeLocale: string;
  activeSearch: string;
  canAssign: boolean;
  canCreate: boolean;
  canPublish: boolean;
  canUpdate: boolean;
  cards: TranslationWorkspaceCard[];
  emptyState: string;
  filters: TranslationWorkspaceFilterSummary[];
  generatedAt: string;
  localeSummaries: TranslationWorkspaceLocaleSummary[];
  reviewerOptions: TranslationWorkspaceUserOption[];
  totalVisibleCards: number;
  translatorOptions: TranslationWorkspaceUserOption[];
};

export type TranslationWorkspaceUpdateInput = {
  changeReason?: unknown;
  internalNotes?: unknown;
  publishReadiness?: unknown;
  reviewerAssigneeId?: unknown;
  status?: unknown;
  translatorAssigneeId?: unknown;
  workflowStage?: unknown;
};

export type TranslationWorkspaceContentUpdateInput = {
  fields?: unknown;
  localizedExcerpt?: unknown;
  previewNotes?: unknown;
  targetRoutePath?: unknown;
  targetSlug?: unknown;
  targetTitle?: unknown;
};

export type TranslationWorkspaceCreateInput = {
  ownerCollection?: unknown;
  ownerKey?: unknown;
  targetLocale?: unknown;
};

type TranslationOwnerDefinition = {
  collection: Parameters<Payload["find"]>[0]["collection"];
  defaultFieldScope: string;
  label: string;
  ownerCollection: TranslationWorkspaceOwnerCollection;
  routeLocalizationRequired: boolean;
};

const translationOwnerDefinitions: readonly TranslationOwnerDefinition[] = [
  {
    collection: "pages",
    defaultFieldScope: "full-record",
    label: "Pages",
    ownerCollection: "pages",
    routeLocalizationRequired: true,
  },
  {
    collection: "page-sections",
    defaultFieldScope: "editorial-copy",
    label: "Page sections",
    ownerCollection: "page-sections",
    routeLocalizationRequired: false,
  },
  {
    collection: "product-directions",
    defaultFieldScope: "full-record",
    label: "Directions",
    ownerCollection: "product-directions",
    routeLocalizationRequired: true,
  },
  {
    collection: "product-categories",
    defaultFieldScope: "full-record",
    label: "Categories",
    ownerCollection: "product-categories",
    routeLocalizationRequired: true,
  },
  {
    collection: "product-lines",
    defaultFieldScope: "full-record",
    label: "Product lines",
    ownerCollection: "product-lines",
    routeLocalizationRequired: true,
  },
  {
    collection: "products",
    defaultFieldScope: "full-record",
    label: "Products",
    ownerCollection: "products",
    routeLocalizationRequired: true,
  },
  {
    collection: "product-variants",
    defaultFieldScope: "editorial-copy",
    label: "Variants",
    ownerCollection: "product-variants",
    routeLocalizationRequired: false,
  },
  {
    collection: "productInquiryForms",
    defaultFieldScope: "form-copy",
    label: "Forms",
    ownerCollection: "product-inquiry-forms",
    routeLocalizationRequired: false,
  },
  {
    collection: "product-documents",
    defaultFieldScope: "document-labels",
    label: "Documents",
    ownerCollection: "product-documents",
    routeLocalizationRequired: false,
  },
  {
    collection: "media-assets",
    defaultFieldScope: "media-metadata",
    label: "Media",
    ownerCollection: "media-assets",
    routeLocalizationRequired: false,
  },
  {
    collection: "seo-entries",
    defaultFieldScope: "route-and-seo",
    label: "SEO",
    ownerCollection: "seo-entries",
    routeLocalizationRequired: true,
  },
] as const;

const ownerDefinitionByKey = new Map(
  translationOwnerDefinitions.map((entry) => [entry.ownerCollection, entry] as const),
);

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function normalizeLocale(value: string) {
  return launchLocaleSeeds.some((entry) => entry.code === value) ? value : "all";
}

function normalizeFilter(value: string | null | undefined): TranslationWorkspaceFilterId {
  return value &&
    ["all", "missing", "draft", "review", "approved", "published", "stale"].includes(value)
    ? (value as TranslationWorkspaceFilterId)
    : "all";
}

function normalizeStatus(value: unknown, fallback: string) {
  const next = getText(value);
  return workflowStatusValues.includes(next as (typeof workflowStatusValues)[number]) ? next : fallback;
}

function normalizeWorkflowStage(value: unknown, fallback: string) {
  const next = getText(value);
  return workflowStageValues.includes(next as (typeof workflowStageValues)[number]) ? next : fallback;
}

function normalizePublishReadiness(value: unknown, fallback: string) {
  const next = getText(value);
  return publishReadinessValues.includes(next as (typeof publishReadinessValues)[number]) ? next : fallback;
}

function buildActor(req: PayloadRequest) {
  const user = getAdminUser(req.user) as { email?: unknown; fullName?: unknown; role?: unknown } | null;
  return getText(user?.fullName) || getText(user?.email) || getText(user?.role) || "translation-operator";
}

export function buildTranslationWorkspaceHref(
  input: {
    filter?: TranslationWorkspaceFilterId;
    locale?: string;
    ownerCollection?: TranslationWorkspaceOwnerCollection;
    ownerKey?: string;
    search?: string;
  } = {},
) {
  const params = new URLSearchParams();

  if (input.filter && input.filter !== "all") {
    params.set("filter", input.filter);
  }

  if (input.locale && input.locale !== "all") {
    params.set("locale", input.locale);
  }

  if (input.ownerCollection) {
    params.set("ownerCollection", input.ownerCollection);
  }

  if (input.ownerKey) {
    params.set("ownerKey", input.ownerKey);
  }

  if (input.search) {
    params.set("q", input.search);
  }

  const query = params.toString();
  return query ? `/admin/translations?${query}` : "/admin/translations";
}

function canReadTranslationsWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), translationWorkspaceReadRoles);
}

function canUpdateTranslationsWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), translationWorkspaceUpdateRoles);
}

function canPublishTranslationsWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), translationWorkspacePublishRoles);
}

function canAssignTranslationsWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), translationWorkspaceAssignRoles);
}

function getLocaleCode(value: unknown, localeById: Map<string, LocaleRecord>) {
  if (value && typeof value === "object" && "code" in value) {
    const code = getText((value as { code?: unknown }).code);
    if (code) {
      return code;
    }
  }

  const relationId = getRelationId(value);
  if (relationId === null) {
    return "";
  }

  return getText(localeById.get(String(relationId))?.code);
}

function getUserLabel(value: unknown, usersById: Map<string, AdminUserRecord>) {
  if (value && typeof value === "object") {
    const fullName = getText((value as { fullName?: unknown }).fullName);
    const role = getText((value as { role?: unknown }).role);
    if (fullName) {
      return role ? `${fullName} · ${role}` : fullName;
    }
  }

  const relationId = getRelationId(value);
  if (relationId === null) {
    return "";
  }

  const user = usersById.get(String(relationId));
  const fullName = getText(user?.fullName);
  const role = getText(user?.role);
  return fullName ? (role ? `${fullName} · ${role}` : fullName) : "";
}

function buildOwnerHref(collection: string, id: number | string | null) {
  const encodedId = id == null ? "" : encodeURIComponent(String(id));

  switch (collection) {
    case "pages":
      return encodedId ? `/admin/site?selected=${encodedId}` : "/admin/site";
    case "page-sections":
      return encodedId ? `/admin/site#block-${encodedId}` : "/admin/site";
    case "product-directions":
      return encodedId ? `/admin/products?direction=${encodedId}` : "/admin/products";
    case "product-categories":
      return encodedId ? `/admin/products?category=${encodedId}` : "/admin/products";
    case "product-lines":
      return encodedId ? `/admin/products?line=${encodedId}` : "/admin/products";
    case "products":
    case "product-variants":
      return encodedId ? `/admin/products?product=${encodedId}&panel=translations` : "/admin/products?panel=translations";
    case "product-inquiry-forms":
      return encodedId ? `/admin/site-admin?panel=forms&form=${encodedId}` : "/admin/site-admin?panel=forms";
    case "product-documents":
      return encodedId ? `/admin/products?panel=documents&document=${encodedId}` : "/admin/products?panel=documents";
    case "media-assets":
      return encodedId ? `/admin/media?asset=${encodedId}` : "/admin/media";
    case "seo-entries":
      return encodedId ? `/admin/checks?panel=seo&entry=${encodedId}` : "/admin/checks?panel=seo";
    default:
      return "/admin/translations";
  }
}

function buildSeoWorkspaceHref(
  ownerCollection: TranslationWorkspaceOwnerCollection,
  ownerId: number | string | null,
) {
  if (ownerId == null) {
    return "";
  }

  switch (ownerCollection) {
    case "pages":
      return `/admin/site?selected=${encodeURIComponent(String(ownerId))}#page-seo`;
    case "product-directions":
      return `/admin/products?direction=${encodeURIComponent(String(ownerId))}&panel=seo`;
    case "product-categories":
      return `/admin/products?category=${encodeURIComponent(String(ownerId))}&panel=seo`;
    case "product-lines":
      return `/admin/products?line=${encodeURIComponent(String(ownerId))}&panel=seo`;
    case "products":
      return `/admin/products?product=${encodeURIComponent(String(ownerId))}&panel=seo`;
    default:
      return "";
  }
}

function stringifyFieldValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "";
}

function getFieldRisk(valueType: TranslationWorkspaceContentValueType, sourceValue: string, targetValue: string) {
  const longest = Math.max(sourceValue.length, targetValue.length);
  const limit = valueType === "long-text" ? 320 : 96;
  const isLayoutSensitive = valueType === "long-text" || longest > limit;

  return {
    isLayoutSensitive,
    longTextLimit: isLayoutSensitive ? limit : null,
    riskLabel: isLayoutSensitive
      ? "Длинный текст: после сохранения проверить переносы и мобильную верстку."
      : "",
  };
}

function makeContentField(input: {
  editorHref: string;
  fieldKey: string;
  label: string;
  sourceValue?: unknown;
  surface: TranslationWorkspaceContentSurface;
  targetValue?: unknown;
  valueType?: TranslationWorkspaceContentValueType;
}): TranslationWorkspaceContentField {
  const sourceValue = stringifyFieldValue(input.sourceValue);
  const targetValue = stringifyFieldValue(input.targetValue);
  const valueType = input.valueType ?? (sourceValue.length > 160 ? "long-text" : "text");
  const risk = getFieldRisk(valueType, sourceValue, targetValue);

  return {
    editorHref: input.editorHref,
    fieldKey: input.fieldKey,
    label: input.label,
    sourceValue,
    surface: input.surface,
    targetValue,
    valueType,
    ...risk,
  };
}

function appendSourceField(
  fields: TranslationWorkspaceContentField[],
  input: Parameters<typeof makeContentField>[0],
) {
  const sourceValue = stringifyFieldValue(input.sourceValue);
  if (!sourceValue) {
    return;
  }
  if (fields.some((field) => field.fieldKey === input.fieldKey)) {
    return;
  }
  fields.push(makeContentField({ ...input, sourceValue }));
}

function extractSourceContentFields(
  ownerCollection: TranslationWorkspaceOwnerCollection,
  record: GenericRecord,
  ownerHref: string,
) {
  const fields: TranslationWorkspaceContentField[] = [];
  const add = (fieldKey: string, label: string, sourceValue: unknown, surface: TranslationWorkspaceContentSurface) =>
    appendSourceField(fields, {
      editorHref: ownerHref,
      fieldKey,
      label,
      sourceValue,
      surface,
      valueType: stringifyFieldValue(sourceValue).length > 160 ? "long-text" : "text",
    });

  add("title", "Заголовок", getOwnerLabel(ownerCollection, record), "title");
  add("route.path", "Публичный адрес", getOwnerRoutePath(ownerCollection, record), "route");
  add("route.slug", "Короткий адрес", getText(record.slug), "route");

  add("navigationLabel", "Название в навигации", record.navigationLabel, "body");
  add("headline", "Основной заголовок", record.headline, "title");
  add("description", "Описание", record.description, "body");
  add("shortDescription", "Короткое описание", record.shortDescription, "body");
  add("summary", "Краткое описание", record.summary, "body");
  add("excerpt", "Анонс", record.excerpt, "body");
  add("localizedExcerpt", "Лид или анонс", record.localizedExcerpt, "body");
  add("cta.label", "Текст кнопки", record.ctaLabel ?? record.buttonLabel, "button");
  add("seo.title", "SEO title", record.seoTitle ?? record.metaTitle ?? record.title, "seo");
  add("seo.description", "SEO description", record.seoDescription ?? record.metaDescription, "seo");
  add("media.alt", "Alt текст медиа", record.altText ?? record.assetAltText, "media");
  add("media.caption", "Подпись медиа", record.caption ?? record.assetCaption, "media");
  add("form.labels", "Тексты формы", record.formLabelSnapshot ?? record.successMessage, "form");
  add("document.label", "Название документа", record.publicLabel, "document");
  add("document.summary", "Описание документа", record.publicSummary, "document");

  return fields;
}

function getTargetStructuredValue(translation: TranslationRecord, fieldKey: string) {
  const entry = asArray<GenericRecord>(translation.structuredFieldMap).find(
    (field) => getText(field.fieldKey) === fieldKey,
  );
  return getText(entry?.value);
}

function getTargetContentValue(translation: TranslationRecord, fieldKey: string) {
  switch (fieldKey) {
    case "title":
      return getText(translation.targetTitle);
    case "route.path":
      return getText(translation.targetRoutePath);
    case "route.slug":
      return getText(translation.targetSlug);
    case "localizedExcerpt":
      return getText(translation.localizedExcerpt);
    case "seo.title":
      return getText((translation.seoDelta as GenericRecord | undefined)?.title);
    case "seo.description":
      return getText((translation.seoDelta as GenericRecord | undefined)?.description);
    case "seo.canonicalPath":
      return getText((translation.seoDelta as GenericRecord | undefined)?.canonicalPath);
    case "media.alt":
      return getText(asArray<GenericRecord>(translation.mediaLocalizationEntries)[0]?.localizedAltText);
    case "media.caption":
      return getText(asArray<GenericRecord>(translation.mediaLocalizationEntries)[0]?.localizedCaption);
    case "document.label":
      return getText(asArray<GenericRecord>(translation.documentLocalizationEntries)[0]?.localizedLabel);
    case "document.summary":
      return getText(asArray<GenericRecord>(translation.documentLocalizationEntries)[0]?.localizedSummary);
    case "form.labels":
      return getText(translation.formLabelSnapshot);
    case "cta.label":
      return getText(asArray<GenericRecord>(translation.localeSpecificCtas)[0]?.label);
    default:
      return getTargetStructuredValue(translation, fieldKey);
  }
}

function buildTranslationContentFields(
  sourceFields: TranslationWorkspaceContentField[],
  translation?: TranslationRecord | null,
) {
  const fields = sourceFields.map((field) =>
    makeContentField({
      editorHref: field.editorHref,
      fieldKey: field.fieldKey,
      label: field.label,
      sourceValue: field.sourceValue,
      surface: field.surface,
      targetValue: translation ? getTargetContentValue(translation, field.fieldKey) : "",
      valueType: field.valueType,
    }),
  );

  if (translation) {
    for (const entry of asArray<GenericRecord>(translation.structuredFieldMap)) {
      const fieldKey = getText(entry.fieldKey);
      if (!fieldKey || fields.some((field) => field.fieldKey === fieldKey)) {
        continue;
      }
      fields.push(
        makeContentField({
          editorHref: fields[0]?.editorHref ?? "",
          fieldKey,
          label: fieldKey.replace(/[._-]/g, " "),
          sourceValue: "",
          surface: "body",
          targetValue: entry.value,
          valueType:
            getText(entry.valueType) === "json" || getText(entry.valueType) === "long-text"
              ? (getText(entry.valueType) as TranslationWorkspaceContentValueType)
              : "text",
        }),
      );
    }
  }

  return fields;
}

type TranslationOwnerWorkspace = {
  contentFields: TranslationWorkspaceContentField[];
  ownerHref: string;
  ownerId: number | string | null;
  ownerRoutePath: string;
  seoWorkspaceHref: string;
};

function buildOwnerWorkspaceLookup(
  ownerRecordGroups: Array<{
    definition: TranslationOwnerDefinition;
    docs: GenericRecord[];
  }>,
) {
  const lookup = new Map<string, TranslationOwnerWorkspace>();

  for (const group of ownerRecordGroups) {
    for (const record of group.docs) {
      const ownerId = getOwnerRecordId(record);
      const ownerRoutePath = getOwnerRoutePath(group.definition.ownerCollection, record);
      const ownerHref = buildOwnerHref(group.definition.collection, ownerId);
      const seoWorkspaceHref = buildSeoWorkspaceHref(group.definition.ownerCollection, ownerId);
      const contentFields = extractSourceContentFields(group.definition.ownerCollection, record, ownerHref);

      for (const key of getOwnerKeyCandidates(record)) {
        lookup.set(`${group.definition.ownerCollection}:${key}`, {
          contentFields,
          ownerHref,
          ownerId,
          ownerRoutePath,
          seoWorkspaceHref,
        });
      }
    }
  }

  return lookup;
}

function getOwnerKeyCandidates(record: GenericRecord) {
  return Array.from(
    new Set(
      [getText(record.slug), getText(record.internalCode), getText(record.sectionKey), String(record.id ?? "")]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function getOwnerRecordId(record: GenericRecord) {
  return typeof record.id === "number" || typeof record.id === "string" ? record.id : null;
}

function getOwnerLabel(ownerCollection: TranslationWorkspaceOwnerCollection, record: GenericRecord) {
  switch (ownerCollection) {
    case "pages":
      return (
        getText(record.title) ||
        getText(record.navigationLabel) ||
        getText(record.slug) ||
        "Страница без названия"
      );
    case "page-sections":
      return getText(record.previewLabel) || getText(record.title) || getText(record.sectionKey) || "Блок без названия";
    case "product-inquiry-forms":
      return getText(record.title) || getText(record.slug) || "Форма без названия";
    case "seo-entries":
      return getText(record.title) || getText(record.routePath) || getText(record.slug) || "SEO-настройка";
    case "product-documents":
      return getText(record.title) || getText(record.publicLabel) || getText(record.slug) || "Документ";
    case "media-assets":
      return getText(record.title) || getText(record.assetTitle) || getText(record.slug) || "Медиафайл";
    default:
      return (
        getText(record.publicLabel) ||
        getText(record.name) ||
        getText(record.title) ||
        getText(record.slug) ||
        "Объект без названия"
      );
  }
}

function getOwnerRoutePath(ownerCollection: TranslationWorkspaceOwnerCollection, record: GenericRecord) {
  if (ownerCollection === "seo-entries") {
    return getText(record.routePath) || getText(record.canonicalPath) || "";
  }

  return getText(record.canonicalPath) || getText(record.routePath) || "";
}

function getSourceLocaleFromOwner(record: GenericRecord) {
  return getText(record.primaryLocale) || getText(record.locale) || "en";
}

function getSourceRevisionKey(record: GenericRecord) {
  const updatedAt = getText(record.updatedAt) || new Date().toISOString();
  const stableId = getText(record.internalCode) || getText(record.slug) || String(record.id ?? "record");
  return `${stableId}:${updatedAt}`;
}

function getSourceTitleSnapshot(ownerCollection: TranslationWorkspaceOwnerCollection, record: GenericRecord) {
  return getOwnerLabel(ownerCollection, record);
}

function buildDraftTargetRoutePath(targetLocale: string, ownerRoutePath: string) {
  const normalizedLocale = getText(targetLocale).toLowerCase();
  const normalizedRoute = ownerRoutePath.trim() || "/";
  const routePath = normalizedRoute.startsWith("/") ? normalizedRoute : `/${normalizedRoute}`;

  if (!normalizedLocale) {
    return routePath;
  }

  if (routePath === "/") {
    return `/${normalizedLocale}`;
  }

  return `/${normalizedLocale}${routePath}`;
}

function buildDraftTargetSlug(
  ownerCollection: TranslationWorkspaceOwnerCollection,
  ownerKey: string,
  ownerRoutePath: string,
  targetLocale: string,
) {
  const normalizedLocale = getText(targetLocale).toLowerCase();
  const routePath = ownerRoutePath.trim();
  const lastRouteSegment =
    routePath
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .at(-1) || "";

  if (ownerCollection === "seo-entries" && (!routePath || routePath === "/")) {
    return normalizedLocale ? `home-${normalizedLocale}` : "home";
  }

  if (lastRouteSegment) {
    return lastRouteSegment;
  }

  const normalizedOwnerKey = getText(ownerKey)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedOwnerKey || (normalizedLocale ? `draft-${normalizedLocale}` : "draft");
}

function getFilterMatch(card: Pick<TranslationWorkspaceCard, "isMissing" | "status" | "staleSourceState">) {
  if (card.isMissing) {
    return "missing" as const;
  }

  if (card.staleSourceState && card.staleSourceState !== "fresh") {
    return "stale" as const;
  }

  switch (card.status) {
    case "review":
      return "review" as const;
    case "approved":
      return "approved" as const;
    case "published":
      return "published" as const;
    default:
      return "draft" as const;
  }
}

function buildWarningLabels(card: {
  isMissing: boolean;
  publishBlockedReasons: string[];
  publishReadiness: string;
  reviewerAssigneeLabel: string;
  staleSourceState: string;
  status: string;
  targetRoutePath: string;
}) {
  const warnings: string[] = [];

  if (card.isMissing) {
    warnings.push("Нет версии перевода");
  }

  if (card.staleSourceState === "source-changed") {
    warnings.push("Исходник изменился после перевода");
  }

  if (card.staleSourceState === "review-required") {
    warnings.push("Исходник ждёт проверки");
  }

  if (card.publishReadiness === "blocked") {
    warnings.push("Публикация заблокирована");
  }

  if ((card.status === "approved" || card.status === "published") && !card.reviewerAssigneeLabel) {
    warnings.push("Не назначен проверяющий");
  }

  if (!card.targetRoutePath && card.publishBlockedReasons.includes("missing-route")) {
    warnings.push("Нет публичного адреса");
  }

  return warnings;
}

async function fetchCollectionDocs(
  payload: Payload,
  collection: Parameters<Payload["find"]>[0]["collection"],
) {
  const result = await payload.find({
    collection,
    depth: 1,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    sort: "-updatedAt",
  });

  return result.docs as unknown as GenericRecord[];
}

async function loadLocaleRecords(payload: Payload) {
  const result = await payload.find({
    collection: "locales",
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: "launchOrder",
  });

  return result.docs as unknown as LocaleRecord[];
}

async function loadAdminUsers(payload: Payload) {
  const result = await payload.find({
    collection: "admin-users",
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: "fullName",
  });

  return result.docs as unknown as AdminUserRecord[];
}

function getLocaleSummaries(locales: LocaleRecord[]) {
  const localeRecords = launchLocaleSeeds.map((seed) => {
    const locale = locales.find((entry) => getText(entry.code) === seed.code);
    return {
      approved: 0,
      code: seed.code,
      draft: 0,
      englishLabel: getText(locale?.englishLabel) || seed.englishLabel,
      isPublicEnabled: locale ? locale.publicSiteEnabled === true : Boolean(seed.publicSiteEnabled),
      missing: 0,
      nativeLabel: getText(locale?.nativeLabel) || seed.nativeLabel,
      published: 0,
      review: 0,
      stale: 0,
      total: 0,
    } satisfies TranslationWorkspaceLocaleSummary;
  });

  return new Map<string, TranslationWorkspaceLocaleSummary>(
    localeRecords.map((entry) => [entry.code, entry] as const),
  );
}

function buildUserOptions(users: AdminUserRecord[], roles: readonly string[]) {
  return users
    .filter((user) => roles.includes(getText(user.role)))
    .map((user) => ({
      id: user.id as number | string,
      label: getText(user.fullName) || getText(user.email) || "Unknown user",
      role: getText(user.role),
    }));
}

function buildWorkspaceFilters(cards: TranslationWorkspaceCard[]) {
  const filterMeta: Array<[TranslationWorkspaceFilterId, string, string]> = [
    ["all", "Все локали", "Все переводы и пустые слоты по локалям запуска."],
    ["missing", "Пустые", "Есть исходный объект, но ещё нет перевода для выбранного языка."],
    ["draft", "В работе", "Черновики и активные переводы, которые ещё не дошли до проверки."],
    ["review", "На проверке", "Тексты ждут редактора, проверяющего или финального согласования."],
    ["approved", "Согласованные", "Готово к публикации или к финальному выпуску."],
    ["published", "Опубликованные", "Переводы уже выпущены для целевой локали."],
    ["stale", "Устаревшие", "Исходник изменился или появились блокеры актуальности и проверки."],
  ];

  return filterMeta.map(([id, label, description]) => ({
    count: id === "all" ? cards.length : cards.filter((card) => card.filterMatch === id).length,
    description,
    id,
    label,
  }));
}

function createMissingTranslationCard(input: {
  contentFields: TranslationWorkspaceContentField[];
  localeSummaries: Map<string, TranslationWorkspaceLocaleSummary>;
  ownerCollection: TranslationWorkspaceOwnerCollection;
  ownerId: number | string | null;
  ownerKey: string;
  ownerLabel: string;
  ownerRoutePath: string;
  sourceLocale: string;
  sourceRevisionKey: string;
  sourceTitleSnapshot: string;
  targetLocale: string;
}) {
  const ownerLabel = ownerDefinitionByKey.get(input.ownerCollection)?.label ?? input.ownerCollection;
  const card: TranslationWorkspaceCard = {
    changeReason: "",
    contentFields: buildTranslationContentFields(input.contentFields),
    fieldScope: ownerDefinitionByKey.get(input.ownerCollection)?.defaultFieldScope ?? "full-record",
    filterMatch: "missing",
    id: `missing:${input.ownerCollection}:${input.ownerKey}:${input.targetLocale}`,
    internalNotes: "",
    isMissing: true,
    ownerCollection: input.ownerCollection,
    ownerCollectionLabel: ownerLabel,
    ownerHref: buildOwnerHref(ownerDefinitionByKey.get(input.ownerCollection)?.collection ?? "pages", input.ownerId),
    ownerKey: input.ownerKey,
    ownerLabel: input.ownerLabel,
    ownerRoutePath: input.ownerRoutePath,
    previewPath: input.ownerRoutePath,
    publishBlockedReasons: ["review-missing"],
    publishReadiness: "not-ready",
    publicRouteHint: input.ownerRoutePath || "Публичный адрес ещё не задан",
    recordId: null,
    reviewerAssigneeId: null,
    reviewerAssigneeLabel: "",
    seoWorkspaceHref: buildSeoWorkspaceHref(input.ownerCollection, input.ownerId),
    sourceLocale: input.sourceLocale,
    sourceRevisionKey: input.sourceRevisionKey,
    sourceTitleSnapshot: input.sourceTitleSnapshot,
    staleReason: "",
    staleSourceState: "fresh",
    status: "missing",
    structuredFieldCount: 0,
    targetLocale: input.targetLocale,
    targetRoutePath: "",
    targetSlug: "",
    targetTitle: "",
    translatorAssigneeId: null,
    translatorAssigneeLabel: "",
    warningLabels: ["Нет версии перевода"],
    workflowStage: "queued",
  };

  const localeSummary = input.localeSummaries.get(input.targetLocale);
  if (localeSummary) {
    localeSummary.missing += 1;
    localeSummary.total += 1;
  }

  return card;
}

function buildRealTranslationCard(input: {
  localeSummaries: Map<string, TranslationWorkspaceLocaleSummary>;
  localeById: Map<string, LocaleRecord>;
  ownerWorkspaceLookup: Map<string, TranslationOwnerWorkspace>;
  translation: TranslationRecord;
  usersById: Map<string, AdminUserRecord>;
}) {
  const ownerCollection = getText(input.translation.ownerCollection) as TranslationWorkspaceOwnerCollection;
  const ownerDefinition = ownerDefinitionByKey.get(ownerCollection);
  const sourceLocale = getLocaleCode(input.translation.sourceLocale, input.localeById) || "en";
  const targetLocale = getLocaleCode(input.translation.targetLocale, input.localeById) || "en";
  const recordId = getOwnerRecordId(input.translation);
  const ownerKey = getText(input.translation.ownerRecordKey) || String(input.translation.id ?? "");
  const ownerWorkspace =
    input.ownerWorkspaceLookup.get(`${ownerCollection}:${ownerKey}`) ?? null;
  const card: TranslationWorkspaceCard = {
    changeReason: getText(input.translation.changeReason),
    contentFields: buildTranslationContentFields(ownerWorkspace?.contentFields ?? [], input.translation),
    fieldScope: getText(input.translation.fieldScope) || "full-record",
    filterMatch: "draft",
    id: `translation:${input.translation.id as number | string}`,
    internalNotes: getText(input.translation.internalNotes),
    isMissing: false,
    ownerCollection,
    ownerCollectionLabel: ownerDefinition?.label ?? ownerCollection,
    ownerHref: ownerWorkspace?.ownerHref || buildOwnerHref(ownerDefinition?.collection ?? "translations", recordId),
    ownerKey,
    ownerLabel: getText(input.translation.ownerLabelSnapshot) || "Объект без названия",
    ownerRoutePath: ownerWorkspace?.ownerRoutePath || getText(input.translation.sourceRoutePathSnapshot),
    previewPath:
      getText(input.translation.targetRoutePath) ||
      ownerWorkspace?.ownerRoutePath ||
      getText(input.translation.sourceRoutePathSnapshot),
    publishBlockedReasons: asArray<string>(input.translation.publishBlockedReasons).map((entry) => getText(entry)).filter(Boolean),
    publishReadiness: getText(input.translation.publishReadiness) || "not-ready",
    publicRouteHint:
      getText(input.translation.targetRoutePath) ||
      getText(input.translation.sourceRoutePathSnapshot) ||
      "Публичный адрес ещё не задан",
    recordId: typeof input.translation.id === "number" || typeof input.translation.id === "string" ? input.translation.id : null,
    reviewerAssigneeId: getRelationId(input.translation.reviewerAssignee),
    reviewerAssigneeLabel: getUserLabel(input.translation.reviewerAssignee, input.usersById),
    seoWorkspaceHref: ownerWorkspace?.seoWorkspaceHref || "",
    sourceLocale,
    sourceRevisionKey: getText(input.translation.sourceRevisionKey),
    sourceTitleSnapshot: getText(input.translation.sourceTitleSnapshot) || getText(input.translation.ownerLabelSnapshot),
    staleReason: getText(input.translation.staleReason),
    staleSourceState: getText(input.translation.staleSourceState) || "fresh",
    status: getText(input.translation.status) || "draft",
    structuredFieldCount: asArray(input.translation.structuredFieldMap).length,
    targetLocale,
    targetRoutePath: getText(input.translation.targetRoutePath),
    targetSlug: getText(input.translation.targetSlug),
    targetTitle: getText(input.translation.targetTitle),
    translatorAssigneeId: getRelationId(input.translation.translatorAssignee),
    translatorAssigneeLabel: getUserLabel(input.translation.translatorAssignee, input.usersById),
    warningLabels: [],
    workflowStage: getText(input.translation.workflowStage) || "queued",
  };

  card.filterMatch = getFilterMatch(card);
  card.warningLabels = buildWarningLabels(card);

  const localeSummary = input.localeSummaries.get(targetLocale);
  if (localeSummary) {
    if (card.filterMatch === "draft") {
      localeSummary.draft += 1;
    }
    if (card.filterMatch === "review") {
      localeSummary.review += 1;
    }
    if (card.filterMatch === "approved") {
      localeSummary.approved += 1;
    }
    if (card.filterMatch === "published") {
      localeSummary.published += 1;
    }
    if (card.filterMatch === "stale") {
      localeSummary.stale += 1;
    }
    localeSummary.total += 1;
  }

  return card;
}

function buildFilterDescription(filter: TranslationWorkspaceFilterId, locale: string) {
  const localeLabel = locale === "all" ? "all launch locales" : locale.toUpperCase();
  switch (filter) {
    case "missing":
      return `No missing translation work for ${localeLabel}.`;
    case "draft":
      return `No draft translation items in ${localeLabel}.`;
    case "review":
      return `Nothing is waiting for review in ${localeLabel}.`;
    case "approved":
      return `No approved locale work is waiting in ${localeLabel}.`;
    case "published":
      return `Для ${localeLabel} пока нет опубликованных переводов.`;
    case "stale":
      return `No stale or freshness-blocked translations in ${localeLabel}.`;
    default:
      return `No translation workload matched ${localeLabel}.`;
  }
}

function cardMatchesSearch(card: TranslationWorkspaceCard, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    card.ownerLabel,
    card.ownerKey,
    card.ownerCollectionLabel,
    card.sourceLocale,
    card.targetLocale,
    card.translatorAssigneeLabel,
    card.reviewerAssigneeLabel,
    card.ownerRoutePath,
    card.targetRoutePath,
    card.targetSlug,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function cardSortWeight(card: TranslationWorkspaceCard) {
  if (card.isMissing) {
    return 0;
  }
  if (card.staleSourceState && card.staleSourceState !== "fresh") {
    return 1;
  }
  if (card.status === "review") {
    return 2;
  }
  if (card.status === "approved") {
    return 3;
  }
  if (card.status === "published") {
    return 5;
  }
  return 4;
}

export async function getTranslationsWorkspaceSnapshot(
  payload: Payload,
  req: PayloadRequest,
  input: { filter?: string | null; locale?: string | null; ownerCollection?: string | null; ownerKey?: string | null; q?: string | null },
): Promise<TranslationWorkspaceSnapshot> {
  if (!canReadTranslationsWorkspace(req)) {
    throw new Error("forbidden");
  }

  const [translationResult, localeRecords, adminUsers, ownerRecordGroups] = await Promise.all([
    payload.find({
      collection: "translations",
      depth: 1,
      limit: 500,
      overrideAccess: false,
      pagination: false,
      req,
      sort: "-updatedAt",
    }),
    loadLocaleRecords(payload),
    loadAdminUsers(payload),
    Promise.all(
      translationOwnerDefinitions.map(async (definition) => ({
        definition,
        docs: await fetchCollectionDocs(payload, definition.collection),
      })),
    ),
  ]);

  const localeById = new Map(
    localeRecords
      .map((entry) => {
        const id = getOwnerRecordId(entry);
        return id == null ? null : [String(id), entry] as const;
      })
      .filter((entry): entry is readonly [string, LocaleRecord] => entry !== null),
  );
  const usersById = new Map(
    adminUsers
      .map((entry) => {
        const id = getOwnerRecordId(entry);
        return id == null ? null : [String(id), entry] as const;
      })
      .filter((entry): entry is readonly [string, AdminUserRecord] => entry !== null),
  );
  const localeSummaries = getLocaleSummaries(localeRecords);
  const ownerWorkspaceLookup = buildOwnerWorkspaceLookup(ownerRecordGroups);
  const translations = translationResult.docs as unknown as TranslationRecord[];
  const coverage = new Set<string>();

  for (const translation of translations) {
    const ownerCollection = getText(translation.ownerCollection);
    const targetLocale = getLocaleCode(translation.targetLocale, localeById);
    const ownerKey = getText(translation.ownerRecordKey);
    if (ownerCollection && targetLocale && ownerKey) {
      coverage.add(`${ownerCollection}:${ownerKey}:${targetLocale}`);
    }
  }

  const cards = translations.map((translation) =>
    buildRealTranslationCard({
      localeById,
      localeSummaries,
      ownerWorkspaceLookup,
      translation,
      usersById,
    }),
  );

  for (const group of ownerRecordGroups) {
    for (const record of group.docs) {
      const sourceLocale = getSourceLocaleFromOwner(record);
      if (!launchLocaleSeeds.some((entry) => entry.code === sourceLocale)) {
        continue;
      }

      const status = getText(record.status);
      if (status === "archived" || status === "hidden") {
        continue;
      }

      const keys = getOwnerKeyCandidates(record);
      const ownerKey = keys[0];
      if (!ownerKey) {
        continue;
      }

      for (const locale of launchLocaleSeeds) {
        if (locale.code === sourceLocale) {
          continue;
        }

        const hasTranslation = keys.some((key) =>
          coverage.has(`${group.definition.ownerCollection}:${key}:${locale.code}`),
        );

        if (hasTranslation) {
          continue;
        }

        cards.push(
          createMissingTranslationCard({
            contentFields: extractSourceContentFields(
              group.definition.ownerCollection,
              record,
              buildOwnerHref(group.definition.collection, getOwnerRecordId(record)),
            ),
            localeSummaries,
            ownerCollection: group.definition.ownerCollection,
            ownerId: getOwnerRecordId(record),
            ownerKey,
            ownerLabel: getOwnerLabel(group.definition.ownerCollection, record),
            ownerRoutePath: getOwnerRoutePath(group.definition.ownerCollection, record),
            sourceLocale,
            sourceRevisionKey: getSourceRevisionKey(record),
            sourceTitleSnapshot: getSourceTitleSnapshot(group.definition.ownerCollection, record),
            targetLocale: locale.code,
          }),
        );
      }
    }
  }

  const activeFilter = normalizeFilter(input.filter ?? null);
  const activeLocale = normalizeLocale(getText(input.locale));
  const activeSearch = getText(input.q);
  const ownerCollection = getText(input.ownerCollection) as TranslationWorkspaceOwnerCollection | "";
  const ownerKey = getText(input.ownerKey);
  const filteredCards = cards
    .filter((card) => (activeFilter === "all" ? true : card.filterMatch === activeFilter))
    .filter((card) => (activeLocale === "all" ? true : card.targetLocale === activeLocale))
    .filter((card) => (ownerCollection ? card.ownerCollection === ownerCollection : true))
    .filter((card) => (ownerKey ? card.ownerKey === ownerKey : true))
    .filter((card) => cardMatchesSearch(card, activeSearch))
    .sort((left, right) => {
      const weightDifference = cardSortWeight(left) - cardSortWeight(right);
      if (weightDifference !== 0) {
        return weightDifference;
      }

      return `${left.ownerLabel}:${left.targetLocale}`.localeCompare(`${right.ownerLabel}:${right.targetLocale}`);
    });

  return {
    activeFilter,
    activeLocale,
    activeSearch,
    canAssign: canAssignTranslationsWorkspace(req),
    canCreate: canUpdateTranslationsWorkspace(req),
    canPublish: canPublishTranslationsWorkspace(req),
    canUpdate: canUpdateTranslationsWorkspace(req),
    cards: filteredCards,
    emptyState: buildFilterDescription(activeFilter, activeLocale),
    filters: buildWorkspaceFilters(cards),
    generatedAt: new Date().toISOString(),
    localeSummaries: Array.from(localeSummaries.values()),
    reviewerOptions: buildUserOptions(adminUsers, ["owner", "admin", "content-editor", "developer"]),
    totalVisibleCards: filteredCards.length,
    translatorOptions: buildUserOptions(adminUsers, ["owner", "admin", "translator", "content-editor", "developer"]),
  };
}

function getTranslationOwnerDefinition(ownerCollection: string) {
  const definition = ownerDefinitionByKey.get(ownerCollection as TranslationWorkspaceOwnerCollection);
  if (!definition) {
    throw new Error("invalid-owner");
  }

  return definition;
}

async function resolveOwnerRecordForCreate(
  payload: Payload,
  ownerCollection: TranslationWorkspaceOwnerCollection,
  ownerKey: string,
) {
  const definition = getTranslationOwnerDefinition(ownerCollection);
  const docs = await fetchCollectionDocs(payload, definition.collection);
  const owner = docs.find((record) => getOwnerKeyCandidates(record).includes(ownerKey));

  if (!owner) {
    throw new Error("owner-not-found");
  }

  return { definition, owner };
}

async function resolveLocaleRelationIds(payload: Payload, sourceLocale: string, targetLocale: string) {
  const locales = await loadLocaleRecords(payload);
  const source = locales.find((entry) => getText(entry.code) === sourceLocale);
  const target = locales.find((entry) => getText(entry.code) === targetLocale);
  const sourceId = getOwnerRecordId(source ?? {});
  const targetId = getOwnerRecordId(target ?? {});

  if (sourceId == null || targetId == null) {
    throw new Error("locale-not-found");
  }

  return { sourceId, targetId };
}

export async function createTranslationWorkspaceRecord(
  payload: Payload,
  req: PayloadRequest,
  input: TranslationWorkspaceCreateInput,
) {
  if (!canUpdateTranslationsWorkspace(req)) {
    throw new Error("forbidden");
  }

  const ownerCollection = getText(input.ownerCollection) as TranslationWorkspaceOwnerCollection;
  const ownerKey = getText(input.ownerKey);
  const targetLocale = getText(input.targetLocale);

  if (!ownerCollection || !ownerKey || !targetLocale) {
    throw new Error("invalid-input");
  }

  const { definition, owner } = await resolveOwnerRecordForCreate(payload, ownerCollection, ownerKey);
  const sourceLocale = getSourceLocaleFromOwner(owner);

  if (sourceLocale === targetLocale) {
    throw new Error("invalid-input");
  }

  const { sourceId, targetId } = await resolveLocaleRelationIds(payload, sourceLocale, targetLocale);
  const actor = buildActor(req);
  const at = new Date().toISOString();
  const ownerRoutePath = getOwnerRoutePath(ownerCollection, owner) || "/";
  const targetRoutePath = definition.routeLocalizationRequired
    ? buildDraftTargetRoutePath(targetLocale, ownerRoutePath)
    : "";
  const targetSlug = definition.routeLocalizationRequired
    ? buildDraftTargetSlug(ownerCollection, ownerKey, ownerRoutePath, targetLocale)
    : "";
  const sourceContentFields = extractSourceContentFields(
    ownerCollection,
    owner,
    buildOwnerHref(definition.collection, getOwnerRecordId(owner)),
  );
  const structuredFieldMap = sourceContentFields
    .filter((field) => !["route.path", "route.slug", "title"].includes(field.fieldKey))
    .map((field) => ({
      fieldKey: field.fieldKey,
      value: "",
      valueType: field.valueType,
    }));

  return payload.create({
    collection: "translations",
    data: {
      changeReason: `Created from translations workspace by ${actor}.`,
      fieldScope: definition.defaultFieldScope,
      formLabelSnapshot: "",
      internalNotes: "",
      ownerCollection,
      ownerLabelSnapshot: getOwnerLabel(ownerCollection, owner),
      ownerRecordKey: ownerKey,
      previewNotes: "",
      primaryLocale: sourceId,
      publishBlockedReasons: definition.routeLocalizationRequired ? ["missing-route"] : [],
      publishReadiness: "not-ready",
      reviewerAssignee: null,
      routeLocalizationRequired: definition.routeLocalizationRequired,
      sourceHash: "",
      sourceLocale: sourceId,
      sourceOfTruthArtifact: "",
      sourceRevisionKey: getSourceRevisionKey(owner),
      sourceRoutePathSnapshot: ownerRoutePath || null,
      sourceTitleSnapshot: getSourceTitleSnapshot(ownerCollection, owner) || null,
      sourceUpdatedAtSnapshot: getText(owner.updatedAt) || at,
      staleReason: "",
      staleSourceState: "fresh",
      status: "draft",
      structuredFieldMap,
      targetLocale: targetId,
      targetRoutePath,
      targetSlug,
      targetTitle: "",
      translationMethod: "human",
      translatorAssignee: null,
      workflowStage: "queued",
    } as never,
    overrideAccess: false,
    req,
  }) as Promise<{ id: number | string }>;
}

function getContentFieldsInput(input: TranslationWorkspaceContentUpdateInput) {
  return asArray<GenericRecord>(input.fields)
    .map((field) => {
      const fieldKey = getText(field.fieldKey);
      if (!fieldKey) {
        return null;
      }
      const valueType = getText(field.valueType);
      return {
        fieldKey,
        value: stringifyFieldValue(field.value),
        valueType:
          valueType === "json" || valueType === "long-text"
            ? (valueType as TranslationWorkspaceContentValueType)
            : "text",
      };
    })
    .filter((field): field is { fieldKey: string; value: string; valueType: TranslationWorkspaceContentValueType } => field !== null);
}

function findContentValue(
  fields: Array<{ fieldKey: string; value: string; valueType: TranslationWorkspaceContentValueType }>,
  fieldKey: string,
  fallback: unknown,
) {
  return fields.find((field) => field.fieldKey === fieldKey)?.value ?? getText(fallback);
}

function buildStructuredFieldMapForUpdate(
  original: TranslationRecord,
  fields: Array<{ fieldKey: string; value: string; valueType: TranslationWorkspaceContentValueType }>,
) {
  const directFieldKeys = new Set([
    "cta.label",
    "document.label",
    "document.summary",
    "form.labels",
    "localizedExcerpt",
    "media.alt",
    "media.caption",
    "route.path",
    "route.slug",
    "seo.canonicalPath",
    "seo.description",
    "seo.title",
    "title",
  ]);
  const nextByKey = new Map(
    asArray<GenericRecord>(original.structuredFieldMap).map((field) => [
      getText(field.fieldKey),
      {
        fieldKey: getText(field.fieldKey),
        value: getText(field.value),
        valueType:
          getText(field.valueType) === "json" || getText(field.valueType) === "long-text"
            ? (getText(field.valueType) as TranslationWorkspaceContentValueType)
            : "text",
      },
    ]),
  );

  for (const field of fields) {
    if (directFieldKeys.has(field.fieldKey)) {
      continue;
    }
    nextByKey.set(field.fieldKey, field);
  }

  return Array.from(nextByKey.values()).filter((field) => field.fieldKey);
}

export async function applyTranslationWorkspaceContentUpdate(
  payload: Payload,
  req: PayloadRequest,
  translationId: number | string,
  input: TranslationWorkspaceContentUpdateInput,
) {
  if (!canUpdateTranslationsWorkspace(req)) {
    throw new Error("forbidden");
  }

  const original = (await payload.findByID({
    collection: "translations",
    id: translationId,
    overrideAccess: false,
    req,
  })) as unknown as TranslationRecord;
  const fields = getContentFieldsInput(input);

  if (fields.length === 0 && !getText(input.previewNotes)) {
    throw new Error("no-op");
  }

  const targetTitle = findContentValue(fields, "title", input.targetTitle ?? original.targetTitle);
  const targetSlug = findContentValue(fields, "route.slug", input.targetSlug ?? original.targetSlug);
  const targetRoutePath = findContentValue(fields, "route.path", input.targetRoutePath ?? original.targetRoutePath);
  const localizedExcerpt = findContentValue(fields, "localizedExcerpt", input.localizedExcerpt ?? original.localizedExcerpt);
  const seoDelta = {
    ...((original.seoDelta as GenericRecord | undefined) ?? {}),
    canonicalPath: findContentValue(fields, "seo.canonicalPath", (original.seoDelta as GenericRecord | undefined)?.canonicalPath),
    description: findContentValue(fields, "seo.description", (original.seoDelta as GenericRecord | undefined)?.description),
    title: findContentValue(fields, "seo.title", (original.seoDelta as GenericRecord | undefined)?.title),
  };
  const mediaAlt = findContentValue(fields, "media.alt", asArray<GenericRecord>(original.mediaLocalizationEntries)[0]?.localizedAltText);
  const mediaCaption = findContentValue(
    fields,
    "media.caption",
    asArray<GenericRecord>(original.mediaLocalizationEntries)[0]?.localizedCaption,
  );
  const documentLabel = findContentValue(
    fields,
    "document.label",
    asArray<GenericRecord>(original.documentLocalizationEntries)[0]?.localizedLabel,
  );
  const documentSummary = findContentValue(
    fields,
    "document.summary",
    asArray<GenericRecord>(original.documentLocalizationEntries)[0]?.localizedSummary,
  );
  const ctaLabel = findContentValue(fields, "cta.label", asArray<GenericRecord>(original.localeSpecificCtas)[0]?.label);
  const actor = buildActor(req);
  const at = new Date().toISOString();
  const previewNotes = getText(input.previewNotes);
  const currentPreviewNotes = getText(original.previewNotes);
  const nextPreviewNotes = previewNotes
    ? `${currentPreviewNotes ? `${currentPreviewNotes}\n` : ""}[${at}] ${actor}: ${previewNotes}`
    : currentPreviewNotes;
  const nextStatus = getText(original.status) === "draft" ? "in-progress" : getText(original.status) || "in-progress";

  return payload.update({
    collection: "translations",
    data: {
      changeReason: `Content fields updated from translations workspace by ${actor}.`,
      documentLocalizationEntries:
        documentLabel || documentSummary
          ? [{ documentRole: "primary", localizedLabel: documentLabel, localizedSummary: documentSummary }]
          : asArray(original.documentLocalizationEntries),
      formLabelSnapshot: findContentValue(fields, "form.labels", original.formLabelSnapshot),
      internalNotes: getText(original.internalNotes) || null,
      localeSpecificCtas: ctaLabel
        ? [
            {
              href: asArray<GenericRecord>(original.localeSpecificCtas)[0]?.href || targetRoutePath || "/",
              label: ctaLabel,
              variant: asArray<GenericRecord>(original.localeSpecificCtas)[0]?.variant || "primary",
            },
          ]
        : asArray(original.localeSpecificCtas),
      localizedExcerpt,
      mediaLocalizationEntries:
        mediaAlt || mediaCaption
          ? [{ assetRole: "primary", localizedAltText: mediaAlt, localizedCaption: mediaCaption, notes: "" }]
          : asArray(original.mediaLocalizationEntries),
      previewNotes: nextPreviewNotes || null,
      publishReadiness: "not-ready",
      seoDelta,
      staleSourceState: "fresh",
      status: nextStatus,
      structuredFieldMap: buildStructuredFieldMapForUpdate(original, fields),
      targetRoutePath,
      targetSlug,
      targetTitle,
      workflowStage: "human-edit",
    } as never,
    id: translationId,
    overrideAccess: false,
    req,
  }) as Promise<{ id: number | string }>;
}

export async function applyTranslationWorkspaceUpdate(
  payload: Payload,
  req: PayloadRequest,
  translationId: number | string,
  input: TranslationWorkspaceUpdateInput,
) {
  if (!canUpdateTranslationsWorkspace(req)) {
    throw new Error("forbidden");
  }

  const original = (await payload.findByID({
    collection: "translations",
    id: translationId,
    overrideAccess: false,
    req,
  })) as unknown as TranslationRecord;
  const canAssign = canAssignTranslationsWorkspace(req);
  const canPublish = canPublishTranslationsWorkspace(req);
  const currentStatus = getText(original.status) || "draft";
  const currentWorkflowStage = getText(original.workflowStage) || "queued";
  const currentPublishReadiness = getText(original.publishReadiness) || "not-ready";
  const nextStatusCandidate = normalizeStatus(input.status, currentStatus);
  const nextStatus = canPublish
    ? nextStatusCandidate
    : ["draft", "in-progress", "review", "blocked"].includes(nextStatusCandidate)
      ? nextStatusCandidate
      : currentStatus;
  const nextWorkflowStage = normalizeWorkflowStage(input.workflowStage, currentWorkflowStage);
  const nextPublishReadiness = canPublish
    ? normalizePublishReadiness(input.publishReadiness, currentPublishReadiness)
    : currentPublishReadiness;
  const nextTranslatorAssigneeId = canAssign ? getRelationId(input.translatorAssigneeId) : getRelationId(original.translatorAssignee);
  const nextReviewerAssigneeId = canAssign ? getRelationId(input.reviewerAssigneeId) : getRelationId(original.reviewerAssignee);
  const changeReason = getText(input.changeReason);
  const internalNotes = getText(input.internalNotes);
  const actor = buildActor(req);
  const at = new Date().toISOString();
  const currentInternalNotes = getText(original.internalNotes);
  const stampedInternalNotes = internalNotes
    ? `${currentInternalNotes ? `${currentInternalNotes}\n` : ""}[${at}] ${actor}: ${internalNotes}`
    : currentInternalNotes;

  if (
    nextStatus === currentStatus &&
    nextWorkflowStage === currentWorkflowStage &&
    nextPublishReadiness === currentPublishReadiness &&
    String(nextTranslatorAssigneeId ?? "") === String(getRelationId(original.translatorAssignee) ?? "") &&
    String(nextReviewerAssigneeId ?? "") === String(getRelationId(original.reviewerAssignee) ?? "") &&
    !changeReason &&
    !internalNotes
  ) {
    throw new Error("no-op");
  }

  return payload.update({
    collection: "translations",
    data: {
      changeReason: changeReason || getText(original.changeReason) || `Updated from translations workspace by ${actor}.`,
      internalNotes: stampedInternalNotes || null,
      publishReadiness: nextPublishReadiness,
      reviewerAssignee: nextReviewerAssigneeId,
      status: nextStatus,
      translatorAssignee: nextTranslatorAssigneeId,
      workflowStage: nextWorkflowStage,
    } as never,
    id: translationId,
    overrideAccess: false,
    req,
  }) as Promise<{ id: number | string }>;
}
