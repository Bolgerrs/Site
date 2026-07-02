import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-lead-intake-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });
  const created: Array<{ collection: "leads"; id: number | string }> = [];

  try {
    const lead = await payload.create({
      collection: "leads",
      data: {
        assignedTeam: "audio",
        consentAcceptedAt: "2026-05-10T10:00:00.000Z",
        consentLocale: "en",
        consentProfile: "product-inquiry-default",
        consentTextSnapshot: "I agree to the privacy review and advisory follow-up.",
        contextSnapshot: [
          {
            key: "productSlug",
            value: "monolith-reference",
          },
          {
            key: "sourcePagePath",
            value: "/en/request/monolith-reference",
          },
        ],
        country: "Netherlands",
        createdAt: "2026-05-10T10:00:00.000Z",
        displayName: "Test Concierge Lead",
        email: "test-lead@montelar.example",
        form: "monolith-reference-en",
        internalTags: [{ tag: "hi-end-audio" }, { tag: "private-audition" }],
        lastStatusChangedAt: "2026-05-10T10:00:00.000Z",
        leadType: "private_listening",
        latestActivitySummary: "Lead captured from smoke coverage.",
        locale: "en",
        message: "Need a system consultation for a dedicated listening room.",
        notificationDeliveryMode: "outbox-only",
        notificationRecipients: [{ email: "concierge@montelar.example" }],
        notificationStatus: "pending",
        partnerHandoffStatus: "not-applicable",
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
          {
            key: "dealerPreference",
            valueText: "direct-montelar",
          },
        ],
        referenceCode: "LD-20260510-SMOKE01",
        requestType: "private-listening",
        resolution: "open",
        routingMode: "hq-direct",
        sourceChannel: "product-page",
        sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-ADMIN-014-lead-intake-workflow-collections.md",
        sourcePagePath: "/en/request/monolith-reference",
        sourcePageTitle: "Request Monolith Reference consultation",
        status: "new",
        statusHistory: [
          {
            changedAt: "2026-05-10T10:00:00.000Z",
            changedBy: "system-public-form",
            fromStatus: null,
            reason: "Created from smoke coverage.",
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
            valueText: "Test Concierge Lead",
          },
          {
            fieldKey: "email",
            fieldType: "email",
            label: "Email",
            leadMappingKey: "email",
            valueText: "test-lead@montelar.example",
          },
          {
            fieldKey: "consent",
            fieldType: "consent",
            label: "I agree to the privacy review and advisory follow-up.",
            leadMappingKey: "consent",
            valueBoolean: true,
          },
        ],
        submissionFingerprint: "smoke-fingerprint-001",
        updatedAt: "2026-05-10T10:00:00.000Z",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "leads", id: lead.id });

    assert.equal(lead.referenceCode, "LD-20260510-SMOKE01");
    assert.equal(lead.status, "new");
    assert.equal(Array.isArray(lead.submittedFieldSnapshot), true);

    const updated = await payload.update({
      id: lead.id,
      collection: "leads",
      data: {
        latestActivitySummary: "Lead reviewed in smoke coverage.",
        status: "reviewed",
        statusHistory: [
          ...(Array.isArray(lead.statusHistory) ? lead.statusHistory : []),
          {
            changedAt: "2026-05-10T11:00:00.000Z",
            changedBy: "admin-smoke",
            fromStatus: "new",
            reason: "Smoke transition.",
            source: "admin-status-api",
            toStatus: "reviewed",
          },
        ],
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    assert.equal(updated.status, "reviewed");

    const refreshed = await payload.find({
      collection: "leads",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      where: {
        referenceCode: {
          equals: "LD-20260510-SMOKE01",
        },
      },
    });

    assert.equal(refreshed.docs.length, 1);
    assert.equal(refreshed.docs[0]?.product, "monolith-reference");
    assert.equal(refreshed.docs[0]?.statusHistory?.length, 2);

    console.log("lead-intake-smoke: ok");
  } finally {
    for (const doc of created.reverse()) {
      await payload.delete({
        id: doc.id,
        collection: doc.collection,
        overrideAccess: true,
      });
    }

    await rm(localSmokeDatabasePath, { force: true });
  }
}

void main();
