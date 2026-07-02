import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const manifestPath = process.argv[2];
const outputDir = process.argv[3];

if (!manifestPath || !outputDir) {
  console.error("usage: node browser-qa-capture.mjs <manifest.json> <output-dir>");
  process.exit(1);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
await fs.mkdir(outputDir, { recursive: true });

const desktop = {
  label: "desktop",
  options: {
    viewport: { width: 1440, height: 960 },
  },
};

const laptop = {
  label: "laptop-1366",
  options: {
    viewport: { width: 1366, height: 900 },
  },
};

const mobile = {
  label: "mobile",
  options: {
    ...devices["iPhone 13"],
  },
};

const tablet = {
  label: "tablet",
  options: {
    ...devices["iPad Mini"],
  },
};

const surfaces = [
  ["dashboard", manifest.routes.dashboard],
  ["checks", manifest.routes.checks],
  ["settings", manifest.routes.settings],
  ["site-admin", manifest.routes.siteAdmin],
  ["header-motion-settings", manifest.routes.headerMotionSettings],
  ["advanced", manifest.routes.advanced],
  ["site-workspace", manifest.routes.siteWorkspace],
  ["page-editor", manifest.routes.pageEditor],
  ["homepage-unified-editor", manifest.routes.homepageUnifiedEditor],
  ["homepage-seo-editor", manifest.routes.homepageSeoEditor],
  ["homepage-translations-editor", manifest.routes.homepageTranslationsEditor],
  ["homepage-media", manifest.routes.homepageMedia],
  ["global-media-return", manifest.routes.globalMediaReturn],
  ["global-check-return", manifest.routes.globalCheckReturn],
  ["global-translation-return", manifest.routes.globalTranslationReturn],
  ["secondary-page-editor", manifest.routes.secondaryPageEditor],
  ["product-catalog", manifest.routes.productCatalog],
  ["product-create", manifest.routes.productCreate],
  ["product-editor", manifest.routes.productEditor],
  ["seo-editor", manifest.routes.seoEditor],
  ["forms-editor", manifest.routes.formsEditor],
  ["leads", manifest.routes.leads],
  ["translations", manifest.routes.translations],
  ["media", manifest.routes.media],
  ["crm-anchor", manifest.routes.crm],
  ["public-preview", manifest.routes.publicPreview],
];

const enabledSurfaces = new Set(
  (process.env.MONTELAR_QA_SURFACES || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
);
const selectedSurfaces = surfaces.filter(
  ([label]) => enabledSurfaces.size === 0 || enabledSurfaces.has(label),
);

const enabledVariants = new Set(
  (process.env.MONTELAR_QA_VARIANTS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
);
const variants = [desktop, laptop, mobile, tablet].filter(
  (variant) => enabledVariants.size === 0 || enabledVariants.has(variant.label),
);
const summaryPath = path.join(outputDir, "capture-summary.json");
let captureSummary = [];

try {
  const existingSummary = JSON.parse(await fs.readFile(summaryPath, "utf8"));
  if (Array.isArray(existingSummary)) {
    const replacing = new Set(variants.map((variant) => variant.label));
    captureSummary = existingSummary.filter(
      (entry) =>
        !replacing.has(entry?.variant) ||
        (enabledSurfaces.size > 0 && !enabledSurfaces.has(entry?.label)),
    );
  }
} catch {
  captureSummary = [];
}

async function writeCaptureSummary() {
  await fs.writeFile(summaryPath, `${JSON.stringify(captureSummary, null, 2)}\n`, "utf8");
}

async function login(page) {
  await page.goto(`${manifest.baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await emailInput.waitFor({ state: "visible", timeout: 45000 });
  await passwordInput.waitFor({ state: "visible", timeout: 45000 });
  await emailInput.fill(manifest.credentials.email);
  await passwordInput.fill(manifest.credentials.password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin" || (url.pathname.startsWith("/admin/") && url.pathname !== "/admin/login"), {
      timeout: 30000,
    }),
    submitButton.click(),
  ]);
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/admin/login")) {
    throw new Error(`Login did not leave the auth screen: ${page.url()}`);
  }
}

async function captureVariant(browser, variant) {
  const context = await browser.newContext(variant.options);
  const page = await context.newPage();

  try {
    await login(page);

    for (const [label, url] of selectedSurfaces) {
      const response = await page.goto(url, { waitUntil: "commit", timeout: 120000 });
      await page.locator("body").waitFor({ state: "visible", timeout: 30000 });
      await page.waitForTimeout(1200);

      if (label === "crm-anchor") {
        const crmCard = page.locator("#crm").first();

        if (await crmCard.count()) {
          await crmCard.scrollIntoViewIfNeeded();
        }
      }

      if (label === "homepage-media") {
        const mediaDeskLink = page
          .locator('a[href*="/admin/media"]')
          .filter({ hasText: "Homepage media" })
          .first();

        if (await mediaDeskLink.count()) {
          await Promise.all([
            page.waitForURL((nextUrl) => nextUrl.pathname.includes("/admin/media"), { timeout: 15000 }),
            mediaDeskLink.click(),
          ]);
          await page.waitForLoadState("networkidle");
        }
      }

      const pngPath = path.join(outputDir, `${label}-${variant.label}.png`);
      const txtPath = path.join(outputDir, `${label}-${variant.label}.txt`);
      const text = await page.locator("body").innerText();
      const textSnippet = text.trim().slice(0, 400);

      await page.screenshot({ fullPage: true, path: pngPath });
      await fs.writeFile(txtPath, `${text.trim()}\n`, "utf8");
      captureSummary.push({
        finalUrl: page.url(),
        label,
        responseStatus: response?.status() ?? null,
        textSnippet,
        txtPath,
        variant: variant.label,
      });
      console.log(`${variant.label}:${label} -> ${page.url()} [${response?.status() ?? "n/a"}]`);
      await writeCaptureSummary();

      if (label === "dashboard") {
        const firstNavCard = page.locator(".montelar-admin-nav-card").first();

        if (await firstNavCard.count()) {
          await firstNavCard.focus();
          await page.waitForTimeout(150);
          const focusPath = path.join(outputDir, `${label}-focus-${variant.label}.png`);

          await page.screenshot({ fullPage: true, path: focusPath });
          captureSummary.push({
            finalUrl: page.url(),
            label: `${label}-focus`,
            responseStatus: response?.status() ?? null,
            textSnippet,
            txtPath,
            variant: variant.label,
          });
          console.log(`${variant.label}:${label}-focus -> ${page.url()} [focus]`);
          await writeCaptureSummary();
        }
      }
    }
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });

try {
  for (const variant of variants) {
    await captureVariant(browser, variant);
  }
  await writeCaptureSummary();
} finally {
  await browser.close();
}
