import { createHash, randomUUID } from "node:crypto";
import { isSiteLocale, type SiteLocale } from "@/config/i18n";
import { getCmsClient } from "@/lib/cms/client";
import type {
  CmsProduct,
  CmsProductInquiryField,
  CmsProductInquiryForm,
} from "@/lib/cms/types";
import { validateProductInquiryForm } from "@/lib/forms/product-inquiry-validation";
import { dispatchLeadNotification } from "@/lib/leads/lead-notifications";
import { resolveLeadRouting } from "@/lib/leads/lead-routing-core";
import { createLeadRecord, updateLeadRecord } from "@/lib/leads/lead-store";
import {
  evaluateLeadSubmissionGuardrails,
  recordAcceptedLeadSubmission,
} from "@/lib/leads/lead-submission-guardrails";
import type {
  LeadFieldSnapshot,
  LeadFormValue,
  LeadSubmissionPayload,
  StoredLead,
} from "@/lib/leads/lead-types";

type LeadSubmissionValues = Record<string, LeadFormValue>;

type LeadSubmissionMeta = {
  honeypot: string | null;
  startedAt: number | null;
};

export type LeadRequestMetadata = {
  clientIp: string | null;
  userAgent: string | null;
  origin: string | null;
  referer: string | null;
};


export type LeadSubmissionResult =
  | {
      ok: true;
      status: 201;
      lead: {
        referenceCode: string;
        status: string;
      };
    }
  | {
      ok: false;
      status: 400 | 404 | 409 | 429 | 500;
      error: string;
      fieldErrors?: Record<string, string>;
    };

function isLeadSubmissionValues(value: unknown): value is LeadSubmissionValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) =>
      typeof entry === "string" ||
      typeof entry === "boolean" ||
      (Array.isArray(entry) && entry.every((item) => typeof item === "string")),
  );
}

function isLeadSubmissionMeta(value: unknown): value is LeadSubmissionMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const honeypotValid =
    typeof candidate.honeypot === "string" ||
    typeof candidate.honeypot === "undefined" ||
    candidate.honeypot === null;
  const startedAtValid =
    typeof candidate.startedAt === "number" ||
    typeof candidate.startedAt === "undefined" ||
    candidate.startedAt === null;

  return honeypotValid && startedAtValid;
}

function toFormData(values: LeadSubmissionValues) {
  const formData = new FormData();

  for (const [fieldKey, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(fieldKey, item);
      }
      continue;
    }

    if (typeof value === "boolean") {
      if (value) {
        formData.append(fieldKey, "true");
      }
      continue;
    }

    formData.append(fieldKey, value);
  }

  return formData;
}

function normalizeFieldValue(field: CmsProductInquiryField, formData: FormData): LeadFormValue {
  if (field.fieldType === "checkbox" || field.fieldType === "consent") {
    return formData.has(field.fieldKey);
  }

  if (field.fieldType === "multi-select") {
    return formData
      .getAll(field.fieldKey)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  const value = formData.get(field.fieldKey);
  return typeof value === "string" ? value.trim() : "";
}

function getString(values: LeadSubmissionValues, fieldKey: string) {
  const value = values[fieldKey];
  return typeof value === "string" && value.trim().length ? value.trim() : null;
}

function getBoolean(values: LeadSubmissionValues, fieldKey: string) {
  return values[fieldKey] === true;
}

function getRequestType(form: CmsProductInquiryForm, values: LeadSubmissionValues) {
  return (
    getString(values, "inquiryType") ??
    getString(values, "systemRole") ??
    getString(values, "projectStage") ??
    (form.formMode.includes("demo") || form.formMode.includes("audition")
      ? "demo"
      : "consultation")
  );
}

function getLeadType(product: CmsProduct, form: CmsProductInquiryForm) {
  if (product.directionSlug === "vision-max") {
    return "private_cinema_planning";
  }

  if (product.directionSlug === "exhibition-displays") {
    return "exhibition_installation";
  }

  if (product.directionSlug === "invisible-display") {
    return "site_survey";
  }

  if (
    product.directionSlug === "hologram" ||
    product.directionSlug === "pictorial-art-display"
  ) {
    return "demo_content_review";
  }

  return form.formMode.includes("audition") || form.formMode.includes("demo")
    ? "private_listening"
    : "system_architecture";
}

function getAssignedTeam(product: CmsProduct) {
  if (product.directionSlug === "hi-end-audio") {
    return "audio";
  }

  if (product.directionSlug === "exhibition-displays") {
    return "exhibition";
  }

  return "vision";
}

function getPriority(product: CmsProduct, form: CmsProductInquiryForm) {
  if (product.slug === "vision-max-lux") {
    return "vip";
  }

  if (form.formMode === "senior-project-consultation") {
    return "high";
  }

  return "normal";
}

function getRoutingMode(values: LeadSubmissionValues) {
  const dealerPreference = getString(values, "dealerPreference");
  const dealerStatus = getString(values, "dealerStatus");

  if (dealerPreference === "local-dealer" || dealerStatus === "dealer") {
    return "partner-candidate";
  }

  return "hq-direct";
}

function getPartnerHandoffStatus(routingMode: string) {
  return routingMode === "partner-candidate" ? "pending-review" : "not-applicable";
}

function buildReferenceCode(now: Date) {
  const dateToken = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `LD-${dateToken}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function buildSourcePagePath(product: CmsProduct, locale: SiteLocale) {
  return `/${locale}${product.inquiryRoutePath}`;
}

function buildFieldSnapshots(fields: CmsProductInquiryField[], formData: FormData) {
  return fields
    .filter(
      (field) =>
        field.fieldType !== "hidden-context" && field.fieldType !== "file-placeholder",
    )
    .map<LeadFieldSnapshot>((field) => ({
      fieldKey: field.fieldKey,
      label: field.label,
      leadMappingKey: field.leadMappingKey ?? field.fieldKey,
      fieldType: field.fieldType,
      value: normalizeFieldValue(field, formData),
    }))
    .filter((field) => {
      if (Array.isArray(field.value)) {
        return field.value.length > 0;
      }

      if (typeof field.value === "boolean") {
        return field.value;
      }

      return field.value.length > 0;
    });
}

function buildQualificationSnapshot(submittedFieldSnapshot: LeadFieldSnapshot[]) {
  const reservedKeys = new Set([
    "fullName",
    "email",
    "phone",
    "country",
    "city",
    "preferredLanguage",
    "preferredContactMethod",
    "company",
    "companyOrOffice",
    "organization",
    "consent",
    "marketingOptIn",
    "dealerSharingConsent",
  ]);

  return Object.fromEntries(
    submittedFieldSnapshot
      .filter((field) => !reservedKeys.has(field.fieldKey))
      .map((field) => [field.leadMappingKey, field.value]),
  );
}

async function getSubmissionContext(productSlug: string, locale: SiteLocale) {
  const cmsClient = getCmsClient();
  const [product, form] = await Promise.all([
    cmsClient.getProductBySlug(productSlug, locale),
    cmsClient.getProductInquiryFormOpsByProductSlug(productSlug, locale),
  ]);

  if (!product || !form) {
    return null;
  }

  return { product, form };
}

export async function submitProductLead(
  payload: LeadSubmissionPayload,
  requestMetadata: LeadRequestMetadata,
): Promise<LeadSubmissionResult> {
  const locale =
    typeof payload.locale === "string" && isSiteLocale(payload.locale)
      ? payload.locale
      : null;

  if (typeof payload.productSlug !== "string" || !locale) {
    return {
      ok: false,
      status: 400,
      error: "Invalid lead submission payload.",
    };
  }

  if (!isLeadSubmissionValues(payload.values)) {
    return {
      ok: false,
      status: 400,
      error: "Lead submission values are malformed.",
    };
  }

  if (payload.meta && !isLeadSubmissionMeta(payload.meta)) {
    return {
      ok: false,
      status: 400,
      error: "Lead submission metadata is malformed.",
    };
  }

  const submissionMeta = isLeadSubmissionMeta(payload.meta) ? payload.meta : null;

  const context = await getSubmissionContext(payload.productSlug, locale);

  if (!context) {
    return {
      ok: false,
      status: 404,
      error: "The requested product inquiry form could not be resolved.",
    };
  }

  const { product, form } = context;

  if (form.status !== "published") {
    return {
      ok: false,
      status: 409,
      error: "The product inquiry form is not currently published.",
    };
  }

  const cmsClient = getCmsClient();
  const direction = await cmsClient.getDirectionBySlug(product.directionSlug, locale);
  const formData = toFormData(payload.values);
  const validation = validateProductInquiryForm(form.fields, formData, locale);

  if (!validation.isValid) {
    return {
      ok: false,
      status: 400,
      error: "The submitted request is missing required fields.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const submittedFieldSnapshot = buildFieldSnapshots(form.fields, formData);
  const submissionFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        productSlug: product.slug,
        email: getString(payload.values, "email"),
        phone: getString(payload.values, "phone"),
        submittedFieldSnapshot,
      }),
    )
    .digest("hex");
  const provisionalRoutingMode = getRoutingMode(payload.values);
  const now = new Date();
  const timestamp = now.toISOString();
  const guardrailDecision = await evaluateLeadSubmissionGuardrails({
    clientIp: requestMetadata.clientIp,
    userAgent: requestMetadata.userAgent,
    productSlug: product.slug,
    locale,
    submissionFingerprint,
    honeypot: submissionMeta?.honeypot ?? null,
    startedAt: submissionMeta?.startedAt ?? null,
    now,
  });

  if (!guardrailDecision.ok) {
    return {
      ok: false,
      status: guardrailDecision.status,
      error: guardrailDecision.error,
    };
  }

  const referenceCode = buildReferenceCode(now);
  const sourcePagePath = buildSourcePagePath(product, locale);
  const routingDecision = resolveLeadRouting({
    country: getString(payload.values, "country") ?? "Unknown",
    fallbackAssignedTeam: getAssignedTeam(product),
    fallbackNotificationRecipients: form.notificationEmails,
    leadType: getLeadType(product, form),
    locale,
    productDirection: direction?.slug ?? product.directionSlug,
    requestType: getRequestType(form, payload.values),
  });
  const routingMode =
    provisionalRoutingMode === "partner-candidate" ? provisionalRoutingMode : routingDecision.routingMode;
  const lead: StoredLead = {
    id: randomUUID(),
    referenceCode,
    createdAt: timestamp,
    updatedAt: timestamp,
    leadType: getLeadType(product, form),
    status: "new",
    priority: getPriority(product, form),
    spamReviewState: "clean",
    sourceChannel: "product-page",
    productDirection: direction?.slug ?? product.directionSlug,
    productCategory: product.categorySlug ?? null,
    productLine: product.lineSlug ?? null,
    product: product.slug,
    form: form.slug,
    locale,
    preferredLanguage: getString(payload.values, "preferredLanguage"),
    sourcePagePath,
    sourcePageTitle: form.title || `Request ${product.name}`,
    contextSnapshot: {
      directionSlug: product.directionSlug,
      formSlug: form.slug,
      locale,
      productSlug: product.slug,
      origin: requestMetadata.origin ?? "",
      referer: requestMetadata.referer ?? "",
      sourcePagePath,
    },
    individualOrOrganization:
      getString(payload.values, "dealerStatus") === "dealer" ? "dealer" : "individual",
    displayName: getString(payload.values, "fullName") ?? product.name,
    email: getString(payload.values, "email"),
    phone: getString(payload.values, "phone"),
    preferredContactMethod:
      getString(payload.values, "preferredContactMethod") ??
      (getString(payload.values, "phone") ? "phone" : "email"),
    company:
      getString(payload.values, "company") ??
      getString(payload.values, "companyOrOffice") ??
      getString(payload.values, "organization"),
    country: getString(payload.values, "country") ?? "Unknown",
    city: getString(payload.values, "city"),
    requestType: getRequestType(form, payload.values),
    message:
      getString(payload.values, "projectBrief") ??
      getString(payload.values, "systemGoal") ??
      getString(payload.values, "currentSystem"),
    budgetBand: getString(payload.values, "budgetBand"),
    timeline: getString(payload.values, "timeline"),
    qualificationSnapshot: buildQualificationSnapshot(submittedFieldSnapshot),
    submittedFieldSnapshot,
    attachments: [],
    routingMode,
    routingSuggestion: routingDecision.routingSuggestion,
    routingRuleKey: routingDecision.routingRuleKey,
    assignedToUser: routingDecision.assignedToUser,
    assignedTeam: routingDecision.assignedTeam,
    partnerHandoffStatus:
      provisionalRoutingMode === "partner-candidate"
        ? getPartnerHandoffStatus(provisionalRoutingMode)
        : routingDecision.partnerHandoffStatus,
    assignedPartnerLabel: null,
    ownerNotes: "Created by product inquiry API.",
    internalTags: [
      product.directionSlug,
      form.formMode,
      ...(routingDecision.safeTargetApplied ? ["safe-target"] : []),
    ],
    consentProfile: form.consentProfile,
    consentTextSnapshot: form.consentText,
    consentAcceptedAt: timestamp,
    consentLocale: locale,
    marketingOptIn: getBoolean(payload.values, "marketingOptIn"),
    dealerSharingConsent: getBoolean(payload.values, "dealerSharingConsent"),
    privacyNoticeTargetSnapshot: "/privacy",
    consentVersion: null,
    lastStatusChangedAt: timestamp,
    lastContactedAt: null,
    nextActionAt: null,
    latestActivitySummary: "Lead captured from the public product inquiry route.",
    statusHistory: [
      {
        from: null,
        to: "new",
        changedAt: timestamp,
        changedBy: "system-public-form",
        reason: "Lead created from the public inquiry flow.",
        note: null,
        source: "public-form-submit",
      },
    ],
    resolution: "open",
    resolutionReason: null,
    sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-010-lead-schema.md",
    submissionFingerprint,
    notificationStatus: "pending",
    notificationDeliveryMode: "not-run",
    notificationRecipients: routingDecision.notificationRecipients,
    notificationTemplateKey: form.notificationTemplateKey ?? null,
    notificationEventPath: null,
    notificationLastAttemptAt: null,
    notificationError: null,
    notificationAttempts: [],
    storagePath: "",
  };

  lead.storagePath = await createLeadRecord(lead);
  await recordAcceptedLeadSubmission({
    clientKey: guardrailDecision.clientKey,
    createdAt: timestamp,
    productSlug: product.slug,
    locale,
    submissionFingerprint,
    referenceCode,
  });
  const notificationResult = await dispatchLeadNotification(lead, form);
  lead.notificationStatus = notificationResult.status;
  lead.notificationDeliveryMode = notificationResult.deliveryMode;
  lead.notificationRecipients = notificationResult.recipients;
  lead.notificationTemplateKey = notificationResult.templateKey;
  lead.notificationEventPath = notificationResult.eventPath;
  lead.notificationLastAttemptAt = notificationResult.attemptedAt;
  lead.notificationError = notificationResult.error;
  lead.notificationAttempts = [
    ...lead.notificationAttempts,
    {
      attemptedAt: notificationResult.attemptedAt,
      deliveryMode: notificationResult.deliveryMode,
      error: notificationResult.error,
      eventPath: notificationResult.eventPath,
      recipients: notificationResult.recipients,
      responseStatus: notificationResult.responseStatus,
      safeTargetApplied: routingDecision.safeTargetApplied,
      status: notificationResult.status,
    },
  ];
  await updateLeadRecord(lead);

  return {
    ok: true,
    status: 201,
    lead: {
      referenceCode,
      status: lead.status,
    },
  };
}
