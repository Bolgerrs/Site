import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  availabilityModeOptions,
  createSourceArtifactFields,
  findDocumentById,
  launchStageOptions,
  normalizeCanonicalPath,
  normalizeRouteSegment,
  normalizeSlugLikeValue,
  productKindOptions,
  productVariantReadinessSummaryOptions,
  translationPriorityOptions,
  validateSourceArtifactPath,
} from "../lib/payload/catalog.ts";
import { hasApprovedPrimaryInquiryForm } from "./ProductInquiryForms.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import {
  createAuditNotesField,
  createLocaleField,
  createSeoField,
  createStatusField,
} from "../lib/payload/fields.ts";
import { createStatusAuditHook } from "../lib/payload/audit.ts";
import { buildProductPreviewUrl } from "../lib/payload/preview-url.ts";
import { canAccessProductSystemFields } from "../lib/payload/product-editor.ts";

export const validateProduct: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const currentData = (data ?? {}) as Record<string, unknown>;

  if (!currentData.direction) {
    throw new Error("Product validation failed: direction is required.");
  }

  const direction = await findDocumentById(req, "product-directions", currentData.direction as
    | number
    | string
    | undefined);
  const category = await findDocumentById(req, "product-categories", currentData.category as
    | number
    | string
    | undefined);
  const line = await findDocumentById(req, "product-lines", currentData.line as
    | number
    | string
    | undefined);
  const directionDoc = direction as { id?: number | string } | null;
  const categoryDoc = category as { id?: number | string; direction?: number | string } | null;
  const lineDoc = line as
    | { direction?: number | string; category?: number | string | null }
    | null;
  const slug = normalizeSlugLikeValue(currentData.slug, normalizeSlugLikeValue(currentData.name));
  const routeSegment = normalizeRouteSegment(currentData.routeSegment, slug);

  if (!direction) {
    throw new Error("Product validation failed: direction record was not found.");
  }

  if (categoryDoc && String(categoryDoc.direction) !== String(directionDoc?.id)) {
    throw new Error("Product validation failed: category must belong to the selected direction.");
  }

  if (lineDoc && String(lineDoc.direction) !== String(directionDoc?.id)) {
    throw new Error("Product validation failed: line must belong to the selected direction.");
  }

  if (categoryDoc && lineDoc?.category && String(lineDoc.category) !== String(categoryDoc.id)) {
    throw new Error(
      "Product validation failed: selected category and line must point to the same hierarchy branch.",
    );
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Product validation failed: sourceOfTruthArtifact",
  );

  for (const reference of (currentData.sourceArtifactReferences as Array<
    { artifactPath?: unknown } | null
  > | null | undefined) ?? []) {
    validateSourceArtifactPath(
      reference?.artifactPath,
      "Product validation failed: sourceArtifactReferences.artifactPath",
    );
  }

  const nextData = {
    ...currentData,
    canonicalPath: normalizeCanonicalPath(currentData.canonicalPath, `/products/${routeSegment}`),
    routeSegment,
    slug,
  } as Record<string, unknown>;

  if (
    nextData.status === "published" &&
    (typeof nextData.sourceOfTruthArtifact !== "string" || !nextData.sourceOfTruthArtifact.trim())
  ) {
    throw new Error("Product validation failed: published records require sourceOfTruthArtifact.");
  }

  if (nextData.status === "published" && currentData.requiresQualification !== false) {
    const productId =
      (typeof originalDoc?.id === "number" || typeof originalDoc?.id === "string"
        ? originalDoc.id
        : typeof currentData.id === "number" || typeof currentData.id === "string"
          ? currentData.id
          : null);
    const primaryLocale =
      typeof nextData.primaryLocale === "string" && nextData.primaryLocale.trim().length > 0
        ? nextData.primaryLocale.trim()
        : "en";

    if (operation === "update" && productId != null) {
      const hasPrimaryForm = await hasApprovedPrimaryInquiryForm(req, productId, primaryLocale);

      if (!hasPrimaryForm) {
        throw new Error(
          "Product validation failed: published products require one approved primary inquiry form for the primary locale.",
        );
      }
    } else if (operation === "create") {
      throw new Error(
        "Product validation failed: create the product in draft first, then attach and approve its primary inquiry form before publishing.",
      );
    }
  }

  return nextData;
};

export const Products: CollectionConfig = defineCollection({
  slug: "products",
  admin: {
    defaultColumns: [
      "internalCode",
      "name",
      "direction",
      "category",
      "line",
      "status",
      "launchStage",
    ],
    group: "Каталог",
    preview: buildProductPreviewUrl,
    useAsTitle: "name",
  },
  labels: {
    plural: "Продукты",
    singular: "Продукт",
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
        collection: "products",
        labelFields: ["name", "internalCode", "slug"],
        surfaceLabel: "Product",
      }),
    ],
    beforeChange: [validateProduct],
  },
  fields: [
    {
      name: "productWorkspaceReadiness",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "./components/product-editor/ProductEditorSidebarField.tsx#ProductEditorSidebarField",
        },
      },
      label: "Готовность продукта",
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Идентичность и семейство",
          fields: [
            {
              name: "productWorkspaceOverview",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "overview",
                },
              },
              label: "Обзор продукта",
            },
            {
              type: "row",
              fields: [
                {
                  ...createStatusField(),
                },
                {
                  ...createLocaleField("primaryLocale"),
                },
                {
                  name: "launchStage",
                  type: "select",
                  defaultValue: "planned",
                  label: "Этап запуска",
                  options: launchStageOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "direction",
                  type: "relationship",
                  label: "Направление",
                  relationTo: "product-directions",
                  required: true,
                },
                {
                  name: "category",
                  type: "relationship",
                  label: "Категория",
                  relationTo: "product-categories",
                  filterOptions: ({ siblingData }) => {
                    const sibling = (siblingData ?? {}) as { direction?: string | number };

                    if (!sibling.direction) {
                      return true;
                    }

                    return {
                      direction: {
                        equals: sibling.direction,
                      },
                    };
                  },
                },
                {
                  name: "line",
                  type: "relationship",
                  label: "Подкатегория / семейство",
                  relationTo: "product-lines",
                  filterOptions: ({ siblingData }) => {
                    const sibling = (siblingData ?? {}) as {
                      direction?: string | number;
                      category?: string | number;
                    };

                    if (!sibling.direction) {
                      return true;
                    }

                    return {
                      and: [
                        {
                          direction: {
                            equals: sibling.direction,
                          },
                        },
                        ...(sibling.category
                          ? [
                              {
                                or: [
                                  {
                                    category: {
                                      equals: sibling.category,
                                    },
                                  },
                                  {
                                    category: {
                                      exists: false,
                                    },
                                  },
                                ],
                              },
                            ]
                          : []),
                      ],
                    };
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true,
                  label: "Внутреннее имя",
                  admin: {
                    description: "Рабочее имя продукта для команды и истории.",
                  },
                },
                {
                  name: "publicLabel",
                  type: "text",
                  required: true,
                  label: "Публичное название",
                  admin: {
                    description: "Имя, которое видит посетитель на сайте.",
                  },
                },
                {
                  name: "navigationLabel",
                  type: "text",
                  label: "Название в меню",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "productKind",
                  type: "select",
                  label: "Тип продукта",
                  options: productKindOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "availabilityMode",
                  type: "select",
                  defaultValue: "on-request",
                  label: "Доступность",
                  options: availabilityModeOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: "Публичный текст",
          fields: [
            {
              name: "subtitle",
              type: "text",
              label: "Подзаголовок",
            },
            {
              name: "tagline",
              type: "text",
              label: "Короткий слоган",
            },
            {
              name: "shortDescription",
              type: "textarea",
              required: true,
              label: "Короткое описание",
            },
            {
              name: "longDescription",
              type: "textarea",
              label: "Полное описание",
            },
            {
              name: "positioningStatement",
              type: "textarea",
              label: "Позиционирование",
            },
          ],
        },
        {
          label: "Медиа и документы",
          fields: [
            {
              name: "productWorkspaceMedia",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "media",
                },
              },
              label: "Медиа продукта",
            },
            {
              type: "row",
              fields: [
                {
                  name: "heroAsset",
                  type: "relationship",
                  label: "Hero-изображение",
                  relationTo: "media-assets",
                },
                {
                  name: "coverCardAsset",
                  type: "relationship",
                  label: "Изображение карточки",
                  relationTo: "media-assets",
                },
              ],
            },
          ],
        },
        {
          label: "Форма заявки",
          fields: [
            {
              name: "productWorkspaceInquiry",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "inquiry",
                },
              },
              label: "Форма заявки",
            },
            {
              type: "row",
              fields: [
                {
                  name: "primaryInquiryType",
                  type: "text",
                  label: "Тип основной заявки",
                },
                {
                  name: "requiresQualification",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Нужна квалификация лида",
                },
                {
                  name: "ownerReviewRequired",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Нужно согласование owner",
                },
              ],
            },
            {
              name: "leadRoutingNotes",
              type: "textarea",
              label: "Заметки по маршрутизации заявок",
            },
          ],
        },
        {
          label: "Варианты и спецификации",
          fields: [
            {
              name: "productWorkspaceVariants",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "variants",
                },
              },
              label: "Варианты продукта",
            },
            {
              name: "variantReadiness",
              type: "group",
              label: "Сводка по вариантам",
              admin: {
                description:
                  "Компактная сводка по вариантам, пока сами варианты остаются отдельной коллекцией.",
              },
              fields: [
                {
                  name: "readinessState",
                  type: "select",
                  defaultValue: "no-variants",
                  label: "Состояние вариантов",
                  options: productVariantReadinessSummaryOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                },
                {
                  name: "defaultVariant",
                  type: "relationship",
                  label: "Основной вариант",
                  relationTo: "product-variants",
                },
                {
                  name: "totalVariants",
                  type: "number",
                  defaultValue: 0,
                  label: "Всего вариантов",
                },
                {
                  name: "publishedVariants",
                  type: "number",
                  defaultValue: 0,
                  label: "Опубликовано вариантов",
                },
                {
                  name: "reviewVariants",
                  type: "number",
                  defaultValue: 0,
                  label: "На review",
                },
                {
                  name: "validatedPublicClaims",
                  type: "number",
                  defaultValue: 0,
                  label: "Подтвержденных claims",
                },
                {
                  name: "blockedPublicClaims",
                  type: "number",
                  defaultValue: 0,
                  label: "Заблокированных claims",
                },
                {
                  name: "lastSyncedAt",
                  type: "date",
                  label: "Последняя синхронизация",
                },
              ],
            },
          ],
        },
        {
          label: "Переводы",
          fields: [
            {
              name: "productWorkspaceTranslations",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "translations",
                },
              },
              label: "Переводы продукта",
            },
          ],
        },
        {
          label: "SEO и маршруты",
          fields: [
            {
              name: "productWorkspaceSeo",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "seo",
                },
              },
              label: "SEO продукта",
            },
            {
              type: "row",
              fields: [
                {
                  name: "slug",
                  type: "text",
                  index: true,
                  required: true,
                  unique: true,
                  label: "Slug продукта",
                },
                {
                  name: "indexable",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Разрешить индексацию",
                },
                {
                  name: "visibilityInNavigation",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Показывать в навигации",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "visibilityInFilters",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Показывать в фильтрах",
                },
                {
                  name: "isFeatured",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Показывать как featured",
                },
              ],
            },
            createSeoField(),
          ],
        },
        {
          label: "Preview и публикация",
          fields: [
            {
              name: "productWorkspacePublish",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "publish",
                },
              },
              label: "Выпуск продукта",
            },
          ],
        },
        {
          label: "Креатив и референсы",
          fields: [
            {
              name: "productWorkspaceCreative",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "creative",
                },
              },
              label: "Креатив продукта",
            },
          ],
        },
        {
          label: "Внутренние заметки",
          fields: [
            {
              name: "productWorkspaceNotes",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/product-editor/ProductEditorWorkspaceField.tsx#ProductEditorWorkspaceField",
                },
                custom: {
                  surface: "notes",
                },
              },
              label: "Рабочие заметки",
            },
            {
              name: "namingDecisionNotes",
              type: "textarea",
              label: "Заметки по naming",
            },
            {
              name: "publicationNotes",
              type: "textarea",
              label: "Заметки по выпуску",
            },
            createAuditNotesField(),
          ],
        },
        {
          label: "Системный слой",
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
                },
                {
                  name: "order",
                  type: "number",
                  index: true,
                  required: true,
                  label: "Порядок показа",
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
                  required: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "routeSegment",
                  type: "text",
                  index: true,
                  required: true,
                  unique: true,
                  label: "Сегмент маршрута",
                },
                {
                  name: "canonicalPath",
                  type: "text",
                  index: true,
                  required: true,
                  unique: true,
                  label: "Канонический путь",
                },
              ],
            },
            ...createSourceArtifactFields(),
          ],
          admin: {
            condition: (_, __, { user }) => canAccessProductSystemFields(user),
          },
        },
      ],
    },
  ],
});
