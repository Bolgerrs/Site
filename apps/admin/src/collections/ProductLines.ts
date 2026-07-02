import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  createSourceArtifactFields,
  findDocumentById,
  normalizeCanonicalPath,
  normalizeRouteSegment,
  normalizeSlugLikeValue,
  productLineKindOptions,
  productNarrativeModeOptions,
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

export const validateProductLine: CollectionBeforeChangeHook = async ({ data, req }) => {
  const currentData = (data ?? {}) as Record<string, unknown>;

  if (!currentData.direction) {
    throw new Error("Product line validation failed: direction is required.");
  }

  const direction = await findDocumentById(req, "product-directions", currentData.direction as
    | number
    | string
    | undefined);
  const category = await findDocumentById(req, "product-categories", currentData.category as
    | number
    | string
    | undefined);
  const directionDoc = direction as { id?: number | string; canonicalPath?: string } | null;
  const categoryDoc = category as
    | { id?: number | string; direction?: number | string; canonicalPath?: string }
    | null;
  const slug = normalizeSlugLikeValue(currentData.slug, normalizeSlugLikeValue(currentData.name));
  const routeSegment = normalizeRouteSegment(currentData.routeSegment, slug);

  if (!direction) {
    throw new Error("Product line validation failed: direction record was not found.");
  }

  if (categoryDoc && String(categoryDoc.direction) !== String(directionDoc?.id)) {
    throw new Error(
      "Product line validation failed: category must belong to the selected direction.",
    );
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Product line validation failed: sourceOfTruthArtifact",
  );

  for (const reference of (currentData.sourceArtifactReferences as Array<
    { artifactPath?: unknown } | null
  > | null | undefined) ?? []) {
    validateSourceArtifactPath(
      reference?.artifactPath,
      "Product line validation failed: sourceArtifactReferences.artifactPath",
    );
  }

  const basePath = categoryDoc?.canonicalPath
    ? `${categoryDoc.canonicalPath}/${routeSegment}`
    : `${directionDoc?.canonicalPath ?? ""}/${routeSegment}`;

  const nextData = {
    ...currentData,
    canonicalPath: normalizeCanonicalPath(currentData.canonicalPath, basePath),
    routeSegment,
    slug,
  } as Record<string, unknown>;

  if (
    nextData.status === "published" &&
    (typeof nextData.sourceOfTruthArtifact !== "string" || !nextData.sourceOfTruthArtifact.trim())
  ) {
    throw new Error(
      "Product line validation failed: published records require sourceOfTruthArtifact.",
    );
  }

  return nextData;
};

export const ProductLines: CollectionConfig = defineCollection({
  slug: "product-lines",
  admin: {
    defaultColumns: [
      "internalCode",
      "name",
      "direction",
      "category",
      "slug",
      "status",
      "order",
    ],
    group: "Catalog",
    useAsTitle: "name",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateProductLine],
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
          name: "direction",
          type: "relationship",
          relationTo: "product-directions",
          required: true,
        },
        {
          name: "category",
          type: "relationship",
          relationTo: "product-categories",
          admin: {
            description:
              "Optional. Use only when the line sits under a category such as Perfect Conductors.",
          },
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
          name: "name",
          type: "text",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "publicLabel",
          type: "text",
          required: true,
        },
        {
          name: "navigationLabel",
          type: "text",
        },
        {
          name: "slug",
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
        {
          name: "order",
          type: "number",
          index: true,
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "lineKind",
          type: "select",
          options: productLineKindOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "lineNarrativeMode",
          type: "select",
          defaultValue: "catalog",
          options: productNarrativeModeOptions.map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
        {
          name: "translationPriority",
          type: "select",
          defaultValue: "normal",
          options: translationPriorityOptions.map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
      ],
    },
    {
      name: "shortDescription",
      type: "textarea",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "positioningStatement",
      type: "textarea",
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
          name: "productCountHint",
          type: "number",
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
      name: "defaultInquiryType",
      type: "text",
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
