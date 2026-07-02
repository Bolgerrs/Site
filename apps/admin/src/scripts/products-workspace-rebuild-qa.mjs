import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const manifestPath = process.argv[2];
const outputDir = process.argv[3];

if (!manifestPath || !outputDir) {
  console.error("usage: node products-workspace-rebuild-qa.mjs <manifest.json> <output-dir>");
  process.exit(1);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
await fs.mkdir(outputDir, { recursive: true });

const forbiddenTerms = [
  "Payload",
  "raw",
  "record",
  "schema",
  "template",
  "collection",
  "relation",
  "workspace",
  "/admin/collections",
  "/admin/advanced?raw=",
];

const variants = [
  { label: "desktop-1440", options: { viewport: { width: 1440, height: 900 } } },
  { label: "laptop-1366", options: { viewport: { width: 1366, height: 820 } } },
  { label: "tablet", options: { ...devices["iPad Mini"] } },
  { label: "mobile", options: { ...devices["iPhone 13"] } },
];

const summary = {
  actionInventory: {},
  deepLinks: {},
  forbiddenHits: [],
  manifest: {
    baseUrl: manifest.baseUrl,
    routes: {
      productCatalog: manifest.routes.productCatalog,
      productChecks: manifest.routes.productChecks,
      productCreate: manifest.routes.productCreate,
      productMediaGlobal: manifest.routes.productMediaGlobal,
      productTranslations: manifest.routes.productTranslations,
    },
    seedSummary: manifest.seedSummary,
  },
  reversePaths: {},
  screenshots: [],
};

async function login(page) {
  await page.goto(`${manifest.baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="email"]').first().fill(manifest.credentials.email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(manifest.credentials.password);
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login", {
      timeout: 30000,
    }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForLoadState("networkidle");
}

async function capture(page, name, options = {}) {
  await page.waitForTimeout(500);
  const text = await page.locator("body").innerText();
  const uiText = await page
    .locator(
      [
        ".montelar-site-console__rail",
        ".montelar-owner-shell-topbar",
        ".montelar-products-summary",
        ".montelar-products-toolbar",
        ".montelar-products-filterbar",
        ".montelar-products-bulk",
        ".montelar-products-tree",
        "[data-montelar-products-editor]",
      ].join(", "),
    )
    .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? "").join("\n"));
  const hrefs = await page.locator("a").evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href") ?? "").filter(Boolean),
  );
  const hits = forbiddenTerms.filter((term) => {
    if (term.startsWith("/admin/")) {
      return hrefs.some((href) => href.includes(term));
    }

    return uiText.includes(term);
  });
  const pngPath = path.join(outputDir, `${name}.png`);
  const txtPath = path.join(outputDir, `${name}.txt`);

  await page.screenshot({ fullPage: true, path: pngPath });
  await fs.writeFile(txtPath, `${text.trim()}\n`, "utf8");
  summary.screenshots.push({ finalUrl: page.url(), hits, name, pngPath, txtPath });

  if (options.scanForbidden !== false && hits.length > 0) {
    summary.forbiddenHits.push({ hits, name });
  }

  return text;
}

async function assertVisible(page, selector, label) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 15000 });

  if (!(await locator.isVisible())) {
    throw new Error(`${label} is not visible.`);
  }
}

async function openTab(page, label, selector) {
  await page.getByRole("tab", { name: label }).click();
  await assertVisible(page, selector, `${label} tab`);
}

async function getSelectedTab(page) {
  return page.locator('[role="tab"][aria-selected="true"]').first().innerText();
}

async function assertSelectedProductTab(page, expectedTabPattern, label) {
  await assertVisible(page, "[data-montelar-products-editor]", `${label} product editor`);
  const selectedTabText = await getSelectedTab(page);
  if (!expectedTabPattern.test(selectedTabText)) {
    throw new Error(`${label} landed on "${selectedTabText}" instead of expected product editor tab.`);
  }
  return selectedTabText;
}

async function clickProductEditorLink(page, selector, label) {
  const link = page.locator(selector).first();
  await link.waitFor({ state: "visible", timeout: 15000 });
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin/products", { timeout: 30000 }),
    link.click(),
  ]);
  await page.waitForLoadState("networkidle");
  return page.url();
}

async function runReversePathInteraction(page) {
  await page.goto(manifest.routes.productMediaGlobal, { waitUntil: "networkidle" });
  await capture(page, "reverse-media-01-global", { scanForbidden: false });
  await clickProductEditorLink(
    page,
    'a[href*="/admin/products"][href*="panel=media"]',
    "global media product placement",
  );
  const mediaTab = await assertSelectedProductTab(page, /Медиа/, "global media reverse path");
  await capture(page, "reverse-media-02-product-editor");
  summary.reversePaths.media = {
    finalUrl: page.url(),
    selectedTabText: mediaTab,
    sourceRoute: manifest.routes.productMediaGlobal,
  };

  await page.goto(manifest.routes.productTranslations, { waitUntil: "networkidle" });
  await capture(page, "reverse-translations-01-global", { scanForbidden: false });
  await clickProductEditorLink(
    page,
    'a[href*="/admin/products"][href*="panel=translations"]',
    "global translations product owner",
  );
  const translationsTab = await assertSelectedProductTab(page, /Переводы/, "global translations reverse path");
  await capture(page, "reverse-translations-02-product-editor");
  summary.reversePaths.translations = {
    finalUrl: page.url(),
    selectedTabText: translationsTab,
    sourceRoute: manifest.routes.productTranslations,
  };

  await page.goto(manifest.routes.productChecks, { waitUntil: "networkidle" });
  await capture(page, "reverse-checks-01-global", { scanForbidden: false });
  const repairButton = page.getByRole("button", { name: /Назначить фото товара|Открыть SEO товара|Назначить форму заявки|Назначить категорию/ }).first();
  await repairButton.waitFor({ state: "visible", timeout: 15000 });
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin/products", { timeout: 30000 }),
    repairButton.click(),
  ]);
  await page.waitForLoadState("networkidle");
  const checksTab = await assertSelectedProductTab(page, /Медиа|SEO|Форма|Категория|Выпуск/, "global checks reverse path");
  await capture(page, "reverse-checks-02-product-editor");
  summary.reversePaths.checks = {
    finalUrl: page.url(),
    selectedTabText: checksTab,
    sourceRoute: manifest.routes.productChecks,
  };
}

async function runDesktopInteraction(page) {
  await page.goto(manifest.routes.productCatalog, { waitUntil: "networkidle" });
  await assertVisible(page, "[data-montelar-products-category-tree]", "category tree");
  await assertVisible(page, "[data-montelar-products-bulk]", "bulk panel");
  await assertVisible(page, "[data-montelar-products-editor]", "selected product editor");
  await page.locator(".montelar-products-row__select").first().click();
  await capture(page, "products-desktop-selected-content");

  await openTab(page, "Категория", "[data-montelar-products-save-category]");
  await capture(page, "products-desktop-category-tab");
  await openTab(page, "Медиа", "[data-montelar-products-save-media]");
  await capture(page, "products-desktop-media-tab");
  await openTab(page, "Форма", "[data-montelar-products-save-form]");
  await capture(page, "products-desktop-form-tab");
  await openTab(page, "SEO", "[data-montelar-products-save-seo]");
  await page.locator("[data-montelar-products-seo-title]").fill(`MNT-BFF-013 SEO ${Date.now()}`);
  await page.locator("[data-montelar-products-seo-description]").fill("MNT-BFF-013 browser QA SEO description.");
  await page.locator("[data-montelar-products-save-seo]").click();
  await page.waitForTimeout(900);
  await capture(page, "products-desktop-seo-saved");
  await openTab(page, "Выпуск", "[data-montelar-products-ready-review]");
  await capture(page, "products-desktop-publish-tab");

  const editor = page.locator("[data-montelar-products-editor]").first();
  summary.actionInventory = {
    editorActions: await editor.locator("a,button").count(),
    primaryActionsInActiveTab: await editor.locator(".montelar-products-action.is-primary").count(),
    tabs: await editor.locator('[role="tab"]').count(),
  };

  await page.locator(".montelar-products-row__bulk input").first().check();
  await page.locator("[data-montelar-products-bulk] button").first().waitFor({ state: "visible" });
  await capture(page, "products-desktop-bulk-selected");

  await page.goto(manifest.routes.productCreate, { waitUntil: "networkidle" });
  await assertVisible(page, "[data-montelar-products-create-wizard]", "create wizard");
  await capture(page, "products-desktop-create-wizard");

  for (const panel of ["media", "form", "seo", "translations", "publish"]) {
    const url = `${manifest.baseUrl}/admin/products?product=${encodeURIComponent(
      String(manifest.seedSummary.productId),
    )}&panel=${panel}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await assertVisible(page, `[role="tab"][aria-selected="true"]`, `${panel} deep link`);
    const text = await capture(page, `products-deeplink-${panel}`);
    summary.deepLinks[panel] = {
      finalUrl: page.url(),
      selectedTabText: await page.locator('[role="tab"][aria-selected="true"]').first().innerText(),
      textHasProductEditor: text.includes("Редактор продукта"),
    };
  }

  await runReversePathInteraction(page);
}

async function runVariant(browser, variant) {
  const context = await browser.newContext(variant.options);
  const page = await context.newPage();

  try {
    await login(page);
    await page.goto(manifest.routes.productCatalog, { waitUntil: "networkidle" });
    await assertVisible(page, "[data-montelar-products-editor]", `${variant.label} editor`);
    await capture(page, `products-${variant.label}`);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });

try {
  const desktopContext = await browser.newContext(variants[0].options);
  const desktopPage = await desktopContext.newPage();

  try {
    await login(desktopPage);
    await runDesktopInteraction(desktopPage);
  } finally {
    await desktopContext.close();
  }

  for (const variant of variants.slice(1)) {
    await runVariant(browser, variant);
  }

  if (summary.forbiddenHits.length > 0) {
    throw new Error(`Forbidden first-layer product terms or raw links found: ${JSON.stringify(summary.forbiddenHits)}`);
  }

  if (summary.actionInventory.primaryActionsInActiveTab !== 1) {
    throw new Error(`Expected one primary action in active product editor tab, got ${summary.actionInventory.primaryActionsInActiveTab}.`);
  }

  for (const key of ["media", "translations", "checks"]) {
    if (!summary.reversePaths[key]?.finalUrl?.includes("/admin/products")) {
      throw new Error(`Missing reverse ${key} proof from global queue to product editor.`);
    }
  }

  await fs.writeFile(
    path.join(outputDir, "products-workspace-rebuild-qa.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(outputDir, "manifest.repro.json"),
    `${JSON.stringify(summary.manifest, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(outputDir, "README.md"),
    [
      "# MNT-ADMIN-BFF-013 Products Workspace QA",
      "",
      "## Reference Mechanics",
      "",
      "- Webasyst product admin: product/category tree plus selected product editor; adapted as Montelar category tree + catalog rows + canonical editor.",
      "- Metronic shell: stable left navigation, topbar, main work zone and inspector rhythm; adapted inside the common Montelar owner shell.",
      "- Limitless data/forms: dense table/list and grouped form mechanics; adapted as product tabs and compact save actions.",
      "- Rejected pattern: card-wall/button-wall navigation. Evidence keeps one active product, a table/list surface, editor tabs and one primary action in the active tab.",
      "",
      "- Captured desktop, laptop, tablet and mobile product workspace states.",
      "- Captured product editor tabs: category, media, form, SEO, translations and publish.",
      "- Captured create wizard, bulk selection and exact product deep links.",
      "- Captured reverse global media, translations and checks paths into the exact product editor tab.",
      "- Saved non-secret `manifest.repro.json` with route map and fixture IDs.",
      "- Verified no first-layer raw collection links or forbidden owner vocabulary in captured text/links.",
      "",
      `Action inventory: ${JSON.stringify(summary.actionInventory)}`,
      `Reverse paths: ${JSON.stringify(summary.reversePaths)}`,
      "",
    ].join("\n"),
    "utf8",
  );
} finally {
  await browser.close();
}
