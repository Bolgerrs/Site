import type { SiteLocale } from "@/config/i18n";
import type { CmsProductInquiryField } from "@/lib/cms/types";

export type LeadFormValue = string | string[] | boolean;

export type LeadSubmissionPayload = {
  productSlug?: unknown;
  locale?: unknown;
  values?: unknown;
  meta?: unknown;
};

export type LeadStatusHistoryEntry = {
  from: string | null;
  to: string;
  changedAt: string;
  changedBy: string;
  reason: string | null;
  note: string | null;
  source: "public-form-submit" | "admin-status-api";
};

export type LeadFieldSnapshot = {
  fieldKey: string;
  label: string;
  leadMappingKey: string;
  fieldType: CmsProductInquiryField["fieldType"];
  value: LeadFormValue;
};

export type LeadNotificationAttempt = {
  attemptedAt: string;
  deliveryMode: "outbox-only" | "webhook";
  error: string | null;
  eventPath: string;
  recipients: string[];
  responseStatus: number | null;
  safeTargetApplied: boolean;
  status: "outbox-recorded" | "delivered" | "failed";
};

export type StoredLead = {
  id: string;
  referenceCode: string;
  createdAt: string;
  updatedAt: string;
  leadType: string;
  status: string;
  priority: string;
  spamReviewState: string;
  sourceChannel: string;
  productDirection: string | null;
  productCategory: string | null;
  productLine: string | null;
  product: string;
  form: string;
  locale: SiteLocale;
  preferredLanguage: string | null;
  sourcePagePath: string;
  sourcePageTitle: string;
  contextSnapshot: Record<string, string>;
  individualOrOrganization: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  preferredContactMethod: string;
  company: string | null;
  country: string;
  city: string | null;
  requestType: string;
  message: string | null;
  budgetBand: string | null;
  timeline: string | null;
  qualificationSnapshot: Record<string, LeadFormValue>;
  submittedFieldSnapshot: LeadFieldSnapshot[];
  attachments: Array<Record<string, string>>;
  routingMode: string;
  routingSuggestion: string | null;
  routingRuleKey: string | null;
  assignedToUser: string | null;
  assignedTeam: string;
  partnerHandoffStatus: string;
  assignedPartnerLabel: string | null;
  ownerNotes: string;
  internalTags: string[];
  consentProfile: string;
  consentTextSnapshot: string;
  consentAcceptedAt: string;
  consentLocale: SiteLocale;
  marketingOptIn: boolean;
  dealerSharingConsent: boolean;
  privacyNoticeTargetSnapshot: string;
  consentVersion: string | null;
  lastStatusChangedAt: string;
  lastContactedAt: string | null;
  nextActionAt: string | null;
  latestActivitySummary: string;
  statusHistory?: LeadStatusHistoryEntry[];
  resolution: string;
  resolutionReason: string | null;
  sourceOfTruthArtifact: string;
  submissionFingerprint: string;
  notificationStatus: string;
  notificationDeliveryMode: string;
  notificationRecipients: string[];
  notificationTemplateKey: string | null;
  notificationEventPath: string | null;
  notificationLastAttemptAt: string | null;
  notificationError: string | null;
  notificationAttempts: LeadNotificationAttempt[];
  storagePath: string;
};
