import type { CollectionBeforeChangeHook, CollectionConfig, PayloadRequest, Where } from "payload";

import {
  authenticatedAccess,
  ownerOrDeveloperAccess,
  workflowOperatorAccess,
} from "../lib/payload/access.ts";
import {
  createSourceArtifactFields,
  inquiryFormApprovalStatusOptions,
  inquiryFormDocumentContextModeOptions,
  inquiryFormFieldGroupOptions,
  inquiryFormFieldTypeOptions,
  inquiryFormFieldWidthOptions,
  inquiryFormLayoutModeOptions,
  inquiryFormModeOptions,
  inquiryFormSubmissionChannelOptions,
  inquiryFormSuccessRedirectModeOptions,
  inquiryFormValidationRuleTypeOptions,
  inquiryFormVariantModeOptions,
  normalizeSlugLikeValue,
  validateSourceArtifactPath,
} from "../lib/payload/catalog.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import {
  createAuditNotesField,
  createLocaleField,
  createStatusField,
} from "../lib/payload/fields.ts";
import { canAccessFormSystemFields } from "../lib/payload/forms-editor.ts";
import { buildProductInquiryFormPreviewUrl } from "../lib/payload/preview-url.ts";

type ProductInquiryFormBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRelationshipId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return null;
}

function getArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function buildPrimaryLocaleWhere(
  product: string | number,
  locale: string,
  originalDocId: string | number | null,
): Where {
  const clauses: Where[] = [
    {
      product: {
        equals: product,
      },
    },
    {
      locale: {
        equals: locale,
      },
    },
    {
      isPrimaryForLocale: {
        equals: true,
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

function buildProductPrimaryFormWhere(product: string | number, locale: string): Where {
  return {
    and: [
      {
        product: {
          equals: product,
        },
      },
      {
        locale: {
          equals: locale,
        },
      },
      {
        isPrimaryForLocale: {
          equals: true,
        },
      },
      {
        status: {
          equals: "published",
        },
      },
      {
        approvalStatus: {
          equals: "approved",
        },
      },
    ],
  };
}

async function resolveProduct(
  req: PayloadRequest,
  productId: string | number | null,
) {
  if (productId == null) {
    return null;
  }

  const result = await req.payload.findByID({
    id: productId,
    collection: "products",
    depth: 0,
    overrideAccess: true,
  });

  return result as unknown as Record<string, unknown> | null;
}

function normalizeNotificationEmails(value: unknown) {
  return getArray<unknown>(value)
    .map((entry) => {
      if (typeof entry === "string") {
        return { email: entry.trim().toLowerCase() };
      }

      if (entry && typeof entry === "object") {
        return {
          ...(entry as Record<string, unknown>),
          email: getText((entry as { email?: unknown }).email).toLowerCase(),
        };
      }

      return { email: "" };
    })
    .filter((entry) => entry.email);
}

function normalizeFieldDefinitions(
  fields: Array<Record<string, unknown>>,
  formCode: string,
) {
  return fields.map((field, index) => {
    const fieldType = inquiryFormFieldTypeOptions.includes(
      getText(field.fieldType) as (typeof inquiryFormFieldTypeOptions)[number],
    )
      ? (getText(field.fieldType) as (typeof inquiryFormFieldTypeOptions)[number])
      : "text";
    const fieldKey =
      normalizeSlugLikeValue(field.fieldKey, `${formCode.toLowerCase()}-field-${index + 1}`) ||
      `${formCode.toLowerCase()}-field-${index + 1}`;
    const label = getText(field.label);
    const leadMappingKey =
      fieldType === "file-placeholder"
        ? getText(field.leadMappingKey)
        : normalizeSlugLikeValue(field.leadMappingKey, fieldKey) || fieldKey;
    const options = getArray<Record<string, unknown>>(field.options)
      .map((option) => ({
        ...option,
        label: getText(option.label),
        value: getText(option.value),
      }))
      .filter((option) => option.label && option.value);
    const validationRules = getArray<Record<string, unknown>>(field.validationRules).map((rule) => ({
      ...rule,
      message: getText(rule.message),
      ruleType: getText(rule.ruleType),
      value: getText(rule.value),
    }));

    if (!label && fieldType !== "hidden-context") {
      throw new Error(
        `Product inquiry form validation failed: fields[${index}] requires label.`,
      );
    }

    if (
      (fieldType === "select" || fieldType === "multi-select" || fieldType === "radio") &&
      options.length === 0
    ) {
      throw new Error(
        `Product inquiry form validation failed: fields[${index}] requires options.`,
      );
    }

    if (!leadMappingKey && fieldType !== "file-placeholder") {
      throw new Error(
        `Product inquiry form validation failed: fields[${index}] requires leadMappingKey.`,
      );
    }

    return {
      ...field,
      adminOnlyNotes: getText(field.adminOnlyNotes),
      defaultValue: getText(field.defaultValue),
      fieldKey,
      fieldType,
      helperText: getText(field.helperText),
      label,
      leadMappingKey,
      options,
      placeholder: getText(field.placeholder),
      required: field.required === true,
      submittedLabelSnapshot: label || fieldKey,
      validationRules,
      visibilityRule: getText(field.visibilityRule),
      width: inquiryFormFieldWidthOptions.includes(
        getText(field.width) as (typeof inquiryFormFieldWidthOptions)[number],
      )
        ? getText(field.width)
        : "full",
    };
  });
}

function normalizeFieldGroups(value: unknown) {
  return getArray<Record<string, unknown>>(value).map((group, index) => ({
    ...group,
    groupKey:
      normalizeSlugLikeValue(group.groupKey, `group-${index + 1}`) || `group-${index + 1}`,
    groupType: inquiryFormFieldGroupOptions.includes(
      getText(group.groupType) as (typeof inquiryFormFieldGroupOptions)[number],
    )
      ? getText(group.groupType)
      : "contact",
    summary: getText(group.summary),
    title: getText(group.title),
  }));
}

function normalizeContextSnapshotKeys(value: unknown) {
  return getArray<unknown>(value)
    .map((entry) => {
      if (typeof entry === "string") {
        const key = normalizeSlugLikeValue(entry);
        return key ? { key } : null;
      }

      if (entry && typeof entry === "object") {
        const key = normalizeSlugLikeValue((entry as { key?: unknown }).key);
        return key ? { ...(entry as Record<string, unknown>), key } : null;
      }

      return null;
    })
    .filter((entry): entry is { key: string } => Boolean(entry?.key));
}

export const validateProductInquiryForm: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}: ProductInquiryFormBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };
  const productId = getRelationshipId(currentData.product);
  const locale = getText(currentData.locale);
  const primaryLocale = getText(currentData.primaryLocale) || locale;
  const product = await resolveProduct(req, productId);
  const productSlug = getText(product?.slug);
  const internalCode = getText(currentData.internalCode);
  const slug =
    normalizeSlugLikeValue(
      currentData.slug,
      [productSlug, locale, currentData.formMode].filter(Boolean).join("-"),
    ) || normalizeSlugLikeValue(internalCode);
  const fieldGroups = normalizeFieldGroups(currentData.fieldGroups);
  const fields = normalizeFieldDefinitions(
    getArray<Record<string, unknown>>(currentData.fields),
    internalCode || "form",
  );
  const formMode = inquiryFormModeOptions.includes(
    getText(currentData.formMode) as (typeof inquiryFormModeOptions)[number],
  )
    ? getText(currentData.formMode)
    : "product-inquiry";
  const submissionChannel = inquiryFormSubmissionChannelOptions.includes(
    getText(currentData.submissionChannel) as (typeof inquiryFormSubmissionChannelOptions)[number],
  )
    ? getText(currentData.submissionChannel)
    : "cms-lead";
  const successRedirectMode = inquiryFormSuccessRedirectModeOptions.includes(
    getText(currentData.successRedirectMode) as (typeof inquiryFormSuccessRedirectModeOptions)[number],
  )
    ? getText(currentData.successRedirectMode)
    : "inline-message";
  const approvalStatus = inquiryFormApprovalStatusOptions.includes(
    getText(currentData.approvalStatus) as (typeof inquiryFormApprovalStatusOptions)[number],
  )
    ? getText(currentData.approvalStatus)
    : "pending";
  const allowedVariantModes = inquiryFormVariantModeOptions.includes(
    getText(currentData.allowedVariantModes) as (typeof inquiryFormVariantModeOptions)[number],
  )
    ? getText(currentData.allowedVariantModes)
    : "product-only";
  const documentContextMode = inquiryFormDocumentContextModeOptions.includes(
    getText(currentData.documentContextMode) as (typeof inquiryFormDocumentContextModeOptions)[number],
  )
    ? getText(currentData.documentContextMode)
    : "none";

  if (!productId || !product || !locale || !internalCode || !slug) {
    throw new Error(
      "Product inquiry form validation failed: product, locale, internalCode and slug are required.",
    );
  }

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Product inquiry form validation failed: sourceOfTruthArtifact",
  );

  if (fields.length === 0) {
    throw new Error("Product inquiry form validation failed: at least one field is required.");
  }

  const fieldKeys = new Set<string>();

  for (const field of fields) {
    if (fieldKeys.has(field.fieldKey)) {
      throw new Error(
        `Product inquiry form validation failed: duplicate fieldKey "${field.fieldKey}".`,
      );
    }

    fieldKeys.add(field.fieldKey);
  }

  if (currentData.isPrimaryForLocale === true) {
    const existingPrimary = await req.payload.find({
      collection: "productInquiryForms",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: buildPrimaryLocaleWhere(productId, locale, getRelationshipId(originalDoc?.id)),
    });

    if (existingPrimary.docs[0]) {
      throw new Error(
        "Product inquiry form validation failed: only one primary form is allowed per product and locale.",
      );
    }
  }

  const notificationEmails = normalizeNotificationEmails(currentData.notificationEmails);

  if (submissionChannel !== "email-only-temp" && notificationEmails.length === 0) {
    throw new Error(
      "Product inquiry form validation failed: notificationEmails are required unless submissionChannel is email-only-temp.",
    );
  }

  if (
    allowedVariantModes === "variant-required" &&
    !getText(currentData.variantSelectorSource)
  ) {
    throw new Error(
      "Product inquiry form validation failed: variantSelectorSource is required when allowedVariantModes is variant-required.",
    );
  }

  const contextSnapshotKeys = normalizeContextSnapshotKeys(currentData.contextSnapshotKeys);

  if (
    allowedVariantModes === "variant-required" &&
    !contextSnapshotKeys.some((entry) => entry.key.includes("variant"))
  ) {
    throw new Error(
      "Product inquiry form validation failed: variant-required forms must persist variant context.",
    );
  }

  if (currentData.capturesDocumentContext === true) {
    if (documentContextMode === "none") {
      throw new Error(
        "Product inquiry form validation failed: document forms require a documentContextMode.",
      );
    }

    if (!contextSnapshotKeys.some((entry) => entry.key.includes("document"))) {
      throw new Error(
        "Product inquiry form validation failed: document context must be included in contextSnapshotKeys.",
      );
    }
  }

  if (
    (successRedirectMode === "thank-you-route" || successRedirectMode === "document-release") &&
    !getText(currentData.successRedirectTarget)
  ) {
    throw new Error(
      "Product inquiry form validation failed: successRedirectTarget is required for redirect-based success modes.",
    );
  }

  if (currentData.status === "published") {
    if (approvalStatus !== "approved") {
      throw new Error(
        "Product inquiry form validation failed: published forms require approvalStatus approved.",
      );
    }

    if (product.status !== "review" && product.status !== "published") {
      throw new Error(
        "Product inquiry form validation failed: parent product must be in review or published before its form can be published.",
      );
    }
  }

  return {
    ...currentData,
    approvalStatus,
    allowedVariantModes,
    contextSnapshotKeys,
    documentContextMode,
    fieldDefinitionsVersion: getText(currentData.fieldDefinitionsVersion),
    fieldGroups,
    fields,
    formMode,
    layoutMode: inquiryFormLayoutModeOptions.includes(
      getText(currentData.layoutMode) as (typeof inquiryFormLayoutModeOptions)[number],
    )
      ? getText(currentData.layoutMode)
      : "single-column",
    locale,
    notificationEmails,
    preselectedIntent: getText(currentData.preselectedIntent),
    primaryLocale,
    slug,
    submissionChannel,
    submittedFieldSnapshotTemplate: fields.map((field) => ({
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      label: field.submittedLabelSnapshot,
      leadMappingKey: field.leadMappingKey,
    })),
    successRedirectMode,
  };
};

export async function hasApprovedPrimaryInquiryForm(
  req: PayloadRequest,
  productId: string | number,
  locale: string,
) {
  const result = await req.payload.find({
    collection: "productInquiryForms",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: buildProductPrimaryFormWhere(productId, locale),
  });

  return Boolean(result.docs[0]);
}

export const ProductInquiryForms: CollectionConfig = defineCollection({
  dbName: "pif",
  slug: "productInquiryForms",
  versions: false,
  admin: {
    defaultColumns: [
      "internalCode",
      "product",
      "locale",
      "formMode",
      "status",
      "approvalStatus",
      "isPrimaryForLocale",
    ],
    group: "Leads",
    listSearchableFields: ["internalCode", "title", "slug", "submitLabel", "shortLabel"],
    preview: buildProductInquiryFormPreviewUrl,
    useAsTitle: "title",
  },
  access: {
    create: workflowOperatorAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: workflowOperatorAccess,
  },
  hooks: {
    beforeChange: [validateProductInquiryForm],
  },
  fields: [
    {
      name: "formWorkspaceReadiness",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "./components/forms-editor/FormsEditorSidebarField.tsx#FormsEditorSidebarField",
        },
      },
      label: "Workspace readiness",
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Обзор",
          fields: [
            {
              name: "formsWorkspaceOverview",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "overview",
                },
              },
              label: "Overview",
            },
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
                {
                  name: "product",
                  type: "relationship",
                  relationTo: "products",
                  required: true,
                },
                {
                  name: "slug",
                  type: "text",
                  required: true,
                  unique: true,
                },
                {
                  name: "formMode",
                  type: "select",
                  defaultValue: "product-inquiry",
                  options: inquiryFormModeOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                createLocaleField("primaryLocale"),
                {
                  name: "isPrimaryForLocale",
                  type: "checkbox",
                  defaultValue: true,
                },
                {
                  name: "approvalStatus",
                  type: "select",
                  defaultValue: "pending",
                  options: inquiryFormApprovalStatusOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: "Структура и поля",
          fields: [
            {
              name: "formsWorkspaceStructure",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "structure",
                },
              },
              label: "Structure",
            },
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "shortLabel",
                  type: "text",
                },
                {
                  name: "submitLabel",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "description",
              type: "textarea",
              required: true,
            },
            {
              name: "sidebarNotes",
              type: "textarea",
            },
            {
              type: "row",
              fields: [
                {
                  name: "successTitle",
                  type: "text",
                  required: true,
                },
                {
                  name: "successMessage",
                  type: "textarea",
                  required: true,
                },
                {
                  name: "followupExpectation",
                  type: "text",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "fieldTemplateKey",
                  type: "text",
                },
                {
                  name: "fieldDefinitionsVersion",
                  type: "text",
                },
                {
                  name: "layoutMode",
                  type: "select",
                  defaultValue: "single-column",
                  options: inquiryFormLayoutModeOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
              ],
            },
            {
              name: "fieldGroups",
              type: "array",
              fields: [
                {
                  name: "groupKey",
                  type: "text",
                  required: true,
                },
                {
                  name: "groupType",
                  type: "select",
                  options: inquiryFormFieldGroupOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
                {
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "summary",
                  type: "textarea",
                },
              ],
            },
            {
              name: "fields",
              type: "array",
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "fieldKey",
                      type: "text",
                      required: true,
                    },
                    {
                      name: "fieldType",
                      type: "select",
                      options: inquiryFormFieldTypeOptions.map((value) => ({ label: value, value })),
                      required: true,
                    },
                    {
                      name: "required",
                      type: "checkbox",
                      defaultValue: false,
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "label",
                      type: "text",
                    },
                    {
                      name: "leadMappingKey",
                      type: "text",
                    },
                    {
                      name: "width",
                      type: "select",
                      defaultValue: "full",
                      options: inquiryFormFieldWidthOptions.map((value) => ({ label: value, value })),
                    },
                  ],
                },
                {
                  name: "helperText",
                  type: "textarea",
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "placeholder",
                      type: "text",
                    },
                    {
                      name: "defaultValue",
                      type: "text",
                    },
                    {
                      name: "visibilityRule",
                      type: "text",
                    },
                  ],
                },
                {
                  name: "options",
                  type: "array",
                  fields: [
                    {
                      name: "value",
                      type: "text",
                      required: true,
                    },
                    {
                      name: "label",
                      type: "text",
                      required: true,
                    },
                  ],
                },
                {
                  name: "validationRules",
                  type: "array",
                  fields: [
                    {
                      type: "row",
                      fields: [
                        {
                          name: "ruleType",
                          type: "select",
                          options: inquiryFormValidationRuleTypeOptions.map((value) => ({
                            label: value,
                            value,
                          })),
                          required: true,
                        },
                        {
                          name: "value",
                          type: "text",
                        },
                      ],
                    },
                    {
                      name: "message",
                      type: "text",
                    },
                  ],
                },
                {
                  name: "adminOnlyNotes",
                  type: "textarea",
                },
                {
                  name: "submittedLabelSnapshot",
                  type: "text",
                  admin: {
                    description: "Frozen field label used as the default lead snapshot source.",
                    readOnly: true,
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Контекст продукта",
          fields: [
            {
              name: "formsWorkspaceContext",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "context",
                },
              },
              label: "Context",
            },
            {
              type: "row",
              fields: [
                {
                  name: "allowedVariantModes",
                  type: "select",
                  defaultValue: "product-only",
                  options: inquiryFormVariantModeOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
                {
                  name: "variantSelectorSource",
                  type: "text",
                },
                {
                  name: "preselectedIntent",
                  type: "text",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "capturesDocumentContext",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "documentContextMode",
                  type: "select",
                  defaultValue: "none",
                  options: inquiryFormDocumentContextModeOptions.map((value) => ({
                    label: value,
                    value,
                  })),
                  required: true,
                },
                {
                  name: "secondaryCtaLabel",
                  type: "text",
                },
              ],
            },
            {
              name: "contextSnapshotKeys",
              type: "array",
              fields: [
                {
                  name: "key",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: "Маршрутизация и уведомления",
          fields: [
            {
              name: "formsWorkspaceRouting",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "routing",
                },
              },
              label: "Routing",
            },
            {
              type: "row",
              fields: [
                {
                  name: "submissionChannel",
                  type: "select",
                  defaultValue: "cms-lead",
                  options: inquiryFormSubmissionChannelOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
                {
                  name: "notificationTemplateKey",
                  type: "text",
                },
                {
                  name: "autoReplyTemplateKey",
                  type: "text",
                },
              ],
            },
            {
              name: "notificationEmails",
              type: "array",
              fields: [
                {
                  name: "email",
                  type: "email",
                  required: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "autoReplyEnabled",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "successRedirectMode",
                  type: "select",
                  defaultValue: "inline-message",
                  options: inquiryFormSuccessRedirectModeOptions.map((value) => ({ label: value, value })),
                  required: true,
                },
                {
                  name: "successRedirectTarget",
                  type: "text",
                },
              ],
            },
            {
              name: "submissionTags",
              type: "array",
              fields: [
                {
                  name: "tag",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "rateLimitProfile",
              type: "text",
            },
          ],
        },
        {
          label: "Consent и privacy",
          fields: [
            {
              name: "formsWorkspaceConsent",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "consent",
                },
              },
              label: "Consent",
            },
            {
              type: "row",
              fields: [
                {
                  name: "consentProfile",
                  type: "text",
                  required: true,
                },
                {
                  name: "privacyNoticeLinkMode",
                  type: "select",
                  defaultValue: "global-policy",
                  options: [
                    { label: "global-policy", value: "global-policy" },
                    { label: "locale-page", value: "locale-page" },
                    { label: "custom-link", value: "custom-link" },
                  ],
                  required: true,
                },
                {
                  name: "privacyNoticeTarget",
                  type: "text",
                },
              ],
            },
            {
              name: "consentText",
              type: "textarea",
              required: true,
            },
            {
              type: "row",
              fields: [
                {
                  name: "marketingOptInEnabled",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "marketingOptInDefault",
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
              name: "publicationNotes",
              type: "textarea",
            },
          ],
        },
        {
          label: "Переводы",
          fields: [
            {
              name: "formsWorkspaceTranslations",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "translations",
                },
              },
              label: "Translations",
            },
            {
              name: "marketAvailabilityNotes",
              type: "textarea",
            },
          ],
        },
        {
          label: "Lead mapping",
          fields: [
            {
              name: "formsWorkspaceLeadMapping",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "lead-mapping",
                },
              },
              label: "Lead mapping",
            },
            {
              name: "submittedFieldSnapshotTemplate",
              type: "array",
              admin: {
                description:
                  "Immutable field-label snapshot template persisted for downstream lead history.",
                readOnly: true,
              },
              fields: [
                {
                  name: "fieldKey",
                  type: "text",
                  required: true,
                },
                {
                  name: "label",
                  type: "text",
                  required: true,
                },
                {
                  name: "leadMappingKey",
                  type: "text",
                },
                {
                  name: "fieldType",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: "Preview и публикация",
          fields: [
            {
              name: "formsWorkspacePreview",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "preview",
                },
              },
              label: "Preview",
            },
          ],
        },
        {
          label: "Внутренние заметки",
          fields: [
            {
              name: "formsWorkspaceNotes",
              type: "ui",
              admin: {
                components: {
                  Field: "./components/forms-editor/FormsEditorWorkspaceField.tsx#FormsEditorWorkspaceField",
                },
                custom: {
                  surface: "notes",
                },
              },
              label: "Notes",
            },
            {
              name: "governanceNotes",
              type: "textarea",
            },
            createAuditNotesField(),
          ],
        },
        {
          label: "System",
          fields: [...createSourceArtifactFields()],
          admin: {
            condition: (_, __, { user }) => canAccessFormSystemFields(user),
          },
        },
      ],
    },
  ],
});
