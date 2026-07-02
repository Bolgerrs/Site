import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { defineCollection } from "../lib/payload/collections.ts";
import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import type { Translation } from "../payload-types.ts";

const translationOwnerCollectionOptions = [
  "pages",
  "page-sections",
  "product-directions",
  "product-categories",
  "product-lines",
  "products",
  "product-variants",
  "product-inquiry-forms",
  "product-documents",
  "media-assets",
  "seo-entries",
] as const;

const translationFieldScopeOptions = [
  "full-record",
  "route-and-seo",
  "editorial-copy",
  "form-copy",
  "document-labels",
  "media-metadata",
] as const;

function getRelationId(value: number | string | { id: number | string } | null | undefined) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    return value.id;
  }

  return null;
}

export const validateTranslationRecord: CollectionBeforeChangeHook<Translation> = async ({
  data,
  req,
}) => {
  const sourceLocaleId = getRelationId(data.sourceLocale);
  const targetLocaleId = getRelationId(data.targetLocale);

  if (sourceLocaleId !== null && targetLocaleId !== null && String(sourceLocaleId) === String(targetLocaleId)) {
    throw new Error("Translation validation failed: source and target locales must differ.");
  }

  const routeLocalizationRequired =
    data.routeLocalizationRequired === true ||
    ["pages", "product-directions", "product-categories", "product-lines", "products"].includes(
      data.ownerCollection ?? "",
    );

  if (routeLocalizationRequired && (!data.targetSlug || !data.targetRoutePath)) {
    throw new Error(
      "Translation validation failed: route-owning records require both targetSlug and targetRoutePath.",
    );
  }

  if ((data.status === "approved" || data.status === "published") && !data.reviewerAssignee) {
    throw new Error("Translation validation failed: approved and published records require a reviewer.");
  }

  if (data.status === "published" && data.staleSourceState === "source-changed") {
    throw new Error("Translation validation failed: stale source content cannot remain published.");
  }

  if (data.status === "published" && targetLocaleId !== null) {
    const targetLocale = await req.payload.findByID({
      collection: "locales",
      id: targetLocaleId,
      overrideAccess: true,
    });

    if (!targetLocale.publicSiteEnabled) {
      throw new Error("Translation validation failed: target locale is not public-site enabled.");
    }
  }

  return data;
};

export const Translations: CollectionConfig = defineCollection({
  slug: "translations",
  admin: {
    defaultColumns: [
      "ownerLabelSnapshot",
      "ownerCollection",
      "targetLocale",
      "status",
      "staleSourceState",
      "publishReadiness",
    ],
    group: "Localization",
    useAsTitle: "ownerLabelSnapshot",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateTranslationRecord],
  },
  fields: [
    {
      name: "ownerCollection",
      type: "select",
      admin: {
        position: "sidebar",
      },
      index: true,
      options: translationOwnerCollectionOptions.map((value) => ({
        label: value,
        value,
      })),
      required: true,
    },
    {
      name: "ownerRecordKey",
      type: "text",
      admin: {
        description:
          "Stable owner identifier until the remaining entity collections are fully wired into Payload.",
      },
      index: true,
      required: true,
    },
    {
      name: "ownerLabelSnapshot",
      type: "text",
      required: true,
    },
    {
      name: "fieldScope",
      type: "select",
      defaultValue: "full-record",
      options: translationFieldScopeOptions.map((value) => ({
        label: value,
        value,
      })),
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "sourceLocale",
          type: "relationship",
          relationTo: "locales",
          required: true,
        },
        {
          name: "targetLocale",
          type: "relationship",
          relationTo: "locales",
          required: true,
        },
      ],
    },
    {
      name: "primaryLocale",
      type: "relationship",
      relationTo: "locales",
    },
    {
      type: "collapsible",
      label: "Source snapshot",
      fields: [
        {
          name: "sourceRevisionKey",
          type: "text",
          required: true,
        },
        {
          name: "sourceUpdatedAtSnapshot",
          type: "date",
          required: true,
        },
        {
          name: "sourceHash",
          type: "text",
        },
        {
          name: "sourceRoutePathSnapshot",
          type: "text",
        },
        {
          name: "sourceTitleSnapshot",
          type: "text",
        },
        {
          name: "staleSourceState",
          type: "select",
          defaultValue: "fresh",
          index: true,
          options: [
            {
              label: "Fresh",
              value: "fresh",
            },
            {
              label: "Source changed",
              value: "source-changed",
            },
            {
              label: "Review required",
              value: "review-required",
            },
            {
              label: "Blocked",
              value: "blocked",
            },
          ],
          required: true,
        },
        {
          name: "staleDetectedAt",
          type: "date",
        },
        {
          name: "staleReason",
          type: "textarea",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Workflow",
      fields: [
        {
          name: "status",
          type: "select",
          admin: {
            position: "sidebar",
          },
          defaultValue: "draft",
          index: true,
          options: [
            {
              label: "Draft",
              value: "draft",
            },
            {
              label: "In progress",
              value: "in-progress",
            },
            {
              label: "Review",
              value: "review",
            },
            {
              label: "Approved",
              value: "approved",
            },
            {
              label: "Published",
              value: "published",
            },
            {
              label: "Archived",
              value: "archived",
            },
            {
              label: "Blocked",
              value: "blocked",
            },
          ],
          required: true,
        },
        {
          name: "workflowStage",
          type: "select",
          defaultValue: "queued",
          options: [
            {
              label: "Queued",
              value: "queued",
            },
            {
              label: "Machine draft",
              value: "machine-draft",
            },
            {
              label: "Human edit",
              value: "human-edit",
            },
            {
              label: "Brand review",
              value: "brand-review",
            },
            {
              label: "SEO review",
              value: "seo-review",
            },
            {
              label: "Legal review",
              value: "legal-review",
            },
            {
              label: "Ready for publish",
              value: "ready-for-publish",
            },
          ],
          required: true,
        },
        {
          name: "translationMethod",
          type: "select",
          defaultValue: "human",
          options: [
            {
              label: "Human",
              value: "human",
            },
            {
              label: "Machine draft, human reviewed",
              value: "machine-draft-human-reviewed",
            },
            {
              label: "Machine draft, pending review",
              value: "machine-draft-pending-review",
            },
            {
              label: "Manual copy adaptation",
              value: "manual-copy-adaptation",
            },
          ],
          required: true,
        },
        {
          name: "translatorAssignee",
          type: "relationship",
          relationTo: "admin-users",
        },
        {
          name: "reviewerAssignee",
          type: "relationship",
          relationTo: "admin-users",
        },
        {
          name: "ownerCheckpointRequired",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Localized payload",
      fields: [
        {
          name: "routeLocalizationRequired",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "targetSlug",
          type: "text",
          index: true,
        },
        {
          name: "targetRoutePath",
          type: "text",
        },
        {
          name: "targetTitle",
          type: "text",
        },
        {
          name: "localizedExcerpt",
          type: "textarea",
        },
        {
          name: "structuredFieldMap",
          type: "array",
          labels: {
            plural: "Structured field entries",
            singular: "Structured field entry",
          },
          fields: [
            {
              name: "fieldKey",
              type: "text",
              required: true,
            },
            {
              name: "valueType",
              type: "select",
              defaultValue: "text",
              options: [
                {
                  label: "Text",
                  value: "text",
                },
                {
                  label: "Long text",
                  value: "long-text",
                },
                {
                  label: "JSON",
                  value: "json",
                },
              ],
              required: true,
            },
            {
              name: "value",
              type: "textarea",
            },
          ],
        },
        {
          name: "localeSpecificCtas",
          type: "array",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
            },
            {
              name: "href",
              type: "text",
              required: true,
            },
            {
              name: "variant",
              type: "text",
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "SEO and media",
      fields: [
        {
          name: "seoDelta",
          type: "group",
          fields: [
            {
              name: "title",
              type: "text",
            },
            {
              name: "description",
              type: "textarea",
            },
            {
              name: "canonicalPath",
              type: "text",
            },
            {
              name: "robots",
              type: "select",
              options: [
                {
                  label: "index,follow",
                  value: "index,follow",
                },
                {
                  label: "noindex,follow",
                  value: "noindex,follow",
                },
                {
                  label: "noindex,nofollow",
                  value: "noindex,nofollow",
                },
              ],
            },
          ],
        },
        {
          name: "mediaLocalizationEntries",
          type: "array",
          labels: {
            plural: "Media localization entries",
            singular: "Media localization entry",
          },
          fields: [
            {
              name: "assetRole",
              type: "text",
              required: true,
            },
            {
              name: "localizedAltText",
              type: "textarea",
            },
            {
              name: "localizedCaption",
              type: "textarea",
            },
            {
              name: "notes",
              type: "textarea",
            },
          ],
        },
        {
          name: "documentLocalizationEntries",
          type: "array",
          labels: {
            plural: "Document localization entries",
            singular: "Document localization entry",
          },
          fields: [
            {
              name: "documentRole",
              type: "text",
              required: true,
            },
            {
              name: "localizedLabel",
              type: "text",
            },
            {
              name: "localizedSummary",
              type: "textarea",
            },
          ],
        },
        {
          name: "formLabelSnapshot",
          type: "textarea",
        },
        {
          name: "fallbackMode",
          type: "select",
          defaultValue: "no-public-fallback",
          options: [
            {
              label: "No public fallback",
              value: "no-public-fallback",
            },
            {
              label: "Allow source preview only",
              value: "allow-source-preview-only",
            },
            {
              label: "Allow explicit source fallback",
              value: "allow-explicit-source-fallback",
            },
          ],
          required: true,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Publishing",
      fields: [
        {
          name: "publishReadiness",
          type: "select",
          defaultValue: "not-ready",
          options: [
            {
              label: "Not ready",
              value: "not-ready",
            },
            {
              label: "Ready",
              value: "ready",
            },
            {
              label: "Ready with fallback",
              value: "ready-with-fallback",
            },
            {
              label: "Blocked",
              value: "blocked",
            },
          ],
          required: true,
        },
        {
          name: "publishBlockedReasons",
          type: "select",
          hasMany: true,
          options: [
            {
              label: "Target locale disabled",
              value: "target-locale-disabled",
            },
            {
              label: "Missing route",
              value: "missing-route",
            },
            {
              label: "SEO missing",
              value: "seo-missing",
            },
            {
              label: "Review missing",
              value: "review-missing",
            },
            {
              label: "Legal copy pending",
              value: "legal-copy-pending",
            },
            {
              label: "Source stale",
              value: "source-stale",
            },
          ],
        },
        {
          name: "previewNotes",
          type: "textarea",
        },
        {
          name: "publicationNotes",
          type: "textarea",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Audit",
      fields: [
        {
          name: "sourceOfTruthArtifact",
          type: "text",
        },
        {
          name: "changeReason",
          type: "textarea",
        },
        {
          name: "internalNotes",
          type: "textarea",
        },
      ],
    },
  ],
});
