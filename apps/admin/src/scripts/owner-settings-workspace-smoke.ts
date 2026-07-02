import assert from "node:assert/strict";

import {
  getOwnerSettingsWorkspaceSnapshot,
  updateOwnerSettingsWorkspace,
} from "../lib/payload/owner-settings-workspace.ts";

async function main() {
  const siteSettings: Array<Record<string, unknown>> = [
    {
      id: "settings-ru",
      internalCode: "SETTINGS_PUBLIC_RU",
      locale: "ru",
      primaryLocale: "en",
      status: "review",
      brandName: "Montelar",
      brandShortName: "MNTL",
      siteTagline: "Архитектура изображения, звука и AI дизайна",
      siteConcept: "Тихая роскошь",
      contactPrimaryLabel: "Запросить консультацию",
      contactPrimaryHref: "/contact",
      contactHeadline: "Частная консультация",
      contactEmail: "concierge@montelar.example",
      contactPhoneDisplay: "+31 20 555 0100",
      contactPhoneE164: "+31205550100",
      contactWhatsappLabel: "WhatsApp",
      contactWhatsappUrl: "https://wa.me/31205550100",
      contactTelegramUrl: "https://t.me/montelar",
      showroomLabel: "Private showroom",
      showroomCity: "Amsterdam",
      showroomCountry: "Netherlands",
      addressShort: "Keizersgracht 210, Amsterdam",
      visitNote: "Визит по предварительной записи.",
      footerLegalName: "Montelar B.V.",
      footerCopyright: "Montelar. All rights reserved.",
      contactFallbackLocale: "en",
      socialLinks: [{ label: "Instagram", href: "https://example.com/montelar" }],
      updatedAt: "2026-05-11T09:00:00.000Z",
    },
    {
      id: "settings-en",
      internalCode: "SETTINGS_PUBLIC_EN",
      locale: "en",
      primaryLocale: "en",
      status: "published",
      brandName: "Montelar",
      brandShortName: "MNTL",
      siteTagline: "Architecture of image, sound and AI design",
      siteConcept: "Quiet luxury",
      contactPrimaryLabel: "Request a consultation",
      contactPrimaryHref: "/contact",
      updatedAt: "2026-05-11T09:00:00.000Z",
    },
  ];
  const locales: Array<Record<string, unknown>> = [
    { code: "ru", nativeLabel: "Русский", englishLabel: "Russian" },
    { code: "en", nativeLabel: "English", englishLabel: "English" },
  ];
  const pages: Array<Record<string, unknown>> = [{ id: "page-home", routePath: "/" }];

  const payload = {
    find: async ({ collection, where }: { collection: string; where?: { locale?: { equals: string } } }) => {
      const localeFilter = where?.locale?.equals;

      switch (collection) {
        case "site-settings":
          return {
            docs: localeFilter
              ? siteSettings.filter((entry) => entry.locale === localeFilter)
              : siteSettings,
          };
        case "locales":
          return { docs: locales };
        case "pages":
          return { docs: pages };
        default:
          return { docs: [] };
      }
    },
    update: async ({
      collection,
      data,
      id,
    }: {
      collection: string;
      data: Record<string, unknown>;
      id: string;
    }) => {
      assert.equal(collection, "site-settings");
      const index = siteSettings.findIndex((entry) => entry.id === id);
      assert.notEqual(index, -1);
      siteSettings[index] = {
        ...siteSettings[index],
        ...data,
        updatedAt: "2026-05-11T10:00:00.000Z",
      };
      return siteSettings[index];
    },
  } as unknown as Parameters<typeof getOwnerSettingsWorkspaceSnapshot>[0];

  const req = {
    user: {
      id: "owner-1",
      role: "owner",
    },
  } as unknown as Parameters<typeof getOwnerSettingsWorkspaceSnapshot>[1];

  const before = await getOwnerSettingsWorkspaceSnapshot(payload, req, { locale: "ru" });
  assert.equal(before.selectedLocale, "ru");
  assert.equal(before.settings.brandName, "Montelar");
  assert.equal(before.secondLayerCards.some((entry) => entry.id === "popup-thank-you"), true);

  const after = await updateOwnerSettingsWorkspace(payload, req, {
    fields: {
      ...before.settings,
      brandName: "Montelar Atelier",
      contactPrimaryHref: " /contact ",
      socialLinks: [
        { label: "Instagram", href: " https://example.com/new " },
        { label: "", href: "https://skip.example" },
      ],
    },
    locale: "ru",
    mode: "publish",
  });

  assert.equal(after.settings.brandName, "Montelar Atelier");
  assert.equal(after.settings.contactPrimaryHref, "/contact");
  assert.equal(after.settings.status, "published");
  assert.equal(after.settings.socialLinks.length, 1);
  assert.equal(after.settings.socialLinks[0]?.href, "https://example.com/new");

  console.log("owner-settings-workspace-smoke: ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
