import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type PayloadRequest } from "payload";

import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { syncInquiryFormsAndSampleLeads } from "../lib/payload/inquiry-seed.ts";
import {
  applyLeadInboxUpdate,
  canReadLeadsInbox,
  canExportLeadsInbox,
  exportLeadsInboxCsv,
  canUpdateLeadsInbox,
  getLeadsInboxSnapshot,
} from "../lib/payload/leads-inbox.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-leads-inbox-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function createReq(
  payload: Awaited<ReturnType<typeof getPayload>>,
  role: "owner" | "admin" | "lead-manager" | "content-editor",
) {
  const users = await payload.find({
    collection: "admin-users",
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
  });
  const existing = users.docs.find((entry) => entry.role === role);

  if (existing) {
    return {
      payload,
      user: {
        collection: "admin-users",
        email: existing.email,
        fullName: existing.fullName,
        id: existing.id,
        role,
      },
    } as Partial<PayloadRequest> as PayloadRequest;
  }

  const created = await payload.create({
    collection: "admin-users",
    data: {
      email: `${role}@montelar.example`,
      fullName: `${role} smoke`,
      password: "MontelarSmoke123!",
      role,
    },
    overrideAccess: true,
  });

  return {
    payload,
    user: {
      collection: "admin-users",
      email: created.email,
      fullName: created.fullName,
      id: created.id,
      role,
    },
  } as Partial<PayloadRequest> as PayloadRequest;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });
  const now = Date.now();
  const createdAtIso = new Date(now - 60 * 60 * 1000).toISOString();
  const nextActionIso = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const nextActionInput = nextActionIso.slice(0, 16);

  try {
    await syncCatalogHierarchyAndProducts(payload);
    await syncInquiryFormsAndSampleLeads(payload);

    const publicLead = await payload.create({
      collection: "leads",
      data: {
        consentAcceptedAt: "2026-05-10T14:00:00.000Z",
        consentLocale: "en",
        consentProfile: "product-inquiry-default",
        consentTextSnapshot: "Smoke consent snapshot.",
        country: "Netherlands",
        createdAt: createdAtIso,
        displayName: "Workspace Smoke Lead",
        email: "workspace-smoke@montelar.example",
        form: "vision-max-premium-en",
        lastStatusChangedAt: createdAtIso,
        leadType: "vision-max",
        latestActivitySummary: "Lead captured from public request smoke.",
        locale: "en",
        message: "Need a private cinema consultation.",
        partnerHandoffStatus: "not-applicable",
        priority: "urgent",
        product: "vision-max-premium",
        productCategory: "private-cinema",
        productDirection: "vision-max",
        referenceCode: "LD-20260510-WORKSPACE01",
        requestType: "consultation",
        resolution: "open",
        routingMode: "hq-direct",
        sourceChannel: "product-page",
        sourceOfTruthArtifact:
          "docs/strategy/artifacts/MNT-ADMIN-020-inquiry-forms-and-sample-leads-seed.md",
        sourcePagePath: "/en/request/vision-max-premium",
        sourcePageTitle: "Request Vision MAX Premium",
        status: "new",
        statusHistory: [
          {
            changedAt: createdAtIso,
            changedBy: "system-public-form",
            fromStatus: null,
            reason: "Public request smoke coverage.",
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
            valueText: "Workspace Smoke Lead",
          },
          {
            fieldKey: "email",
            fieldType: "email",
            label: "Email",
            leadMappingKey: "email",
            valueText: "workspace-smoke@montelar.example",
          },
        ],
        updatedAt: createdAtIso,
      },
      overrideAccess: true,
      showHiddenFields: true,
    });

    const leadManagerReq = await createReq(payload, "lead-manager");
    const contentEditorReq = await createReq(payload, "content-editor");

    assert.equal(canReadLeadsInbox(leadManagerReq), true);
    assert.equal(canUpdateLeadsInbox(leadManagerReq), true);
    assert.equal(canReadLeadsInbox(contentEditorReq), true);
    assert.equal(canUpdateLeadsInbox(contentEditorReq), false);

    const managerSnapshot = await getLeadsInboxSnapshot(payload, leadManagerReq, "new");
    const workspaceCard = managerSnapshot.cards.find((entry) => entry.referenceCode === publicLead.referenceCode);
    assert.ok(workspaceCard, "public lead should appear in the inbox snapshot");
    assert.equal(workspaceCard?.displayName, "Workspace Smoke Lead");
    assert.match(workspaceCard?.sourceLabel ?? "", /Страница продукта/);
    assert.equal(workspaceCard?.nextActionState, "unscheduled");

    const maskedSnapshot = await getLeadsInboxSnapshot(payload, contentEditorReq, "new");
    const maskedCard = maskedSnapshot.cards.find((entry) => entry.referenceCode === publicLead.referenceCode);
    assert.ok(maskedCard, "masked role should still see workflow card");
    assert.equal(maskedCard?.displayName, "");
    assert.equal(maskedCard?.submittedFields.length, 0);
    assert.equal(maskedSnapshot.canExport, false);
    assert.equal(maskedCard?.sourcePagePath, "/en/request/vision-max-premium");

    await applyLeadInboxUpdate(payload, leadManagerReq, publicLead.id, {
      assignedTeam: "concierge",
      assignedToUser: "lead-manager@montelar.example",
      nextActionAt: nextActionInput,
      note: "Qualified after first call.",
      priority: "vip",
      status: "qualified",
    });

    const refreshed = await payload.findByID({
      collection: "leads",
      id: publicLead.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    assert.equal(refreshed.status, "qualified");
    assert.equal(refreshed.priority, "vip");
    assert.equal(refreshed.assignedTeam, "concierge");
    const refreshedRecord = refreshed as unknown as { activityTimeline?: unknown[]; ownerNotes?: unknown };
    assert.equal(Array.isArray(refreshedRecord.activityTimeline), true);
    assert.equal((refreshedRecord.activityTimeline ?? []).length >= 2, true);
    assert.equal((refreshed.statusHistory ?? []).length >= 2, true);
    assert.match(String(refreshedRecord.ownerNotes), /Qualified after first call/);

    const ownerReq = await createReq(payload, "owner");
    const adminReq = await createReq(payload, "admin");
    assert.equal(canExportLeadsInbox(adminReq), true);
    assert.equal(canExportLeadsInbox(leadManagerReq), false);

    const activeSnapshot = await getLeadsInboxSnapshot(payload, leadManagerReq, "in-progress");
    const activeCard = activeSnapshot.cards.find((entry) => entry.referenceCode === publicLead.referenceCode);
    assert.ok(activeCard, "updated lead should move into in-progress queue");
    assert.notEqual(activeCard?.nextActionState, "overdue");
    assert.notEqual(activeCard?.nextActionState, "unscheduled");
    assert.match(activeCard?.nextActionLabel ?? "", /Запланировано|Связаться сегодня/);

    const exported = await exportLeadsInboxCsv(payload, ownerReq, "all");
    assert.match(exported.csv, /referenceCode,status,priority/);
    assert.match(exported.csv, /LD-20260510-WORKSPACE01/);

    const auditEvents = await payload.find({
      collection: "audit-events",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      where: {
        action: {
          equals: "lead-export",
        },
      },
    });
    assert.equal(auditEvents.docs.length >= 1, true);
    const exportAudit = auditEvents.docs[0] as {
      actionLabel?: unknown;
      eventGroupLabel?: unknown;
      summary?: unknown;
    };
    assert.equal(exportAudit.actionLabel, "Lead export");
    assert.equal(exportAudit.eventGroupLabel, "Privacy and exports");
    assert.match(String(exportAudit.summary), /Lead export created from the all queue/);

    console.log("leads-inbox-smoke: ok");
  } finally {
    await rm(localSmokeDatabasePath, { force: true });
  }
}

void main();
