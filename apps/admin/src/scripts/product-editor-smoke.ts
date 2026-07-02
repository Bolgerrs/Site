import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import { isRawAdminHref } from "../lib/admin-bff/raw-layer.ts";
import { syncCatalogHierarchyAndProducts } from "../lib/payload/catalog-seed.ts";
import {
  canAccessProductSystemFields,
  getProductEditorSnapshot,
  getProductPublicUrl,
} from "../lib/payload/product-editor.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const localSmokeDatabasePath = path.resolve(appRoot, ".tmp", "payload-product-editor-smoke.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${localSmokeDatabasePath}`;
}

function assertNoDirectRawHrefs(scope: string, hrefs: Array<string | undefined>) {
  const leaks = hrefs.filter((href): href is string => Boolean(href && isRawAdminHref(href)));
  assert.deepEqual(leaks, [], `${scope} should not expose direct raw collection hrefs.`);
}

async function main() {
  const { default: config } = await import("../payload.config.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await syncCatalogHierarchyAndProducts(payload);

    const products = await payload.find({
      collection: "products",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "order",
      where: {
        status: {
          equals: "draft",
        },
      },
    });

    const product = products.docs[0];

    assert.ok(product, "Expected one seeded draft product.");

    const draftSnapshot = await getProductEditorSnapshot(payload, product);

    const baselineApprovedPrimaryForms = draftSnapshot.approvedPrimaryFormCount;

    await payload.update({
      collection: "products",
      data: {
        status: "review",
      },
      draft: false,
      id: product.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const form =
      baselineApprovedPrimaryForms > 0
        ? null
        : await payload.create({
            collection: "productInquiryForms",
            data: {
              approvalStatus: "approved",
              consentProfile: "product-inquiry-default",
              consentText: "I agree to Montelar privacy review and advisory follow-up.",
              description: "Smoke primary form for product editor workflow.",
              fields: [
                {
                  fieldKey: "full-name",
                  fieldType: "text",
                  label: "Full name",
                  leadMappingKey: "full-name",
                  required: true,
                  width: "full",
                },
              ],
              formMode: "product-inquiry",
              internalCode: `${String(product.internalCode)}-FORM-EN`,
              isPrimaryForLocale: true,
              layoutMode: "single-column",
              locale: product.primaryLocale,
              notificationEmails: [{ email: "concierge@montelar.example" }],
              allowedVariantModes: "product-only",
              documentContextMode: "none",
              privacyNoticeLinkMode: "global-policy",
              product: product.id,
              primaryLocale: product.primaryLocale,
              slug: `${String(product.slug)}-en`,
              sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-020-admin-product-editor-ux.md",
              status: "published",
              submissionChannel: "cms-lead",
              submitLabel: "Request consultation",
              successRedirectMode: "inline-message",
              successMessage: "Done",
              successTitle: "Done",
              title: `${String(product.publicLabel)} primary inquiry`,
            },
            draft: false,
            overrideAccess: true,
            showHiddenFields: true,
          });

    const publishedProduct = await payload.update({
      collection: "products",
      data: {
        sourceOfTruthArtifact: "docs/strategy/artifacts/MNT-CMS-020-admin-product-editor-ux.md",
        status: "published",
      },
      draft: false,
      id: product.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const publishedSnapshot = await getProductEditorSnapshot(payload, publishedProduct);

    if (form) {
      assert.equal(
        typeof form.product === "object" && form.product ? form.product.id : form.product,
        product.id,
      );
    }
    assert.equal(publishedProduct.status, "published");
    assert.equal(
      publishedSnapshot.approvedPrimaryFormCount,
      baselineApprovedPrimaryForms > 0 ? baselineApprovedPrimaryForms : 1,
    );
    assert.ok(
      publishedSnapshot.linkedWorkspaces.some((entry) => entry.id === "forms"),
      "Workspace links should include the inquiry-form editor.",
    );
    assertNoDirectRawHrefs(
      "product editor linked workspaces",
      publishedSnapshot.linkedWorkspaces.map((entry) => entry.href),
    );
    assertNoDirectRawHrefs(
      "product editor checklist",
      publishedSnapshot.checklist.map((entry) => entry.href),
    );
    assertNoDirectRawHrefs(
      "product editor blockers",
      publishedSnapshot.blockers.map((entry) => entry.href),
    );
    assert.match(
      getProductPublicUrl(publishedProduct),
      /\/[a-z]{2}\/products\//,
      "Public URL should stay locale-prefixed.",
    );
    assert.equal(canAccessProductSystemFields({ role: "developer" }), true);
    assert.equal(canAccessProductSystemFields({ role: "content-editor" }), false);
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
