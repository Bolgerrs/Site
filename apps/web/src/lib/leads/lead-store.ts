import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  StoredLead,
  LeadFieldSnapshot,
  LeadFormValue,
  LeadNotificationAttempt,
  LeadStatusHistoryEntry,
} from "@/lib/leads/lead-types";

const leadStoreRoot = join(process.cwd(), "..", "..", ".tmp", "lead-intake");

function getLeadStoreMode() {
  return process.env.MONTELAR_LEAD_STORE?.trim().toLowerCase() === "filesystem"
    ? "filesystem"
    : "payload";
}

function resolveLeadBridgePath() {
  const candidates = [
    join(process.cwd(), "apps", "admin", "src", "scripts", "lead-bridge.ts"),
    join(process.cwd(), "..", "admin", "src", "scripts", "lead-bridge.ts"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Montelar lead bridge script was not found.");
}

async function runLeadBridge(command: "create" | "update" | "load", payload: Record<string, unknown>) {
  const bridgePath = resolveLeadBridgePath();
  const { spawn } = await import("node:child_process");

  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(process.execPath, ["--experimental-strip-types", bridgePath, command], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Lead bridge exited with code ${code}.`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

function serializeLeadValue(value: LeadFormValue) {
  if (Array.isArray(value)) {
    return {
      valueBoolean: false,
      valueList: value.map((item) => ({ value: item })),
      valueText: "",
    };
  }

  if (typeof value === "boolean") {
    return {
      valueBoolean: value,
      valueList: [],
      valueText: "",
    };
  }

  return {
    valueBoolean: false,
    valueList: [],
    valueText: value,
  };
}

function deserializeLeadValue(record: Record<string, unknown>) {
  const valueList = Array.isArray(record.valueList)
    ? record.valueList
        .map((item) =>
          item && typeof item === "object" && typeof (item as { value?: unknown }).value === "string"
            ? (item as { value: string }).value
            : null,
        )
        .filter((item): item is string => Boolean(item))
    : [];

  if (valueList.length > 0) {
    return valueList;
  }

  if (record.valueBoolean === true) {
    return true;
  }

  return typeof record.valueText === "string" ? record.valueText : "";
}

function mapStoredLeadToPayloadData(lead: StoredLead) {
  return {
    assignedPartnerLabel: lead.assignedPartnerLabel,
    assignedTeam: lead.assignedTeam,
    assignedToUser: lead.assignedToUser,
    attachments: lead.attachments.map((attachment) => ({
      fileName: attachment.fileName ?? "",
      mimeType: attachment.mimeType ?? "",
      sizeLabel: attachment.sizeLabel ?? "",
      storageRef: attachment.storageRef ?? "",
    })),
    city: lead.city,
    company: lead.company,
    consentAcceptedAt: lead.consentAcceptedAt,
    consentLocale: lead.consentLocale,
    consentProfile: lead.consentProfile,
    consentTextSnapshot: lead.consentTextSnapshot,
    consentVersion: lead.consentVersion,
    contextSnapshot: Object.entries(lead.contextSnapshot).map(([key, value]) => ({
      key,
      value,
    })),
    country: lead.country,
    createdAt: lead.createdAt,
    dealerSharingConsent: lead.dealerSharingConsent,
    displayName: lead.displayName,
    email: lead.email,
    form: lead.form,
    individualOrOrganization: lead.individualOrOrganization,
    internalTags: lead.internalTags.map((tag) => ({ tag })),
    lastContactedAt: lead.lastContactedAt,
    lastStatusChangedAt: lead.lastStatusChangedAt,
    leadType: lead.leadType,
    latestActivitySummary: lead.latestActivitySummary,
    locale: lead.locale,
    marketingOptIn: lead.marketingOptIn,
    message: lead.message,
    nextActionAt: lead.nextActionAt,
    notificationDeliveryMode: lead.notificationDeliveryMode,
    notificationError: lead.notificationError,
    notificationEventPath: lead.notificationEventPath,
    notificationLastAttemptAt: lead.notificationLastAttemptAt,
    notificationRecipients: lead.notificationRecipients.map((email) => ({ email })),
    notificationStatus: lead.notificationStatus,
    notificationTemplateKey: lead.notificationTemplateKey,
    notificationAttempts: lead.notificationAttempts.map((attempt) => ({
      attemptedAt: attempt.attemptedAt,
      deliveryMode: attempt.deliveryMode,
      error: attempt.error,
      eventPath: attempt.eventPath,
      recipients: attempt.recipients.map((email) => ({ email })),
      responseStatus: attempt.responseStatus,
      safeTargetApplied: attempt.safeTargetApplied,
      status: attempt.status,
    })),
    ownerNotes: lead.ownerNotes,
    partnerHandoffStatus: lead.partnerHandoffStatus,
    phone: lead.phone,
    preferredContactMethod: lead.preferredContactMethod,
    preferredLanguage: lead.preferredLanguage,
    priority: lead.priority,
    privacyNoticeTargetSnapshot: lead.privacyNoticeTargetSnapshot,
    product: lead.product,
    productCategory: lead.productCategory,
    productDirection: lead.productDirection,
    productLine: lead.productLine,
    qualificationSnapshot: Object.entries(lead.qualificationSnapshot).map(([key, value]) => ({
      key,
      ...serializeLeadValue(value),
    })),
    referenceCode: lead.referenceCode,
    requestType: lead.requestType,
    resolution: lead.resolution,
    resolutionReason: lead.resolutionReason,
    routingMode: lead.routingMode,
    routingRuleKey: lead.routingRuleKey,
    routingSuggestion: lead.routingSuggestion,
    sourceChannel: lead.sourceChannel,
    sourceOfTruthArtifact: lead.sourceOfTruthArtifact,
    sourcePagePath: lead.sourcePagePath,
    sourcePageTitle: lead.sourcePageTitle,
    spamReviewState: lead.spamReviewState,
    status: lead.status,
    statusHistory: (lead.statusHistory ?? []).map((entry) => ({
      changedAt: entry.changedAt,
      changedBy: entry.changedBy,
      fromStatus: entry.from,
      note: entry.note,
      reason: entry.reason,
      source: entry.source,
      toStatus: entry.to,
    })),
    submittedFieldSnapshot: lead.submittedFieldSnapshot.map((field: LeadFieldSnapshot) => ({
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      label: field.label,
      leadMappingKey: field.leadMappingKey,
      ...serializeLeadValue(field.value),
    })),
    submissionFingerprint: lead.submissionFingerprint,
    timeline: lead.timeline,
    updatedAt: lead.updatedAt,
  };
}

function mapPayloadDocToStoredLead(doc: Record<string, unknown>): StoredLead {
  const qualificationEntries = Array.isArray(doc.qualificationSnapshot)
    ? (doc.qualificationSnapshot as Record<string, unknown>[])
    : [];
  const fieldEntries = Array.isArray(doc.submittedFieldSnapshot)
    ? (doc.submittedFieldSnapshot as Record<string, unknown>[])
    : [];
  const statusHistoryEntries = Array.isArray(doc.statusHistory)
    ? (doc.statusHistory as Record<string, unknown>[])
    : [];
  const submittedFieldSnapshot: LeadFieldSnapshot[] = [];
  const notificationAttempts: LeadNotificationAttempt[] = [];

  for (const entry of fieldEntries) {
    if (
      typeof entry.fieldKey !== "string" ||
      typeof entry.label !== "string" ||
      typeof entry.leadMappingKey !== "string" ||
      typeof entry.fieldType !== "string"
    ) {
      continue;
    }

    submittedFieldSnapshot.push({
      fieldKey: entry.fieldKey,
      fieldType: entry.fieldType as LeadFieldSnapshot["fieldType"],
      label: entry.label,
      leadMappingKey: entry.leadMappingKey,
      value: deserializeLeadValue(entry),
    });
  }

  for (const entry of Array.isArray(doc.notificationAttempts) ? doc.notificationAttempts : []) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const attemptedAt = typeof record.attemptedAt === "string" ? record.attemptedAt : "";
    const eventPath = typeof record.eventPath === "string" ? record.eventPath : "";
    const status = typeof record.status === "string" ? record.status : "";
    const deliveryMode = typeof record.deliveryMode === "string" ? record.deliveryMode : "";
    if (!attemptedAt || !eventPath || !status || !deliveryMode) {
      continue;
    }

    notificationAttempts.push({
      attemptedAt,
      deliveryMode: deliveryMode === "webhook" ? "webhook" : "outbox-only",
      error: typeof record.error === "string" ? record.error : null,
      eventPath,
      recipients: (Array.isArray(record.recipients) ? record.recipients : [])
        .map((item) =>
          item && typeof item === "object" && typeof (item as { email?: unknown }).email === "string"
            ? (item as { email: string }).email
            : null,
        )
        .filter((item): item is string => Boolean(item)),
      responseStatus: typeof record.responseStatus === "number" ? record.responseStatus : null,
      safeTargetApplied: record.safeTargetApplied === true,
      status:
        status === "delivered" || status === "failed" ? status : "outbox-recorded",
    });
  }

  const attachments: Array<Record<string, string>> = [];

  for (const entry of Array.isArray(doc.attachments) ? doc.attachments : []) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    attachments.push({
      fileName:
        typeof (entry as { fileName?: unknown }).fileName === "string"
          ? (entry as { fileName: string }).fileName
          : "",
      mimeType:
        typeof (entry as { mimeType?: unknown }).mimeType === "string"
          ? (entry as { mimeType: string }).mimeType
          : "",
      sizeLabel:
        typeof (entry as { sizeLabel?: unknown }).sizeLabel === "string"
          ? (entry as { sizeLabel: string }).sizeLabel
          : "",
      storageRef:
        typeof (entry as { storageRef?: unknown }).storageRef === "string"
          ? (entry as { storageRef: string }).storageRef
          : "",
    });
  }

  return {
    id: typeof doc.id === "string" ? doc.id : typeof doc.id === "number" ? String(doc.id) : "",
    referenceCode: typeof doc.referenceCode === "string" ? doc.referenceCode : "",
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : new Date().toISOString(),
    updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : new Date().toISOString(),
    leadType: typeof doc.leadType === "string" ? doc.leadType : "",
    status: typeof doc.status === "string" ? doc.status : "new",
    priority: typeof doc.priority === "string" ? doc.priority : "normal",
    spamReviewState: typeof doc.spamReviewState === "string" ? doc.spamReviewState : "clean",
    sourceChannel: typeof doc.sourceChannel === "string" ? doc.sourceChannel : "product-page",
    productDirection: typeof doc.productDirection === "string" ? doc.productDirection : null,
    productCategory: typeof doc.productCategory === "string" ? doc.productCategory : null,
    productLine: typeof doc.productLine === "string" ? doc.productLine : null,
    product: typeof doc.product === "string" ? doc.product : "",
    form: typeof doc.form === "string" ? doc.form : "",
    locale: (typeof doc.locale === "string" ? doc.locale : "en") as StoredLead["locale"],
    preferredLanguage:
      typeof doc.preferredLanguage === "string" ? doc.preferredLanguage : null,
    sourcePagePath: typeof doc.sourcePagePath === "string" ? doc.sourcePagePath : "",
    sourcePageTitle: typeof doc.sourcePageTitle === "string" ? doc.sourcePageTitle : "",
    contextSnapshot: Object.fromEntries(
      (Array.isArray(doc.contextSnapshot) ? doc.contextSnapshot : [])
        .map((entry) =>
          entry &&
          typeof entry === "object" &&
          typeof (entry as { key?: unknown }).key === "string"
            ? [
                (entry as { key: string }).key,
                typeof (entry as { value?: unknown }).value === "string"
                  ? (entry as { value: string }).value
                  : "",
              ]
            : null,
        )
        .filter((entry): entry is [string, string] => Array.isArray(entry)),
    ),
    individualOrOrganization:
      typeof doc.individualOrOrganization === "string" ? doc.individualOrOrganization : "individual",
    displayName: typeof doc.displayName === "string" ? doc.displayName : "",
    email: typeof doc.email === "string" ? doc.email : null,
    phone: typeof doc.phone === "string" ? doc.phone : null,
    preferredContactMethod:
      typeof doc.preferredContactMethod === "string" ? doc.preferredContactMethod : "email",
    company: typeof doc.company === "string" ? doc.company : null,
    country: typeof doc.country === "string" ? doc.country : "Unknown",
    city: typeof doc.city === "string" ? doc.city : null,
    requestType: typeof doc.requestType === "string" ? doc.requestType : "consultation",
    message: typeof doc.message === "string" ? doc.message : null,
    budgetBand: typeof doc.budgetBand === "string" ? doc.budgetBand : null,
    timeline: typeof doc.timeline === "string" ? doc.timeline : null,
    qualificationSnapshot: Object.fromEntries(
      qualificationEntries
        .map((entry) =>
          typeof entry.key === "string" ? [entry.key, deserializeLeadValue(entry)] : null,
        )
        .filter((entry): entry is [string, LeadFormValue] => Array.isArray(entry)),
    ),
    submittedFieldSnapshot,
    attachments,
    routingMode: typeof doc.routingMode === "string" ? doc.routingMode : "hq-direct",
    routingSuggestion: typeof doc.routingSuggestion === "string" ? doc.routingSuggestion : null,
    routingRuleKey: typeof doc.routingRuleKey === "string" ? doc.routingRuleKey : null,
    assignedToUser: typeof doc.assignedToUser === "string" ? doc.assignedToUser : null,
    assignedTeam: typeof doc.assignedTeam === "string" ? doc.assignedTeam : "",
    partnerHandoffStatus:
      typeof doc.partnerHandoffStatus === "string" ? doc.partnerHandoffStatus : "not-applicable",
    assignedPartnerLabel:
      typeof doc.assignedPartnerLabel === "string" ? doc.assignedPartnerLabel : null,
    ownerNotes: typeof doc.ownerNotes === "string" ? doc.ownerNotes : "",
    internalTags: (Array.isArray(doc.internalTags) ? doc.internalTags : [])
      .map((entry) =>
        entry && typeof entry === "object" && typeof (entry as { tag?: unknown }).tag === "string"
          ? (entry as { tag: string }).tag
          : null,
      )
      .filter((entry): entry is string => Boolean(entry)),
    consentProfile: typeof doc.consentProfile === "string" ? doc.consentProfile : "",
    consentTextSnapshot:
      typeof doc.consentTextSnapshot === "string" ? doc.consentTextSnapshot : "",
    consentAcceptedAt:
      typeof doc.consentAcceptedAt === "string" ? doc.consentAcceptedAt : new Date().toISOString(),
    consentLocale: (typeof doc.consentLocale === "string" ? doc.consentLocale : "en") as StoredLead["locale"],
    marketingOptIn: doc.marketingOptIn === true,
    dealerSharingConsent: doc.dealerSharingConsent === true,
    privacyNoticeTargetSnapshot:
      typeof doc.privacyNoticeTargetSnapshot === "string"
        ? doc.privacyNoticeTargetSnapshot
        : "/privacy",
    consentVersion: typeof doc.consentVersion === "string" ? doc.consentVersion : null,
    lastStatusChangedAt:
      typeof doc.lastStatusChangedAt === "string" ? doc.lastStatusChangedAt : new Date().toISOString(),
    lastContactedAt: typeof doc.lastContactedAt === "string" ? doc.lastContactedAt : null,
    nextActionAt: typeof doc.nextActionAt === "string" ? doc.nextActionAt : null,
    latestActivitySummary:
      typeof doc.latestActivitySummary === "string" ? doc.latestActivitySummary : "",
    statusHistory: statusHistoryEntries
      .map((entry) => {
        if (typeof entry.toStatus !== "string" || typeof entry.changedAt !== "string") {
          return null;
        }

        return {
          changedAt: entry.changedAt,
          changedBy: typeof entry.changedBy === "string" ? entry.changedBy : "",
          from: typeof entry.fromStatus === "string" ? entry.fromStatus : null,
          note: typeof entry.note === "string" ? entry.note : null,
          reason: typeof entry.reason === "string" ? entry.reason : null,
          source:
            entry.source === "admin-status-api" ? "admin-status-api" : "public-form-submit",
          to: entry.toStatus,
        } satisfies LeadStatusHistoryEntry;
      })
      .filter((entry): entry is LeadStatusHistoryEntry => entry !== null),
    resolution: typeof doc.resolution === "string" ? doc.resolution : "open",
    resolutionReason: typeof doc.resolutionReason === "string" ? doc.resolutionReason : null,
    sourceOfTruthArtifact:
      typeof doc.sourceOfTruthArtifact === "string"
        ? doc.sourceOfTruthArtifact
        : "docs/strategy/artifacts/MNT-CMS-010-lead-schema.md",
    submissionFingerprint:
      typeof doc.submissionFingerprint === "string" ? doc.submissionFingerprint : "",
    notificationStatus:
      typeof doc.notificationStatus === "string" ? doc.notificationStatus : "pending",
    notificationDeliveryMode:
      typeof doc.notificationDeliveryMode === "string" ? doc.notificationDeliveryMode : "not-run",
    notificationRecipients: (Array.isArray(doc.notificationRecipients) ? doc.notificationRecipients : [])
      .map((entry) =>
        entry &&
        typeof entry === "object" &&
        typeof (entry as { email?: unknown }).email === "string"
          ? (entry as { email: string }).email
          : null,
      )
      .filter((entry): entry is string => Boolean(entry)),
    notificationTemplateKey:
      typeof doc.notificationTemplateKey === "string" ? doc.notificationTemplateKey : null,
    notificationAttempts,
    notificationEventPath:
      typeof doc.notificationEventPath === "string" ? doc.notificationEventPath : null,
    notificationLastAttemptAt:
      typeof doc.notificationLastAttemptAt === "string" ? doc.notificationLastAttemptAt : null,
    notificationError:
      typeof doc.notificationError === "string" ? doc.notificationError : null,
    storagePath: `payload:${typeof doc.id === "string" || typeof doc.id === "number" ? String(doc.id) : ""}`,
  };
}

async function persistLeadToFilesystem(lead: StoredLead) {
  const dayToken = lead.createdAt.slice(0, 10).replace(/-/g, "");
  const dayDirectory = join(leadStoreRoot, dayToken);
  const filePath = join(dayDirectory, `${lead.referenceCode}.json`);

  await mkdir(dayDirectory, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(lead, null, 2)}\n`, "utf8");
  await appendFile(
    join(leadStoreRoot, "submissions.jsonl"),
    `${JSON.stringify({
      referenceCode: lead.referenceCode,
      createdAt: lead.createdAt,
      status: lead.status,
      product: lead.product,
      locale: lead.locale,
      path: filePath,
    })}\n`,
    "utf8",
  );

  return filePath;
}

function getLeadFilesystemPath(referenceCode: string) {
  const [, dayToken] = referenceCode.split("-");
  if (!dayToken || !/^\d{8}$/.test(dayToken)) {
    return null;
  }

  return join(leadStoreRoot, dayToken, `${referenceCode}.json`);
}

export async function createLeadRecord(lead: StoredLead) {
  if (getLeadStoreMode() === "filesystem") {
    return persistLeadToFilesystem(lead);
  }

  const created = await runLeadBridge("create", {
    data: mapStoredLeadToPayloadData(lead),
  });

  return `payload:${typeof created.id === "string" || typeof created.id === "number" ? String(created.id) : ""}`;
}

export async function updateLeadRecord(lead: StoredLead) {
  if (getLeadStoreMode() === "filesystem") {
    if (!lead.storagePath) {
      return;
    }

    await writeFile(lead.storagePath, `${JSON.stringify(lead, null, 2)}\n`, "utf8");
    return;
  }

  const storageId = lead.storagePath.startsWith("payload:")
    ? lead.storagePath.slice("payload:".length)
    : null;

  if (!storageId) {
    throw new Error("Lead storagePath is missing Payload identity.");
  }

  await runLeadBridge("update", {
    data: mapStoredLeadToPayloadData(lead),
    id: storageId,
  });
}

export async function loadLeadRecord(referenceCode: string) {
  if (getLeadStoreMode() === "filesystem") {
    const filePath = getLeadFilesystemPath(referenceCode);
    if (!filePath) {
      return null;
    }

    try {
      const content = await readFile(filePath, "utf8");
      const lead = JSON.parse(content) as StoredLead;
      lead.storagePath = filePath;
      return lead;
    } catch {
      return null;
    }
  }

  const result = await runLeadBridge("load", {
    referenceCode,
  });

  const doc = result.doc;
  return doc && typeof doc === "object" ? mapPayloadDocToStoredLead(doc as Record<string, unknown>) : null;
}

export async function appendLeadStatusLedger(
  lead: StoredLead,
  entry: LeadStatusHistoryEntry,
) {
  if (getLeadStoreMode() !== "filesystem") {
    return;
  }

  await appendFile(
    join(leadStoreRoot, "status-history.jsonl"),
    `${JSON.stringify({
      referenceCode: lead.referenceCode,
      changedAt: entry.changedAt,
      from: entry.from,
      to: entry.to,
      changedBy: entry.changedBy,
      reason: entry.reason,
      path: lead.storagePath,
    })}\n`,
    "utf8",
  );
}
