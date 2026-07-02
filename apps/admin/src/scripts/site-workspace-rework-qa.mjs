import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const outputDir = path.resolve(
  process.cwd(),
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-012/rework-20260513",
);
const baseUrl = (process.env.MONTELAR_ADMIN_QA_BASE_URL || "http://127.0.0.1:3002").replace(/\/+$/, "");
const email = process.env.MONTELAR_QA_EMAIL || "owner@montelar.example";
const password = process.env.MONTELAR_QA_PASSWORD || "MontelarSmoke123!";

const chromiumLaunchOptions = {
  args: [
    "--disable-background-networking",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-gpu",
    "--disable-gpu-compositing",
    "--disable-renderer-backgrounding",
    "--disable-software-rasterizer",
    "--no-default-browser-check",
    "--no-first-run",
    "--use-gl=disabled",
  ],
  headless: true,
};

const variants = [
  { label: "desktop-1440", options: { viewport: { width: 1440, height: 960 } } },
  { label: "laptop-1366", options: { viewport: { width: 1366, height: 900 } } },
  { label: "tablet-768", options: { viewport: { width: 768, height: 1024 } } },
  { label: "mobile-390", options: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } } },
];

function urlFor(pathname) {
  return pathname.startsWith("http") ? pathname : `${baseUrl}${pathname}`;
}

function normalizeHref(href) {
  if (!href) {
    return "";
  }

  try {
    const url = new URL(href, baseUrl);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

function decodedRawTarget(href) {
  if (!href) {
    return "";
  }

  try {
    const url = new URL(href, baseUrl);
    const rawTarget = url.pathname === "/admin/advanced" ? url.searchParams.get("raw") : "";

    if (rawTarget?.startsWith("/admin/collections")) {
      return rawTarget;
    }

    if (url.pathname === "/admin/collections" || url.pathname.startsWith("/admin/collections/")) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    if (href.includes("/admin/collections")) {
      return href;
    }
  }

  return "";
}

function isExplicitAdvancedLink(link) {
  return /Расширенн|Полный режим|полную запись|служебн|advanced/i.test(link.label ?? "");
}

function findOwnerRawLeaks(links) {
  return links
    .map((link) => ({
      ...link,
      href: normalizeHref(link.href),
      rawTarget: decodedRawTarget(link.href),
    }))
    .filter((link) => link.rawTarget && !isExplicitAdvancedLink(link));
}

async function login(page) {
  await page.goto(urlFor("/admin/login"), { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login", {
      timeout: 45000,
    }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForLoadState("networkidle");
}

async function screenshot(page, name, extra = null) {
  const pngPath = path.join(outputDir, `${name}.png`);
  const txtPath = path.join(outputDir, `${name}.txt`);
  const text = (await page.locator("body").innerText()).trim();
  const extraText = extra ? `\n\nQA_FIELD_VALUES\n${JSON.stringify(extra, null, 2)}` : "";
  await page.screenshot({ fullPage: false, path: pngPath, timeout: 45000 });
  await fs.writeFile(txtPath, `${text}${extraText}\n`, "utf8");
  return { pngPath, text: `${text}${extraText}`, txtPath };
}

async function readVisibleLinks(page, selector = "a:visible") {
  return page.locator(selector).evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute("href"),
      label: link.textContent?.replace(/\s+/g, " ").trim() || "",
    })),
  );
}

async function waitForSiteEditor(page) {
  await page.locator(".montelar-site-product__layout").waitFor({ state: "visible", timeout: 45000 });
  await page.waitForTimeout(900);
}

async function clickTab(page, label) {
  const tab = page.locator(".montelar-site-editor-tabs button").filter({ hasText: label }).first();
  await tab.waitFor({ state: "visible", timeout: 30000 });
  await tab.click();
  await page.waitForTimeout(500);
}

async function withPage(fn, options = { viewport: { width: 1366, height: 900 } }) {
  const browser = await chromium.launch(chromiumLaunchOptions);
  const context = await browser.newContext(options);
  const page = await context.newPage();

  try {
    await login(page);
    return await fn(page);
  } finally {
    await context.close();
    await browser.close();
  }
}

function classifyActions(actions) {
  return actions.map((action) => {
    const container = action.container;
    const label = action.label;
    let category = "secondary";

    if (container.includes("montelar-site-product__tree") || container.includes("montelar-site-owner-flow")) {
      category = "nav/tree";
    } else if (container.includes("montelar-site-editor-tabs")) {
      category = "tabs";
    } else if (container.includes("montelar-site-product__inspector")) {
      category = "inspector";
    } else if (/Сохранить текст и кнопки/i.test(label)) {
      category = "primary page action";
    } else if (/Сохранить SEO|Сохранить$/i.test(label)) {
      category = "context save";
    } else if (/Предпросмотр|Проверить и опубликовать/i.test(label)) {
      category = "publish/preview";
    }

  return { ...action, category };
  });
}

function stripQaMarkers(value, fallback = "") {
  const cleaned = String(value || "")
    .replace(/\s*QA BFF012 \d+/g, "")
    .replace(/\s*QA_(?:PAGE|CTA|SEO|BLOCK)_\d+/g, "")
    .trim();

  return cleaned || fallback;
}

async function getActionInventory(page) {
  const rawActions = await page.locator('a:visible, button:visible, input[type="submit"]:visible').evaluateAll((nodes) =>
    nodes.map((node) => ({
      container: node.closest("header, aside, main, section, div")?.className?.toString() || "",
      href: node.getAttribute("href") || "",
      label: node.textContent?.replace(/\s+/g, " ").trim() || node.getAttribute("aria-label") || "",
      tag: node.tagName.toLowerCase(),
    })),
  );
  const classified = classifyActions(rawActions);
  const counts = classified.reduce((acc, action) => {
    acc[action.category] = (acc[action.category] ?? 0) + 1;
    return acc;
  }, {});

  return {
    actions: classified,
    counts,
    primaryPageActions: classified.filter((action) => action.category === "primary page action"),
    rawOwnerLeaks: findOwnerRawLeaks(classified),
    total: classified.length,
  };
}

async function captureResponsive() {
  const rows = [];

  for (const variant of variants) {
    await withPage(async (page) => {
      const response = await page.goto(urlFor("/admin/site"), { waitUntil: "networkidle" });
      await waitForSiteEditor(page);
      const capture = await screenshot(page, `site-${variant.label}`);
      const inventory = await getActionInventory(page);
      rows.push({
        forbiddenHits: inventory.rawOwnerLeaks,
        hasInspector: await page.locator(".montelar-site-product__inspector").count(),
        hasTreeHome: /Главная|Home/i.test(capture.text),
        inventoryCounts: inventory.counts,
        primaryPageActionCount: inventory.primaryPageActions.length,
        responseStatus: response?.status() ?? null,
        screenshot: `site-${variant.label}.png`,
        variant: variant.label,
        visibleActions: inventory.total,
      });
    }, variant.options);
  }

  return rows;
}

async function captureUiMutationPath() {
  return withPage(async (page) => {
    await page.goto(urlFor("/admin/site"), { waitUntil: "networkidle" });
    await waitForSiteEditor(page);

    const originalTitle = await page.locator('label:has-text("Главный заголовок") input').inputValue();
    const originalPrimary = await page.locator('label:has-text("Текст основной кнопки страницы") input').inputValue();
    const originalSeoTitle = await page.locator('label:has-text("SEO-заголовок") input').inputValue();
    const restoredTitle = stripQaMarkers(originalTitle, "Home");
    const restoredPrimary = stripQaMarkers(originalPrimary, "Explore directions");
    const restoredSeoTitle = stripQaMarkers(originalSeoTitle, "Montelar Home");
    const stamp = Date.now();
    const pageTitleMarker = `QA_PAGE_${stamp}`;
    const ctaMarker = `QA_CTA_${stamp}`;
    const seoMarker = `QA_SEO_${stamp}`;
    const blockMarker = `QA_BLOCK_${stamp}`;

    await page.locator('label:has-text("Главный заголовок") input').fill(`${originalTitle} ${pageTitleMarker}`.trim());
    await page.locator('label:has-text("Текст основной кнопки страницы") input').fill(ctaMarker);
    const [contentResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/internal/owner-site-commands") && response.request().method() === "POST"),
      page.locator("button").filter({ hasText: "Сохранить текст и кнопки" }).click(),
    ]);
    if (!contentResponse.ok()) {
      throw new Error(`content save failed: ${contentResponse.status()}`);
    }
    await page.waitForTimeout(900);
    const savedTitleValue = await page.locator('label:has-text("Главный заголовок") input').inputValue();
    const savedCtaValue = await page.locator('label:has-text("Текст основной кнопки страницы") input').inputValue();
    const contentCapture = await screenshot(page, "ui-save-01-content-and-cta", {
      ctaMarker,
      pageTitleMarker,
      savedCtaValue,
      savedTitleValue,
    });

    await page.locator('label:has-text("SEO-заголовок") input').fill(seoMarker);
    const [seoResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/internal/owner-site-commands") && response.request().method() === "POST"),
      page.locator("button").filter({ hasText: "Сохранить SEO" }).click(),
    ]);
    if (!seoResponse.ok()) {
      throw new Error(`SEO save failed: ${seoResponse.status()}`);
    }
    await page.waitForTimeout(900);
    const savedSeoValue = await page.locator('label:has-text("SEO-заголовок") input').inputValue();
    const seoCapture = await screenshot(page, "ui-save-02-seo", {
      savedSeoValue,
      seoMarker,
    });

    await clickTab(page, "Блоки");
    await page.locator(".montelar-site-block-row__main").first().click();
    await page.locator("#block-editor").waitFor({ state: "visible", timeout: 30000 });
    const originalBlockTitle = await page.locator('#block-editor label:has-text("Заголовок") input').first().inputValue();
    const restoredBlockTitle = stripQaMarkers(originalBlockTitle, "Homepage signature hero");
    const visibility = page.locator('#block-editor input[type="checkbox"]').first();
    const originalVisible = await visibility.isChecked();

    await page.locator('#block-editor label:has-text("Заголовок") input').first().fill(`${originalBlockTitle} ${blockMarker}`.trim());
    await visibility.setChecked(!originalVisible);
    const [blockResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/internal/owner-site-blocks") && response.request().method() === "PATCH"),
      page.locator("#block-editor button").filter({ hasText: "Сохранить" }).click(),
    ]);
    if (!blockResponse.ok()) {
      throw new Error(`block save failed: ${blockResponse.status()}`);
    }
    await page.locator(".montelar-site-workspace__status").filter({ hasText: "Загружаю" }).waitFor({
      state: "detached",
      timeout: 30000,
    }).catch(() => {});
    await page.locator("#block-editor").waitFor({ state: "visible", timeout: 30000 });
    const blockTitleInput = page.locator('#block-editor label:has-text("Заголовок") input').first();
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const currentValue = await blockTitleInput.inputValue().catch(() => "");
      if (currentValue.includes(blockMarker)) {
        break;
      }
      await page.waitForTimeout(500);
    }
    const savedBlockTitleValue = await page.locator('#block-editor label:has-text("Заголовок") input').first().inputValue();
    const savedVisibleValue = await visibility.isChecked();
    const blockCapture = await screenshot(page, "ui-save-03-block-visibility", {
      blockMarker,
      originalVisible,
      savedBlockTitleValue,
      savedVisibleValue,
    });

    await page.locator('#block-editor label:has-text("Заголовок") input').first().fill(restoredBlockTitle);
    await visibility.setChecked(originalVisible);
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/internal/owner-site-blocks") && response.request().method() === "PATCH"),
      page.locator("#block-editor button").filter({ hasText: "Сохранить" }).click(),
    ]);

    await clickTab(page, "Контент");
    await page.locator('label:has-text("Главный заголовок") input').fill(restoredTitle);
    await page.locator('label:has-text("Текст основной кнопки страницы") input').fill(restoredPrimary);
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/internal/owner-site-commands") && response.request().method() === "POST"),
      page.locator("button").filter({ hasText: "Сохранить текст и кнопки" }).click(),
    ]);

    await page.locator('label:has-text("SEO-заголовок") input').fill(restoredSeoTitle);
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/internal/owner-site-commands") && response.request().method() === "POST"),
      page.locator("button").filter({ hasText: "Сохранить SEO" }).click(),
    ]);
    await page.waitForTimeout(900);
    const restoredTitleValue = await page.locator('label:has-text("Главный заголовок") input').inputValue();
    const restoredCtaValue = await page.locator('label:has-text("Текст основной кнопки страницы") input').inputValue();
    const restoredSeoValue = await page.locator('label:has-text("SEO-заголовок") input').inputValue();
    const restoredCapture = await screenshot(page, "ui-save-04-restored-state", {
      restoredCtaValue,
      restoredSeoValue,
      restoredTitleValue,
    });
    const postRestoreHasQaMarkers = /QA_(?:PAGE|CTA|SEO|BLOCK)_\d+|QA BFF012 \d+/.test(restoredCapture.text);

    return {
      blockTextVisibleAfterSave: blockCapture.text.includes(blockMarker) && savedBlockTitleValue.includes(blockMarker),
      contentCtaVisibleAfterSave: contentCapture.text.includes(ctaMarker) && savedCtaValue === ctaMarker,
      contentTextVisibleAfterSave: contentCapture.text.includes(pageTitleMarker) && savedTitleValue.includes(pageTitleMarker),
      finalUrl: page.url(),
      markers: {
        blockMarker,
        ctaMarker,
        pageTitleMarker,
        seoMarker,
      },
      postRestoreHasQaMarkers,
      restoredOriginals: !postRestoreHasQaMarkers,
      seoTextVisibleAfterSave: seoCapture.text.includes(seoMarker) && savedSeoValue === seoMarker,
    };
  });
}

async function captureReversePath(kind, startPath, actionLocatorFactory, expectedHash = "") {
  return withPage(async (page) => {
    const response = await page.goto(urlFor(startPath), { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await screenshot(page, `reverse-${kind}-01-global`);

    const action = actionLocatorFactory(page);
    await action.waitFor({ state: "visible", timeout: 30000 });
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/admin/site" || url.pathname.startsWith("/admin/site"), {
        timeout: 30000,
      }),
      action.click(),
    ]);
    await page.waitForLoadState("networkidle");
    await waitForSiteEditor(page);
    if (expectedHash) {
      await page.locator(expectedHash).waitFor({ state: "attached", timeout: 15000 }).catch(() => {});
    }
    const landed = await screenshot(page, `reverse-${kind}-02-site-editor`);
    const links = await readVisibleLinks(page);

    return {
      finalUrl: page.url(),
      hasPageEditor: /Контент страницы|Что редактируем|Блоки страницы/.test(landed.text),
      hasSelectedBlockContext: /Сейчас открыт блок|Редактор блока|блок:/i.test(landed.text),
      initialStatus: response?.status() ?? null,
      rawOwnerLeaks: findOwnerRawLeaks(links),
    };
  });
}

async function captureReversePaths() {
  const media = await captureReversePath(
    "media",
    "/admin/media?usage=page-surface&pageId=1",
    (page) => page.locator("a").filter({ hasText: "Открыть страницу-источник" }).first(),
  );
  const translations = await captureReversePath(
    "translations",
    "/admin/translations?ownerCollection=pages&ownerKey=home",
    (page) => page.locator(".montelar-translations-detail__actions a").filter({ hasText: /Открыть страницу|Открыть:/ }).first(),
  );
  const checks = await captureReversePath(
    "checks",
    "/admin/checks?check=empty-images",
    (page) => page.locator(".montelar-checks-panel__list button, .montelar-checks-panel__actions a").first(),
  );

  return { checks, media, translations };
}

async function captureActionInventory() {
  return withPage(async (page) => {
    await page.goto(urlFor("/admin/site"), { waitUntil: "networkidle" });
    await waitForSiteEditor(page);
    const inventory = await getActionInventory(page);
    await fs.writeFile(path.join(outputDir, "action-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
    return inventory;
  });
}

function createReport(evidence) {
  const reverseRawLeaks =
    evidence.reversePaths.media.rawOwnerLeaks.length +
    evidence.reversePaths.translations.rawOwnerLeaks.length +
    evidence.reversePaths.checks.rawOwnerLeaks.length;

  return `# MNT-ADMIN-BFF-012 Rework Evidence

Runtime: \`${baseUrl}\`

## Result

- Before baseline: copied from prior accepted \`MNT-ADMIN-BFF-011/rework-20260513/site-*.png\` into \`before-baseline/\`; this is the committed pre-\`MNT-ADMIN-BFF-012\` owner shell state.
- Responsive after screenshots: desktop 1440, laptop 1366, tablet 768, mobile 390.
- Reverse click paths: media=${evidence.reversePaths.media.hasPageEditor}, translations=${evidence.reversePaths.translations.hasPageEditor}, checks=${evidence.reversePaths.checks.hasPageEditor}.
- Reverse path non-advanced raw leaks: ${reverseRawLeaks}.
- UI save path: page title=${evidence.uiMutationPath.contentTextVisibleAfterSave}, CTA=${evidence.uiMutationPath.contentCtaVisibleAfterSave}, SEO=${evidence.uiMutationPath.seoTextVisibleAfterSave}, block/visibility=${evidence.uiMutationPath.blockTextVisibleAfterSave}; originals restored=${evidence.uiMutationPath.restoredOriginals}.
- Action inventory: ${evidence.actionInventory.total} visible actions classified; primary page actions=${evidence.actionInventory.primaryPageActions.length}; raw owner leaks=${evidence.actionInventory.rawOwnerLeaks.length}.

## Action Classification

${Object.entries(evidence.actionInventory.counts)
  .map(([name, count]) => `- ${name}: ${count}`)
  .join("\n")}

The active page editor has exactly one primary page action: \`${evidence.actionInventory.primaryPageActions[0]?.label ?? "missing"}\`.
Other visible controls are classified as page tree, tabs, context saves, preview/publish or inspector actions, so the previous raw count of 33 is not treated as proof by itself.

## Artifacts

- \`rework-evidence.json\`
- \`action-inventory.json\`
- \`before-baseline/*.png\`
- \`site-*.png\`
- \`reverse-*-01-global.png\`
- \`reverse-*-02-site-editor.png\`
- \`ui-save-01-content-and-cta.png\`
- \`ui-save-02-seo.png\`
- \`ui-save-03-block-visibility.png\`
- \`ui-save-04-restored-state.png\`
`;
}

await fs.mkdir(outputDir, { recursive: true });

const responsive = await captureResponsive();
const actionInventory = await captureActionInventory();
const uiMutationPath = await captureUiMutationPath();
const reversePaths = await captureReversePaths();
const evidence = {
  actionInventory,
  baseUrl,
  createdAt: new Date().toISOString(),
  responsive,
  reversePaths,
  uiMutationPath,
};

await fs.writeFile(path.join(outputDir, "rework-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(outputDir, "README.md"), createReport(evidence), "utf8");

const failures = [];
if (actionInventory.primaryPageActions.length !== 1) {
  failures.push(`expected one primary page action, got ${actionInventory.primaryPageActions.length}`);
}
if (actionInventory.rawOwnerLeaks.length > 0) {
  failures.push(`action inventory raw leaks: ${actionInventory.rawOwnerLeaks.length}`);
}
for (const [kind, result] of Object.entries(reversePaths)) {
  if (!result.hasPageEditor) {
    failures.push(`${kind} reverse path did not land in page editor`);
  }
  if (result.rawOwnerLeaks.length > 0) {
    failures.push(`${kind} reverse path raw leaks: ${result.rawOwnerLeaks.length}`);
  }
}
if (
  !uiMutationPath.contentTextVisibleAfterSave ||
  !uiMutationPath.contentCtaVisibleAfterSave ||
  !uiMutationPath.seoTextVisibleAfterSave ||
  !uiMutationPath.blockTextVisibleAfterSave ||
  !uiMutationPath.restoredOriginals
) {
  failures.push("UI save screenshots did not include distinct saved markers for page title, CTA, SEO and block paths, or restore left QA markers behind");
}

if (failures.length > 0) {
  throw new Error(`site-workspace-rework-qa failed: ${failures.join("; ")}`);
}

console.log(`site-workspace-rework-qa: ok ${outputDir}`);
