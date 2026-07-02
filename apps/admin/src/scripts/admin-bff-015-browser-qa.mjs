import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const projectRoot = process.cwd().endsWith(`${path.sep}apps${path.sep}admin`)
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();
const manifestPath = path.resolve(
  projectRoot,
  process.argv[2] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-015/browser-fixture.json",
);
const outputDir = path.resolve(
  projectRoot,
  process.argv[3] || "docs/strategy/artifacts/visual-qa/MNT-ADMIN-BFF-015/click-path",
);

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const baseUrl = (process.env.MONTELAR_QA_BASE_URL || manifest.baseUrl).replace(/\/+$/, "");
const credentials = {
  email: process.env.MONTELAR_QA_EMAIL || manifest.credentials.email,
  password: process.env.MONTELAR_QA_PASSWORD || manifest.credentials.password,
};

async function login(page) {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="email"]').first().fill(credentials.email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(credentials.password);
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

async function waitForJsonResponse(page, matcher, method) {
  const response = await page.waitForResponse(
    (entry) => matcher(entry.url()) && entry.request().method() === method,
    { timeout: 30000 },
  );
  const body = await response.json();

  if (!response.ok()) {
    throw new Error(`${method} ${response.url()} failed: ${response.status()} ${JSON.stringify(body)}`);
  }

  return { body, status: response.status(), url: response.url() };
}

async function runTranslationPath(page, evidence) {
  await page.goto(manifest.routes.translations, { waitUntil: "networkidle" });
  await page.locator(".montelar-translations-card").first().waitFor({ state: "visible", timeout: 30000 });
  await page.locator(".montelar-translations-card").first().click();
  await screenshot(page, "translations-01-selected");

  const contentSaveButton = page.getByRole("button", { name: /Сохранить переводимый текст/i });
  if (!(await contentSaveButton.count())) {
    const createDraftButton = page.getByRole("button", { name: /Создать черновик перевода/i });
    await createDraftButton.waitFor({ state: "visible", timeout: 30000 });
    const createResponse = waitForJsonResponse(
      page,
      (url) => url.includes("/api/internal/translations-workspace"),
      "POST",
    );
    await createDraftButton.click();
    const draft = await createResponse;
    evidence.translationDraft = {
      apiStatus: draft.status,
      createdId: draft.body?.id,
    };
    await page.waitForTimeout(1200);
    await page.goto(manifest.routes.translations, { waitUntil: "networkidle" });
    await page.locator(".montelar-translations-card").filter({ hasText: /черновик|в работе|согласовано|опубликовано/i }).first().click();
    await screenshot(page, "translations-01b-draft-created");
  }

  const targetTextarea = page.locator(".montelar-translations-content-field textarea:not([readonly]):not([disabled])").first();
  await targetTextarea.waitFor({ state: "visible", timeout: 30000 });
  const value = `BFF-015 browser owner edit ${Date.now()}`;
  await targetTextarea.fill(value);

  const noteTextarea = page.locator(".montelar-translations-content-note textarea").first();
  if (await noteTextarea.count()) {
    await noteTextarea.fill("BFF-015 click-path evidence: owner saved translation text from the workbench.");
  }

  const saveResponse = waitForJsonResponse(
    page,
    (url) => url.includes("/api/internal/translations-workspace/") && url.includes("/content"),
    "PATCH",
  );
  await page.getByRole("button", { name: /Сохранить переводимый текст/i }).click();
  const result = await saveResponse;
  await screenshot(page, "translations-02-saved");

  evidence.translation = {
    apiStatus: result.status,
    finalUrl: page.url(),
    savedValue: value,
  };
}

async function runChecksPath(page, evidence) {
  await page.goto(manifest.routes.checks, { waitUntil: "networkidle" });
  await page.locator(".montelar-checks-panel__list button").first().waitFor({ state: "visible", timeout: 30000 });
  await screenshot(page, "checks-01-issue-list");

  const repairResponse = waitForJsonResponse(
    page,
    (url) =>
      url.includes("/api/internal/owner/checks/") &&
      url.includes("/issues/") &&
      url.endsWith("/fix"),
    "POST",
  );
  await page.locator(".montelar-checks-panel__list button").first().click();
  const result = await repairResponse;

  if (result.body?.mutates !== false || result.body?.commandContract !== "open-guided-editor-target") {
    throw new Error(`Unexpected check repair contract: ${JSON.stringify(result.body)}`);
  }

  await page.waitForURL((url) => url.pathname !== "/admin/checks", { timeout: 30000 });
  if (page.url().includes("/admin/collections")) {
    throw new Error(`Check repair landed on raw collection URL: ${page.url()}`);
  }

  await screenshot(page, "checks-02-guided-target");
  evidence.checks = {
    apiStatus: result.status,
    commandContract: result.body.commandContract,
    finalUrl: page.url(),
    mutates: result.body.mutates,
    targetHref: result.body.targetHref,
  };
}

async function runSettingsPath(page, evidence) {
  await page.goto(manifest.routes.settings, { waitUntil: "networkidle" });
  await page.getByLabel("Название бренда").waitFor({ state: "visible", timeout: 30000 });
  await screenshot(page, "settings-01-form-ready");

  const value = `Montelar QA ${Date.now()}`;
  await page.getByLabel("Название бренда").fill(value);
  const saveResponse = waitForJsonResponse(
    page,
    (url) => url.includes("/api/internal/owner-settings-workspace"),
    "POST",
  );
  await page.getByRole("button", { name: /^Сохранить$/i }).click();
  const result = await saveResponse;
  await page.getByText("Изменения сохранены", { exact: false }).waitFor({ state: "visible", timeout: 30000 });
  await screenshot(page, "settings-02-saved");

  evidence.settings = {
    apiStatus: result.status,
    finalUrl: page.url(),
    savedBrandName: result.body?.settings?.brandName,
    savedValue: value,
    status: result.body?.settings?.status,
  };
}

async function runSiteAdminPath(page, evidence) {
  await page.goto(manifest.routes.siteAdmin, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Шапка и (?:footer|подвал)/i }).click();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Название меню").waitFor({ state: "visible", timeout: 30000 });
  await screenshot(page, "site-admin-01-header-footer");

  const menuTitle = `BFF-015 меню ${Date.now()}`;
  await page.getByLabel("Название меню").fill(menuTitle);
  await page.getByLabel("Первый пункт").fill("Contact");
  await page.getByLabel("Ссылка").fill("/contact");

  const saveResponse = waitForJsonResponse(
    page,
    (url) => url.includes("/api/internal/site-admin-settings"),
    "POST",
  );
  await page.getByRole("button", { name: /Сохранить меню/i }).click();
  const result = await saveResponse;
  await page.waitForTimeout(1200);
  await screenshot(page, "site-admin-02-menu-saved");

  await Promise.all([
    page.waitForURL((url) => url.pathname !== "/admin/site-admin", { timeout: 30000 }),
    page.getByRole("link", { name: /Открыть настройки/i }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  if (page.url().includes("/admin/collections") || page.url().includes("/admin/advanced")) {
    throw new Error(`Site-admin guided entry landed on forbidden URL: ${page.url()}`);
  }
  await screenshot(page, "site-admin-03-guided-entry");

  evidence.siteAdmin = {
    apiStatus: result.status,
    finalUrl: page.url(),
    savedMenuTitle: menuTitle,
    successMessage: result.body?.successMessage,
  };
}

async function fetchJsonFromPage(page, url) {
  const result = await page.evaluate(async (targetUrl) => {
    const response = await fetch(targetUrl, {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    return {
      body: await response.json(),
      ok: response.ok,
      status: response.status,
      url: response.url,
    };
  }, url);

  if (!result.ok) {
    throw new Error(`GET ${result.url} failed: ${result.status} ${JSON.stringify(result.body)}`);
  }

  return result;
}

async function runHeaderMotionPath(page, evidence) {
  await page.goto(manifest.routes.headerMotionSettings, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Шапка и (?:footer|подвал)/i }).click();
  await page.waitForLoadState("networkidle");
  await screenshot(page, "journey-22-header-motion-guided-settings");

  const header = await fetchJsonFromPage(
    page,
    `${baseUrl}/api/internal/module-settings?locale=ru&moduleId=global.products-mega-menu`,
  );
  const selected = header.body?.selectedModule;
  const headerMenuLanguage = selected?.settings?.headerMenuLanguage;

  if (!headerMenuLanguage?.motion) {
    throw new Error(`Header/menu module settings did not expose guided motion settings: ${JSON.stringify(selected)}`);
  }

  evidence.journey22 = {
    apiStatus: header.status,
    finalUrl: page.url(),
    moduleId: selected.moduleId,
    motion: {
      menuRevealDurationMs: headerMenuLanguage.motion.menuRevealDurationMs,
      reducedMotionMode: headerMenuLanguage.motion.reducedMotionMode,
    },
    surface: "header/menu motion settings and reduced-motion fallback are guided settings, not code.",
  };
}

async function runHomepageUnifiedEditorPath(page, evidence) {
  await page.goto(manifest.routes.homepageUnifiedEditor, { waitUntil: "networkidle" });
  await page.locator(".montelar-site-editor-tabs").waitFor({ state: "visible", timeout: 30000 });
  const tabs = await page.locator(".montelar-site-editor-tabs").innerText();
  for (const expected of ["Контент", "Медиа", "Кнопки", "SEO", "Переводы", "Проверки"]) {
    if (!tabs.includes(expected)) {
      throw new Error(`Homepage editor does not expose required page-scoped tab "${expected}": ${tabs}`);
    }
  }

  const contentValue = `Единый редактор главной ${Date.now()}`;
  await page.getByLabel("Основной текст первого экрана").fill(contentValue);
  await page.getByLabel("Текст основной кнопки страницы").fill("Обсудить проект");
  const contentSave = waitForJsonResponse(
    page,
    (url) => url.includes("/api/internal/owner-site-commands"),
    "POST",
  );
  await page.getByRole("button", { name: /Сохранить текст и кнопки/i }).click();
  const contentResult = await contentSave;
  await screenshot(page, "journey-23-homepage-content-button-saved");

  await page.goto(manifest.routes.homepageSeoEditor, { waitUntil: "networkidle" });
  await page.getByLabel("SEO-заголовок").waitFor({ state: "visible", timeout: 30000 });
  await page.getByLabel("SEO-заголовок").fill(`Montelar homepage QA ${Date.now()}`);
  const seoSave = waitForJsonResponse(
    page,
    (url) => url.includes("/api/internal/owner-site-commands"),
    "POST",
  );
  await page.getByRole("button", { name: /Сохранить SEO/i }).click();
  const seoResult = await seoSave;
  await screenshot(page, "journey-23-homepage-seo-saved");

  await page.goto(manifest.routes.homepageMedia, { waitUntil: "networkidle" });
  await page.getByText(/Медиа главной|Где используется|Открыть страницу/i).first().waitFor({ state: "visible", timeout: 30000 });
  await screenshot(page, "journey-23-homepage-media-context");

  await page.goto(manifest.routes.homepageTranslationsEditor, { waitUntil: "networkidle" });
  await page.locator("#page-translations-panel").waitFor({ state: "visible", timeout: 30000 });
  const homepageTranslationHref = await page
    .locator("#page-translations-panel a")
    .filter({ hasText: /Открыть переводы этой страницы/i })
    .first()
    .getAttribute("href");
  if (
    !homepageTranslationHref ||
    !homepageTranslationHref.includes("ownerCollection=pages") ||
    !homepageTranslationHref.includes("ownerKey=")
  ) {
    throw new Error(`Homepage translation handoff lost owner context: ${homepageTranslationHref ?? "missing"}`);
  }
  await screenshot(page, "journey-23-homepage-translation-panel");

  evidence.journey23 = {
    contentApiStatus: contentResult.status,
    finalUrl: page.url(),
    homepageEditorRoute: manifest.routes.homepageUnifiedEditor,
    mediaRoute: manifest.routes.homepageMedia,
    savedContentValue: contentValue,
    seoApiStatus: seoResult.status,
    surface: "Homepage text, image, button, SEO and translation stay inside the selected homepage editor/context.",
    translationHref: homepageTranslationHref,
    translationPanelRoute: manifest.routes.homepageTranslationsEditor,
  };
}

async function runGlobalContextReturnPath(page, evidence) {
  const result = {};

  await page.goto(manifest.routes.homepageMedia, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Открыть страницу/i }).first().waitFor({ state: "visible", timeout: 30000 });
  await screenshot(page, "journey-24-global-media-selected");
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/admin/site" && url.searchParams.get("focus") === "media", {
      timeout: 30000,
    }),
    page.getByRole("link", { name: /Открыть страницу/i }).first().click(),
  ]);
  await page.waitForLoadState("networkidle");
  if (page.url().includes("/admin/collections")) {
    throw new Error(`Media context return landed on raw collection URL: ${page.url()}`);
  }
  await screenshot(page, "journey-24-global-media-returned");
  result.mediaFinalUrl = page.url();

  await page.goto(manifest.routes.translations, { waitUntil: "networkidle" });
  await page.locator(".montelar-translations-card").first().waitFor({ state: "visible", timeout: 30000 });
  await page.locator(".montelar-translations-card").first().click();
  await screenshot(page, "journey-24-global-translation-selected");
  const translationTarget = page
    .locator(".montelar-translations-detail__actions a")
    .filter({ hasText: /Открыть (страницу|SEO|товарный редактор|форму)/i })
    .first();
  await translationTarget.waitFor({ state: "visible", timeout: 30000 });
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith("/admin/") && !url.pathname.includes("/collections"), {
      timeout: 30000,
    }),
    translationTarget.click(),
  ]);
  await page.waitForLoadState("networkidle");
  if (page.url().includes("/admin/collections")) {
    throw new Error(`Translation context return landed on raw collection URL: ${page.url()}`);
  }
  await screenshot(page, "journey-24-global-translation-returned");
  result.translationFinalUrl = page.url();

  result.checksFinalUrl = evidence.checks?.finalUrl ?? null;
  result.checksTargetHref = evidence.checks?.targetHref ?? null;

  evidence.journey24 = {
    ...result,
    surface: "Global check/media/translation items return to exact owner editor contexts without raw routes.",
  };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  const evidence = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    user: credentials.email,
  };

  try {
    await login(page);
    await runTranslationPath(page, evidence);
    await runChecksPath(page, evidence);
    await runSettingsPath(page, evidence);
    await runSiteAdminPath(page, evidence);
    await runHeaderMotionPath(page, evidence);
    await runHomepageUnifiedEditorPath(page, evidence);
    await runGlobalContextReturnPath(page, evidence);
    await fs.writeFile(
      path.join(outputDir, "browser-click-path-evidence.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );
    console.log("admin-bff-015-browser-qa: ok");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
