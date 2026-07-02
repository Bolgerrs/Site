import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const manifestPath = process.argv[2];
const outputDir = process.argv[3];

if (!manifestPath || !outputDir) {
  console.error("usage: node component-visual-gate-browser-capture.mjs <manifest.json> <output-dir>");
  process.exit(1);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const siteBaseUrl = String(manifest.routes.publicPreview || "http://localhost:8093/").replace(/\/+$/, "");
await fs.mkdir(outputDir, { recursive: true });

const adminScreens = [
  ["site-modules", manifest.routes.siteModules],
  ["custom-module-check", `${manifest.baseUrl}/admin/checks?check=custom-module-settings`],
];

const publicScreens = [
  ["public-home-desktop", siteBaseUrl],
  ["public-home-mobile-closed", siteBaseUrl],
  ["public-home-mobile-open", siteBaseUrl],
  ["public-secondary-route", `${siteBaseUrl}/brand`],
];

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
}

async function writePageText(page, label) {
  const text = await page.locator("body").innerText().catch(() => "");
  await fs.writeFile(path.join(outputDir, `${label}.txt`), `${text.trim()}\n`, "utf8");
  return text.trim().slice(0, 320);
}

async function captureAdmin(browser, summary) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  try {
    await login(page);
    for (const [label, url] of adminScreens) {
      const response = await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      await page.screenshot({ fullPage: true, path: path.join(outputDir, `${label}-desktop.png`) });
      summary.push({
        finalUrl: page.url(),
        label: `${label}-desktop`,
        status: response?.status() ?? null,
        textSnippet: await writePageText(page, `${label}-desktop`),
      });
    }
  } finally {
    await context.close();
  }

  const mobileContext = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobileContext.newPage();

  try {
    await login(mobilePage);
    const response = await mobilePage.goto(manifest.routes.siteModules, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(900);
    await mobilePage.screenshot({ fullPage: true, path: path.join(outputDir, "site-modules-mobile.png") });
    summary.push({
      finalUrl: mobilePage.url(),
      label: "site-modules-mobile",
      status: response?.status() ?? null,
      textSnippet: await writePageText(mobilePage, "site-modules-mobile"),
    });
  } finally {
    await mobileContext.close();
  }
}

async function openPublicMenuIfPossible(page) {
  const candidates = [
    page.locator('button[aria-expanded="false"]').first(),
    page.locator('button[aria-label*="menu" i]').first(),
    page.locator('button[aria-label*="меню" i]').first(),
    page.locator(".mobile-nav-toggle").first(),
  ];

  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      await candidate.click().catch(() => {});
      await page.waitForTimeout(700);
      return true;
    }
  }

  return false;
}

async function capturePublic(browser, summary) {
  for (const [label, url] of publicScreens) {
    const isMobile = label.includes("mobile");
    const context = await browser.newContext(
      isMobile ? { ...devices["iPhone 13"] } : { viewport: { width: 1440, height: 960 } },
    );
    const page = await context.newPage();

    try {
      const response = await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1100);
      if (label.endsWith("open")) {
        await openPublicMenuIfPossible(page);
      }
      await page.screenshot({ fullPage: true, path: path.join(outputDir, `${label}.png`) });
      summary.push({
        finalUrl: page.url(),
        label,
        status: response?.status() ?? null,
        textSnippet: await writePageText(page, label),
      });
    } finally {
      await context.close();
    }
  }
}

const browser = await chromium.launch({ headless: true });
const summary = [];

try {
  await captureAdmin(browser, summary);
  await capturePublic(browser, summary);
  await fs.writeFile(path.join(outputDir, "browser-capture-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log("component-visual-gate-browser-capture: ok");
} finally {
  await browser.close();
}
