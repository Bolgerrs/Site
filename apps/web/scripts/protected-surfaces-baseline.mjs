import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const defaultArtifactRoot = path.resolve(
  __dirname,
  "../../../docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-004",
);

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const artifactRoot = process.env.MONTELAR_QA_ARTIFACT_DIR
  ? path.resolve(repoRoot, process.env.MONTELAR_QA_ARTIFACT_DIR)
  : defaultArtifactRoot;
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";

const screenshotsDir = path.join(artifactRoot, "screenshots");
const videosDir = path.join(artifactRoot, "videos");
const report = {
  baseUrl,
  executablePath,
  generatedAt: new Date().toISOString(),
  routes: [],
  checks: [],
  screenshots: [],
  videos: [],
};

function joinUrl(route) {
  return `${baseUrl}${route.startsWith("/") ? route : `/${route}`}`;
}

function recordCheck(name, details = {}) {
  report.checks.push({ name, status: "passed", ...details });
}

function assertCondition(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

async function screenshot(page, name, options = {}) {
  const filePath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: options.fullPage ?? false });
  report.screenshots.push(filePath);
  return filePath;
}

async function goto(page, route) {
  const response = await page.goto(joinUrl(route), { waitUntil: "networkidle", timeout: 60000 });
  const status = response?.status() ?? 0;
  report.routes.push({ route, status, url: page.url() });
  assertCondition(status >= 200 && status < 400, `Route ${route} returned ${status}`);
  return response;
}

async function readBox(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return {
      display: style.display,
      height: rect.height,
      opacity: Number.parseFloat(style.opacity || "1"),
      pointerEvents: style.pointerEvents,
      transform: style.transform,
      visibility: style.visibility,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: style.zIndex,
    };
  });
}

async function desktopBaseline(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await goto(page, "/ru");
  await page.waitForTimeout(900);
  await screenshot(page, "desktop-ru-home-closed-1440x900");

  const headerBox = await readBox(page, '[data-qa="site-header"]');
  const heroState = await page.evaluate(() => {
    const hero = document.querySelector(".home-hero");
    const visual = document.querySelector(".home-hero-visual");
    const scene = document.querySelector(".home-hero-visual .product-scene-prototype__scene");
    const hotspots = [...document.querySelectorAll(".product-scene-prototype__hotspot")];
    const rect = (element) => {
      if (!element) {
        return null;
      }
      const box = element.getBoundingClientRect();
      return { height: box.height, width: box.width, x: box.x, y: box.y };
    };

    return {
      hero: rect(hero),
      visual: rect(visual),
      scene: rect(scene),
      hotspotCount: hotspots.length,
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  assertCondition(headerBox.width > 1200 && headerBox.height > 0, "Desktop header is not measurable", headerBox);
  assertCondition(heroState.visual?.width > 900, "Desktop hero visual lost width", heroState);
  assertCondition(heroState.scene?.width >= heroState.visual.width * 0.95, "Hero scene no longer covers visual frame", heroState);
  assertCondition(heroState.scene?.height >= heroState.visual.height * 0.95, "Hero scene no longer covers visual height", heroState);
  assertCondition(heroState.hotspotCount >= 6, "Hero hotspot links are missing", heroState);
  assertCondition(heroState.horizontalOverflow <= 2, "Desktop route has horizontal overflow", heroState);
  recordCheck("desktop hero/header protected state", { heroState, headerBox });

  await page.locator('[data-qa="nav-trigger-products"]').click();
  await page.waitForTimeout(450);
  await screenshot(page, "desktop-products-menu-open-1440x900");
  const productPanelState = await page.evaluate(() => {
    const panel = document.querySelector('[data-qa="desktop-panel-products"]');
    const panelBox = panel?.getBoundingClientRect();
    const railItems = [...document.querySelectorAll('[data-qa="desktop-panel-products"] .product-mega-rail:first-child .product-mega-rail-item')];
    return {
      visible: !!panel && panelBox.width > 200 && panelBox.height > 100,
      railCount: railItems.length,
      expanded: document.querySelector('[data-qa="nav-trigger-products"]')?.getAttribute("aria-expanded"),
      panelClass: panel?.className ?? null,
    };
  });
  assertCondition(productPanelState.visible, "Desktop Products panel did not open", productPanelState);
  assertCondition(productPanelState.railCount >= 5, "Products rail lost product directions", productPanelState);
  assertCondition(productPanelState.expanded === "true", "Products trigger aria-expanded is not true", productPanelState);
  recordCheck("desktop products menu opens", productPanelState);

  const firstProductRailItem = page
    .locator('[data-qa="desktop-panel-products"] .product-mega-rail:first-child .product-mega-rail-item')
    .first();
  await firstProductRailItem.hover();
  await page.waitForTimeout(250);
  const selectedMenuState = await page.evaluate(() => {
    const panel = document.querySelector('[data-qa="desktop-panel-products"]');
    return {
      panelClass: panel?.className ?? "",
      selectedCount: document.querySelectorAll('[data-qa="desktop-panel-products"] .is-selected').length,
      linkCount: document.querySelectorAll('[data-qa="desktop-panel-products"] a').length,
    };
  });
  assertCondition(selectedMenuState.selectedCount >= 1, "Products rail selected state did not appear", selectedMenuState);
  assertCondition(selectedMenuState.linkCount >= productPanelState.railCount, "Products menu link cascade regressed", selectedMenuState);
  await screenshot(page, "desktop-products-menu-selected-direction-1440x900");
  recordCheck("desktop products category/selected-state cascade", selectedMenuState);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const menuClosed = await page.locator('[data-qa="desktop-panel-products"]').count();
  assertCondition(menuClosed === 0, "Desktop navigation did not close on Escape", { menuClosed });
  recordCheck("desktop menu closes on Escape");

  await page.locator(".header-locale-switcher .locale-switcher-trigger").click();
  await page.waitForTimeout(180);
  await screenshot(page, "desktop-language-menu-open-1440x900");
  await page.locator('.header-locale-switcher a[lang="en"]').click();
  await page.waitForURL(/\/en(?:\/)?$/, { timeout: 30000 });
  await page.waitForTimeout(450);
  assertCondition(new URL(page.url()).pathname === "/en", "Desktop language switch did not navigate to /en", {
    url: page.url(),
  });
  recordCheck("desktop language switch ru to en", { url: page.url() });

  await page.locator(".header-cta").click();
  await page.waitForURL(/\/en\/contact(?:\/)?$/, { timeout: 30000 });
  assertCondition(new URL(page.url()).pathname === "/en/contact", "Header CTA did not navigate to contact", {
    url: page.url(),
  });
  recordCheck("desktop CTA routes to contact", { url: page.url() });

  await goto(page, "/en");
  await screenshot(page, "desktop-en-home-closed-1440x900");
  await page.close();
}

async function mobileBaseline(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: videosDir, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  await goto(page, "/ru");
  await page.waitForTimeout(900);
  await screenshot(page, "mobile-ru-home-closed-390x844");

  const mobileClosedState = await page.evaluate(() => ({
    bodyFlag: document.body.dataset.mobileNavOpen ?? null,
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    toggleExpanded: document.querySelector('[data-qa="mobile-nav-toggle"]')?.getAttribute("aria-expanded"),
    hotspotCount: document.querySelectorAll(".product-scene-prototype__hotspot").length,
  }));
  assertCondition(mobileClosedState.horizontalOverflow <= 2, "Mobile route has horizontal overflow", mobileClosedState);
  assertCondition(mobileClosedState.toggleExpanded === "false", "Mobile menu starts expanded", mobileClosedState);
  assertCondition(mobileClosedState.hotspotCount >= 6, "Mobile hero hotspot links are missing", mobileClosedState);
  recordCheck("mobile closed protected state", mobileClosedState);

  await page.locator('[data-qa="mobile-nav-toggle"]').click();
  await page.waitForTimeout(700);
  await screenshot(page, "mobile-menu-open-390x844");
  const mobileOpenState = await page.evaluate(() => {
    const drawer = document.querySelector('[data-qa="mobile-nav-drawer"]');
    const backdrop = document.querySelector(".mobile-nav-backdrop");
    const toggle = document.querySelector('[data-qa="mobile-nav-toggle"]');
    const logoCandidates = [...document.querySelectorAll(".shell-header .brand-logo-image")];
    const projectedLogo = logoCandidates.find((logo) => {
      const style = getComputedStyle(logo);
      const rect = logo.getBoundingClientRect();
      return style.display !== "none" && Number.parseFloat(style.opacity || "0") > 0 && rect.width > 1;
    }) ?? logoCandidates[0] ?? null;
    const drawerLogo = document.querySelector(".mobile-nav-logo-image");
    const drawerRect = drawer?.getBoundingClientRect();
    const backdropStyle = backdrop ? getComputedStyle(backdrop) : null;
    const toggleStyle = toggle ? getComputedStyle(toggle) : null;
    const logoRect = projectedLogo?.getBoundingClientRect();

    return {
      bodyFlag: document.body.dataset.mobileNavOpen ?? null,
      backdropBackground: backdropStyle?.backgroundColor ?? "",
      backdropOpacity: backdropStyle ? Number.parseFloat(backdropStyle.opacity || "0") : 0,
      drawerHeight: drawerRect?.height ?? 0,
      drawerOpen: drawer?.classList.contains("is-open") ?? false,
      drawerWidth: drawerRect?.width ?? 0,
      logoImageComplete: projectedLogo instanceof HTMLImageElement ? projectedLogo.complete : false,
      logoOpacity: projectedLogo ? Number.parseFloat(getComputedStyle(projectedLogo).opacity || "0") : 0,
      logoWidth: logoRect?.width ?? 0,
      drawerLogoOpacity: drawerLogo ? Number.parseFloat(getComputedStyle(drawerLogo).opacity || "0") : null,
      toggleOpacity: toggleStyle ? Number.parseFloat(toggleStyle.opacity || "1") : 1,
      togglePointerEvents: toggleStyle?.pointerEvents ?? "",
      toggleZIndex: toggleStyle ? Number.parseInt(toggleStyle.zIndex || "0", 10) : 0,
      toggleExpanded: toggle?.getAttribute("aria-expanded") ?? null,
    };
  });
  assertCondition(mobileOpenState.bodyFlag === "true", "Mobile body open flag was not set", mobileOpenState);
  assertCondition(mobileOpenState.drawerOpen && mobileOpenState.drawerWidth > 250, "Mobile drawer did not open", mobileOpenState);
  assertCondition(mobileOpenState.backdropOpacity <= 1, "Mobile backdrop opacity is invalid", mobileOpenState);
  assertCondition(!mobileOpenState.backdropBackground.includes("rgba(0, 0, 0, 1)"), "Mobile backdrop became fully opaque", mobileOpenState);
  assertCondition(mobileOpenState.logoImageComplete && mobileOpenState.logoOpacity > 0.65 && mobileOpenState.logoWidth > 80, "Mobile logo projection disappeared", mobileOpenState);
  assertCondition(mobileOpenState.toggleExpanded === "true", "Mobile toggle aria-expanded is not true when menu is open", mobileOpenState);
  assertCondition(
    (mobileOpenState.toggleOpacity < 0.2 && mobileOpenState.togglePointerEvents === "none") ||
      (mobileOpenState.toggleOpacity > 0.65 && mobileOpenState.togglePointerEvents === "auto" && mobileOpenState.toggleZIndex >= 20),
    "Mobile toggle is neither hidden nor a valid open-menu close control",
    mobileOpenState,
  );
  recordCheck("mobile menu open protection", mobileOpenState);

  const mobileDropdownTrigger = page.locator(".mobile-locale-switcher .locale-switcher-trigger");
  if (await mobileDropdownTrigger.count()) {
    await mobileDropdownTrigger.click();
    await page.waitForTimeout(250);
  }
  await screenshot(page, "mobile-language-menu-open-390x844");
  const mobileLocaleOpen = await page.evaluate(() => {
    const list =
      document.querySelector(".mobile-locale-switcher .locale-switcher-list") ??
      document.querySelector(".mobile-nav-locale-row");
    const box = list?.getBoundingClientRect();
    const style = list ? getComputedStyle(list) : null;
    return {
      pillCount: document.querySelectorAll(".mobile-nav-locale-row .locale-switcher-pill").length,
      height: box?.height ?? 0,
      opacity: style ? Number.parseFloat(style.opacity || "0") : 0,
      pointerEvents: style?.pointerEvents ?? "",
    };
  });
  assertCondition(
    (mobileLocaleOpen.height > 40 && mobileLocaleOpen.opacity > 0.7) || mobileLocaleOpen.pillCount >= 7,
    "Mobile language controls did not open or render",
    mobileLocaleOpen,
  );
  recordCheck("mobile language menu opens inside drawer", mobileLocaleOpen);

  await page.locator('.mobile-nav-locale-row a[lang="en"], .mobile-locale-switcher a[lang="en"]').first().click();
  await page.waitForURL(/\/en(?:\/)?$/, { timeout: 30000 });
  await page.waitForTimeout(450);
  assertCondition(new URL(page.url()).pathname === "/en", "Mobile language switch did not navigate to /en", {
    url: page.url(),
  });
  recordCheck("mobile language switch ru to en", { url: page.url() });

  await goto(page, "/ru");
  await page.locator('[data-qa="mobile-nav-toggle"]').click();
  await page.waitForTimeout(400);
  const mobileProductsButton = page.getByRole("button", { name: /Продукты|Products/ });
  if (await mobileProductsButton.count()) {
    await mobileProductsButton.first().click();
  }
  await page.waitForTimeout(250);
  await screenshot(page, "mobile-products-layer-open-390x844");
  const mobileProductsState = await page.evaluate(() => ({
    hasOpenBranch: document.querySelector(".mobile-nav-list")?.classList.contains("has-open-branch") ?? false,
    hasAccordionBrowser: Boolean(document.querySelector('[data-qa="mobile-product-browser"]')),
    productDirectionButtons: document.querySelectorAll(".mobile-product-direction-button, .mobile-product-accordion-trigger").length,
  }));
  assertCondition(
    mobileProductsState.hasOpenBranch || mobileProductsState.hasAccordionBrowser,
    "Mobile Products branch did not become active",
    mobileProductsState,
  );
  assertCondition(mobileProductsState.productDirectionButtons >= 5, "Mobile Products branch lost product directions", mobileProductsState);
  recordCheck("mobile products branch opens", mobileProductsState);

  const firstHotspotHref = await page.locator(".product-scene-prototype__hotspot").first().getAttribute("href");
  assertCondition(!!firstHotspotHref, "Hero hotspot has no href", { firstHotspotHref });
  const backdropClose = page.locator(".mobile-nav-backdrop");
  if (await backdropClose.count()) {
    await backdropClose.first().click({ force: true });
  } else {
    await page.locator("[data-qa='mobile-nav-toggle']").click({ force: true });
  }
  await page.waitForFunction(() => document.body.dataset.mobileNavOpen !== "true", null, { timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(900);
  await page.locator(".product-scene-prototype__hotspot").first().click();
  await page.waitForURL(/\/ru\//, { timeout: 30000 });
  assertCondition(new URL(page.url()).pathname !== "/ru", "Hero hotspot click did not leave homepage", {
    firstHotspotHref,
    url: page.url(),
  });
  recordCheck("mobile hero hotspot link navigates", { firstHotspotHref, url: page.url() });

  await page.close();
  await context.close();
  const video = await page.video()?.path().catch(() => null);
  if (video) {
    report.videos.push(video);
  }
}

async function main() {
  await mkdir(screenshotsDir, { recursive: true });
  await mkdir(videosDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    await desktopBaseline(browser);
    await mobileBaseline(browser);
  } finally {
    await browser.close();
  }

  await writeFile(path.join(artifactRoot, "protected-surfaces-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    artifactRoot,
    checks: report.checks.length,
    routes: report.routes,
    screenshots: report.screenshots.length,
    videos: report.videos.length,
  }, null, 2));
}

main().catch(async (error) => {
  report.failure = {
    message: error.message,
    details: error.details ?? null,
    stack: error.stack,
  };
  await mkdir(artifactRoot, { recursive: true });
  await writeFile(path.join(artifactRoot, "protected-surfaces-report.json"), JSON.stringify(report, null, 2));
  console.error(error);
  process.exit(1);
});
