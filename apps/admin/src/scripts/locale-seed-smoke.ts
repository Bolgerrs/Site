import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import {
  defaultAdminLocale,
  launchLocaleSeeds,
  syncLaunchLocales,
} from "../lib/payload/locales.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-locale-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    const summary = await syncLaunchLocales(payload);
    const locales = await payload.find({
      collection: "locales",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "launchOrder",
    });

    assert.equal(locales.docs.length, launchLocaleSeeds.length);

    const defaultLocale = locales.docs.find((locale) => locale.isDefaultPublicLocale);

    assert.equal(defaultLocale?.code, defaultAdminLocale);

    console.log(
      JSON.stringify(
        {
          localeCount: locales.docs.length,
          seededCodes: locales.docs.map((locale) => locale.code),
          operations: summary,
          sourceLocale: locales.docs.find((locale) => locale.isSourceLocale)?.code ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    await payload.destroy();

    if (process.env.DATABASE_URL === `file:${localSmokeDatabasePath}`) {
      await rm(localSmokeDatabasePath, { force: true });
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
