import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const outputPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(appRoot, ".tmp", "admin-browser-qa-fixture.json");
const requestedRole = (process.argv[3] ?? process.env.MONTELAR_QA_ROLE ?? "owner").trim() as AdminRole;
const databasePath = path.resolve(appRoot, ".tmp", "payload-admin-browser-qa.db");
const uploadsDir = path.resolve(appRoot, ".uploads-browser-qa");
const password = "MontelarSmoke123!";
const runtimePort = process.env.MONTELAR_QA_PORT?.trim() || "3102";
const baseUrl = `http://localhost:${runtimePort}`;
const siteBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:8093").replace(/\/+$/, "");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${databasePath}`;
}

process.env.MONTELAR_UPLOADS_DIR = process.env.MONTELAR_UPLOADS_DIR?.trim() || uploadsDir;
process.env.NEXT_PUBLIC_ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL?.trim() || baseUrl;
process.env.NEXT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:8093";
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET?.trim() || "montelar-browser-qa-secret";

type AdminRole =
  | "owner"
  | "admin"
  | "content-editor"
  | "lead-manager"
  | "translator"
  | "media-manager"
  | "developer";

const roles: readonly AdminRole[] = [
  "owner",
  "admin",
  "content-editor",
  "lead-manager",
  "translator",
  "media-manager",
  "developer",
];

if (!roles.includes(requestedRole)) {
  throw new Error(`Unsupported browser QA role: ${requestedRole}`);
}

async function ensureUser(payload: Awaited<ReturnType<typeof getPayload>>, role: AdminRole) {
  const email = `${role}@montelar.example`;
  const existing = await payload.find({
    collection: "admin-users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  });

  const record = existing.docs[0];

  if (!record) {
    const created = await payload.create({
      collection: "admin-users",
      data: {
        email,
        fullName: `${role} browser qa`,
        password,
        role,
      },
      overrideAccess: true,
      showHiddenFields: true,
    });

    return payload.findByID({
      collection: "admin-users",
      id: created.id,
      overrideAccess: true,
      showHiddenFields: true,
    });
  }

  await payload.update({
    collection: "admin-users",
    data: {
      fullName: `${role} browser qa`,
      password,
      role,
    },
    id: record.id,
    overrideAccess: true,
    showHiddenFields: true,
  });

  return payload.findByID({
    collection: "admin-users",
    id: record.id,
    overrideAccess: true,
    showHiddenFields: true,
  });
}

async function main() {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(path.dirname(databasePath), { recursive: true });
  await mkdir(uploadsDir, { recursive: true });
  const probeImagePath = path.resolve(appRoot, ".tmp", "admin-browser-qa-homepage-media.png");

  const { default: config } = await import("../payload.config.ts");
  const { syncPublicCmsBaseline } = await import("../lib/payload/public-cms-baseline.ts");
  const { getTranslationsWorkspaceSnapshot } = await import("../lib/payload/translations-workspace.ts");
  const payload = await getPayload({ config, cron: true });

  try {
    await writeFile(
      probeImagePath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
        "base64",
      ),
    );

    await syncPublicCmsBaseline(payload);

    for (const role of roles) {
      await ensureUser(payload, role);
    }

    const products = await payload.find({
      collection: "products",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
    });
    const forms = await payload.find({
      collection: "productInquiryForms",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "slug",
    });
    const leads = await payload.find({
      collection: "leads",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    });
    const translationSnapshot = await getTranslationsWorkspaceSnapshot(
      payload,
      {
        payload,
        user: {
          collection: "admin-users",
          email: "owner@montelar.example",
          fullName: "owner browser qa",
          id: 1,
          role: "owner",
        },
      } as never,
      {},
    );
    const firstTranslation = translationSnapshot.cards[0] ?? null;
    const pages = await payload.find({
      collection: "pages",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      pagination: false,
      sort: "routePath",
    });
    const seoEntries = await payload.find({
      collection: "seo-entries",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
    });
    const product = products.docs[0];
    const form = forms.docs[0];
    const seoEntry = seoEntries.docs[0];
    if (!firstTranslation || !product || !form || !seoEntry) {
      throw new Error("Browser QA fixture requires seeded translation, product, form and SEO entry.");
    }
    const existingBrowserQaLead = leads.docs.find((entry) => entry.referenceCode === "LD-20260510-BROWSER01");
    const lead = existingBrowserQaLead
      ? await payload.update({
          collection: "leads",
          data: {
            assignedTeam: "concierge",
            assignedToUser: "owner@montelar.example",
            consentTextSnapshot:
              "Клиент согласился на обработку заявки Montelar и обратную связь по консультации.",
            latestActivitySummary: "Нужно согласовать время консультации и уточнить комнату.",
            nextActionAt: "2026-05-10T08:30:00.000Z",
            notificationStatus: "delivered",
            priority: "vip",
            requestType: "consultation",
            routingMode: "hq-direct",
            routingRuleKey: "browser-qa-direct",
            routingSuggestion: "Подтвердить время консультации и запросить краткое описание комнаты.",
            sourceChannel: "product-page",
            sourcePagePath: "/en/request/vision-max-premium",
            sourcePageTitle: "Request Vision MAX Premium",
            status: "qualified",
          },
          id: existingBrowserQaLead.id,
          overrideAccess: true,
          showHiddenFields: true,
        })
      : await payload.create({
          collection: "leads",
          data: {
            assignedTeam: "concierge",
            assignedToUser: "owner@montelar.example",
            consentAcceptedAt: "2026-05-10T08:00:00.000Z",
            consentLocale: "en",
            consentProfile: "product-inquiry-default",
            consentTextSnapshot: "Согласие зафиксировано для проверки кабинета.",
            country: "Netherlands",
            createdAt: "2026-05-10T08:00:00.000Z",
            displayName: "Елена Морозова",
            email: "browser-qa-lead@montelar.example",
            form: "vision-max-premium-en",
            lastStatusChangedAt: "2026-05-10T08:05:00.000Z",
            leadType: "vision-max",
            latestActivitySummary: "Нужно согласовать время консультации и уточнить комнату.",
            locale: "en",
            message: "Need a premium room consultation and install timing.",
            nextActionAt: "2026-05-10T08:30:00.000Z",
            notificationRecipients: [{ email: "concierge@montelar.example" }],
            notificationStatus: "delivered",
            partnerHandoffStatus: "not-applicable",
            phone: "+31 20 555 0100",
            priority: "vip",
            product: "vision-max-premium",
            productCategory: "private-cinema",
            productDirection: "vision-max",
            referenceCode: "LD-20260510-BROWSER01",
            requestType: "consultation",
            resolution: "open",
            routingMode: "hq-direct",
            routingRuleKey: "browser-qa-direct",
            routingSuggestion: "Owner should confirm private consultation timing and room brief.",
            sourceChannel: "product-page",
            sourceOfTruthArtifact: "docs/strategy/artifacts/visual-qa/MNT-ADMIN-PNP-006/browser-qa-report.md",
            sourcePagePath: "/en/request/vision-max-premium",
            sourcePageTitle: "Request Vision MAX Premium",
            status: "qualified",
            submittedFieldSnapshot: [
              {
                fieldKey: "full-name",
                fieldType: "text",
                label: "Full name",
                leadMappingKey: "full-name",
                valueText: "Елена Морозова",
              },
              {
                fieldKey: "email",
                fieldType: "email",
                label: "Email",
                leadMappingKey: "email",
                valueText: "browser-qa-lead@montelar.example",
              },
            ],
          },
          overrideAccess: true,
          showHiddenFields: true,
        });
    const homePage = pages.docs.find((page) => page.slug === "home" || page.routePath === "/");
    const secondaryPage =
      pages.docs.find((page) => page.routePath === "/brand") ??
      pages.docs.find((page) => page.slug !== "home");

    if (!product || !form || !lead || !firstTranslation || !homePage || !secondaryPage) {
      throw new Error("Fixture seed is incomplete for admin browser QA.");
    }

    const existingHomepageMediaAssets = await payload.find({
      collection: "media-assets",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        internalCode: {
          equals: "MAS_BROWSER_QA_HOME_01",
        },
      },
    });
    const homepageMediaAsset = existingHomepageMediaAssets.docs[0]
      ? await payload.update({
          collection: "media-assets",
          data: {
            approvalStatus: "approved",
            assetRole: "Homepage hero still",
            assetTitle: "Фото главного экрана для проверки",
            assetType: "image",
            audienceMode: "public",
            altText: "Фото главного экрана Montelar для проверки кабинета",
            primaryLocale: "en",
            publicationReadiness: "production-ready",
            referenceOnlyNotProductionAsset: false,
            rightsStatus: "production-approved",
            sourceCategory: "internal",
            status: "published",
            translationPriority: "normal",
          },
          id: existingHomepageMediaAssets.docs[0].id,
          overrideAccess: true,
          showHiddenFields: true,
        })
      : await payload.create({
          collection: "media-assets",
          data: {
            approvalStatus: "approved",
            assetRole: "Homepage hero still",
            assetTitle: "Фото главного экрана для проверки",
            assetType: "image",
            audienceMode: "public",
            internalCode: "MAS_BROWSER_QA_HOME_01",
            primaryLocale: "en",
            publicationReadiness: "production-ready",
            referenceOnlyNotProductionAsset: false,
            rightsStatus: "production-approved",
            sourceCategory: "internal",
            status: "published",
            altText: "Фото главного экрана Montelar для проверки кабинета",
            translationPriority: "normal",
          },
          draft: false,
          filePath: probeImagePath,
          overrideAccess: true,
          showHiddenFields: true,
        });

    await payload.update({
      collection: "pages",
      data: {
        heroMedia: homepageMediaAsset.id,
      },
      id: homePage.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const productKey = String(product.slug || product.id);
    const productLabel = String(product.publicLabel || product.name || product.slug || "Проверочный продукт");

    await payload.update({
      collection: "products",
      data: {
        coverCardAsset: null,
        heroAsset: null,
        status: "review",
      },
      id: product.id,
      overrideAccess: true,
      showHiddenFields: true,
    });

    const existingProductMedia = await payload.find({
      collection: "product-media",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        internalCode: {
          equals: "PM_BROWSER_QA_PRODUCT_01",
        },
      },
    });
    const productMediaData = {
      approvalStatus: "approved" as const,
      attachmentScope: "product-default" as const,
      fallbackBehavior: "use-product-default" as const,
      internalCode: "PM_BROWSER_QA_PRODUCT_01",
      isPrimary: true,
      mediaAsset: homepageMediaAsset.id,
      order: 1,
      overrideMode: "inherit-parent" as const,
      primaryLocale: "en" as const,
      productKey,
      productLabelSnapshot: productLabel,
      rightsStatus: "production-approved" as const,
      slot: "hero" as const,
      sourceCategory: "internal" as const,
      status: "review" as const,
      surfaceTargets: ["pdp", "listing-card"] as ("pdp" | "listing-card")[],
      translationPriority: "normal" as const,
      usageIntent: "editorial-preview" as const,
      visibilityMode: "preview-only" as const,
    };
    const productMedia = (existingProductMedia.docs[0]
      ? await payload.update({
          collection: "product-media",
          data: productMediaData,
          id: existingProductMedia.docs[0].id,
          overrideAccess: true,
          showHiddenFields: true,
        })
      : await payload.create({
          collection: "product-media",
          data: productMediaData,
          draft: false,
          overrideAccess: true,
          showHiddenFields: true,
        })) as { id: number | string };

    const productTranslation =
      translationSnapshot.cards.find(
        (card) =>
          card.ownerCollection === "products" &&
          [productKey, String(product.id)].includes(card.ownerKey),
      ) ?? translationSnapshot.cards.find((card) => card.ownerCollection === "products");

    const manifest = {
      baseUrl,
      credentials: {
        email: `${requestedRole}@montelar.example`,
        password,
      },
      databaseUrl: process.env.DATABASE_URL,
      routes: {
        crm: `${baseUrl}/admin#crm`,
        dashboard: `${baseUrl}/admin`,
        formsEditor: `${baseUrl}/admin/site-admin?section=forms`,
        checks: `${baseUrl}/admin/checks?check=seo-problems`,
        homepageMedia: `${baseUrl}/admin/media?context=homepage&selected=${encodeURIComponent(String(homepageMediaAsset.id))}`,
        headerMotionSettings: `${baseUrl}/admin/site-admin?section=header-footer`,
        leads: `${baseUrl}/admin/leads?filter=all`,
        media: `${baseUrl}/admin/media?selected=${encodeURIComponent(String(homepageMediaAsset.id))}`,
        advanced: `${baseUrl}/admin/advanced`,
        globalCheckReturn: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(secondaryPage.id))}&focus=seo`,
        globalMediaReturn: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(homePage.id))}&focus=media`,
        globalTranslationReturn: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(homePage.id))}&focus=translations`,
        homepageSeoEditor: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(homePage.id))}&focus=seo`,
        homepageTranslationsEditor: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(homePage.id))}&focus=translations`,
        homepageUnifiedEditor: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(homePage.id))}&focus=content`,
        pageEditor: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(homePage.id))}&focus=content`,
        siteWorkspace: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(homePage.id))}`,
        siteAdmin: `${baseUrl}/admin/site-admin`,
        siteModules: `${baseUrl}/admin/site-modules`,
        settings: `${baseUrl}/admin/settings?locale=ru`,
        productCatalog: `${baseUrl}/admin/products`,
        productCreate: `${baseUrl}/admin/products?mode=create`,
        productChecks: `${baseUrl}/admin/checks?check=products-without-photo`,
        publicPreview: `${siteBaseUrl}${String(homePage.previewPath || "/")}`,
        productMediaGlobal: `${baseUrl}/admin/media?usage=product-placement&selected=${encodeURIComponent(String(homepageMediaAsset.id))}`,
        productEditor: `${baseUrl}/admin/products?product=${encodeURIComponent(String(product.id))}&panel=content`,
        secondaryPageEditor: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(secondaryPage.id))}&focus=content`,
        seoEditor: `${baseUrl}/admin/site?selected=${encodeURIComponent(String(secondaryPage.id))}&focus=seo`,
        productTranslations: productTranslation
          ? `${baseUrl}/admin/translations?ownerCollection=${encodeURIComponent(productTranslation.ownerCollection)}` +
            `&ownerKey=${encodeURIComponent(productTranslation.ownerKey)}`
          : `${baseUrl}/admin/translations?ownerCollection=products`,
        translations:
          `${baseUrl}/admin/translations?ownerCollection=${encodeURIComponent(firstTranslation.ownerCollection)}` +
          `&ownerKey=${encodeURIComponent(firstTranslation.ownerKey)}`,
      },
      seedSummary: {
        formId: form.id,
        leadId: lead.id,
        mediaAssetId: homepageMediaAsset.id,
        pageId: homePage.id,
        productKey,
        productId: product.id,
        productMediaId: productMedia.id,
        productTranslationOwnerKey: productTranslation?.ownerKey ?? "",
        secondaryPageId: secondaryPage.id,
        seoEntryId: seoEntry.id,
        translationOwnerKey: firstTranslation.ownerKey,
      },
    };

    await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(outputPath);
  } finally {
    await rm(probeImagePath, { force: true });
    await payload.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
