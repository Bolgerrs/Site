import type { CollectionSlug, Payload, PayloadRequest, Where } from "payload";

import { buildProductPreviewUrl } from "./preview-url.ts";
import { buildTranslationWorkspaceHref } from "./translations-workspace.ts";
import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";
import { getAdminUser, publishingAccess } from "./access.ts";
import { hasAdminRole, type AdminRole, technicalAdminRoles } from "./roles.ts";

type ProductRecord = Record<string, unknown>;

export type ProductEditorChecklistState = "ready" | "attention" | "blocked";

export type ProductEditorChecklistItem = {
  detail: string;
  href?: string;
  id: string;
  label: string;
  state: ProductEditorChecklistState;
};

export type ProductEditorLinkedWorkspace = {
  count: number;
  description: string;
  href: string;
  id: string;
  label: string;
};

export type ProductEditorSnapshot = {
  approvedDocumentCount: number;
  approvedPrimaryFormCount: number;
  approvedPublicMediaCount: number;
  blockers: ProductEditorChecklistItem[];
  checklist: ProductEditorChecklistItem[];
  documentCount: number;
  formCount: number;
  launchLocaleCount: number;
  linkedWorkspaces: ProductEditorLinkedWorkspace[];
  publicUrl: string;
  publishedTranslationCount: number;
  reviewTranslationCount: number;
  seoApprovedCount: number;
  seoCount: number;
  translationCount: number;
  variantCount: number;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getBoolean(value: unknown) {
  return value === true;
}

function asProductRecord<T extends object>(product: T) {
  return product as ProductRecord;
}

function getProductId(product: ProductRecord) {
  const id = product.id;
  return typeof id === "number" || typeof id === "string" ? id : undefined;
}

function getProductSlug(product: ProductRecord) {
  return getText(product.slug);
}

function getProductLocale(product: ProductRecord) {
  return getText(product.primaryLocale) || "en";
}

function getCanonicalProductPath(product: ProductRecord) {
  const path = getText(product.canonicalPath) || `/products/${getProductSlug(product)}`;
  return path.startsWith("/") ? path : `/${path}`;
}

export function getPublicSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://89.150.34.66:8093").replace(/\/+$/, "");
}

export function canAccessProductSystemFields(user: unknown) {
  return hasAdminRole(getAdminUser(user), technicalAdminRoles);
}

export async function canPublishProduct(user: unknown, req: PayloadRequest) {
  return Boolean(await publishingAccess({ req: { ...req, user } as PayloadRequest }));
}

export async function getProductPreviewUrl<T extends object>(product: T, req: PayloadRequest) {
  const record = asProductRecord(product);

  return buildProductPreviewUrl(record, {
    locale: getProductLocale(record),
    req,
    token: null,
  });
}

export function getProductPublicUrl<T extends object>(product: T) {
  const record = asProductRecord(product);
  return `${getPublicSiteOrigin()}${normalizeLocalePath(getCanonicalProductPath(record), getProductLocale(record))}`;
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

function buildSeoEntryHref(
  entries: ProductRecord[],
  fallbackHref: string,
) {
  if (entries.length === 1) {
    const id = getProductId(entries[0] ?? {});
    if (id != null) {
      return buildAdvancedCollectionHref("seo-entries", { id });
    }
  }

  return fallbackHref;
}

function createOwnerRecordWhere(slug: string, internalCode: string): Where {
  if (slug && internalCode) {
    return {
      and: [
        {
          ownerCollection: {
            equals: "products",
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
          equals: "products",
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

async function countDocs(payload: Payload, collection: CollectionSlug, where: Where) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where,
  });

  return result.docs as unknown as ProductRecord[];
}

function withOptionalHref(item: Omit<ProductEditorChecklistItem, "href">, href?: string) {
  return href ? { ...item, href } : item;
}

export async function getProductEditorSnapshot<T extends object>(
  payload: Payload,
  product: T,
): Promise<ProductEditorSnapshot> {
  const record = asProductRecord(product);
  const productId = getProductId(record);
  const slug = getProductSlug(record);
  const internalCode = getText(record.internalCode);
  const primaryLocale = getProductLocale(record);
  const launchLocaleCount = 7;

  if (!productId || !slug) {
    return {
      approvedDocumentCount: 0,
      approvedPrimaryFormCount: 0,
      approvedPublicMediaCount: 0,
      blockers: [],
      checklist: [
        {
          detail: "Сохраните карточку как draft, чтобы открыть формы, переводы, SEO и preview-действия.",
          id: "save-first",
          label: "Сначала сохраните продукт",
          state: "attention",
        },
      ],
      documentCount: 0,
      formCount: 0,
      launchLocaleCount,
      linkedWorkspaces: [],
      publicUrl: getProductPublicUrl(record),
      publishedTranslationCount: 0,
      reviewTranslationCount: 0,
      seoApprovedCount: 0,
      seoCount: 0,
      translationCount: 0,
      variantCount: 0,
    };
  }

  const [forms, variants, media, documents, translations, seoEntries] = await Promise.all([
    countDocs(payload, "productInquiryForms", {
      product: {
        equals: productId,
      },
    }),
    countDocs(payload, "product-variants", {
      product: {
        equals: productId,
      },
    }),
    countDocs(payload, "product-media", {
      productKey: {
        equals: slug,
      },
    }),
    countDocs(payload, "product-documents", {
      productKey: {
        equals: slug,
      },
    }),
    countDocs(payload, "translations", createOwnerRecordWhere(slug, internalCode)),
    countDocs(payload, "seo-entries", {
      and: [
        {
          ownerType: {
            equals: "product",
          },
        },
        {
          ownerProduct: {
            equals: productId,
          },
        },
      ],
    }),
  ]);

  const approvedPrimaryFormCount = forms.filter(
    (entry) =>
      getText(entry.locale) === primaryLocale &&
      getBoolean(entry.isPrimaryForLocale) &&
      getText(entry.approvalStatus) === "approved",
  ).length;
  const approvedPublicMediaCount = media.filter(
    (entry) =>
      getText(entry.approvalStatus) === "approved" &&
      getText(entry.rightsStatus) !== "reference-only" &&
      getText(entry.visibilityMode) === "public",
  ).length;
  const approvedDocumentCount = documents.filter(
    (entry) =>
      getText(entry.approvalStatus) === "approved" &&
      getText(entry.rightsStatus) !== "reference-only",
  ).length;
  const seoApprovedCount = seoEntries.filter(
    (entry) =>
      getText(entry.approvalStatus) === "approved" &&
      getText(entry.publicationReadiness) === "production-ready",
  ).length;
  const publishedTranslationCount = translations.filter(
    (entry) => getText(entry.status) === "published",
  ).length;
  const reviewTranslationCount = translations.filter(
    (entry) => getText(entry.status) === "review",
  ).length;

  const status = getText(record.status) || "draft";
  const hasDirection = Boolean(record.direction);
  const hasIdentity =
    Boolean(getText(record.name)) &&
    Boolean(getText(record.publicLabel)) &&
    Boolean(getText(record.shortDescription));
  const hasHeroAsset = Boolean(record.heroAsset);
  const hasCardAsset = Boolean(record.coverCardAsset);
  const hasSeoBaseline = seoApprovedCount > 0 || status === "draft";
  const translationsReady =
    status !== "published" ? translations.length > 0 || primaryLocale === "en" : publishedTranslationCount > 0;
  const ownerReviewRequired = getBoolean(record.ownerReviewRequired);
  const variantReadinessState = getText(
    (record.variantReadiness as Record<string, unknown> | null | undefined)?.readinessState,
  );
  const variantTotal = getNumber(
    (record.variantReadiness as Record<string, unknown> | null | undefined)?.totalVariants,
  );

  const linkedWorkspaces: ProductEditorLinkedWorkspace[] = [
    {
      count: forms.length,
      description: "Основная форма, локальное покрытие и маршрутизация заявок.",
      href: buildCollectionHref("productInquiryForms", [["where[product][equals]", productId]]),
      id: "forms",
      label: "Формы заявки",
    },
    {
      count: variants.length,
      description: "Готовность вариантов, базовая конфигурация и публичные claims.",
      href: buildCollectionHref("product-variants", [["where[product][equals]", productId]]),
      id: "variants",
      label: "Варианты",
    },
    {
      count: media.length,
      description: "Привязки, hero/card медиа и права использования.",
      href: buildCollectionHref("product-media", [["where[productKey][equals]", slug]]),
      id: "media",
      label: "Медиа",
    },
    {
      count: documents.length,
      description: "PDF, спецификации и управляемые документы.",
      href: buildCollectionHref("product-documents", [["where[productKey][equals]", slug]]),
      id: "documents",
      label: "Документы",
    },
    {
      count: translations.length,
      description: "Локали, пустые поля и контроль устаревшего source.",
      href: buildTranslationWorkspaceHref({
        ownerCollection: "products",
        ownerKey: slug,
      }),
      id: "translations",
      label: "Переводы",
    },
    {
      count: seoEntries.length,
      description: "Публичный маршрут, метаданные и индексация.",
      href: buildSeoEntryHref(
        seoEntries,
        buildCollectionHref("seo-entries", [["where[ownerProduct][equals]", productId]]),
      ),
      id: "seo",
      label: "SEO",
    },
  ];

  const checklist: ProductEditorChecklistItem[] = [
    withOptionalHref({
      detail: hasDirection ? "Направление выбрано." : "Сначала выберите направление перед review/publish.",
      id: "hierarchy",
      label: "Иерархия",
      state: hasDirection ? "ready" : "blocked",
    }, "#field-direction"),
    withOptionalHref({
      detail:
        hasIdentity
          ? "Название, публичное имя и краткое описание заполнены."
          : "Заполните базовую идентичность и краткий публичный текст.",
      id: "identity",
      label: "Имя и описание",
      state: hasIdentity ? "ready" : "blocked",
    }, "#field-name"),
    withOptionalHref({
      detail:
        hasHeroAsset && hasCardAsset
          ? "Hero и card медиа назначены."
          : "Добавьте hero и card медиа для всех основных поверхностей.",
      id: "media",
      label: "Hero и cover media",
      state: hasHeroAsset && hasCardAsset ? "ready" : "blocked",
    }, "#field-heroAsset"),
    withOptionalHref({
      detail:
        approvedPrimaryFormCount > 0
          ? `Основная форма для ${primaryLocale.toUpperCase()} привязана и утверждена.`
          : `Добавьте одну утвержденную основную форму для ${primaryLocale.toUpperCase()}.`,
      id: "form",
      label: "Основная форма заявки",
      state: approvedPrimaryFormCount > 0 ? "ready" : "blocked",
    }, linkedWorkspaces[0]?.href),
    withOptionalHref({
      detail:
        seoApprovedCount > 0
          ? "SEO-запись готова к выпуску."
          : status === "draft"
            ? "SEO можно подготовить позже, пока продукт в черновике."
            : "Подготовьте одну production-ready SEO-запись.",
      id: "seo",
      label: "SEO и маршрут",
      state: hasSeoBaseline ? "ready" : status === "draft" ? "attention" : "blocked",
    }, linkedWorkspaces[5]?.href),
    withOptionalHref({
      detail:
        translationsReady
          ? `${translations.length} перевод(ов) уже привязаны.`
          : "Добавьте переводы или оставьте продукт в draft на source-локали.",
      id: "translations",
      label: "Переводческое покрытие",
      state: translationsReady ? "ready" : status === "draft" ? "attention" : "blocked",
    }, linkedWorkspaces[4]?.href),
    withOptionalHref({
      detail:
        variantTotal > 0
          ? `${variantTotal} вариант(ов), статус: ${variantReadinessState || "drafting"}.`
          : "Варианты не привязаны; допустимо только если продукт действительно одиночной конфигурации.",
      id: "variants",
      label: "Варианты и конфигурация",
      state: variantTotal > 0 || variantReadinessState === "no-variants" ? "ready" : "attention",
    }, linkedWorkspaces[1]?.href),
    withOptionalHref({
      detail:
        ownerReviewRequired
          ? "Перед публичным выпуском еще нужен owner-checkpoint."
          : "Дополнительный owner-checkpoint не блокирует выпуск.",
      id: "owner-review",
      label: "Согласование owner",
      state: ownerReviewRequired ? "blocked" : "ready",
    }, "#field-ownerReviewRequired"),
  ];

  return {
    approvedDocumentCount,
    approvedPrimaryFormCount,
    approvedPublicMediaCount,
    blockers: checklist.filter((item) => item.state === "blocked"),
    checklist,
    documentCount: documents.length,
    formCount: forms.length,
    launchLocaleCount,
    linkedWorkspaces,
    publicUrl: getProductPublicUrl(record),
    publishedTranslationCount,
    reviewTranslationCount,
    seoApprovedCount,
    seoCount: seoEntries.length,
    translationCount: translations.length,
    variantCount: variants.length,
  };
}

export function getProductWorkspaceRoleLabel(role: AdminRole | null) {
  switch (role) {
    case "owner":
      return "Владелец управляет выпуском и финальными исключениями.";
    case "admin":
      return "Администратор ведет продукт через управляемый review-процесс.";
    case "content-editor":
      return "Контент-редактор отвечает за иерархию, описание, формы и заметки.";
    case "translator":
      return "Переводчику лучше идти через отдельный workspace переводов.";
    case "media-manager":
      return "Медиа-менеджер следит за безопасностью прав и готовностью файлов.";
    case "developer":
      return "Разработчик видит защищенные системные поля и route internals.";
    case "lead-manager":
      return "Lead manager проверяет поведение заявки, а не публичное описание.";
    default:
      return "Сначала сохраните черновик, затем продолжайте через curated workspace.";
  }
}
