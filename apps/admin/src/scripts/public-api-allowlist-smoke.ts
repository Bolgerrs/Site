import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import { getInternalProductInquiryForm, getPublicCmsSnapshot } from "../lib/payload/public-cms.ts";
import { syncLaunchLocales } from "../lib/payload/locales.ts";
import { syncEditorialPagesSectionsAndNavigation } from "../lib/payload/page-seed.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-public-api-allowlist-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

const sourceArtifact =
  "docs/strategy/artifacts/MNT-ADMIN-023-public-api-boundaries.md";

type SmokeCollection =
  | "media-assets"
  | "products"
  | "productInquiryForms";

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const { adminRuntime } = await import("../lib/runtime.ts");
  const payload = await getPayload({ config, cron: true });
  const created: Array<{ collection: SmokeCollection; id: number | string }> = [];
  const probeImagePath = path.resolve(adminRuntime.tempDir, "public-api-allowlist-smoke.png");

  try {
    await mkdir(path.dirname(probeImagePath), { recursive: true });
    await writeFile(
      probeImagePath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
        "base64",
      ),
    );

    await syncLaunchLocales(payload);
    await syncCatalogHierarchyAndProducts(payload);
    await syncEditorialPagesSectionsAndNavigation(payload);

    const direction = (
      await payload.find({
        collection: "product-directions",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          status: {
            equals: "published",
          },
        },
      })
    ).docs[0];

    assert.ok(direction, "Expected one published seeded direction for public API smoke.");

    const publishedProduct = await payload.create({
      collection: "products",
      data: {
        availabilityMode: "on-request",
        canonicalPath: "/products/audio-public-api-published",
        direction: direction.id,
        internalCode: "PRD_PUBLIC_API_PUBLISHED",
        launchStage: "planned",
        name: "Audio Public API Published",
        order: 10,
        primaryLocale: "en",
        productKind: "system",
        publicLabel: "Audio Public API Published",
        requiresQualification: false,
        routeSegment: "audio-public-api-published",
        shortDescription: "Published product that must appear in the allowlisted public snapshot.",
        slug: "audio-public-api-published",
        sourceOfTruthArtifact: sourceArtifact,
        status: "published",
        translationPriority: "normal",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "products", id: publishedProduct.id });

    const draftHeroAsset = await payload.create({
      collection: "media-assets",
      data: {
        approvalStatus: "needs-review",
        assetTitle: "Draft-only hero asset",
        assetType: "image",
        audienceMode: "public",
        internalCode: "MEDIA_PUBLIC_API_DRAFT_ONLY",
        primaryLocale: "en",
        publicationReadiness: "blocked",
        referenceOnlyNotProductionAsset: false,
        rightsStatus: "production-approved",
        sourceCategory: "internal",
        status: "draft",
        altText: "Draft-only hero asset",
        translationPriority: "normal",
      },
      draft: false,
      filePath: probeImagePath,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "media-assets", id: draftHeroAsset.id });

    await payload.update({
      collection: "products",
      id: publishedProduct.id,
      data: {
        heroAsset: draftHeroAsset.id,
      },
      depth: 1,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const draftProduct = await payload.create({
      collection: "products",
      data: {
        availabilityMode: "on-request",
        canonicalPath: "/products/audio-public-api-draft",
        direction: direction.id,
        internalCode: "PRD_PUBLIC_API_DRAFT",
        launchStage: "planned",
        name: "Audio Public API Draft",
        order: 20,
        primaryLocale: "en",
        productKind: "system",
        publicLabel: "Audio Public API Draft",
        requiresQualification: false,
        routeSegment: "audio-public-api-draft",
        shortDescription: "Draft product that must stay out of the public snapshot.",
        slug: "audio-public-api-draft",
        sourceOfTruthArtifact: sourceArtifact,
        status: "draft",
        translationPriority: "normal",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "products", id: draftProduct.id });

    const publishedForm = await payload.create({
      collection: "productInquiryForms",
      data: {
        approvalStatus: "approved",
        consentProfile: "audio-public-api-profile",
        consentText: "I agree to Montelar follow-up for this private audio request.",
        contextSnapshotKeys: [{ key: "productSlug" }, { key: "inquiryType" }],
        description: "Public-safe inquiry form copy for the published audio product.",
        fields: [
          {
            fieldKey: "fullName",
            fieldType: "text",
            label: "Full name",
            leadMappingKey: "contact_name_internal",
            required: true,
            width: "half",
          },
          {
            fieldKey: "consent",
            fieldType: "consent",
            label: "I accept the privacy review",
            required: true,
            width: "full",
          },
        ],
        formMode: "product-inquiry",
        internalCode: "FORM_PUBLIC_API_PUBLISHED",
        isPrimaryForLocale: true,
        locale: "en",
        layoutMode: "single-column",
        notificationEmails: [{ email: "concierge@montelar.example" }],
        notificationTemplateKey: "audio-private-intake",
        allowedVariantModes: "product-only",
        documentContextMode: "none",
        primaryLocale: "en",
        privacyNoticeLinkMode: "global-policy",
        product: publishedProduct.id,
        slug: "audio-public-api-published-en",
        sourceOfTruthArtifact: sourceArtifact,
        status: "published",
        submissionChannel: "cms-lead-plus-email",
        successRedirectMode: "inline-message",
        submitLabel: "Request consultation",
        successMessage: "A Montelar advisor will review your request.",
        successTitle: "Request received",
        title: "Private consultation request",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "productInquiryForms", id: publishedForm.id });

    const draftForm = await payload.create({
      collection: "productInquiryForms",
      data: {
        approvalStatus: "pending",
        consentProfile: "audio-public-api-draft",
        consentText: "Draft consent text.",
        contextSnapshotKeys: [{ key: "productSlug" }],
        description: "Draft form that must stay out of public output.",
        fields: [
          {
            fieldKey: "email",
            fieldType: "email",
            label: "Email",
            leadMappingKey: "contact_email_internal",
            required: true,
            width: "half",
          },
        ],
        formMode: "product-inquiry",
        internalCode: "FORM_PUBLIC_API_DRAFT",
        isPrimaryForLocale: true,
        locale: "en",
        layoutMode: "single-column",
        notificationEmails: [{ email: "draft@montelar.example" }],
        allowedVariantModes: "product-only",
        documentContextMode: "none",
        primaryLocale: "en",
        privacyNoticeLinkMode: "global-policy",
        product: draftProduct.id,
        slug: "audio-public-api-draft-en",
        sourceOfTruthArtifact: sourceArtifact,
        status: "draft",
        submissionChannel: "cms-lead",
        successRedirectMode: "inline-message",
        submitLabel: "Send",
        successMessage: "Draft",
        successTitle: "Draft",
        title: "Draft form",
      },
      draft: false,
      overrideAccess: true,
      showHiddenFields: true,
    });

    created.push({ collection: "productInquiryForms", id: draftForm.id });

    const homepage = (
      await payload.find({
        collection: "pages",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          routePath: {
            equals: "/",
          },
        },
      })
    ).docs[0] as Record<string, unknown> | undefined;

    assert.ok(homepage, "Expected seeded homepage for public page snapshot smoke.");

    await payload.update({
      collection: "pages",
      id: String(homepage.id),
      data: {
        heroMedia: draftHeroAsset.id,
      },
      depth: 1,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const snapshot = await getPublicCmsSnapshot(payload, "en");
    const publicProduct = snapshot.products.find((entry) => entry.slug === "audio-public-api-published");
    const hiddenProduct = snapshot.products.find((entry) => entry.slug === "audio-public-api-draft");
    const publicForm = snapshot.inquiryForms.find((entry) => entry.productSlug === "audio-public-api-published");
    const hiddenForm = snapshot.inquiryForms.find((entry) => entry.productSlug === "audio-public-api-draft");
    const internalForm = await getInternalProductInquiryForm(payload, "en", "audio-public-api-published");

    assert.ok(publicProduct, "published product should be present in public snapshot");
    assert.equal(hiddenProduct, undefined, "draft product must be excluded from public snapshot");
    assert.ok(publicForm, "published inquiry form should be present in public snapshot");
    assert.equal(hiddenForm, undefined, "draft inquiry form must be excluded from public snapshot");
    assert.ok(internalForm, "internal inquiry form serializer should resolve the published form");
    assert.equal(publicProduct?.heroMedia, undefined, "draft media assets must not leak through product public snapshot");
    assert.equal(
      snapshot.pages.find((entry) => entry.routePath === "/")?.heroMedia,
      undefined,
      "draft media assets must not leak through page public snapshot",
    );
    assert.equal(
      publicForm?.notificationEmails,
      undefined,
      "public inquiry serializer must not expose notification recipients",
    );
    assert.equal(
      publicForm?.fields[0]?.leadMappingKey,
      undefined,
      "public inquiry serializer must not expose internal lead mapping keys",
    );
    assert.deepEqual(
      internalForm?.notificationEmails,
      ["concierge@montelar.example"],
      "internal inquiry serializer must preserve notification recipients",
    );
    assert.equal(
      internalForm?.fields[0]?.leadMappingKey,
      "contact-name-internal",
      "internal inquiry serializer must preserve lead mapping keys",
    );

    console.log("public-api-allowlist-smoke: ok");
  } finally {
    for (const entry of created.reverse()) {
      await payload.delete({
        collection: entry.collection,
        id: entry.id,
        overrideAccess: true,
      });
    }

      await payload.db.destroy?.();
    await rm(localSmokeDatabasePath, { force: true });
    await rm(probeImagePath, { force: true });
  }
}

main().catch((error) => {
  console.error("public-api-allowlist-smoke: failed");
  console.error(error);
  process.exitCode = 1;
});
