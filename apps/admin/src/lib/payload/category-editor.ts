import type { CollectionSlug, Payload, PayloadRequest, Where } from "payload";

import { buildProductCategoryPreviewUrl } from "./preview-url.ts";
import { buildTranslationWorkspaceHref } from "./translations-workspace.ts";
import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";
import { getAdminUser, publishingAccess } from "./access.ts";
import { hasAdminRole, type AdminRole, technicalAdminRoles } from "./roles.ts";

type CategoryRecord = Record<string, unknown>;

export type CategoryEditorChecklistState = "ready" | "attention" | "blocked";

export type CategoryEditorChecklistItem = {
  detail: string;
  href?: string;
  id: string;
  label: string;
  state: CategoryEditorChecklistState;
};

export type CategoryEditorLinkedWorkspace = {
  count: number;
  description: string;
  href: string;
  id: string;
  label: string;
};

export type CategoryEditorSnapshot = {
  blockers: CategoryEditorChecklistItem[];
  checklist: CategoryEditorChecklistItem[];
  lineCount: number;
  linkedWorkspaces: CategoryEditorLinkedWorkspace[];
  productCount: number;
  publicUrl: string;
  publishedTranslationCount: number;
  seoApprovedCount: number;
  seoCount: number;
  translationCount: number;
};

export type CategoryEditorActionHrefs = {
  categoryList: string;
  createCategory: string;
  createLine: string;
  createProduct: string;
  productList: string;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value: unknown) {
  return value === true;
}

function asCategoryRecord<T extends object>(category: T) {
  return category as CategoryRecord;
}

function getCategoryId(category: CategoryRecord) {
  const id = category.id;
  return typeof id === "number" || typeof id === "string" ? id : undefined;
}

function getCategorySlug(category: CategoryRecord) {
  return getText(category.slug);
}

function getCategoryLocale(category: CategoryRecord) {
  return getText(category.primaryLocale) || "en";
}

function normalizeLocalePath(path: string, locale: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const localePrefix = `/${locale}`;

  if (normalizedPath === localePrefix || normalizedPath.startsWith(`${localePrefix}/`)) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return localePrefix;
  }

  return `${localePrefix}${normalizedPath}`;
}

function buildCollectionHref(collection: string, filters: Array<[string, string | number]>) {
  const params = new URLSearchParams();

  for (const [key, value] of filters) {
    params.set(key, String(value));
  }

  const query = params.toString();
  return buildAdvancedCollectionHref(collection, { query });
}

export function getCategoryEditorActionHrefs(): CategoryEditorActionHrefs {
  return {
    categoryList: buildAdvancedCollectionHref("product-categories", {
      label: "Список категорий",
      query: "sort=order&limit=25",
    }),
    createCategory: buildAdvancedCollectionHref("product-categories", {
      action: "create",
      label: "Создать категорию",
    }),
    createLine: buildAdvancedCollectionHref("product-lines", {
      action: "create",
      label: "Создать подкатегорию",
    }),
    createProduct: buildAdvancedCollectionHref("products", {
      action: "create",
      label: "Создать продукт",
    }),
    productList: buildAdvancedCollectionHref("products", {
      label: "Список продуктов",
      query: "sort=order&limit=25",
    }),
  };
}

function createOwnerRecordWhere(slug: string, internalCode: string): Where {
  if (slug && internalCode) {
    return {
      and: [
        {
          ownerCollection: {
            equals: "product-categories",
          },
        },
        {
          or: [
            {
              ownerRecordKey: {
                equals: slug,
              },
            },
            {
              ownerRecordKey: {
                equals: internalCode,
              },
            },
          ],
        },
      ],
    };
  }

  return {
    and: [
      {
        ownerCollection: {
          equals: "product-categories",
        },
      },
      {
        ownerRecordKey: {
          equals: slug || internalCode,
        },
      },
    ],
  };
}

async function findDocs(payload: Payload, collection: CollectionSlug, where: Where) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where,
  });

  return result.docs as unknown as CategoryRecord[];
}

function withOptionalHref(item: Omit<CategoryEditorChecklistItem, "href">, href?: string) {
  return href ? { ...item, href } : item;
}

export function getCategoryPublicUrl<T extends object>(category: T) {
  const record = asCategoryRecord(category);
  const canonicalPath = getText(record.canonicalPath) || `/${getCategorySlug(record)}`;
  const locale = getCategoryLocale(record);
  const origin = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://89.150.34.66:8093").replace(/\/+$/, "");

  return `${origin}${normalizeLocalePath(canonicalPath, locale)}`;
}

export function canAccessCategorySystemFields(user: unknown) {
  return hasAdminRole(getAdminUser(user), technicalAdminRoles);
}

export async function canPublishCategory(user: unknown, req: PayloadRequest) {
  return Boolean(await publishingAccess({ req: { ...req, user } as PayloadRequest }));
}

export async function getCategoryPreviewUrl<T extends object>(category: T, req: PayloadRequest) {
  const record = asCategoryRecord(category);

  return buildProductCategoryPreviewUrl(record, {
    locale: getCategoryLocale(record),
    req,
    token: null,
  });
}

export async function getCategoryEditorSnapshot<T extends object>(
  payload: Payload,
  category: T,
): Promise<CategoryEditorSnapshot> {
  const record = asCategoryRecord(category);
  const categoryId = getCategoryId(record);
  const slug = getCategorySlug(record);
  const internalCode = getText(record.internalCode);

  if (!categoryId || !slug) {
    return {
      blockers: [],
      checklist: [
        {
          detail: "Сначала сохраните карточку категории как черновик, чтобы открыть продукты, подкатегории, переводы и preview.",
          id: "save-first",
          label: "Сначала сохраните категорию",
          state: "attention",
        },
      ],
      lineCount: 0,
      linkedWorkspaces: [],
      productCount: 0,
      publicUrl: getCategoryPublicUrl(record),
      publishedTranslationCount: 0,
      seoApprovedCount: 0,
      seoCount: 0,
      translationCount: 0,
    };
  }

  const [products, lines, translations, seoEntries] = await Promise.all([
    findDocs(payload, "products", {
      category: {
        equals: categoryId,
      },
    }),
    findDocs(payload, "product-lines", {
      category: {
        equals: categoryId,
      },
    }),
    findDocs(payload, "translations", createOwnerRecordWhere(slug, internalCode)),
    findDocs(payload, "seo-entries", {
      and: [
        {
          ownerType: {
            equals: "product-category",
          },
        },
        {
          ownerCategory: {
            equals: categoryId,
          },
        },
      ],
    }),
  ]);

  const status = getText(record.status) || "draft";
  const primaryLocale = getCategoryLocale(record);
  const hasDirection = Boolean(record.direction);
  const hasIdentity =
    Boolean(getText(record.name)) &&
    Boolean(getText(record.publicLabel)) &&
    Boolean(getText(record.shortDescription));
  const hasHeroAsset = Boolean(record.heroAsset);
  const hasCoverAsset = Boolean(record.coverCardAsset);
  const seoApprovedCount = seoEntries.filter(
    (entry) =>
      getText(entry.approvalStatus) === "approved" &&
      getText(entry.publicationReadiness) === "production-ready",
  ).length;
  const publishedTranslationCount = translations.filter(
    (entry) => getText(entry.status) === "published",
  ).length;
  const translationsReady =
    status !== "published" ? translations.length > 0 || primaryLocale === "en" : publishedTranslationCount > 0;
  const ownerReviewRequired = getBoolean(record.ownerReviewRequired);

  const linkedWorkspaces: CategoryEditorLinkedWorkspace[] = [
    {
      count: products.length,
      description: "Текущие продукты внутри этой категории.",
      href: buildCollectionHref("products", [["where[category][equals]", categoryId]]),
      id: "products",
      label: "Продукты категории",
    },
    {
      count: lines.length,
      description: "Подкатегории и семейства, которые наследуют эту категорию.",
      href: buildCollectionHref("product-lines", [["where[category][equals]", categoryId]]),
      id: "lines",
      label: "Подкатегории и семейства",
    },
    {
      count: translations.length,
      description: "Локали, пустые поля и устаревшие тексты по категории.",
      href: buildTranslationWorkspaceHref({
        ownerCollection: "product-categories",
        ownerKey: slug,
      }),
      id: "translations",
      label: "Переводы",
    },
    {
      count: seoEntries.length,
      description: "Короткое SEO, маршрут категории и индексация.",
      href: buildCollectionHref("seo-entries", [
        ["where[ownerType][equals]", "product-category"],
        ["where[ownerCategory][equals]", categoryId],
      ]),
      id: "seo",
      label: "SEO и маршрут",
    },
  ];

  const checklist: CategoryEditorChecklistItem[] = [
    withOptionalHref(
      {
        detail: hasDirection ? "Категория привязана к направлению." : "Сначала выберите направление каталога.",
        id: "hierarchy",
        label: "Направление задано",
        state: hasDirection ? "ready" : "blocked",
      },
      "#field-direction",
    ),
    withOptionalHref(
      {
        detail: hasIdentity ? "Название, публичное имя и короткое описание заполнены." : "Заполните название, публичное имя и короткое описание.",
        id: "identity",
        label: "Публичная идентичность",
        state: hasIdentity ? "ready" : "blocked",
      },
      "#field-name",
    ),
    withOptionalHref(
      {
        detail:
          hasHeroAsset && hasCoverAsset
            ? "Hero и cover заданы для страницы и карточек."
            : "Добавьте hero и cover, чтобы категория выглядела полноценно в каталоге.",
        id: "media",
        label: "Hero и cover",
        state: hasHeroAsset && hasCoverAsset ? "ready" : status === "draft" ? "attention" : "blocked",
      },
      "#field-heroAsset",
    ),
    withOptionalHref(
      {
        detail:
          products.length > 0
            ? `${products.length} продукт(ов) уже назначены в категорию.`
            : "Назначьте хотя бы один продукт или подтвердите, что категория готовится заранее.",
        id: "products",
        label: "Связанные продукты",
        state: products.length > 0 ? "ready" : "attention",
      },
      linkedWorkspaces[0]?.href,
    ),
    withOptionalHref(
      {
        detail:
          lines.length > 0
            ? `${lines.length} подкатегорий/семейств уже связаны.`
            : "При необходимости добавьте подкатегорию или семейство через product lines.",
        id: "lines",
        label: "Подкатегории и семейства",
        state: lines.length > 0 ? "ready" : "attention",
      },
      linkedWorkspaces[1]?.href,
    ),
    withOptionalHref(
      {
        detail:
          seoApprovedCount > 0
            ? "SEO-запись готова к выпуску."
            : status === "draft"
              ? "SEO можно подготовить после черновой структуры."
              : "Добавьте production-ready SEO для категории.",
        id: "seo",
        label: "SEO и маршрут",
        state: seoApprovedCount > 0 ? "ready" : status === "draft" ? "attention" : "blocked",
      },
      linkedWorkspaces[3]?.href,
    ),
    withOptionalHref(
      {
        detail:
          translationsReady
            ? `${translations.length} перевод(ов) привязаны к категории.`
            : "Добавьте переводы или оставьте категорию в source-locale draft.",
        id: "translations",
        label: "Переводческое покрытие",
        state: translationsReady ? "ready" : status === "draft" ? "attention" : "blocked",
      },
      linkedWorkspaces[2]?.href,
    ),
    withOptionalHref(
      {
        detail:
          ownerReviewRequired
            ? "Для этой категории еще требуется owner-checkpoint перед выпуском."
            : "Дополнительное owner-согласование не блокирует выпуск.",
        id: "owner-review",
        label: "Owner-checkpoint",
        state: ownerReviewRequired ? "blocked" : "ready",
      },
      "#field-ownerReviewRequired",
    ),
  ];

  return {
    blockers: checklist.filter((item) => item.state === "blocked"),
    checklist,
    lineCount: lines.length,
    linkedWorkspaces,
    productCount: products.length,
    publicUrl: getCategoryPublicUrl(record),
    publishedTranslationCount,
    seoApprovedCount,
    seoCount: seoEntries.length,
    translationCount: translations.length,
  };
}

export function getCategoryWorkspaceRoleLabel(role: AdminRole | null) {
  switch (role) {
    case "owner":
      return "Владелец управляет порядком, выпуском и финальными исключениями.";
    case "admin":
      return "Администратор ведет категорию через структуру, контент и выпуск.";
    case "content-editor":
      return "Контент-редактор отвечает за описание, cover и связи без изменения схемы.";
    case "translator":
      return "Переводчику лучше работать через отдельную очередь переводов категории.";
    case "media-manager":
      return "Медиа-менеджер следит за cover, hero и безопасностью материалов.";
    case "developer":
      return "Разработчик видит системные поля и служебные связи.";
    case "lead-manager":
      return "Lead manager использует категорию только как контекст маршрутизации.";
    default:
      return "Сохраните черновик категории и продолжайте через curated workspace.";
  }
}
