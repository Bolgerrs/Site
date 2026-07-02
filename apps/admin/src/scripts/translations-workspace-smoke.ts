import assert from "node:assert/strict";

import {
  applyTranslationWorkspaceContentUpdate,
  buildTranslationWorkspaceHref,
  getTranslationsWorkspaceSnapshot,
} from "../lib/payload/translations-workspace.ts";

async function main() {
  type TestTranslation = Record<string, unknown> & {
    formLabelSnapshot?: string;
    id: string;
    localeSpecificCtas?: Array<{ label?: string }>;
    mediaLocalizationEntries?: Array<{ localizedAltText?: string }>;
    seoDelta?: { description?: string; title?: string };
    status?: string;
    structuredFieldMap: Array<{ fieldKey: string; value: string; valueType?: string }>;
    targetTitle?: string;
    workflowStage?: string;
  };

  const translations: TestTranslation[] = [
    {
      id: "tr-review-fr",
      ownerCollection: "pages",
      ownerLabelSnapshot: "Contact page",
      ownerRecordKey: "contact",
      publishReadiness: "blocked",
      publishBlockedReasons: ["missing-route"],
      localizedExcerpt: "",
      mediaLocalizationEntries: [],
      reviewerAssignee: { id: "u-admin", fullName: "Admin Reviewer", role: "admin" },
      seoDelta: { description: "", title: "" },
      sourceLocale: { id: "loc-en", code: "en" },
      sourceRevisionKey: "contact:2026-05-10",
      sourceRoutePathSnapshot: "/contact",
      sourceTitleSnapshot: "Contact page",
      staleSourceState: "source-changed",
      status: "review",
      structuredFieldMap: [{ fieldKey: "lead", value: "Bonjour", valueType: "text" }],
      targetLocale: { id: "loc-fr", code: "fr" },
      targetRoutePath: "/fr/contact",
      targetSlug: "contact-fr",
      targetTitle: "Contact",
      translatorAssignee: { id: "u-translator", fullName: "French Translator", role: "translator" },
      workflowStage: "brand-review",
    },
    {
      id: "tr-published-es",
      ownerCollection: "products",
      ownerLabelSnapshot: "Monolith Reference",
      ownerRecordKey: "monolith-reference",
      publishReadiness: "ready",
      publishBlockedReasons: [],
      reviewerAssignee: { id: "u-admin", fullName: "Admin Reviewer", role: "admin" },
      sourceLocale: { id: "loc-en", code: "en" },
      sourceRevisionKey: "monolith-reference:2026-05-10",
      sourceRoutePathSnapshot: "/products/monolith-reference",
      sourceTitleSnapshot: "Monolith Reference",
      staleSourceState: "fresh",
      status: "published",
      structuredFieldMap: [{ fieldKey: "hero", value: "ES" }],
      targetLocale: { id: "loc-es", code: "es" },
      targetRoutePath: "/es/products/monolith-reference",
      targetSlug: "monolith-reference",
      targetTitle: "Monolith Reference",
      translatorAssignee: { id: "u-translator", fullName: "Spanish Translator", role: "translator" },
      workflowStage: "ready-for-publish",
    },
  ];

  const pages = [
    {
      id: "page-contact",
      internalCode: "PAGE-CONTACT",
      primaryLocale: "en",
      routePath: "/contact",
      slug: "contact",
      status: "published",
      title: "Contact page",
      updatedAt: "2026-05-10T10:00:00.000Z",
    },
  ];

  const products = [
    {
      canonicalPath: "/products/monolith-reference",
      id: "product-monolith",
      primaryLocale: "en",
      publicLabel: "Monolith Reference",
      slug: "monolith-reference",
      status: "published",
      updatedAt: "2026-05-10T11:00:00.000Z",
    },
  ];

  const locales = [
    { code: "en", englishLabel: "English", id: "loc-en", nativeLabel: "English", publicSiteEnabled: true },
    { code: "es", englishLabel: "Spanish", id: "loc-es", nativeLabel: "Español", publicSiteEnabled: true },
    { code: "fr", englishLabel: "French", id: "loc-fr", nativeLabel: "Français", publicSiteEnabled: true },
    { code: "de", englishLabel: "German", id: "loc-de", nativeLabel: "Deutsch", publicSiteEnabled: true },
    { code: "ru", englishLabel: "Russian", id: "loc-ru", nativeLabel: "Русский", publicSiteEnabled: true },
    { code: "zh", englishLabel: "Chinese", id: "loc-zh", nativeLabel: "中文", publicSiteEnabled: true },
    { code: "ja", englishLabel: "Japanese", id: "loc-ja", nativeLabel: "日本語", publicSiteEnabled: true },
  ];

  const adminUsers = [
    { fullName: "Admin Reviewer", id: "u-admin", role: "admin" },
    { fullName: "French Translator", id: "u-translator", role: "translator" },
  ];

  const payload = {
    find: async ({ collection }: { collection: string }) => {
      switch (collection) {
        case "translations":
          return { docs: translations };
        case "pages":
          return { docs: pages };
        case "products":
          return { docs: products };
        case "locales":
          return { docs: locales };
        case "admin-users":
          return { docs: adminUsers };
        default:
          return { docs: [] };
      }
    },
    findByID: async ({ collection, id }: { collection: string; id: string }) => {
      assert.equal(collection, "translations");
      const record = translations.find((entry) => entry.id === id);
      assert.ok(record, `Expected translation ${id} to exist.`);
      return record;
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: string }) => {
      assert.equal(collection, "translations");
      const index = translations.findIndex((entry) => entry.id === id);
      assert.notEqual(index, -1, `Expected translation ${id} to exist.`);
      const current = translations[index];
      assert.ok(current, `Expected translation ${id} to exist.`);
      translations[index] = { ...current, ...data, id: current.id };
      return translations[index];
    },
  } as unknown as Parameters<typeof getTranslationsWorkspaceSnapshot>[0];

  const req = { user: { id: "u-translator", role: "translator" } } as unknown as Parameters<
    typeof getTranslationsWorkspaceSnapshot
  >[1];

  const snapshot = await getTranslationsWorkspaceSnapshot(payload, req, {
    filter: "all",
    locale: null,
    ownerCollection: null,
    ownerKey: null,
    q: null,
  });

  assert.ok(
    snapshot.cards.some((card) => card.id.startsWith("missing:pages:contact:de")),
    "Workspace should synthesize a missing translation gap for uncovered launch locales.",
  );
  const reviewCard = snapshot.cards.find(
    (card) => card.ownerCollection === "pages" && card.ownerKey === "contact" && card.targetLocale === "fr",
  );
  assert.equal(
    reviewCard?.ownerHref,
    "/admin/site?selected=page-contact",
    "Workspace should link existing translations back to the owner page, not the translation row id.",
  );
  assert.equal(
    reviewCard?.seoWorkspaceHref,
    "/admin/site?selected=page-contact#page-seo",
    "Workspace should offer a guided SEO handoff for page translations.",
  );
  assert.ok(
    snapshot.cards.some((card) => card.filterMatch === "stale" && card.targetLocale === "fr"),
    "Workspace should classify stale source changes separately from normal review work.",
  );
  assert.equal(
    snapshot.localeSummaries.find((entry) => entry.code === "fr")?.stale,
    1,
    "French locale should count one stale translation.",
  );
  assert.equal(
    snapshot.localeSummaries.find((entry) => entry.code === "es")?.published,
    1,
    "Spanish locale should count one published translation.",
  );
  assert.ok(snapshot.canUpdate, "Translator should be allowed to move translation workflow.");
  assert.equal(snapshot.canPublish, false, "Translator should not receive publish authority.");
  assert.equal(
    buildTranslationWorkspaceHref({ filter: "stale", locale: "fr", ownerCollection: "pages", ownerKey: "contact" }),
    "/admin/translations?filter=stale&locale=fr&ownerCollection=pages&ownerKey=contact",
  );

  assert.ok(
    reviewCard?.contentFields.some((field) => field.fieldKey === "title" && field.sourceValue === "Contact page"),
    "Workspace should expose source title beside target content fields.",
  );
  assert.ok(
    reviewCard?.contentFields.some((field) => field.fieldKey === "route.path" && field.targetValue === "/fr/contact"),
    "Workspace should expose target route in the content editor.",
  );

  await applyTranslationWorkspaceContentUpdate(payload, req, "tr-review-fr", {
    fields: [
      { fieldKey: "title", value: "Contact FR", valueType: "text" },
      { fieldKey: "localizedExcerpt", value: "Texte long ".repeat(45), valueType: "long-text" },
      { fieldKey: "seo.title", value: "Contact Montelar France", valueType: "text" },
      { fieldKey: "seo.description", value: "Prendre contact avec Montelar.", valueType: "long-text" },
      { fieldKey: "cta.label", value: "Demander une consultation", valueType: "text" },
      { fieldKey: "media.alt", value: "Salon Montelar avec système intégré", valueType: "text" },
      { fieldKey: "form.labels", value: "Envoyer la demande", valueType: "text" },
      { fieldKey: "lead", value: "Bonjour, nous préparons votre projet. ".repeat(18), valueType: "long-text" },
    ],
    previewNotes: "Check long French text on mobile before publish.",
  });

  const updated = translations.find((entry) => entry.id === "tr-review-fr");
  assert.equal(updated?.targetTitle, "Contact FR");
  assert.equal(updated?.workflowStage, "human-edit");
  assert.equal(updated?.status, "review");
  assert.equal((updated?.seoDelta as { title?: string } | undefined)?.title, "Contact Montelar France");
  assert.equal(updated?.localeSpecificCtas?.[0]?.label, "Demander une consultation");
  assert.equal(updated?.mediaLocalizationEntries?.[0]?.localizedAltText, "Salon Montelar avec système intégré");
  assert.equal(updated?.formLabelSnapshot, "Envoyer la demande");
  assert.ok(
    updated?.structuredFieldMap.some(
      (field) => field.fieldKey === "lead" && field.value.startsWith("Bonjour, nous préparons"),
    ),
    "Content update should persist visible structured fields, not only workflow metadata.",
  );

  const refreshedSnapshot = await getTranslationsWorkspaceSnapshot(payload, req, {
    filter: "all",
    locale: "fr",
    ownerCollection: "pages",
    ownerKey: "contact",
    q: null,
  });
  const refreshedCard = refreshedSnapshot.cards.find((card) => card.recordId === "tr-review-fr");
	  assert.ok(
    refreshedCard?.contentFields.some(
      (field) => field.fieldKey === "lead" && field.isLayoutSensitive && field.targetValue.length > 320,
    ),
    "Long translated text should carry layout-risk metadata for visual review.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
