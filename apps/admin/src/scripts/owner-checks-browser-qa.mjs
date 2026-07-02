import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:3002").replace(/\/+$/, "");
const projectRoot = process.cwd().endsWith(`${path.sep}apps${path.sep}admin`)
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();
const outputDir = path.resolve(
  projectRoot,
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-008",
);
const email = process.env.MONTELAR_QA_EMAIL || "owner@montelar.example";
const password = process.env.MONTELAR_QA_PASSWORD || "MontelarSmoke123!";

const variants = [
  ["desktop-1440", { viewport: { width: 1440, height: 960 } }],
  ["laptop-1366", { viewport: { width: 1366, height: 820 } }],
  ["tablet", { ...devices["iPad Pro 11"] }],
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

async function captureRoute(browser, label, options, namePrefix = "checks-repair-queue") {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try {
    await login(page);
    await page.goto(`${baseUrl}/admin/checks?check=site-health`, { waitUntil: "networkidle" });
    await screenshot(page, `${namePrefix}-${label}`);
  } finally {
    await context.close();
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const evidence = {
    baseUrl,
    finalUrl: "",
    repairResponse: null,
    steps: [],
    user: email,
  };

  try {
    await captureRoute(browser, "desktop-1440", { viewport: { width: 1440, height: 960 } }, "before-checks-route");

    for (const [label, options] of variants) {
      await captureRoute(browser, label, options);
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    await login(page);
    await page.goto(`${baseUrl}/admin/checks?check=site-health`, { waitUntil: "networkidle" });
    const firstRepair = page.locator(".montelar-checks-panel__list button").first();
    await firstRepair.waitFor({ state: "visible", timeout: 30000 });
    await screenshot(page, "clickpath-01-issue-selected");
    evidence.steps.push("checks: opened site-health issue queue");

    const repairResponsePromise = page.waitForResponse(
      (entry) =>
        entry.url().includes("/api/internal/owner/checks/site-health/issues/") &&
        entry.url().endsWith("/fix") &&
        entry.request().method() === "POST",
      { timeout: 30000 },
    );
    await firstRepair.click();
    const repairResponse = await repairResponsePromise;
    const body = await repairResponse.json();
    if (!repairResponse.ok() || body?.ok !== true || !body?.targetHref) {
      throw new Error(`repair endpoint failed: ${repairResponse.status()} ${JSON.stringify(body)}`);
    }
    if (body?.mutates !== false || body?.commandContract !== "open-guided-editor-target") {
      throw new Error(`repair endpoint contract is unclear: ${JSON.stringify(body)}`);
    }

    evidence.repairResponse = {
      actionId: body.action?.id,
      checkId: body.checkId,
      commandContract: body.commandContract,
      issueId: body.issue?.id,
      mutates: body.mutates,
      targetHref: body.targetHref,
    };
    evidence.steps.push(`fix: repair endpoint returned ${body.targetHref}`);
    await page.waitForURL((url) => url.pathname !== "/admin/checks", { timeout: 30000 });
    evidence.finalUrl = page.url();
    await screenshot(page, "clickpath-02-fix-target-opened");
    await context.close();

    await fs.writeFile(
      path.join(outputDir, "browser-owner-checks-repair-evidence.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
    );
    await fs.writeFile(
      path.join(outputDir, "reference-mechanics-note.md"),
      [
        "# Repair Workbench Mechanics",
        "",
        "- Composition: one selected check controls a focused issue queue; the owner sees reasons and impact before acting.",
        "- Interaction: each issue has one primary repair command that posts to the BFF and opens the exact editor target returned by the server.",
        "- Role of cards: cards are status filters, not the final UI; the work happens in the issue list and guided editor jump.",
        "- Montelar adaptation: Russian owner-facing labels, no raw collection links in the first layer, and muted admin chrome around repair decisions.",
        "- Verification hook: this evidence pack records before route, four responsive after states, the POST response contract, and the final editor URL.",
        "",
      ].join("\n"),
    );
    await fs.writeFile(
      path.join(outputDir, "browser-qa-report.md"),
      [
        "# MNT-ADMIN-BFF-008 Browser QA",
        "",
        `Runtime: ${baseUrl}`,
        "",
        "Path: checks -> issue -> fix target.",
        "",
        "Evidence:",
        "- `before-checks-route-desktop-1440.png`",
        "- `checks-repair-queue-desktop-1440.png`",
        "- `checks-repair-queue-laptop-1366.png`",
        "- `checks-repair-queue-tablet.png`",
        "- `checks-repair-queue-mobile.png`",
        "- `clickpath-01-issue-selected.png`",
        "- `clickpath-02-fix-target-opened.png`",
        "- `browser-owner-checks-repair-evidence.json`",
        "- `reference-mechanics-note.md`",
        "",
        "Command contract: the `fix` POST is intentionally non-mutating and returns `commandContract: open-guided-editor-target`, `mutates: false`, and the exact owner editor URL.",
        "",
        `Fix target: ${evidence.finalUrl}`,
        "",
      ].join("\n"),
    );
    console.log(`owner-checks-browser-qa: ok ${evidence.finalUrl}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
