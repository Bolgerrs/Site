import type { CollectionBeforeChangeHook, CollectionConfig, PayloadRequest, Where } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  normalizeCanonicalPath,
  translationPriorityOptions,
  validateSourceArtifactPath,
} from "../lib/payload/catalog.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import {
  createAuditNotesField,
  createLocaleField,
  createStatusField,
} from "../lib/payload/fields.ts";
import {
  createOwnerKey,
  fetchSourceDocument,
  getSourceId,
  getSourceLabel,
  getSourcePath,
  getSourceStatus,
  getText,
  isOwnerRecordSourceType,
  normalizePublicPath,
  seoCanonicalModeOptions,
  seoIndexingModeOptions,
  seoOwnerTypeOptions,
  seoPublicationReadinessOptions,
  seoQualityFlagOptions,
  seoSocialCardStyleOptions,
} from "../lib/payload/site-governance.ts";

type SeoEntryBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

const ownerRelationFields = {
  page: "ownerPage",
  "product-direction": "ownerDirection",
  "product-category": "ownerCategory",
  "product-line": "ownerLine",
  product: "ownerProduct",
} as const;

const approvalStatusOptions = [
  "pending",
  "needs-review",
  "approved",
  "rejected",
  "expired",
] as const;

function buildDuplicateOwnerLocaleWhere(
  ownerKey: string,
  locale: string,
  originalDocId: string | number | null,
): Where {
  const clauses: Where[] = [
    {
      ownerKey: {
        equals: ownerKey,
      },
    },
    {
      locale: {
        equals: locale,
      },
    },
  ];

  if (originalDocId != null) {
    clauses.push({
      id: {
        not_equals: originalDocId,
      },
    });
  }

  return {
    and: clauses,
  };
}

export const validateSeoEntry: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}: SeoEntryBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };

  const ownerType = getText(currentData.ownerType) as (typeof seoOwnerTypeOptions)[number];
  const internalCode = getText(currentData.internalCode);
  const locale = getText(currentData.locale);
  const primaryLocale = getText(currentData.primaryLocale) || locale;
  const canonicalMode = getText(currentData.canonicalMode) || "owner-default";
  const approvalStatus = getText(currentData.approvalStatus) || "pending";
  const publicationReadiness = getText(currentData.publicationReadiness) || "blocked";
  const indexingMode = getText(currentData.indexingMode) || "index,follow";

  if (!internalCode) {
    throw new Error("SEO entry validation failed: internalCode is required.");
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "SEO entry validation failed: sourceOfTruthArtifact",
  );

  let ownerKey = "";
  let ownerLabel = getText(currentData.ownerLabel);
  let defaultRoutePath = "/";

  if (ownerType === "system-route") {
    const ownerSystemKey = getText(currentData.ownerSystemKey) || internalCode;

    ownerKey = createOwnerKey(ownerType, ownerSystemKey);
    ownerLabel = ownerLabel || ownerSystemKey;
  } else if (isOwnerRecordSourceType(ownerType)) {
    const relationField = ownerRelationFields[ownerType];
    const ownerId = getSourceId(currentData[relationField]);

    if (!ownerId) {
      throw new Error(`SEO entry validation failed: ${relationField} is required for ${ownerType}.`);
    }

    const ownerDocument = await fetchSourceDocument(req.payload, ownerType, ownerId);

    if (!ownerDocument) {
      throw new Error(`SEO entry validation failed: ${ownerType} source record was not found.`);
    }

    ownerKey = createOwnerKey(ownerType, ownerId);
    ownerLabel = ownerLabel || getSourceLabel(ownerType, ownerDocument);
    defaultRoutePath = getSourcePath(ownerType, ownerDocument) || defaultRoutePath;

    if (publicationReadiness === "production-ready" && getSourceStatus(ownerDocument) !== "published") {
      throw new Error(
        "SEO entry validation failed: production-ready metadata requires a published owner record.",
      );
    }
  } else {
    throw new Error("SEO entry validation failed: ownerType is invalid.");
  }

  const routePath = normalizePublicPath(currentData.routePath, defaultRoutePath);
  const canonicalUrl = getText(currentData.canonicalUrl);
  const metaTitle = getText(currentData.metaTitle);
  const metaDescription = getText(currentData.metaDescription);
  const includeInSitemap = currentData.includeInSitemap !== false;
  const hreflangEnabled = currentData.hreflangEnabled !== false;
  const previewOnly = currentData.previewOnly === true;

  if (!locale) {
    throw new Error("SEO entry validation failed: locale is required.");
  }

  if (!metaTitle || !metaDescription) {
    throw new Error("SEO entry validation failed: metaTitle and metaDescription are required.");
  }

  if (canonicalMode === "custom" && !canonicalUrl) {
    throw new Error("SEO entry validation failed: canonicalUrl is required when canonicalMode is custom.");
  }

  if (includeInSitemap && indexingMode.startsWith("noindex")) {
    throw new Error(
      "SEO entry validation failed: sitemap-included routes cannot use a noindex indexing mode.",
    );
  }

  if (previewOnly && publicationReadiness === "production-ready") {
    throw new Error(
      "SEO entry validation failed: preview-only metadata cannot be marked production-ready.",
    );
  }

  if (publicationReadiness === "production-ready" && approvalStatus !== "approved") {
    throw new Error(
      "SEO entry validation failed: production-ready metadata requires approvalStatus=approved.",
    );
  }

  const existing = await req.payload.find({
    collection: "seo-entries",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: buildDuplicateOwnerLocaleWhere(ownerKey, locale, getSourceId(originalDoc?.id)),
  });

  if (existing.docs[0]) {
    throw new Error(
      "SEO entry validation failed: only one SEO entry is allowed for an owner-locale pair.",
    );
  }

  return {
    ...currentData,
    canonicalUrl:
      canonicalMode === "custom" ? canonicalUrl : normalizeCanonicalPath(canonicalUrl, routePath),
    hreflangEnabled,
    includeInSitemap,
    locale,
    metaDescription,
    metaTitle,
    ownerKey,
    ownerLabel,
    previewOnly,
    primaryLocale,
    routePath,
  };
};

export const SeoEntries: CollectionConfig = defineCollection({
  slug: "seo-entries",
  admin: {
    defaultColumns: [
      "internalCode",
      "ownerType",
      "ownerLabel",
      "locale",
      "routePath",
      "status",
      "publicationReadiness",
    ],
    group: "SEO",
    useAsTitle: "ownerLabel",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateSeoEntry],
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
        createLocaleField(),
      ],
    },
    {
      type: "row",
      fields: [
        createLocaleField("primaryLocale"),
        {
          name: "ownerType",
          type: "select",
          options: seoOwnerTypeOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "ownerLabel",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "ownerPage",
          type: "relationship",
          admin: {
            condition: (_, siblingData) => siblingData.ownerType === "page",
          },
          relationTo: "pages",
        },
        {
          name: "ownerDirection",
          type: "relationship",
          admin: {
            condition: (_, siblingData) => siblingData.ownerType === "product-direction",
          },
          relationTo: "product-directions",
        },
        {
          name: "ownerCategory",
          type: "relationship",
          admin: {
            condition: (_, siblingData) => siblingData.ownerType === "product-category",
          },
          relationTo: "product-categories",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "ownerLine",
          type: "relationship",
          admin: {
            condition: (_, siblingData) => siblingData.ownerType === "product-line",
          },
          relationTo: "product-lines",
        },
        {
          name: "ownerProduct",
          type: "relationship",
          admin: {
            condition: (_, siblingData) => siblingData.ownerType === "product",
          },
          relationTo: "products",
        },
        {
          name: "ownerSystemKey",
          type: "text",
          admin: {
            condition: (_, siblingData) => siblingData.ownerType === "system-route",
            description: "Stable key for routes owned by runtime/site settings rather than a content entity.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "routePath",
          type: "text",
          index: true,
          required: true,
        },
        {
          name: "canonicalMode",
          type: "select",
          defaultValue: "owner-default",
          options: seoCanonicalModeOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "canonicalUrl",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "indexingMode",
          type: "select",
          defaultValue: "index,follow",
          options: seoIndexingModeOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "includeInSitemap",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "hreflangEnabled",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "previewOnly",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "publicationReadiness",
          type: "select",
          defaultValue: "blocked",
          options: seoPublicationReadinessOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "approvalStatus",
          type: "select",
          defaultValue: "pending",
          options: approvalStatusOptions.map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      name: "metaTitle",
      type: "text",
      required: true,
    },
    {
      name: "metaDescription",
      type: "textarea",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "shareTitle",
          type: "text",
        },
        {
          name: "shareDescription",
          type: "textarea",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "ogImage",
          type: "relationship",
          relationTo: "media-assets",
        },
        {
          name: "ogImageAlt",
          type: "text",
        },
        {
          name: "socialCardStyle",
          type: "select",
          defaultValue: "summary_large_image",
          options: seoSocialCardStyleOptions.map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      name: "alternateLocaleTargets",
      type: "array",
      fields: [
        createLocaleField("locale"),
        {
          name: "routePath",
          type: "text",
          required: true,
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
          options: translationPriorityOptions.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "ownerReviewRequired",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "legalClaimReviewRequired",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      name: "qualityFlags",
      type: "select",
      hasMany: true,
      options: seoQualityFlagOptions.map((value) => ({ label: value, value })),
    },
    {
      name: "searchIntentCluster",
      type: "text",
    },
    {
      name: "primaryKeywordNotes",
      type: "textarea",
    },
    {
      name: "serpValueProposition",
      type: "textarea",
    },
    {
      name: "governanceNotes",
      type: "textarea",
    },
    {
      name: "marketRestrictionNotes",
      type: "textarea",
    },
    {
      name: "redirectAliasNotes",
      type: "textarea",
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
    {
      name: "ownerKey",
      type: "text",
      admin: {
        hidden: true,
        readOnly: true,
      },
      index: true,
    },
  ],
});
