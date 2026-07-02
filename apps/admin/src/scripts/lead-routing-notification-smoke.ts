import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type PayloadRequest } from "payload";

import { dispatchLeadNotificationEvent } from "../../../web/src/lib/leads/lead-notification-core.ts";
import { resolveLeadRouting } from "../../../web/src/lib/leads/lead-routing-core.ts";
import { getLeadsInboxSnapshot } from "../lib/payload/leads-inbox.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-lead-routing-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function createReq(
  payload: Awaited<ReturnType<typeof getPayload>>,
  role: "owner" | "lead-manager",
) {
  const existing = await payload.find({
    collection: "admin-users",
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
  });
  const user = existing.docs.find((entry) => entry.role === role)
    ?? (await payload.create({
      collection: "admin-users",
      data: {
        email: `${role}@montelar.example`,
        fullName: `${role} smoke`,
        password: "MontelarSmoke123!",
        role,
      },
      overrideAccess: true,
    }));

  return {
    payload,
    user: {
      collection: "admin-users",
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      role,
    },
  } as Partial<PayloadRequest> as PayloadRequest;
}

async function createWebhookProbe() {
  const captured: Array<Record<string, unknown>> = [];

  const server = createServer((request, response) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      captured.push(body ? (JSON.parse(body) as Record<string, unknown>) : {});
      response.writeHead(202, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");

  return {
    captured,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    url: `http://127.0.0.1:${address.port}/notify`,
  };
}

async function main() {
  const tempLeadDir = await mkdtemp(path.join(os.tmpdir(), "montelar-lead-routing-"));
  const probe = await createWebhookProbe();
  process.env.MONTELAR_LEAD_NOTIFICATION_WEBHOOK_URL = probe.url;
  process.env.MONTELAR_LEAD_NOTIFICATION_SAFE_TARGET = "safe-ops@montelar.example";
  process.env.MONTELAR_AUDIO_LEAD_OWNER = "audio-owner@montelar.example";

  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    const routing = resolveLeadRouting({
      country: "Netherlands",
      fallbackAssignedTeam: "audio",
      fallbackNotificationRecipients: ["audio.concierge@montelar.example"],
      leadType: "private_listening",
      locale: "en",
      productDirection: "hi-end-audio",
      requestType: "consultation",
    });

    assert.equal(routing.routingRuleKey, "audio-europe");
    assert.equal(routing.assignedToUser, "audio-owner@montelar.example");
    assert.equal(routing.safeTargetApplied, true);
    assert.deepEqual(routing.notificationRecipients, ["safe-ops@montelar.example"]);

    const lead = await payload.create({
      collection: "leads",
      data: {
        assignedTeam: routing.assignedTeam,
        assignedToUser: routing.assignedToUser,
        consentAcceptedAt: "2026-05-10T16:00:00.000Z",
        consentLocale: "en",
        consentProfile: "product-inquiry-default",
        consentTextSnapshot: "Routing smoke consent snapshot.",
        country: "Netherlands",
        createdAt: "2026-05-10T16:00:00.000Z",
        displayName: "Routing Smoke Lead",
        email: "routing-smoke@montelar.example",
        form: "monolith-reference-en",
        internalTags: [{ tag: "hi-end-audio" }, { tag: "safe-target" }],
        lastStatusChangedAt: "2026-05-10T16:00:00.000Z",
        leadType: "private_listening",
        latestActivitySummary: "Lead captured from routing smoke coverage.",
        locale: "en",
        message: "Need a routed listening room consultation.",
        notificationAttempts: [],
        notificationDeliveryMode: "not-run",
        notificationRecipients: routing.notificationRecipients.map((email) => ({ email })),
        notificationStatus: "pending",
        partnerHandoffStatus: routing.partnerHandoffStatus,
        preferredContactMethod: "email",
        priority: "high",
        product: "monolith-reference",
        productCategory: "speakers",
        productDirection: "hi-end-audio",
        qualificationSnapshot: [
          {
            key: "roomType",
            valueText: "dedicated-listening-room",
          },
        ],
        referenceCode: "LD-20260510-ROUTE01",
        requestType: "consultation",
        resolution: "open",
        routingMode: routing.routingMode,
        routingRuleKey: routing.routingRuleKey,
        routingSuggestion: routing.routingSuggestion,
        sourceChannel: "product-page",
        sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-ADMIN-035-lead-routing-and-notifications.md",
        sourcePagePath: "/en/request/monolith-reference",
        sourcePageTitle: "Request Monolith Reference consultation",
        status: "new",
        statusHistory: [
          {
            changedAt: "2026-05-10T16:00:00.000Z",
            changedBy: "system-public-form",
            fromStatus: null,
            reason: "Created from routing smoke coverage.",
            source: "public-form-submit",
            toStatus: "new",
          },
        ],
        submittedFieldSnapshot: [
          {
            fieldKey: "fullName",
            fieldType: "text",
            label: "Full name",
            leadMappingKey: "fullName",
            valueText: "Routing Smoke Lead",
          },
          {
            fieldKey: "email",
            fieldType: "email",
            label: "Email",
            leadMappingKey: "email",
            valueText: "routing-smoke@montelar.example",
          },
        ],
        submissionFingerprint: "routing-smoke-fingerprint-001",
        updatedAt: "2026-05-10T16:00:00.000Z",
      },
      overrideAccess: true,
      showHiddenFields: true,
    } as never);

    const notification = await dispatchLeadNotificationEvent({
      assignedTeam: routing.assignedTeam,
      assignedToUser: routing.assignedToUser,
      leadPath: path.join(tempLeadDir, "LD-20260510-ROUTE01.json"),
      leadType: "private_listening",
      locale: "en",
      notificationRecipients: routing.notificationRecipients,
      product: "monolith-reference",
      referenceCode: "LD-20260510-ROUTE01",
      requestType: "consultation",
      routingRuleKey: routing.routingRuleKey,
      safeTargetApplied: routing.safeTargetApplied,
      sourcePagePath: "/en/request/monolith-reference",
      submissionChannel: "cms-lead-plus-email",
      templateKey: "lead-monolith-reference",
    });

    await payload.update({
      id: lead.id,
      collection: "leads",
      data: {
        notificationAttempts: [
          {
            attemptedAt: notification.attemptedAt,
            deliveryMode: notification.deliveryMode,
            error: notification.error,
            eventPath: notification.eventPath,
            recipients: notification.recipients.map((email) => ({ email })),
            responseStatus: notification.responseStatus,
            safeTargetApplied: notification.safeTargetApplied,
            status: notification.status,
          },
        ],
        notificationDeliveryMode: notification.deliveryMode,
        notificationError: notification.error,
        notificationEventPath: notification.eventPath,
        notificationLastAttemptAt: notification.attemptedAt,
        notificationRecipients: notification.recipients.map((email) => ({ email })),
        notificationStatus: notification.status,
      },
      overrideAccess: true,
      showHiddenFields: true,
    } as never);

    assert.equal(notification.status, "delivered");
    assert.equal(probe.captured.length, 1);
    assert.deepEqual(probe.captured[0]?.recipients, ["safe-ops@montelar.example"]);
    assert.equal((probe.captured[0]?.lead as { referenceCode?: string }).referenceCode, "LD-20260510-ROUTE01");

    const eventBody = JSON.parse(await readFile(notification.eventPath, "utf8")) as Record<string, unknown>;
    assert.equal("leadSummary" in eventBody, true);
    assert.equal("payload" in eventBody, false);

    const leadManagerReq = await createReq(payload, "lead-manager");
    const snapshot = await getLeadsInboxSnapshot(payload, leadManagerReq, "new");
    const card = snapshot.cards.find((entry) => entry.referenceCode === "LD-20260510-ROUTE01");
    assert.ok(card, "routed lead should appear in inbox");
    assert.equal(card?.routingRuleKey, "audio-europe");
    assert.equal(card?.notificationStatus, "delivered");
    assert.equal(card?.notificationRecipientsCount, 1);
    assert.equal(card?.notificationSafeTargetApplied, true);
    assert.equal(card?.notificationAttempts.length, 1);

    console.log("lead-routing-notification-smoke: ok");
  } finally {
    await probe.close();
    await rm(tempLeadDir, { force: true, recursive: true });
    await rm(localSmokeDatabasePath, { force: true });
  }
}

void main();
