import type { CollectionConfig, PayloadRequest } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  normalizeCanonicalPath,
  normalizeSlugLikeValue,
  pageApprovalStatusOptions,
  pageAudienceModeOptions,
  pageBreadcrumbModeOptions,
  pageFamilyOptions,
  pageLayoutModeOptions,
  pageSectionTypeOptions,
  pageVisibilityAudienceOptions,
  translationPriorityOptions,
  validateSourceArtifactPath,
} from "../lib/payload/catalog.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import {
  createAuditNotesField,
  createLocaleField,
  createSeoField,
  createStatusField,
} from "../lib/payload/fields.ts";
import { createStatusAuditHook } from "../lib/payload/audit.ts";
import { buildPagePreviewUrl } from "../lib/payload/preview-url.ts";
import { canAccessPageSystemFields } from "../lib/payload/page-editor.ts";

type PageBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

const fixedRouteFamilies = {
  "brand-editorial": "/brand",
  contact: "/contact",
  "craftsmanship-editorial": "/craftsmanship",
  downloads: "/downloads",
  home: "/",
  "journal-index": "/journal",
  projects: "/projects",
  "technology-editorial": "/technology",
} as const;

const directionPaths = new Set([
  "/audio",
  "/vision-max",
  "/invisible-display",
  "/hologram",
  "/pictorial-art-display",
  "/exhibition-displays",
]);

const allowedSectionTypesByFamily: Record<
  (typeof pageFamilyOptions)[number],
  Array<(typeof pageSectionTypeOptions)[number]>
> = {
  "brand-editorial": ["hero", "overview", "materials-story", "gallery", "cta", "journal-downloads"],
  "category-landing": ["hero", "overview", "product-grid", "materials-story", "gallery", "cta"],
  contact: ["hero", "overview", "cta", "journal-downloads"],
  "craftsmanship-editorial": ["hero", "overview", "materials-story", "gallery", "cta"],
  "dealer-or-partner": ["hero", "overview", "cta"],
  "direction-landing": ["hero", "overview", "product-grid", "technology-proof", "gallery", "cta"],
  downloads: ["hero", "overview", "journal-downloads", "cta"],
  "hidden-preview": [
    "hero",
    "overview",
    "product-grid",
    "technology-proof",
    "materials-story",
    "gallery",
    "cta",
    "journal-downloads",
  ],
  home: [
    "hero",
    "overview",
    "product-grid",
    "technology-proof",
    "materials-story",
    "gallery",
    "cta",
    "journal-downloads",
  ],
  "journal-entry": ["hero", "overview", "gallery", "journal-downloads", "cta"],
  "journal-index": ["hero", "overview", "journal-downloads", "cta"],
  "legal-or-policy": ["hero", "overview", "cta"],
  projects: ["hero", "overview", "gallery", "cta"],
  request: ["hero", "overview", "cta"],
  "technology-editorial": ["hero", "overview", "technology-proof", "gallery", "cta"],
};

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveDefaultRoutePath(pageFamily: string, slug: string) {
  if (pageFamily in fixedRouteFamilies) {
    return fixedRouteFamilies[pageFamily as keyof typeof fixedRouteFamilies];
  }

  if (pageFamily === "hidden-preview") {
    return `/preview/${slug || "page"}`;
  }

  if (pageFamily === "request") {
    return `/request/${slug || "page"}`;
  }

  if (pageFamily === "direction-landing" || pageFamily === "category-landing") {
    return `/${slug || "page"}`;
  }

  return `/${slug || "page"}`;
}

async function getPageSectionDoc(
  req: PayloadRequest,
  id: number | string | null | undefined,
): Promise<Record<string, unknown> | null> {
  if (!id) {
    return null;
  }

  const section = await req.payload.findByID({
    collection: "page-sections",
    depth: 0,
    id,
    overrideAccess: true,
  });

  return (section as unknown as Record<string, unknown> | null) ?? null;
}

export const validatePage = async ({
  data,
  operation,
  originalDoc,
  req,
}: PageBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };
  const title = getText(currentData.title);
  const pageFamily = getText(currentData.pageFamily) || "home";
  const slug =
    pageFamily === "home"
      ? "home"
      : normalizeSlugLikeValue(currentData.slug, normalizeSlugLikeValue(title, "page"));
  const routePath = normalizeCanonicalPath(
    currentData.routePath,
    resolveDefaultRoutePath(pageFamily, slug),
  );
  const canonicalPath = normalizeCanonicalPath(currentData.canonicalPath, routePath);
  const previewPath = normalizeCanonicalPath(currentData.previewPath, routePath);

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Page validation failed: sourceOfTruthArtifact",
  );

  for (const reference of asArray<{ artifactPath?: unknown } | null>(
    currentData.sourceArtifactReferences,
  )) {
    validateSourceArtifactPath(
      reference?.artifactPath,
      "Page validation failed: sourceArtifactReferences.artifactPath",
    );
  }

  const nextData = {
    ...currentData,
    canonicalPath,
    isHomepage: pageFamily === "home",
    previewPath,
    routePath,
    slug,
  } as Record<string, unknown>;

  if (pageFamily in fixedRouteFamilies) {
    const expected = fixedRouteFamilies[pageFamily as keyof typeof fixedRouteFamilies];

    if (routePath !== expected) {
      throw new Error(
        `Page validation failed: ${pageFamily} pages must use routePath ${expected}.`,
      );
    }
  }

  if (pageFamily === "direction-landing" && !directionPaths.has(routePath)) {
    throw new Error(
      "Page validation failed: direction-landing pages must map to an existing public direction route.",
    );
  }

  if (pageFamily === "category-landing" && !/^\/audio\/[^/]+$/.test(routePath)) {
    throw new Error(
      "Page validation failed: category-landing pages must map to an existing public /audio/[category] route.",
    );
  }

  if (pageFamily === "request" && !/^\/request\/[^/]+$/.test(routePath)) {
    throw new Error(
      "Page validation failed: request pages must map to an existing public /request/[productSlug] route.",
    );
  }

  const sections = asArray<Record<string, unknown>>(nextData.sections);
  const sectionPlan = asArray<Record<string, unknown>>(nextData.sectionPlan);

  if (nextData.status === "published" && sections.length === 0 && sectionPlan.length === 0) {
    throw new Error(
      "Page validation failed: published pages require sections or a section plan.",
    );
  }

  const allowedTypes = new Set(
    allowedSectionTypesByFamily[pageFamily as keyof typeof allowedSectionTypesByFamily] ?? [],
  );

  for (const sectionItem of sections) {
    const sectionDoc = await getPageSectionDoc(
      req,
      sectionItem.section as number | string | null | undefined,
    );

    if (!sectionDoc) {
      throw new Error("Page validation failed: section reference was not found.");
    }

    const sectionType = getText(sectionDoc.sectionType);

    if (allowedTypes.size > 0 && !allowedTypes.has(sectionType as (typeof pageSectionTypeOptions)[number])) {
      throw new Error(
        `Page validation failed: ${pageFamily} pages cannot use section type ${sectionType}.`,
      );
    }

    if (sectionDoc.status !== "published" && nextData.status === "published") {
      throw new Error(
        "Page validation failed: published pages can reference only published sections.",
      );
    }
  }

  if (nextData.status === "published" && nextData.approvalStatus !== "approved") {
    throw new Error(
      "Page validation failed: published pages require approvalStatus=approved.",
    );
  }

  if (nextData.indexable !== false) {
    const seo = (nextData.seo ?? {}) as Record<string, unknown>;

    if (
      nextData.status === "published" &&
      (!getText(seo.title) || !getText(seo.description))
    ) {
      throw new Error(
        "Page validation failed: published indexable pages require seo.title and seo.description.",
      );
    }
  }

  return nextData;
};

export const Pages: CollectionConfig = defineCollection({
  slug: "pages",
  admin: {
    defaultColumns: [
      "internalCode",
      "title",
      "pageFamily",
      "routePath",
      "status",
      "approvalStatus",
      "primaryLocale",
    ],
    group: "Site content",
    listSearchableFields: ["internalCode", "title", "slug", "routePath", "navigationLabel"],
    preview: buildPagePreviewUrl,
    useAsTitle: "title",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    afterChange: [
      createStatusAuditHook({
        collection: "pages",
        labelFields: ["title", "internalCode", "routePath"],
        surfaceLabel: "Page",
      }),
    ],
    beforeChange: [validatePage],
  },
  fields: [
    {
      name: "pageWorkspaceReadiness",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "./components/page-editor/PageEditorSidebarField.tsx#PageEditorSidebarField",
        },
      },
      label: "Подсказки по выпуску",
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Первый экран",
          fields: [
            {
              name: "pageWorkspaceOverview",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/page-editor/PageEditorWorkspaceField.tsx#PageEditorWorkspaceField",
                },
                custom: {
                  surface: "overview",
                },
              },
              label: "Первый экран страницы",
            },
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  type: "text",
                  localized: true,
                  required: true,
                  label: "Главный заголовок",
                  admin: {
                    description: "Главный заголовок, который посетитель видит в первом экране.",
                  },
                },
                {
                  name: "eyebrow",
                  type: "text",
                  localized: true,
                  label: "Короткая подпись",
                  admin: {
                    description: "Небольшая строка над заголовком, если она нужна в первом экране.",
                  },
                },
                {
                  name: "navigationLabel",
                  type: "text",
                  localized: true,
                  label: "Короткое название для меню",
                  admin: {
                    description: "Если в меню нужен более короткий вариант названия страницы.",
                  },
                },
              ],
            },
            {
              name: "heroSummary",
              type: "textarea",
              localized: true,
              label: "Основной текст первого экрана",
              admin: {
                description: "Короткое объяснение страницы рядом с главным заголовком.",
              },
            },
            {
              name: "introBody",
              type: "textarea",
              localized: true,
              label: "Вступительный текст",
              admin: {
                description: "Спокойный дополнительный текст после первого экрана или перед первым блоком.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "heroMedia",
                  type: "relationship",
                  relationTo: "media-assets",
                  label: "Главное изображение или видео",
                },
                {
                  name: "coverMedia",
                  type: "relationship",
                  relationTo: "media-assets",
                  label: "Резервная обложка",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "heroPrimaryCtaLabel",
                  type: "text",
                  localized: true,
                  label: "Основная кнопка",
                },
                {
                  name: "heroPrimaryCtaTarget",
                  type: "text",
                  localized: true,
                  label: "Куда ведет основная кнопка",
                },
                {
                  name: "heroSecondaryCtaLabel",
                  type: "text",
                  localized: true,
                  label: "Дополнительная кнопка",
                },
                {
                  name: "heroSecondaryCtaTarget",
                  type: "text",
                  localized: true,
                  label: "Куда ведет дополнительная кнопка",
                },
              ],
            },
            {
              name: "pagePurpose",
              type: "textarea",
              label: "Что должна сделать эта страница для клиента",
              admin: {
                description: "Внутренняя заметка в обычном языке: зачем существует эта страница и к чему ведет.",
              },
            },
          ],
        },
        {
          label: "Блоки",
          fields: [
            {
              name: "pageWorkspaceSections",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/page-editor/PageEditorWorkspaceField.tsx#PageEditorWorkspaceField",
                },
                custom: {
                  surface: "sections",
                },
              },
              label: "Блоки страницы",
            },
            {
              name: "sections",
              type: "array",
              labels: {
                plural: "Блоки страницы",
                singular: "Блок страницы",
              },
              fields: [
                {
                  name: "section",
                  type: "relationship",
                  relationTo: "page-sections",
                  required: true,
                  label: "Карточка блока",
                },
                {
                  name: "visible",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Показывать на странице",
                },
                {
                  name: "order",
                  type: "number",
                  min: 0,
                  label: "Порядок показа",
                },
                {
                  name: "previewAnchor",
                  type: "text",
                  label: "Якорь предпросмотра",
                  admin: {
                    description: "Необязательный якорь для перехода к нужному месту в preview.",
                  },
                },
              ],
            },
            {
              name: "sectionPlan",
              type: "array",
              labels: {
                plural: "План блоков",
                singular: "Элемент плана блока",
              },
              fields: [
                {
                  name: "sectionKey",
                  type: "text",
                  required: true,
                  label: "Ключ блока",
                },
                {
                  name: "expectedType",
                  type: "select",
                  label: "Ожидаемый тип блока",
                  options: pageSectionTypeOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "notes",
                  type: "text",
                  label: "Заметка по плану",
                },
              ],
            },
          ],
        },
        {
          label: "Предпросмотр и выпуск",
          fields: [
            {
              name: "pageWorkspaceNavigation",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/page-editor/PageEditorWorkspaceField.tsx#PageEditorWorkspaceField",
                },
                custom: {
                  surface: "navigation",
                },
              },
              label: "Навигация и выпуск",
            },
            {
              type: "row",
              fields: [
                createStatusField(),
                {
                  name: "approvalStatus",
                  type: "select",
                  required: true,
                  defaultValue: "pending",
                  label: "Согласование",
                  admin: {
                    description: "Текущий этап перед выпуском страницы.",
                  },
                  options: pageApprovalStatusOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "showInHeader",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Показывать в шапке",
                },
                {
                  name: "showInFooter",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Показывать в подвале",
                },
                {
                  name: "navigationOrder",
                  type: "number",
                  defaultValue: 100,
                  label: "Порядок в меню",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "headerLabelOverride",
                  type: "text",
                  localized: true,
                  label: "Название в шапке",
                },
                {
                  name: "footerLabelOverride",
                  type: "text",
                  localized: true,
                  label: "Название в подвале",
                },
              ],
            },
            {
              name: "previewNotes",
              type: "textarea",
              label: "Что проверить в preview",
              admin: {
                description: "Необязательная подсказка, что именно проверить до публикации.",
              },
            },
          ],
        },
        {
          label: "Связи и SEO",
          fields: [
            {
              name: "pageWorkspaceRelations",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/page-editor/PageEditorWorkspaceField.tsx#PageEditorWorkspaceField",
                },
                custom: {
                  surface: "relations",
                },
              },
              label: "Связанные поверхности",
            },
            {
              type: "row",
              fields: [
                {
                  name: "seoOgImage",
                  type: "relationship",
                  relationTo: "media-assets",
                },
              ],
            },
            createSeoField(),
            {
              name: "relatedProducts",
              type: "relationship",
              hasMany: true,
              relationTo: "products",
            },
            {
              name: "relatedDirections",
              type: "relationship",
              hasMany: true,
              relationTo: "product-directions",
            },
            {
              name: "relatedDocuments",
              type: "relationship",
              hasMany: true,
              relationTo: "product-documents",
            },
          ],
        },
        {
          label: "Заметки команды",
          fields: [
            {
              name: "pageWorkspaceNotes",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/page-editor/PageEditorWorkspaceField.tsx#PageEditorWorkspaceField",
                },
                custom: {
                  surface: "notes",
                },
              },
              label: "Заметки",
            },
            createAuditNotesField(),
          ],
        },
        {
          label: "Расширенные настройки",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "internalCode",
                  type: "text",
                  required: true,
                  unique: true,
                  label: "Внутренний код",
                  admin: {
                    description: "Служебный код для поиска и истории. Обычно менять его не нужно.",
                  },
                },
                createLocaleField("primaryLocale"),
                {
                  name: "slug",
                  type: "text",
                  required: true,
                  unique: true,
                  label: "Ключ страницы",
                  admin: {
                    description: "Стабильный ключ, который используется системой для маршрута и связей.",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "pageFamily",
                  type: "select",
                  required: true,
                  label: "Семейство страницы",
                  admin: {
                    description: "Определяет тип публичной страницы и допустимые блоки.",
                  },
                  options: pageFamilyOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "layoutMode",
                  type: "select",
                  required: true,
                  defaultValue: "brand-editorial",
                  label: "Сценарий композиции",
                  admin: {
                    description: "Базовая схема сборки страницы. Меняйте только осознанно.",
                  },
                  options: pageLayoutModeOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "translationPriority",
                  type: "select",
                  defaultValue: "normal",
                  label: "Приоритет перевода",
                  options: translationPriorityOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "routePath",
                  type: "text",
                  required: true,
                  unique: true,
                  label: "Публичный адрес",
                  admin: {
                    description: "Адрес страницы на сайте. Меняйте только если понимаете последствия.",
                  },
                },
                {
                  name: "canonicalPath",
                  type: "text",
                  required: true,
                  unique: true,
                  label: "Канонический адрес",
                  admin: {
                    description: "Предпочтительный адрес для поиска. Обычно совпадает с публичным.",
                  },
                },
                {
                  name: "previewPath",
                  type: "text",
                  required: true,
                  label: "Адрес предпросмотра",
                  admin: {
                    description: "Черновой путь для проверки страницы до выпуска.",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "audienceMode",
                  type: "select",
                  defaultValue: "public",
                  label: "Режим аудитории",
                  options: pageAudienceModeOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "breadcrumbsMode",
                  type: "select",
                  defaultValue: "auto",
                  label: "Хлебные крошки",
                  options: pageBreadcrumbModeOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "visibilityAudience",
                  type: "select",
                  defaultValue: "public",
                  label: "Кому видна страница",
                  options: pageVisibilityAudienceOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "navigationGroup",
                  type: "text",
                  label: "Группа меню",
                },
                {
                  name: "indexable",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Разрешить индексацию",
                },
                {
                  name: "ownerReviewRequired",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Нужно согласование owner перед выпуском",
                },
              ],
            },
            {
              name: "sourceOfTruthArtifact",
              type: "text",
            },
            {
              name: "sourceArtifactReferences",
              type: "array",
              labels: {
                plural: "Source artifact references",
                singular: "Source artifact reference",
              },
              fields: [
                {
                  name: "artifactPath",
                  type: "text",
                  required: true,
                },
                {
                  name: "note",
                  type: "text",
                },
              ],
            },
          ],
          admin: {
            condition: (_, __, { user }) => canAccessPageSystemFields(user),
          },
        },
      ],
    },
  ],
});
