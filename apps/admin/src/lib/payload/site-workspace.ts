import type { Payload, PayloadRequest } from "payload";

import type { EditableSurfaceRegistry } from "../admin-bff/surface-registry.ts";
import { getEditableSurfaceRegistry } from "../admin-bff/surface-registry.ts";
import { getAdminUser } from "./access.ts";
import { getPageEditorSnapshot, getPagePreviewUrl, getPagePublicUrl } from "./page-editor.ts";
import { hasAdminRole, type AdminRole } from "./roles.ts";

const siteWorkspaceReadRoles = [
  "owner",
  "admin",
  "content-editor",
  "translator",
  "developer",
] as const satisfies readonly AdminRole[];

type PageRecord = Record<string, unknown>;
type SectionRecord = Record<string, unknown>;
type GenericRecord = Record<string, unknown>;

export type SiteWorkspaceGroup = {
  count: number;
  description: string;
  id: string;
  label: string;
};

export type SiteWorkspacePageAction = {
  description: string;
  href: string;
  id: string;
  label: string;
};

export type SiteWorkspacePageSummary = {
  actions: SiteWorkspacePageAction[];
  approvalStatus: string;
  editorHref: string;
  groupId: string;
  id: string;
  navigationOrder: number;
  pageFamily: string;
  primaryLocale: string;
  routePath: string;
  sectionCount: number;
  status: string;
  title: string;
  translationOwnerKey: string;
  visibleSectionCount: number;
};

export type SiteWorkspaceTabSummary = {
  description: string;
  href: string;
  id: string;
  label: string;
  value: string;
};

export type SiteWorkspaceBlockCard = {
  description: string;
  documentCount: number;
  editHref: string;
  focusAreas: string[];
  id: string;
  label: string;
  mediaItems: SiteWorkspaceMediaItem[];
  mediaCount: number;
  order: number;
  status: string;
  type: string;
  visible: boolean;
};

export type SiteWorkspaceMediaItem = {
  altText: string;
  fileName: string;
  fileSizeLabel: string;
  fileUrl: string;
  id: string;
  label: string;
  mimeType: string;
  previewUrl: string;
  slot: string;
  type: "document" | "image" | "video";
};

export type SiteWorkspacePageContent = {
  eyebrow: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaTarget: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaTarget: string;
  heroSummary: string;
  introBody: string;
  navigationLabel: string;
  pagePurpose: string;
  previewNotes: string;
  title: string;
};

export type SiteWorkspacePageSeo = {
  description: string;
  indexable: boolean;
  locale: string;
  title: string;
};

export type SiteWorkspaceSelectedPage = {
  actions: SiteWorkspacePageAction[];
  approvalStatus: string;
  blockEditorLead: string;
  blocks: SiteWorkspaceBlockCard[];
  content: SiteWorkspacePageContent;
  editorHref: string;
  historyHref: string;
  id: string;
  liveHref: string;
  mediaItems: SiteWorkspaceMediaItem[];
  pageFamily: string;
  previewHref: string;
  primaryLocale: string;
  publicationLead: string;
  routePath: string;
  seo: SiteWorkspacePageSeo;
  status: string;
  summary: string;
  tabs: SiteWorkspaceTabSummary[];
  title: string;
  translationOwnerKey: string;
};

export type SiteWorkspaceSnapshot = {
  canPublish: boolean;
  canRead: boolean;
  canUpdate: boolean;
  emptyState: string;
  generatedAt: string;
  groups: SiteWorkspaceGroup[];
  pages: SiteWorkspacePageSummary[];
  selectedPage: SiteWorkspaceSelectedPage | null;
  selectedPageId: string | null;
  surfaceRegistry: EditableSurfaceRegistry | null;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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

function getMediaItem(
  value: unknown,
  input: Omit<SiteWorkspaceMediaItem, "altText" | "fileName" | "fileSizeLabel" | "fileUrl" | "id" | "mimeType" | "previewUrl">,
): SiteWorkspaceMediaItem | null {
  const relationId = getRelationId(value);
  if (relationId == null) {
    return null;
  }

  const record = value && typeof value === "object" ? (value as GenericRecord) : {};
  const assetType = getText(record.assetType);
  const type =
    input.type === "image" && (assetType === "video-reference" || assetType === "motion-poster")
      ? "video"
      : input.type;
  const label =
    getText(record.assetTitle) ||
    getText(record.filename) ||
    getText(record.title) ||
    `${input.label} #${String(relationId)}`;

  return {
    ...input,
    altText: getText(record.altText),
    fileName: getText(record.filename),
    fileSizeLabel: typeof record.filesize === "number" ? `${Math.round(record.filesize / 1024)} KB` : "",
    fileUrl: getText(record.url) || getText(record.thumbnailURL),
    id: String(relationId),
    label,
    mimeType: getText(record.mimeType),
    previewUrl: getText(record.thumbnailURL) || getText(record.url),
    type,
  };
}

function getPageId(page: PageRecord) {
  const id = page.id;
  return typeof id === "number" || typeof id === "string" ? String(id) : "";
}

function getPageTranslationOwnerKey(page: PageRecord) {
  return getText(page.slug) || getText(page.internalCode) || getPageId(page);
}

function getPageTitle(page: PageRecord) {
  return getText(page.title) || getText(page.navigationLabel) || getText(page.slug) || "Без названия";
}

function getPageRoutePath(page: PageRecord) {
  const routePath = getText(page.routePath) || "/";
  return routePath.startsWith("/") ? routePath : `/${routePath}`;
}

function getPagePrimaryLocale(page: PageRecord) {
  return (getText(page.primaryLocale) || "en").toUpperCase();
}

function getPageFamily(page: PageRecord) {
  return getText(page.pageFamily) || "page";
}

function buildPageScopedHref(pageId: string, panel = "overview") {
  return `/admin/site?selected=${encodeURIComponent(pageId)}#page-${panel}`;
}

function buildPageEditorHref(pageId: string) {
  return buildPageScopedHref(pageId);
}

function buildSectionEditorHref(sectionId: number | string) {
  return `#block-${encodeURIComponent(String(sectionId))}`;
}

function getPageGroup(page: PageRecord) {
  const pageFamily = getPageFamily(page);
  const routePath = getPageRoutePath(page);

  if (routePath === "/" || pageFamily === "home") {
    return {
      description: "Главная и ее первый сценарий просмотра.",
      id: "home",
      label: "Главная",
      order: 10,
    };
  }

  if (
    [
      "brand-editorial",
      "technology-editorial",
      "craftsmanship-editorial",
      "projects",
      "journal-index",
      "journal-entry",
    ].includes(pageFamily)
  ) {
    return {
      description: "Брендовые и редакционные страницы первого слоя.",
      id: "editorial",
      label: "Основные страницы",
      order: 20,
    };
  }

  if (pageFamily === "direction-landing") {
    return {
      description: "Страницы направлений, которые открывают продуктовые миры.",
      id: "directions",
      label: "Направления",
      order: 30,
    };
  }

  if (pageFamily === "category-landing") {
    return {
      description: "Категории внутри аудио-направления.",
      id: "categories",
      label: "Категории",
      order: 40,
    };
  }

  if (pageFamily === "request") {
    return {
      description: "Страницы заявок, связанные с конкретными продуктами.",
      id: "requests",
      label: "Товарные заявки",
      order: 50,
    };
  }

  return {
    description: "Контактные, сервисные, скрытые или служебные страницы.",
    id: "service",
    label: "Сервисные страницы",
    order: 60,
  };
}

function getVisibleSectionCount(page: PageRecord) {
  return asArray<Record<string, unknown>>(page.sections).filter((section) => section.visible !== false).length;
}

function buildPageActions(page: PageRecord) {
  const pageId = getPageId(page);
  const routePath = getPageRoutePath(page);

  return [
    {
      description: "Открыть страницу в безопасном редакторе сайта.",
      href: `/admin/site?selected=${encodeURIComponent(pageId)}`,
      id: "open",
      label: "Открыть страницу",
    },
    {
      description: "Подготовить новую страницу через рабочий слой сайта, не открывая технические разделы.",
      href: buildPageScopedHref(pageId, "overview"),
      id: "duplicate",
      label: "Использовать как шаблон",
    },
    {
      description: "Скрыть страницу через статус публикации и аудит согласования.",
      href: buildPageScopedHref(pageId, "publication"),
      id: "hide",
      label: "Скрыть / снять с публикации",
    },
    {
      description: "Проверить готовность, предпросмотр и затем опубликовать.",
      href: "/admin/checks?check=unpublished-changes",
      id: "publish",
      label: "Проверить и публиковать",
    },
    {
      description: routePath === "/"
        ? "Порядок главной не меняется. Ниже можно менять порядок блоков."
        : "Менять порядок можно через navigation order или через порядок блоков внутри самой страницы.",
      href: buildPageScopedHref(pageId, "blocks"),
      id: "reorder",
      label: "Порядок и очередность",
    },
  ] satisfies SiteWorkspacePageAction[];
}

function buildHistoryHref(pageId: string) {
  return buildPageScopedHref(pageId, "history");
}

function getSectionLabel(section: SectionRecord, index: number) {
  return getText(section.previewLabel) || getText(section.title) || getText(section.sectionKey) || `Блок ${index + 1}`;
}

async function loadSelectedBlocks(payload: Payload, page: PageRecord) {
  const rows = asArray<Record<string, unknown>>(page.sections);
  const blocks = await Promise.all(
    rows.map(async (row, index) => {
      const sectionId = getRelationId(row.section);

      if (sectionId == null) {
        return null;
      }

      const section = (await payload.findByID({
        collection: "page-sections",
        depth: 1,
        id: sectionId,
        overrideAccess: true,
      })) as unknown as SectionRecord | null;

      if (!section) {
        return null;
      }

      const focusAreas: string[] = ["Внутреннее имя блока"];
      const mediaItems = [
        getMediaItem((section.heroContent as { heroMedia?: unknown } | null)?.heroMedia, {
          label: "Главное медиа блока",
          slot: "hero",
          type: "image",
        }),
        ...asArray<GenericRecord>(section.galleryItems).map((item, galleryIndex) =>
          getMediaItem(item.asset, {
            label: `Галерея ${galleryIndex + 1}`,
            slot: "gallery",
            type: "image",
          }),
        ),
        ...asArray<unknown>((section.journalDownloadsContent as { documents?: unknown[] } | null)?.documents).map((document, documentIndex) =>
          getMediaItem(document, {
            label: `PDF/документ блока ${documentIndex + 1}`,
            slot: "document",
            type: "document",
          }),
        ),
      ].filter((item): item is SiteWorkspaceMediaItem => item !== null);
      const mediaCount =
        (getRelationId((section.heroContent as { heroMedia?: unknown } | null)?.heroMedia) != null ? 1 : 0) +
        asArray(section.galleryItems).filter((item) => getRelationId((item as GenericRecord).asset) != null).length;
      const documentCount = asArray(
        (section.journalDownloadsContent as { documents?: unknown[] } | null)?.documents,
      ).filter((item) => getRelationId(item) != null).length;

      if (getText(section.title)) {
        focusAreas.push("Заголовок");
      }
      if (getText(section.lead) || getText(section.body)) {
        focusAreas.push("Описание и подписи");
      }
      if (mediaCount > 0) {
        focusAreas.push(documentCount > 0 ? "Изображения / галерея / PDF" : "Изображения / галерея");
      } else if (documentCount > 0) {
        focusAreas.push("PDF / документы");
      }
      if (getText((section.ctaContent as GenericRecord | null)?.primaryLabel)) {
        focusAreas.push("Кнопка");
      }
      if (asArray((section.productGridContent as GenericRecord | null)?.products).length > 0) {
        focusAreas.push("Связанные товары");
      }
      if (getText(section.previewNotes)) {
        focusAreas.push("Заметка менеджера");
      }

      const description =
        getText(section.lead) ||
        getText(section.body) ||
        getText((section.heroContent as GenericRecord | null)?.supportingLabel) ||
        "Откройте блок, чтобы поменять текст, медиа, кнопку и видимость без изменения CSS.";

      return {
        description,
        documentCount,
        editHref: buildSectionEditorHref(sectionId),
        focusAreas,
        id: String(sectionId),
        label: getSectionLabel(section, index),
        mediaItems,
        mediaCount,
        order: getNumber(row.order) || index * 10 + 10,
        status: getText(section.status) || "draft",
        type: getText(section.sectionType) || "section",
        visible: row.visible !== false,
      } satisfies SiteWorkspaceBlockCard;
    }),
  );

  return blocks
    .filter((entry): entry is SiteWorkspaceBlockCard => entry !== null)
    .sort((left, right) => left.order - right.order);
}

function getPageSummary(page: PageRecord) {
  return getText(page.heroSummary) || getText(page.introBody) || "Откройте страницу, чтобы заполнить видимый текст, блоки и кнопки.";
}

function getPageContent(page: PageRecord): SiteWorkspacePageContent {
  return {
    eyebrow: getText(page.eyebrow),
    heroPrimaryCtaLabel: getText(page.heroPrimaryCtaLabel),
    heroPrimaryCtaTarget: getText(page.heroPrimaryCtaTarget),
    heroSecondaryCtaLabel: getText(page.heroSecondaryCtaLabel),
    heroSecondaryCtaTarget: getText(page.heroSecondaryCtaTarget),
    heroSummary: getText(page.heroSummary),
    introBody: getText(page.introBody),
    navigationLabel: getText(page.navigationLabel),
    pagePurpose: getText(page.pagePurpose),
    previewNotes: getText(page.previewNotes),
    title: getPageTitle(page),
  };
}

function getPageSeo(page: PageRecord): SiteWorkspacePageSeo {
  const seo = (page.seo ?? {}) as GenericRecord;

  return {
    description: getText(seo.description) || getText(page.heroSummary),
    indexable: page.indexable !== false,
    locale: getText(page.primaryLocale) || "en",
    title: getText(seo.title) || getPageTitle(page),
  };
}

function getPageMediaItems(page: PageRecord) {
  return [
    getMediaItem(page.heroMedia, {
      label: "Главное медиа страницы",
      slot: "hero",
      type: "image",
    }),
    getMediaItem(page.coverMedia, {
      label: "Обложка страницы",
      slot: "cover",
      type: "image",
    }),
    getMediaItem(page.seoOgImage, {
      label: "Изображение для SEO",
      slot: "seo",
      type: "image",
    }),
    ...asArray<unknown>(page.relatedDocuments).map((document, index) =>
      getMediaItem(document, {
        label: `PDF/документ ${index + 1}`,
        slot: "document",
        type: "document",
      }),
    ),
  ].filter((item): item is SiteWorkspaceMediaItem => item !== null);
}

export function canReadSiteWorkspace(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), siteWorkspaceReadRoles);
}

export async function getSiteWorkspaceSnapshot(
  payload: Payload,
  req: PayloadRequest,
  input: { selected?: string | null },
): Promise<SiteWorkspaceSnapshot> {
  const canRead = canReadSiteWorkspace(req);

  if (!canRead) {
    throw new Error("forbidden");
  }

  const role = getAdminUser(req.user)?.role ?? null;
  const canPublish = role === "owner" || role === "admin";
  const canUpdate = role !== "translator";
  const pagesResult = await payload.find({
    collection: "pages",
    depth: 1,
    limit: 200,
    overrideAccess: true,
    pagination: false,
    sort: "routePath",
  });

  const pages = (pagesResult.docs as unknown as PageRecord[]).slice().sort((left, right) => {
    const leftGroup = getPageGroup(left);
    const rightGroup = getPageGroup(right);

    if (leftGroup.order !== rightGroup.order) {
      return leftGroup.order - rightGroup.order;
    }

    const leftNav = getNumber(left.navigationOrder) || 9999;
    const rightNav = getNumber(right.navigationOrder) || 9999;
    if (leftNav !== rightNav) {
      return leftNav - rightNav;
    }

    return getPageRoutePath(left).localeCompare(getPageRoutePath(right), "ru");
  });

  const groupsMap = new Map<string, SiteWorkspaceGroup>();
  const pageSummaries = pages.map((page) => {
    const group = getPageGroup(page);
    const count = groupsMap.get(group.id)?.count ?? 0;
    groupsMap.set(group.id, {
      count: count + 1,
      description: group.description,
      id: group.id,
      label: group.label,
    });

    return {
      actions: buildPageActions(page),
      approvalStatus: getText(page.approvalStatus) || "pending",
      editorHref: buildPageEditorHref(getPageId(page)),
      groupId: group.id,
      id: getPageId(page),
      navigationOrder: getNumber(page.navigationOrder),
      pageFamily: getPageFamily(page),
      primaryLocale: getPagePrimaryLocale(page),
      routePath: getPageRoutePath(page),
      sectionCount: asArray(page.sections).length,
      status: getText(page.status) || "draft",
      title: getPageTitle(page),
      translationOwnerKey: getPageTranslationOwnerKey(page),
      visibleSectionCount: getVisibleSectionCount(page),
    } satisfies SiteWorkspacePageSummary;
  });

  const selectedPageId = input.selected?.trim() || pageSummaries[0]?.id || null;
  const selectedPageRecord =
    (selectedPageId ? pages.find((page) => getPageId(page) === selectedPageId) : null) ?? null;

  let selectedPage: SiteWorkspaceSelectedPage | null = null;
  let surfaceRegistry: EditableSurfaceRegistry | null = null;

  if (selectedPageRecord) {
    const selectedId = getPageId(selectedPageRecord);
    const snapshot = await getPageEditorSnapshot(payload, selectedPageRecord);
    const blocks = await loadSelectedBlocks(payload, selectedPageRecord);
    const relatedProductIds = new Set(
      asArray(selectedPageRecord.relatedProducts)
        .map((entry) => getRelationId(entry))
        .filter((entry): entry is number | string => entry != null)
        .map((entry) => String(entry)),
    );
    const relatedForms = relatedProductIds.size
      ? (
          await payload.find({
            collection: "productInquiryForms",
            depth: 0,
            limit: 100,
            overrideAccess: true,
            pagination: false,
            where: {
              product: {
                in: Array.from(relatedProductIds),
              },
            },
          })
        ).docs
      : [];
    const previewHref = (await getPagePreviewUrl(selectedPageRecord, req)) || buildPageEditorHref(selectedId);
    const liveHref = getPagePublicUrl(selectedPageRecord);
    const editorHref = `/admin/site?selected=${encodeURIComponent(selectedId)}`;
    const historyHref = buildHistoryHref(selectedId);
    const formHref = buildPageScopedHref(selectedId, "forms");
    const mediaHref = buildPageScopedHref(selectedId, "media");
    const translationHref = buildPageScopedHref(selectedId, "translations");
    const seoHref = buildPageScopedHref(selectedId, "seo");
    const publicationLead =
      snapshot.blockers.length > 0
        ? `Есть ${snapshot.blockers.length} блокирующих пункта перед публикацией.`
        : "Жестких блокеров не найдено. Проверьте предпросмотр и согласование перед публикацией.";

    selectedPage = {
      actions: [
        {
          description: "Безопасный редактор страницы с обзором, блоками и публикацией.",
          href: editorHref,
          id: "editor",
          label: "Редактор страницы",
        },
        {
          description: "Черновой предпросмотр без выхода в production.",
          href: previewHref,
          id: "preview",
          label: "Предпросмотр",
        },
        {
          description: "Текущий публичный адрес страницы.",
          href: liveHref,
          id: "live",
          label: "Публичная страница",
        },
      ],
      approvalStatus: getText(selectedPageRecord.approvalStatus) || "pending",
      blockEditorLead:
        "Каждый блок открывается отдельной карточкой. Менеджер меняет только текст, медиа, кнопку, видимость и связанные материалы.",
      blocks,
      content: getPageContent(selectedPageRecord),
      editorHref,
      historyHref,
      id: selectedId,
      liveHref,
      mediaItems: getPageMediaItems(selectedPageRecord),
      pageFamily: getPageFamily(selectedPageRecord),
      previewHref,
      primaryLocale: getPagePrimaryLocale(selectedPageRecord),
      publicationLead,
      routePath: getPageRoutePath(selectedPageRecord),
      seo: getPageSeo(selectedPageRecord),
      status: getText(selectedPageRecord.status) || "draft",
      summary: getPageSummary(selectedPageRecord),
      tabs: [
        {
          description: "Маршрут, тип страницы, локаль и статус публикации.",
          href: editorHref,
          id: "overview",
          label: "Обзор",
          value: "Маршрут, статус, локаль",
        },
        {
          description: "Основной заголовок, подзаголовок, интро и видимые тексты страницы.",
          href: editorHref,
          id: "content",
          label: "Контент",
          value: "Заголовки и тексты",
        },
        {
          description: "Порядок блоков страницы, видимость и быстрый переход к каждому блоку.",
          href: editorHref,
          id: "blocks",
          label: "Блоки",
          value: `${snapshot.visibleSectionCount}/${snapshot.sectionCount} показано`,
        },
        {
          description: "Изображения, обложки и другие материалы, привязанные к этой странице.",
          href: mediaHref,
          id: "media",
          label: "Медиа",
          value: `${snapshot.linkedMediaCount} материалов`,
        },
        {
          description: "Основные и дополнительные кнопки страницы без перехода в сложные настройки.",
          href: editorHref,
          id: "buttons",
          label: "Кнопки",
          value:
            getText(selectedPageRecord.heroPrimaryCtaLabel) || getText(selectedPageRecord.heroSecondaryCtaLabel)
              ? "Кнопки настроены"
              : "Пока без кнопок",
        },
        {
          description: "Формы, связанные с товарами и страницами заявки.",
          href: formHref,
          id: "forms",
          label: "Формы",
          value: relatedForms.length > 0 ? `${relatedForms.length} связанных форм` : "Нужно привязать форму",
        },
        {
          description: "Очередь переводов этой страницы: пустые, обновленные и готовые версии.",
          href: translationHref,
          id: "translations",
          label: "Переводы",
          value: `${snapshot.translationCount} версий`,
        },
        {
          description: "Заголовок, описание и готовность страницы к публикации в поиске.",
          href: seoHref,
          id: "seo",
          label: "SEO",
          value: snapshot.seoCount > 0 ? `${snapshot.seoApprovedCount}/${snapshot.seoCount} готово` : "Нужно SEO",
        },
        {
          description: "История изменений и кто менял эту страницу.",
          href: historyHref,
          id: "history",
          label: "История",
          value: "Аудит действий",
        },
        {
          description: "Черновой просмотр до публикации.",
          href: previewHref,
          id: "preview-tab",
          label: "Предпросмотр",
          value: "Открыть страницу",
        },
        {
          description: "Статус, согласование и выпуск страницы после финальной проверки.",
          href: editorHref,
          id: "publication",
          label: "Публикация",
          value: publicationLead,
        },
      ],
      title: getPageTitle(selectedPageRecord),
      translationOwnerKey: getPageTranslationOwnerKey(selectedPageRecord),
    };
    surfaceRegistry = await getEditableSurfaceRegistry(payload, {
      routePath: getPageRoutePath(selectedPageRecord),
    });
  }

  return {
    canPublish,
    canRead,
    canUpdate,
    emptyState: "Страницы сайта еще не подготовлены. Создайте первую страницу или запустите базовый seed.",
    generatedAt: new Date().toISOString(),
    groups: Array.from(groupsMap.values()).sort((left, right) => left.label.localeCompare(right.label, "ru")),
    pages: pageSummaries,
    selectedPage,
    selectedPageId,
    surfaceRegistry,
  };
}
