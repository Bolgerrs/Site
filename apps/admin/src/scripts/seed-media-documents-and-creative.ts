import { getPayload } from "payload";

import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { syncInquiryFormsAndSampleLeads } from "../lib/payload/inquiry-seed.ts";
import { syncMediaDocumentsAndCreativeRecords } from "../lib/payload/media-seed.ts";
import { syncEditorialPagesSectionsAndNavigation } from "../lib/payload/page-seed.ts";

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncCatalogHierarchyAndProducts(payload);
    await syncEditorialPagesSectionsAndNavigation(payload);
    await syncInquiryFormsAndSampleLeads(payload);
    const summary = await syncMediaDocumentsAndCreativeRecords(payload);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await payload.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
