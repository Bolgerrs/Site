import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  createSourceArtifactFields,
  directionFamilyOptions,
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
import { buildDirectionPreviewUrl } from "../lib/payload/preview-url.ts";

export const validateProductDirection: CollectionBeforeChangeHook = async ({ data }) => {
  const currentData = (data ?? {}) as Record<string, unknown>;
  const slug = normalizeSlugLikeValue(currentData.slug, normalizeSlugLikeValue(currentData.name));
  const routeSegment = normalizeRouteSegment(currentData.routeSegment, slug);

  if (!slug) {
    throw new Error("Product direction validation failed: slug is required.");
  }

  if (!routeSegment) {
    throw new Error("Product direction validation failed: routeSegment is required.");
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Product direction validation failed: sourceOfTruthArtifact",
  );

  for (const reference of (currentData.sourceArtifactReferences as Array<
    { artifactPath?: unknown } | null
  > | null | undefined) ?? []) {
    validateSourceArtifactPath(
      reference?.artifactPath,
      "Product direction validation failed: sourceArtifactReferences.artifactPath",
    );
  }

  const nextData = {
    ...currentData,
    canonicalPath: normalizeCanonicalPath(currentData.canonicalPath, `/${routeSegment}`),
    routeSegment,
    slug,
  } as Record<string, unknown>;

  if (
    nextData.status === "published" &&
    (typeof nextData.sourceOfTruthArtifact !== "string" || !nextData.sourceOfTruthArtifact.trim())
  ) {
    throw new Error(
      "Product direction validation failed: published records require sourceOfTruthArtifact.",
    );
  }

  return nextData;
};

export const ProductDirections: CollectionConfig = defineCollection({
  slug: "product-directions",
  admin: {
    defaultColumns: [
      "internalCode",
      "name",
      "slug",
      "status",
      "order",
      "visibilityInNavigation",
    ],
    group: "Catalog",
    preview: buildDirectionPreviewUrl,
    useAsTitle: "name",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateProductDirection],
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
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "publicLabel",
          type: "text",
          required: true,
        },
        {
          name: "navigationLabel",
          type: "text",
        },
      ],
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
        },
        {
          name: "routeSegment",
          type: "text",
          index: true,
          required: true,
          unique: true,
        },
        {
          name: "canonicalPath",
          type: "text",
          index: true,
          required: true,
          unique: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "order",
          type: "number",
          admin: {
            position: "sidebar",
          },
          index: true,
          required: true,
        },
        {
          name: "directionFamily",
          type: "select",
          options: directionFamilyOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "translationPriority",
          type: "select",
          defaultValue: "high",
          options: translationPriorityOptions.map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
      ],
    },
    {
      name: "tagline",
      type: "text",
    },
    {
      name: "shortDescription",
      type: "textarea",
      required: true,
    },
    {
      name: "longDescription",
      type: "textarea",
    },
    {
      name: "positioningStatement",
      type: "textarea",
    },
    {
      name: "signatureUseCases",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "keyDifferentiators",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "heroAsset",
          type: "relationship",
          relationTo: "media-assets",
        },
        {
          name: "coverCardAsset",
          type: "relationship",
          relationTo: "media-assets",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "defaultInquiryType",
          type: "text",
        },
        {
          name: "indexable",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "visibilityInNavigation",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
    {
      name: "defaultLeadRoutingNotes",
      type: "textarea",
    },
    {
      name: "namingDecisionNotes",
      type: "textarea",
    },
    {
      name: "publicationNotes",
      type: "textarea",
    },
    {
      name: "ownerReviewRequired",
      type: "checkbox",
      defaultValue: false,
    },
    ...createSourceArtifactFields(),
    createAuditNotesField(),
    createSeoField(),
  ],
});
