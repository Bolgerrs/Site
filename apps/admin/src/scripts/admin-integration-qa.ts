import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type PayloadRequest } from "payload";

import {
  auditHistoryAccess,
  exportSensitiveAccess,
  leadPiiAccess,
  publishingAccess,
} from "../lib/payload/access.ts";
import {
  applyLeadInboxUpdate,
  getLeadsInboxSnapshot,
} from "../lib/payload/leads-inbox.ts";
import { getInternalProductInquiryForm, getPublicCmsSnapshot } from "../lib/payload/public-cms.ts";
import { syncPublicCmsBaseline } from "../lib/payload/public-cms-baseline.ts";
import {
  applyTranslationWorkspaceUpdate,
  getTranslationsWorkspaceSnapshot,
} from "../lib/payload/translations-workspace.ts";
import type { AdminLocale } from "../lib/payload/locales.ts";
import type { AdminRole } from "../lib/payload/roles.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(
  appRoot,
  ".tmp",
  `payload-admin-integration-qa-smoke-${process.pid}.db`,
);
const localSmokeDatabaseUrl = `file:${localSmokeDatabasePath}?busy_timeout=5000`;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = localSmokeDatabaseUrl;
}

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;

async function createReq(payload: PayloadInstance, role: AdminRole) {
  const users = await payload.find({
    collection: "admin-users",
    depth: 0,
    limit: 20,
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
      fullName: `${role} integration smoke`,
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
  await rm(localSmokeDatabasePath, { force: true });
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: false });

  try {
    const firstRun = await syncPublicCmsBaseline(payload);
    const secondRun = await syncPublicCmsBaseline(payload);

    assert.equal(firstRun.launchLocaleCount, 7);
    assert.equal(firstRun.inquiry.formCount, 13);
    assert.equal(firstRun.inquiry.sampleLeadCount, 4);
    assert.equal(firstRun.seoCount, 4);
    assert.equal(firstRun.translationCount, 3);
    assert.equal(secondRun.seoOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.translationOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.publishedProductOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.inquiry.formOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.inquiry.leadOperations.every((entry) => entry.operation === "updated"), true);

    const ownerReq = await createReq(payload, "owner");
    const adminReq = await createReq(payload, "admin");
    const translatorReq = await createReq(payload, "translator");
    const leadManagerReq = await createReq(payload, "lead-manager");
    const contentEditorReq = await createReq(payload, "content-editor");
    const developerReq = await createReq(payload, "developer");

    assert.equal(await publishingAccess({ req: adminReq }), true);
    assert.equal(await publishingAccess({ req: translatorReq }), false);
    assert.equal(await leadPiiAccess({ req: leadManagerReq }), true);
    assert.equal(await leadPiiAccess({ req: contentEditorReq }), false);
    assert.equal(await auditHistoryAccess({ req: developerReq }), true);
    assert.equal(await auditHistoryAccess({ req: adminReq }), false);
    assert.equal(await exportSensitiveAccess({ req: ownerReq }), true);
    assert.equal(await exportSensitiveAccess({ req: leadManagerReq }), false);

    const draftProducts = await payload.find({
      collection: "products",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
      where: {
        status: {
          equals: "draft",
        },
      },
    });
    const draftProduct = draftProducts.docs[0];

    assert.ok(draftProduct, "Expected a seeded draft product for publish-path QA.");

    const prePublishSnapshot = await getPublicCmsSnapshot(payload, "en");
    assert.equal(
      prePublishSnapshot.products.some((entry) => entry.slug === draftProduct.slug),
      false,
      "Draft products must not appear in the public snapshot before publish.",
    );

    const reviewProduct = await payload.update({
      collection: "products",
      data: {
        status: "review",
      },
      draft: false,
      id: draftProduct.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const primaryLocale = String(reviewProduct.primaryLocale || "en") as AdminLocale;
    const existingForms = await payload.find({
      collection: "productInquiryForms",
      depth: 0,
      limit: 5,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      where: {
        and: [
          {
            product: {
              equals: reviewProduct.id,
            },
          },
          {
            locale: {
              equals: primaryLocale,
            },
          },
        ],
      },
    });
    const primaryForm = existingForms.docs[0]
      ? await payload.update({
          collection: "productInquiryForms",
          data: {
            approvalStatus: "approved",
            isPrimaryForLocale: true,
            sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-ADMIN-039-admin-integration-qa.md",
            status: "published",
          },
          draft: false,
          id: existingForms.docs[0].id,
          overrideAccess: true,
          showHiddenFields: true,
        })
      : await payload.create({
          collection: "productInquiryForms",
          data: {
            approvalStatus: "approved",
            consentProfile: "product-inquiry-default",
            consentText: "I agree to Montelar privacy review and advisory follow-up.",
            description: "Integration QA primary inquiry form.",
            fields: [
              {
                fieldKey: "full-name",
                fieldType: "text",
                label: "Full name",
                leadMappingKey: "full-name",
                required: true,
                width: "full",
              },
            ],
            formMode: "product-inquiry",
            internalCode: `${String(reviewProduct.internalCode)}-FORM-${primaryLocale.toUpperCase()}`,
            isPrimaryForLocale: true,
            layoutMode: "single-column",
            locale: primaryLocale,
            notificationEmails: [{ email: "concierge@montelar.example" }],
            allowedVariantModes: "product-only",
            documentContextMode: "none",
            primaryLocale,
            privacyNoticeLinkMode: "global-policy",
            product: reviewProduct.id,
            slug: `${String(reviewProduct.slug)}-${primaryLocale}`,
            sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-ADMIN-039-admin-integration-qa.md",
            status: "published",
            submissionChannel: "cms-lead",
            submitLabel: "Request consultation",
            successRedirectMode: "inline-message",
            successMessage: "Request received.",
            successTitle: "Request received",
            title: `${String(reviewProduct.publicLabel ?? reviewProduct.name)} inquiry`,
          },
          draft: false,
          overrideAccess: true,
          showHiddenFields: true,
        });

    assert.ok(primaryForm, "Expected a valid primary inquiry form before publishing a product.");

    const publishedProduct = await payload.update({
      collection: "products",
      data: {
        publicationNotes: "Published by MNT-ADMIN-039 integration QA smoke.",
        status: "published",
      },
      draft: false,
      id: draftProduct.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const postPublishSnapshot = await getPublicCmsSnapshot(payload, "en");
    const publicProduct = postPublishSnapshot.products.find((entry) => entry.slug === publishedProduct.slug);
    const publicForm = postPublishSnapshot.inquiryForms.find((entry) => entry.productSlug === publishedProduct.slug);
    const internalForm = await getInternalProductInquiryForm(payload, "en", String(publishedProduct.slug));

    assert.ok(publicProduct, "Published product should appear in the public snapshot.");
    assert.ok(publicForm, "Published product should expose a public inquiry form.");
    assert.ok(internalForm, "Internal serializer should still resolve the inquiry form.");
    assert.equal(publicForm?.notificationEmails, undefined);
    assert.equal(publicForm?.fields[0]?.leadMappingKey, undefined);
    assert.equal(Array.isArray(internalForm?.notificationEmails), true);
    assert.equal(typeof internalForm?.fields[0]?.leadMappingKey, "string");
    const publishAuditEvents = await payload.find({
      collection: "audit-events",
      depth: 0,
      limit: 5,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          {
            action: {
              equals: "publish",
            },
          },
          {
            targetCollection: {
              equals: "products",
            },
          },
          {
            targetId: {
              equals: String(publishedProduct.id),
            },
          },
        ],
      },
    });
    assert.equal(publishAuditEvents.docs.length >= 1, true);
    const publishAudit = publishAuditEvents.docs[0] as {
      actionLabel?: unknown;
      eventGroupLabel?: unknown;
      summary?: unknown;
    };
    assert.equal(publishAudit.actionLabel, "Published");
    assert.equal(publishAudit.eventGroupLabel, "Publish and status changes");
    assert.match(String(publishAudit.summary), /Product status changed: review -> published\./);

    const seededLeads = await payload.find({
      collection: "leads",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      sort: "referenceCode",
      where: {
        status: {
          equals: "new",
        },
      },
    });
    const lead = seededLeads.docs[0];

    assert.ok(lead, "Expected at least one seeded new lead for workflow QA.");

    const leadManagerSnapshot = await getLeadsInboxSnapshot(payload, leadManagerReq, "new");
    const editorSnapshot = await getLeadsInboxSnapshot(payload, contentEditorReq, "new");
    const leadManagerCard = leadManagerSnapshot.cards.find((entry) => entry.referenceCode === lead.referenceCode);
    const editorCard = editorSnapshot.cards.find((entry) => entry.referenceCode === lead.referenceCode);

    assert.ok(leadManagerCard, "Lead manager should see the new lead in the inbox.");
    assert.equal(Boolean(leadManagerCard?.displayName), true);
    assert.equal(typeof leadManagerCard?.sourceLabel, "string");
    assert.ok(editorCard, "Content editor should still see a workflow card.");
    assert.equal(editorCard?.displayName, "");
    assert.equal(editorCard?.submittedFields.length, 0);
    assert.equal(editorSnapshot.canExport, false);

    await applyLeadInboxUpdate(payload, leadManagerReq, lead.id, {
      assignedTeam: "concierge",
      assignedToUser: "lead-manager@montelar.example",
      nextActionAt: "2026-05-11T09:30",
      note: "Qualified after first integration QA review.",
      priority: "vip",
      status: "qualified",
    });

    const refreshedLead = await payload.findByID({
      collection: "leads",
      id: lead.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    assert.equal(refreshedLead.status, "qualified");
    assert.equal(refreshedLead.priority, "vip");
    assert.equal(refreshedLead.assignedTeam, "concierge");
    assert.equal((refreshedLead.statusHistory ?? []).length >= 2, true);

    const translatorWorkspace = await getTranslationsWorkspaceSnapshot(payload, translatorReq, {
      filter: "all",
      locale: "fr",
      ownerCollection: "pages",
      ownerKey: "home",
      q: null,
    });
    const adminWorkspace = await getTranslationsWorkspaceSnapshot(payload, adminReq, {
      filter: "all",
      locale: "fr",
      ownerCollection: "pages",
      ownerKey: "home",
      q: null,
    });
    const translationCard = adminWorkspace.cards.find(
      (entry) => entry.ownerCollection === "pages" && entry.ownerKey === "home" && entry.targetLocale === "fr",
    );
    const frenchLocale = await payload.find({
      collection: "locales",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        code: {
          equals: "fr",
        },
      },
    });
    const translationRecords = await payload.find({
      collection: "translations",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      where: {
        and: [
          {
            ownerCollection: {
              equals: "pages",
            },
          },
          {
            ownerRecordKey: {
              equals: "home",
            },
          },
          {
            targetLocale: {
              equals: frenchLocale.docs[0]?.id,
            },
          },
        ],
      },
    });
    const translationRecord = translationRecords.docs[0];

    assert.ok(translationCard, "Expected seeded homepage translation card for FR locale.");
    assert.ok(translationRecord, "Expected a persisted homepage translation record for FR locale.");
    assert.equal(translatorWorkspace.canPublish, false);
    assert.equal(adminWorkspace.canPublish, true);

    await applyTranslationWorkspaceUpdate(payload, adminReq, translationRecord.id, {
      changeReason: "Approve translation in integration QA smoke.",
      internalNotes: "Approved by admin integration QA smoke.",
      publishReadiness: "ready-with-fallback",
      reviewerAssigneeId: adminReq.user?.id ?? null,
      status: "approved",
      translatorAssigneeId: translatorReq.user?.id ?? null,
      workflowStage: "ready-for-publish",
    });

    await applyTranslationWorkspaceUpdate(payload, adminReq, translationRecord.id, {
      changeReason: "Publish translation in integration QA smoke.",
      internalNotes: "Published by admin integration QA smoke.",
      publishReadiness: "ready-with-fallback",
      reviewerAssigneeId: adminReq.user?.id ?? null,
      status: "published",
      translatorAssigneeId: translatorReq.user?.id ?? null,
      workflowStage: "ready-for-publish",
    });

    const publishedTranslation = await payload.findByID({
      collection: "translations",
      id: translationRecord.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    assert.equal(publishedTranslation.status, "published");
    assert.equal(
      typeof publishedTranslation.reviewerAssignee === "object"
        ? publishedTranslation.reviewerAssignee?.id
        : publishedTranslation.reviewerAssignee,
      adminReq.user?.id ?? null,
    );

    console.log(
      JSON.stringify(
        {
          accessRolesChecked: ["admin", "translator", "lead-manager", "content-editor", "developer", "owner"],
          leadWorkflowStatus: refreshedLead.status,
          publicSnapshotProducts: postPublishSnapshot.products.length,
          publicSnapshotForms: postPublishSnapshot.inquiryForms.length,
          publishedProductSlug: publishedProduct.slug,
          publishedTranslationId: publishedTranslation.id,
          seedIdempotent: true,
        },
        null,
        2,
      ),
    );
  } finally {
    await payload.destroy();

    if (process.env.DATABASE_URL === localSmokeDatabaseUrl) {
      await rm(localSmokeDatabasePath, { force: true });
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
