import assert from "node:assert/strict";

import {
  executeChecksRepairAction,
  getChecksWorkspaceSnapshot,
} from "../lib/payload/checks-workspace.ts";

async function main() {
  const pages = [
    {
      id: "page-home",
      title: "Home",
      routePath: "/",
      sectionPlan: [{ expectedType: "overview" }],
      sections: [],
      slug: "home",
      status: "published",
    },
    {
      id: "page-brand",
      heroMedia: "asset-hero",
      routePath: "/brand",
      sectionPlan: [{ expectedType: "cta" }],
      sections: [],
      slug: "brand",
      status: "review",
      title: "Brand",
    },
  ];
  const pageSections = [
    {
      body: "Intro",
      ctaContent: {
        primaryLabel: "Start",
        primaryTarget: "#",
      },
      id: "section-cta-broken",
      previewLabel: "Broken CTA",
      sectionKey: "broken-cta",
      sectionType: "cta",
      status: "published",
      title: "Broken CTA",
    },
    {
      body: "x".repeat(560),
      id: "section-long-text",
      previewLabel: "Long editorial block",
      sectionKey: "long-editorial",
      sectionType: "overview",
      status: "published",
      title: "Long editorial block",
    },
  ];
  const products = [
    {
      id: "product-1",
      name: "Monolith One",
      primaryLocale: "en",
      slug: "monolith-one",
      status: "published",
    },
    {
      category: "cat-audio",
      coverCardAsset: "asset-hero",
      heroAsset: "asset-hero",
      id: "product-2",
      name: "Vision Two",
      primaryLocale: "en",
      slug: "vision-two",
      status: "review",
    },
  ];
  const categories = [{ id: "cat-audio", name: "Audio", slug: "audio", status: "published" }];
  const forms = [
    {
      approvalStatus: "approved",
      id: "form-1",
      isPrimaryForLocale: true,
      locale: "en",
      product: "product-2",
      slug: "vision-two-en",
      status: "published",
      title: "Vision Two EN",
    },
  ];
  const seoEntries = [
    {
      approvalStatus: "review",
      id: "seo-home",
      ownerLabel: "Home",
      ownerPage: "page-home",
      ownerType: "page",
      publicationReadiness: "blocked",
      status: "review",
    },
  ];
  const translations = [
    {
      id: "tr-brand-fr",
      ownerCollection: "pages",
      ownerLabelSnapshot: "Brand",
      ownerRecordKey: "brand",
      publishBlockedReasons: [],
      publishReadiness: "blocked",
      sourceLocale: { id: "loc-en", code: "en" },
      sourceRevisionKey: "brand:2026-05-10",
      sourceRoutePathSnapshot: "/brand",
      sourceTitleSnapshot: "Brand",
      staleSourceState: "source-changed",
      status: "review",
      structuredFieldMap: [{ fieldKey: "hero", value: "Bonjour" }],
      targetLocale: { id: "loc-fr", code: "fr" },
      targetRoutePath: "/fr/brand",
      targetSlug: "brand-fr",
      targetTitle: "Brand FR",
      workflowStage: "brand-review",
    },
  ];
  const locales = [
    { code: "en", englishLabel: "English", id: "loc-en", nativeLabel: "English", publicSiteEnabled: true },
    { code: "fr", englishLabel: "French", id: "loc-fr", nativeLabel: "Français", publicSiteEnabled: true },
  ];
  const mediaAssets = [
    {
      approvalStatus: "approved",
      assetTitle: "Hero asset",
      assetType: "image",
      audienceMode: "public",
      filesize: 8000000,
      id: "asset-hero",
      internalCode: "MEDIA-HERO",
      primaryLocale: "en",
      publicationReadiness: "production-ready",
      rightsStatus: "production-approved",
      sourceCategory: "internal",
      status: "published",
    },
    {
      approvalStatus: "approved",
      assetTitle: "Unused asset",
      assetType: "image",
      audienceMode: "public",
      filesize: 250000,
      id: "asset-unused",
      internalCode: "MEDIA-UNUSED",
      primaryLocale: "en",
      publicationReadiness: "production-ready",
      rightsStatus: "production-approved",
      sourceCategory: "internal",
      status: "published",
    },
  ];

  const payload = {
    find: async ({ collection }: { collection: string }) => {
      switch (collection) {
        case "pages":
          return { docs: pages };
        case "page-sections":
          return { docs: pageSections };
        case "products":
          return { docs: products };
        case "product-categories":
          return { docs: categories };
        case "productInquiryForms":
          return { docs: forms };
        case "seo-entries":
          return { docs: seoEntries };
        case "translations":
          return { docs: translations };
        case "locales":
          return { docs: locales };
        case "media-assets":
          return { docs: mediaAssets };
        case "product-documents":
        case "product-media":
        case "admin-users":
          return { docs: [] };
        default:
          return { docs: [] };
      }
    },
  } as unknown as Parameters<typeof getChecksWorkspaceSnapshot>[0];

  const req = {
    user: {
      id: "owner-1",
      role: "owner",
    },
  } as unknown as Parameters<typeof getChecksWorkspaceSnapshot>[1];

  const snapshot = await getChecksWorkspaceSnapshot(payload, req, { check: "seo-problems" });

  assert.equal(snapshot.activeCheck, "seo-problems");
  assert.ok(snapshot.summary.publishBlockers > 0, "publish blockers should be surfaced");
  assert.ok(snapshot.checks.find((card) => card.id === "empty-images")?.count);
  assert.ok(snapshot.checks.find((card) => card.id === "products-without-form")?.count);
  assert.ok(snapshot.checks.find((card) => card.id === "empty-alt-text")?.count);
  assert.ok(snapshot.checks.find((card) => card.id === "unused-media")?.count);
  assert.ok(snapshot.checks.find((card) => card.id === "empty-translations")?.count);
  assert.ok(snapshot.checks.find((card) => card.id === "seo-problems")?.count);
  const photoIssue = snapshot.checks.find((card) => card.id === "products-without-photo")?.issues[0];
  assert.ok(photoIssue, "product photo issue should be modeled");
  assert.equal(photoIssue.actions[0]?.command, "open-media-assignment");
  assert.match(photoIssue.actions[0]?.href ?? "", /^\/admin\/products\?/);
  const seoIssue = snapshot.checks.find((card) => card.id === "seo-problems")?.issues[0];
  assert.ok(seoIssue?.actions[0]?.href, "SEO issue should expose editor target");
  assert.doesNotMatch(seoIssue.actions[0].href, /\/admin\/collections/);
  const translationIssue = snapshot.checks.find((card) => card.id === "empty-translations")?.issues[0];
  assert.equal(translationIssue?.actions[0]?.command, "open-translation-editor");
  const brokenLinkCard = snapshot.checks.find((card) => card.id === "broken-links");
  assert.equal(brokenLinkCard?.automation, "automated");
  assert.ok(brokenLinkCard?.issues[0]?.actions[0]?.href.includes("focus=ctaContent.primaryTarget"));
  assert.ok(snapshot.checks.find((card) => card.id === "long-text")?.issues[0]);
  for (const card of snapshot.checks) {
    for (const issue of card.issues) {
      assert.ok(issue.reason, `${card.id}/${issue.id} needs a human reason`);
      assert.ok(issue.actions.length > 0, `${card.id}/${issue.id} needs a repair action`);
      assert.doesNotMatch(issue.actions[0]?.href ?? "", /\/admin\/collections/);
    }
  }

  const guidedTargets = [
    {
      checkId: "products-without-photo",
      href: /\/admin\/products\?/,
      label: "product photo",
      ownerType: "product",
    },
    {
      checkId: "seo-problems",
      href: /\/admin\/site-admin\?.*section=seo|\/admin\/site\?/,
      label: "SEO",
      ownerType: /^(page|product|category|seo)$/,
    },
    {
      checkId: "empty-translations",
      href: /\/admin\/translations\?/,
      label: "translation",
      ownerType: "translation",
    },
    {
      checkId: "broken-links",
      href: /focus=ctaContent\.primaryTarget/,
      label: "broken CTA",
      ownerType: "block",
    },
  ] as const;

  for (const target of guidedTargets) {
    const card = snapshot.checks.find((entry) => entry.id === target.checkId);
    const issue = card?.issues[0];
    assert.ok(issue, `${target.label} guided target needs an issue`);
    const result = await executeChecksRepairAction(payload, req, {
      checkId: target.checkId,
      issueId: issue.id,
    });

    assert.equal(result.ok, true);
    assert.equal(result.mutates, false);
    assert.equal(result.commandContract, "open-guided-editor-target");
    assert.match(result.targetHref, target.href, `${target.label} should open the exact editor target`);
    if (typeof target.ownerType === "string") {
      assert.equal(result.action.target.ownerType, target.ownerType);
    } else {
      assert.match(result.action.target.ownerType, target.ownerType);
    }
    assert.doesNotMatch(result.targetHref, /\/admin\/collections/);
  }

  console.log("checks-workspace-smoke: ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
