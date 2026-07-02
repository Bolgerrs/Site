import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

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

export type LeadNotificationDispatchInput = {
  assignedTeam: string;
  assignedToUser: string | null;
  leadPath: string;
  leadType: string;
  locale: string;
  notificationRecipients: string[];
  product: string;
  referenceCode: string;
  requestType: string;
  routingRuleKey: string | null;
  safeTargetApplied: boolean;
  sourcePagePath: string;
  submissionChannel: string;
  templateKey: string | null;
};

type LeadNotificationEvent = {
  assignedTeam: string;
  assignedToUser: string | null;
  createdAt: string;
  deliveryMode: LeadNotificationAttempt["deliveryMode"];
  error: string | null;
  leadPath: string;
  leadSummary: {
    leadType: string;
    locale: string;
    product: string;
    referenceCode: string;
    requestType: string;
    routingRuleKey: string | null;
    sourcePagePath: string;
  };
  recipients: string[];
  referenceCode: string;
  responseStatus: number | null;
  safeTargetApplied: boolean;
  status: LeadNotificationAttempt["status"];
  submissionChannel: string;
  templateKey: string | null;
};

const leadStoreRoot = join(process.cwd(), "..", "..", ".tmp", "lead-intake");

function getWebhookUrl() {
  const value = process.env.MONTELAR_LEAD_NOTIFICATION_WEBHOOK_URL?.trim();
  return value?.length ? value : null;
}

function buildEventPaths(timestamp: string, referenceCode: string) {
  const dayToken = timestamp.slice(0, 10).replace(/-/g, "");
  const directory = join(leadStoreRoot, "notifications", dayToken);

  return {
    directory,
    eventPath: join(directory, `${referenceCode}.json`),
    ledgerPath: join(leadStoreRoot, "notifications.jsonl"),
  };
}

async function persistEvent(event: LeadNotificationEvent) {
  const paths = buildEventPaths(event.createdAt, event.referenceCode);

  await mkdir(paths.directory, { recursive: true });
  await writeFile(paths.eventPath, `${JSON.stringify(event, null, 2)}\n`, "utf8");
  await appendFile(
    paths.ledgerPath,
    `${JSON.stringify({
      createdAt: event.createdAt,
      deliveryMode: event.deliveryMode,
      path: paths.eventPath,
      recipients: event.recipients.length,
      referenceCode: event.referenceCode,
      safeTargetApplied: event.safeTargetApplied,
      status: event.status,
    })}\n`,
    "utf8",
  );

  return paths.eventPath;
}

function buildBaseEvent(input: LeadNotificationDispatchInput, attemptedAt: string): LeadNotificationEvent {
  return {
    assignedTeam: input.assignedTeam,
    assignedToUser: input.assignedToUser,
    createdAt: attemptedAt,
    deliveryMode: "outbox-only",
    error: null,
    leadPath: input.leadPath,
    leadSummary: {
      leadType: input.leadType,
      locale: input.locale,
      product: input.product,
      referenceCode: input.referenceCode,
      requestType: input.requestType,
      routingRuleKey: input.routingRuleKey,
      sourcePagePath: input.sourcePagePath,
    },
    recipients: input.notificationRecipients,
    referenceCode: input.referenceCode,
    responseStatus: null,
    safeTargetApplied: input.safeTargetApplied,
    status: "outbox-recorded",
    submissionChannel: input.submissionChannel,
    templateKey: input.templateKey,
  };
}

export async function dispatchLeadNotificationEvent(
  input: LeadNotificationDispatchInput,
): Promise<LeadNotificationAttempt> {
  const webhookUrl = getWebhookUrl();
  const attemptedAt = new Date().toISOString();
  const shouldAttemptWebhook =
    Boolean(webhookUrl) &&
    (input.submissionChannel === "cms-lead-plus-email" || input.submissionChannel === "email-only-temp");
  const baseEvent = buildBaseEvent(input, attemptedAt);

  if (!shouldAttemptWebhook || !webhookUrl) {
    const eventPath = await persistEvent(baseEvent);
    return {
      attemptedAt,
      deliveryMode: "outbox-only",
      error: null,
      eventPath,
      recipients: input.notificationRecipients,
      responseStatus: null,
      safeTargetApplied: input.safeTargetApplied,
      status: "outbox-recorded",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({
        assignedTeam: input.assignedTeam,
        assignedToUser: input.assignedToUser,
        lead: baseEvent.leadSummary,
        recipients: input.notificationRecipients,
        safeTargetApplied: input.safeTargetApplied,
        templateKey: input.templateKey,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const event: LeadNotificationEvent = {
      ...baseEvent,
      deliveryMode: "webhook",
      error: response.ok ? null : `Webhook returned HTTP ${response.status}.`,
      responseStatus: response.status,
      status: response.ok ? "delivered" : "failed",
    };
    const eventPath = await persistEvent(event);

    return {
      attemptedAt,
      deliveryMode: "webhook",
      error: event.error,
      eventPath,
      recipients: input.notificationRecipients,
      responseStatus: response.status,
      safeTargetApplied: input.safeTargetApplied,
      status: event.status,
    };
  } catch (error) {
    const event: LeadNotificationEvent = {
      ...baseEvent,
      deliveryMode: "webhook",
      error: error instanceof Error ? error.message : "Webhook delivery failed.",
      status: "failed",
    };
    const eventPath = await persistEvent(event);

    return {
      attemptedAt,
      deliveryMode: "webhook",
      error: event.error,
      eventPath,
      recipients: input.notificationRecipients,
      responseStatus: null,
      safeTargetApplied: input.safeTargetApplied,
      status: "failed",
    };
  }
}
