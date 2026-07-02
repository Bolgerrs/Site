import type { CollectionBeforeChangeHook, CollectionConfig, UploadConfig } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  roleAccess,
} from "../lib/payload/access.ts";
import { createFieldChangeAuditHook, createStatusAuditHook } from "../lib/payload/audit.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import { createAuditNotesField, createLocaleField } from "../lib/payload/fields.ts";
import {
  governanceApprovalStatusOptions,
  governanceRightsStatusOptions,
  mediaAssetSourceCategoryOptions,
  mediaAssetTypeOptions,
  publicationReadinessOptions,
  requireApprovedBeforeProductionReady,
  requireNoExpiredApproval,
  requirePublicAudienceSafety,
  requireReferenceGuardrail,
  requireSourceAttributionWhenReference,
} from "../lib/payload/media-governance.ts";
import { mediaOperatorRoles } from "../lib/payload/roles.ts";

const mediaOperatorAccess = roleAccess(mediaOperatorRoles);

export const mediaAssetsUpload: UploadConfig = {
  displayPreview: true,
  mimeTypes: ["image/*", "application/pdf", "video/*"],
};

export const validateMediaAsset: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== "create" && operation !== "update") {
    return data;
  }

  requireSourceAttributionWhenReference(data);
  requireReferenceGuardrail(data);
  requireApprovedBeforeProductionReady(data);
  requireNoExpiredApproval(data);
  requirePublicAudienceSafety(data);

  if (
    data.publicationReadiness === "production-ready" &&
    data.languageNeutral !== true &&
    data.audienceMode === "public" &&
    !data.altText?.trim() &&
    !data.caption?.trim()
  ) {
    throw new Error(
      "Media governance validation failed: public production-ready assets require altText or caption.",
    );
  }

  if (data.status === "published" && data.publicationReadiness !== "production-ready") {
    throw new Error(
      "Media governance validation failed: published assets must be production-ready.",
    );
  }

  return data;
};

export const MediaAssets: CollectionConfig = defineCollection({
  slug: "media-assets",
  access: {
    create: mediaOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: mediaOperatorAccess,
  },
  admin: {
    defaultColumns: [
      "assetTitle",
      "assetType",
      "primaryLocale",
      "rightsStatus",
      "approvalStatus",
      "publicationReadiness",
    ],
    group: "Media",
    useAsTitle: "assetTitle",
  },
  hooks: {
    afterChange: [
      createStatusAuditHook({
        collection: "media-assets",
        labelFields: ["assetTitle", "internalCode"],
        surfaceLabel: "Media asset",
      }),
      createFieldChangeAuditHook({
        action: "media-governance-update",
        collection: "media-assets",
        detailBuilder: (diffs) =>
          diffs
            .map((entry) => `${entry.field}: ${entry.beforeValue ?? "empty"} -> ${entry.afterValue ?? "empty"}`)
            .join("\n"),
        eventGroup: "media-governance",
        fields: [
          "rightsStatus",
          "approvalStatus",
          "publicationReadiness",
          "referenceOnlyNotProductionAsset",
          "audienceMode",
        ],
        labelFields: ["assetTitle", "internalCode"],
        summaryBuilder: (diffs) =>
          `Media governance updated (${diffs.map((entry) => entry.field).join(", ")}).`,
      }),
    ],
    beforeChange: [validateMediaAsset],
  },
  fields: [
    {
      name: "internalCode",
      type: "text",
      admin: {
        position: "sidebar",
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "assetTitle",
      type: "text",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "assetType",
          type: "select",
          options: mediaAssetTypeOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "assetRole",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          defaultValue: "draft",
          index: true,
          options: [
            "draft",
            "review",
            "approved",
            "published",
            "archived",
          ].map((value) => ({ label: value, value })),
          required: true,
        },
        createLocaleField("primaryLocale"),
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "languageNeutral",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "audienceMode",
          type: "select",
          defaultValue: "public",
          options: ["public", "dealer", "owner-review", "internal-only"].map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
        {
          name: "translationPriority",
          type: "select",
          defaultValue: "normal",
          options: ["high", "normal", "low"].map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Editorial",
      fields: [
        {
          name: "altText",
          type: "textarea",
        },
        {
          name: "caption",
          type: "textarea",
        },
        {
          name: "creditLine",
          type: "text",
        },
        {
          name: "editorialSummary",
          type: "textarea",
        },
      ],
    },
    {
      type: "collapsible",
      label: "Rights & Source",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "sourceCategory",
              type: "select",
              options: mediaAssetSourceCategoryOptions.map((value) => ({ label: value, value })),
              required: true,
            },
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
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "sourceName",
              type: "text",
            },
            {
              name: "sourceUrl",
              type: "text",
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "publicationReadiness",
              type: "select",
              defaultValue: "blocked",
              options: publicationReadinessOptions.map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "licenseScope",
              type: "text",
            },
            {
              name: "licenseExpiryAt",
              type: "date",
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "referenceOnlyNotProductionAsset",
              type: "checkbox",
              defaultValue: false,
              required: true,
            },
            {
              name: "ownerReviewRequired",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "creativeReviewRequired",
              type: "checkbox",
              defaultValue: false,
            },
          ],
        },
        {
          name: "usageRestrictions",
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
      label: "Preview & Traceability",
      fields: [
        {
          name: "responsiveCrop",
          type: "group",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "desktop",
                  type: "group",
                  fields: [
                    { name: "x", type: "number", min: 0, max: 1 },
                    { name: "y", type: "number", min: 0, max: 1 },
                    { name: "width", type: "number", min: 0, max: 1 },
                    { name: "height", type: "number", min: 0, max: 1 },
                    { name: "focalX", type: "number", min: 0, max: 1 },
                    { name: "focalY", type: "number", min: 0, max: 1 },
                  ],
                },
                {
                  name: "mobile",
                  type: "group",
                  fields: [
                    { name: "x", type: "number", min: 0, max: 1 },
                    { name: "y", type: "number", min: 0, max: 1 },
                    { name: "width", type: "number", min: 0, max: 1 },
                    { name: "height", type: "number", min: 0, max: 1 },
                    { name: "focalX", type: "number", min: 0, max: 1 },
                    { name: "focalY", type: "number", min: 0, max: 1 },
                  ],
                },
              ],
            },
            {
              name: "notes",
              type: "textarea",
            },
          ],
        },
        {
          name: "promptSourceNotes",
          type: "textarea",
        },
        {
          name: "competitorReferenceNotes",
          type: "textarea",
        },
        {
          name: "importBatchToken",
          type: "text",
        },
        {
          name: "sourceOfTruthArtifact",
          type: "text",
        },
        {
          name: "changeReason",
          type: "textarea",
        },
        createAuditNotesField(),
      ],
    },
  ],
  upload: mediaAssetsUpload,
});
