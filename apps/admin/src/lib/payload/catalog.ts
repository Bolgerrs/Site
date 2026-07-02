import type { Field, PayloadRequest } from "payload";

export const directionFamilyOptions = [
  "audio",
  "vision",
  "art-objects",
  "projects",
] as const;

export const categoryKindOptions = [
  "hardware-family",
  "technology-family",
  "material-program",
  "solution-family",
] as const;

export const productLineKindOptions = [
  "tier",
  "series",
  "platform",
  "family",
  "program",
] as const;

export const productNarrativeModeOptions = [
  "editorial",
  "comparison",
  "catalog",
  "project-led",
] as const;

export const productKindOptions = [
  "physical-product",
  "system",
  "installation-solution",
  "service-led-offer",
] as const;

export const launchStageOptions = [
  "concept",
  "planned",
  "active",
  "signature",
  "limited",
] as const;

export const availabilityModeOptions = [
  "on-request",
  "made-to-order",
  "limited-series",
  "dealer-only",
  "private-consultation",
] as const;

export const translationPriorityOptions = [
  "normal",
  "high",
  "critical",
] as const;

export const inquiryFormModeOptions = [
  "product-inquiry",
  "consultation-request",
  "private-demo",
  "document-access",
] as const;

export const inquiryFormLayoutModeOptions = [
  "single-column",
  "split-sections",
  "step-lite",
] as const;

export const inquiryFormFieldGroupOptions = [
  "contact",
  "project",
  "system",
  "preferences",
  "documents",
  "consent",
] as const;

export const inquiryFormFieldTypeOptions = [
  "text",
  "textarea",
  "email",
  "phone",
  "select",
  "multi-select",
  "radio",
  "checkbox",
  "number",
  "date",
  "file-placeholder",
  "hidden-context",
  "consent",
] as const;

export const inquiryFormFieldWidthOptions = [
  "full",
  "half",
  "third",
] as const;

export const inquiryFormValidationRuleTypeOptions = [
  "min-length",
  "max-length",
  "pattern",
  "min-value",
  "max-value",
  "email-format",
  "phone-format",
  "required-selection-count",
] as const;

export const inquiryFormVariantModeOptions = [
  "product-only",
  "optional-variant-context",
  "variant-required",
] as const;

export const inquiryFormDocumentContextModeOptions = [
  "none",
  "optional-hidden-context",
  "required-selection",
] as const;

export const inquiryFormSubmissionChannelOptions = [
  "cms-lead",
  "cms-lead-plus-email",
  "email-only-temp",
] as const;

export const inquiryFormSuccessRedirectModeOptions = [
  "inline-message",
  "thank-you-route",
  "document-release",
] as const;

export const inquiryFormApprovalStatusOptions = [
  "pending",
  "needs-review",
  "approved",
  "rejected",
  "expired",
] as const;

export const productVariantTypeOptions = [
  "finish",
  "material",
  "size",
  "installation-package",
  "bundle",
  "channel-layout",
  "edition",
  "region-power",
  "other",
] as const;

export const productVariantKindOptions = [
  "standard",
  "premium-option",
  "limited-edition",
  "future-option",
  "internal-only",
] as const;

export const productVariantSelectionModeOptions = [
  "default",
  "optional-upgrade",
  "single-choice",
  "multi-context-preview",
] as const;

export const productVariantAvailabilityOptions = [
  "active",
  "preview",
  "by-request",
  "invite-only",
  "discontinued",
] as const;

export const productVariantReadinessOptions = [
  "drafting",
  "needs-validation",
  "ready-for-review",
  "publishable",
] as const;

export const productVariantReadinessSummaryOptions = [
  "no-variants",
  "drafting",
  "needs-validation",
  "ready-for-review",
  "publishable",
] as const;

export const specificationValueTypeOptions = [
  "text",
  "number",
  "range",
  "boolean",
  "list",
] as const;

export const specificationVerificationOptions = [
  "draft",
  "pending-validation",
  "validated",
  "restricted",
] as const;

export const specificationVisibilityOptions = [
  "public",
  "selector",
  "internal",
] as const;

export const compatibilityTargetOptions = [
  "room-size",
  "system-role",
  "installation-context",
  "power-region",
  "mounting",
  "control-stack",
  "environment",
  "material-match",
] as const;

export const compatibilityStateOptions = [
  "preliminary",
  "validated",
  "restricted",
] as const;

export const pageFamilyOptions = [
  "home",
  "direction-landing",
  "category-landing",
  "brand-editorial",
  "technology-editorial",
  "craftsmanship-editorial",
  "projects",
  "journal-index",
  "journal-entry",
  "downloads",
  "contact",
  "request",
  "dealer-or-partner",
  "legal-or-policy",
  "hidden-preview",
] as const;

export const pageLayoutModeOptions = [
  "brand-editorial",
  "catalog-landing",
  "storytelling-longform",
  "contact-service",
  "minimal-system",
] as const;

export const pageApprovalStatusOptions = [
  "pending",
  "needs-review",
  "approved",
  "rejected",
  "expired",
] as const;

export const pageAudienceModeOptions = [
  "public",
  "dealer",
  "owner-review",
  "invite-only",
] as const;

export const pageBreadcrumbModeOptions = [
  "auto",
  "manual",
  "hidden",
] as const;

export const pageVisibilityAudienceOptions = [
  "public",
  "dealer",
  "owner-review",
  "invite-only",
] as const;

export const pageSectionTypeOptions = [
  "hero",
  "overview",
  "product-grid",
  "technology-proof",
  "materials-story",
  "gallery",
  "cta",
  "journal-downloads",
] as const;

export function normalizeSlugLikeValue(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeRouteSegment(value: unknown, fallback = "") {
  return normalizeSlugLikeValue(value, fallback);
}

export function normalizeCanonicalPath(value: unknown, fallbackPath: string) {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    return fallbackPath;
  }

  const normalized = raw.startsWith("/") ? raw : `/${raw}`;

  return normalized.replace(/\/+/g, "/");
}

export function validateSourceArtifactPath(value: unknown, label: string) {
  if (value == null || value === "") {
    return;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be a repository documentation path.`);
  }

  const normalized = value.trim();

  if (!normalized.startsWith("docs/")) {
    throw new Error(`${label} must point to a docs/ path inside the repository.`);
  }
}

export function createSourceArtifactFields(): Field[] {
  return [
    {
      name: "sourceOfTruthArtifact",
      type: "text",
      admin: {
        description:
          "Primary strategy/task artifact that defines this hierarchy record, for example docs/strategy/artifacts/....md",
      },
    },
    {
      name: "sourceArtifactReferences",
      type: "array",
      labels: {
        plural: "Source artifact references",
        singular: "Source artifact reference",
      },
      fields: [
        {
          name: "artifactPath",
          type: "text",
          required: true,
        },
        {
          name: "note",
          type: "text",
        },
      ],
    },
  ];
}

export async function findDocumentById(
  req: PayloadRequest,
  collection: "product-directions" | "product-categories" | "product-lines" | "products",
  id: number | string | null | undefined,
) {
  if (!id) {
    return null;
  }

  return req.payload.findByID({
    collection,
    id,
    depth: 0,
    overrideAccess: true,
  });
}
