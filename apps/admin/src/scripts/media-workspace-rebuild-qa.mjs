import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const appRoot = path.resolve(dirname, "../..");
const repoRoot = path.resolve(appRoot, "../..");
const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:3002").replace(/\/+$/, "");
const outputDir = path.resolve(
  repoRoot,
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-014/media-workspace",
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
  const { default: sharp } = await import("sharp");
  await fs.mkdir(path.resolve(appRoot, ".tmp"), { recursive: true });
  const source = path.resolve(appRoot, ".tmp", "bff014-owner-upload.png");
  const replacement = path.resolve(appRoot, ".tmp", "bff014-owner-replacement.png");
  const batch = path.resolve(appRoot, ".tmp", "bff014-owner-batch.png");
  const heavy = path.resolve(appRoot, ".tmp", "bff014-owner-heavy.png");
  const onePixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WzqkAAAAASUVORK5CYII=",
    "base64",
  );
  const heavyPng = await sharp({
    create: {
      background: { b: 112, g: 112, r: 112 },
      channels: 3,
      height: 2600,
      width: 2600,
    },
  })
    .png({ compressionLevel: 0 })
    .toBuffer();
  await fs.writeFile(source, onePixel);
  await fs.writeFile(replacement, onePixel);
  await fs.writeFile(batch, onePixel);
  await fs.writeFile(heavy, heavyPng);
  return { batch, heavy, replacement, source };
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
  await page.waitForTimeout(700);
  await page.screenshot({ fullPage: true, path: path.join(outputDir, `${name}.png`) });
  await fs.writeFile(path.join(outputDir, `${name}.txt`), `${(await page.locator("body").innerText()).trim()}\n`);
}

async function waitForMediaCommand(page, action) {
  const response = await page.waitForResponse(
    (entry) => entry.url().includes("/api/internal/owner-media-commands") && entry.request().method() === "POST",
    { timeout: 30000 },
  );
  const json = await response.json();
  if (!response.ok() || json?.ok !== true) {
    throw new Error(`${action} failed with ${response.status()}: ${JSON.stringify(json)}`);
  }
  return { json, status: response.status() };
}

async function waitForProductCommand(page, action) {
  const response = await page.waitForResponse(
    (entry) => entry.url().includes("/api/internal/owner-product-commands") && entry.request().method() === "POST",
    { timeout: 30000 },
  );
  const json = await response.json();
  if (!response.ok() || json?.products == null) {
    throw new Error(`${action} failed with ${response.status()}: ${JSON.stringify(json)}`);
  }
  return { json, status: response.status() };
}

async function collectHrefInventory(page) {
  return page.locator("a").evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute("href") ?? "",
      text: link.textContent?.trim() ?? "",
    })),
  );
}

function findNonExplicitAdvancedHrefs(...inventories) {
  return inventories
    .flat()
    .filter((link) => link.href.includes("/admin/advanced?raw="))
    .filter((link) => !/(служебн|расширенн|advanced)/i.test(link.text));
}

async function createTemporaryPage(page, suffix) {
  const result = await page.evaluate(async (timestamp) => {
    const response = await fetch("/api/internal/owner-site-commands", {
      body: JSON.stringify({
        action: "page.create",
        payload: {
          canonicalPath: `/preview/bff014-media-${timestamp}`,
          heroSummary: "Temporary BFF014 media workspace page.",
          internalCode: `PAGE_BFF014_MEDIA_${timestamp}`,
          pageFamily: "hidden-preview",
          previewPath: `/preview/bff014-media-${timestamp}`,
          routePath: `/preview/bff014-media-${timestamp}`,
          showInFooter: false,
          showInHeader: false,
          slug: `bff014-media-${timestamp}`,
          status: "draft",
          title: `BFF014 media workspace page ${timestamp}`,
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

async function captureVariant(browser, label, options, assetId = "") {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try {
    await login(page);
    await page.goto(`${baseUrl}/admin/media${assetId ? `?selected=${encodeURIComponent(assetId)}` : ""}`, {
      waitUntil: "networkidle",
    });
    await page.locator(".montelar-media-workbench").waitFor({ timeout: 15000 });
    const columns = await page.locator(".montelar-media-library-pane, .montelar-media-editor-pane, .montelar-media-inspector").count();
    if (columns !== 3) {
      throw new Error(`Expected three media workbench columns, got ${columns}.`);
    }
    await screenshot(page, `after-media-${label}`);
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
    forbiddenVisibleTerms: [],
    steps: [],
    userRole: "owner",
  };

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    await login(page);
    await page.goto(`${baseUrl}/admin/media`, { waitUntil: "networkidle" });
    await page.locator(".montelar-media-workbench").waitFor({ timeout: 15000 });
    evidence.steps.push("login: owner reached rebuilt media workbench");
    await screenshot(page, "clickpath-00-workbench-desktop");

    const uploadPanel = page.locator(".montelar-media-panel").filter({ hasText: "Загрузить файл" }).first();
    await uploadPanel.locator('input[name="file"]').setInputFiles(files.source);
    await uploadPanel.locator('input[name="assetTitle"]').fill(`BFF014 media workspace upload ${suffix}`);
    await uploadPanel.locator('input[name="altText"]').fill("BFF014 rebuilt media workspace alt text");
    const uploadWait = waitForMediaCommand(page, "media.upload");
    await uploadPanel.getByRole("button", { name: "Загрузить в медиатеку" }).click();
    const upload = await uploadWait;
    const assetId = String(upload.json.assetId);
    evidence.created.assetId = assetId;
    evidence.steps.push(`upload: selected asset ${assetId}`);
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });
    await screenshot(page, "clickpath-01-upload-selected-desktop");

    const heavyUploadPanel = page.locator(".montelar-media-panel").filter({ hasText: "Загрузить файл" }).first();
    await heavyUploadPanel.locator('input[name="file"]').setInputFiles(files.heavy);
    await heavyUploadPanel.locator('input[name="assetTitle"]').fill(`BFF014 heavy media queue fixture ${suffix}`);
    await heavyUploadPanel.locator('input[name="altText"]').fill("Heavy queue fixture for BFF014 evidence");
    const heavyUploadWait = waitForMediaCommand(page, "media.upload heavy");
    await heavyUploadPanel.getByRole("button", { name: "Загрузить в медиатеку" }).click();
    const heavyUpload = await heavyUploadWait;
    const heavyAssetId = String(heavyUpload.json.assetId);
    evidence.created.heavyAssetId = heavyAssetId;
    evidence.steps.push(`heavy-fixture: uploaded heavy asset ${heavyAssetId}`);
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });

    await Promise.all([
      page.waitForURL((url) => url.searchParams.get("filter") === "heavy", { timeout: 10000 }),
      page.locator(".montelar-media-queue").filter({ hasText: "Тяжёлые" }).first().click(),
    ]);
    if (!page.url().includes("filter=heavy")) {
      throw new Error(`Heavy media queue did not set filter=heavy: ${page.url()}`);
    }
    const heavyQueueText = await page.locator("body").innerText();
    if (!heavyQueueText.includes(`BFF014 heavy media queue fixture ${suffix}`)) {
      throw new Error("Heavy media queue did not show the uploaded heavy fixture.");
    }
    evidence.heavyQueueTextProbe = `BFF014 heavy media queue fixture ${suffix}`;
    evidence.steps.push("heavy-queue: populated heavy media queue applies filter=heavy");
    await screenshot(page, "clickpath-01b-heavy-queue-desktop");
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });

    const hrefInventory = await page.locator("a").evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute("href") ?? "",
        text: link.textContent?.trim() ?? "",
      })),
    );
    evidence.hrefInventory = hrefInventory;
    evidence.directRawHrefs = hrefInventory.filter((link) => link.href.includes("/admin/collections"));
    evidence.advancedRawHrefs = hrefInventory.filter((link) => link.href.includes("/admin/advanced?raw="));
    evidence.nonExplicitAdvancedHrefs = findNonExplicitAdvancedHrefs(hrefInventory);
    if (evidence.directRawHrefs.length > 0) {
      throw new Error(`Direct raw hrefs leaked into media workspace: ${JSON.stringify(evidence.directRawHrefs)}`);
    }
    if (evidence.nonExplicitAdvancedHrefs.length > 0) {
      throw new Error(`Non-explicit advanced raw hrefs leaked into media workspace: ${JSON.stringify(evidence.nonExplicitAdvancedHrefs)}`);
    }

    const batchPanel = page.locator(".montelar-media-accordion").filter({ hasText: "Пакетная загрузка" }).first();
    await batchPanel.locator("summary").click();
    await batchPanel.locator('input[name="files"]').setInputFiles(files.batch);
    const batchWait = waitForMediaCommand(page, "media.batch-upload");
    await batchPanel.getByRole("button", { name: "Загрузить выбранные файлы" }).click();
    await batchWait;
    evidence.steps.push("batch-upload: owner batch uploader submitted files");
    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(assetId)}`, { waitUntil: "networkidle" });

    const replacePanel = page.locator(".montelar-media-panel").filter({ hasText: "Заменить файл" }).first();
    await replacePanel.locator('input[name="file"]').setInputFiles(files.replacement);
    await replacePanel.locator('input[name="changeReason"]').fill("BFF014 replacement evidence");
    const replaceWait = waitForMediaCommand(page, "media.replace");
    await replacePanel.getByRole("button", { name: "Заменить без потери привязок" }).click();
    await replaceWait;
    evidence.steps.push("replace: file replaced while usage links stay on the same asset");

    const cropPanel = page.locator(".montelar-media-panel").filter({ hasText: "Кадрирование для экрана и телефона" }).first();
    await cropPanel.locator('input[type="number"]').nth(0).fill("0.05");
    await cropPanel.locator('input[type="number"]').nth(1).fill("0.08");
    const desktopCropWait = waitForMediaCommand(page, "media.crop.save desktop");
    await cropPanel.getByRole("button", { name: "Сохранить crop" }).click();
    await desktopCropWait;
    await cropPanel.getByRole("button", { name: "Телефон" }).click();
    await cropPanel.locator('input[type="number"]').nth(0).fill("0.12");
    await cropPanel.locator('input[type="number"]').nth(1).fill("0.04");
    const mobileCropWait = waitForMediaCommand(page, "media.crop.save mobile");
    await cropPanel.getByRole("button", { name: "Сохранить crop" }).click();
    await mobileCropWait;
    evidence.steps.push("crop: desktop and mobile presets saved");

    const pageId = await createTemporaryPage(page, suffix);
    evidence.created.pageId = pageId;
    const assignPanel = page.locator(".montelar-media-panel").filter({ hasText: "Привязать к сайту" }).first();
    await assignPanel.locator('input[name="pageId"]').fill(pageId);
    await assignPanel.locator('select[name="slot"]').selectOption("cover");
    const assignWait = waitForMediaCommand(page, "media.assign");
    await assignPanel.getByRole("button", { name: "Привязать медиа" }).click();
    await assignWait;
    evidence.steps.push(`assign: media assigned to temporary page ${pageId}`);
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
    const linkedPage = linkedPages.find((item) => String(item.id).includes(pageId) || String(item.label).includes(String(suffix)));
    if (!linkedPage?.label) {
      throw new Error(`where-used response did not include a clickable page label for ${pageId}`);
    }
    evidence.steps.push("where-used: inspector and command snapshot include assigned page");
    evidence.whereUsedStatus = whereUsed.status;
    evidence.whereUsedLinkedPages = linkedPages.map((item) => ({ id: item.id, label: item.label, meta: item.meta }));
    await screenshot(page, "clickpath-02-assigned-where-used-desktop");

    await page.getByRole("link", { name: linkedPage.label }).first().click();
    await page.waitForURL((url) => url.pathname.endsWith("/admin/site") && url.searchParams.get("selected") === pageId, {
      timeout: 15000,
    });
    await page.locator("#page-media-panel").waitFor({ timeout: 15000 });
    await page.locator('[data-montelar-site-media-editor="page"]').waitFor({ timeout: 15000 });
    const siteMediaText = await page.locator("#page-media-panel").innerText();
    const normalizedSiteMediaText = siteMediaText.toLocaleLowerCase("ru-RU");
    if (
      !normalizedSiteMediaText.includes("текущий файл перед заменой") ||
      !normalizedSiteMediaText.includes("открыть текущий файл") ||
      !normalizedSiteMediaText.includes("текущий pdf/документ") ||
      !normalizedSiteMediaText.includes("загрузить изображение/видео здесь") ||
      !normalizedSiteMediaText.includes("сохранить alt и crop") ||
      !normalizedSiteMediaText.includes("загрузить pdf здесь")
    ) {
      await fs.writeFile(path.join(outputDir, "clickpath-03-where-used-site-media-editor-debug.txt"), `${siteMediaText.trim()}\n`);
      throw new Error("where-used click did not open the Site page-owned current media preview editor.");
    }
    evidence.steps.push("where-used-click: opened exact Site page media editor from Media usage link with current preview, open action and image/video/document controls");
    evidence.whereUsedClickUrl = page.url();
    await screenshot(page, "clickpath-03-where-used-site-media-editor");

    const productState = await page.evaluate(async () => {
      const response = await fetch("/api/internal/owner-products", {
        credentials: "include",
        headers: { "Cache-Control": "no-store" },
      });
      return { body: await response.json(), status: response.status };
    });
    const product = productState.body?.cards?.[0];
    if (productState.status >= 300 || !product?.id) {
      throw new Error(`Unable to load owner product state: ${JSON.stringify(productState)}`);
    }
    evidence.created.productId = String(product.id);
    evidence.created.productKey = String(product.productKey || product.id);

    await page.goto(`${baseUrl}/admin/products?product=${encodeURIComponent(String(product.id))}&panel=media`, {
      waitUntil: "networkidle",
    });
    await page.locator('[data-montelar-product-media-editor]').waitFor({ timeout: 15000 });
    await page.locator('[data-montelar-product-current-preview]').waitFor({ timeout: 15000 });
    await page.locator('[data-montelar-products-alt]').fill(`BFF014 product media alt ${suffix}`);
    await page.locator('[data-montelar-products-upload-slot]').selectOption("card");
    await page.locator('[data-montelar-products-upload-file]').setInputFiles(files.batch);
    const coverUploadWait = waitForMediaCommand(page, "product cover upload");
    const coverProductWait = waitForProductCommand(page, "product cover save");
    await page.locator('[data-montelar-products-upload-attach]').click();
    const coverUpload = await coverUploadWait;
    await coverProductWait;
    evidence.created.productCoverAssetId = String(coverUpload.json.assetId);
    evidence.steps.push("product-cover: uploaded and attached cover inside Products media tab");

    await page.locator('[data-montelar-products-upload-slot]').selectOption("gallery-object");
    await page.locator('[data-montelar-products-upload-file]').setInputFiles(files.source);
    const galleryUploadWait = waitForMediaCommand(page, "product gallery upload");
    const galleryProductWait = waitForProductCommand(page, "product gallery refresh");
    await page.locator('[data-montelar-products-upload-attach]').click();
    const galleryUpload = await galleryUploadWait;
    await galleryProductWait;
    const productAssetId = String(galleryUpload.json.assetId);
    evidence.created.productAssetId = productAssetId;
    evidence.steps.push("product-gallery: uploaded gallery placement inside Products media tab");

    await page.locator('[data-montelar-products-selected-asset]').selectOption(productAssetId);
    await page.locator('[data-montelar-products-alt]').fill(`BFF014 product gallery updated alt ${suffix}`);
    await page.locator('[data-montelar-products-crop-field="x"]').fill("0.06");
    await page.locator('[data-montelar-products-crop-field="y"]').fill("0.07");
    await page.locator('[data-montelar-products-crop-field="width"]').fill("0.88");
    await page.locator('[data-montelar-products-crop-field="height"]').fill("0.82");
    const altCropProductWait = waitForProductCommand(page, "product alt crop save");
    await page.locator('[data-montelar-products-save-alt-crop]').click();
    await altCropProductWait;
    evidence.steps.push("product-alt-crop: saved alt and crop inside Products media tab");

    await page.locator('[data-montelar-products-replace-file]').setInputFiles(files.replacement);
    const replaceProductWait = waitForProductCommand(page, "product media replace refresh");
    await page.locator('[data-montelar-products-replace-asset]').click();
    await replaceProductWait;
    evidence.steps.push("product-replace: replaced selected product asset inside Products media tab");

    await page.locator('[data-montelar-products-document-file]').setInputFiles(files.heavy);
    const documentUploadWait = waitForMediaCommand(page, "product document upload");
    const documentProductWait = waitForProductCommand(page, "product document refresh");
    await page.locator('[data-montelar-products-upload-document]').click();
    const documentUpload = await documentUploadWait;
    await documentProductWait;
    const productDocumentId = String(documentUpload.json.documentId);
    evidence.created.productDocumentId = productDocumentId;
    if (!productDocumentId || productDocumentId === "undefined") {
      throw new Error(`Product document upload did not return documentId: ${JSON.stringify(documentUpload.json)}`);
    }
    evidence.steps.push("product-document: uploaded product document inside Products media tab");

    await page.locator('[data-montelar-products-document-select]').selectOption(productDocumentId);
    await page.locator('[data-montelar-products-document-file]').setInputFiles(files.replacement);
    const documentReplaceWait = waitForMediaCommand(page, "product document replace");
    const documentReplaceProductWait = waitForProductCommand(page, "product document replace refresh");
    await page.locator('[data-montelar-products-upload-document]').click();
    await documentReplaceWait;
    await documentReplaceProductWait;
    evidence.steps.push("product-document-replace: replaced selected product PDF inside Products media tab");
    await screenshot(page, "clickpath-04-product-media-editor");
    const productPreviewTextAfterReplace = await page.locator('[data-montelar-product-media-editor]').innerText();
    const normalizedProductPreviewTextAfterReplace = productPreviewTextAfterReplace.toLocaleLowerCase("ru-RU");
    if (
      !normalizedProductPreviewTextAfterReplace.includes("текущий файл продукта перед заменой") ||
      !normalizedProductPreviewTextAfterReplace.includes("открыть текущий файл") ||
      !normalizedProductPreviewTextAfterReplace.includes("текущий pdf/документ") ||
      !normalizedProductPreviewTextAfterReplace.includes("открыть текущий документ")
    ) {
      await fs.writeFile(
        path.join(outputDir, "clickpath-04-product-media-editor-current-preview-debug.txt"),
        `${productPreviewTextAfterReplace.trim()}\n`,
      );
      throw new Error("Products media editor did not show current file and document preview before replacement.");
    }

    await page.goto(`${baseUrl}/admin/media?selected=${encodeURIComponent(productAssetId)}`, { waitUntil: "networkidle" });
    await page.locator(".montelar-media-workbench").waitFor({ timeout: 15000 });
    await page.getByRole("link", { name: product.label }).first().click();
    await page.waitForURL((url) => url.pathname.endsWith("/admin/products") && url.searchParams.get("panel") === "media", {
      timeout: 15000,
    });
    await page.locator('[data-montelar-product-media-editor]').waitFor({ timeout: 15000 });
    await page.locator('[data-montelar-product-current-preview]').waitFor({ timeout: 15000 });
    evidence.productWhereUsedClickUrl = page.url();
    evidence.steps.push("where-used-click: product asset returned to exact Products media editor");
    await screenshot(page, "clickpath-05-where-used-product-media-editor");

    await page.goto(`${baseUrl}/admin/media?filter=documents&selected=${encodeURIComponent(`document:${productDocumentId}`)}`, {
      waitUntil: "networkidle",
    });
    await page.locator(".montelar-media-workbench").waitFor({ timeout: 15000 });
    await page.getByRole("link", { name: product.label }).first().click();
    await page.waitForURL((url) => url.pathname.endsWith("/admin/products") && url.searchParams.get("panel") === "media", {
      timeout: 15000,
    });
    await page.locator('[data-montelar-product-media-editor]').waitFor({ timeout: 15000 });
    await page.locator('[data-montelar-product-document-preview]').waitFor({ timeout: 15000 });
    evidence.productDocumentWhereUsedClickUrl = page.url();
    evidence.steps.push("where-used-click: product document returned to exact Products media editor");
    await screenshot(page, "clickpath-06-where-used-product-document-editor");

    const bodyText = await page.locator("body").innerText();
    const productMediaText = await page.locator('[data-montelar-product-media-editor]').innerText();
    const productMediaTextLower = productMediaText.toLowerCase();
    const forbiddenFirstLayerProductTerms = [
      "Payload",
      "raw",
      "record",
      "schema",
      "route",
      "template",
      "collection",
      "relation",
      "/admin/collections",
      "ownerRecordKey",
      "productInquiryForms",
      "pageSections",
      "Документ ID",
      "Заменяет документ ID",
      "ID из документов",
    ];
    evidence.forbiddenVisibleTerms = forbiddenFirstLayerProductTerms.filter((term) => {
      if (term === "/admin/collections" || term === "Payload") {
        return bodyText.includes(term);
      }
      return productMediaTextLower.includes(term.toLowerCase());
    });
    if (evidence.forbiddenVisibleTerms.length > 0) {
      throw new Error(`Forbidden visible terms: ${evidence.forbiddenVisibleTerms.join(", ")}`);
    }
    await context.close();

    for (const [label, options] of variants) {
      await captureVariant(browser, label, options, assetId);
    }

    const repro = {
      baseUrl,
      createdAssetId: evidence.created.assetId,
      createdPageId: evidence.created.pageId,
      evidenceFiles: [
        "clickpath-00-workbench-desktop.png",
        "clickpath-01-upload-selected-desktop.png",
        "clickpath-01b-heavy-queue-desktop.png",
        "clickpath-02-assigned-where-used-desktop.png",
        "clickpath-04-product-media-editor.png",
        "clickpath-05-where-used-product-media-editor.png",
        "clickpath-06-where-used-product-document-editor.png",
        ...variants.map(([label]) => `after-media-${label}.png`),
      ],
      steps: evidence.steps,
      advancedRawHrefs: evidence.advancedRawHrefs,
      directRawHrefs: evidence.directRawHrefs,
      nonExplicitAdvancedHrefs: evidence.nonExplicitAdvancedHrefs,
      whereUsedStatus: evidence.whereUsedStatus,
      productDocumentWhereUsedClickUrl: evidence.productDocumentWhereUsedClickUrl,
      productWhereUsedClickUrl: evidence.productWhereUsedClickUrl,
    };
    await fs.writeFile(path.join(outputDir, "media-workspace-rebuild-qa.json"), `${JSON.stringify(evidence, null, 2)}\n`);
    await fs.writeFile(path.join(outputDir, "manifest.repro.json"), `${JSON.stringify(repro, null, 2)}\n`);
    await fs.writeFile(
      path.join(outputDir, "README.md"),
      `# MNT-ADMIN-BFF-014 Media Workspace QA\n\nRebuilt media workbench evidence for upload, batch upload, replace, crop, assign and where-used.\n\nSteps: ${evidence.steps.join(" -> ")}\n`,
    );
    console.log(`media-workspace-rebuild-qa: ok ${assetId}`);
  } finally {
    await browser.close();
    await fs.rm(files.source, { force: true });
    await fs.rm(files.replacement, { force: true });
    await fs.rm(files.batch, { force: true });
    await fs.rm(files.heavy, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
