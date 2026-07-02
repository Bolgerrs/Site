import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:3002").replace(/\/+$/, "");
const outputDir = path.resolve(
  process.cwd(),
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-006",
);
const email = process.env.MONTELAR_QA_EMAIL || "owner@montelar.example";
const password = process.env.MONTELAR_QA_PASSWORD || "MontelarSmoke123!";

const variants = [
  ["desktop-1440", { viewport: { width: 1440, height: 960 } }],
  ["laptop-1366", { viewport: { width: 1366, height: 860 } }],
  ["tablet", { ...devices["iPad Mini"] }],
  ["mobile", { ...devices["iPhone 13"] }],
];

async function writeProbeImages() {
  await fs.mkdir(path.resolve(appRoot, ".tmp"), { recursive: true });
  const source = path.resolve(appRoot, ".tmp", "bff006-owner-upload.png");
  const replacement = path.resolve(appRoot, ".tmp", "bff006-owner-replacement.png");
  const onePixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
    "base64",
  );
  await fs.writeFile(source, onePixel);
  await fs.writeFile(replacement, onePixel);
  return { replacement, source };
}

async function login(page) {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login", {
      timeout: 30000,
    }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForLoadState("networkidle");
}

async function screenshot(page, name) {
  await page.waitForTimeout(900);
  await page.screenshot({ fullPage: true, path: path.join(outputDir, `${name}.png`) });
  await fs.writeFile(path.join(outputDir, `${name}.txt`), `${(await page.locator("body").innerText()).trim()}\n`);
}

async function waitForMediaCommand(page, action) {
  const response = await page.waitForResponse(
    (entry) =>
      entry.url().includes("/api/internal/owner-media-commands") &&
      entry.request().method() === "POST",
    { timeout: 30000 },
  );
  const json = await response.json();
  if (!response.ok() || json?.ok !== true) {
    throw new Error(`${action} failed with ${response.status()}: ${JSON.stringify(json)}`);
  }
  return { json, status: response.status() };
}

async function createTemporaryPage(page, suffix) {
  const result = await page.evaluate(async (timestamp) => {
    const response = await fetch("/api/internal/owner-site-commands", {
      body: JSON.stringify({
        action: "page.create",
        payload: {
          canonicalPath: `/preview/bff006-media-${timestamp}`,
          heroSummary: "Temporary BFF006 media browser QA page.",
          internalCode: `PAGE_BFF006_MEDIA_${timestamp}`,
          pageFamily: "hidden-preview",
          previewPath: `/preview/bff006-media-${timestamp}`,
          routePath: `/preview/bff006-media-${timestamp}`,
          showInFooter: false,
          showInHeader: false,
          slug: `bff006-media-${timestamp}`,
          status: "draft",
          title: `BFF006 media browser page ${timestamp}`,
        },
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    return { body: await response.json(), status: response.status };
  }, suffix);

  if (result.status >= 300 || result.body?.ok !== true || !result.body?.selectedPageId) {
    throw new Error(`Unable to create temporary page: ${JSON.stringify(result)}`);
  }

  return String(result.body.selectedPageId);
}

async function captureVariant(browser, label, options, phase, selectedAssetId = "") {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try {
    await login(page);
    const url = selectedAssetId
      ? `${baseUrl}/admin/media?selected=${encodeURIComponent(selectedAssetId)}`
      : `${baseUrl}/admin/media`;
    await page.goto(url, { waitUntil: "networkidle" });
    await screenshot(page, `${phase}-media-${label}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const files = await writeProbeImages();
  const browser = await chromium.launch({ headless: true });
  const suffix = Date.now();
  const evidence = {
    baseUrl,
    created: {},
    steps: [],
    user: email,
  };

  try {
    for (const [label, options] of variants) {
      await captureVariant(browser, label, options, "before");
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    await login(page);
    evidence.steps.push("login: owner reached admin media workspace");
    await page.goto(`${baseUrl}/admin/media`, { waitUntil: "networkidle" });

    const uploadPanel = page.locator(".montelar-media-panel").filter({ hasText: "Загрузить файл" }).first();
    await uploadPanel.locator('input[name="file"]').setInputFiles(files.source);
    await uploadPanel.locator('input[name="assetTitle"]').fill(`BFF006 browser uploaded media ${suffix}`);
    await uploadPanel.locator('input[name="altText"]').fill("BFF006 browser upload alt text");
    const uploadWait = waitForMediaCommand(page, "media.upload");
    await uploadPanel.getByRole("button", { name: "Загрузить в медиатеку" }).click();
    const upload = await uploadWait;
    const assetId = String(upload.json.assetId);
    evidence.created.assetId = assetId;
    evidence.steps.push(`upload: UI submitted owner media command, asset ${assetId}`);
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });
    await screenshot(page, "clickpath-01-upload-selected-desktop");

    const replacePanel = page.locator(".montelar-media-panel").filter({ hasText: "Заменить файл" }).first();
    await replacePanel.locator('input[name="file"]').setInputFiles(files.replacement);
    await replacePanel.locator('input[name="changeReason"]').fill("BFF006 browser replacement evidence");
    const replaceWait = waitForMediaCommand(page, "media.replace");
    await replacePanel.getByRole("button", { name: "Заменить без потери привязок" }).click();
    await replaceWait;
    evidence.steps.push("replace: UI replaced file while keeping usage links");
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });
    await screenshot(page, "clickpath-02-replaced-desktop");

    const cropPanel = page.locator(".montelar-media-panel").filter({ hasText: "Desktop / mobile crop" }).first();
    await cropPanel.locator('input[type="number"]').nth(0).fill("0.05");
    await cropPanel.locator('input[type="number"]').nth(1).fill("0.08");
    await cropPanel.locator('input[type="number"]').nth(2).fill("0.9");
    await cropPanel.locator('input[type="number"]').nth(3).fill("0.86");
    const desktopCropWait = waitForMediaCommand(page, "media.crop.save desktop");
    await cropPanel.getByRole("button", { name: "Сохранить crop" }).click();
    await desktopCropWait;
    await cropPanel.getByRole("button", { name: "Mobile" }).click();
    await cropPanel.locator('input[type="number"]').nth(0).fill("0.12");
    await cropPanel.locator('input[type="number"]').nth(1).fill("0.04");
    await cropPanel.locator('input[type="number"]').nth(2).fill("0.76");
    await cropPanel.locator('input[type="number"]').nth(3).fill("0.92");
    const mobileCropWait = waitForMediaCommand(page, "media.crop.save mobile");
    await cropPanel.getByRole("button", { name: "Сохранить crop" }).click();
    await mobileCropWait;
    evidence.steps.push("crop: desktop and mobile crop presets saved through UI");
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });
    await screenshot(page, "clickpath-03-crop-saved-desktop");

    const pageId = await createTemporaryPage(page, suffix);
    evidence.created.pageId = pageId;
    const assignPanel = page.locator(".montelar-media-panel").filter({ hasText: "Привязать к сайту" }).first();
    await assignPanel.locator('input[name="pageId"]').fill(pageId);
    await assignPanel.locator('select[name="slot"]').selectOption("cover");
    const assignWait = waitForMediaCommand(page, "media.assign");
    await assignPanel.getByRole("button", { name: "Привязать медиа" }).click();
    await assignWait;
    evidence.steps.push(`assign: UI assigned media ${assetId} to temporary page ${pageId}`);
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });

    const whereUsed = await page.evaluate(async (id) => {
      const response = await fetch("/api/internal/owner-media-commands", {
        body: JSON.stringify({ action: "media.where-used", payload: { assetId: id } }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      return { body: await response.json(), status: response.status };
    }, assetId);
    const linkedPages = whereUsed.body?.snapshot?.assetDetail?.linkedPages ?? [];
    if (!linkedPages.some((item) => String(item.id).includes(pageId) || String(item.label).includes(String(suffix)))) {
      throw new Error(`where-used response did not include temporary page ${pageId}`);
    }
    evidence.steps.push("where-used: command response and owner detail graph include the temporary page");
    evidence.whereUsedStatus = whereUsed.status;
    evidence.whereUsedLinkedPages = linkedPages.map((item) => ({ id: item.id, label: item.label, meta: item.meta }));
    await screenshot(page, "clickpath-04-assigned-where-used-desktop");
    await context.close();

    for (const [label, options] of variants) {
      await captureVariant(browser, label, options, "after", assetId);
    }

    await fs.writeFile(
      path.join(outputDir, "browser-owner-media-rework-evidence.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );
    console.log(`owner-media-browser-qa: ok ${assetId}`);
  } finally {
    await browser.close();
    await fs.rm(files.source, { force: true });
    await fs.rm(files.replacement, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
