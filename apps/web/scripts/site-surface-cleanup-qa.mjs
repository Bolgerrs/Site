import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const artifactRoot =
  process.env.MONTELAR_QA_ARTIFACT_DIR ||
  path.resolve(process.cwd(), "../../docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-014/2026-05-21-redo");
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";

const launchLocales = ["ru", "en", "es", "fr", "zh", "ja", "de"];

const matrixRouteSuffixes = [
  "",
  "/contact",
  "/products/vision-max-premium",
  "/request/vision-max-premium",
];

const surfaceRoutes = [
  "/ru",
  "/en",
  "/ru/contact",
  "/en/contact",
  "/ru/products/vision-max-premium",
  "/en/products/vision-max-premium",
  "/ru/request/vision-max-premium",
  "/ru/vision-max",
  "/ru/audio/speakers",
  "/ru/brand",
  "/ru/technology",
  "/ru/downloads",
  "/ru/projects",
  "/ru/journal",
  ...launchLocales.flatMap((locale) => matrixRouteSuffixes.map((suffix) => `/${locale}${suffix}`)),
];

const languageRoutes = [
  { route: "/ru", targetLocale: "en" },
  { route: "/en", targetLocale: "ru" },
  { route: "/ru/contact", targetLocale: "en" },
  { route: "/en/contact", targetLocale: "ru" },
  { route: "/ru/products/vision-max-premium", targetLocale: "en" },
  { route: "/en/products/vision-max-premium", targetLocale: "ru" },
  { route: "/ru/request/vision-max-premium", targetLocale: "en" },
  { route: "/ru/audio/speakers", targetLocale: "en" },
];

const screenshots = [
  { name: "after-desktop-ru-home-1440x900", route: "/ru", viewport: { width: 1440, height: 900 } },
  { name: "after-laptop-ru-home-1366x768", route: "/ru", viewport: { width: 1366, height: 768 } },
  { name: "after-tablet-ru-home-768x1024", route: "/ru", viewport: { width: 768, height: 1024 } },
  { name: "after-mobile-ru-home-390x844", route: "/ru", viewport: { width: 390, height: 844 } },
];

const focusSelectors = [
  { selector: ".header-cta", label: "header CTA" },
  { selector: ".header-locale-switcher .locale-switcher-trigger", label: "desktop locale trigger" },
  { selector: ".desktop-nav-trigger", label: "desktop nav trigger" },
  { selector: ".desktop-nav-link", label: "desktop nav link" },
  { selector: ".route-link-card", label: "route link card" },
  { selector: ".direction-product-link", label: "direction product link" },
  { selector: ".route-back-link", label: "route back link" },
  { selector: ".site-footer-link", label: "footer link" },
];

const report = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  coverage: {
    surfaceRoutes,
    languageRoutes,
    viewports: screenshots.map(({ name, route, viewport }) => ({ name, route, viewport })),
  },
  checks: [],
  failures: [],
  linkTargets: [],
  routes: [],
  screenshots: [],
};

function joinUrl(route) {
  return `${baseUrl}${route.startsWith("/") ? route : `/${route}`}`;
}

function record(name, details = {}) {
  report.checks.push({ name, status: "passed", ...details });
}

function fail(message, details = {}) {
  report.failures.push({ message, ...details });
}

function assert(condition, message, details = {}) {
  if (!condition) {
    fail(message, details);
  }
}

function expectedLocalizedPath(route, targetLocale) {
  return route.replace(/^\/(ru|en|es|fr|zh|ja|de)(?=\/|$)/, `/${targetLocale}`);
}

function geometryDelta(before, after) {
  return {
    x: Math.abs(before.x - after.x),
    y: Math.abs(before.y - after.y),
    width: Math.abs(before.width - after.width),
    height: Math.abs(before.height - after.height),
  };
}

function assertStableGeometry(delta, state, details) {
  assert(
    delta.x <= 0.5 && delta.y <= 0.5 && delta.width <= 1 && delta.height <= 1,
    `${state} state shifts visible geometry`,
    { ...details, delta },
  );
}

async function goto(page, route) {
  const response = await page.goto(joinUrl(route), { waitUntil: "networkidle", timeout: 60000 });
  const status = response?.status() ?? 0;
  report.routes.push({ route, status, url: page.url() });
  assert(status >= 200 && status < 400, `route ${route} returned ${status}`, { route, status });
}

async function ensureMobileNavOpen(page) {
  const isOpen = await page.evaluate(() => document.body.dataset.mobileNavOpen === "true");
  if (isOpen) {
    return;
  }

  const toggle = page.locator("[data-qa='mobile-nav-toggle']");
  assert((await toggle.count()) > 0, "mobile nav toggle is missing");
  await toggle.click();
  await page.waitForFunction(() => document.body.dataset.mobileNavOpen === "true", null, {
    timeout: 5000,
  });
  await page.waitForTimeout(250);
}

async function screenshot(page, name) {
  const filePath = path.join(artifactRoot, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  report.screenshots.push(filePath);
}

async function collectVisibleSurface(page, route) {
  const rows = await page.evaluate(() => {
    const nodes = [
      ...document.querySelectorAll(
        [
          "[data-qa='site-header'] a",
          "[data-qa='site-header'] button",
          "[data-qa='site-footer'] a",
          "main a",
          "main button",
          ".header-cta",
          ".mobile-nav-cta",
          ".route-link-card",
          ".direction-product-link",
          ".route-back-link",
        ].join(","),
      ),
    ];

    return nodes
      .map((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const text = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const ariaLabel = node.getAttribute("aria-label") ?? "";
        const href = node instanceof HTMLAnchorElement ? node.href : "";

        return {
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === "string" ? node.className : "",
          text,
          ariaLabel,
          href,
          visible:
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number.parseFloat(style.opacity || "1") > 0 &&
            rect.width > 2 &&
            rect.height > 2 &&
            rect.bottom > 0 &&
            rect.right > 0,
        };
      })
      .filter((row) => row.visible);
  });

  const interactiveRows = rows.filter((row) => row.tag === "a" || row.tag === "button");
  for (const row of interactiveRows) {
    assert(row.text || row.ariaLabel, "visible interactive surface has no accessible label", { route, row });
    if (row.tag === "a") {
      assert(row.href && !row.href.endsWith("#"), "visible link has empty or hash href", { route, row });
    }
  }

  record("visible public surface labels and hrefs", {
    route,
    interactiveCount: interactiveRows.length,
  });

  return rows;
}

async function verifySameOriginTargets(page, rows) {
  const urls = [
    ...new Set(
      rows
        .map((row) => row.href)
        .filter(Boolean)
        .filter((href) => href.startsWith(baseUrl))
        .filter((href) => !new URL(href).pathname.startsWith("/api/")),
    ),
  ];

  for (const url of urls) {
    const response = await page.request.get(url, { timeout: 30000 });
    const status = response.status();
    report.linkTargets.push({ url, status });
    assert(status >= 200 && status < 400, "visible link target is not healthy", { url, status });
  }

  record("same-origin visible link targets respond", { count: urls.length });
}

async function assertLanguageSurface(page, route, viewportName, targetLocale) {
  await goto(page, route);
  if (viewportName === "mobile") {
    await ensureMobileNavOpen(page);
  }

  const switcherSelector = viewportName === "mobile" ? ".mobile-nav-locale-row" : ".header-locale-switcher";
  const trigger = page.locator(`${switcherSelector} .locale-switcher-trigger`);
  if ((await trigger.count()) > 0) {
    await trigger.click();
    await page.waitForTimeout(180);
  }

  const state = await page.locator(`${switcherSelector} .locale-switcher-pill`).evaluateAll((items) =>
    items.map((item) => ({
      href: item instanceof HTMLAnchorElement ? item.getAttribute("href") : "",
      label: item.textContent?.trim() ?? "",
      lang: item.getAttribute("lang") ?? "",
    })),
  );

  assert(state.length === 7, "language switcher does not show all launch locales", {
    route,
    viewportName,
    state,
  });
  for (const item of state) {
    assert(!!item.label && !!item.lang && !!item.href, "language switcher has an empty locale button", {
      route,
      viewportName,
      item,
    });
  }

  const targetLink = page.locator(`${switcherSelector} a[lang='${targetLocale}']`);
  assert((await targetLink.count()) > 0, "language switcher target locale is missing", {
    route,
    viewportName,
    targetLocale,
  });
  if (await targetLink.count()) {
    await targetLink.click();
    await page.waitForURL(new RegExp(`/${targetLocale}(?:/|$)`), { timeout: 30000 });
    if (viewportName === "mobile") {
      await page.waitForFunction(() => document.body.dataset.mobileNavOpen === "true", null, {
        timeout: 5000,
      });
      const preservedOpenState = await page.evaluate(() => ({
        bodyFlag: document.body.dataset.mobileNavOpen ?? null,
        drawerOpen: document.querySelector("[data-qa='mobile-nav-drawer']")?.classList.contains("is-open") ?? false,
        visibleLocaleLinks: document.querySelectorAll(".mobile-nav-locale-row .locale-switcher-pill").length,
      }));
      assert(
        preservedOpenState.bodyFlag === "true" && preservedOpenState.drawerOpen,
        "mobile language switch did not preserve open menu state",
        { route, viewportName, targetLocale, preservedOpenState },
      );
    }
    const expectedPath = expectedLocalizedPath(route, targetLocale);
    assert(new URL(page.url()).pathname === expectedPath, "language switch did not keep localized route", {
      route,
      viewportName,
      targetLocale,
      expectedPath,
      url: page.url(),
    });
  }

  record("language switcher route preservation", {
    route,
    viewportName,
    targetLocale,
    localeCount: state.length,
  });
}

async function measureStableHoverAndFocus(page, selector, label) {
  const locator = page.locator(selector).first();
  if (!(await locator.count())) {
    record("interactive selector absent on route", { label, selector, skipped: true });
    return;
  }

  await locator.scrollIntoViewIfNeeded();
  const before = await locator.boundingBox();
  await locator.hover();
  await page.waitForTimeout(120);
  const afterHover = await locator.boundingBox();

  if (!before || !afterHover) {
    fail("hover target is not measurable", { label, selector });
    return;
  }

  assertStableGeometry(geometryDelta(before, afterHover), "hover", { label, selector, before, after: afterHover });
  record("hover geometry stable", { label, selector, delta: geometryDelta(before, afterHover) });

  const focusApplied = await locator.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    element.focus({ preventScroll: true });
    return document.activeElement === element;
  });
  await page.waitForTimeout(120);
  const afterFocus = await locator.boundingBox();
  if (!afterFocus) {
    fail("focus target is not measurable", { label, selector });
    return;
  }

  assert(focusApplied, "focus target did not accept DOM focus", { label, selector });
  assertStableGeometry(geometryDelta(before, afterFocus), "focus-visible", {
    label,
    selector,
    before,
    after: afterFocus,
  });
  record("focus-visible geometry stable", { label, selector, delta: geometryDelta(before, afterFocus) });
}

async function surfaceMatrix(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const allRows = [];

  for (const route of surfaceRoutes) {
    await goto(page, route);
    const rows = await collectVisibleSurface(page, route);
    allRows.push(...rows);
  }

  await verifySameOriginTargets(page, allRows);

  await goto(page, "/ru/products/vision-max-premium");
  for (const { selector, label } of focusSelectors) {
    await measureStableHoverAndFocus(page, selector, label);
  }

  await page.close();
}

async function captureViewportScreenshots(browser) {
  for (const item of screenshots) {
    const page = await browser.newPage({ viewport: item.viewport });
    await goto(page, item.route);
    await page.waitForTimeout(500);
    await screenshot(page, item.name);
    await page.close();
  }
}

async function desktopClickPaths(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await goto(page, "/ru");

  await page.locator("[data-qa='nav-trigger-products']").click();
  await page.waitForTimeout(350);
  await screenshot(page, "after-desktop-products-menu-open-1440x900");
  await measureStableHoverAndFocus(page, "[data-qa='desktop-panel-products'] .product-mega-rail-item", "desktop products rail");

  const panelLinks = await page.locator("[data-qa='desktop-panel-products'] a").evaluateAll((items) =>
    items.map((item) => ({
      href: item instanceof HTMLAnchorElement ? item.getAttribute("href") : "",
      label: item.textContent?.replace(/\s+/g, " ").trim() ?? "",
    })),
  );
  assert(panelLinks.length >= 6, "products panel has too few visible links", { panelLinks });
  assert(panelLinks.every((item) => item.href && item.label), "products panel contains empty link", { panelLinks });
  record("desktop products menu link surface", { count: panelLinks.length });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await page.locator(".header-cta").click();
  await page.waitForURL(/\/ru\/contact(?:\/)?$/, { timeout: 30000 });
  assert(new URL(page.url()).pathname === "/ru/contact", "desktop header CTA did not route to contact", {
    url: page.url(),
  });
  record("desktop header CTA click path", { url: page.url() });
  await page.close();
}

async function mobileClickPaths(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await goto(page, "/ru");
  await page.locator("[data-qa='mobile-nav-toggle']").click();
  await page.waitForTimeout(350);
  await screenshot(page, "after-mobile-menu-open-390x844");

  await measureStableHoverAndFocus(page, ".mobile-nav-section-trigger", "mobile section trigger");
  const productAccordion = page.locator("[data-qa='mobile-product-browser']");
  if ((await productAccordion.count()) > 0) {
    const firstDirection = productAccordion.locator(".mobile-product-accordion-trigger").first();
    assert((await firstDirection.count()) > 0, "mobile product browser has no direction trigger");
    await firstDirection.click();
    await page.waitForTimeout(250);
    const firstFamily = page.locator(".mobile-product-accordion-subtrigger").first();
    if ((await firstFamily.count()) > 0) {
      await firstFamily.click();
      await page.waitForTimeout(180);
    }
  } else {
    const productsBranch = page
      .locator(".mobile-nav-section-trigger")
      .filter({ hasText: /Продукты|Products|Produkte|Productos|Produits|产品|製品/ })
      .first();
    assert((await productsBranch.count()) > 0, "mobile products branch trigger is missing");
    await productsBranch.click();
    await page.waitForTimeout(250);
  }
  await screenshot(page, "after-mobile-products-layer-open-390x844");
  const mobileProductButtons = await page.locator(".mobile-product-accordion-trigger, .mobile-product-direction-button").evaluateAll((items) =>
    items.map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? ""),
  );
  assert(mobileProductButtons.length >= 6, "mobile products layer lost directions", { mobileProductButtons });
  assert(mobileProductButtons.every(Boolean), "mobile products layer has empty buttons", { mobileProductButtons });
  record("mobile products branch surface", { count: mobileProductButtons.length });

  const mobileProductLinks = await page.locator(".mobile-nav-drawer a").evaluateAll((items) =>
    items.map((item) => ({
      href: item instanceof HTMLAnchorElement ? item.getAttribute("href") : "",
      label:
        item.textContent?.replace(/\s+/g, " ").trim() ||
        item.getAttribute("aria-label") ||
        item.querySelector("img")?.getAttribute("alt") ||
        "",
    })),
  );
  assert(mobileProductLinks.every((item) => item.href && item.label), "mobile drawer contains empty link", {
    mobileProductLinks,
  });
  record("mobile drawer link surface", { count: mobileProductLinks.length });
  await page.close();
}

async function languageMatrix(browser) {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const item of languageRoutes) {
    await assertLanguageSurface(desktop, item.route, "desktop", item.targetLocale);
  }
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  for (const item of languageRoutes.slice(0, 6)) {
    await assertLanguageSurface(mobile, item.route, "mobile", item.targetLocale);
  }
  await mobile.close();
}

async function writeReferenceMechanicsNote() {
  await writeFile(
    path.join(artifactRoot, "reference-mechanics-note.md"),
    [
      "# MNT-SITE-VIS-014 Reference Mechanics Note",
      "",
      "- Surface: public header, Products menu, footer, route CTAs and locale switchers.",
      "- Reference mechanic preserved: compact luxury header with centered Montelar brand, Kharma-like Products entry into a deep product menu, and quiet tone-only hover/focus state changes.",
      "- Montelar adaptation: link and CTA states are validated as route handoffs, not redesigned surfaces; the existing dark premium canvas, homepage/banner/product-scene motion and product-menu structure remain intact.",
      "- Code hook: `apps/web/scripts/site-surface-cleanup-qa.mjs` broadens browser evidence; no public React/CSS composition was changed in this rework pass.",
      "- Verification: broadened route/link/language/focus scanner, protected-surface harness, and desktop/laptop/tablet/mobile screenshots in this artifact directory.",
    ].join("\n"),
  );
}

async function main() {
  await mkdir(artifactRoot, { recursive: true });
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    await surfaceMatrix(browser);
    await captureViewportScreenshots(browser);
    await desktopClickPaths(browser);
    await mobileClickPaths(browser);
    await languageMatrix(browser);
  } finally {
    await browser.close();
  }

  await writeReferenceMechanicsNote();
  await writeFile(path.join(artifactRoot, "site-surface-cleanup-qa.json"), JSON.stringify(report, null, 2));
  await writeFile(
    path.join(artifactRoot, "site-surface-cleanup-qa.md"),
    [
      "# MNT-SITE-VIS-014 Surface Cleanup QA",
      "",
      `Status: ${report.failures.length ? "FAIL" : "PASS"}`,
      `Generated: ${report.generatedAt}`,
      `Base URL: ${report.baseUrl}`,
      `Surface routes: ${surfaceRoutes.length}`,
      `Language route checks: ${languageRoutes.length} desktop, ${languageRoutes.slice(0, 6).length} mobile`,
      `Checks: ${report.checks.length}`,
      `Route loads: ${report.routes.length}`,
      `Link targets: ${report.linkTargets.length}`,
      `Screenshots: ${report.screenshots.length}`,
      "",
      "## Coverage",
      "",
      "- Surface routes: " + surfaceRoutes.join(", "),
      "- Language routes: " + languageRoutes.map((item) => `${item.route}->${item.targetLocale}`).join(", "),
      "- Viewports: desktop 1440x900, laptop 1366x768, tablet 768x1024, mobile 390x844.",
      "- Open states: desktop Products menu, mobile menu, mobile Products layer.",
      "- Geometry states: hover and keyboard/programmatic focus-visible for header CTA, locale, nav, route, product, footer and Products-menu controls.",
      "",
      "## Failures",
      "",
      ...(report.failures.length
        ? report.failures.map((failure) => `- ${failure.message}`)
        : ["- none"]),
    ].join("\n"),
  );

  console.log(
    JSON.stringify(
      {
        artifactRoot,
        status: report.failures.length ? "FAIL" : "PASS",
        checks: report.checks.length,
        routeLoads: report.routes.length,
        linkTargets: report.linkTargets.length,
        screenshots: report.screenshots.length,
      },
      null,
      2,
    ),
  );

  if (report.failures.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
