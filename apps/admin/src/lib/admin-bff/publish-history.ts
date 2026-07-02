import type { Payload, PayloadRequest } from "payload";

import type { Issue, PublishPlan, PublishPlanStep } from "./dtos.ts";
import { getAdminUser } from "../payload/access.ts";
import { createAuditEvent } from "../payload/audit.ts";
import { hasAdminRole, type AdminRole } from "../payload/roles.ts";

const publishRoles = ["owner", "admin", "content-editor", "developer"] as const satisfies readonly AdminRole[];
const restoreRoles = ["owner", "admin", "developer"] as const satisfies readonly AdminRole[];
const targetTypes = ["page", "product", "settings"] as const;

type GenericRecord = Record<string, unknown>;
type TargetType = (typeof targetTypes)[number];
type PublishHistoryAction =
  | "history.compare"
  | "history.list"
  | "history.restore"
  | "publish.commit"
  | "publish.plan";

type CollectionSlug = "pages" | "products" | "site-settings";

type PublishTarget = {
  collection: CollectionSlug;
  id: number | string;
  label: string;
  routePath: string;
  status: string;
  targetType: TargetType;
};

export type PublishHistoryCommandInput = {
  action: PublishHistoryAction;
  payload?: Record<string, unknown>;
};

export type PublishHistoryVersionSummary = {
  actorLabel: string;
  changedAt: string;
  diff: PublishHistoryDiffEntry[];
  id: string;
  label: string;
  status: string;
};

export type PublishHistoryDiffEntry = {
  afterValue: string | null;
  beforeValue: string | null;
  field: string;
};

export type PublishHistorySnapshot = {
  auditTrail: Array<{
    action: string;
    actorLabel: string;
    happenedAt: string;
    id: string;
    summary: string;
  }>;
  compare?: {
    againstVersionId: string;
    diff: PublishHistoryDiffEntry[];
    versionId: string;
  };
  generatedAt: string;
  plan: PublishPlan;
  revalidation: {
    mode: "queued-noop";
    paths: string[];
    reason: string;
  };
  selectedTarget: PublishTarget | null;
  successMessage?: string;
  targets: PublishTarget[];
  versions: PublishHistoryVersionSummary[];
};

function getText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function getRecordId(value: unknown) {
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

function requireTargetType(value: unknown): TargetType {
  if (targetTypes.includes(value as TargetType)) {
    return value as TargetType;
  }

  throw createCommandError("invalid-input", "targetType must be page, product or settings.");
}

function requireId(value: unknown, label: string) {
  const id = getRecordId(value);
  if (id == null || String(id).trim() === "") {
    throw createCommandError("invalid-input", `${label} is required.`);
  }

  return id;
}

function requireString(value: unknown, label: string) {
  const text = getText(value);
  if (!text) {
    throw createCommandError("invalid-input", `${label} is required.`);
  }

  return text;
}

function getCollection(targetType: TargetType): CollectionSlug {
  switch (targetType) {
    case "page":
      return "pages";
    case "product":
      return "products";
    case "settings":
      return "site-settings";
  }
}

function getTargetType(collection: string): TargetType {
  switch (collection) {
    case "pages":
      return "page";
    case "products":
      return "product";
    case "site-settings":
      return "settings";
    default:
      throw createCommandError("invalid-input", "Unsupported publish target collection.");
  }
}

function createCommandError(code: "forbidden" | "invalid-input" | "unauthorized", message?: string) {
  return new Error(message ?? code);
}

function ensureRole(req: PayloadRequest, roles: readonly AdminRole[]) {
  const user = getAdminUser(req.user);

  if (!user?.role) {
    throw createCommandError("unauthorized");
  }

  if (!hasAdminRole(user, roles)) {
    throw createCommandError("forbidden");
  }

  return user;
}

function getLabel(targetType: TargetType, record: GenericRecord) {
  if (targetType === "product") {
    return getText(record.name) || getText(record.internalCode) || String(record.id ?? "Product");
  }

  if (targetType === "settings") {
    return getText(record.brandName) || getText(record.internalCode) || String(record.id ?? "Settings");
  }

  return getText(record.title) || getText(record.navigationLabel) || getText(record.slug) || String(record.id ?? "Page");
}

function getRoutePath(targetType: TargetType, record: GenericRecord) {
  if (targetType === "settings") {
    return "/";
  }

  return getText(record.routePath) || getText(record.canonicalPath) || "/";
}

function mapTarget(targetType: TargetType, record: GenericRecord): PublishTarget {
  const id = requireId(record.id, "target id");
  return {
    collection: getCollection(targetType),
    id,
    label: getLabel(targetType, record),
    routePath: getRoutePath(targetType, record),
    status: getText(record.status, "draft"),
    targetType,
  };
}

async function findTargets(payload: Payload, input: { targetId?: number | string | null; targetType?: TargetType | null }) {
  const wantedTypes = input.targetType ? [input.targetType] : [...targetTypes];
  const results: PublishTarget[] = [];

  for (const targetType of wantedTypes) {
    const collection = getCollection(targetType);
    const docs = await payload.find({
      collection,
      depth: 0,
      limit: input.targetId ? 1 : 25,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
      ...(input.targetId
        ? {
            where: {
              id: {
                equals: input.targetId,
              },
            },
          }
        : {}),
    });

    for (const doc of docs.docs as unknown as GenericRecord[]) {
      results.push(mapTarget(targetType, doc));
    }
  }

  return results;
}

async function loadTargetRecord(payload: Payload, target: Pick<PublishTarget, "collection" | "id" | "targetType">) {
  const record = (await payload.findByID({
    collection: target.collection,
    depth: 1,
    id: target.id,
    overrideAccess: true,
  })) as unknown as GenericRecord | null;

  if (!record) {
    throw createCommandError("invalid-input", "Publish target was not found.");
  }

  return record;
}

function issue(input: {
  description: string;
  id: string;
  severity?: Issue["severity"];
  surfaceId?: string;
  title: string;
}): Issue {
  return {
    description: input.description,
    id: input.id,
    severity: input.severity ?? "blocker",
    status: "open",
    title: input.title,
    ...(input.surfaceId ? { surfaceId: input.surfaceId } : {}),
  };
}

async function findSeoIssues(payload: Payload, target: PublishTarget, record: GenericRecord) {
  if (target.targetType === "settings") {
    return [];
  }

  const ownerType = target.targetType === "page" ? "page" : "product";
  const ownerRelationField = target.targetType === "page" ? "ownerPage" : "ownerProduct";
  const ownerKey = `${ownerType}:${String(target.id)}`;
  const seo = await payload.find({
    collection: "seo-entries",
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
    where: {
      or: [
        {
          ownerKey: {
            equals: ownerKey,
          },
        },
        {
          [ownerRelationField]: {
            equals: target.id,
          },
        },
        {
          routePath: {
            equals: getRoutePath(target.targetType, record),
          },
        },
      ],
    },
  });
  const ready = (seo.docs as unknown as GenericRecord[]).some(
    (entry) =>
      getText(entry.status) === "published" &&
      getText(entry.publicationReadiness) === "production-ready" &&
      getText(entry.approvalStatus) === "approved",
  );

  return ready
    ? []
    : [
        issue({
          description: `${target.label} needs one published, approved and production-ready SEO entry before release.`,
          id: `${target.collection}-${target.id}-seo`,
          surfaceId: `${target.collection}:${target.id}`,
          title: "SEO is not release-ready",
        }),
      ];
}

async function findTranslationIssues(payload: Payload, target: PublishTarget) {
  if (target.targetType === "settings") {
    return [];
  }

  const translations = await payload.find({
    collection: "translations",
    depth: 0,
    limit: 50,
    overrideAccess: true,
    pagination: false,
    where: {
      ownerCollection: {
        equals: target.collection,
      },
      ownerRecordKey: {
        equals: String(target.id),
      },
    },
  });
  const docs = translations.docs as unknown as GenericRecord[];
  const blocked = docs.filter(
    (entry) =>
      getText(entry.status) === "blocked" ||
      getText(entry.publishReadiness) === "blocked" ||
      getText(entry.staleSourceState) === "source-changed",
  );

  return blocked.map((entry, index) =>
    issue({
      description:
        getText(entry.staleReason) ||
        getText(entry.publishBlockedReasons) ||
        `${target.label} has a blocked or stale translation item.`,
      id: `${target.collection}-${target.id}-translation-${getText(entry.id, String(index + 1))}`,
      severity: "critical",
      surfaceId: `${target.collection}:${target.id}`,
      title: "Translation needs review",
    }),
  );
}

function isMediaReady(value: unknown) {
  if (value == null || value === "") {
    return false;
  }

  if (typeof value !== "object") {
    return true;
  }

  const record = value as GenericRecord;
  const status = getText(record.status);
  const publicationReadiness = getText(record.publicationReadiness);
  const rightsStatus = getText(record.rightsStatus) || getText(record.usageRightsStatus);
  const referenceOnly = record.referenceOnlyNotProductionAsset === true;

  if (referenceOnly) {
    return false;
  }

  if (status && status !== "published") {
    return false;
  }

  if (publicationReadiness && publicationReadiness !== "production-ready") {
    return false;
  }

  if (rightsStatus && !["approved", "production-approved"].includes(rightsStatus)) {
    return false;
  }

  return true;
}

function findMediaIssues(target: PublishTarget, record: GenericRecord) {
  const fields =
    target.targetType === "product"
      ? ["heroAsset", "coverCardAsset"]
      : target.targetType === "page"
        ? ["heroMedia", "coverMedia"]
        : [];

  return fields
    .filter((field) => !isMediaReady(record[field]))
    .map((field) =>
      issue({
        description: record[field]
          ? `${target.label} has ${field} that is not production-ready.`
          : `${target.label} is missing ${field}; add a production-ready visual before release.`,
        id: `${target.collection}-${target.id}-media-${field}`,
        severity: "critical",
        surfaceId: `${target.collection}:${target.id}`,
        title: "Media is not production-ready",
      }),
    );
}

async function findProductFormIssues(payload: Payload, target: PublishTarget, record: GenericRecord) {
  if (target.targetType !== "product" || record.requiresQualification === false) {
    return [];
  }

  const primaryLocale = getText(record.primaryLocale, "en");
  const forms = await payload.find({
    collection: "productInquiryForms",
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
    where: {
      product: {
        equals: target.id,
      },
    },
  });
  const ready = (forms.docs as unknown as GenericRecord[]).some(
    (form) =>
      getText(form.status) === "published" &&
      getText(form.approvalStatus) === "approved" &&
      (getText(form.locale) === primaryLocale || getText(form.primaryLocale) === primaryLocale),
  );

  return ready
    ? []
    : [
        issue({
          description: `${target.label} needs one published and approved primary inquiry form before release.`,
          id: `${target.collection}-${target.id}-form`,
          surfaceId: `${target.collection}:${target.id}`,
          title: "Inquiry form is not ready",
        }),
      ];
}

function findRecordIssues(target: PublishTarget, record: GenericRecord) {
  const issues: Issue[] = [];

  if (target.targetType === "page") {
    if (getText(record.approvalStatus) !== "approved") {
      issues.push(
        issue({
          description: `${target.label} must be approved before publication.`,
          id: `${target.collection}-${target.id}-approval`,
          surfaceId: `${target.collection}:${target.id}`,
          title: "Page is not approved",
        }),
      );
    }

    if (!Array.isArray(record.sections) || record.sections.length === 0) {
      issues.push(
        issue({
          description: `${target.label} has no page sections attached.`,
          id: `${target.collection}-${target.id}-sections`,
          surfaceId: `${target.collection}:${target.id}`,
          title: "Page has no sections",
        }),
      );
    }
  }

  if (target.targetType === "settings" && !getText(record.contactPrimaryHref)) {
    issues.push(
      issue({
        description: `${target.label} needs a primary contact link before release.`,
        id: `${target.collection}-${target.id}-contact`,
        surfaceId: `${target.collection}:${target.id}`,
        title: "Contact action is missing",
      }),
    );
  }

  return issues;
}

function buildPlanSteps(blockers: Issue[]): PublishPlanStep[] {
  return [
    {
      id: "checks",
      label: "Owner checks",
      status: blockers.some((entry) => entry.id.includes("approval") || entry.id.includes("sections")) ? "blocked" : "ready",
    },
    {
      id: "translations",
      label: "Translations",
      status: blockers.some((entry) => entry.id.includes("translation")) ? "blocked" : "ready",
    },
    {
      id: "media",
      label: "Media readiness",
      status: blockers.some((entry) => entry.id.includes("media")) ? "blocked" : "ready",
    },
    {
      id: "seo",
      label: "SEO readiness",
      status: blockers.some((entry) => entry.id.includes("seo")) ? "blocked" : "ready",
    },
  ];
}

async function buildPublishPlan(payload: Payload, targets: PublishTarget[]): Promise<PublishPlan> {
  const blockers: Issue[] = [];

  for (const target of targets) {
    const record = await loadTargetRecord(payload, target);
    blockers.push(...findRecordIssues(target, record));
    blockers.push(...findMediaIssues(target, record));
    blockers.push(...(await findSeoIssues(payload, target, record)));
    blockers.push(...(await findTranslationIssues(payload, target)));
    blockers.push(...(await findProductFormIssues(payload, target, record)));
  }

  const status = blockers.some((entry) => entry.severity === "blocker" || entry.severity === "critical")
    ? "blocked"
    : targets.length === 0
      ? "draft"
      : "clear";

  return {
    blockers,
    id: "publish-history-plan",
    label: "Publish plan",
    status,
    steps: buildPlanSteps(blockers),
    summary:
      status === "clear"
        ? `${targets.length} target(s) can be published.`
        : blockers.length > 0
          ? `${blockers.length} release blocker(s) must be fixed before publish.`
          : "Choose a page, product or settings record before publish.",
  };
}

function getVersionRecord(version: GenericRecord) {
  return (version.version && typeof version.version === "object" ? version.version : {}) as GenericRecord;
}

function normalizeValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const id = getRecordId(value);
  if (id != null) {
    return String(id);
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized && serialized.length > 180 ? `${serialized.slice(0, 177)}...` : serialized;
  } catch {
    return null;
  }
}

function diffRecords(before: GenericRecord, after: GenericRecord) {
  const ignored = new Set(["createdAt", "id", "sizes", "updatedAt"]);
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => !ignored.has(key))
    .sort();

  return keys
    .map((field) => ({
      afterValue: normalizeValue(after[field]),
      beforeValue: normalizeValue(before[field]),
      field,
    }))
    .filter((entry) => entry.afterValue !== entry.beforeValue);
}

async function loadVersions(payload: Payload, target: PublishTarget | null) {
  if (!target) {
    return [];
  }

  const result = await payload.findVersions({
    collection: target.collection,
    depth: 0,
    limit: 20,
    overrideAccess: true,
    pagination: false,
    sort: "-updatedAt",
    where: {
      parent: {
        equals: target.id,
      },
    },
  });
  const docs = result.docs as unknown as GenericRecord[];

  return docs.map((version, index) => {
    const versionRecord = getVersionRecord(version);
    const previousRecord = docs[index + 1] ? getVersionRecord(docs[index + 1] as GenericRecord) : {};
    return {
      actorLabel: getText(versionRecord.updatedBy) || "Admin",
      changedAt: getText(version.updatedAt) || getText(version.createdAt),
      diff: diffRecords(previousRecord, versionRecord),
      id: String(version.id),
      label: `${target.label} version ${docs.length - index}`,
      status: getText(versionRecord.status, target.status),
    };
  });
}

async function loadVersionForTarget(payload: Payload, target: PublishTarget, versionId: string) {
  const result = await payload.findVersions({
    collection: target.collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          id: {
            equals: versionId,
          },
        },
        {
          parent: {
            equals: target.id,
          },
        },
      ],
    },
  });
  const version = result.docs[0] as unknown as GenericRecord | undefined;

  if (!version) {
    throw createCommandError("invalid-input", "Version does not belong to the selected target.");
  }

  return version;
}

async function loadAuditTrail(payload: Payload, target: PublishTarget | null) {
  if (!target) {
    return [];
  }

  const events = await payload.find({
    collection: "audit-events",
    depth: 0,
    limit: 25,
    overrideAccess: true,
    pagination: false,
    sort: "-happenedAt",
    where: {
      targetCollection: {
        equals: target.collection,
      },
      targetId: {
        equals: String(target.id),
      },
    },
  });

  return (events.docs as unknown as GenericRecord[]).map((event) => ({
    action: getText(event.action),
    actorLabel: getText(event.actorName) || getText(event.actorEmail) || getText(event.actorRole) || "Admin",
    happenedAt: getText(event.happenedAt),
    id: String(event.id ?? ""),
    summary: getText(event.summary),
  }));
}

function buildRevalidationEvidence(targets: PublishTarget[], reason: string) {
  const paths = [...new Set(targets.map((target) => target.routePath || "/"))].sort();

  return {
    mode: "queued-noop" as const,
    paths,
    reason,
  };
}

async function publishTargets(payload: Payload, req: PayloadRequest, targets: PublishTarget[]) {
  for (const target of targets) {
    const before = await loadTargetRecord(payload, target);
    const data: GenericRecord = { status: "published" };

    if (target.targetType === "page") {
      data.approvalStatus = "approved";
    }

    await payload.update({
      collection: target.collection,
      data,
      depth: 0,
      id: target.id,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    });
    await createAuditEvent(req, {
      action: "owner-publish-commit",
      details: `Revalidation queued for ${target.routePath || "/"}. Previous status: ${getText(before.status, "draft")}.`,
      eventGroup: "publication-workflow",
      summary: `Published ${target.label}.`,
      target: {
        collection: target.collection,
        id: target.id,
        label: target.label,
      },
    });
  }
}

async function restoreTargetVersion(
  payload: Payload,
  req: PayloadRequest,
  target: PublishTarget,
  versionId: string,
) {
  await loadVersionForTarget(payload, target, versionId);
  await payload.restoreVersion({
    collection: target.collection,
    depth: 0,
    id: versionId,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  });
  await createAuditEvent(req, {
    action: "owner-version-restore",
    details: `Restored version ${versionId}; revalidation queued for ${target.routePath || "/"}.`,
    eventGroup: "publication-workflow",
    summary: `Restored ${target.label} from history.`,
    target: {
      collection: target.collection,
      id: target.id,
      label: target.label,
    },
  });
}

async function buildSnapshot(
  payload: Payload,
  input: {
    compareAgainstVersionId?: string;
    compareVersionId?: string;
    selectedTarget: PublishTarget | null;
    successMessage?: string;
    targets: PublishTarget[];
  },
): Promise<PublishHistorySnapshot> {
  const plan = await buildPublishPlan(payload, input.targets);
  const versions = await loadVersions(payload, input.selectedTarget);
  const auditTrail = await loadAuditTrail(payload, input.selectedTarget);
  const compareVersionId = input.compareVersionId || versions[0]?.id;
  const compareAgainstVersionId = input.compareAgainstVersionId || versions[1]?.id;
  const compare =
    input.selectedTarget && compareVersionId && compareAgainstVersionId
      ? {
          againstVersionId: compareAgainstVersionId,
          diff: diffRecords(
            getVersionRecord(await loadVersionForTarget(payload, input.selectedTarget, compareAgainstVersionId)),
            getVersionRecord(await loadVersionForTarget(payload, input.selectedTarget, compareVersionId)),
          ),
          versionId: compareVersionId,
        }
      : undefined;

  return {
    auditTrail,
    generatedAt: new Date().toISOString(),
    plan,
    revalidation: buildRevalidationEvidence(input.targets, "No public web files changed; runtime revalidation is represented as BFF evidence."),
    selectedTarget: input.selectedTarget,
    targets: input.targets,
    versions,
    ...(compare ? { compare } : {}),
    ...(input.successMessage ? { successMessage: input.successMessage } : {}),
  };
}

export async function getPublishHistorySnapshot(
  payload: Payload,
  req: PayloadRequest,
  input: {
    targetId?: unknown;
    targetType?: unknown;
  } = {},
) {
  ensureRole(req, publishRoles);
  const targetType = input.targetType == null ? null : requireTargetType(input.targetType);
  const targetId = input.targetId == null ? null : requireId(input.targetId, "targetId");
  const targets = await findTargets(payload, { targetId, targetType });
  const selectedTarget = targets[0] ?? null;

  return buildSnapshot(payload, {
    selectedTarget,
    targets,
  });
}

export async function executePublishHistoryCommand(
  payload: Payload,
  req: PayloadRequest,
  input: PublishHistoryCommandInput,
) {
  const commandPayload = input.payload ?? {};
  const targetType = commandPayload.targetType == null ? null : requireTargetType(commandPayload.targetType);
  const targetId = commandPayload.targetId == null ? null : requireId(commandPayload.targetId, "targetId");
  const targets = await findTargets(payload, { targetId, targetType });
  const selectedTarget = targets[0] ?? null;

  switch (input.action) {
    case "publish.plan":
    case "history.list":
      ensureRole(req, publishRoles);
      return buildSnapshot(payload, { selectedTarget, targets });
    case "history.compare":
      ensureRole(req, publishRoles);
      if (!selectedTarget) {
        throw createCommandError("invalid-input", "Choose a target before comparing history.");
      }

      return buildSnapshot(payload, {
        compareAgainstVersionId: getText(commandPayload.againstVersionId),
        compareVersionId: getText(commandPayload.versionId),
        selectedTarget,
        targets,
      });
    case "publish.commit": {
      ensureRole(req, restoreRoles);
      if (targets.length === 0) {
        throw createCommandError("invalid-input", "Choose at least one target before publish.");
      }

      const plan = await buildPublishPlan(payload, targets);
      if (plan.status !== "clear") {
        throw createCommandError("invalid-input", plan.summary);
      }

      await publishTargets(payload, req, targets);
      return buildSnapshot(payload, {
        selectedTarget,
        successMessage: `Published ${targets.length} target(s).`,
        targets,
      });
    }
    case "history.restore": {
      ensureRole(req, restoreRoles);
      if (!selectedTarget) {
        throw createCommandError("invalid-input", "Choose a target before restore.");
      }

      const versionId = requireString(commandPayload.versionId, "versionId");
      await restoreTargetVersion(payload, req, selectedTarget, versionId);
      return buildSnapshot(payload, {
        selectedTarget,
        successMessage: `Restored ${selectedTarget.label}.`,
        targets,
      });
    }
    default:
      throw createCommandError("invalid-input", "Unsupported publish/history action.");
  }
}

export function getPublishTargetType(collection: string) {
  return getTargetType(collection);
}
