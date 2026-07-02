import type { CollectionBeforeChangeHook, CollectionConfig, UploadConfig } from "payload";

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

export const productDocumentsUpload: UploadConfig = {
  displayPreview: true,
  mimeTypes: [
    "application/pdf",
    "application/zip",
    "image/*",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const validateProductDocument: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data.attachmentScope === "variant-override" && !data.variantKey?.trim()) {
    throw new Error(
      "Product document validation failed: variant-override records require variantKey.",
    );
  }

  if (data.visibilityMode === "gated" && data.requiresInquiryContext !== true && !data.publicationNotes?.trim()) {
    throw new Error(
      "Product document validation failed: gated documents require inquiry context or publication notes.",
    );
  }

  if (data.status === "published") {
    if (data.rightsStatus === "reference-only" || data.approvalStatus !== "approved") {
      throw new Error(
        "Product document validation failed: published documents require approved non-reference rights.",
      );
    }

    if (data.visibilityMode === "public" || data.visibilityMode === "gated") {
      await requireLinkedMediaAssetToBeProductionSafe(
        req,
        data.previewAsset,
        "Product document validation failed: public or gated documents require a production-safe preview asset.",
      );
    }
  }

  if (data.ownerReviewRequired === true && !data.governanceNotes?.trim() && !data.publicationNotes?.trim()) {
    throw new Error(
      "Product document validation failed: ownerReviewRequired records need governanceNotes or publicationNotes.",
    );
  }

  return data;
};

export const ProductDocuments: CollectionConfig = defineCollection({
  slug: "product-documents",
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  admin: {
    defaultColumns: [
      "documentTitle",
      "productLabelSnapshot",
      "documentType",
      "primaryLocale",
      "visibilityMode",
      "approvalStatus",
    ],
    group: "Media",
    useAsTitle: "documentTitle",
  },
  hooks: {
    afterChange: [
      createStatusAuditHook({
        collection: "product-documents",
        labelFields: ["documentTitle", "internalCode"],
        surfaceLabel: "Product document",
      }),
      createFieldChangeAuditHook({
        action: "document-governance-update",
        collection: "product-documents",
        detailBuilder: (diffs) =>
          diffs
            .map((entry) => `${entry.field}: ${entry.beforeValue ?? "empty"} -> ${entry.afterValue ?? "empty"}`)
            .join("\n"),
        eventGroup: "media-governance",
        fields: [
          "rightsStatus",
          "approvalStatus",
          "visibilityMode",
          "requiresInquiryContext",
          "surfaceTargets",
        ],
        labelFields: ["documentTitle", "internalCode"],
        summaryBuilder: (diffs) =>
          `Product document governance updated (${diffs.map((entry) => entry.field).join(", ")}).`,
      }),
    ],
    beforeChange: [validateProductDocument],
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
          name: "documentType",
          type: "select",
          options: [
            "brochure",
            "spec-sheet",
            "installation-guide",
            "care-guide",
            "certificate",
            "warranty",
            "package-diagram",
            "price-request-pack",
            "cad-drawing",
            "other",
          ].map((value) => ({ label: value, value })),
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
          name: "documentTitle",
          type: "text",
          required: true,
        },
        {
          name: "publicLabel",
          type: "text",
        },
        {
          name: "versionLabel",
          type: "text",
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
          options: ["public", "gated", "preview-only", "internal-only"].map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
        {
          name: "downloadBehavior",
          type: "select",
          defaultValue: "direct-download",
          options: [
            "direct-download",
            "open-viewer",
            "request-access",
            "admin-only",
          ].map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "surfaceTargets",
          type: "select",
          hasMany: true,
          options: [
            "pdp-downloads",
            "variant-panel",
            "after-inquiry",
            "dealer-pack",
            "admin-sidebar",
          ].map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "requiresInquiryContext",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "previewAsset",
          type: "relationship",
          relationTo: "media-assets",
        },
        {
          name: "previewLabel",
          type: "text",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Inheritance & Localization",
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
                "replace-type",
                "append-type",
                "hide-parent-type",
              ].map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "replacesProductDocument",
              type: "relationship",
              relationTo: "product-documents",
            },
            {
              name: "documentGroupKey",
              type: "text",
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "translationPriority",
              type: "select",
              defaultValue: "normal",
              options: ["high", "normal", "low"].map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "effectiveDate",
              type: "date",
            },
            {
              name: "expiryDate",
              type: "date",
            },
          ],
        },
        {
          name: "localizedTitleOverride",
          type: "text",
        },
        {
          name: "localizedSummaryOverride",
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
              name: "ownerReviewRequired",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "featuredWeight",
              type: "number",
            },
            {
              name: "isPrimary",
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
  upload: productDocumentsUpload,
});
