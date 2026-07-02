import type { Payload, PayloadRequest, Where } from "payload";

import { buildPagePreviewUrl } from "./preview-url.ts";
import { buildMediaWorkspaceHref } from "./media-workspace.ts";
import { buildTranslationWorkspaceHref } from "./translations-workspace.ts";
import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";
import { getAdminUser, publishingAccess } from "./access.ts";
import { hasAdminRole, type AdminRole, technicalAdminRoles } from "./roles.ts";

type PageRecord = Record<string, unknown>;
type SectionRecord = Record<string, unknown>;

export type PageEditorChecklistState = "ready" | "attention" | "blocked";

export type PageEditorChecklistItem = {
  detail: string;
  href?: string;
  id: string;
  label: string;
  state: PageEditorChecklistState;
};

export type PageEditorLinkedWorkspace = {
  count: number;
  description: string;
  href: string;
  id: string;
  label: string;
};

export type PageEditorSectionSummary = {
  documentCount: number;
  href: string;
  id: string;
  label: string;
  mediaCount: number;
  order: number;
  status: string;
  type: string;
  visible: boolean;
};

export type PageEditorListView = {
  description: string;
  href: string;
  id: string;
  label: string;
};

export type PageEditorSnapshot = {
  blockers: PageEditorChecklistItem[];
  checklist: PageEditorChecklistItem[];
  documentCount: number;
  launchLocaleCount: number;
  linkedMediaCount: number;
  linkedWorkspaces: PageEditorLinkedWorkspace[];
  listViews: PageEditorListView[];
  publicUrl: string;
  publishedTranslationCount: number;
  reviewTranslationCount: number;
  sectionCount: number;
  sectionSummaries: PageEditorSectionSummary[];
  seoApprovedCount: number;
  seoCount: number;
  translationCount: number;
  visibleSectionCount: number;
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

function getPageId(page: PageRecord) {
  const id = page.id;
  return typeof id === "number" || typeof id === "string" ? id : undefined;
}

function getPageLocale(page: PageRecord) {
  return getText(page.primaryLocale) || "en";
}

function getPageSlug(page: PageRecord) {
  return getText(page.slug);
}

function getPageInternalCode(page: PageRecord) {
  return getText(page.internalCode);
}

function getPageRoutePath(page: PageRecord) {
  const routePath = getText(page.routePath) || "/";
  return routePath.startsWith("/") ? routePath : `/${routePath}`;
}

function getPageCanonicalPath(page: PageRecord) {
  const canonicalPath = getText(page.canonicalPath) || getPageRoutePath(page);
  return canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
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

export function getPublicSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://89.150.34.66:8093").replace(/\/+$/, "");
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
  entries: PageRecord[],
  fallbackHref: string,
) {
  if (entries.length === 1) {
    const id = getRelationId(entries[0]?.id);
    if (id != null) {
      return buildAdvancedCollectionHref("seo-entries", { id });
    }
  }

  return fallbackHref;
}

function createTranslationWhere(slug: string, internalCode: string): Where {
  if (slug && internalCode) {
    return {
      and: [
        {
          ownerCollection: {
            equals: "pages",
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
          equals: "pages",
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

async function countDocs(payload: Payload, collection: "seo-entries" | "translations", where: Where) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where,
  });

  return result.docs as unknown as PageRecord[];
}

function withOptionalHref(
  item: Omit<PageEditorChecklistItem, "href">,
  href?: string,
): PageEditorChecklistItem {
  return href ? { ...item, href } : item;
}

async function loadSections(
  payload: Payload,
  page: PageRecord,
): Promise<PageEditorSectionSummary[]> {
  const sectionRows = asArray<Record<string, unknown>>(page.sections);
  const results = await Promise.all(
    sectionRows.map(async (row, index) => {
      const sectionId = getRelationId(row.section);
      const fallbackOrder = index * 10 + 10;

      if (!sectionId) {
        return null;
      }

      const section = (await payload.findByID({
        collection: "page-sections",
        depth: 0,
        id: sectionId,
        overrideAccess: true,
      })) as unknown as SectionRecord | null;

      if (!section) {
        return null;
      }

      const mediaIds = new Set<string>();
      const documentIds = new Set<string>();
      const heroMediaId = getRelationId((section.heroContent as { heroMedia?: unknown } | null)?.heroMedia);

      if (heroMediaId !== null) {
        mediaIds.add(String(heroMediaId));
      }

      for (const item of asArray<Record<string, unknown>>(section.galleryItems)) {
        const assetId = getRelationId(item.asset);

        if (assetId !== null) {
          mediaIds.add(String(assetId));
        }
      }

      for (const item of asArray<unknown>(
        (section.journalDownloadsContent as { documents?: unknown[] } | null)?.documents,
      )) {
        const documentId = getRelationId(item);

        if (documentId !== null) {
          documentIds.add(String(documentId));
        }
      }

      return {
        documentCount: documentIds.size,
        href: buildAdvancedCollectionHref("page-sections", { id: sectionId }),
        id: String(sectionId),
        label: getText(section.previewLabel) || getText(section.title) || `Section ${index + 1}`,
        mediaCount: mediaIds.size,
        order: getNumber(row.order) || fallbackOrder,
        status: getText(section.status) || "draft",
        type: getText(section.sectionType) || "section",
        visible: row.visible !== false,
      } satisfies PageEditorSectionSummary;
    }),
  );

  return results
    .filter((entry): entry is PageEditorSectionSummary => entry !== null)
    .sort((left, right) => left.order - right.order);
}

export function canAccessPageSystemFields(user: unknown) {
  return hasAdminRole(getAdminUser(user), technicalAdminRoles);
}

export async function canPublishPage(user: unknown, req: PayloadRequest) {
  return Boolean(await publishingAccess({ req: { ...req, user } as PayloadRequest }));
}

export async function getPagePreviewUrl<T extends object>(page: T, req: PayloadRequest) {
  const record = page as PageRecord;

  return buildPagePreviewUrl(record, {
    locale: getPageLocale(record),
    req,
    token: null,
  });
}

export function getPagePublicUrl<T extends object>(page: T) {
  const record = page as PageRecord;
  return `${getPublicSiteOrigin()}${normalizeLocalePath(getPageCanonicalPath(record), getPageLocale(record))}`;
}

export function getPageWorkspaceRoleLabel(role: AdminRole | null | undefined) {
  switch (role) {
    case "owner":
      return "Владелец утверждает выпуск, проверяет маршрут страницы и при необходимости открывает расширенные поля.";
    case "admin":
      return "Администратор поддерживает тексты, блоки, SEO и preview flow без вмешательства в код.";
    case "content-editor":
      return "Контент-редактор отвечает за видимые тексты, кнопки и очередность блоков внутри безопасной структуры.";
    case "translator":
      return "Переводчик работает через связанные записи переводов, а не через несистемные правки страницы.";
    case "media-manager":
      return "Медиа-менеджер проверяет привязанные материалы и их права на использование.";
    case "developer":
      return "Разработчик может проверить маршрутизацию и защищенные системные поля, не ломая owner-flow.";
    default:
      return "Используйте только безопасные поля страницы. Layout, motion и route code остаются у разработчика.";
  }
}

export async function getPageEditorSnapshot<T extends object>(
  payload: Payload,
  page: T,
): Promise<PageEditorSnapshot> {
  const record = page as PageRecord;
  const pageId = getPageId(record);
  const slug = getPageSlug(record);
  const internalCode = getPageInternalCode(record);
  const locale = getPageLocale(record);
  const pageFamily = getText(record.pageFamily) || "home";
  const status = getText(record.status) || "draft";
  const routePath = getPageRoutePath(record);
  const launchLocaleCount = 7;
  const sectionPlan = asArray<Record<string, unknown>>(record.sectionPlan);
  const sections = pageId ? await loadSections(payload, record) : [];

  const mediaIds = new Set<string>();
  const documentIds = new Set<string>();

  for (const field of [record.heroMedia, record.coverMedia, record.seoOgImage]) {
    const id = getRelationId(field);

    if (id !== null) {
      mediaIds.add(String(id));
    }
  }

  for (const document of asArray<unknown>(record.relatedDocuments)) {
    const id = getRelationId(document);

    if (id !== null) {
      documentIds.add(String(id));
    }
  }

  const linkedMediaCount =
    mediaIds.size + sections.reduce((total, section) => total + section.mediaCount, 0);
  const documentCount =
    documentIds.size + sections.reduce((total, section) => total + section.documentCount, 0);

  if (!pageId || !slug) {
    return {
      blockers: [],
      checklist: [
        {
          detail: "Save the page draft first to unlock preview, linked sections, SEO and translation workspaces.",
          id: "save-first",
          label: "Save the page draft",
          state: "attention",
        },
      ],
      documentCount,
      launchLocaleCount,
      linkedMediaCount,
      linkedWorkspaces: [],
      listViews: [],
      publicUrl: getPagePublicUrl(record),
      publishedTranslationCount: 0,
      reviewTranslationCount: 0,
      sectionCount: sections.length,
      sectionSummaries: sections,
      seoApprovedCount: 0,
      seoCount: 0,
      translationCount: 0,
      visibleSectionCount: sections.filter((section) => section.visible).length,
    };
  }

  const [translations, seoEntries] = await Promise.all([
    countDocs(payload, "translations", createTranslationWhere(slug, internalCode)),
    countDocs(payload, "seo-entries", {
      and: [
        {
          ownerType: {
            equals: "page",
          },
        },
        {
          ownerPage: {
            equals: pageId,
          },
        },
      ],
    }),
  ]);

  const translationCount = translations.length;
  const publishedTranslationCount = translations.filter((entry) => getText(entry.status) === "published").length;
  const reviewTranslationCount = translations.filter((entry) => getText(entry.status) === "review").length;
  const seoCount = seoEntries.length;
  const seoApprovedCount = seoEntries.filter(
    (entry) =>
      getText(entry.approvalStatus) === "approved" &&
      getText(entry.publicationReadiness) === "production-ready",
  ).length;
  const visibleSectionCount = sections.filter((section) => section.visible).length;
  const hasVisibleSectionPlan = sections.length > 0 || sectionPlan.length > 0;
  const hasNarrativeContent =
    Boolean(getText(record.title)) &&
    Boolean(getText(record.heroSummary) || getText(record.introBody) || sections.length > 0);
  const indexable = record.indexable !== false;
  const reviewApproved = getText(record.approvalStatus) === "approved";
  const previewPath = getText(record.previewPath);
  const previewReady = Boolean(previewPath);
  const hasUnpublishedVisibleSection = sections.some(
    (section) => section.visible && section.status !== "published",
  );
  const publishedWithoutApprovedSeo = indexable && status === "published" && seoApprovedCount === 0;
  const isHomepage = routePath === "/" || slug === "home";

  const linkedWorkspaces: PageEditorLinkedWorkspace[] = [
    {
      count: sections.length,
      description: "Состав страницы, порядок блоков и их видимость для посетителя.",
      href: buildCollectionHref("page-sections", [
        ["where[pageFamiliesAllowed][contains]", pageFamily],
        ["sort", "previewLabel"],
      ]),
      id: "sections",
      label: "Блоки страницы",
    },
    {
      count: linkedMediaCount,
      description: isHomepage
        ? "Главное медиа, обложки и визуалы блоков, которые используются на главной странице."
        : "Изображения, видео и обложки, которые относятся к этой странице и ее видимым блокам.",
      href: isHomepage
        ? buildMediaWorkspaceHref({ context: "homepage" })
        : buildMediaWorkspaceHref({
            pageId: pageId !== undefined ? String(pageId) : null,
          }),
      id: "media",
      label: isHomepage ? "Медиа главной страницы" : "Медиа страницы",
    },
    {
      count: seoCount,
      description: "Search snippet and social metadata tied to this page.",
      href: buildSeoEntryHref(
        seoEntries,
        buildCollectionHref("seo-entries", [
          ["where[ownerType][equals]", "page"],
          ["where[ownerPage][equals]", pageId],
          ["sort", "-updatedAt"],
        ]),
      ),
      id: "seo",
      label: "SEO и превью ссылки",
    },
    {
      count: translationCount,
      description: "Языковые версии текста страницы, меню и SEO для других рынков.",
      href: buildTranslationWorkspaceHref({
        ownerCollection: "pages",
        ownerKey: slug,
      }),
      id: "translations",
      label: "Языковые версии",
    },
    {
      count: documentCount,
      description: "Документы, которые связаны с этой страницей или ее блоками.",
      href: buildCollectionHref("product-documents", [["sort", "-updatedAt"]]),
      id: "documents",
      label: "Документы",
    },
  ];

  const listViews: PageEditorListView[] = [
    {
      description: "Use this when you need to return to the exact page record that drives the current public route.",
      href: buildCollectionHref("pages", [
        ["where[routePath][equals]", routePath],
        ["sort", "routePath"],
      ]),
      id: "route",
      label: "This exact page",
    },
    {
      description: "Compare pages built from the same route family and content pattern.",
      href: buildCollectionHref("pages", [
        ["where[pageFamily][equals]", pageFamily],
        ["sort", "routePath"],
      ]),
      id: "family",
      label: "Same page family",
    },
    {
      description: "Review other pages owned by the same source locale before translation or publish checks.",
      href: buildCollectionHref("pages", [
        ["where[primaryLocale][equals]", locale],
        ["sort", "routePath"],
      ]),
      id: "locale",
      label: "Same source locale",
    },
    {
      description: "Jump to other pages in the same workflow state for review or publish triage.",
      href: buildCollectionHref("pages", [
        ["where[status][equals]", status],
        ["sort", "-updatedAt"],
      ]),
      id: "status",
      label: "Same workflow state",
    },
  ];

  const checklist: PageEditorChecklistItem[] = [
    withOptionalHref({
      detail: `${routePath} · ${pageFamily} · ${locale.toUpperCase()} source locale`,
      id: "route",
      label: "Public route is anchored",
      state: routePath && pageFamily ? "ready" : "blocked",
    }, listViews[0]?.href),
    {
      detail: hasNarrativeContent
        ? "Visible title and route-level narrative are present."
        : "Add title plus hero or intro copy before sending the page to review.",
      id: "content",
      label: "Visible copy is present",
      state: hasNarrativeContent ? "ready" : "attention",
    },
    withOptionalHref({
      detail: hasVisibleSectionPlan
        ? `${visibleSectionCount} visible sections and ${sectionPlan.length} planned entries keep composition explicit.`
        : "Add at least one linked section or section-plan entry.",
      id: "sections",
      label: "Section order is controlled",
      state: hasVisibleSectionPlan ? "ready" : status === "published" ? "blocked" : "attention",
    }, linkedWorkspaces[0]?.href),
    withOptionalHref({
      detail: indexable
        ? seoApprovedCount > 0
          ? `${seoApprovedCount}/${seoCount} SEO records are production-ready.`
          : "Indexable page still needs one approved production-ready SEO entry."
        : "Indexing is intentionally disabled for this route.",
      id: "seo",
      label: "Search and share metadata",
      state: !indexable || seoApprovedCount > 0 ? "ready" : status === "published" ? "blocked" : "attention",
    }, linkedWorkspaces[2]?.href),
    withOptionalHref({
      detail: translationCount > 0
        ? `${publishedTranslationCount} published and ${reviewTranslationCount} review translations are linked.`
        : `No translation records yet across ${launchLocaleCount} launch locales.`,
      id: "translations",
      label: "Языковые версии подключены",
      state: translationCount > 0 ? "ready" : "attention",
    }, linkedWorkspaces[3]?.href),
    {
      detail: previewReady
        ? "Draft-safe preview path is available for editor verification."
        : "Preview path is empty; editors cannot verify this route in preview yet.",
      id: "preview",
      label: "Preview route is available",
      state: previewReady ? "ready" : "blocked",
    },
  ];

  const blockers = checklist.filter((item) => item.state === "blocked");

  if (status === "published" && !reviewApproved) {
    blockers.push({
      detail: "Published pages require approvalStatus=approved.",
      id: "approval",
      label: "Approval state is not publish-safe",
      state: "blocked",
    });
  }

  if (hasUnpublishedVisibleSection) {
    blockers.push(withOptionalHref({
      detail: "One or more visible linked sections are not published yet.",
      id: "section-status",
      label: "Visible sections are not ready for live use",
      state: "blocked",
    }, linkedWorkspaces[0]?.href));
  }

  if (publishedWithoutApprovedSeo) {
    blockers.push(withOptionalHref({
      detail: "Indexable published pages cannot ship without production-ready SEO metadata.",
      id: "seo-published",
      label: "SEO is still blocking live publication",
      state: "blocked",
    }, linkedWorkspaces[2]?.href));
  }

  return {
    blockers,
    checklist,
    documentCount,
    launchLocaleCount,
    linkedMediaCount,
    linkedWorkspaces,
    listViews,
    publicUrl: getPagePublicUrl(record),
    publishedTranslationCount,
    reviewTranslationCount,
    sectionCount: sections.length,
    sectionSummaries: sections,
    seoApprovedCount,
    seoCount,
    translationCount,
    visibleSectionCount,
  };
}
