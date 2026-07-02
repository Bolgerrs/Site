import type { Payload, Where } from "payload";

import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";

import type { AdminRole } from "./roles.ts";
import { buildMediaWorkspaceHref, getMediaDashboardHref } from "./media-workspace.ts";

type DashboardCollectionSlug =
  | "leads"
  | "media-assets"
  | "products"
  | "pages"
  | "productInquiryForms"
  | "seo-entries"
  | "translations";

export type AdminDashboardWidgetTone = "alert" | "attention" | "steady";

export type AdminDashboardWidgetAction = {
  count: number;
  href: string;
  label: string;
};

export type AdminDashboardWidget = {
  actions: AdminDashboardWidgetAction[];
  count: number;
  description: string;
  id:
    | "blocked-publishes"
    | "creative-approvals"
    | "media-rights"
    | "new-leads"
    | "overdue-followups"
    | "stale-translations";
  label: string;
  summary: string;
  tone: AdminDashboardWidgetTone;
  visibility: readonly AdminRole[];
  workspaceLabel: string;
};

export type AdminDashboardQuickAction = {
  description: string;
  href: string;
  id:
    | "product-create"
    | "products-catalog"
    | "forms-review"
    | "homepage"
    | "page-edit"
    | "homepage-media"
    | "leads"
    | "media"
    | "seo"
    | "settings"
    | "translations";
  label: string;
  summary: string;
  value: string;
  visibility: readonly AdminRole[];
};

export type AdminDashboardStatusCard = {
  ctaLabel: string;
  description: string;
  href: string;
  id: "drafts" | "latest-updates" | "pending-release";
  label: string;
  value: string;
  visibility: readonly AdminRole[];
};

export type AdminDashboardFeedItem = {
  href: string;
  id: string;
  label: string;
  meta: string;
  status: string;
};

export type AdminDashboardHealthItem = {
  ctaLabel: string;
  href: string;
  id: "media" | "publishing" | "translations";
  label: string;
  state: "attention" | "ok" | "watch";
  summary: string;
  visibility: readonly AdminRole[];
};

export type AdminDashboardReleaseAction = {
  ctaLabel: string;
  description: string;
  href: string;
  id: "checks" | "homepage-preview" | "site-preview";
  label: string;
  visibility: readonly AdminRole[];
};

export type AdminDashboardSnapshot = {
  generatedAt: string;
  healthItems: AdminDashboardHealthItem[];
  latestChanges: AdminDashboardFeedItem[];
  latestLeads: AdminDashboardFeedItem[];
  releaseActions: AdminDashboardReleaseAction[];
  statusCards: AdminDashboardStatusCard[];
  widgets: AdminDashboardWidget[];
};

const publishingRoles = ["owner", "admin", "content-editor", "developer"] as const;
const leadRoles = ["owner", "admin", "lead-manager", "developer"] as const;
const translationRoles = ["owner", "admin", "content-editor", "translator", "developer"] as const;
const mediaRoles = ["owner", "admin", "media-manager", "developer"] as const;

function buildCollectionHref(collection: string, query = "") {
  return buildAdvancedCollectionHref(collection, {
    label: "Расширенный режим",
    query,
  });
}

function buildNewLeadsHref() {
  return "/admin/leads?filter=new";
}

function buildOverdueLeadsHref(isoNow: string) {
  void isoNow;
  return "/admin/leads?filter=overdue";
}

function buildLeadQuickActionValue(newLeadCount: number, overdueFollowupsCount: number) {
  if (overdueFollowupsCount > 0) {
    return `${overdueFollowupsCount} overdue · ${newLeadCount} new`;
  }

  return formatActionValue(newLeadCount, "новый лид", "новых лидов");
}

function buildPagesBlockedHref() {
  return "/admin/site";
}

function buildHomepageEditorHref() {
  return "/admin/site";
}

function buildHomepageMediaHref() {
  return buildMediaWorkspaceHref({ context: "homepage" });
}

function buildSiteWorkspaceHref() {
  return "/admin/site";
}

function buildProductsReviewHref() {
  return "/admin/products";
}

function buildProductsCatalogHref() {
  return "/admin/products";
}

function buildProductCreateHref() {
  return "/admin/products";
}

function buildFormsBlockedHref() {
  return "/admin/checks?check=form-errors";
}

function buildSeoBlockedHref() {
  return "/admin/checks?check=seo-problems";
}

function buildTranslationsHref() {
  return "/admin/checks?check=stale-translations";
}

function buildMediaRightsHref() {
  return "/admin/checks?check=empty-alt-text";
}

function buildCreativeApprovalsHref() {
  return getMediaDashboardHref("needs-approval");
}

function buildSiteSettingsHref() {
  return "/admin/settings";
}

function buildDraftsHref() {
  return "/admin/checks?check=unpublished-changes";
}

function buildLatestChangesHref() {
  return buildCollectionHref("pages", "sort=-updatedAt");
}

function buildSitePreviewHref() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, "");
  return siteUrl || "http://89.150.34.66:8093";
}

function buildHomepagePreviewHref() {
  const baseUrl = buildSitePreviewHref();
  return `${baseUrl}/`;
}

async function countCollection(
  payload: Payload,
  collection: DashboardCollectionSlug,
  where: Where,
) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: true,
    where,
  });

  return result.totalDocs;
}

async function findDocs(payload: Payload, collection: DashboardCollectionSlug, where: Where, limit = 3) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit,
    overrideAccess: true,
    pagination: false,
    sort: "-updatedAt",
    where,
  });

  return ((result.docs as unknown) as Array<Record<string, unknown>>) ?? [];
}

async function findRecentLeads(payload: Payload, limit = 3) {
  const result = await payload.find({
    collection: "leads",
    depth: 0,
    limit,
    overrideAccess: true,
    pagination: false,
    sort: "-createdAt",
  });

  return ((result.docs as unknown) as Array<Record<string, unknown>>) ?? [];
}

export function getVisibleAdminDashboardWidgets(
  role: AdminRole | null | undefined,
  widgets: readonly AdminDashboardWidget[],
) {
  if (!role) {
    return [];
  }

  return widgets.filter((widget) => widget.visibility.includes(role));
}

function formatActionValue(count: number, singular: string, plural: string) {
  if (count === 0) {
    return `0 ${plural}`;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatTimestamp(value: unknown) {
  const text = getText(value);
  const date = text ? new Date(text) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "время не указано";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getRecordLabel(record: Record<string, unknown>, fallbacks: string[], emptyLabel: string) {
  for (const key of fallbacks) {
    const value = getText(record[key]);
    if (value) {
      return value;
    }
  }

  return emptyLabel;
}

function buildLeadFeedItem(doc: Record<string, unknown>): AdminDashboardFeedItem {
  const label = getRecordLabel(doc, ["title", "displayName", "fullName", "companyName", "email"], "Новая заявка");
  const detail =
    getRecordLabel(
      doc,
      ["productLabelSnapshot", "sourceLabelSnapshot", "sourceChannel", "routingMode"],
      "Источник не указан",
    ) || "Источник не указан";
  const status = getText(doc.status) || "new";
  const id = getText(doc.id) || getText(doc.leadNumber) || label;

  return {
    href: buildCollectionHref("leads", `where[id][equals]=${encodeURIComponent(id)}`),
    id: `lead-${id}`,
    label,
    meta: `${detail} · ${formatTimestamp(doc.createdAt)}`,
    status: status === "new" ? "Новая" : status,
  };
}

function buildChangeFeedItem(
  collection: DashboardCollectionSlug,
  workspaceLabel: string,
  href: string,
  doc: Record<string, unknown>,
): AdminDashboardFeedItem {
  const label = getRecordLabel(
    doc,
    ["title", "name", "ownerLabelSnapshot", "formTitle", "assetTitle", "routePath", "slug"],
    workspaceLabel,
  );
  const status = getText(doc.status) || getText(doc.approvalStatus) || "обновлено";
  const suffix =
    getRecordLabel(doc, ["routePath", "ownerCollection", "primaryLocale", "internalCode"], "")
      || "без уточнения";
  const id = getText(doc.id) || `${collection}-${label}`;

  return {
    href,
    id: `${collection}-${id}`,
    label: `${workspaceLabel}: ${label}`,
    meta: `${suffix} · ${formatTimestamp(doc.updatedAt || doc.createdAt)}`,
    status,
  };
}

export function getVisibleAdminDashboardQuickActions(
  role: AdminRole | null | undefined,
  widgets: readonly AdminDashboardWidget[],
) {
  if (!role) {
    return [];
  }

  const widgetById = new Map(widgets.map((widget) => [widget.id, widget]));
  const productAction =
    widgetById.get("blocked-publishes")?.actions.find((action) => action.label === "Продукты") ?? null;
  const formsAction =
    widgetById.get("blocked-publishes")?.actions.find((action) => action.label === "Формы") ?? null;
  const seoAction =
    widgetById.get("blocked-publishes")?.actions.find((action) => action.label === "SEO") ?? null;

  const quickActions: AdminDashboardQuickAction[] = [
    {
      description:
        "Открыть главную страницу и поправить видимый текст, кнопки, медиа и порядок секций без технических обходов.",
      href: buildHomepageEditorHref(),
      id: "homepage",
      label: "Изменить главную",
      summary: "Главный экран и ключевые секции",
      value: "Hero, кнопки и порядок блоков",
      visibility: publishingRoles,
    },
    {
      description:
        "Открыть дерево страниц сайта и выбрать нужную страницу для правки текста, блоков, кнопок, медиа и публикации.",
      href: buildSiteWorkspaceHref(),
      id: "page-edit",
      label: "Изменить страницу",
      summary: "Страницы сайта по разделам",
      value: "Выбор страницы из понятного списка",
      visibility: publishingRoles,
    },
    {
      description:
        "Перейти сразу к медиа главной: hero, визуалы секций, документы, права и готовность к публикации.",
      href: buildHomepageMediaHref(),
      id: "homepage-media",
      label: "Медиа главной",
      summary: "Hero, секции и документы",
      value: "Подборка главной",
      visibility: mediaRoles,
    },
    {
      description:
        "Открыть список продуктов со статусами, семействами и быстрым входом в карточки без обхода внутренних таблиц.",
      href: buildProductsCatalogHref(),
      id: "products-catalog",
      label: "Редактировать продукты",
      summary: "Каталог и карточки",
      value: formatActionValue(productAction?.count ?? 0, "позиция на проверке", "позиций на проверке"),
      visibility: publishingRoles,
    },
    {
      description:
        "Создать новый продукт: сначала черновик, затем семейство, публичный текст, медиа, форма заявки и проверки перед выпуском.",
      href: buildProductCreateHref(),
      id: "product-create",
      label: "Добавить продукт",
      summary: "Новый продукт по шагам",
      value: "Сначала черновик",
      visibility: publishingRoles,
    },
    {
      description:
        "Открыть формы заявок, которые застряли перед публикацией или требуют подтверждения связанной продуктовой логики.",
      href: formsAction?.href ?? buildFormsBlockedHref(),
      id: "forms-review",
      label: "Проверить формы",
      summary: "Сценарии заявки и маршрутизация",
      value: formatActionValue(formsAction?.count ?? 0, "форма в очереди", "форм в очереди"),
      visibility: publishingRoles,
    },
    {
      description:
        "Зайти в лид-инбокс с новыми и просроченными обращениями, чтобы сразу взять следующее действие в работу.",
      href:
        (widgetById.get("overdue-followups")?.count ?? 0) > 0
          ? buildOverdueLeadsHref(new Date().toISOString())
          : buildNewLeadsHref(),
      id: "leads",
      label: "Посмотреть заявки",
      summary: "Новые заявки и следующий шаг",
      value: buildLeadQuickActionValue(
        widgetById.get("new-leads")?.count ?? 0,
        widgetById.get("overdue-followups")?.count ?? 0,
      ),
      visibility: leadRoles,
    },
    {
      description:
        "Открыть очередь переводов, где source уже изменился или локаль нельзя выпустить без правки и проверки.",
      summary: "Пустые, устаревшие и заблокированные переводы",
      href: buildTranslationsHref(),
      id: "translations",
      label: "Проверить переводы",
      value: formatActionValue(
        widgetById.get("stale-translations")?.count ?? 0,
        "локаль требует правки",
        "локалей требуют правки",
      ),
      visibility: translationRoles,
    },
    {
      description:
        "Открыть библиотеку материалов и быстро заменить фото, видео или документы там, где это видно на сайте.",
      href: buildMediaRightsHref(),
      id: "media",
      label: "Заменить фото/видео",
      summary: "Фото, видео и документы",
      value: formatActionValue(
        widgetById.get("media-rights")?.count ?? 0,
        "файл с риском",
        "файлов с рисками",
      ),
      visibility: mediaRoles,
    },
    {
      description:
        "Открыть текущие блокеры выпуска и проблемы метаданных, которые мешают выпуску страниц и продуктов.",
      href: seoAction?.href ?? buildSeoBlockedHref(),
      id: "seo",
      label: "Проверить перед публикацией",
      summary: "Блокеры публикации и метаданные",
      value: formatActionValue(seoAction?.count ?? 0, "блокер публикации", "блокеров публикации"),
      visibility: publishingRoles,
    },
    {
      description:
        "Открыть защищенные настройки сайта и рабочие правила платформы без смешивания с повседневным контентным потоком.",
      href: buildSiteSettingsHref(),
      id: "settings",
      label: "Настройки",
      summary: "Контакты, кнопки и правила сайта",
      value: "Только для владельца",
      visibility: ["owner", "developer"],
    },
  ];

  return quickActions.filter((action) => action.visibility.includes(role));
}

export async function getAdminDashboardSnapshot(payload: Payload): Promise<AdminDashboardSnapshot> {
  const now = new Date().toISOString();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayStartIso = dayStart.toISOString();

  const [
    newLeadCount,
    overdueFollowupsCount,
    blockedPagesCount,
    blockedProductsCount,
    blockedFormsCount,
    blockedSeoCount,
    staleTranslationsCount,
    mediaRightsIssuesCount,
    creativeApprovalsCount,
    draftPagesCount,
    draftProductsCount,
    draftFormsCount,
    changedPagesTodayCount,
    changedProductsTodayCount,
    changedFormsTodayCount,
    changedTranslationsTodayCount,
    recentLeads,
    changedPages,
    changedProducts,
    changedForms,
    changedTranslations,
  ] = await Promise.all([
    countCollection(payload, "leads", {
      status: {
        equals: "new",
      },
    }),
    countCollection(payload, "leads", {
      and: [
        {
          nextActionAt: {
            less_than: now,
          },
        },
        {
          status: {
            not_in: ["closed", "spam"],
          },
        },
      ],
    }),
    countCollection(payload, "pages", {
      and: [
        {
          status: {
            equals: "review",
          },
        },
        {
          approvalStatus: {
            not_equals: "approved",
          },
        },
      ],
    }),
    countCollection(payload, "products", {
      status: {
        equals: "review",
      },
    }),
    countCollection(payload, "productInquiryForms", {
      and: [
        {
          status: {
            equals: "review",
          },
        },
        {
          approvalStatus: {
            not_equals: "approved",
          },
        },
      ],
    }),
    countCollection(payload, "seo-entries", {
      and: [
        {
          status: {
            in: ["draft", "review"],
          },
        },
        {
          publicationReadiness: {
            equals: "blocked",
          },
        },
      ],
    }),
    countCollection(payload, "translations", {
      or: [
        {
          staleSourceState: {
            in: ["source-changed", "review-required", "blocked"],
          },
        },
        {
          publishReadiness: {
            equals: "blocked",
          },
        },
      ],
    }),
    countCollection(payload, "media-assets", {
      and: [
        {
          status: {
            in: ["review", "approved", "published"],
          },
        },
        {
          or: [
            {
              rightsStatus: {
                in: ["reference-only", "supplier-restricted", "generated-pending-review"],
              },
            },
            {
              approvalStatus: {
                in: ["pending", "needs-review", "expired"],
              },
            },
            {
              publicationReadiness: {
                not_equals: "production-ready",
              },
            },
          ],
        },
      ],
    }),
    countCollection(payload, "media-assets", {
      and: [
        {
          status: {
            in: ["draft", "review", "approved"],
          },
        },
        {
          or: [
            {
              creativeReviewRequired: {
                equals: true,
              },
            },
            {
              ownerReviewRequired: {
                equals: true,
              },
            },
            {
              assetType: {
                equals: "creative-reference",
              },
            },
          ],
        },
        {
          approvalStatus: {
            in: ["pending", "needs-review"],
          },
        },
      ],
    }),
    countCollection(payload, "pages", {
      status: {
        in: ["draft", "review"],
      },
    }),
    countCollection(payload, "products", {
      status: {
        in: ["draft", "review"],
      },
    }),
    countCollection(payload, "productInquiryForms", {
      status: {
        in: ["draft", "review"],
      },
    }),
    countCollection(payload, "pages", {
      updatedAt: {
        greater_than_equal: dayStartIso,
      },
    }),
    countCollection(payload, "products", {
      updatedAt: {
        greater_than_equal: dayStartIso,
      },
    }),
    countCollection(payload, "productInquiryForms", {
      updatedAt: {
        greater_than_equal: dayStartIso,
      },
    }),
    countCollection(payload, "translations", {
      updatedAt: {
        greater_than_equal: dayStartIso,
      },
    }),
    findRecentLeads(payload, 3),
    findDocs(
      payload,
      "pages",
      {
        updatedAt: {
          greater_than_equal: dayStartIso,
        },
      },
      3,
    ),
    findDocs(
      payload,
      "products",
      {
        updatedAt: {
          greater_than_equal: dayStartIso,
        },
      },
      3,
    ),
    findDocs(
      payload,
      "productInquiryForms",
      {
        updatedAt: {
          greater_than_equal: dayStartIso,
        },
      },
      3,
    ),
    findDocs(
      payload,
      "translations",
      {
        updatedAt: {
          greater_than_equal: dayStartIso,
        },
      },
      3,
    ),
  ]);

  const draftCount = draftPagesCount + draftProductsCount + draftFormsCount;
  const publishBlockersCount =
    blockedPagesCount + blockedProductsCount + blockedFormsCount + blockedSeoCount;
  const changedTodayCount =
    changedPagesTodayCount +
    changedProductsTodayCount +
    changedFormsTodayCount +
    changedTranslationsTodayCount;
  const latestChanges = [
    ...changedPages.map((doc) => ({
      item: buildChangeFeedItem("pages", "Сайт", buildCollectionHref("pages", "sort=-updatedAt"), doc),
      sortAt: getText(doc.updatedAt) || getText(doc.createdAt),
    })),
    ...changedProducts.map((doc) => ({
      item: buildChangeFeedItem(
        "products",
        "Продукты",
        buildCollectionHref("products", "sort=-updatedAt"),
        doc,
      ),
      sortAt: getText(doc.updatedAt) || getText(doc.createdAt),
    })),
    ...changedForms.map((doc) => ({
      item: buildChangeFeedItem(
        "productInquiryForms",
        "Формы",
        buildCollectionHref("productInquiryForms", "sort=-updatedAt"),
        doc,
      ),
      sortAt: getText(doc.updatedAt) || getText(doc.createdAt),
    })),
    ...changedTranslations.map((doc) => ({
      item: buildChangeFeedItem("translations", "Переводы", buildTranslationsHref(), doc),
      sortAt: getText(doc.updatedAt) || getText(doc.createdAt),
    })),
  ]
    .sort((left, right) => right.sortAt.localeCompare(left.sortAt, "ru"))
    .slice(0, 4)
    .map(({ item }) => item);

  return {
    generatedAt: now,
    healthItems: [
      {
        ctaLabel: "Открыть проверки",
        href: buildSeoBlockedHref(),
        id: "publishing",
        label: "Готовность к выпуску",
        state: publishBlockersCount > 0 ? "attention" : "ok",
        summary:
          publishBlockersCount > 0
            ? `${publishBlockersCount} блокеров мешают выпуску страниц, продуктов или форм.`
            : "Критичных блокеров выпуска сейчас нет.",
        visibility: publishingRoles,
      },
      {
        ctaLabel: "Открыть переводы",
        href: buildTranslationsHref(),
        id: "translations",
        label: "Языковые версии",
        state: staleTranslationsCount > 0 ? "watch" : "ok",
        summary:
          staleTranslationsCount > 0
            ? `${staleTranslationsCount} переводов требуют обновления или проверки.`
            : "Проблемных переводов сейчас не найдено.",
        visibility: translationRoles,
      },
      {
        ctaLabel: "Открыть медиа",
        href: buildMediaRightsHref(),
        id: "media",
        label: "Медиа и права",
        state: mediaRightsIssuesCount > 0 ? "watch" : "ok",
        summary:
          mediaRightsIssuesCount > 0
            ? `${mediaRightsIssuesCount} файлов требуют проверки прав, согласования или готовности.`
            : "Медиа без видимых рисков по правам и публикации.",
        visibility: mediaRoles,
      },
    ],
    latestChanges,
    latestLeads: recentLeads.map(buildLeadFeedItem),
    releaseActions: [
      {
        ctaLabel: "Открыть проверки",
        description: "Посмотреть блокеры выпуска перед публикацией страниц, продуктов и форм.",
        href: buildSeoBlockedHref(),
        id: "checks",
        label: "Проверить перед выпуском",
        visibility: publishingRoles,
      },
      {
        ctaLabel: "Открыть главную",
        description: "Посмотреть публичную главную и быстро сравнить ее с текущими правками в админке.",
        href: buildHomepagePreviewHref(),
        id: "homepage-preview",
        label: "Проверить главную",
        visibility: publishingRoles,
      },
      {
        ctaLabel: "Открыть сайт",
        description: "Открыть внешний preview сайта в новой вкладке и пройти короткий owner-smoke.",
        href: buildSitePreviewHref(),
        id: "site-preview",
        label: "Посмотреть сайт",
        visibility: ["owner", "admin", "content-editor", "lead-manager", "translator", "media-manager", "developer"],
      },
    ],
    statusCards: [
      {
        ctaLabel: "Открыть черновики",
        description: "Страницы, продукты и формы, которые еще не готовы к выпуску и ждут продолжения работы.",
        href: buildDraftsHref(),
        id: "drafts",
        label: "Черновики в работе",
        value: formatActionValue(draftCount, "черновик", "черновиков"),
        visibility: publishingRoles,
      },
      {
        ctaLabel: "Открыть блокеры",
        description: "Материалы, которые уже дошли до review, но все еще не могут выйти на сайт.",
        href: buildSeoBlockedHref(),
        id: "pending-release",
        label: "Ожидают выпуска",
        value: formatActionValue(publishBlockersCount, "блокер выпуска", "блокеров выпуска"),
        visibility: publishingRoles,
      },
      {
        ctaLabel: "Посмотреть изменения",
        description: "Сколько рабочих материалов обновлялось сегодня по сайту, продуктам, формам и переводам.",
        href: buildLatestChangesHref(),
        id: "latest-updates",
        label: "Изменения за сегодня",
        value: formatActionValue(changedTodayCount, "обновление", "обновлений"),
        visibility: ["owner", "admin", "content-editor", "translator", "developer"],
      },
    ],
    widgets: [
      {
        actions: [
          {
            count: newLeadCount,
            href: buildNewLeadsHref(),
            label: "Открыть новые лиды",
          },
        ],
        count: newLeadCount,
        description:
          "Свежие заявки, которые еще не прошли первичный разбор, назначение ответственного и первый ответ клиенту.",
        id: "new-leads",
        label: "Новые лиды",
        summary: "Первичный разбор обращений",
        tone: newLeadCount > 0 ? "alert" : "steady",
        visibility: leadRoles,
        workspaceLabel: "Лиды",
      },
      {
        actions: [
          {
            count: overdueFollowupsCount,
            href: buildOverdueLeadsHref(now),
            label: "Открыть просроченные действия",
          },
        ],
        count: overdueFollowupsCount,
        description:
          "Заявки с просроченным следующим действием, где уже есть риск потери контакта или задержки ответа.",
        id: "overdue-followups",
        label: "Просроченные действия",
        summary: "Нужно вернуться к клиенту",
        tone: overdueFollowupsCount > 0 ? "alert" : "steady",
        visibility: leadRoles,
        workspaceLabel: "Лиды",
      },
      {
        actions: [
          {
            count: blockedPagesCount,
            href: buildPagesBlockedHref(),
            label: "Страницы",
          },
          {
            count: blockedProductsCount,
            href: buildProductsReviewHref(),
            label: "Продукты",
          },
          {
            count: blockedFormsCount,
            href: buildFormsBlockedHref(),
            label: "Формы",
          },
          {
            count: blockedSeoCount,
            href: buildSeoBlockedHref(),
            label: "SEO",
          },
        ],
        count: blockedPagesCount + blockedProductsCount + blockedFormsCount + blockedSeoCount,
        description:
          "Страницы, продукты, формы и SEO-настройки, которые застряли между проверкой, согласованием и выпуском.",
        id: "blocked-publishes",
        label: "Блокеры публикации",
        summary: "Сайт, каталог и формы ждут решения",
        tone:
          blockedPagesCount + blockedProductsCount + blockedFormsCount + blockedSeoCount > 0
            ? "attention"
            : "steady",
        visibility: publishingRoles,
        workspaceLabel: "Публикация",
      },
      {
        actions: [
          {
            count: staleTranslationsCount,
            href: buildTranslationsHref(),
            label: "Открыть очередь переводов",
          },
        ],
        count: staleTranslationsCount,
        description:
          "Переводы, которые устарели после изменения исходника, не заполнены или еще блокируют выпуск локали.",
        id: "stale-translations",
        label: "Устаревшие переводы",
        summary: "Локали требуют обновления",
        tone: staleTranslationsCount > 0 ? "attention" : "steady",
        visibility: translationRoles,
        workspaceLabel: "Переводы",
      },
      {
        actions: [
          {
            count: mediaRightsIssuesCount,
            href: buildMediaRightsHref(),
            label: "Открыть проверку медиа",
          },
        ],
        count: mediaRightsIssuesCount,
        description:
          "Файлы, которые еще нельзя считать безопасными для публикации из-за прав, согласования или статуса готовности.",
        id: "media-rights",
        label: "Проблемы с медиа",
        summary: "Права, согласование и публикация",
        tone: mediaRightsIssuesCount > 0 ? "attention" : "steady",
        visibility: mediaRoles,
        workspaceLabel: "Медиа",
      },
      {
        actions: [
          {
            count: creativeApprovalsCount,
            href: buildCreativeApprovalsHref(),
            label: "Открыть очередь согласования",
          },
        ],
        count: creativeApprovalsCount,
        description:
          "Кандидаты для бренда и продуктов, которые еще требуют согласования перед использованием.",
        id: "creative-approvals",
        label: "Ожидают согласования",
        summary: "Креатив требует решения",
        tone: creativeApprovalsCount > 0 ? "attention" : "steady",
        visibility: mediaRoles,
        workspaceLabel: "Креатив",
      },
    ],
  };
}
