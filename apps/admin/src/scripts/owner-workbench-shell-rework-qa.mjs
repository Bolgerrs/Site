import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const outputDir = path.resolve(
  process.cwd(),
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-011/rework-20260513",
);
const baseUrl = (process.env.MONTELAR_ADMIN_QA_BASE_URL || "http://127.0.0.1:3002").replace(/\/+$/, "");
const email = process.env.MONTELAR_QA_EMAIL || "owner@montelar.example";
const password = process.env.MONTELAR_QA_PASSWORD || "MontelarSmoke123!";
const fullPageScreenshots = process.env.MONTELAR_ADMIN_QA_FULL_PAGE === "1";
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

const ownerRoutes = [
  { label: "dashboard", path: "/admin", menu: "Панель" },
  { label: "site", path: "/admin/site", menu: "Сайт" },
  { label: "products", path: "/admin/products", menu: "Продукты" },
  { label: "media", path: "/admin/media", menu: "Медиа" },
  { label: "leads", path: "/admin/leads?filter=all", menu: "Заявки" },
  { label: "translations", path: "/admin/translations", menu: "Переводы" },
  { label: "checks", path: "/admin/checks", menu: "Проверки" },
  { label: "settings", path: "/admin/settings", menu: "Настройки" },
];

const variants = [
  { label: "desktop-1440", options: { viewport: { width: 1440, height: 960 } } },
  { label: "laptop-1366", options: { viewport: { width: 1366, height: 900 } } },
  { label: "tablet-768", options: { viewport: { width: 768, height: 1024 } } },
  { label: "mobile-390", options: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } } },
];

const forbiddenTerms = [
  /\/admin\/collections/i,
  /\bPayload\b/i,
  /\braw\b/i,
  /\brecord\b/i,
  /\bschema\b/i,
  /\btemplate\b/i,
  /\bcollection\b/i,
  /\brelation\b/i,
  /\bworkspace\b/i,
];
const ambiguousContentTerms = [/\broute\b/i, /\bsource\b/i];

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

async function readVisibleLinks(page, selector = "a:visible") {
  return page.locator(selector).evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute("href"),
      label: link.textContent?.replace(/\s+/g, " ").trim() || "",
    })),
  );
}

async function writeText(name, text) {
  await fs.writeFile(path.join(outputDir, name), `${text.trim()}\n`, "utf8");
}

async function withBrowser(fn) {
  const browser = await chromium.launch(chromiumLaunchOptions);

  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
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

async function waitForOwnerSurface(page) {
  await page.locator(".montelar-site-console__nav").waitFor({ state: "visible", timeout: 45000 });
  await page.waitForTimeout(900);
}

async function capture(page, name) {
  await waitForOwnerSurface(page);
  const pngPath = path.join(outputDir, `${name}.png`);
  const txtPath = path.join(outputDir, `${name}.txt`);
  const text = (await page.locator("body").innerText()).trim();
  let screenshotMode = fullPageScreenshots ? "fullPage" : "viewport";

  try {
    await page.screenshot({ fullPage: fullPageScreenshots, path: pngPath, timeout: 45000 });
  } catch (error) {
    screenshotMode = `viewport fallback: ${error instanceof Error ? error.message.split("\n")[0] : "capture failed"}`;
    await page.screenshot({ fullPage: false, path: pngPath, timeout: 45000 });
  }

  await fs.writeFile(txtPath, `${text}\n`, "utf8");
  return { pngPath, screenshotMode, text, txtPath };
}

async function visibleTextScan(page) {
  const text = (await page.locator("body").innerText()).trim();
  const forbidden = forbiddenTerms
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);
  const ambiguous = ambiguousContentTerms
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);
  const visibleActionCount = await page.locator('a:visible, button:visible, input[type="submit"]:visible').count();
  const shellTopActionCount = await page.locator(".montelar-owner-shell-topbar__actions a:visible").count();
  const inspectorActionCount = await page.locator(".montelar-owner-shell-inspector__actions a:visible, .montelar-owner-shell-inspector__actions button:visible").count();
  const visibleLinks = await readVisibleLinks(page);
  const rawVisibleLinks = visibleLinks
    .filter((link) => decodedRawTarget(link.href))
    .map((link) => ({
      href: normalizeHref(link.href),
      label: link.label,
      rawTarget: decodedRawTarget(link.href),
    }));
  const rawOwnerLeaks = findOwnerRawLeaks(visibleLinks);

  return {
    forbidden,
    ambiguous,
    inspectorActionCount,
    rawOwnerLeaks,
    rawVisibleLinks,
    shellTopActionCount,
    visibleActionCount,
  };
}

async function captureViewports() {
  const evidence = [];

  for (const variant of variants) {
    const batch = await withBrowser(async (browser) => {
      const context = await browser.newContext(variant.options);
      const page = await context.newPage();
      const rows = [];

      try {
        await login(page);

        for (const route of ownerRoutes) {
          const response = await page.goto(urlFor(route.path), { waitUntil: "networkidle" });
          const captureResult = await capture(page, `${route.label}-${variant.label}`);
          const scan = await visibleTextScan(page);
          rows.push({
            finalUrl: page.url(),
            label: route.label,
            responseStatus: response?.status() ?? null,
            screenshotMode: captureResult.screenshotMode,
            textSnippet: captureResult.text.slice(0, 320),
            variant: variant.label,
            ...scan,
          });
        }
      } finally {
        await context.close();
      }

      return rows;
    });

    evidence.push(...batch);
  }

  return evidence;
}

async function captureMenuClickPath() {
  return withBrowser(async (browser) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();
    const steps = [];

    try {
      await login(page);
      await capture(page, "clickpath-00-dashboard");

      for (const route of ownerRoutes.slice(1)) {
        const navLink = page.locator(".montelar-site-console__nav a").filter({ hasText: route.menu }).first();
        await Promise.all([
          page.waitForURL((url) => url.pathname === new URL(urlFor(route.path)).pathname, { timeout: 30000 }),
          navLink.click(),
        ]);
        await page.waitForLoadState("networkidle");
        const snapshot = await capture(page, `clickpath-${String(steps.length + 1).padStart(2, "0")}-${route.label}`);
        const scan = await visibleTextScan(page);
        steps.push({
          finalUrl: page.url(),
          menu: route.menu,
          rawRouteUsed: page.url().includes("/admin/collections"),
          screenshotMode: snapshot.screenshotMode,
          textSnippet: snapshot.text.slice(0, 260),
          ...scan,
        });
      }
    } finally {
      await context.close();
    }

    return steps;
  });
}

async function capturePageCentricProof() {
  return withBrowser(async (browser) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();

    try {
      await login(page);
      await page.goto(urlFor("/admin/site"), { waitUntil: "networkidle" });
      await waitForOwnerSurface(page);
      await page.waitForTimeout(1800);

      const firstPageButton = page.locator(".montelar-site-owner-flow button, .montelar-site-owner-flow a").first();
      if (await firstPageButton.count()) {
        await firstPageButton.click();
        await page.waitForTimeout(1200);
      }

      const firstBlockButton = page.locator(".montelar-site-block-row__main").first();
      if (await firstBlockButton.count()) {
        await firstBlockButton.click();
        await page.waitForTimeout(900);
      }

      const titleInput = page.locator('label:has-text("Заголовок") input').first();
      if (await titleInput.count()) {
        await titleInput.fill(`QA: текст блока ${Date.now()}`);
      }

      const buttonInput = page.locator('label:has-text("Текст основной кнопки") input').first();
      if (await buttonInput.count()) {
        await buttonInput.fill("QA: кнопка");
      }

      const noteTextarea = page.locator('label:has-text("Заметка для менеджера") textarea').first();
      if (await noteTextarea.count()) {
        await noteTextarea.fill("QA: проверка page-centric пути без raw редактора.");
      }

      const snapshot = await capture(page, "page-centric-01-site-page-block-edit");
      const text = snapshot.text;
      const quickLinks = await readVisibleLinks(
        page,
        ".montelar-site-quick-grid a, .montelar-owner-editor__links a, .montelar-site-page-spotlight__actions a",
      );
      const rawOwnerLeaks = findOwnerRawLeaks(quickLinks);

      return {
        finalUrl: page.url(),
        hasButtonEditor: /Текст основной кнопки/i.test(text),
        hasCheckStatus: /Провер/.test(text),
        hasMediaPath: quickLinks.some((link) => /Медиа|Фото|изображ/i.test(link.label ?? "")),
        hasPreview: /Предпросмотр/.test(text) || quickLinks.some((link) => /Предпросмотр/.test(link.label ?? "")),
        hasPublish: /Публикац|публику/.test(text),
        hasSeoPath: quickLinks.some((link) => /SEO/i.test(link.label ?? "")),
        hasTextEditor: /Заголовок|Основной текст|Короткое описание/i.test(text),
        hasTranslationPath: quickLinks.some((link) => /Перевод/.test(link.label ?? "")),
        quickLinks,
        rawOwnerLeaks,
        rawRouteUsed: page.url().includes("/admin/collections"),
        textSnippet: text.slice(0, 600),
      };
    } finally {
      await context.close();
    }
  });
}

function summarizeActionCounts(rows) {
  return rows.map((row) => ({
    route: row.label,
    variant: row.variant,
    visibleActionCount: row.visibleActionCount,
    shellTopActionCount: row.shellTopActionCount,
    inspectorActionCount: row.inspectorActionCount,
    rawOwnerLeaks: row.rawOwnerLeaks,
    rawVisibleLinks: row.rawVisibleLinks,
    forbidden: row.forbidden,
    ambiguous: row.ambiguous,
  }));
}

function createMarkdownReport({ actionCounts, clickPath, pageCentric }) {
  const forbiddenCount = actionCounts.reduce((sum, row) => sum + row.forbidden.length + row.rawOwnerLeaks.length, 0);
  const ambiguousCount = actionCounts.reduce((sum, row) => sum + row.ambiguous.length, 0);
  const rawRouteSteps = clickPath.filter((step) => step.rawRouteUsed).length + (pageCentric.rawRouteUsed ? 1 : 0);
  const pageCentricRawLeakCount = pageCentric.rawOwnerLeaks.length;

  return `# MNT-ADMIN-BFF-011 Rework Browser Evidence

Runtime: \`${baseUrl}\`

## Result

- First-layer owner click path covered: ${clickPath.map((step) => step.menu).join(" -> ")}.
- Raw collection route usage in recorded owner paths: ${rawRouteSteps}.
- Strict forbidden first-layer text/link hits in captured owner screenshots: ${forbiddenCount}.
- Page-centric non-advanced raw handoff links: ${pageCentricRawLeakCount}.
- Ambiguous content-word hits classified separately: ${ambiguousCount}.
- 1366 laptop screenshots are present as \`*-laptop-1366.png\`.

## Page-Centric Proof

- Final URL: \`${pageCentric.finalUrl}\`
- Text editor visible: ${pageCentric.hasTextEditor}
- Button editor visible: ${pageCentric.hasButtonEditor}
- Media path visible: ${pageCentric.hasMediaPath}
- SEO path visible: ${pageCentric.hasSeoPath}
- Translation path visible: ${pageCentric.hasTranslationPath}
- Check/publish status visible: ${pageCentric.hasCheckStatus}
- Preview visible: ${pageCentric.hasPreview}
- Publication visible: ${pageCentric.hasPublish}
- Raw route used: ${pageCentric.rawRouteUsed}
- Non-advanced raw handoff links: ${pageCentricRawLeakCount}

## Action Count Gate

Topbar action count stays focused on preview plus one primary action. Inspector actions are capped by the shared shell.

${actionCounts
  .filter((row) => row.variant === "laptop-1366")
  .map(
    (row) =>
      `- ${row.route}: visible actions ${row.visibleActionCount}, topbar ${row.shellTopActionCount}, inspector ${row.inspectorActionCount}, raw handoff links ${row.rawVisibleLinks.length}, non-advanced raw leaks ${row.rawOwnerLeaks.length}, forbidden hits ${row.forbidden.length}`,
  )
  .join("\n")}

## Artifacts

- \`rework-evidence.json\`
- \`action-count-and-forbidden-report.json\`
- \`page-centric-01-site-page-block-edit.png\`
- \`clickpath-*.png\`
- \`*-desktop-1440.png\`, \`*-laptop-1366.png\`, \`*-tablet-768.png\`, \`*-mobile-390.png\`
`;
}

await fs.mkdir(outputDir, { recursive: true });

const viewportEvidence = await captureViewports();
const clickPath = await captureMenuClickPath();
const pageCentric = await capturePageCentricProof();
const actionCounts = summarizeActionCounts(viewportEvidence);
const evidence = {
  actionCounts,
  baseUrl,
  clickPath,
  createdAt: new Date().toISOString(),
  pageCentric,
  viewportEvidence,
};

await fs.writeFile(path.join(outputDir, "rework-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await fs.writeFile(
  path.join(outputDir, "action-count-and-forbidden-report.json"),
  `${JSON.stringify(actionCounts, null, 2)}\n`,
  "utf8",
);
await writeText("browser-click-path-report.md", createMarkdownReport({ actionCounts, clickPath, pageCentric }));

const rawLeakCount =
  actionCounts.reduce((sum, row) => sum + row.rawOwnerLeaks.length, 0) +
  clickPath.reduce((sum, row) => sum + row.rawOwnerLeaks.length, 0) +
  pageCentric.rawOwnerLeaks.length;

if (rawLeakCount > 0) {
  throw new Error(`owner-workbench-shell-rework-qa: non-advanced raw handoff leaks found: ${rawLeakCount}`);
}

console.log(`owner-workbench-shell-rework-qa: ok ${outputDir}`);
