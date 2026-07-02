import { appendLeadStatusLedger, loadLeadRecord, updateLeadRecord } from "@/lib/leads/lead-store";
import type { LeadStatusHistoryEntry, StoredLead } from "@/lib/leads/lead-types";

export const LEAD_STATUS_VALUES = [
  "new",
  "reviewed",
  "contacted",
  "qualified",
  "proposal_in_progress",
  "closed",
  "spam",
] as const;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

type LeadStatusTransitionPayload = {
  referenceCode: string;
  status: string;
  changedBy?: string | null;
  reason?: string | null;
  note?: string | null;
  nextActionAt?: string | null;
  assignedTeam?: string | null;
  assignedToUser?: string | null;
  assignedPartnerLabel?: string | null;
};

export type LeadStatusTransitionResult =
  | {
      ok: true;
      status: 200;
      lead: {
        referenceCode: string;
        status: LeadStatus;
        previousStatus: LeadStatus;
        priority: string;
        assignedTeam: string;
        assignedToUser: string | null;
        assignedPartnerLabel: string | null;
        partnerHandoffStatus: string;
        routingMode: string;
        resolution: string;
        resolutionReason: string | null;
        nextActionAt: string | null;
        lastStatusChangedAt: string;
        latestActivitySummary: string;
      };
    }
  | {
      ok: false;
      status: 400 | 404 | 409;
      error: string;
    };

const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ["reviewed", "contacted", "spam"],
  reviewed: ["contacted", "qualified", "closed", "spam"],
  contacted: ["qualified", "proposal_in_progress", "closed", "spam"],
  qualified: ["proposal_in_progress", "closed", "spam"],
  proposal_in_progress: ["closed", "spam"],
  closed: [],
  spam: [],
};

const TERMINAL_STATUSES = new Set<LeadStatus>(["closed", "spam"]);
const TERMINAL_REASONS_REQUIRED = new Set<LeadStatus>(["spam"]);

function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUS_VALUES.includes(value as LeadStatus);
}

function normalizeLegacyStatus(status: string): LeadStatus {
  const aliases: Record<string, LeadStatus> = {
    appointment_confirmed: "qualified",
    appointment_requested: "contacted",
    assigned_to_partner: "reviewed",
    disqualified: "closed",
    lost: "closed",
    needs_more_info: "reviewed",
    partner_contacted: "contacted",
    proposal_sent: "proposal_in_progress",
    routed_to_hq: "reviewed",
    site_survey_planned: "qualified",
    support_closed: "closed",
    support_in_progress: "contacted",
    triage: "reviewed",
    won: "closed",
  };

  return aliases[status] ?? (isLeadStatus(status) ? status : "new");
}

function isIsoTimestamp(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function normalizeStoredLead(rawLead: StoredLead): StoredLead & {
  statusHistory: LeadStatusHistoryEntry[];
} {
  const lead = rawLead as StoredLead & {
    statusHistory?: LeadStatusHistoryEntry[];
  };

  return {
    ...lead,
    status: normalizeLegacyStatus(lead.status),
    statusHistory: Array.isArray(lead.statusHistory)
      ? lead.statusHistory
      : [
          {
            from: null,
            to: normalizeLegacyStatus(lead.status),
            changedAt: lead.createdAt,
            changedBy: "system-public-form",
            reason: "Lead created from the public inquiry flow.",
            note: null,
            source: "public-form-submit",
          },
        ],
  };
}

async function loadLead(referenceCode: string) {
  const rawLead = await loadLeadRecord(referenceCode);
  return rawLead ? normalizeStoredLead(rawLead) : null;
}

function validateTransition(
  lead: StoredLead & { statusHistory: LeadStatusHistoryEntry[] },
  nextStatus: LeadStatus,
  reason: string | null,
) {
  const currentStatus = lead.status as LeadStatus;

  if (currentStatus === nextStatus) {
    return "Lead is already in the requested status.";
  }

  const allowedStatuses = TRANSITIONS[currentStatus];
  if (!allowedStatuses?.includes(nextStatus)) {
    return `Transition ${currentStatus} -> ${nextStatus} is not allowed in the current workflow.`;
  }

  if (nextStatus === "qualified" && lead.partnerHandoffStatus === "pending-review") {
    if (!lead.dealerSharingConsent) {
      return "Dealer-sharing consent is required before qualifying a partner-routed lead.";
    }
  }

  if (TERMINAL_REASONS_REQUIRED.has(nextStatus) && !reason) {
    return `A reason is required when moving a lead to ${nextStatus}.`;
  }

  return null;
}

function buildActivitySummary(previousStatus: LeadStatus, nextStatus: LeadStatus, note: string | null) {
  const baseSummary = `Lead workflow moved from ${previousStatus} to ${nextStatus}.`;
  return note ? `${baseSummary} ${note}` : baseSummary;
}

function updateResolution(lead: StoredLead, nextStatus: LeadStatus, reason: string | null) {
  if (!TERMINAL_STATUSES.has(nextStatus)) {
    lead.resolution = "open";
    lead.resolutionReason = null;
    return;
  }

  if (nextStatus === "spam") {
    lead.resolution = "spam";
    lead.resolutionReason = reason;
    lead.spamReviewState = "confirmed-spam";
    return;
  }

  lead.resolution = "won";
  lead.resolutionReason = reason;
}

function updateRoutingState(
  lead: StoredLead,
  nextStatus: LeadStatus,
  assignedPartnerLabel: string | null,
) {
  if (nextStatus === "qualified" && lead.routingMode === "partner-candidate") {
    lead.routingMode = "partner-assigned";
    lead.partnerHandoffStatus = "approved-to-share";
  } else if (nextStatus === "reviewed" && lead.routingMode !== "service-desk") {
    lead.routingMode = "hq-direct";
    if (lead.partnerHandoffStatus === "pending-review") {
      lead.partnerHandoffStatus = "not-applicable";
    }
  }

  if (assignedPartnerLabel) {
    lead.assignedPartnerLabel = assignedPartnerLabel;
  }
}

async function appendStatusLedger(
  lead: StoredLead & { statusHistory: LeadStatusHistoryEntry[] },
  entry: LeadStatusHistoryEntry,
) {
  await appendLeadStatusLedger(lead, entry);
}

export async function transitionLeadStatus(
  payload: LeadStatusTransitionPayload,
): Promise<LeadStatusTransitionResult> {
  if (typeof payload.referenceCode !== "string" || !payload.referenceCode.trim()) {
    return {
      ok: false,
      status: 400,
      error: "Lead reference code is required.",
    };
  }

  if (!isLeadStatus(payload.status)) {
    return {
      ok: false,
      status: 400,
      error: "Requested lead status is invalid.",
    };
  }

  const lead = await loadLead(payload.referenceCode.trim());
  if (!lead) {
    return {
      ok: false,
      status: 404,
      error: "Lead could not be found in the current preview store.",
    };
  }

  const reason = payload.reason?.trim() || null;
  const note = payload.note?.trim() || null;
  const transitionError = validateTransition(lead, payload.status, reason);

  if (transitionError) {
    return {
      ok: false,
      status: 409,
      error: transitionError,
    };
  }

  if (payload.nextActionAt !== undefined && payload.nextActionAt !== null) {
    const nextActionAt = payload.nextActionAt.trim();
    if (!isIsoTimestamp(nextActionAt)) {
      return {
        ok: false,
        status: 400,
        error: "nextActionAt must be a valid ISO timestamp when provided.",
      };
    }
  }

  const previousStatus = lead.status as LeadStatus;
  const changedAt = new Date().toISOString();
  const changedBy = payload.changedBy?.trim() || "admin-preview-api";
  const entry: LeadStatusHistoryEntry = {
    from: previousStatus,
    to: payload.status,
    changedAt,
    changedBy,
    reason,
    note,
    source: "admin-status-api",
  };

  lead.status = payload.status;
  lead.updatedAt = changedAt;
  lead.lastStatusChangedAt = changedAt;
  lead.latestActivitySummary = buildActivitySummary(previousStatus, payload.status, note);
  lead.statusHistory.push(entry);

  if (payload.nextActionAt !== undefined) {
    lead.nextActionAt = payload.nextActionAt ? payload.nextActionAt.trim() : null;
  }

  if (payload.assignedTeam !== undefined && payload.assignedTeam !== null) {
    lead.assignedTeam = payload.assignedTeam.trim() || lead.assignedTeam;
  }

  if (payload.assignedToUser !== undefined) {
    lead.assignedToUser = payload.assignedToUser?.trim() || null;
  }

  updateRoutingState(lead, payload.status, payload.assignedPartnerLabel?.trim() || null);
  updateResolution(lead, payload.status, reason);

  await updateLeadRecord(lead);
  await appendStatusLedger(lead, entry);

  return {
    ok: true,
    status: 200,
    lead: {
      referenceCode: lead.referenceCode,
      status: payload.status,
      previousStatus,
      priority: lead.priority,
      assignedTeam: lead.assignedTeam,
      assignedToUser: lead.assignedToUser,
      assignedPartnerLabel: lead.assignedPartnerLabel,
      partnerHandoffStatus: lead.partnerHandoffStatus,
      routingMode: lead.routingMode,
      resolution: lead.resolution,
      resolutionReason: lead.resolutionReason,
      nextActionAt: lead.nextActionAt,
      lastStatusChangedAt: lead.lastStatusChangedAt,
      latestActivitySummary: lead.latestActivitySummary,
    },
  };
}
