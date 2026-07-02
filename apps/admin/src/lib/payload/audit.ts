import type {
  CollectionAfterChangeHook,
  CollectionSlug,
  PayloadRequest,
  TypeWithID,
} from "payload";

type AuditEventGroup =
  | "access"
  | "lead-workflow"
  | "media-governance"
  | "privacy"
  | "publication-workflow"
  | "settings";

const auditEventGroupLabels: Record<AuditEventGroup, string> = {
  access: "Access and role changes",
  "lead-workflow": "Lead workflow updates",
  "media-governance": "Media and document governance",
  privacy: "Privacy and exports",
  "publication-workflow": "Publish and status changes",
  settings: "Protected settings",
};

type AuditTargetInput = {
  collection: string;
  id: number | string;
  label?: string | null;
};

type AuditDiffEntry = {
  afterValue: string | null;
  beforeValue: string | null;
  field: string;
};

type CreateAuditEventInput = {
  action: string;
  details?: string | null;
  diffs?: AuditDiffEntry[];
  eventGroup: AuditEventGroup;
  happenedAt?: string;
  sensitive?: boolean;
  summary: string;
  target: AuditTargetInput;
};

type StatusAuditHookOptions = {
  collection: string;
  labelFields?: string[];
  surfaceLabel: string;
  targetCollection?: string;
};

type FieldChangeAuditHookOptions = {
  action: string;
  collection: string;
  detailBuilder?: (diffs: AuditDiffEntry[]) => string | null;
  eventGroup: AuditEventGroup;
  fields: string[];
  labelFields?: string[];
  sensitive?: boolean;
  summaryBuilder: (diffs: AuditDiffEntry[]) => string;
  targetCollection?: string;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function humanizeToken(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getAuditEventGroupLabel(group: AuditEventGroup) {
  return auditEventGroupLabels[group];
}

export function getAuditActionLabel(action: string) {
  switch (action) {
    case "publish":
      return "Published";
    case "unpublish":
      return "Unpublished";
    case "archive":
      return "Archived";
    case "restore":
      return "Restored from archive";
    case "status-change":
      return "Status changed";
    case "role-change":
      return "Role changed";
    case "lead-export":
      return "Lead export";
    case "lead-workflow-update":
      return "Lead workflow updated";
    case "media-governance-update":
      return "Media governance updated";
    case "document-governance-update":
      return "Document governance updated";
    case "placement-governance-update":
      return "Placement governance updated";
    case "protected-settings-update":
      return "Protected settings updated";
    case "backup-created":
      return "Backup bundle created";
    case "restore-validation":
      return "Restore validation checked";
    case "restore-performed":
      return "Restore performed";
    case "owner-publish-commit":
      return "Owner publish";
    case "owner-version-restore":
      return "Owner restore";
    default:
      return humanizeToken(action);
  }
}

function getActor(req: PayloadRequest) {
  const user = req.user as
    | {
        email?: unknown;
        fullName?: unknown;
        id?: number | string | null;
        role?: unknown;
      }
    | undefined;

  return {
    email: getText(user?.email) || null,
    id:
      typeof user?.id === "number" || typeof user?.id === "string"
        ? user.id
        : null,
    name: getText(user?.fullName) || null,
    role: getText(user?.role) || null,
  };
}

function normalizeAuditValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    const next = value.trim();
    return next || null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    const serialized = JSON.stringify(value);
    if (!serialized) {
      return null;
    }

    return serialized.length > 280 ? `${serialized.slice(0, 277)}...` : serialized;
  } catch {
    return null;
  }
}

function getTargetId(doc: Partial<TypeWithID> | null | undefined) {
  return typeof doc?.id === "number" || typeof doc?.id === "string" ? doc.id : null;
}

function resolveTargetLabel(doc: Record<string, unknown>, labelFields: string[] = []) {
  for (const field of labelFields) {
    const value = normalizeAuditValue(doc[field]);
    if (value) {
      return value;
    }
  }

  return null;
}

function buildDiffs(
  fields: string[],
  previousDoc: Record<string, unknown>,
  doc: Record<string, unknown>,
): AuditDiffEntry[] {
  return fields
    .map((field) => ({
      afterValue: normalizeAuditValue(doc[field]),
      beforeValue: normalizeAuditValue(previousDoc[field]),
      field,
    }))
    .filter((entry) => entry.afterValue !== entry.beforeValue);
}

function getStatusAction(fromStatus: string, toStatus: string) {
  if (fromStatus !== "published" && toStatus === "published") {
    return "publish";
  }

  if (fromStatus === "published" && toStatus !== "published" && toStatus !== "archived") {
    return "unpublish";
  }

  if (fromStatus !== "archived" && toStatus === "archived") {
    return "archive";
  }

  if (fromStatus === "archived" && toStatus !== "archived") {
    return "restore";
  }

  return "status-change";
}

export async function createAuditEvent(req: PayloadRequest, input: CreateAuditEventInput) {
  if (!req.payload) {
    return;
  }

  const actor = getActor(req);
  const happenedAt = input.happenedAt || new Date().toISOString();

  await req.payload.create({
    collection: "audit-events" as CollectionSlug,
    data: {
      action: input.action,
      actionLabel: getAuditActionLabel(input.action),
      actorEmail: actor.email,
      actorId: actor.id == null ? null : String(actor.id),
      actorName: actor.name,
      actorRole: actor.role,
      details: input.details || null,
      diffs: (input.diffs ?? []).map((entry) => ({
        afterValue: entry.afterValue,
        beforeValue: entry.beforeValue,
        field: entry.field,
      })),
      eventGroup: input.eventGroup,
      eventGroupLabel: getAuditEventGroupLabel(input.eventGroup),
      happenedAt,
      sensitive: input.sensitive === true,
      summary: input.summary,
      targetCollection: input.target.collection,
      targetId: String(input.target.id),
      targetLabel: input.target.label || null,
    } as never,
    overrideAccess: true,
    req,
    showHiddenFields: true,
  });
}

export function createStatusAuditHook({
  collection,
  labelFields = [],
  surfaceLabel,
  targetCollection,
}: StatusAuditHookOptions): CollectionAfterChangeHook {
  return async ({ doc, operation, previousDoc, req }) => {
    if (operation !== "update") {
      return doc;
    }

    const previousRecord = previousDoc as Record<string, unknown>;
    const nextRecord = doc as unknown as Record<string, unknown>;
    const fromStatus = getText(previousRecord.status);
    const toStatus = getText(nextRecord.status);

    if (!fromStatus || !toStatus || fromStatus === toStatus) {
      return doc;
    }

    const targetId = getTargetId(doc);
    if (targetId == null) {
      return doc;
    }

    await createAuditEvent(req, {
      action: getStatusAction(fromStatus, toStatus),
      diffs: [
        {
          afterValue: toStatus,
          beforeValue: fromStatus,
          field: "status",
        },
      ],
      eventGroup: "publication-workflow",
      summary: `${surfaceLabel} status changed: ${fromStatus} -> ${toStatus}.`,
      target: {
        collection: targetCollection || collection,
        id: targetId,
        label: resolveTargetLabel(nextRecord, labelFields),
      },
    });

    return doc;
  };
}

export function createFieldChangeAuditHook({
  action,
  collection,
  detailBuilder,
  eventGroup,
  fields,
  labelFields = [],
  sensitive = false,
  summaryBuilder,
  targetCollection,
}: FieldChangeAuditHookOptions): CollectionAfterChangeHook {
  return async ({ doc, operation, previousDoc, req }) => {
    if (operation !== "update") {
      return doc;
    }

    const previousRecord = previousDoc as Record<string, unknown>;
    const nextRecord = doc as unknown as Record<string, unknown>;
    const diffs = buildDiffs(fields, previousRecord, nextRecord);
    const targetId = getTargetId(doc);

    if (diffs.length === 0 || targetId == null) {
      return doc;
    }

    await createAuditEvent(req, {
      action,
      details: detailBuilder ? detailBuilder(diffs) : null,
      diffs,
      eventGroup,
      sensitive,
      summary: summaryBuilder(diffs),
      target: {
        collection: targetCollection || collection,
        id: targetId,
        label: resolveTargetLabel(nextRecord, labelFields),
      },
    });

    return doc;
  };
}
