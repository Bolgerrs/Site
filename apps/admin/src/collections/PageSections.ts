import type { CollectionConfig, PayloadRequest } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  pageFamilyOptions,
  pageSectionTypeOptions,
  translationPriorityOptions,
  validateSourceArtifactPath,
} from "../lib/payload/catalog.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import {
  createAuditNotesField,
  createLocaleField,
  createStatusField,
} from "../lib/payload/fields.ts";

type SectionBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

function normalizeKey(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const showForSectionType =
  (...allowedTypes: Array<(typeof pageSectionTypeOptions)[number]>) =>
  (_data: unknown, siblingData: unknown) => {
    const currentType = (siblingData as { sectionType?: string } | null)?.sectionType;

    if (!currentType) {
      return false;
    }

    return allowedTypes.includes(currentType as (typeof pageSectionTypeOptions)[number]);
  };

export const validatePageSection = async ({
  data,
  operation,
  originalDoc,
}: SectionBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };
  const previewLabel = getText(currentData.previewLabel);
  const title = getText(currentData.title);
  const sectionKey = normalizeKey(
    currentData.sectionKey,
    normalizeKey(previewLabel, normalizeKey(title, "section")),
  );

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Page section validation failed: sourceOfTruthArtifact",
  );

  for (const reference of asArray<{ artifactPath?: unknown } | null>(
    currentData.sourceArtifactReferences,
  )) {
    validateSourceArtifactPath(
      reference?.artifactPath,
      "Page section validation failed: sourceArtifactReferences.artifactPath",
    );
  }

  const nextData = {
    ...currentData,
    previewLabel: previewLabel || title || "Untitled section",
    sectionKey,
  } as Record<string, unknown>;

  if (
    nextData.status === "published" &&
    (!Array.isArray(nextData.pageFamiliesAllowed) || nextData.pageFamiliesAllowed.length === 0)
  ) {
    throw new Error(
      "Page section validation failed: published sections require at least one allowed page family.",
    );
  }

  if (nextData.sectionType === "cta") {
    const ctaGroup = (nextData.ctaContent ?? {}) as Record<string, unknown>;

    if (!getText(ctaGroup.primaryLabel) || !getText(ctaGroup.primaryTarget)) {
      throw new Error(
        "Page section validation failed: CTA sections require primary label and target.",
      );
    }
  }

  if (nextData.sectionType === "gallery") {
    const galleryItems = asArray<Record<string, unknown>>(nextData.galleryItems);

    if (nextData.status === "published" && galleryItems.length === 0) {
      throw new Error(
        "Page section validation failed: published gallery sections require at least one gallery item.",
      );
    }
  }

  return nextData;
};

export const PageSections: CollectionConfig = defineCollection({
  slug: "page-sections",
  admin: {
    defaultColumns: ["internalCode", "previewLabel", "sectionType", "status", "primaryLocale"],
    group: "Site content",
    listSearchableFields: ["internalCode", "previewLabel", "sectionKey", "title"],
    useAsTitle: "previewLabel",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validatePageSection],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "internalCode",
          type: "text",
          required: true,
          unique: true,
          label: "Внутренний код блока",
        },
        createStatusField(),
        createLocaleField("primaryLocale"),
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "sectionType",
          type: "select",
          required: true,
          label: "Тип блока",
          options: pageSectionTypeOptions.map((value) => ({
            label: value,
            value,
          })),
        },
        {
          name: "sectionKey",
          type: "text",
          required: true,
          unique: true,
          label: "Ключ блока",
        },
        {
          name: "previewLabel",
          type: "text",
          localized: true,
          required: true,
          label: "Имя блока для админки",
        },
      ],
    },
    {
      name: "pageFamiliesAllowed",
      type: "select",
      hasMany: true,
      required: true,
      label: "Для каких страниц доступен блок",
      options: pageFamilyOptions.map((value) => ({
        label: value,
        value,
      })),
    },
    {
      type: "row",
      fields: [
        {
          name: "visibilityDefault",
          type: "checkbox",
          defaultValue: true,
          label: "По умолчанию показывать",
        },
        {
          name: "previewAnchor",
          type: "text",
          label: "Якорь предпросмотра",
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
      name: "title",
      type: "text",
      localized: true,
      label: "Заголовок блока",
    },
    {
      name: "eyebrow",
      type: "text",
      localized: true,
      label: "Надзаголовок",
    },
    {
      name: "lead",
      type: "textarea",
      localized: true,
      label: "Короткое описание",
    },
    {
      name: "body",
      type: "textarea",
      localized: true,
      label: "Основной текст",
    },
    {
      name: "heroContent",
      type: "group",
      admin: {
        condition: showForSectionType("hero"),
      },
      fields: [
        {
          name: "supportingLabel",
          type: "text",
          localized: true,
          label: "Подпись рядом с hero",
        },
        {
          name: "heroMedia",
          type: "relationship",
          relationTo: "media-assets",
          label: "Главное изображение",
        },
      ],
    },
    {
      name: "productGridContent",
      type: "group",
      admin: {
        condition: showForSectionType("product-grid"),
      },
      fields: [
        {
          name: "gridMode",
          type: "select",
          defaultValue: "manual-products",
          label: "Режим товарного блока",
          options: [
            { label: "manual-products", value: "manual-products" },
            { label: "direction-spotlight", value: "direction-spotlight" },
            { label: "category-spotlight", value: "category-spotlight" },
          ],
        },
        {
          name: "products",
          type: "relationship",
          hasMany: true,
          relationTo: "products",
          label: "Связанные товары",
        },
        {
          name: "directions",
          type: "relationship",
          hasMany: true,
          relationTo: "product-directions",
          label: "Связанные направления",
        },
        {
          name: "maxItems",
          type: "number",
          defaultValue: 6,
          min: 1,
          max: 24,
          label: "Максимум карточек",
        },
      ],
    },
    {
      name: "proofModules",
      type: "array",
      admin: {
        condition: showForSectionType("technology-proof"),
      },
      labels: {
        plural: "Proof modules",
        singular: "Proof module",
      },
      fields: [
        {
          name: "label",
          type: "text",
          localized: true,
          required: true,
          label: "Заголовок модуля",
        },
        {
          name: "body",
          type: "textarea",
          localized: true,
          label: "Описание модуля",
        },
      ],
    },
    {
      name: "materialsStory",
      type: "array",
      admin: {
        condition: showForSectionType("materials-story"),
      },
      labels: {
        plural: "Materials story entries",
        singular: "Materials story entry",
      },
      fields: [
        {
          name: "material",
          type: "text",
          localized: true,
          required: true,
          label: "Материал",
        },
        {
          name: "narrative",
          type: "textarea",
          localized: true,
          label: "История / описание",
        },
      ],
    },
    {
      name: "galleryItems",
      type: "array",
      admin: {
        condition: showForSectionType("gallery"),
      },
      labels: {
        plural: "Gallery items",
        singular: "Gallery item",
      },
      fields: [
        {
          name: "asset",
          type: "relationship",
          relationTo: "media-assets",
          required: true,
          label: "Изображение",
        },
        {
          name: "caption",
          type: "textarea",
          localized: true,
          label: "Подпись",
        },
      ],
    },
    {
      name: "ctaContent",
      type: "group",
      admin: {
        condition: showForSectionType("cta"),
      },
      fields: [
        {
          name: "primaryLabel",
          type: "text",
          localized: true,
          required: true,
          label: "Текст основной кнопки",
        },
        {
          name: "primaryTarget",
          type: "text",
          localized: true,
          required: true,
          label: "Ссылка основной кнопки",
        },
        {
          name: "secondaryLabel",
          type: "text",
          localized: true,
          label: "Текст второй кнопки",
        },
        {
          name: "secondaryTarget",
          type: "text",
          localized: true,
          label: "Ссылка второй кнопки",
        },
      ],
    },
    {
      name: "journalDownloadsContent",
      type: "group",
      admin: {
        condition: showForSectionType("journal-downloads"),
      },
      fields: [
        {
          name: "documents",
          type: "relationship",
          hasMany: true,
          relationTo: "product-documents",
          label: "PDF и документы",
        },
        {
          name: "linkLabel",
          type: "text",
          localized: true,
          label: "Подпись ссылки",
        },
        {
          name: "linkTarget",
          type: "text",
          localized: true,
          label: "Ссылка",
        },
      ],
    },
    {
      name: "previewNotes",
      type: "textarea",
      label: "Заметка менеджера",
    },
    createAuditNotesField(),
    {
      name: "sourceOfTruthArtifact",
      type: "text",
      label: "Артефакт-источник",
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
});
