import type { Payload, PayloadRequest, Where } from "payload";

import { getAdminUser } from "./access.ts";
import { createAuditEvent } from "./audit.ts";
import { hasAdminRole, leadPiiAccessRoles, type AdminRole } from "./roles.ts";

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
const leadInboxReadRoles = [
  "owner",
  "admin",
  "content-editor",
  "lead-manager",
  "translator",
  "developer",
] as const satisfies readonly AdminRole[];
const leadInboxUpdateRoles = ["owner", "admin", "lead-manager", "developer"] as const satisfies readonly AdminRole[];

export type LeadInboxFilterId =
  | "all"
  | "new"
  | "in-progress"
  | "closed";

export type LeadInboxFilterSummary = {
  count: number;
  description: string;
  id: LeadInboxFilterId;
  label: string;
};

export type LeadInboxActivityEntry = {
  actor: string | null;
  at: string;
  detail: string | null;
  summary: string;
  type: string;
};

export type LeadInboxFieldSnapshot = {
  label: string;
  value: string;
};

export type LeadInboxNotificationAttempt = {
  attemptedAt: string;
  deliveryMode: string;
  error: string;
  eventPath: string;
  recipientCount: number;
  responseStatus: string;
  safeTargetApplied: boolean;
  status: string;
};

export type LeadInboxCard = {
  activityTimeline: LeadInboxActivityEntry[];
  ageLabel: string;
  assignedTeam: string;
  assignedToUser: string;
  canViewPii: boolean;
  company: string;
  consentLabel: string;
  country: string;
  createdAt: string;
  displayName: string;
  email: string;
  form: string;
  id: number | string;
  latestActivitySummary: string;
  locale: string;
  lastContactedAt: string;
  message: string;
  nextActionAt: string;
  nextActionLabel: string;
  nextActionState: "overdue" | "planned" | "today" | "unscheduled";
  partnerHandoffStatus: string;
  phone: string;
  priority: string;
  product: string;
  referenceCode: string;
  requestType: string;
  routingMode: string;
  routingRuleKey: string;
  routingSuggestion: string;
  sourceChannel: string;
  sourceLabel: string;
  sourcePagePath: string;
  sourcePageTitle: string;
  status: string;
  ownerNotes: string;
  submittedFields: LeadInboxFieldSnapshot[];
  notificationAttempts: LeadInboxNotificationAttempt[];
  notificationLastAttemptAt: string;
  notificationRecipientsCount: number;
  notificationSafeTargetApplied: boolean;
  notificationStatus: string;
};

export type LeadInboxSnapshot = {
  activeFilter: LeadInboxFilterId;
  availablePriorities: readonly string[];
  availableStatuses: readonly string[];
  canExport: boolean;
  canUpdate: boolean;
  canViewPii: boolean;
  cards: LeadInboxCard[];
  emptyState: string;
  filters: LeadInboxFilterSummary[];
  generatedAt: string;
};

export type LeadInboxUpdateInput = {
  assignedTeam?: unknown;
  assignedToUser?: unknown;
  nextActionAt?: unknown;
  note?: unknown;
  priority?: unknown;
  status?: unknown;
};

type LeadRecord = Record<string, unknown>;

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(value: unknown) {
  const text = getText(value);
  return text || "";
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatFilterLabel(filter: LeadInboxFilterId) {
  switch (filter) {
    case "new":
      return "Новые";
    case "in-progress":
      return "В работе";
    case "closed":
      return "Закрытые";
    default:
      return "Все заявки";
  }
}

function formatFilterDescription(filter: LeadInboxFilterId) {
  switch (filter) {
    case "new":
      return "Только что пришедшие обращения, которые ждут первого ответа.";
    case "in-progress":
      return "Заявки, по которым уже есть ответственный, контакт или следующий шаг.";
    case "closed":
      return "Закрытые, завершенные и архивные обращения для истории.";
    default:
      return "Полная очередь: новые, активные и завершенные обращения в одном месте.";
  }
}

function getLeadInboxRole(req: PayloadRequest) {
  return getAdminUser(req.user)?.role ?? null;
}

export function canReadLeadsInbox(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), leadInboxReadRoles);
}

export function canUpdateLeadsInbox(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), leadInboxUpdateRoles);
}

export function canViewLeadPii(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), leadPiiAccessRoles);
}

export function canExportLeadsInbox(req: PayloadRequest) {
  return hasAdminRole(getAdminUser(req.user), ["owner", "admin"]);
}

function getLeadWhere(filter: LeadInboxFilterId, now: string): Where | undefined {
  switch (filter) {
    case "new":
      return {
        status: {
          equals: "new",
        },
      };
    case "in-progress":
      return {
        status: {
          in: ["reviewed", "contacted", "qualified", "proposal_in_progress"],
        },
      };
    case "closed":
      return {
        or: [
          {
            status: {
              in: ["closed", "spam"],
            },
          },
          {
            resolution: {
              in: ["won", "lost", "disqualified", "spam", "support-complete"],
            },
          },
        ],
      };
    default:
      return undefined;
  }
}

async function countLeads(
  payload: Payload,
  req: PayloadRequest,
  filter: LeadInboxFilterId,
  now: string,
) {
  const where = getLeadWhere(filter, now);
  const result = await payload.find({
    collection: "leads",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: true,
    req,
    ...(where ? { where } : {}),
  });

  return result.totalDocs;
}

function formatAgeLabel(createdAt: string, now: Date) {
  const created = new Date(createdAt);
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return `${diffDays} дн.`;
  }

  if (diffHours >= 1) {
    return `${diffHours} ч.`;
  }

  const diffMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
  return `${diffMinutes} мин.`;
}

function formatSourceChannelLabel(sourceChannel: string) {
  switch (sourceChannel) {
    case "direction-page":
      return "Страница направления";
    case "dealer-page":
      return "Страница дилеров";
    case "contact-page":
      return "Контактная страница";
    case "download-gate":
      return "Доступ к материалам";
    case "admin-manual":
      return "Ручной ввод в админке";
    case "api-import":
      return "Импорт через API";
    default:
      return "Страница продукта";
  }
}

function formatRequestTypeLabel(requestType: string) {
  switch (requestType) {
    case "consultation":
      return "Консультация";
    case "support":
      return "Поддержка";
    case "service":
      return "Сервис";
    case "maintenance":
      return "Обслуживание";
    case "repair":
      return "Ремонт";
    case "dealer":
      return "Дилерский запрос";
    case "product-inquiry":
      return "Заявка по продукту";
    case "consultation-request":
      return "Запрос консультации";
    case "service-follow-up":
      return "Сервисное обращение";
    case "private-demo":
      return "Частный показ";
    default:
      return requestType || "Заявка";
  }
}

function cleanOwnerLeadText(value: string) {
  return value
    .replace(/\[INTERNAL TEST\]\s*/gi, "")
    .replace(/INTERNAL TEST\s*\|\s*/gi, "")
    .replace(
      /I AGREE THAT MONTELAR MAY REVIEW THIS INTERNAL TEST REQUEST AND CONTACT ME ABOUT AN EXHIBITION-DISPLAY CONSULTATION\.?/gi,
      "Согласие на обработку заявки Montelar получено.",
    )
    .replace(/internal test request/gi, "заявку")
    .replace(/Internal seed sample\.?\s*/gi, "")
    .replace(/\s*placeholder only\.?/gi, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatSourceLabel(doc: LeadRecord) {
  const sourceChannel = getOptionalText(doc.sourceChannel) || "product-page";
  const sourcePageTitle = cleanOwnerLeadText(getOptionalText(doc.sourcePageTitle));
  const sourcePagePath = getOptionalText(doc.sourcePagePath);
  const requestType = formatRequestTypeLabel(getOptionalText(doc.requestType));
  const parts = [formatSourceChannelLabel(sourceChannel), sourcePageTitle || sourcePagePath, requestType].filter(
    Boolean,
  );

  return parts.join(" · ");
}

function formatRelativeDuration(diffMs: number) {
  const totalMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));

  if (totalMinutes >= 24 * 60) {
    const totalDays = Math.floor(totalMinutes / (24 * 60));
    return `${totalDays} дн.`;
  }

  if (totalMinutes >= 60) {
    const totalHours = Math.floor(totalMinutes / 60);
    return `${totalHours} ч.`;
  }

  return `${totalMinutes} мин.`;
}

function formatNextActionState(nextActionAt: string, now: Date) {
  if (!nextActionAt) {
    return {
      label: "Следующий контакт не назначен",
      state: "unscheduled",
    } as const;
  }

  const parsed = new Date(nextActionAt);
  if (Number.isNaN(parsed.getTime())) {
    return {
      label: "Дата следующего контакта заполнена с ошибкой",
      state: "unscheduled",
    } as const;
  }

  const diffMs = parsed.getTime() - now.getTime();
  if (diffMs < 0) {
    return {
      label: `Просрочено на ${formatRelativeDuration(Math.abs(diffMs))}`,
      state: "overdue",
    } as const;
  }

  if (diffMs <= 24 * 60 * 60 * 1000) {
    return {
      label: `Связаться сегодня · ${parsed.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`,
      state: "today",
    } as const;
  }

  return {
    label: `Запланировано на ${parsed.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}`,
    state: "planned",
  } as const;
}

function buildSubmittedFields(doc: LeadRecord, canViewPii: boolean): LeadInboxFieldSnapshot[] {
  if (!canViewPii) {
    return [];
  }

  return asArray<Record<string, unknown>>(doc.submittedFieldSnapshot)
    .map((entry) => {
      const label = getText(entry.label);
      if (!label) {
        return null;
      }

      const valueText = getText(entry.valueText);
      const valueList = asArray<Record<string, unknown>>(entry.valueList)
        .map((item) => getText(item.value))
        .filter(Boolean);
      const valueBoolean = entry.valueBoolean === true ? "Да" : entry.valueBoolean === false ? "" : "";
      const value = valueText || valueList.join(", ") || valueBoolean;

      return value
        ? {
            label,
            value,
          }
        : null;
    })
    .filter((entry): entry is LeadInboxFieldSnapshot => entry !== null)
    .slice(0, 10);
}

function buildActivityTimeline(doc: LeadRecord): LeadInboxActivityEntry[] {
  const directTimeline = asArray<Record<string, unknown>>(doc.activityTimeline)
    .map((entry, index) => {
      const at = getText(entry.at);
      const summary = getText(entry.summary);

      if (!at || !summary) {
        return null;
      }

      return {
        actor: getText(entry.actor) || null,
        at,
        detail: cleanOwnerLeadText(getText(entry.detail)) || null,
        summary,
        type: getText(entry.type) || `note-${index}`,
      };
    })
    .filter((entry): entry is LeadInboxActivityEntry => entry !== null);

  if (directTimeline.length > 0) {
    return directTimeline.sort((left, right) => right.at.localeCompare(left.at));
  }

  return asArray<Record<string, unknown>>(doc.statusHistory)
    .map((entry, index) => {
      const toStatus = getText(entry.toStatus);
      const at = getText(entry.changedAt);

      if (!toStatus || !at) {
        return null;
      }

      return {
        actor: getText(entry.changedBy) || null,
        at,
        detail: cleanOwnerLeadText(getText(entry.note) || getText(entry.reason)) || null,
        summary: `Статус изменен: ${toStatus}.`,
        type: `status-${index}`,
      };
    })
    .filter((entry): entry is LeadInboxActivityEntry => entry !== null)
    .sort((left, right) => right.at.localeCompare(left.at));
}

function buildLeadCard(doc: LeadRecord, canViewPii: boolean, now: Date): LeadInboxCard {
  const nextAction = formatNextActionState(getOptionalText(doc.nextActionAt), now);
  const sourceLabel = formatSourceLabel(doc);
  const sourcePageTitle = cleanOwnerLeadText(getOptionalText(doc.sourcePageTitle));

  const notificationAttempts = asArray<Record<string, unknown>>(doc.notificationAttempts)
    .map((entry) => {
      const attemptedAt = getText(entry.attemptedAt);
      const status = getText(entry.status);
      const deliveryMode = getText(entry.deliveryMode);
      const eventPath = getText(entry.eventPath);

      if (!attemptedAt || !status || !deliveryMode || !eventPath) {
        return null;
      }

      return {
        attemptedAt,
        deliveryMode,
        error: getOptionalText(entry.error),
        eventPath,
        recipientCount: asArray<Record<string, unknown>>(entry.recipients).length,
        responseStatus:
          typeof entry.responseStatus === "number" ? String(entry.responseStatus) : "n/a",
        safeTargetApplied: entry.safeTargetApplied === true,
        status,
      } satisfies LeadInboxNotificationAttempt;
    })
    .filter((entry): entry is LeadInboxNotificationAttempt => entry !== null)
    .sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt));

  return {
    activityTimeline: buildActivityTimeline(doc),
    ageLabel: formatAgeLabel(getText(doc.createdAt) || now.toISOString(), now),
    assignedTeam: getOptionalText(doc.assignedTeam),
    assignedToUser: getOptionalText(doc.assignedToUser),
    canViewPii,
    company: canViewPii ? cleanOwnerLeadText(getOptionalText(doc.company)) : "",
    consentLabel: getText(doc.consentAcceptedAt) ? "Согласие получено" : "Согласие не найдено",
    country: canViewPii ? getOptionalText(doc.country) : "",
    createdAt: getText(doc.createdAt),
    displayName: canViewPii ? cleanOwnerLeadText(getOptionalText(doc.displayName)) : "",
    email: canViewPii ? getOptionalText(doc.email) : "",
    form: getOptionalText(doc.form),
    id: doc.id as number | string,
    lastContactedAt: getOptionalText(doc.lastContactedAt),
    latestActivitySummary: cleanOwnerLeadText(getOptionalText(doc.latestActivitySummary)),
    locale: getOptionalText(doc.locale),
    message: canViewPii ? cleanOwnerLeadText(getOptionalText(doc.message)) : "",
    nextActionAt: getOptionalText(doc.nextActionAt),
    nextActionLabel: nextAction.label,
    nextActionState: nextAction.state,
    partnerHandoffStatus: getOptionalText(doc.partnerHandoffStatus),
    phone: canViewPii ? getOptionalText(doc.phone) : "",
    priority: getOptionalText(doc.priority) || "normal",
    product: getOptionalText(doc.product),
    referenceCode: getOptionalText(doc.referenceCode),
    requestType: formatRequestTypeLabel(getOptionalText(doc.requestType)),
    routingMode: getOptionalText(doc.routingMode),
    routingRuleKey: getOptionalText(doc.routingRuleKey),
    routingSuggestion: cleanOwnerLeadText(getOptionalText(doc.routingSuggestion)),
    sourceChannel: getOptionalText(doc.sourceChannel),
    sourceLabel,
    sourcePagePath: getOptionalText(doc.sourcePagePath),
    sourcePageTitle,
    status: getOptionalText(doc.status) || "new",
    ownerNotes: canViewPii ? cleanOwnerLeadText(getOptionalText(doc.ownerNotes)) : "",
    submittedFields: buildSubmittedFields(doc, canViewPii).map((field) => ({
      ...field,
      label: cleanOwnerLeadText(field.label),
      value: cleanOwnerLeadText(field.value),
    })),
    notificationAttempts,
    notificationLastAttemptAt: getOptionalText(doc.notificationLastAttemptAt),
    notificationRecipientsCount: asArray<Record<string, unknown>>(doc.notificationRecipients).length,
    notificationSafeTargetApplied:
      notificationAttempts.some((entry) => entry.safeTargetApplied) ||
      asArray<Record<string, unknown>>(doc.internalTags).some(
        (entry) => getText(entry.tag) === "safe-target",
      ),
    notificationStatus: getOptionalText(doc.notificationStatus) || "pending",
  };
}

export async function getLeadsInboxSnapshot(
  payload: Payload,
  req: PayloadRequest,
  requestedFilter?: string | null,
): Promise<LeadInboxSnapshot> {
  const role = getLeadInboxRole(req);

  if (!role || !canReadLeadsInbox(req)) {
    throw new Error("forbidden");
  }

  const nowIso = new Date().toISOString();
  const activeFilter = (
    requestedFilter &&
    ["all", "new", "in-progress", "closed"].includes(requestedFilter)
      ? requestedFilter
      : "all"
  ) as LeadInboxFilterId;
  const filterIds: LeadInboxFilterId[] = ["all", "new", "in-progress", "closed"];
  const filterCounts = await Promise.all(
    filterIds.map(async (filter) => [filter, await countLeads(payload, req, filter, nowIso)] as const),
  );
  const activeWhere = getLeadWhere(activeFilter, nowIso);
  const result = await payload.find({
    collection: "leads",
    depth: 0,
    limit: 24,
    overrideAccess: false,
    pagination: false,
    req,
    sort: activeFilter === "closed" ? "-updatedAt" : "-createdAt",
    ...(activeWhere ? { where: activeWhere } : {}),
  });
  const canViewPii = canViewLeadPii(req);
  const now = new Date();

  return {
    activeFilter,
    availablePriorities: leadPriorityValues,
    availableStatuses: leadStatusValues,
    canExport: canExportLeadsInbox(req),
    canUpdate: canUpdateLeadsInbox(req),
    canViewPii,
    cards: (result.docs as unknown as LeadRecord[]).map((doc) => buildLeadCard(doc, canViewPii, now)),
    emptyState: `В очереди «${formatFilterLabel(activeFilter)}» сейчас нет заявок.`,
    filters: filterCounts.map(([filter, count]) => ({
      count,
      description: formatFilterDescription(filter),
      id: filter,
      label: formatFilterLabel(filter),
    })),
    generatedAt: nowIso,
  };
}

function normalizeInputDate(value: unknown) {
  const raw = getText(value);
  if (!raw) {
    return "";
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function buildActor(req: PayloadRequest) {
  const user = getAdminUser(req.user) as { email?: unknown; fullName?: unknown; role?: unknown } | null;
  return getText(user?.fullName) || getText(user?.email) || getText(user?.role) || "admin-operator";
}

function appendOwnerNotes(currentNotes: unknown, note: string, actor: string, at: string) {
  if (!note) {
    return getOptionalText(currentNotes);
  }

  const stampedNote = `[${at}] ${actor}: ${note}`;
  const existing = getOptionalText(currentNotes);
  return existing ? `${existing}\n${stampedNote}` : stampedNote;
}

function normalizeStatus(value: unknown, fallback: string) {
  const next = getText(value);
  return leadStatusValues.includes(next as (typeof leadStatusValues)[number]) ? next : fallback;
}

function normalizePriority(value: unknown, fallback: string) {
  const next = getText(value);
  return leadPriorityValues.includes(next as (typeof leadPriorityValues)[number]) ? next : fallback;
}

export async function applyLeadInboxUpdate(
  payload: Payload,
  req: PayloadRequest,
  leadId: number | string,
  input: LeadInboxUpdateInput,
) {
  if (!canUpdateLeadsInbox(req)) {
    throw new Error("forbidden");
  }

  const original = (await payload.findByID({
    collection: "leads",
    id: leadId,
    overrideAccess: false,
    req,
  })) as unknown as LeadRecord;
  const actor = buildActor(req);
  const at = new Date().toISOString();
  const nextStatus = normalizeStatus(input.status, getText(original.status) || "new");
  const nextPriority = normalizePriority(input.priority, getText(original.priority) || "normal");
  const nextAssignedTeam = getOptionalText(input.assignedTeam) || getOptionalText(original.assignedTeam);
  const nextAssignedToUser =
    getOptionalText(input.assignedToUser) || getOptionalText(original.assignedToUser);
  const nextActionAt =
    input.nextActionAt === ""
      ? ""
      : normalizeInputDate(input.nextActionAt) || getOptionalText(original.nextActionAt);
  const note = getOptionalText(input.note);
  const currentStatus = getText(original.status) || "new";
  const currentAssignedTeam = getOptionalText(original.assignedTeam);
  const currentAssignedToUser = getOptionalText(original.assignedToUser);
  const currentNextActionAt = getOptionalText(original.nextActionAt);
  const existingTimeline = asArray<Record<string, unknown>>(original.activityTimeline);
  const existingStatusHistory = asArray<Record<string, unknown>>(original.statusHistory);
  const timelineEntries = [...existingTimeline];
  const statusHistory = [...existingStatusHistory];

  if (nextStatus !== currentStatus) {
    statusHistory.push({
      changedAt: at,
      changedBy: actor,
      fromStatus: currentStatus,
      note: note || null,
      reason: note || "Updated from leads workspace.",
      source: "admin-leads-inbox",
      toStatus: nextStatus,
    });
    timelineEntries.push({
      actor,
      at,
      detail: note || `Из ${currentStatus} в ${nextStatus}.`,
      summary: `Статус изменен на ${nextStatus}.`,
      type: "status-change",
    });
  }

  if (nextAssignedTeam !== currentAssignedTeam || nextAssignedToUser !== currentAssignedToUser) {
    timelineEntries.push({
      actor,
      at,
      detail: [
        nextAssignedTeam ? `команда: ${nextAssignedTeam}` : "",
        nextAssignedToUser ? `ответственный: ${nextAssignedToUser}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      summary: "Ответственный обновлен.",
      type: "assignment",
    });
  }

  if (nextActionAt !== currentNextActionAt) {
    timelineEntries.push({
      actor,
      at,
      detail: nextActionAt || "Дата следующего контакта очищена.",
      summary: nextActionAt ? "Следующий контакт обновлен." : "Следующий контакт очищен.",
      type: "next-action",
    });
  }

  if (note) {
    timelineEntries.push({
      actor,
      at,
      detail: note,
      summary: "Добавлен комментарий менеджера.",
      type: "note",
    });
  }

  if (
    nextStatus === currentStatus &&
    nextPriority === (getText(original.priority) || "normal") &&
    nextAssignedTeam === currentAssignedTeam &&
    nextAssignedToUser === currentAssignedToUser &&
    nextActionAt === currentNextActionAt &&
    !note
  ) {
    throw new Error("no-op");
  }

  const latestActivitySummary =
    getText((timelineEntries[timelineEntries.length - 1] as { summary?: unknown } | undefined)?.summary) ||
    getText(original.latestActivitySummary) ||
    "Lead updated from inbox.";
  const resolution =
    nextStatus === "spam"
      ? "spam"
      : nextStatus === "closed" && getText(original.resolution) === "open"
        ? "won"
        : getText(original.resolution) || "open";

  return payload.update({
    collection: "leads",
    data: {
      activityTimeline: timelineEntries,
      assignedTeam: nextAssignedTeam || null,
      assignedToUser: nextAssignedToUser || null,
      lastContactedAt:
        nextStatus === "contacted" || nextStatus === "qualified" || nextStatus === "proposal_in_progress"
          ? at
          : original.lastContactedAt,
      lastStatusChangedAt: nextStatus !== currentStatus ? at : original.lastStatusChangedAt,
      latestActivitySummary,
      nextActionAt: nextActionAt || null,
      ownerNotes: appendOwnerNotes(original.ownerNotes, note, actor, at),
      priority: nextPriority as
        | "low"
        | "normal"
        | "high"
        | "vip"
        | "urgent",
      resolution: resolution as
        | "open"
        | "won"
        | "lost"
        | "disqualified"
        | "spam"
        | "support-complete",
      status: nextStatus as
        | "new"
        | "reviewed"
        | "contacted"
        | "qualified"
        | "proposal_in_progress"
        | "closed"
        | "spam",
      statusHistory,
      updatedAt: at,
    } as never,
    id: leadId,
    overrideAccess: false,
    req,
  }) as Promise<{ id: number | string }>;
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function toCsvLine(values: string[]) {
  return values.map((value) => escapeCsvValue(value)).join(",");
}

export async function exportLeadsInboxCsv(
  payload: Payload,
  req: PayloadRequest,
  requestedFilter?: string | null,
) {
  if (!canExportLeadsInbox(req)) {
    throw new Error("forbidden");
  }

  const nowIso = new Date().toISOString();
  const activeFilter = (
    requestedFilter &&
    ["all", "new", "in-progress", "closed"].includes(requestedFilter)
      ? requestedFilter
      : "all"
  ) as LeadInboxFilterId;
  const where = getLeadWhere(activeFilter, nowIso);
  const result = await payload.find({
    collection: "leads",
    depth: 0,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    req,
    sort: "-createdAt",
    ...(where ? { where } : {}),
  });

  const header = [
    "referenceCode",
    "status",
    "priority",
    "displayName",
    "email",
    "phone",
    "company",
    "product",
    "locale",
    "assignedTeam",
    "assignedToUser",
    "routingMode",
    "partnerHandoffStatus",
    "createdAt",
    "nextActionAt",
  ];
  const rows = (result.docs as unknown as LeadRecord[]).map((doc) =>
    toCsvLine([
      getOptionalText(doc.referenceCode),
      getOptionalText(doc.status),
      getOptionalText(doc.priority),
      getOptionalText(doc.displayName),
      getOptionalText(doc.email),
      getOptionalText(doc.phone),
      getOptionalText(doc.company),
      getOptionalText(doc.product),
      getOptionalText(doc.locale),
      getOptionalText(doc.assignedTeam),
      getOptionalText(doc.assignedToUser),
      getOptionalText(doc.routingMode),
      getOptionalText(doc.partnerHandoffStatus),
      getOptionalText(doc.createdAt),
      getOptionalText(doc.nextActionAt),
    ]),
  );

  await createAuditEvent(req, {
    action: "lead-export",
    details: `Filter: ${activeFilter}\nRows: ${rows.length}`,
    eventGroup: "privacy",
    sensitive: true,
    summary: `Lead export created from the ${activeFilter} queue (${rows.length} rows).`,
    target: {
      collection: "leads",
      id: activeFilter,
      label: `filter:${activeFilter}`,
    },
  });

  return {
    activeFilter,
    csv: [toCsvLine(header), ...rows].join("\n"),
    totalRows: rows.length,
  };
}
