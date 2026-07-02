import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:3002").replace(/\/+$/, "");
const outputDir = path.resolve(
  process.cwd(),
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-007",
);
const email = process.env.MONTELAR_QA_EMAIL || "owner@montelar.example";
const password = process.env.MONTELAR_QA_PASSWORD || "MontelarSmoke123!";

const variants = [
  ["desktop-1440", { viewport: { width: 1440, height: 960 } }],
  ["laptop-1366", { viewport: { width: 1366, height: 860 } }],
  ["tablet", { ...devices["iPad Mini"] }],
  ["mobile", { ...devices["iPhone 13"] }],
];

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
  await page.waitForTimeout(800);
  await page.screenshot({ fullPage: true, path: path.join(outputDir, `${name}.png`) });
  await fs.writeFile(path.join(outputDir, `${name}.txt`), `${(await page.locator("body").innerText()).trim()}\n`);
}

async function waitForApi(page, pathPart, method) {
  const response = await page.waitForResponse(
    (entry) => entry.url().includes(pathPart) && entry.request().method() === method,
    { timeout: 30000 },
  );
  const body = await response.json();
  if (!response.ok() || body?.ok !== true) {
    throw new Error(`${method} ${pathPart} failed with ${response.status()}: ${JSON.stringify(body)}`);
  }
  return { body, status: response.status() };
}

async function captureRoute(browser, label, options, url, name) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try {
    await login(page);
    await page.goto(url, { waitUntil: "networkidle" });
    await screenshot(page, `${name}-${label}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const evidence = {
    baseUrl,
    createdTranslationId: "",
    previewHref: "",
    steps: [],
    user: email,
  };

  try {
    const missingUrl = `${baseUrl}/admin/translations?filter=missing&locale=de`;
    for (const [label, options] of variants) {
      await captureRoute(browser, label, options, missingUrl, "before-missing-queue");
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    await login(page);
    await page.goto(missingUrl, { waitUntil: "networkidle" });

    const firstCard = page.locator(".montelar-translations-card").filter({ hasText: "пусто" }).first();
    await firstCard.waitFor({ state: "visible", timeout: 30000 });
    await firstCard.click();
    await screenshot(page, "clickpath-01-missing-selected-desktop");
    evidence.steps.push("missing: selected first empty German translation item");

    const createWait = waitForApi(page, "/api/internal/translations-workspace", "POST");
    await page.getByRole("button", { name: "Создать черновик перевода" }).click();
    const createResult = await createWait;
    evidence.createdTranslationId = String(createResult.body.id);
    evidence.steps.push(`draft: created translation ${evidence.createdTranslationId}`);
    await page.waitForTimeout(1400);
    await page.goto(`${baseUrl}/admin/translations?locale=de`, { waitUntil: "networkidle" });

    const createdCard = page.locator(".montelar-translations-card").filter({ hasText: "черновик" }).first();
    await createdCard.waitFor({ state: "visible", timeout: 30000 });
    await createdCard.click();
    await screenshot(page, "clickpath-02-draft-opened-desktop");

    const targetTextarea = page.locator(".montelar-translations-content-field textarea:not([readonly])").first();
    await targetTextarea.waitFor({ state: "visible", timeout: 30000 });
    await targetTextarea.fill(`BFF007 browser QA German copy ${Date.now()}`);
    await page.locator(".montelar-translations-content-note textarea").fill("BFF007 browser QA: preview selected language after content save.");
    const contentWait = waitForApi(page, `/api/internal/translations-workspace/${evidence.createdTranslationId}/content`, "PATCH");
    await page.getByRole("button", { name: "Сохранить переводимый текст" }).click();
    await contentWait;
    evidence.steps.push("content: saved translated visible field through content PATCH");
    await page.waitForTimeout(1200);
    await screenshot(page, "clickpath-03-content-saved-desktop");

    const previewLink = page
      .locator(".montelar-translations-detail__actions a")
      .filter({ hasText: /live|опубликованную|текущую/i })
      .first();
    evidence.previewHref = (await previewLink.getAttribute("href")) || "";
    if (!evidence.previewHref.startsWith("http")) {
      throw new Error(`Expected selected-language preview link, got ${evidence.previewHref}`);
    }
    evidence.steps.push(`preview: selected language link available at ${evidence.previewHref}`);
    await context.close();

    for (const [label, options] of variants) {
      await captureRoute(browser, label, options, `${baseUrl}/admin/translations?locale=de`, "after-content-editor");
    }

    await fs.writeFile(
      path.join(outputDir, "browser-owner-translations-evidence.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );
    console.log(`owner-translations-browser-qa: ok ${evidence.createdTranslationId}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
