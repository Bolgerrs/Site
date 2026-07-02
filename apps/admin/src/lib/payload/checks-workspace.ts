import type { Payload, PayloadRequest } from "payload";

import { getComponentVisualGateSnapshot } from "../admin-bff/component-visual-gate.ts";
import { buildEditableFieldHref } from "../admin-bff/surface-registry.ts";

import { getAdminUser } from "./access.ts";
import { buildMediaWorkspaceHref, getMediaWorkspaceSnapshot } from "./media-workspace.ts";
import { hasAdminRole, type AdminRole } from "./roles.ts";
import {
  buildTranslationWorkspaceHref,
  getTranslationsWorkspaceSnapshot,
} from "./translations-workspace.ts";

const checksWorkspaceReadRoles = [
  "owner",
  "admin",
  "content-editor",
  "translator",
  "developer",
] as const satisfies readonly AdminRole[];
export const checksWorkspaceRepairCommandRoles = checksWorkspaceReadRoles;
const checksWorkspacePublishRoles = ["owner", "admin"] as const satisfies readonly AdminRole[];

export const checksWorkspaceIds = [
  "site-health",
  "empty-images",
  "empty-alt-text",
  "empty-translations",
  "stale-translations",
  "long-text",
  "pages-without-cta",
  "products-without-photo",
  "products-without-form",
  "products-without-category",
  "broken-links",
  "custom-module-settings",
  "seo-problems",
  "unpublished-changes",
  "heavy-media",
  "unused-media",
  "form-errors",
] as const;

export type ChecksWorkspaceId = (typeof checksWorkspaceIds)[number];
type ChecksWorkspaceState = "ok" | "attention" | "manual" | "watch";
type GenericRecord = Record<string, unknown>;

type ChecksWorkspaceQuery = {
  check?: string | null;
};

type CheckSample = {
  href: string | null;
  label: string;
};

export type CheckRepairTarget = {
  href: string;
  label: string;
  ownerId: string | null;
  ownerType:
    | "block"
    | "category"
    | "form"
    | "media"
    | "module"
    | "page"
    | "product"
    | "seo"
    | "site"
    | "translation";
  fieldPath?: string;
};

export type CheckRepairAction = {
  command: "open-editor" | "open-media-assignment" | "open-seo-editor" | "open-translation-editor";
  href: string;
  id: string;
  label: string;
  method: "GET" | "POST";
  target: CheckRepairTarget;
};

export type CheckIssue = {
  actions: CheckRepairAction[];
  affectedObject: string;
  affectedRoute: string | null;
  id: string;
  previewImpact: string;
  reason: string;
  severity: "blocker" | "warning" | "watch";
  status: "open" | "watch";
  title: string;
};

export type ChecksWorkspaceCard = {
  automation: "automated" | "manual";
  count: number;
  description: string;
  detail: string;
  id: ChecksWorkspaceId;
  issues: CheckIssue[];
  openItemsHref: string | null;
  openItemsLabel: string | null;
  sampleItems: CheckSample[];
  state: ChecksWorkspaceState;
  statusLabel: string;
  title: string;
};

export type ChecksWorkspaceSnapshot = {
  activeCheck: ChecksWorkspaceId;
  canPublish: boolean;
  canRead: boolean;
  checks: ChecksWorkspaceCard[];
  emptyState: string;
  generatedAt: string;
  summary: {
    attention: number;
    automated: number;
    manual: number;
    ok: number;
    publishBlockers: number;
    watch: number;
  };
};

export type CheckRepairCommandResult = {
  action: CheckRepairAction;
  checkId: ChecksWorkspaceId;
  commandContract: "open-guided-editor-target";
  issue: CheckIssue;
  mutates: false;
  ok: true;
  targetHref: string;
};

function getArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSeoReadinessDisplay(value: string, fallback: string) {
  const next = value || fallback;

  switch (next) {
    case "preview-only":
      return "только для предварительного просмотра";
    case "published":
      return "ожидает финального SEO-согласования";
    case "draft":
      return "черновик";
    case "review":
      return "на проверке";
    case "approved":
      return "согласовано";
    default:
      return next || "нужна подготовка";
  }
}

function getId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as { id?: number | string | null };
    if (typeof record.id === "number" || typeof record.id === "string") {
      return record.id;
    }
  }

  return null;
}

function canReadChecksWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), checksWorkspaceReadRoles);
}

function buildPageFieldHref(page: GenericRecord, fieldPath: string) {
  return buildEditableFieldHref({
    fieldPath,
    ownerId: getId(page.id),
    ownerType: "page",
  });
}

function buildProductFieldHref(product: GenericRecord, fieldPath: string) {
  return buildEditableFieldHref({
    fieldPath,
    ownerId: getId(product.id),
    ownerType: "product",
  });
}

function buildFormFieldHref(form: GenericRecord, fieldPath: string) {
  return buildEditableFieldHref({
    fieldPath,
    ownerId: getId(form.id),
    ownerType: "form",
  });
}

function buildSeoFieldHref(entry: GenericRecord, fieldPath: string) {
  return buildEditableFieldHref({
    fieldPath,
    ownerId: getId(entry.id),
    ownerType: "seo",
  });
}

function buildCategoryFieldHref(category: GenericRecord, fieldPath: string) {
  const id = getId(category.id);
  const params = new URLSearchParams();
  params.set("focus", fieldPath);
  if (id != null) {
    params.set("category", String(id));
  }

  return `/admin/products?${params.toString()}`;
}

function buildStatusLabel(state: ChecksWorkspaceState, automation: "automated" | "manual") {
  if (automation === "manual") {
    return "ещё не автоматизировано";
  }

  switch (state) {
    case "attention":
      return "нужны правки";
    case "watch":
      return "проверить";
    default:
      return "в норме";
  }
}

function getPageLabel(page: GenericRecord) {
  return getText(page.title) || getText(page.navigationLabel) || getText(page.slug) || "Страница";
}

function getPageRoute(page: GenericRecord) {
  return getText(page.routePath) || getText(page.canonicalPath) || null;
}

function getProductLabel(product: GenericRecord) {
  return getText(product.name) || getText(product.publicLabel) || getText(product.slug) || "Товар";
}

function getProductRoute(product: GenericRecord) {
  const path = getText(product.canonicalPath);
  if (path) {
    return path;
  }

  const slug = getText(product.slug);
  return slug ? `/products/${slug}` : null;
}

function getCategoryLabel(category: GenericRecord) {
  return getText(category.name) || getText(category.publicLabel) || getText(category.slug) || "Категория";
}

function getFormLabel(form: GenericRecord) {
  return getText(form.title) || getText(form.slug) || "Форма";
}

function createRepairAction(input: {
  command?: CheckRepairAction["command"];
  fieldPath?: string;
  href: string;
  id: string;
  label: string;
  ownerId?: number | string | null;
  ownerType: CheckRepairTarget["ownerType"];
  targetLabel: string;
}): CheckRepairAction {
  return {
    command: input.command ?? "open-editor",
    href: input.href,
    id: input.id,
    label: input.label,
    method: "GET",
    target: {
      href: input.href,
      label: input.targetLabel,
      ownerId: input.ownerId == null ? null : String(input.ownerId),
      ownerType: input.ownerType,
      ...(input.fieldPath ? { fieldPath: input.fieldPath } : {}),
    },
  };
}

function createIssue(input: {
  action: CheckRepairAction;
  affectedObject: string;
  affectedRoute?: string | null;
  id: string;
  previewImpact: string;
  reason: string;
  severity: CheckIssue["severity"];
  title: string;
}): CheckIssue {
  return {
    actions: [input.action],
    affectedObject: input.affectedObject,
    affectedRoute: input.affectedRoute ?? null,
    id: input.id,
    previewImpact: input.previewImpact,
    reason: input.reason,
    severity: input.severity,
    status: input.severity === "watch" ? "watch" : "open",
    title: input.title,
  };
}

function toSamplesFromIssues(issues: CheckIssue[], limit = 3) {
  return issues.slice(0, limit).map((issue) => ({
    href: issue.actions[0]?.href ?? null,
    label: `${issue.affectedObject} · ${issue.title}`,
  }));
}

function isLikelyBrokenHref(value: string) {
  const href = value.trim();
  if (!href) {
    return false;
  }

  if (href === "#" || href.startsWith("TODO") || href.startsWith("todo:")) {
    return true;
  }

  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  return !href.startsWith("/");
}

function isPublishedFlowStatus(status: string) {
  return status === "published" || status === "review";
}

export function normalizeCheck(value: string | null | undefined): ChecksWorkspaceId {
  return checksWorkspaceIds.includes(value as ChecksWorkspaceId)
    ? (value as ChecksWorkspaceId)
    : "site-health";
}

function buildSitePreviewHref() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, "");
  return siteUrl || "http://89.150.34.66:8093";
}

export function buildChecksWorkspaceHref(options?: { check?: ChecksWorkspaceId | null }) {
  const params = new URLSearchParams();
  if (options?.check) {
    params.set("check", options.check);
  }

  const query = params.toString();
  return query ? `/admin/checks?${query}` : "/admin/checks";
}

export async function getChecksWorkspaceSnapshot(
  payload: Payload,
  req: PayloadRequest,
  input: ChecksWorkspaceQuery,
): Promise<ChecksWorkspaceSnapshot> {
  if (!canReadChecksWorkspace(req)) {
    throw new Error("forbidden");
  }

  const role = getAdminUser(req.user)?.role ?? null;
  const canPublish = role
    ? checksWorkspacePublishRoles.includes(role as (typeof checksWorkspacePublishRoles)[number])
    : false;

  const [
    pagesResult,
    pageSectionsResult,
    productsResult,
    categoriesResult,
    formsResult,
    seoEntriesResult,
    componentGateSnapshot,
    translationsSnapshot,
    mediaSnapshot,
  ] = await Promise.all([
    payload.find({
      collection: "pages",
      depth: 0,
      limit: 300,
      overrideAccess: true,
      pagination: false,
      sort: "routePath",
    }),
    payload.find({
      collection: "page-sections",
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: "updatedAt",
    }),
    payload.find({
      collection: "products",
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
    }),
    payload.find({
      collection: "product-categories",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
    }),
    payload.find({
      collection: "productInquiryForms",
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
    }),
    payload.find({
      collection: "seo-entries",
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    }),
    getComponentVisualGateSnapshot(payload, req, { locale: "ru" }),
    getTranslationsWorkspaceSnapshot(payload, req, {
      filter: "all",
      locale: null,
      ownerCollection: null,
      ownerKey: null,
      q: null,
    }),
    getMediaWorkspaceSnapshot(payload, req, {
      filter: "all",
      library: "all",
      q: null,
      selected: null,
    }),
  ]);

  const pages = pagesResult.docs as unknown as GenericRecord[];
  const pageSections = pageSectionsResult.docs as unknown as GenericRecord[];
  const products = productsResult.docs as unknown as GenericRecord[];
  const categories = categoriesResult.docs as unknown as GenericRecord[];
  const forms = formsResult.docs as unknown as GenericRecord[];
  const seoEntries = seoEntriesResult.docs as unknown as GenericRecord[];

  const sectionTypeById = new Map<string, string>();
  for (const section of pageSections) {
    const id = getId(section.id);
    if (id != null) {
      sectionTypeById.set(String(id), getText(section.sectionType));
    }
  }

  const publishedFlowPages = pages.filter((page) => isPublishedFlowStatus(getText(page.status)));
  const publishedFlowProducts = products.filter((product) =>
    isPublishedFlowStatus(getText(product.status)),
  );
  const publishedFlowCategories = categories.filter((category) =>
    isPublishedFlowStatus(getText(category.status)),
  );

  const publishedPageImageGaps = publishedFlowPages
    .filter((page) => getId(page.heroMedia) == null)
    .map((page) => {
      const label = getPageLabel(page);
      const href = buildPageFieldHref(page, "heroMedia");
      return createIssue({
        action: createRepairAction({
          command: "open-media-assignment",
          fieldPath: "heroMedia",
          href,
          id: "assign-page-hero-media",
          label: "Назначить изображение",
          ownerId: getId(page.id),
          ownerType: "page",
          targetLabel: label,
        }),
        affectedObject: label,
        affectedRoute: getPageRoute(page),
        id: `empty-images:page:${String(getId(page.id) ?? label)}`,
        previewImpact: "Страница выходит без главного визуала и выглядит незавершенной.",
        reason: "У страницы в режиме review/published не заполнено hero-изображение.",
        severity: "blocker",
        title: "Нет hero-изображения",
      });
    });

  const pagesWithoutCta = publishedFlowPages
    .filter((page) => {
      const hasSectionCta = getArray<GenericRecord>(page.sections).some((entry) => {
        const sectionId = getId((entry as GenericRecord).section ?? entry);
        return sectionId != null && sectionTypeById.get(String(sectionId)) === "cta";
      });
      const hasPlanCta = getArray<GenericRecord>(page.sectionPlan).some(
        (entry) => getText(entry.expectedType) === "cta",
      );

      return !hasSectionCta && !hasPlanCta;
    })
    .map((page) => {
      const label = getPageLabel(page);
      const href = buildPageFieldHref(page, "cta");
      return createIssue({
        action: createRepairAction({
          fieldPath: "cta",
          href,
          id: "open-page-cta-editor",
          label: "Открыть кнопку страницы",
          ownerId: getId(page.id),
          ownerType: "page",
          targetLabel: label,
        }),
        affectedObject: label,
        affectedRoute: getPageRoute(page),
        id: `pages-without-cta:page:${String(getId(page.id) ?? label)}`,
        previewImpact: "Пользователь не видит понятного следующего шага на странице.",
        reason: "У страницы нет блока с основной кнопкой ни в фактических секциях, ни в плане секций.",
        severity: "warning",
        title: "Нет основной кнопки",
      });
    });

  const approvedPrimaryForms = new Set<string>();
  for (const form of forms) {
    if (
      getText(form.status) === "published" &&
      getText(form.approvalStatus) === "approved" &&
      form.isPrimaryForLocale === true
    ) {
      const productId = getId(form.product);
      const locale = getText(form.locale) || getText(form.primaryLocale) || "en";
      if (productId != null) {
        approvedPrimaryForms.add(`${String(productId)}::${locale}`);
      }
    }
  }

  const productsWithoutPhoto = publishedFlowProducts
    .filter((product) => getId(product.heroAsset) == null || getId(product.coverCardAsset) == null)
    .map((product) => {
      const label = getProductLabel(product);
      const href = buildProductFieldHref(product, "heroAsset");
      return createIssue({
        action: createRepairAction({
          command: "open-media-assignment",
          fieldPath: "heroAsset",
          href,
          id: "assign-product-photo",
          label: "Назначить фото товара",
          ownerId: getId(product.id),
          ownerType: "product",
          targetLabel: label,
        }),
        affectedObject: label,
        affectedRoute: getProductRoute(product),
        id: `products-without-photo:product:${String(getId(product.id) ?? label)}`,
        previewImpact: "Карточка и PDP товара останутся без ключевого визуала.",
        reason: "У товара в режиме review/published нет hero или cover фото.",
        severity: "blocker",
        title: "Нет фото товара",
      });
    });

  const productsWithoutForm = publishedFlowProducts
    .filter((product) => {
      const productId = getId(product.id);
      if (productId == null) {
        return false;
      }

      const locale = getText(product.primaryLocale) || "en";
      return !approvedPrimaryForms.has(`${String(productId)}::${locale}`);
    })
    .map((product) => {
      const label = getProductLabel(product);
      const href = buildProductFieldHref(product, "inquiryForm");
      return createIssue({
        action: createRepairAction({
          fieldPath: "inquiryForm",
          href,
          id: "assign-product-form",
          label: "Назначить форму заявки",
          ownerId: getId(product.id),
          ownerType: "product",
          targetLabel: label,
        }),
        affectedObject: label,
        affectedRoute: getProductRoute(product),
        id: `products-without-form:product:${String(getId(product.id) ?? label)}`,
        previewImpact: "Клиент не сможет отправить полноценную заявку по товару.",
        reason: "Для основной локали товара нет опубликованной и утвержденной формы.",
        severity: "blocker",
        title: "Нет основной формы заявки",
      });
    });

  const productsWithoutCategory = publishedFlowProducts
    .filter((product) => getId(product.category) == null)
    .map((product) => {
      const label = getProductLabel(product);
      const href = buildProductFieldHref(product, "category");
      return createIssue({
        action: createRepairAction({
          fieldPath: "category",
          href,
          id: "assign-product-category",
          label: "Назначить категорию",
          ownerId: getId(product.id),
          ownerType: "product",
          targetLabel: label,
        }),
        affectedObject: label,
        affectedRoute: getProductRoute(product),
        id: `products-without-category:product:${String(getId(product.id) ?? label)}`,
        previewImpact: "Товар может выпасть из каталогов, меню и фильтров.",
        reason: "У товара в режиме review/published не назначена категория.",
        severity: "blocker",
        title: "Не назначена категория",
      });
    });

  const seoReadyPageOwners = new Set<string>();
  const seoReadyProductOwners = new Set<string>();
  const seoReadyCategoryOwners = new Set<string>();
  const blockedSeoItems: CheckIssue[] = [];

  for (const entry of seoEntries) {
    const ownerType = getText(entry.ownerType);
    const publicationReadiness = getText(entry.publicationReadiness);
    const approvalStatus = getText(entry.approvalStatus);
    const status = getText(entry.status);
    const ownerLabel = getText(entry.ownerLabel) || getText(entry.internalCode) || "SEO-настройка";

    if (
      status !== "published" ||
      publicationReadiness !== "production-ready" ||
      approvalStatus !== "approved"
    ) {
      const href = buildSeoFieldHref(entry, "publicationReadiness");
      blockedSeoItems.push(
        createIssue({
          action: createRepairAction({
            command: "open-seo-editor",
            fieldPath: "publicationReadiness",
            href,
            id: "open-seo-readiness",
            label: "Открыть SEO-готовность",
            ownerId: getId(entry.id),
            ownerType: "seo",
            targetLabel: ownerLabel,
          }),
          affectedObject: ownerLabel,
          affectedRoute: null,
          id: `seo-problems:seo:${String(getId(entry.id) ?? ownerLabel)}`,
          previewImpact: "Страница или товар могут выйти с неполным title, description или индексируемостью.",
          reason: `SEO требует подготовки: ${getSeoReadinessDisplay(publicationReadiness, status)}.`,
          severity: "blocker",
          title: "SEO не готово к публикации",
        }),
      );
    }

    if (status === "published" && publicationReadiness === "production-ready" && approvalStatus === "approved") {
      if (ownerType === "page") {
        const ownerId = getId(entry.ownerPage);
        if (ownerId != null) {
          seoReadyPageOwners.add(String(ownerId));
        }
      }
      if (ownerType === "product") {
        const ownerId = getId(entry.ownerProduct);
        if (ownerId != null) {
          seoReadyProductOwners.add(String(ownerId));
        }
      }
      if (ownerType === "product-category") {
        const ownerId = getId(entry.ownerCategory);
        if (ownerId != null) {
          seoReadyCategoryOwners.add(String(ownerId));
        }
      }
    }
  }

  const missingSeoCoverage = [
    ...publishedFlowPages
      .filter((page) => {
        const id = getId(page.id);
        return id != null && !seoReadyPageOwners.has(String(id));
      })
      .map((page) => {
        const label = getPageLabel(page);
        const href = buildPageFieldHref(page, "seo");
        return createIssue({
          action: createRepairAction({
            command: "open-seo-editor",
            fieldPath: "seo",
            href,
            id: "open-page-seo",
            label: "Открыть SEO страницы",
            ownerId: getId(page.id),
            ownerType: "page",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: getPageRoute(page),
          id: `seo-problems:page:${String(getId(page.id) ?? label)}`,
          previewImpact: "Релизная страница не имеет готового SEO-покрытия.",
          reason: "Для страницы нет готового к выпуску SEO-пакета.",
          severity: "blocker",
          title: "Нет готового SEO",
        });
      }),
    ...publishedFlowProducts
      .filter((product) => {
        const id = getId(product.id);
        return id != null && !seoReadyProductOwners.has(String(id));
      })
      .map((product) => {
        const label = getProductLabel(product);
        const href = buildProductFieldHref(product, "seo");
        return createIssue({
          action: createRepairAction({
            command: "open-seo-editor",
            fieldPath: "seo",
            href,
            id: "open-product-seo",
            label: "Открыть SEO товара",
            ownerId: getId(product.id),
            ownerType: "product",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: getProductRoute(product),
          id: `seo-problems:product:${String(getId(product.id) ?? label)}`,
          previewImpact: "PDP товара не имеет готового SEO-покрытия.",
          reason: "Для товара нет готового к выпуску SEO-пакета.",
          severity: "blocker",
          title: "Нет готового SEO",
        });
      }),
    ...publishedFlowCategories
      .filter((category) => {
        const id = getId(category.id);
        return id != null && !seoReadyCategoryOwners.has(String(id));
      })
      .map((category) => {
        const label = getCategoryLabel(category);
        const href = buildCategoryFieldHref(category, "seo");
        return createIssue({
          action: createRepairAction({
            command: "open-seo-editor",
            fieldPath: "seo",
            href,
            id: "open-category-seo",
            label: "Открыть SEO категории",
            ownerId: getId(category.id),
            ownerType: "category",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: null,
          id: `seo-problems:category:${String(getId(category.id) ?? label)}`,
          previewImpact: "Категория может выйти без корректного SEO-покрытия.",
          reason: "Для категории нет готового к выпуску SEO-пакета.",
          severity: "blocker",
          title: "Нет готового SEO",
        });
      }),
  ];

  const unpublishedChanges = [
    ...pages
      .filter((page) => {
        const status = getText(page.status);
        return status === "draft" || status === "review";
      })
      .map((page) => {
        const label = getPageLabel(page);
        const href = buildPageFieldHref(page, "publication");
        return createIssue({
          action: createRepairAction({
            fieldPath: "publication",
            href,
            id: "open-page-publication",
            label: "Открыть публикацию страницы",
            ownerId: getId(page.id),
            ownerType: "page",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: getPageRoute(page),
          id: `unpublished-changes:page:${String(getId(page.id) ?? label)}`,
          previewImpact: "Изменения ещё не дошли до live-версии.",
          reason: `Статус страницы: ${getText(page.status) || "draft"}.`,
          severity: "watch",
          title: "Страница не опубликована",
        });
      }),
    ...products
      .filter((product) => {
        const status = getText(product.status);
        return status === "draft" || status === "review";
      })
      .map((product) => {
        const label = getProductLabel(product);
        const href = buildProductFieldHref(product, "publication");
        return createIssue({
          action: createRepairAction({
            fieldPath: "publication",
            href,
            id: "open-product-publication",
            label: "Открыть публикацию товара",
            ownerId: getId(product.id),
            ownerType: "product",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: getProductRoute(product),
          id: `unpublished-changes:product:${String(getId(product.id) ?? label)}`,
          previewImpact: "Карточка товара ещё не вышла в live.",
          reason: `Статус товара: ${getText(product.status) || "draft"}.`,
          severity: "watch",
          title: "Товар не опубликован",
        });
      }),
    ...forms
      .filter((form) => {
        const status = getText(form.status);
        return status === "draft" || status === "review";
      })
      .map((form) => {
        const label = getFormLabel(form);
        const href = buildFormFieldHref(form, "publication");
        return createIssue({
          action: createRepairAction({
            fieldPath: "publication",
            href,
            id: "open-form-publication",
            label: "Открыть публикацию формы",
            ownerId: getId(form.id),
            ownerType: "form",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: null,
          id: `unpublished-changes:form:${String(getId(form.id) ?? label)}`,
          previewImpact: "Форма ещё не готова для публичной заявки.",
          reason: `Статус формы: ${getText(form.status) || "draft"}.`,
          severity: "watch",
          title: "Форма не опубликована",
        });
      }),
  ];

  const translationMissing = translationsSnapshot.cards
    .filter((card) => card.isMissing)
    .map((card) => {
      const href = buildTranslationWorkspaceHref({
        filter: "missing",
        locale: card.targetLocale,
        ownerCollection: card.ownerCollection,
        ownerKey: card.ownerKey,
      });
      return createIssue({
        action: createRepairAction({
          command: "open-translation-editor",
          fieldPath: "content",
          href,
          id: "open-missing-translation",
          label: "Открыть перевод",
          ownerId: card.id,
          ownerType: "translation",
          targetLabel: `${card.ownerLabel} · ${card.targetLocale.toUpperCase()}`,
        }),
        affectedObject: card.ownerLabel,
        affectedRoute: card.targetRoutePath || card.ownerRoutePath || null,
        id: `empty-translations:translation:${card.id}`,
        previewImpact: "Языковая версия останется пустой или неполной.",
        reason: `Перевод ${card.targetLocale.toUpperCase()} не заполнен для выбранного объекта.`,
        severity: "watch",
        title: "Пустой перевод",
      });
    });

  const translationStale = translationsSnapshot.cards
    .filter((card) => card.filterMatch === "stale")
    .map((card) => {
      const href = buildTranslationWorkspaceHref({
        filter: "stale",
        locale: card.targetLocale,
        ownerCollection: card.ownerCollection,
        ownerKey: card.ownerKey,
      });
      return createIssue({
        action: createRepairAction({
          command: "open-translation-editor",
          fieldPath: "content",
          href,
          id: "open-stale-translation",
          label: "Обновить перевод",
          ownerId: card.id,
          ownerType: "translation",
          targetLabel: `${card.ownerLabel} · ${card.targetLocale.toUpperCase()}`,
        }),
        affectedObject: card.ownerLabel,
        affectedRoute: card.targetRoutePath || card.ownerRoutePath || null,
        id: `stale-translations:translation:${card.id}`,
        previewImpact: "Языковая версия может отставать от исходного текста.",
        reason: `Исходный текст изменился, перевод ${card.targetLocale.toUpperCase()} нужно обновить.`,
        severity: "watch",
        title: "Устаревший перевод",
      });
    });

  const altTextIssues = mediaSnapshot.cards
    .filter(
      (card) =>
        card.recordType === "asset" &&
        card.warnings.some((warning) => warning.includes("Alt text is missing")),
    )
    .map((card) =>
      createIssue({
        action: createRepairAction({
          command: "open-media-assignment",
          fieldPath: "altText",
          href: card.href,
          id: "open-media-alt-text",
          label: "Заполнить alt-текст",
          ownerId: card.id,
          ownerType: "media",
          targetLabel: card.title,
        }),
        affectedObject: card.title,
        affectedRoute: null,
        id: `empty-alt-text:media:${card.id}`,
        previewImpact: "SEO и доступность публичного изображения ослаблены.",
        reason: "Публичное изображение, готовое к выпуску, не имеет alt-текста.",
        severity: "blocker",
        title: "Нет alt-текста",
      }),
    );

  const heavyMedia = mediaSnapshot.cards
    .filter((card) => card.warnings.some((warning) => warning.includes("Heavy file")))
    .map((card) =>
      createIssue({
        action: createRepairAction({
          command: "open-media-assignment",
          fieldPath: "filesize",
          href: card.href,
          id: "open-heavy-media",
          label: "Открыть файл",
          ownerId: card.id,
          ownerType: "media",
          targetLabel: card.title,
        }),
        affectedObject: card.title,
        affectedRoute: null,
        id: `heavy-media:media:${card.id}`,
        previewImpact: "Тяжёлый файл может ухудшить загрузку страницы.",
        reason: "Медиатека пометила файл как слишком тяжёлый.",
        severity: "watch",
        title: "Тяжёлый файл",
      }),
    );

  const unusedMedia = mediaSnapshot.cards
    .filter((card) => card.warnings.some((warning) => warning.includes("Unused asset")))
    .map((card) =>
      createIssue({
        action: createRepairAction({
          command: "open-media-assignment",
          fieldPath: "usage",
          href: card.href,
          id: "open-unused-media",
          label: "Решить судьбу файла",
          ownerId: card.id,
          ownerType: "media",
          targetLabel: card.title,
        }),
        affectedObject: card.title,
        affectedRoute: null,
        id: `unused-media:media:${card.id}`,
        previewImpact: "Файл занимает библиотеку, но не участвует в публичных поверхностях.",
        reason: "Медиатека не нашла связей файла со страницами, товарами или документами.",
        severity: "watch",
        title: "Файл не используется",
      }),
    );

  const longTextIssues = pageSections.flatMap((section) => {
    const label = getText(section.previewLabel) || getText(section.title) || getText(section.sectionKey) || "Блок";
    const sectionId = getId(section.id);
    const fields = [
      ["title", getText(section.title), 96],
      ["subtitle", getText(section.subtitle), 140],
      ["body", getText(section.body), 520],
      ["editorialSummary", getText(section.editorialSummary), 240],
    ] as const;

    return fields
      .filter(([, value, limit]) => value.length > limit)
      .map(([fieldPath, value, limit]) => {
        const href = buildEditableFieldHref({
          fieldPath,
          ownerId: sectionId,
          ownerType: "block",
        });
        return createIssue({
          action: createRepairAction({
            fieldPath,
            href,
            id: "open-long-text-field",
            label: "Сократить текст",
            ownerId: sectionId,
            ownerType: "block",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: null,
          id: `long-text:block:${String(sectionId ?? label)}:${fieldPath}`,
          previewImpact: "Длинный текст может ломать компактную админскую и публичную верстку.",
          reason: `Поле ${fieldPath} содержит ${value.length} символов при лимите ${limit}.`,
          severity: "warning",
          title: "Слишком длинный текст",
        });
      });
  });

  const brokenLinkIssues = pageSections.flatMap((section) => {
    const ctaContent = (section.ctaContent ?? {}) as GenericRecord;
    const label = getText(section.previewLabel) || getText(section.title) || getText(section.sectionKey) || "Блок с кнопкой";
    const sectionId = getId(section.id);
    const fields = [
      ["ctaContent.primaryTarget", getText(ctaContent.primaryTarget), "Основная ссылка кнопки"],
      ["ctaContent.secondaryTarget", getText(ctaContent.secondaryTarget), "Вторая ссылка кнопки"],
    ] as const;

    return fields
      .filter(([, href]) => isLikelyBrokenHref(href))
      .map(([fieldPath, hrefValue, title]) => {
        const href = buildEditableFieldHref({
          fieldPath,
          ownerId: sectionId,
          ownerType: "block",
        });
        return createIssue({
          action: createRepairAction({
            fieldPath,
            href,
            id: "open-broken-cta-link",
            label: "Исправить ссылку",
            ownerId: sectionId,
            ownerType: "block",
            targetLabel: label,
          }),
          affectedObject: label,
          affectedRoute: null,
          id: `broken-links:block:${String(sectionId ?? label)}:${fieldPath}`,
          previewImpact: "Кнопка может не привести клиента к нужному действию.",
          reason: `${title} выглядит некорректно: ${hrefValue}.`,
          severity: "warning",
          title: "Битая ссылка кнопки",
        });
      });
  });

  const customModuleIssues = componentGateSnapshot.issues.map((issue) =>
    createIssue({
      action: createRepairAction({
        fieldPath: issue.fieldPath,
        href: issue.editorHref,
        id: "open-visual-block-target",
        label: "Открыть визуальный блок",
        ownerId: issue.moduleId,
        ownerType: "module",
        targetLabel: issue.moduleLabel,
      }),
      affectedObject: issue.moduleLabel,
      affectedRoute: issue.routePath,
      id: issue.id,
      previewImpact: "Админка должна знать, где этот публичный блок используется и что именно можно менять.",
      reason: issue.reason,
      severity: issue.severity,
      title: issue.title,
    }),
  );

  const publishBlockerCount =
    publishedPageImageGaps.length +
    pagesWithoutCta.length +
    productsWithoutPhoto.length +
    productsWithoutForm.length +
    productsWithoutCategory.length +
    altTextIssues.length +
    brokenLinkIssues.length +
    blockedSeoItems.length +
    missingSeoCoverage.length;

  const cards: ChecksWorkspaceCard[] = [
    {
      automation: "automated",
      count: publishBlockerCount,
      description:
        publishBlockerCount > 0
          ? `${publishBlockerCount} автоматических сигнала мешают выпуску или требуют ручного решения перед публикацией.`
          : "Критичных автоматических блокеров перед выпуском сейчас не найдено.",
      detail:
        publishBlockerCount > 0
          ? "Сводка собирает только реальные сигналы из страниц, товаров, SEO, переводов и медиа. Ничего не подкрашено в зелёный без данных."
          : "Автоматические проверки не нашли явных блокеров. Перед выпуском всё равно пройдите короткий owner preview.",
      id: "site-health",
      issues: [
        ...publishedPageImageGaps,
        ...pagesWithoutCta,
        ...productsWithoutPhoto,
        ...productsWithoutForm,
        ...productsWithoutCategory,
        ...blockedSeoItems,
        ...missingSeoCoverage,
        ...brokenLinkIssues,
      ],
      openItemsHref: buildSitePreviewHref(),
      openItemsLabel: "Открыть preview сайта",
      sampleItems: toSamplesFromIssues(
        [
          ...publishedPageImageGaps,
          ...pagesWithoutCta,
          ...productsWithoutPhoto,
          ...productsWithoutForm,
          ...productsWithoutCategory,
          ...blockedSeoItems,
          ...missingSeoCoverage,
          ...brokenLinkIssues,
        ],
        4,
      ),
      state: publishBlockerCount > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(publishBlockerCount > 0 ? "attention" : "ok", "automated"),
      title: "Общее здоровье сайта",
    },
    {
      automation: "automated",
      count: publishedPageImageGaps.length,
      description:
        publishedPageImageGaps.length > 0
          ? "Страницы в review/published режиме остались без главного визуала."
          : "Пустых hero-изображений на страницах review/published не найдено.",
      detail: "Сейчас автоматизация проверяет отсутствие hero-изображения у страниц, которые уже близки к выпуску.",
      id: "empty-images",
      issues: publishedPageImageGaps,
      openItemsHref: "/admin/site",
      openItemsLabel: "Открыть страницы",
      sampleItems: toSamplesFromIssues(publishedPageImageGaps),
      state: publishedPageImageGaps.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(publishedPageImageGaps.length > 0 ? "attention" : "ok", "automated"),
      title: "Пустые изображения",
    },
    {
      automation: "automated",
      count: altTextIssues.length,
      description:
        altTextIssues.length > 0
          ? "Публичные файлы, готовые для сайта, без alt-текста мешают SEO и доступности."
          : "Готовых для сайта медиа с пустым alt-текстом не найдено.",
      detail: "Проверка смотрит только на публичные файлы, которые уже отмечены как готовые для сайта.",
      id: "empty-alt-text",
      issues: altTextIssues,
      openItemsHref: buildMediaWorkspaceHref({ filter: "missing-metadata" }),
      openItemsLabel: "Открыть медиа",
      sampleItems: toSamplesFromIssues(altTextIssues),
      state: altTextIssues.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(altTextIssues.length > 0 ? "attention" : "ok", "automated"),
      title: "Пустой alt-текст",
    },
    {
      automation: "automated",
      count: translationMissing.length,
      description:
        translationMissing.length > 0
          ? "Есть пустые переводы по языкам запуска."
          : "Пустых переводов в очереди не найдено.",
      detail: "Сигнал собирается из очереди переводов и показывает пустые места по языкам запуска.",
      id: "empty-translations",
      issues: translationMissing,
      openItemsHref: buildTranslationWorkspaceHref({ filter: "missing" }),
      openItemsLabel: "Открыть переводы",
      sampleItems: toSamplesFromIssues(translationMissing),
      state: translationMissing.length > 0 ? "watch" : "ok",
      statusLabel: buildStatusLabel(translationMissing.length > 0 ? "watch" : "ok", "automated"),
      title: "Пустые переводы",
    },
    {
      automation: "automated",
      count: translationStale.length,
      description:
        translationStale.length > 0
          ? "Исходный текст уже обновился, а связанные переводы ещё не пересобраны."
          : "Устаревших переводов сейчас не найдено.",
      detail: "Сигнал показывает случаи, когда основной текст изменился, а переводы отстали.",
      id: "stale-translations",
      issues: translationStale,
      openItemsHref: buildTranslationWorkspaceHref({ filter: "stale" }),
      openItemsLabel: "Открыть устаревшие переводы",
      sampleItems: toSamplesFromIssues(translationStale),
      state: translationStale.length > 0 ? "watch" : "ok",
      statusLabel: buildStatusLabel(translationStale.length > 0 ? "watch" : "ok", "automated"),
      title: "Устаревшие переводы",
    },
    {
      automation: "automated",
      count: longTextIssues.length,
      description:
        longTextIssues.length > 0
          ? "Найдены тексты, которые превышают безопасные лимиты для компактных поверхностей."
          : "Слишком длинных текстов по текущим лимитам не найдено.",
      detail:
        "Проверка использует conservative лимиты для заголовков, подзаголовков, body и summary в блоках страниц.",
      id: "long-text",
      issues: longTextIssues,
      openItemsHref: "/admin/site",
      openItemsLabel: "Открыть редактор страниц",
      sampleItems: toSamplesFromIssues(longTextIssues),
      state: longTextIssues.length > 0 ? "watch" : "ok",
      statusLabel: buildStatusLabel(longTextIssues.length > 0 ? "watch" : "ok", "automated"),
      title: "Слишком длинные тексты",
    },
    {
      automation: "automated",
      count: pagesWithoutCta.length,
      description:
        pagesWithoutCta.length > 0
          ? "Часть страниц на проверке или опубликованных идёт без блока с основной кнопкой."
          : "Страниц на проверке или опубликованных без блока с основной кнопкой не найдено.",
      detail: "Проверка читает реальные блоки страницы и показывает только фактические пропуски основных кнопок.",
      id: "pages-without-cta",
      issues: pagesWithoutCta,
      openItemsHref: "/admin/site",
      openItemsLabel: "Открыть страницы",
      sampleItems: toSamplesFromIssues(pagesWithoutCta),
      state: pagesWithoutCta.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(pagesWithoutCta.length > 0 ? "attention" : "ok", "automated"),
      title: "Страницы без основной кнопки",
    },
    {
      automation: "automated",
      count: productsWithoutPhoto.length,
      description:
        productsWithoutPhoto.length > 0
          ? "У товаров в review/published не хватает hero или cover фото."
          : "Товаров review/published без hero/card фото не найдено.",
      detail: "Для этого сигнала товар считается неполным, если у релизной карточки нет главного или карточного фото.",
      id: "products-without-photo",
      issues: productsWithoutPhoto,
      openItemsHref: "/admin/products",
      openItemsLabel: "Открыть товары",
      sampleItems: toSamplesFromIssues(productsWithoutPhoto),
      state: productsWithoutPhoto.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(productsWithoutPhoto.length > 0 ? "attention" : "ok", "automated"),
      title: "Товары без фото",
    },
    {
      automation: "automated",
      count: productsWithoutForm.length,
      description:
        productsWithoutForm.length > 0
          ? "Есть товары в review/published без утвержденной основной формы заявки."
          : "Товаров review/published без основной формы не найдено.",
      detail: "Сигнал смотрит только на основную утвержденную форму заявки у опубликованного товара.",
      id: "products-without-form",
      issues: productsWithoutForm,
      openItemsHref: "/admin/site-admin",
      openItemsLabel: "Открыть формы",
      sampleItems: toSamplesFromIssues(productsWithoutForm),
      state: productsWithoutForm.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(productsWithoutForm.length > 0 ? "attention" : "ok", "automated"),
      title: "Товары без формы",
    },
    {
      automation: "automated",
      count: productsWithoutCategory.length,
      description:
        productsWithoutCategory.length > 0
          ? "Есть товары в review/published без привязки к категории."
          : "Товаров review/published без категории не найдено.",
      detail: "Сигнал нужен, чтобы owner видел продуктовые карточки, которые выпадут из навигации и каталогов.",
      id: "products-without-category",
      issues: productsWithoutCategory,
      openItemsHref: "/admin/products",
      openItemsLabel: "Открыть товары",
      sampleItems: toSamplesFromIssues(productsWithoutCategory),
      state: productsWithoutCategory.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(productsWithoutCategory.length > 0 ? "attention" : "ok", "automated"),
      title: "Товары без категории",
    },
    {
      automation: "automated",
      count: brokenLinkIssues.length,
      description:
        brokenLinkIssues.length > 0
          ? "Есть ссылки кнопок, которые выглядят как пустые, черновые или некорректные."
          : "Некорректных ссылок кнопок по текущим правилам не найдено.",
      detail:
        "Проверка ловит пустые, #, TODO и относительные ссылки без начального slash у блоков с кнопками.",
      id: "broken-links",
      issues: brokenLinkIssues,
      openItemsHref: "/admin/site",
      openItemsLabel: "Открыть кнопки страниц",
      sampleItems: toSamplesFromIssues(brokenLinkIssues),
      state: brokenLinkIssues.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(brokenLinkIssues.length > 0 ? "attention" : "ok", "automated"),
      title: "Битые ссылки",
    },
    {
      automation: "automated",
      count: customModuleIssues.length,
      description:
        customModuleIssues.length > 0
          ? "Есть визуальные блоки, где нужно уточнить связку, проверку или следующий шаг перед перестройкой рабочей панели."
          : "Карта визуальных блоков не нашла открытых связок.",
      detail:
        "Сигнал связывает публичную страницу, визуальный блок, поле и понятный экран правки, чтобы рабочая панель не стала пустой оболочкой.",
      id: "custom-module-settings",
      issues: customModuleIssues,
      openItemsHref: "/admin/site-modules",
      openItemsLabel: "Открыть визуальные блоки",
      sampleItems: toSamplesFromIssues(customModuleIssues, 4),
      state: customModuleIssues.length > 0 ? "watch" : "ok",
      statusLabel: buildStatusLabel(customModuleIssues.length > 0 ? "watch" : "ok", "automated"),
      title: "Визуальные блоки сайта",
    },
    {
      automation: "automated",
      count: blockedSeoItems.length + missingSeoCoverage.length,
      description:
        blockedSeoItems.length + missingSeoCoverage.length > 0
          ? "Есть SEO-настройки в черновике или на проверке, а также релизные страницы и товары без полного SEO-покрытия."
          : "Критичных SEO-проблем по release-ready сущностям не найдено.",
      detail: "Сигнал объединяет проблемные SEO-настройки и отсутствие готового SEO у страниц, товаров и категорий.",
      id: "seo-problems",
      issues: [...blockedSeoItems, ...missingSeoCoverage],
      openItemsHref: "/admin/site-admin?section=seo",
      openItemsLabel: "Открыть SEO",
      sampleItems: toSamplesFromIssues([...blockedSeoItems, ...missingSeoCoverage], 4),
      state: blockedSeoItems.length + missingSeoCoverage.length > 0 ? "attention" : "ok",
      statusLabel: buildStatusLabel(
        blockedSeoItems.length + missingSeoCoverage.length > 0 ? "attention" : "ok",
        "automated",
      ),
      title: "SEO-проблемы",
    },
    {
      automation: "automated",
      count: unpublishedChanges.length,
      description:
        unpublishedChanges.length > 0
          ? "Есть страницы, товары или формы в draft/review, которые ещё не дошли до live."
          : "Незавершённых черновиков и материалов на проверке сейчас не найдено.",
      detail: "Сводка показывает незавершённый публичный контент без притворства, что всё уже опубликовано.",
      id: "unpublished-changes",
      issues: unpublishedChanges,
      openItemsHref: "/admin/site?focus=publication",
      openItemsLabel: "Открыть черновики",
      sampleItems: toSamplesFromIssues(unpublishedChanges, 4),
      state: unpublishedChanges.length > 0 ? "watch" : "ok",
      statusLabel: buildStatusLabel(unpublishedChanges.length > 0 ? "watch" : "ok", "automated"),
      title: "Неопубликованные изменения",
    },
    {
      automation: "automated",
      count: heavyMedia.length,
      description:
        heavyMedia.length > 0
          ? "Часть публичных материалов слишком тяжелая для широкой выдачи."
          : "Тяжёлых медиа-файлов в рабочей очереди не найдено.",
      detail: "Проверка использует реальные предупреждения медиатеки о тяжёлых файлах.",
      id: "heavy-media",
      issues: heavyMedia,
      openItemsHref: "/admin/media",
      openItemsLabel: "Открыть медиа",
      sampleItems: toSamplesFromIssues(heavyMedia),
      state: heavyMedia.length > 0 ? "watch" : "ok",
      statusLabel: buildStatusLabel(heavyMedia.length > 0 ? "watch" : "ok", "automated"),
      title: "Тяжёлые медиа",
    },
    {
      automation: "automated",
      count: unusedMedia.length,
      description:
        unusedMedia.length > 0
          ? "В библиотеке есть файлы без текущего использования на страницах, товарах или документах."
          : "Неиспользуемых файлов в медиатеке не найдено.",
      detail: "Проверка показывает только файлы без текущих связей со страницами, товарами или документами.",
      id: "unused-media",
      issues: unusedMedia,
      openItemsHref: buildMediaWorkspaceHref({ filter: "unlinked" }),
      openItemsLabel: "Открыть неиспользуемые файлы",
      sampleItems: toSamplesFromIssues(unusedMedia),
      state: unusedMedia.length > 0 ? "watch" : "ok",
      statusLabel: buildStatusLabel(unusedMedia.length > 0 ? "watch" : "ok", "automated"),
      title: "Неиспользуемые медиа",
    },
    {
      automation: "manual",
      count: 0,
      description: "Фронтовой прогон ошибок формы ещё не выведен в owner-friendly очередь.",
      detail:
        "Следующий шаг: добавить автоматическую проверку публичных форм, текста после отправки и правил уведомлений без технических деталей.",
      id: "form-errors",
      issues: [],
      openItemsHref: null,
      openItemsLabel: null,
      sampleItems: [],
      state: "manual",
      statusLabel: buildStatusLabel("manual", "manual"),
      title: "Ошибки форм",
    },
  ];

  return {
    activeCheck: normalizeCheck(input.check),
    canPublish,
    canRead: true,
    checks: cards,
    emptyState: "Проверки пока не готовы. Обновите seed/runtime и откройте страницу снова.",
    generatedAt: new Date().toISOString(),
    summary: {
      attention: cards.filter((card) => card.state === "attention").length,
      automated: cards.filter((card) => card.automation === "automated").length,
      manual: cards.filter((card) => card.automation === "manual").length,
      ok: cards.filter((card) => card.state === "ok").length,
      publishBlockers: publishBlockerCount,
      watch: cards.filter((card) => card.state === "watch").length,
    },
  };
}

export async function getChecksWorkspaceIssues(
  payload: Payload,
  req: PayloadRequest,
  input: ChecksWorkspaceQuery,
) {
  const snapshot = await getChecksWorkspaceSnapshot(payload, req, input);
  const checkId = normalizeCheck(input.check);
  const card = snapshot.checks.find((entry) => entry.id === checkId);

  if (!card) {
    throw new Error("invalid-input");
  }

  return {
    activeCheck: snapshot.activeCheck,
    check: card,
    generatedAt: snapshot.generatedAt,
    issues: card.issues,
  };
}

export async function executeChecksRepairAction(
  payload: Payload,
  req: PayloadRequest,
  input: {
    actionId?: string | null;
    checkId: string;
    issueId: string;
  },
) {
  const issuesState = await getChecksWorkspaceIssues(payload, req, {
    check: input.checkId,
  });
  const issue = issuesState.issues.find((entry) => entry.id === input.issueId);

  if (!issue) {
    throw new Error("invalid-input");
  }

  const action =
    issue.actions.find((entry) => entry.id === input.actionId) ??
    issue.actions[0] ??
    null;

  if (!action) {
    throw new Error("no-op");
  }

  return {
    action,
    checkId: issuesState.check.id,
    commandContract: "open-guided-editor-target",
    issue,
    mutates: false,
    ok: true,
    targetHref: action.href,
  } satisfies CheckRepairCommandResult;
}
