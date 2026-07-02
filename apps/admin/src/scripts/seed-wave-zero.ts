import { getPayload } from "payload";

import { syncWaveZeroPlatform } from "../lib/payload/platform-seed.ts";

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    const summary = await syncWaveZeroPlatform(payload);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await payload.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
