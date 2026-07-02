import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const manifestPath = process.argv[2];
const outputDir = process.argv[3];

if (!manifestPath || !outputDir) {
  console.error("usage: node owner-ui-language-capture.mjs <manifest.json> <output-dir>");
  process.exit(1);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
await fs.mkdir(outputDir, { recursive: true });

const variants = [
  { label: "desktop", options: { viewport: { width: 1440, height: 960 } } },
  { label: "laptop-1366", options: { viewport: { width: 1366, height: 900 } } },
  { label: "tablet", options: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
  { label: "mobile", options: { ...devices["iPhone 13"] } },
];

const variantFilter = new Set(
  (process.env.MONTELAR_CAPTURE_VARIANTS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
);

const surfaces = [
  ["dashboard", manifest.routes.dashboard],
  ["site-workspace", manifest.routes.siteWorkspace],
  ["product-catalog", manifest.routes.productCatalog],
  ["product-create", manifest.routes.productCreate],
  ["product-editor", manifest.routes.productEditor],
  ["media", manifest.routes.media],
  ["leads", manifest.routes.leads],
  ["translations", manifest.routes.translations],
  ["checks", manifest.routes.checks],
  ["settings", manifest.routes.settings],
  ["site-admin", manifest.routes.siteAdmin],
];

const surfaceFilter = new Set(
  (process.env.MONTELAR_CAPTURE_SURFACES || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
);

const captureSummary = [];

async function login(page) {
  await page.goto(`${manifest.baseUrl}/admin/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await emailInput.waitFor({ state: "visible", timeout: 60000 });
  await passwordInput.waitFor({ state: "visible", timeout: 60000 });
  await emailInput.fill(manifest.credentials.email);
  await passwordInput.fill(manifest.credentials.password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin" || (url.pathname.startsWith("/admin/") && url.pathname !== "/admin/login"), {
      timeout: 60000,
    }),
    submitButton.click(),
  ]);
}

async function settle(page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
  }
  await page.waitForTimeout(900);
}

async function waitForSurfaceReady(page, label) {
  if (!label.startsWith("product")) {
    return;
  }

  await page
    .locator(
      [
        ".montelar-products-row",
        ".montelar-products-detail__facts",
        "[data-montelar-products-name]",
        ".montelar-products-empty:has-text('Каталог действительно пуст')",
      ].join(", "),
    )
    .first()
    .waitFor({ state: "visible", timeout: 20000 });
}

async function captureVariant(browser, variant) {
  const context = await browser.newContext(variant.options);
  const page = await context.newPage();

  try {
    await login(page);
    await settle(page);

    for (const [label, url] of surfaces) {
      if (surfaceFilter.size > 0 && !surfaceFilter.has(label)) {
        continue;
      }

      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle(page);
      await waitForSurfaceReady(page, label);

      const pngPath = path.join(outputDir, `${label}-${variant.label}.png`);
      const txtPath = path.join(outputDir, `${label}-${variant.label}.txt`);
      const text = await page.locator("body").innerText({ timeout: 30000 });

      await page.screenshot({ animations: "disabled", fullPage: false, path: pngPath, timeout: 60000 });
      await fs.writeFile(txtPath, `${text.trim()}\n`, "utf8");
      captureSummary.push({
        finalUrl: page.url(),
        label,
        responseStatus: response?.status() ?? null,
        textSnippet: text.trim().slice(0, 400),
        txtPath,
        variant: variant.label,
      });
      console.log(`${variant.label}:${label} -> ${page.url()} [${response?.status() ?? "n/a"}]`);
    }
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });

try {
  for (const variant of variants) {
    if (variantFilter.size > 0 && !variantFilter.has(variant.label)) {
      continue;
    }
    await captureVariant(browser, variant);
  }

  const summaryPath = path.join(outputDir, "owner-ui-language-capture-summary.json");
  let previousSummary = [];
  try {
    previousSummary = JSON.parse(await fs.readFile(summaryPath, "utf8"));
  } catch {
    previousSummary = [];
  }

  const mergedSummary = [...previousSummary, ...captureSummary].reduce((items, item) => {
    const key = `${item.variant}:${item.label}`;
    items.set(key, item);
    return items;
  }, new Map());

  await fs.writeFile(summaryPath, `${JSON.stringify(Array.from(mergedSummary.values()), null, 2)}\n`, "utf8");
} finally {
  await browser.close();
}
