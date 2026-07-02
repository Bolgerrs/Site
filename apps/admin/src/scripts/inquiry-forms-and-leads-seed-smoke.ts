import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { syncInquiryFormsAndSampleLeads } from "../lib/payload/inquiry-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(
  appRoot,
  ".tmp",
  "payload-inquiry-forms-and-leads-seed-smoke.db",
);

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncCatalogHierarchyAndProducts(payload);

    const firstRun = await syncInquiryFormsAndSampleLeads(payload);
    const secondRun = await syncInquiryFormsAndSampleLeads(payload);

    const forms = await payload.find({
      collection: "productInquiryForms",
      depth: 0,
      limit: 30,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
    });
    const leads = await payload.find({
      collection: "leads",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      sort: "referenceCode",
    });

    assert.equal(firstRun.formCount, 13);
    assert.equal(firstRun.sampleLeadCount, 4);
    assert.equal(forms.docs.length, 13);
    assert.equal(leads.docs.length, 4);
    assert.equal(secondRun.formOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(secondRun.leadOperations.every((entry) => entry.operation === "updated"), true);
    assert.equal(
      forms.docs.every(
        (form) =>
          form.locale === "en" &&
          form.status === "published" &&
          form.approvalStatus === "approved" &&
          form.isPrimaryForLocale === true,
      ),
      true,
    );
    assert.equal(
      leads.docs.every(
        (lead) =>
          Array.isArray(lead.internalTags) &&
          lead.internalTags.some((entry: { tag?: string }) => entry.tag === "internal-test-data") &&
          typeof lead.displayName === "string" &&
          lead.displayName.startsWith("INTERNAL TEST |"),
      ),
      true,
    );

    const visionMaxForm = forms.docs.find((form) => form.slug === "vision-max-premium-en");
    const livingGlassLead = leads.docs.find((lead) => lead.referenceCode === "LD-20260510-TEST03");

    assert.equal(
      visionMaxForm?.notificationEmails?.[0]?.email,
      "vision.concierge@montelar.example",
    );
    assert.equal(livingGlassLead?.routingMode, "partner-assigned");
    assert.equal(Array.isArray(livingGlassLead?.submittedFieldSnapshot), true);

    console.log("inquiry-forms-and-leads-seed-smoke: ok");
  } finally {
    await payload.destroy();
    await rm(localSmokeDatabasePath, { force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
