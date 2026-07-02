import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { defaultAdminLocale } from "../lib/payload/locales.ts";
import {
  rolePresetSeeds,
  siteSettingsSeeds,
  syncWaveZeroPlatform,
} from "../lib/payload/platform-seed.ts";
import { getPublicSiteSettings } from "../lib/payload/public-site.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-wave-zero-seed-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    const firstRun = await syncWaveZeroPlatform(payload);
    const secondRun = await syncWaveZeroPlatform(payload);

    const locales = await payload.find({
      collection: "locales",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "launchOrder",
    });
    const siteSettings = await payload.find({
      collection: "site-settings",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "locale",
    });

    assert.equal(locales.docs.length, 7);
    assert.equal(siteSettings.docs.length, siteSettingsSeeds.length);
    assert.equal(firstRun.rolePresetCount, rolePresetSeeds.length);
    assert.equal(secondRun.rolePresetCount, rolePresetSeeds.length);
    assert.equal(
      secondRun.localeOperations.every((entry) => entry.operation === "updated"),
      true,
    );
    assert.equal(
      secondRun.siteSettingsOperations.every((entry) => entry.operation === "updated"),
      true,
    );

    const englishSettings = await getPublicSiteSettings(payload, defaultAdminLocale);
    const russianSettings = await getPublicSiteSettings(payload, "ru");

    assert.equal(englishSettings?.siteConcept, "Quiet luxury");
    assert.equal(russianSettings?.siteTagline, "Архитектура изображения, звука и AI дизайна");
    assert.equal(englishSettings?.contactPrimaryHref, "/contact");

    console.log(
      JSON.stringify(
        {
          defaultLocale: defaultAdminLocale,
          localeCount: locales.docs.length,
          rolePresetCount: rolePresetSeeds.length,
          siteSettingsCount: siteSettings.docs.length,
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
