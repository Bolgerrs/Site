import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  categoryKindOptions,
  createSourceArtifactFields,
  findDocumentById,
  normalizeCanonicalPath,
  normalizeRouteSegment,
  normalizeSlugLikeValue,
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
import { buildProductCategoryPreviewUrl } from "../lib/payload/preview-url.ts";
import { canAccessCategorySystemFields } from "../lib/payload/category-editor.ts";

export const validateProductCategory: CollectionBeforeChangeHook = async ({ data, req }) => {
  const currentData = (data ?? {}) as Record<string, unknown>;

  if (!currentData.direction) {
    throw new Error("Product category validation failed: direction is required.");
  }

  const direction = await findDocumentById(req, "product-directions", currentData.direction as
    | number
    | string
    | undefined);
  const directionDoc = direction as { canonicalPath?: string } | null;
  const slug = normalizeSlugLikeValue(currentData.slug, normalizeSlugLikeValue(currentData.name));
  const routeSegment = normalizeRouteSegment(currentData.routeSegment, slug);

  if (!direction) {
    throw new Error("Product category validation failed: direction record was not found.");
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Product category validation failed: sourceOfTruthArtifact",
  );

  for (const reference of (currentData.sourceArtifactReferences as Array<
    { artifactPath?: unknown } | null
  > | null | undefined) ?? []) {
    validateSourceArtifactPath(
      reference?.artifactPath,
      "Product category validation failed: sourceArtifactReferences.artifactPath",
    );
  }

  const nextData = {
    ...currentData,
    canonicalPath: normalizeCanonicalPath(
      currentData.canonicalPath,
      `${directionDoc?.canonicalPath ?? ""}/${routeSegment}`,
    ),
    routeSegment,
    slug,
  } as Record<string, unknown>;

  if (
    nextData.status === "published" &&
    (typeof nextData.sourceOfTruthArtifact !== "string" || !nextData.sourceOfTruthArtifact.trim())
  ) {
    throw new Error(
      "Product category validation failed: published records require sourceOfTruthArtifact.",
    );
  }

  return nextData;
};

export const ProductCategories: CollectionConfig = defineCollection({
  slug: "product-categories",
  admin: {
    defaultColumns: [
      "internalCode",
      "name",
      "direction",
      "slug",
      "status",
      "order",
      "visibilityInNavigation",
    ],
    group: "Каталог",
    preview: buildProductCategoryPreviewUrl,
    useAsTitle: "name",
  },
  labels: {
    plural: "Категории",
    singular: "Категория",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateProductCategory],
  },
  fields: [
    {
      name: "categoryWorkspaceReadiness",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "./components/category-editor/CategoryEditorSidebarField.tsx#CategoryEditorSidebarField",
        },
      },
      label: "Готовность категории",
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Обзор",
          fields: [
            {
              name: "categoryWorkspaceOverview",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/category-editor/CategoryEditorWorkspaceField.tsx#CategoryEditorWorkspaceField",
                },
                custom: {
                  surface: "overview",
                },
              },
              label: "Обзор категории",
            },
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
                  ...createStatusField(),
                },
                {
                  ...createLocaleField("primaryLocale"),
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "direction",
                  type: "relationship",
                  relationTo: "product-directions",
                  required: true,
                  label: "Направление",
                },
                {
                  name: "name",
                  type: "text",
                  required: true,
                  label: "Внутреннее имя",
                },
                {
                  name: "publicLabel",
                  type: "text",
                  required: true,
                  label: "Публичное название",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "navigationLabel",
                  type: "text",
                  label: "Название в меню",
                },
                {
                  name: "categoryKind",
                  type: "select",
                  label: "Тип категории",
                  options: categoryKindOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
                {
                  name: "productLineMode",
                  type: "select",
                  defaultValue: "optional",
                  label: "Режим подкатегорий",
                  options: ["not-used", "optional", "required"].map((value) => ({
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
              name: "shortDescription",
              type: "textarea",
              required: true,
              label: "Короткое описание",
            },
            {
              name: "description",
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
          label: "Обложка и медиа",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "heroAsset",
                  type: "relationship",
                  relationTo: "media-assets",
                  label: "Hero-изображение",
                },
                {
                  name: "coverCardAsset",
                  type: "relationship",
                  relationTo: "media-assets",
                  label: "Изображение карточки",
                },
              ],
            },
          ],
        },
        {
          label: "Продукты и подкатегории",
          fields: [
            {
              name: "categoryWorkspaceRelations",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/category-editor/CategoryEditorWorkspaceField.tsx#CategoryEditorWorkspaceField",
                },
                custom: {
                  surface: "relations",
                },
              },
              label: "Продукты и семейства",
            },
            {
              type: "row",
              fields: [
                {
                  name: "order",
                  type: "number",
                  index: true,
                  required: true,
                  label: "Порядок показа",
                },
                {
                  name: "visibilityInNavigation",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Показывать в навигации",
                },
                {
                  name: "defaultInquiryType",
                  type: "text",
                  label: "Тип заявки по умолчанию",
                },
              ],
            },
          ],
        },
        {
          label: "Переводы и SEO",
          fields: [
            {
              name: "categoryWorkspaceTranslations",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/category-editor/CategoryEditorWorkspaceField.tsx#CategoryEditorWorkspaceField",
                },
                custom: {
                  surface: "translations",
                },
              },
              label: "Переводы и SEO",
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
                  label: "Slug категории",
                },
                {
                  name: "routeSegment",
                  type: "text",
                  index: true,
                  required: true,
                  unique: true,
                  label: "Сегмент маршрута",
                },
                {
                  name: "indexable",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Разрешить индексацию",
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
              name: "categoryWorkspacePublish",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/category-editor/CategoryEditorWorkspaceField.tsx#CategoryEditorWorkspaceField",
                },
                custom: {
                  surface: "publish",
                },
              },
              label: "Выпуск категории",
            },
            {
              type: "row",
              fields: [
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
                {
                  name: "ownerReviewRequired",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Нужно согласование owner",
                },
              ],
            },
            {
              name: "defaultLeadRoutingNotes",
              type: "textarea",
              label: "Заметки по маршрутизации лидов",
            },
          ],
        },
        {
          label: "Внутренние заметки",
          fields: [
            {
              name: "categoryWorkspaceNotes",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "./components/category-editor/CategoryEditorWorkspaceField.tsx#CategoryEditorWorkspaceField",
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
          admin: {
            condition: (_, __, { user }) => canAccessCategorySystemFields(user),
          },
          fields: [
            {
              type: "row",
              fields: [
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
        },
      ],
    },
  ],
});
