import assert from "node:assert/strict";
import type { PayloadRequest } from "payload";

import {
  executeSiteAdminSettingsCommand,
  getSiteAdminSettingsSnapshot,
} from "../lib/admin-bff/site-admin-settings.ts";
import {
  advancedToolGroups,
  siteAdminCards,
} from "../lib/payload/site-admin-workspace.ts";

const docsByCollection = {
  "admin-users": [
    {
      id: "u1",
      email: "owner@example.com",
      fullName: "Owner",
      role: "owner",
    },
  ],
  "audit-events": [
    {
      id: "a1",
      action: "protected-settings-update",
      actorRole: "owner",
      summary: "Settings updated.",
    },
  ],
  locales: [
    {
      id: "loc-ru",
      code: "ru",
      hiddenFromSwitcher: false,
      launchOrder: 1,
      nativeLabel: "Русский",
      publicSiteEnabled: true,
      routePrefix: "/ru",
      status: "active",
    },
    {
      id: "loc-en",
      code: "en",
      hiddenFromSwitcher: false,
      launchOrder: 2,
      nativeLabel: "English",
      publicSiteEnabled: true,
      routePrefix: "/en",
      status: "active",
    },
  ],
  "media-assets": [
    {
      id: "m1",
      fileCategory: "hero",
      title: "Hero still",
      usageRightsStatus: "approved",
    },
  ],
  "navigation-menus": [
    {
      id: "nav-main",
      items: [
        {
          href: "/brand",
          label: "Brand",
        },
      ],
      locale: "ru",
      menuKey: "main",
      placement: "header",
      status: "published",
      title: "Header",
    },
  ],
  pages: [
    {
      id: "home",
      routePath: "/",
      status: "published",
      title: "Home",
    },
    {
      id: "privacy",
      routePath: "/privacy",
      status: "published",
      title: "Privacy",
    },
  ],
  productInquiryForms: [
    {
      id: "form-vision",
      fields: [{ fieldKey: "name" }],
      locale: "ru",
      notificationEmails: [{ email: "leads@example.com" }],
      status: "published",
      successTitle: "Спасибо",
      title: "Vision MAX request",
    },
  ],
  "seo-entries": [
    {
      id: "seo-home",
      includeInSitemap: true,
      indexingMode: "index,follow",
      locale: "ru",
      metaTitle: "Montelar",
      ownerLabel: "Home",
      routePath: "/",
      status: "published",
    },
  ],
  "site-settings": [
    {
      id: "settings-ru",
      brandName: "Montelar",
      contactFallbackLocale: "ru",
      contactPrimaryHref: "/contact",
      customModuleSettings: [
        {
          headerMenuLanguage: {
            closeBehavior: "after-selection",
            defaultLanguageCode: "ru",
            languageSwitcherDisplay: "short-code",
            menuOpenBehavior: "hover-and-click",
            mobileLogoTransition: "crossfade-center",
            stableColumnCount: 3,
          },
          moduleId: "global.mobile-menu-language-logo",
          moduleLabel: "Mobile menu, language and logo transition",
        },
      ],
      locale: "ru",
      status: "published",
    },
  ],
} as Record<string, Array<Record<string, unknown>>>;

const updates: Array<{
  collection: string;
  data: Record<string, unknown>;
  id: number | string;
}> = [];
const createdAuditEvents: Array<Record<string, unknown>> = [];

const fakePayload = {
  async find({ collection }: { collection: string }) {
    return {
      docs: docsByCollection[collection] ?? [],
    };
  },
  async findByID({ collection, id }: { collection: string; id: number | string }) {
    return docsByCollection[collection]?.find((entry) => entry.id === id) ?? null;
  },
  async update({
    collection,
    data,
    id,
  }: {
    collection: string;
    data: Record<string, unknown>;
    id: number | string;
  }) {
    updates.push({ collection, data, id });
    return {
      id,
      ...data,
    };
  },
  async create({
    collection,
    data,
  }: {
    collection: string;
    data: Record<string, unknown>;
  }) {
    const record = {
      id: `${collection}-${createdAuditEvents.length + 1}`,
      ...data,
    };

    if (collection === "audit-events") {
      createdAuditEvents.push(record);
    }

    return record;
  },
};

const ownerReq = {
  payload: fakePayload,
  user: {
    email: "owner@example.com",
    fullName: "Owner",
    id: "u1",
    role: "owner",
  },
} as unknown as PayloadRequest;
const translatorReq = {
  user: {
    id: "u2",
    role: "translator",
  },
} as unknown as PayloadRequest;
const anonymousReq = {
  user: null,
} as unknown as PayloadRequest;

async function main() {
  const expectedSiteAdminCardIds = [
    "site-structure",
    "header-footer",
    "visual-modules",
    "seo",
    "forms",
    "languages",
    "users",
    "import-export",
    "security",
    "integrations",
    "media-settings",
    "service-pages",
  ];
  const expectedSettingsDomainIds = expectedSiteAdminCardIds.filter((id) => id !== "visual-modules");

  assert.deepEqual(
    siteAdminCards.map((entry) => entry.id),
    expectedSiteAdminCardIds,
    "site-admin should expose the full second-layer menu",
  );
  assert.equal(advancedToolGroups.length, 8, "advanced should expose all technical groups");
  assert.ok(siteAdminCards.find((entry) => entry.id === "users"));
  assert.ok(siteAdminCards.find((entry) => entry.id === "integrations"));
  assert.ok(siteAdminCards.find((entry) => entry.id === "service-pages"));
  assert.ok(siteAdminCards.find((entry) => entry.id === "import-export"));
  assert.ok(siteAdminCards.find((entry) => entry.id === "header-footer")?.href.includes("/admin/site-admin"));
  assert.ok(siteAdminCards.find((entry) => entry.id === "forms")?.href.includes("/admin/site-admin"));
  assert.ok(siteAdminCards.find((entry) => entry.id === "users")?.href.includes("/admin/site-admin"));
  assert.equal(siteAdminCards.some((entry) => entry.href.includes("/admin/advanced")), false);
  assert.ok(advancedToolGroups.find((entry) => entry.id === "raw-cms"));
  assert.ok(advancedToolGroups.find((entry) => entry.id === "runtime-devops"));
  assert.ok(advancedToolGroups.find((entry) => entry.id === "qa-diagnostics"));

  const payload = fakePayload as unknown as Parameters<typeof getSiteAdminSettingsSnapshot>[0];
  const snapshot = await getSiteAdminSettingsSnapshot(payload, ownerReq, {
    section: "forms",
  });
  assert.equal(snapshot.selectedSection, "forms");
  assert.deepEqual(
    snapshot.domains.map((domain) => domain.id),
    expectedSettingsDomainIds,
    "site-admin settings snapshot should preserve the full guided settings domain order",
  );
  assert.ok(snapshot.domains.find((domain) => domain.id === "header-footer"));
  assert.ok(snapshot.domains.find((domain) => domain.id === "forms"));
  assert.ok(snapshot.domains.find((domain) => domain.id === "languages"));
  assert.ok(snapshot.domains.find((domain) => domain.id === "seo"));
  assert.ok(snapshot.domains.find((domain) => domain.id === "users"));
  assert.ok(snapshot.domains.find((domain) => domain.id === "import-export")?.primaryAction.id);
  assert.equal(snapshot.domains.some((domain) => domain.href.includes("/admin/collections")), false);
  assert.ok(
    snapshot.domains
      .find((domain) => domain.id === "header-footer")
      ?.items.some((item) => item.moduleId === "global.mobile-menu-language-logo"),
    "Header/footer site-admin snapshot should expose protected header/menu behavior rows.",
  );
  assert.ok(
    snapshot.domains
      .find((domain) => domain.id === "languages")
      ?.items.some((item) => item.defaultLanguageCode === "ru" && item.languageSwitcherDisplay === "short-code"),
    "Languages site-admin snapshot should expose switcher behavior separately from menu clicks.",
  );

  await executeSiteAdminSettingsCommand(payload, ownerReq, {
    action: "navigation.save-menu-items",
    items: [{ href: "/contact", label: "Contact" }],
    menuId: "nav-main",
    title: "Header menu",
  });
  await executeSiteAdminSettingsCommand(payload, ownerReq, {
    action: "forms.save-routing",
    formId: "form-vision",
    notificationEmails: ["sales@example.com"],
    successMessage: "We will contact you.",
    successTitle: "Request received",
  });
  await executeSiteAdminSettingsCommand(payload, ownerReq, {
    action: "languages.save-order",
    fallbackLocale: "ru",
    items: [
      {
        id: "loc-en",
        launchOrder: 1,
        publicSiteEnabled: true,
        status: "active",
      },
    ],
  });
  await executeSiteAdminSettingsCommand(payload, ownerReq, {
    action: "seo.save-entry",
    entryId: "seo-home",
    includeInSitemap: true,
    indexingMode: "index,follow",
    metaDescription: "Luxury technology brand.",
    metaTitle: "Montelar",
  });
  await executeSiteAdminSettingsCommand(payload, ownerReq, {
    action: "settings.save-contact",
    contactEmail: "concierge@example.com",
    contactPhoneDisplay: "+31 20 000 0000",
    contactPrimaryHref: "/contact",
    contactPrimaryLabel: "Private consultation",
    locale: "ru",
  });
  await executeSiteAdminSettingsCommand(payload, ownerReq, {
    action: "users.save-role",
    role: "admin",
    userId: "u1",
  });
  assert.ok(updates.find((entry) => entry.collection === "navigation-menus"));
  assert.ok(updates.find((entry) => entry.collection === "productInquiryForms"));
  assert.ok(updates.find((entry) => entry.collection === "locales"));
  assert.ok(updates.find((entry) => entry.collection === "seo-entries"));
  assert.ok(updates.find((entry) => entry.collection === "site-settings"));
  assert.ok(updates.find((entry) => entry.collection === "admin-users"));
  assert.deepEqual(
    new Set(createdAuditEvents.map((entry) => entry.action)),
    new Set([
      "site-admin-contact-settings-save",
      "site-admin-form-routing-save",
      "site-admin-language-order-save",
      "site-admin-navigation-save",
      "site-admin-seo-save",
      "site-admin-user-role-save",
    ]),
    "every site-admin settings mutation group must create an audit event",
  );
  assert.equal(
    createdAuditEvents.every((event) => event.targetCollection && event.targetId && event.summary),
    true,
    "audit events must include a target and human summary",
  );

  await assert.rejects(
    () => getSiteAdminSettingsSnapshot(payload, translatorReq),
    /forbidden/,
    "translator must not access site-admin settings API",
  );
  await assert.rejects(
    () => getSiteAdminSettingsSnapshot(payload, anonymousReq),
    /unauthorized/,
    "anonymous user must not access site-admin settings API",
  );

  console.log("site-admin-workspace-smoke: ok");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
