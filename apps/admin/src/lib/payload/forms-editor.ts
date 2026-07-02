import type { CollectionSlug, Payload, PayloadRequest, Where } from "payload";

import { buildProductInquiryFormPreviewUrl } from "./preview-url.ts";
import { buildTranslationWorkspaceHref } from "./translations-workspace.ts";
import { buildAdvancedCollectionHref } from "../admin-bff/raw-layer.ts";
import { getAdminUser, publishingAccess } from "./access.ts";
import { hasAdminRole, type AdminRole, technicalAdminRoles } from "./roles.ts";

type FormRecord = Record<string, unknown>;

export type FormsEditorChecklistState = "ready" | "attention" | "blocked";

export type FormsEditorChecklistItem = {
  detail: string;
  href?: string;
  id: string;
  label: string;
  state: FormsEditorChecklistState;
};

export type FormsEditorLinkedWorkspace = {
  count: number;
  description: string;
  href: string;
  id: string;
  label: string;
};

export type FormsEditorFieldSummary = {
  fieldKey: string;
  href?: string;
  fieldType: string;
  label: string;
  leadMappingKey: string;
  required: boolean;
};

export type FormsEditorSnapshot = {
  blockers: FormsEditorChecklistItem[];
  checklist: FormsEditorChecklistItem[];
  fieldCount: number;
  fieldSummaries: FormsEditorFieldSummary[];
  formPublicUrl: string;
  launchLocaleCount: number;
  leadCount: number;
  linkedWorkspaces: FormsEditorLinkedWorkspace[];
  localeCoverageCount: number;
  productPublicUrl: string;
  publishedTranslationCount: number;
  reviewTranslationCount: number;
  translationCount: number;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value: unknown) {
  return value === true;
}

function getArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
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

function normalizeLocalePath(path: string, locale: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const localePrefix = `/${locale}`;

  if (normalizedPath === localePrefix || normalizedPath.startsWith(`${localePrefix}/`)) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return localePrefix;
  }

  return `${localePrefix}${normalizedPath}`;
}

function getPublicSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://89.150.34.66:8093").replace(/\/+$/, "");
}

function getFormId(form: FormRecord) {
  const id = form.id;
  return typeof id === "number" || typeof id === "string" ? id : undefined;
}

function getFormLocale(form: FormRecord) {
  return getText(form.locale) || getText(form.primaryLocale) || "en";
}

function getFormSlug(form: FormRecord) {
  return getText(form.slug);
}

function getFormInternalCode(form: FormRecord) {
  return getText(form.internalCode);
}

function getProductSlug(form: FormRecord) {
  const product = form.product;

  if (product && typeof product === "object" && "slug" in product) {
    return getText((product as { slug?: unknown }).slug);
  }

  return "";
}

function getProductLabel(form: FormRecord) {
  const product = form.product;

  if (!product || typeof product !== "object") {
    return "";
  }

  return (
    getText((product as { publicLabel?: unknown }).publicLabel) ||
    getText((product as { name?: unknown }).name)
  );
}

function getProductDirection(form: FormRecord) {
  const product = form.product;

  if (!product || typeof product !== "object") {
    return "";
  }

  const direction = (product as { direction?: { publicLabel?: unknown; name?: unknown } | null }).direction;
  return getText(direction?.publicLabel) || getText(direction?.name);
}

function getProductCanonicalPath(form: FormRecord) {
  const product = form.product;

  if (!product || typeof product !== "object") {
    return "/";
  }

  const canonicalPath = getText((product as { canonicalPath?: unknown }).canonicalPath);

  if (canonicalPath) {
    return canonicalPath;
  }

  const slug = getText((product as { slug?: unknown }).slug);
  return slug ? `/products/${slug}` : "/";
}

function buildCollectionHref(collection: string, filters: Array<[string, string | number]>) {
  const params = new URLSearchParams();

  for (const [key, value] of filters) {
    params.set(key, String(value));
  }

  const query = params.toString();
  return buildAdvancedCollectionHref(collection, { query });
}

function createTranslationWhere(slug: string, internalCode: string): Where {
  const keys = [slug, internalCode].filter(Boolean);

  return {
    and: [
      {
        ownerCollection: {
          equals: "product-inquiry-forms",
        },
      },
      {
        or: keys.map((key) => ({
          ownerRecordKey: {
            equals: key,
          },
        })),
      },
    ],
  };
}

async function countDocs(payload: Payload, collection: CollectionSlug, where: Where) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where,
  });

  return result.docs as unknown as FormRecord[];
}

function withOptionalHref(item: Omit<FormsEditorChecklistItem, "href">, href?: string) {
  return href ? { ...item, href } : item;
}

function mapFieldSummaries(form: FormRecord) {
  return getArray<Record<string, unknown>>(form.fields).map((field, index) => ({
    fieldKey: getText(field.fieldKey) || `field-${index + 1}`,
    href: "#field-fields",
    fieldType: getText(field.fieldType) || "text",
    label: getText(field.label) || getText(field.fieldKey) || `Field ${index + 1}`,
    leadMappingKey: getText(field.leadMappingKey),
    required: getBoolean(field.required),
  }));
}

export function canAccessFormSystemFields(user: unknown) {
  return hasAdminRole(getAdminUser(user), technicalAdminRoles);
}

export async function canPublishForm(user: unknown, req: PayloadRequest) {
  return Boolean(await publishingAccess({ req: { ...req, user } as PayloadRequest }));
}

export async function getFormPreviewUrl<T extends object>(form: T, req: PayloadRequest) {
  const record = form as FormRecord;

  return buildProductInquiryFormPreviewUrl(record, {
    locale: getFormLocale(record),
    req,
    token: null,
  });
}

export function getFormsWorkspaceRoleLabel(role: AdminRole | null | undefined) {
  switch (role) {
    case "owner":
      return "Owner approves legal/routing-sensitive changes and can override publish state when the product path is ready.";
    case "admin":
      return "Platform Admin keeps inquiry structure, routing and locale readiness coherent without exposing raw ingestion code.";
    case "content-editor":
      return "Content Editor owns visible labels, helper text and success copy through the governed builder.";
    case "translator":
      return "Translator should manage launch-locale execution through linked translation records, not ad-hoc field rewrites.";
    case "lead-manager":
      return "Lead Manager should confirm routing, notification targets and qualification mapping before publish.";
    case "developer":
      return "Developer can audit protected tokens and preview/runtime behavior while preserving the curated editor flow.";
    default:
      return "Use the guided form workspace only. Public renderer, lead intake code and anti-spam internals remain developer-owned.";
  }
}

export async function getFormsEditorSnapshot<T extends object>(
  payload: Payload,
  form: T,
): Promise<FormsEditorSnapshot> {
  const record = form as FormRecord;
  const formId = getFormId(record);
  const slug = getFormSlug(record);
  const internalCode = getFormInternalCode(record);
  const locale = getFormLocale(record);
  const launchLocaleCount = 7;
  const productId = getRelationshipId(record.product);
  const productSlug = getProductSlug(record);
  const productPublicUrl = `${getPublicSiteOrigin()}${normalizeLocalePath(getProductCanonicalPath(record), locale)}`;
  const formPublicUrl = `${getPublicSiteOrigin()}${normalizeLocalePath(productSlug ? `/request/${productSlug}` : "/request", locale)}`;
  const fieldSummaries = mapFieldSummaries(record);
  const fields = getArray<Record<string, unknown>>(record.fields);

  if (!formId || !slug) {
    return {
      blockers: [],
      checklist: [
        {
          detail: "Save the form draft first to unlock preview, leads, translations and routing workspace shortcuts.",
          id: "save-first",
          label: "Save the form draft",
          state: "attention",
        },
      ],
      fieldCount: fields.length,
      fieldSummaries,
      formPublicUrl,
      launchLocaleCount,
      leadCount: 0,
      linkedWorkspaces: [],
      localeCoverageCount: 0,
      productPublicUrl,
      publishedTranslationCount: 0,
      reviewTranslationCount: 0,
      translationCount: 0,
    };
  }

  const [translations, leads, siblingLocaleForms] = await Promise.all([
    countDocs(payload, "translations", createTranslationWhere(slug, internalCode)),
    countDocs(payload, "leads", {
      form: {
        equals: slug,
      },
    }),
    productId == null
      ? Promise.resolve([] as FormRecord[])
      : countDocs(payload, "productInquiryForms", {
          product: {
            equals: productId,
          },
        }),
  ]);

  const publishedTranslationCount = translations.filter((entry) => getText(entry.status) === "published").length;
  const reviewTranslationCount = translations.filter((entry) => getText(entry.status) === "review").length;
  const localeCoverageCount = new Set(
    siblingLocaleForms
      .filter((entry) => getText(entry.status) !== "archived")
      .map((entry) => getText(entry.locale))
      .filter(Boolean),
  ).size;

  const linkedWorkspaces: FormsEditorLinkedWorkspace[] = [
    {
      count: 1,
      description: "Parent product hierarchy, publish state and public route context.",
      href: productId == null ? "#" : buildAdvancedCollectionHref("products", { id: productId }),
      id: "product",
      label: "Родительский продукт",
    },
    {
      count: leads.length,
      description: "Lead history captured through this exact form slug.",
      href: buildCollectionHref("leads", [["where[form][equals]", slug]]),
      id: "leads",
      label: "Лиды",
    },
    {
      count: translations.length,
      description: "Launch-locale translation execution and stale-source review.",
      href: buildTranslationWorkspaceHref({
        ownerCollection: "product-inquiry-forms",
        ownerKey: slug,
      }),
      id: "translations",
      label: "Переводы",
    },
    {
      count: siblingLocaleForms.length,
      description: "Sibling locale forms for the same product-bound inquiry flow.",
      href:
        productId == null
          ? buildAdvancedCollectionHref("productInquiryForms")
          : buildCollectionHref("productInquiryForms", [["where[product][equals]", productId]]),
      id: "forms",
      label: "Формы по продукту",
    },
  ];

  const status = getText(record.status) || "draft";
  const approvalStatus = getText(record.approvalStatus) || "pending";
  const hasEditorialIdentity =
    Boolean(getText(record.title)) &&
    Boolean(getText(record.description)) &&
    Boolean(getText(record.submitLabel)) &&
    Boolean(getText(record.successTitle)) &&
    Boolean(getText(record.successMessage));
  const productLinked = Boolean(productId) && Boolean(productSlug);
  const requiredFieldIssues = fields.filter((field) => {
    const fieldType = getText(field.fieldType);

    if (fieldType === "hidden-context") {
      return false;
    }

    if (!getText(field.label)) {
      return true;
    }

    if (!getText(field.leadMappingKey) && fieldType !== "file-placeholder") {
      return true;
    }

    if (
      (fieldType === "select" || fieldType === "multi-select" || fieldType === "radio") &&
      getArray<unknown>(field.options).length === 0
    ) {
      return true;
    }

    return false;
  });
  const hasNotificationRoute =
    getText(record.submissionChannel) === "email-only-temp" ||
    getArray<Record<string, unknown>>(record.notificationEmails).some((entry) => Boolean(getText(entry.email)));
  const hasConsentBaseline = Boolean(getText(record.consentProfile)) && Boolean(getText(record.consentText));
  const localeCoverageReady = status === "draft" ? true : publishedTranslationCount > 0 || locale === "en";
  const contextSnapshotKeys = getArray<Record<string, unknown>>(record.contextSnapshotKeys).map((entry) =>
    getText(entry.key),
  );
  const requiresDocumentContext = getBoolean(record.capturesDocumentContext);
  const documentContextReady =
    !requiresDocumentContext ||
    (getText(record.documentContextMode) !== "none" &&
      contextSnapshotKeys.some((entry) => entry.includes("document")));
  const variantMode = getText(record.allowedVariantModes) || "product-only";
  const variantContextReady =
    variantMode !== "variant-required" ||
    (Boolean(getText(record.variantSelectorSource)) &&
      contextSnapshotKeys.some((entry) => entry.includes("variant")));
  const ownerReviewRequired = getBoolean(record.ownerReviewRequired);
  const publishReady =
    productLinked &&
    hasEditorialIdentity &&
    requiredFieldIssues.length === 0 &&
    hasNotificationRoute &&
    hasConsentBaseline &&
    localeCoverageReady &&
    documentContextReady &&
    variantContextReady &&
    (!ownerReviewRequired || approvalStatus === "approved");

  const checklist: FormsEditorChecklistItem[] = [
    withOptionalHref(
      {
        detail: productLinked
          ? `${getProductDirection(record) || "Product"} / ${getProductLabel(record) || productSlug}`
          : "Attach the form to a saved product before review/publish.",
        id: "product",
        label: "Product context",
        state: productLinked ? "ready" : "blocked",
      },
      linkedWorkspaces[0]?.href,
    ),
    withOptionalHref(
      {
        detail: hasEditorialIdentity
          ? "Title, description, submit CTA and success copy are present."
          : "Complete title, description, submit CTA and success copy.",
        id: "identity",
        label: "Editorial baseline",
        state: hasEditorialIdentity ? "ready" : "blocked",
      },
      "#field-title",
    ),
    withOptionalHref(
      {
        detail:
          requiredFieldIssues.length === 0
            ? `${fieldSummaries.length} governed field(s) keep labels and mappings aligned.`
            : `${requiredFieldIssues.length} field definition(s) are incomplete.`,
        id: "fields",
        label: "Field structure and lead mapping",
        state: requiredFieldIssues.length === 0 ? "ready" : "blocked",
      },
      "#field-fields",
    ),
    withOptionalHref(
      {
        detail: hasNotificationRoute
          ? "Submission channel and notification route are configured."
          : "Configure notification recipients or use the temporary email-only channel.",
        id: "routing",
        label: "Routing and notifications",
        state: hasNotificationRoute ? "ready" : "blocked",
      },
      "#field-submissionChannel",
    ),
    withOptionalHref(
      {
        detail: hasConsentBaseline
          ? "Consent profile and visible privacy copy are ready."
          : "Set consent profile and visible privacy copy before publish.",
        id: "consent",
        label: "Consent and privacy",
        state: hasConsentBaseline ? "ready" : "blocked",
      },
      "#field-consentProfile",
    ),
    withOptionalHref(
      {
        detail: localeCoverageReady
          ? `${publishedTranslationCount} published translation record(s); source locale ${locale.toUpperCase()} remains the baseline.`
          : "Publish at least one launch-locale translation or keep the form in draft/review.",
        id: "translations",
        label: "Locale coverage",
        state: localeCoverageReady ? "ready" : status === "draft" ? "attention" : "blocked",
      },
      linkedWorkspaces[2]?.href,
    ),
    withOptionalHref(
      {
        detail:
          documentContextReady && variantContextReady
            ? "Variant/document context keys are coherent with this inquiry mode."
            : "Variant or document context rules are incomplete.",
        id: "context",
        label: "Product and gated context",
        state: documentContextReady && variantContextReady ? "ready" : "blocked",
      },
      "#field-allowedVariantModes",
    ),
    withOptionalHref(
      {
        detail:
          status === "published"
            ? publishReady
              ? "Published state is coherent with current form readiness."
              : "Published state currently conflicts with one or more blockers."
            : publishReady
              ? "Preview and publish path is ready when approvals allow."
              : "Resolve blockers before publish or keep the form in draft/review.",
        id: "publish",
        label: "Preview and publication",
        state: publishReady ? "ready" : status === "draft" ? "attention" : "blocked",
      },
      "#field-approvalStatus",
    ),
  ];

  return {
    blockers: checklist.filter((item) => item.state === "blocked"),
    checklist,
    fieldCount: fieldSummaries.length,
    fieldSummaries,
    formPublicUrl,
    launchLocaleCount,
    leadCount: leads.length,
    linkedWorkspaces,
    localeCoverageCount,
    productPublicUrl,
    publishedTranslationCount,
    reviewTranslationCount,
    translationCount: translations.length,
  };
}
