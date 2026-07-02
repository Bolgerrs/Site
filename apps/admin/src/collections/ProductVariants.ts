import type { CollectionConfig, PayloadRequest } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  availabilityModeOptions,
  compatibilityStateOptions,
  compatibilityTargetOptions,
  createSourceArtifactFields,
  findDocumentById,
  launchStageOptions,
  normalizeCanonicalPath,
  normalizeRouteSegment,
  normalizeSlugLikeValue,
  productVariantAvailabilityOptions,
  productVariantKindOptions,
  productVariantReadinessOptions,
  productVariantSelectionModeOptions,
  productVariantTypeOptions,
  specificationValueTypeOptions,
  specificationVerificationOptions,
  specificationVisibilityOptions,
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

type VariantBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

function toNumericId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return undefined;
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function countBlockedPublicClaims(data: Record<string, unknown>) {
  let blocked = 0;
  let validated = 0;

  for (const group of asArray<Record<string, unknown>>(data.specGroups)) {
    for (const item of asArray<Record<string, unknown>>(group.items)) {
      const visibilityMode = item.visMode;
      const verificationState = item.verifyState;

      if (visibilityMode === "public" || visibilityMode === "selector") {
        if (verificationState === "validated") {
          validated += 1;
        } else {
          blocked += 1;
        }
      }
    }
  }

  for (const entry of asArray<Record<string, unknown>>(data.compat)) {
    if (entry.visibilityMode !== "public") {
      continue;
    }

    if (entry.compatibilityState === "validated") {
      validated += 1;
    } else {
      blocked += 1;
    }
  }

  const availabilityVisibilityMode = data.availabilityVisibilityMode;
  const availabilityValidationState = data.availabilityValidationState;

  if (availabilityVisibilityMode === "public" && data.leadTimeSummary) {
    if (availabilityValidationState === "validated") {
      validated += 1;
    } else {
      blocked += 1;
    }
  }

  return {
    blocked,
    validated,
  };
}

export const validateProductVariant = async ({
  data,
  req,
  operation,
  originalDoc,
}: VariantBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };

  if (!currentData.product) {
    throw new Error("Product variant validation failed: product is required.");
  }

  const productId = toNumericId(currentData.product);

  if (!productId) {
    throw new Error("Product variant validation failed: product is required.");
  }

  const product = await findDocumentById(req, "products", productId);

  if (!product) {
    throw new Error("Product variant validation failed: parent product record was not found.");
  }

  const productDoc = product as unknown as Record<string, unknown>;
  const slug = normalizeSlugLikeValue(
    currentData.slug,
    normalizeSlugLikeValue(currentData.variantLabel, normalizeSlugLikeValue(currentData.internalCode)),
  );
  const routeSegmentOverride = normalizeRouteSegment(currentData.routeSegmentOverride, slug);

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Product variant validation failed: sourceOfTruthArtifact",
  );

  for (const reference of asArray<{ artifactPath?: unknown } | null>(
    currentData.sourceArtifactReferences,
  )) {
    validateSourceArtifactPath(
      reference?.artifactPath,
      "Product variant validation failed: sourceArtifactReferences.artifactPath",
    );
  }

  const nextData = {
    ...currentData,
    category: productDoc.category ?? null,
    direction: productDoc.direction,
    line: productDoc.line ?? null,
    canonicalPathOverride:
      currentData.routeMode === "inherit-product"
        ? null
        : normalizeCanonicalPath(
            currentData.canonicalPathOverride,
            `${String(productDoc.canonicalPath ?? `/products/${slug}`)}#${routeSegmentOverride}`,
          ),
    routeSegmentOverride: currentData.routeMode === "inherit-product" ? null : routeSegmentOverride,
    slug,
  } as Record<string, unknown>;

  if (nextData.variantKind === "future-option" || nextData.variantKind === "internal-only") {
    nextData.indexable = false;
    nextData.visibilityInNavigation = false;
    nextData.visibilityInSelectors = false;
  }

  if (nextData.routeMode === "inherit-product") {
    nextData.indexable = false;
    nextData.visibilityInNavigation = false;
  }

  const siblingVariants = await req.payload.find({
    collection: "product-variants",
    depth: 0,
    limit: 200,
    overrideAccess: true,
    pagination: false,
    where: {
      product: {
        equals: productId,
      },
    },
  });

  const siblingDocs = siblingVariants.docs as unknown as Array<Record<string, unknown>>;
  const currentId = originalDoc?.id != null ? String(originalDoc.id) : null;
  const conflictingDefaultVariant = siblingDocs.find((entry) => {
    if (entry.isDefaultVariant !== true) {
      return false;
    }

    if (currentId && String(entry.id) === currentId) {
      return false;
    }

    return true;
  });

  if (nextData.isDefaultVariant === true && conflictingDefaultVariant) {
    throw new Error(
      "Product variant validation failed: only one default variant is allowed per product.",
    );
  }

  const claimCounts = countBlockedPublicClaims(nextData);

  if (nextData.status === "published") {
    if (productDoc.status !== "review" && productDoc.status !== "published") {
      throw new Error(
        "Product variant validation failed: published variants require the parent product to be in review or published state.",
      );
    }

    if (nextData.ownerReviewRequired === true && !String(nextData.namingDecisionNotes ?? "").trim()) {
      throw new Error(
        "Product variant validation failed: ownerReviewRequired variants need namingDecisionNotes before publish.",
      );
    }

    if (claimCounts.blocked > 0) {
      throw new Error(
        "Product variant validation failed: published variants cannot expose unvalidated public specification, compatibility, or availability claims.",
      );
    }
  }

  if (
    nextData.inquiryFormOverride &&
    !String(nextData.leadRoutingNotesOverride ?? nextData.publicationNotes ?? "").trim()
  ) {
    throw new Error(
      "Product variant validation failed: inquiryFormOverride requires leadRoutingNotesOverride or publicationNotes.",
    );
  }

  if (
    (nextData.heroAssetOverride || nextData.coverCardAssetOverride) &&
    nextData.status === "published" &&
    nextData.visibilityInSelectors !== true
  ) {
    throw new Error(
      "Product variant validation failed: published media overrides require selector visibility so the variant can be identified publicly.",
    );
  }

  if (claimCounts.blocked > 0 && nextData.status !== "published") {
    nextData.variantReadiness = "needs-validation";
  } else if (nextData.status === "review") {
    nextData.variantReadiness = "ready-for-review";
  } else if (nextData.status === "published") {
    nextData.variantReadiness = "publishable";
  } else if (!nextData.variantReadiness) {
    nextData.variantReadiness = "drafting";
  }

  return nextData;
};

export const ProductVariants: CollectionConfig = defineCollection({
  slug: "product-variants",
  admin: {
    defaultColumns: [
      "internalCode",
      "variantLabel",
      "product",
      "variantType",
      "variantReadiness",
      "status",
    ],
    group: "Catalog",
    useAsTitle: "variantLabel",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateProductVariant],
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
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "order",
          type: "number",
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
      type: "row",
      fields: [
        {
          name: "variantLabel",
          type: "text",
          required: true,
        },
        {
          name: "publicLabel",
          type: "text",
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
        },
        {
          name: "skuSuffix",
          type: "text",
        },
        {
          name: "variantType",
          type: "select",
          options: productVariantTypeOptions.map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "variantKind",
          type: "select",
          defaultValue: "standard",
          options: productVariantKindOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "variantReadiness",
          type: "select",
          defaultValue: "drafting",
          options: productVariantReadinessOptions.map((value) => ({ label: value, value })),
        },
        {
          name: "isDefaultVariant",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "selectionMode",
          type: "select",
          defaultValue: "default",
          options: productVariantSelectionModeOptions.map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
        {
          name: "launchStage",
          type: "select",
          defaultValue: "planned",
          options: launchStageOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "availabilityMode",
          type: "select",
          defaultValue: "by-request",
          options: productVariantAvailabilityOptions.map((value) => ({
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
          name: "visibilityInSelectors",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "visibilityInNavigation",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "indexable",
          type: "checkbox",
          defaultValue: false,
        },
      ],
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
      name: "tagline",
      type: "text",
    },
    {
      name: "keyDifferentiators",
      type: "array",
      labels: {
        plural: "Key differentiators",
        singular: "Key differentiator",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "finishes",
      type: "group",
      fields: [
        {
          name: "finishFamilies",
          type: "array",
          labels: {
            plural: "Finish families",
            singular: "Finish family",
          },
          fields: [
            {
              name: "familyLabel",
              type: "text",
              required: true,
            },
            {
              name: "materialLabel",
              type: "text",
            },
            {
              name: "swatchAsset",
              type: "relationship",
              relationTo: "media-assets",
            },
            {
              name: "isDefaultFamily",
              type: "checkbox",
              defaultValue: false,
            },
            {
              name: "finishNotes",
              type: "textarea",
            },
          ],
        },
        {
          name: "opts",
          type: "array",
          labels: {
            plural: "Options",
            singular: "Option",
          },
          fields: [
            {
              name: "groupLabel",
              type: "text",
              required: true,
            },
            {
              name: "attributeLabel",
              type: "text",
              required: true,
            },
            {
              name: "publicValue",
              type: "text",
              required: true,
            },
            {
              name: "avail",
              type: "select",
              defaultValue: "on-request",
              options: availabilityModeOptions.map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "isDefaultOption",
              type: "checkbox",
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: "specGroups",
      type: "array",
      labels: {
        plural: "Specification groups",
        singular: "Specification group",
      },
      fields: [
        {
          name: "groupLabel",
          type: "text",
          required: true,
        },
        {
          name: "items",
          type: "array",
          labels: {
            plural: "Specification items",
            singular: "Specification item",
          },
          fields: [
            {
              name: "specKey",
              type: "text",
              required: true,
            },
            {
              name: "label",
              type: "text",
              required: true,
            },
            {
              name: "value",
              type: "text",
              required: true,
            },
            {
              name: "unitLabel",
              type: "text",
            },
            {
              name: "valueType",
              type: "select",
              defaultValue: "text",
              options: specificationValueTypeOptions.map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "visMode",
              type: "select",
              defaultValue: "public",
              options: specificationVisibilityOptions.map((value) => ({ label: value, value })),
              required: true,
            },
            {
              name: "verifyState",
              type: "select",
              defaultValue: "draft",
              options: specificationVerificationOptions.map((value) => ({
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
      name: "compat",
      type: "array",
      labels: {
        plural: "Compatibility notes",
        singular: "Compatibility note",
      },
      fields: [
        {
          name: "kind",
          type: "select",
          options: compatibilityTargetOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "targetLabel",
          type: "text",
          required: true,
        },
        {
          name: "guidance",
          type: "textarea",
          required: true,
        },
        {
          name: "compatibilityState",
          type: "select",
          defaultValue: "preliminary",
          options: compatibilityStateOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "visibilityMode",
          type: "select",
          defaultValue: "internal",
          options: ["public", "internal"].map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "availabilityValidationState",
          type: "select",
          defaultValue: "draft",
          options: specificationVerificationOptions.map((value) => ({
            label: value,
            value,
          })),
          required: true,
        },
        {
          name: "availabilityVisibilityMode",
          type: "select",
          defaultValue: "internal",
          options: ["public", "internal"].map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "leadTimeSummary",
          type: "text",
        },
      ],
    },
    {
      name: "marketAvailabilityNotes",
      type: "textarea",
    },
    {
      type: "row",
      fields: [
        {
          name: "heroAssetOverride",
          type: "relationship",
          relationTo: "media-assets",
        },
        {
          name: "coverCardAssetOverride",
          type: "relationship",
          relationTo: "media-assets",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "primaryInquiryTypeOverride",
          type: "text",
        },
        {
          name: "requiresQualificationOverride",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "ownerReviewRequired",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      name: "leadRoutingNotesOverride",
      type: "textarea",
    },
    {
      type: "row",
      fields: [
        {
          name: "routeMode",
          type: "select",
          defaultValue: "inherit-product",
          options: [
            "inherit-product",
            "query-param",
            "hash-state",
            "selector-state",
          ].map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "routeSegmentOverride",
          type: "text",
        },
        {
          name: "canonicalPathOverride",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "direction",
          type: "relationship",
          admin: {
            readOnly: true,
          },
          relationTo: "product-directions",
        },
        {
          name: "category",
          type: "relationship",
          admin: {
            readOnly: true,
          },
          relationTo: "product-categories",
        },
        {
          name: "line",
          type: "relationship",
          admin: {
            readOnly: true,
          },
          relationTo: "product-lines",
        },
      ],
    },
    {
      name: "namingDecisionNotes",
      type: "textarea",
    },
    {
      name: "publicationNotes",
      type: "textarea",
    },
    ...createSourceArtifactFields(),
    createAuditNotesField(),
    createSeoField(),
  ],
});
