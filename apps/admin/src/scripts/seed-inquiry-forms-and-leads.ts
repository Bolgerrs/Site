import { getPayload } from "payload";

import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { syncInquiryFormsAndSampleLeads } from "../lib/payload/inquiry-seed.ts";

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncCatalogHierarchyAndProducts(payload);
    const summary = await syncInquiryFormsAndSampleLeads(payload);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await payload.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
