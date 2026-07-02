import type { CollectionConfig, PayloadRequest } from "payload";

import {
  authenticatedAccess,
  leadWorkflowAccess,
  leadPiiAccess,
  ownerOrDeveloperAccess,
} from "../lib/payload/access.ts";
import { createFieldChangeAuditHook } from "../lib/payload/audit.ts";
import { createSourceArtifactFields, validateSourceArtifactPath } from "../lib/payload/catalog.ts";
import { defineCollection } from "../lib/payload/collections.ts";
import { createLocaleField } from "../lib/payload/fields.ts";

const leadStatusValues = [
  "new",
  "reviewed",
  "contacted",
  "qualified",
  "proposal_in_progress",
  "closed",
  "spam",
] as const;

const leadPriorityValues = ["low", "normal", "high", "vip", "urgent"] as const;
const leadSourceChannelValues = [
  "product-page",
  "direction-page",
  "dealer-page",
  "contact-page",
  "download-gate",
  "admin-manual",
  "api-import",
] as const;
const leadRoutingModeValues = [
  "hq-direct",
  "partner-candidate",
  "partner-assigned",
  "service-desk",
  "manual-review",
] as const;
const partnerHandoffStatusValues = [
  "not-applicable",
  "pending-review",
  "approved-to-share",
  "shared",
  "partner-accepted",
  "partner-declined",
] as const;
const leadResolutionValues = ["open", "won", "lost", "disqualified", "spam", "support-complete"] as const;

type LeadBeforeChangeArgs = {
  data?: Record<string, unknown> | null;
  operation: "create" | "update";
  originalDoc?: Record<string, unknown> | null;
  req: PayloadRequest;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value: unknown) {
  return value === true;
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeTagArray(value: unknown) {
  return asArray<unknown>(value)
    .map((entry) => {
      if (typeof entry === "string") {
        const tag = entry.trim();
        return tag ? { tag } : null;
      }

      if (entry && typeof entry === "object") {
        const tag = getText((entry as { tag?: unknown }).tag);
        return tag ? { ...(entry as Record<string, unknown>), tag } : null;
      }

      return null;
    })
    .filter(Boolean) as Array<{ tag: string }>;
}

function normalizeEmailArray(value: unknown) {
  return asArray<unknown>(value)
    .map((entry) => {
      if (typeof entry === "string") {
        const email = entry.trim().toLowerCase();
        return email ? { email } : null;
      }

      if (entry && typeof entry === "object") {
        const email = getText((entry as { email?: unknown }).email).toLowerCase();
        return email ? { ...(entry as Record<string, unknown>), email } : null;
      }

      return null;
    })
    .filter(Boolean) as Array<{ email: string }>;
}

function normalizeNotificationAttempts(value: unknown) {
  return asArray<Record<string, unknown>>(value)
    .map((entry) => {
      const attemptedAt = getText(entry.attemptedAt);
      const eventPath = getText(entry.eventPath);
      const status = getText(entry.status);
      const deliveryMode = getText(entry.deliveryMode);

      if (!attemptedAt || !eventPath || !status || !deliveryMode) {
        return null;
      }

      return {
        attemptedAt,
        deliveryMode,
        error: getText(entry.error) || null,
        eventPath,
        recipients: normalizeEmailArray(entry.recipients),
        responseStatus:
          typeof entry.responseStatus === "number" ? entry.responseStatus : null,
        safeTargetApplied: getBoolean(entry.safeTargetApplied),
        status,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

function normalizeKeyValueEntries(value: unknown, keyName: "key" | "fieldKey" = "key") {
  return asArray<Record<string, unknown>>(value)
    .map((entry) => {
      const key = getText(entry[keyName]);
      if (!key) {
        return null;
      }

      return {
        ...entry,
        [keyName]: key,
        valueText: getText(entry.valueText),
        valueBoolean: getBoolean(entry.valueBoolean),
        valueList: asArray<Record<string, unknown>>(entry.valueList)
          .map((item) => ({ value: getText(item.value) }))
          .filter((item) => item.value),
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

function normalizeContextSnapshot(value: unknown) {
  return asArray<Record<string, unknown>>(value)
    .map((entry) => {
      const key = getText(entry.key);
      const snapshotValue = getText(entry.value);

      if (!key) {
        return null;
      }

      return {
        ...entry,
        key,
        value: snapshotValue,
      };
    })
    .filter(Boolean) as Array<{ key: string; value: string }>;
}

function normalizeSubmittedFieldSnapshot(value: unknown) {
  return asArray<Record<string, unknown>>(value)
    .map((entry) => {
      const fieldKey = getText(entry.fieldKey);
      const label = getText(entry.label);
      const leadMappingKey = getText(entry.leadMappingKey) || fieldKey;

      if (!fieldKey || !label) {
        return null;
      }

      return {
        ...entry,
        fieldKey,
        fieldType: getText(entry.fieldType) || "text",
        label,
        leadMappingKey,
        valueText: getText(entry.valueText),
        valueBoolean: getBoolean(entry.valueBoolean),
        valueList: asArray<Record<string, unknown>>(entry.valueList)
          .map((item) => ({ value: getText(item.value) }))
          .filter((item) => item.value),
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

function normalizeStatusHistory(value: unknown) {
  return asArray<Record<string, unknown>>(value)
    .map((entry) => {
      const toStatus = getText(entry.toStatus);
      const changedAt = getText(entry.changedAt);
      if (!toStatus || !changedAt) {
        return null;
      }

      return {
        ...entry,
        changedAt,
        changedBy: getText(entry.changedBy),
        fromStatus: getText(entry.fromStatus) || null,
        note: getText(entry.note) || null,
        reason: getText(entry.reason) || null,
        source: getText(entry.source) || "public-form-submit",
        toStatus,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

function normalizeActivityTimeline(value: unknown) {
  return asArray<Record<string, unknown>>(value)
    .map((entry) => {
      const type = getText(entry.type) || "note";
      const at = getText(entry.at);
      const summary = getText(entry.summary);

      if (!at || !summary) {
        return null;
      }

      return {
        ...entry,
        actor: getText(entry.actor) || null,
        at,
        detail: getText(entry.detail) || null,
        summary,
        type,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

function normalizeAttachments(value: unknown) {
  return asArray<Record<string, unknown>>(value)
    .map((entry) => {
      const fileName = getText(entry.fileName);
      if (!fileName) {
        return null;
      }

      return {
        ...entry,
        fileName,
        mimeType: getText(entry.mimeType),
        sizeLabel: getText(entry.sizeLabel),
        storageRef: getText(entry.storageRef),
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

export const validateLead = async ({
  data,
  operation,
  originalDoc,
}: LeadBeforeChangeArgs) => {
  const currentData = {
    ...(operation === "update" ? (originalDoc as Record<string, unknown> | undefined) : {}),
    ...((data ?? {}) as Record<string, unknown>),
  };

  validateSourceArtifactPath(
    currentData.sourceOfTruthArtifact,
    "Lead validation failed: sourceOfTruthArtifact",
  );

  const referenceCode = getText(currentData.referenceCode);
  const createdAt = getText(currentData.createdAt) || new Date().toISOString();
  const status = leadStatusValues.includes(
    getText(currentData.status) as (typeof leadStatusValues)[number],
  )
    ? getText(currentData.status)
    : "new";
  const priority = leadPriorityValues.includes(
    getText(currentData.priority) as (typeof leadPriorityValues)[number],
  )
    ? getText(currentData.priority)
    : "normal";
  const sourceChannel = leadSourceChannelValues.includes(
    getText(currentData.sourceChannel) as (typeof leadSourceChannelValues)[number],
  )
    ? getText(currentData.sourceChannel)
    : "product-page";
  const routingMode = leadRoutingModeValues.includes(
    getText(currentData.routingMode) as (typeof leadRoutingModeValues)[number],
  )
    ? getText(currentData.routingMode)
    : "hq-direct";
  const partnerHandoffStatus = partnerHandoffStatusValues.includes(
    getText(currentData.partnerHandoffStatus) as (typeof partnerHandoffStatusValues)[number],
  )
    ? getText(currentData.partnerHandoffStatus)
    : "not-applicable";
  const resolution = leadResolutionValues.includes(
    getText(currentData.resolution) as (typeof leadResolutionValues)[number],
  )
    ? getText(currentData.resolution)
    : status === "spam"
      ? "spam"
      : "open";

  if (!referenceCode || !getText(currentData.locale) || !getText(currentData.product) || !getText(currentData.form)) {
    throw new Error(
      "Lead validation failed: referenceCode, locale, product and form are required.",
    );
  }

  if (!getText(currentData.country) || !getText(currentData.displayName)) {
    throw new Error("Lead validation failed: country and displayName are required.");
  }

  const submittedFieldSnapshot = normalizeSubmittedFieldSnapshot(currentData.submittedFieldSnapshot);
  const activityTimeline = normalizeActivityTimeline(currentData.activityTimeline);

  if (submittedFieldSnapshot.length === 0) {
    throw new Error(
      "Lead validation failed: submittedFieldSnapshot must contain at least one captured field.",
    );
  }

  if (activityTimeline.length === 0) {
    activityTimeline.push({
      actor: getText(currentData.assignedToUser) || "system-public-form",
      at: createdAt,
      detail: getText(currentData.message) || null,
      summary:
        getText(currentData.latestActivitySummary) || "Lead captured from the public inquiry route.",
      type: "captured",
    });
  }

  return {
    activityTimeline,
    ...currentData,
    attachments: normalizeAttachments(currentData.attachments),
    contextSnapshot: normalizeContextSnapshot(currentData.contextSnapshot),
    createdAt,
    internalTags: normalizeTagArray(currentData.internalTags),
    lastStatusChangedAt: getText(currentData.lastStatusChangedAt) || createdAt,
    latestActivitySummary:
      getText(currentData.latestActivitySummary) || "Lead captured from the public inquiry route.",
    notificationRecipients: normalizeEmailArray(currentData.notificationRecipients),
    notificationAttempts: normalizeNotificationAttempts(currentData.notificationAttempts),
    partnerHandoffStatus,
    priority,
    qualificationSnapshot: normalizeKeyValueEntries(currentData.qualificationSnapshot),
    resolution,
    resolutionReason: getText(currentData.resolutionReason) || null,
    routingMode,
    sourceChannel,
    status,
    statusHistory: normalizeStatusHistory(currentData.statusHistory),
    submittedFieldSnapshot,
    updatedAt: new Date().toISOString(),
  };
};

const piiReadAccess = {
  read: ((args: { req: PayloadRequest }) =>
    Boolean(leadPiiAccess({ req: args.req } as never))) as never,
};

export const Leads: CollectionConfig = defineCollection({
  slug: "leads",
  dbName: "leads",
  versions: false,
  admin: {
    defaultColumns: [
      "referenceCode",
      "status",
      "priority",
      "product",
      "locale",
      "assignedTeam",
      "createdAt",
    ],
    group: "Leads",
    useAsTitle: "referenceCode",
  },
  access: {
    create: leadWorkflowAccess,
    delete: ownerOrDeveloperAccess,
    read: authenticatedAccess,
    update: leadWorkflowAccess,
  },
  hooks: {
    afterChange: [
      createFieldChangeAuditHook({
        action: "lead-workflow-update",
        collection: "leads",
        detailBuilder: (diffs) =>
          diffs
            .map((entry) => `${entry.field}: ${entry.beforeValue ?? "empty"} -> ${entry.afterValue ?? "empty"}`)
            .join("\n"),
        eventGroup: "lead-workflow",
        fields: [
          "status",
          "priority",
          "assignedTeam",
          "assignedToUser",
          "nextActionAt",
          "resolution",
          "resolutionReason",
        ],
        labelFields: ["referenceCode", "displayName"],
        sensitive: true,
        summaryBuilder: (diffs) =>
          `Lead workflow updated (${diffs.map((entry) => entry.field).join(", ")}).`,
      }),
    ],
    beforeChange: [validateLead],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "referenceCode",
          type: "text",
          index: true,
          required: true,
          unique: true,
        },
        {
          name: "status",
          type: "select",
          defaultValue: "new",
          index: true,
          options: leadStatusValues.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "priority",
          type: "select",
          defaultValue: "normal",
          options: leadPriorityValues.map((value) => ({ label: value, value })),
          required: true,
        },
        createLocaleField(),
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "productDirection",
          type: "text",
        },
        {
          name: "productCategory",
          type: "text",
        },
        {
          name: "productLine",
          type: "text",
        },
        {
          name: "product",
          type: "text",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "form",
          type: "text",
          required: true,
        },
        {
          name: "sourceChannel",
          type: "select",
          defaultValue: "product-page",
          options: leadSourceChannelValues.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "sourcePagePath",
          type: "text",
        },
        {
          name: "sourcePageTitle",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "displayName",
          type: "text",
          access: piiReadAccess,
          required: true,
        },
        {
          name: "email",
          type: "email",
          access: piiReadAccess,
        },
        {
          name: "phone",
          type: "text",
          access: piiReadAccess,
        },
        {
          name: "company",
          type: "text",
          access: piiReadAccess,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "country",
          type: "text",
          access: piiReadAccess,
          required: true,
        },
        {
          name: "city",
          type: "text",
          access: piiReadAccess,
        },
        {
          name: "preferredLanguage",
          type: "text",
        },
        {
          name: "preferredContactMethod",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "leadType",
          type: "text",
          required: true,
        },
        {
          name: "requestType",
          type: "text",
          required: true,
        },
        {
          name: "individualOrOrganization",
          type: "text",
        },
        {
          name: "routingMode",
          type: "select",
          defaultValue: "hq-direct",
          options: leadRoutingModeValues.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "assignedTeam",
          type: "text",
        },
        {
          name: "assignedToUser",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "routingSuggestion",
          type: "text",
        },
        {
          name: "routingRuleKey",
          type: "text",
        },
        {
          name: "assignedPartnerLabel",
          type: "text",
        },
        {
          name: "partnerHandoffStatus",
          type: "select",
          defaultValue: "not-applicable",
          options: partnerHandoffStatusValues.map((value) => ({ label: value, value })),
          required: true,
        },
      ],
    },
    {
      name: "message",
      type: "textarea",
      access: piiReadAccess,
    },
    {
      type: "row",
      fields: [
        {
          name: "budgetBand",
          type: "text",
          access: piiReadAccess,
        },
        {
          name: "timeline",
          type: "text",
          access: piiReadAccess,
        },
        {
          name: "spamReviewState",
          type: "text",
        },
        {
          name: "consentLocale",
          type: "text",
          access: piiReadAccess,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "createdAt",
          type: "date",
          admin: {
            position: "sidebar",
          },
          required: true,
        },
        {
          name: "updatedAt",
          type: "date",
          admin: {
            position: "sidebar",
          },
          required: true,
        },
        {
          name: "lastStatusChangedAt",
          type: "date",
          admin: {
            position: "sidebar",
          },
        },
        {
          name: "lastContactedAt",
          type: "date",
          admin: {
            position: "sidebar",
          },
        },
        {
          name: "nextActionAt",
          type: "date",
          admin: {
            position: "sidebar",
          },
        },
      ],
    },
    {
      name: "latestActivitySummary",
      type: "textarea",
    },
    {
      name: "activityTimeline",
      type: "array",
      fields: [
        {
          name: "type",
          type: "text",
          required: true,
        },
        {
          name: "at",
          type: "date",
          required: true,
        },
        {
          name: "actor",
          type: "text",
        },
        {
          name: "summary",
          type: "text",
          required: true,
        },
        {
          name: "detail",
          type: "textarea",
        },
      ],
    },
    {
      name: "ownerNotes",
      type: "textarea",
    },
    {
      type: "row",
      fields: [
        {
          name: "consentProfile",
          type: "text",
        },
        {
          name: "consentAcceptedAt",
          type: "date",
          access: piiReadAccess,
        },
        {
          name: "marketingOptIn",
          type: "checkbox",
          access: piiReadAccess,
        },
        {
          name: "dealerSharingConsent",
          type: "checkbox",
          access: piiReadAccess,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "consentTextSnapshot",
          type: "textarea",
          access: piiReadAccess,
        },
        {
          name: "privacyNoticeTargetSnapshot",
          type: "text",
          access: piiReadAccess,
        },
        {
          name: "consentVersion",
          type: "text",
          access: piiReadAccess,
        },
        {
          name: "notificationStatus",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "notificationDeliveryMode",
          type: "text",
        },
        {
          name: "notificationTemplateKey",
          type: "text",
        },
        {
          name: "notificationEventPath",
          type: "text",
        },
        {
          name: "notificationLastAttemptAt",
          type: "date",
        },
      ],
    },
    {
      name: "notificationError",
      type: "textarea",
    },
    {
      name: "notificationAttempts",
      type: "array",
      fields: [
        {
          name: "attemptedAt",
          type: "date",
          required: true,
        },
        {
          name: "status",
          type: "text",
          required: true,
        },
        {
          name: "deliveryMode",
          type: "text",
          required: true,
        },
        {
          name: "safeTargetApplied",
          type: "checkbox",
        },
        {
          name: "responseStatus",
          type: "number",
        },
        {
          name: "eventPath",
          type: "text",
          required: true,
        },
        {
          name: "error",
          type: "textarea",
        },
        {
          name: "recipients",
          type: "array",
          fields: [
            {
              name: "email",
              type: "email",
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: "notificationRecipients",
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
      name: "contextSnapshot",
      type: "array",
      fields: [
        {
          name: "key",
          type: "text",
          required: true,
        },
        {
          name: "value",
          type: "text",
        },
      ],
    },
    {
      name: "qualificationSnapshot",
      type: "array",
      access: piiReadAccess,
      fields: [
        {
          name: "key",
          type: "text",
          required: true,
        },
        {
          name: "valueText",
          type: "textarea",
        },
        {
          name: "valueBoolean",
          type: "checkbox",
        },
        {
          name: "valueList",
          type: "array",
          fields: [
            {
              name: "value",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: "submittedFieldSnapshot",
      type: "array",
      access: piiReadAccess,
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
          required: true,
        },
        {
          name: "fieldType",
          type: "text",
          required: true,
        },
        {
          name: "valueText",
          type: "textarea",
        },
        {
          name: "valueBoolean",
          type: "checkbox",
        },
        {
          name: "valueList",
          type: "array",
          fields: [
            {
              name: "value",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: "statusHistory",
      type: "array",
      fields: [
        {
          name: "fromStatus",
          type: "text",
        },
        {
          name: "toStatus",
          type: "text",
          required: true,
        },
        {
          name: "changedAt",
          type: "date",
          required: true,
        },
        {
          name: "changedBy",
          type: "text",
        },
        {
          name: "reason",
          type: "textarea",
        },
        {
          name: "note",
          type: "textarea",
        },
        {
          name: "source",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "internalTags",
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
      name: "attachments",
      type: "array",
      fields: [
        {
          name: "fileName",
          type: "text",
          required: true,
        },
        {
          name: "mimeType",
          type: "text",
        },
        {
          name: "sizeLabel",
          type: "text",
        },
        {
          name: "storageRef",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "resolution",
          type: "select",
          defaultValue: "open",
          options: leadResolutionValues.map((value) => ({ label: value, value })),
          required: true,
        },
        {
          name: "resolutionReason",
          type: "text",
        },
        {
          name: "submissionFingerprint",
          type: "text",
        },
        {
          name: "sourceOfTruthArtifact",
          type: "text",
        },
      ],
    },
    ...createSourceArtifactFields().slice(1),
  ],
});
