import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";
import { getFormsEditorSnapshot } from "../lib/payload/forms-editor.ts";
import { buildProductInquiryFormPreviewUrl } from "../lib/payload/preview-url.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-product-inquiry-forms-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function assertNoDirectRawHrefs(scope: string, hrefs: Array<string | undefined>) {
  const leaks = hrefs.filter((href): href is string => Boolean(href && isRawAdminHref(href)));
  assert.deepEqual(leaks, [], `${scope} should not expose direct raw collection hrefs.`);
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });
  const created: Array<{
    collection: "leads" | "product-directions" | "products" | "productInquiryForms";
    id: number | string;
  }> = [];

  try {
    const direction = await payload.create({
      collection: "product-directions",
      data: {
        canonicalPath: "/vision-max-forms",
        directionFamily: "vision",
        internalCode: "DIR_FORM_SMOKE_ACTIVE",
        name: "Vision MAX Forms",
        order: 20,
        primaryLocale: "en",
        publicLabel: "Vision MAX Forms",
        routeSegment: "vision-max-forms",
        shortDescription: "Private cinema direction for inquiry-form smoke coverage.",
        slug: "vision-max-forms",
        sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-009-product-inquiry-form-schema.md",
        status: "published",
        translationPriority: "high",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "product-directions", id: direction.id });

    let createPublishBlocked = false;

    try {
      await payload.create({
        collection: "products",
        data: {
          availabilityMode: "on-request",
          canonicalPath: "/products/vision-max-signature-blocked",
          direction: direction.id,
          internalCode: "PROD_FORM_SMOKE_BLOCKED",
          launchStage: "active",
          name: "Vision MAX Signature",
          order: 10,
          primaryLocale: "en",
          primaryInquiryType: "consultation",
          productKind: "system",
          publicLabel: "Vision MAX Signature",
          routeSegment: "vision-max-signature-blocked",
          requiresQualification: true,
          shortDescription: "Smoke product publish guardrail.",
          slug: "vision-max-signature-blocked",
          sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-009-product-inquiry-form-schema.md",
          status: "published",
          translationPriority: "high",
        },
        draft: false,
        overrideAccess: true,
        showHiddenFields: true,
      });
    } catch (error) {
      createPublishBlocked =
        error instanceof Error &&
        error.message.includes("attach and approve its primary inquiry form before publishing");
    }

    assert.equal(createPublishBlocked, true);

    const product = await payload.create({
      collection: "products",
      data: {
        availabilityMode: "on-request",
        canonicalPath: "/products/vision-max-private-room",
        direction: direction.id,
        internalCode: "PROD_FORM_SMOKE",
        launchStage: "active",
        name: "Vision MAX Private Room",
        order: 10,
        primaryLocale: "en",
        primaryInquiryType: "consultation",
        productKind: "system",
        publicLabel: "Vision MAX Private Room",
        routeSegment: "vision-max-private-room",
        requiresQualification: true,
        shortDescription: "Smoke product for inquiry-form collection coverage.",
        slug: "vision-max-private-room",
        sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-009-product-inquiry-form-schema.md",
        status: "review",
        translationPriority: "high",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "products", id: product.id });

    const form = await payload.create({
      collection: "productInquiryForms",
      data: {
        approvalStatus: "approved",
        consentProfile: "product-inquiry-default",
        consentText: "I agree to Montelar privacy review and advisory follow-up.",
        contextSnapshotKeys: [{ key: "product-slug" }, { key: "source-page" }],
        description: "Share room context and project timing for a guided cinema consultation.",
        fieldGroups: [
          {
            groupKey: "contact",
            groupType: "contact",
            title: "Contact",
          },
        ],
        fields: [
          {
            fieldKey: "full-name",
            fieldType: "text",
            label: "Full name",
            leadMappingKey: "full-name",
            required: true,
            width: "half",
          },
          {
            fieldKey: "email",
            fieldType: "email",
            label: "Email",
            leadMappingKey: "email",
            required: true,
            width: "half",
          },
          {
            fieldKey: "consent",
            fieldType: "consent",
            label: "I agree to Montelar privacy review and follow-up.",
            leadMappingKey: "consent",
            required: true,
            width: "full",
          },
        ],
        formMode: "product-inquiry",
        internalCode: "FORM_SMOKE_VM_EN",
        isPrimaryForLocale: true,
        layoutMode: "single-column",
        locale: "en",
        notificationEmails: [{ email: "concierge@montelar.example" }],
        allowedVariantModes: "product-only",
        documentContextMode: "none",
        privacyNoticeLinkMode: "global-policy",
        product: product.id,
        primaryLocale: "en",
        slug: "vision-max-private-room-en",
        sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-009-product-inquiry-form-schema.md",
        status: "published",
        submissionChannel: "cms-lead",
        submitLabel: "Request consultation",
        successRedirectMode: "inline-message",
        successMessage: "Our concierge team will review your request and respond with the next step.",
        successTitle: "Request received",
        title: "Plan your private room",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "productInquiryForms", id: form.id });

    assert.deepEqual(
      (form.submittedFieldSnapshotTemplate as Array<{ label?: string }>).map((entry) => entry.label),
      [
        "Full name",
        "Email",
        "I agree to Montelar privacy review and follow-up.",
      ],
    );

    const previewUrl = await buildProductInquiryFormPreviewUrl(
      form as unknown as Record<string, unknown>,
      {
        locale: "en",
        req: {
          payload,
        } as never,
        token: null,
      },
    );

    assert.equal(Boolean(previewUrl), true);
    assert.equal(previewUrl?.includes("/api/preview"), true);
    assert.equal(previewUrl?.includes("path=%2Fen%2Frequest%2Fvision-max-private-room"), true);

    const lead = await payload.create({
      collection: "leads",
      data: {
        consentAcceptedAt: "2026-05-10T12:00:00.000Z",
        consentLocale: "en",
        consentProfile: "product-inquiry-default",
        consentTextSnapshot: "I agree to Montelar privacy review and advisory follow-up.",
        country: "Netherlands",
        createdAt: "2026-05-10T12:00:00.000Z",
        displayName: "Forms Smoke Lead",
        form: "vision-max-private-room-en",
        leadType: "private-cinema",
        locale: "en",
        partnerHandoffStatus: "not-applicable",
        priority: "normal",
        product: "vision-max-private-room",
        referenceCode: "LD-20260510-FORMS01",
        resolution: "open",
        requestType: "consultation",
        routingMode: "hq-direct",
        sourceChannel: "product-page",
        sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-021-admin-forms-editor-ux.md",
        status: "new",
        submittedFieldSnapshot: [
          {
            fieldKey: "full-name",
            fieldType: "text",
            label: "Full name",
            leadMappingKey: "full-name",
            valueText: "Forms Smoke Lead",
          },
          {
            fieldKey: "email",
            fieldType: "email",
            label: "Email",
            leadMappingKey: "email",
            valueText: "forms-smoke@montelar.example",
          },
          {
            fieldKey: "consent",
            fieldType: "consent",
            label: "I agree to Montelar privacy review and follow-up.",
            leadMappingKey: "consent",
            valueBoolean: true,
          },
        ],
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "leads", id: lead.id });

    const updatedForm = await payload.update({
      id: form.id,
      collection: "productInquiryForms",
      data: {
        fields: [
          {
            fieldKey: "full-name",
            fieldType: "text",
            label: "Primary contact name",
            leadMappingKey: "full-name",
            required: true,
            width: "half",
          },
          {
            fieldKey: "email",
            fieldType: "email",
            label: "Email",
            leadMappingKey: "email",
            required: true,
            width: "half",
          },
          {
            fieldKey: "consent",
            fieldType: "consent",
            label: "I agree to Montelar privacy review and follow-up.",
            leadMappingKey: "consent",
            required: true,
            width: "full",
          },
        ],
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    assert.deepEqual(
      (updatedForm.submittedFieldSnapshotTemplate as Array<{ label?: string }>).map((entry) => entry.label),
      [
        "Primary contact name",
        "Email",
        "I agree to Montelar privacy review and follow-up.",
      ],
    );

    const formEditorSnapshot = await getFormsEditorSnapshot(payload, updatedForm);

    assertNoDirectRawHrefs(
      "forms editor linked workspaces",
      formEditorSnapshot.linkedWorkspaces.map((entry) => entry.href),
    );
    assertNoDirectRawHrefs(
      "forms editor checklist",
      formEditorSnapshot.checklist.map((entry) => entry.href),
    );
    assertNoDirectRawHrefs(
      "forms editor blockers",
      formEditorSnapshot.blockers.map((entry) => entry.href),
    );

    const refreshedLead = await payload.findByID({
      collection: "leads",
      id: lead.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    assert.deepEqual(
      (refreshedLead.submittedFieldSnapshot as Array<{ label?: string }>).map((entry) => entry.label),
      [
        "Full name",
        "Email",
        "I agree to Montelar privacy review and follow-up.",
      ],
    );

    let duplicatePrimaryBlocked = false;

    try {
      await payload.create({
        collection: "productInquiryForms",
        data: {
          approvalStatus: "approved",
          consentProfile: "product-inquiry-default",
          consentText: "Consent copy",
          description: "Duplicate primary form should fail.",
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
          formMode: "consultation-request",
          internalCode: "FORM_SMOKE_VM_EN_DUP",
          isPrimaryForLocale: true,
          layoutMode: "single-column",
          locale: "en",
          notificationEmails: [{ email: "concierge@montelar.example" }],
          allowedVariantModes: "product-only",
          documentContextMode: "none",
          privacyNoticeLinkMode: "global-policy",
          product: product.id,
          primaryLocale: "en",
          slug: "vision-max-private-room-en-duplicate",
          status: "draft",
          submissionChannel: "cms-lead",
          submitLabel: "Submit",
          successRedirectMode: "inline-message",
          successMessage: "Done",
          successTitle: "Done",
          title: "Duplicate primary",
        },
        draft: false,
        overrideAccess: true,
        showHiddenFields: true,
      });
    } catch (error) {
      duplicatePrimaryBlocked =
        error instanceof Error &&
        error.message.includes("only one primary form is allowed per product and locale");
    }

    assert.equal(duplicatePrimaryBlocked, true);

    const publishedProduct = await payload.update({
      id: product.id,
      collection: "products",
      data: {
        status: "published",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    assert.equal(publishedProduct.status, "published");
  } finally {
    for (const doc of created.reverse()) {
      await payload.delete({
        id: doc.id,
        collection: doc.collection,
        overrideAccess: true,
      }).catch(() => undefined);
    }

    if ("destroy" in payload.db && typeof payload.db.destroy === "function") {
      await payload.db.destroy();
    }
    await rm(localSmokeDatabasePath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
