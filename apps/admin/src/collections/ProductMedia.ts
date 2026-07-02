import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import { createFieldChangeAuditHook, createStatusAuditHook } from "../lib/payload/audit.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import { createAuditNotesField, createLocaleField, createStatusField } from "../lib/payload/fields.ts";
import {
  governanceApprovalStatusOptions,
  governanceRightsStatusOptions,
  mediaAssetSourceCategoryOptions,
  requireLinkedMediaAssetToBeProductionSafe,
} from "../lib/payload/media-governance.ts";

export const validateProductMedia: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data.attachmentScope === "variant-override" && !data.variantKey?.trim()) {
    throw new Error(
      "Product media validation failed: variant-override records require variantKey.",
    );
  }

  if (
    data.attachmentScope === "variant-override" &&
    (!data.overrideMode || data.overrideMode === "inherit-parent")
  ) {
    throw new Error(
      "Product media validation failed: variant-override records require a real overrideMode.",
    );
  }

  if (data.visibilityMode === "public" && data.sourceCategory === "reference") {
    throw new Error(
      "Product media validation failed: public placements cannot use reference sourceCategory.",
    );
  }

  if (data.status === "published") {
    if (data.rightsStatus === "reference-only" || data.approvalStatus !== "approved") {
      throw new Error(
        "Product media validation failed: published placements require approved non-reference rights.",
      );
    }

    if (data.visibilityMode === "public") {
      await requireLinkedMediaAssetToBeProductionSafe(
        req,
        data.mediaAsset,
        "Product media validation failed: public published placements require a production-safe media asset.",
      );
    }
  }

  if (data.ownerReviewRequired === true && !data.governanceNotes?.trim() && !data.publicationNotes?.trim()) {
    throw new Error(
      "Product media validation failed: ownerReviewRequired records need governanceNotes or publicationNotes.",
    );
  }

  return data;
};

export const ProductMedia: CollectionConfig = defineCollection({
  slug: "product-media",
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  admin: {
    defaultColumns: [
      "internalCode",
      "productLabelSnapshot",
      "slot",
      "visibilityMode",
      "rightsStatus",
      "approvalStatus",
    ],
    group: "Media",
    useAsTitle: "internalCode",
  },
  hooks: {
    afterChange: [
      createStatusAuditHook({
        collection: "product-media",
        labelFields: ["internalCode", "productLabelSnapshot"],
        surfaceLabel: "Product media placement",
      }),
      createFieldChangeAuditHook({
        action: "placement-governance-update",
        collection: "product-media",
        detailBuilder: (diffs) =>
          diffs
            .map((entry) => `${entry.field}: ${entry.beforeValue ?? "empty"} -> ${entry.afterValue ?? "empty"}`)
            .join("\n"),
        eventGroup: "media-governance",
        fields: ["rightsStatus", "approvalStatus", "visibilityMode", "surfaceTargets"],
        labelFields: ["internalCode", "productLabelSnapshot"],
        summaryBuilder: (diffs) =>
          `Product media placement updated (${diffs.map((entry) => entry.field).join(", ")}).`,
      }),
    ],
    beforeChange: [validateProductMedia],
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
        },
        createStatusField(),
        createLocaleField("primaryLocale"),
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "productKey",
          type: "text",
          admin: {
            description:
              "Temporary canonical product key until MNT-ADMIN-009 wires real Product relations.",
          },
          index: true,
          required: true,
        },
        {
          name: "variantKey",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "productLabelSnapshot",
          type: "text",
          required: true,
        },
        {
          name: "variantLabelSnapshot",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "mediaAsset",
          type: "relationship",
          relationTo: "media-assets",
          required: true,
        },
        {
          name: "order",
          type: "number",
          required: true,
        },
        {
          name: "attachmentScope",
          type: "select",
          defaultValue: "product-default",
          options: [
            "product-default",
            "variant-override",
            "variant-only",
            "internal-reference",
          ].map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "slot",
          type: "select",
          options: [
            "hero",
            "card",
            "gallery-object",
            "gallery-context",
            "gallery-detail",
            "detail",
            "document-preview",
            "admin-preview",
          ].map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "slotRole",
          type: "text",
        },
        {
          name: "isPrimary",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "visibilityMode",
          type: "select",
          defaultValue: "preview-only",
          options: ["public", "internal-only", "preview-only"].map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
        {
          name: "surfaceTargets",
          type: "select",
          hasMany: true,
          options: [
            "listing-card",
            "pdp",
            "gallery",
            "detail-panel",
            "document-preview",
            "admin-preview",
          ].map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "aspectRatioHint",
          type: "select",
          options: ["square", "portrait", "landscape", "cinematic", "free"].map((value) => ({
            label: value,
            value,
          })),
        },
      ],
    },
    {
      type: "collapsible",
      label: "Inheritance & Placement",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "overrideMode",
              type: "select",
              defaultValue: "inherit-parent",
              options: [
                "inherit-parent",
                "replace-slot",
                "append-slot",
                "hide-parent-slot",
              ].map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "replacesProductMedia",
              type: "relationship",
              relationTo: "product-media",
            },
            {
              name: "fallbackBehavior",
              type: "select",
              defaultValue: "use-product-default",
              options: [
                "use-product-default",
                "use-slot-fallback",
                "hide-if-missing",
              ].map((value) => ({ label: value, value })),
              required: true,
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "selectorToken",
              type: "text",
            },
            {
              name: "slotGroupKey",
              type: "text",
            },
            {
              name: "responsivePriority",
              type: "number",
            },
          ],
        },
        {
          name: "variantSelectionCueRequired",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Localized Presentation",
      fields: [
        {
          name: "localizedAltOverride",
          type: "textarea",
        },
        {
          name: "localizedCaptionOverride",
          type: "textarea",
        },
        {
          name: "translationPriority",
          type: "select",
          defaultValue: "normal",
          options: ["high", "normal", "low"].map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "marketVisibilityNotes",
          type: "textarea",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Rights & Governance",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "rightsStatus",
              type: "select",
              options: governanceRightsStatusOptions.map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "approvalStatus",
              type: "select",
              defaultValue: "pending",
              options: governanceApprovalStatusOptions.map((value) => ({
                label: value,
                value,
              })),
              required: true,
            },
            {
              name: "sourceCategory",
              type: "select",
              options: mediaAssetSourceCategoryOptions.map((value) => ({ label: value, value })),
              required: true,
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "usageIntent",
              type: "select",
              defaultValue: "production",
              options: [
                "production",
                "editorial-preview",
                "creative-review",
                "supplier-handoff",
              ].map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "expiryDate",
              type: "date",
            },
            {
              name: "ownerReviewRequired",
              type: "checkbox",
              defaultValue: false,
            },
          ],
        },
        {
          name: "referenceOnlyReason",
          type: "textarea",
        },
        {
          name: "governanceNotes",
          type: "textarea",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Editorial Notes",
      fields: [
        {
          name: "stylingNotes",
          type: "textarea",
        },
        {
          name: "roomContextNotes",
          type: "textarea",
        },
        {
          name: "motionRelation",
          type: "text",
        },
        {
          name: "publicationNotes",
          type: "textarea",
        },
        {
          name: "sourceOfTruthArtifact",
          type: "text",
        },
        createAuditNotesField(),
      ],
    },
  ],
});
