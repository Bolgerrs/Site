import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const locales = ["ru", "en", "es", "fr", "zh", "ja", "de"];
const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const artifactRoot =
  process.env.MONTELAR_QA_ARTIFACT_DIR ||
  path.resolve(process.cwd(), "../../docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-012/final-route-matrix");
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";
const screenshotMode = process.env.MONTELAR_QA_SCREENSHOT_MODE || "representative";
const maxScreenshots = Number.parseInt(process.env.MONTELAR_QA_MAX_SCREENSHOTS || "80", 10);
let screenshotCount = 0;

const viewports = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const directions = [
  "/vision-max",
  "/audio",
  "/invisible-display",
  "/hologram",
  "/pictorial-art-display",
  "/exhibition-displays",
];

const audioCategories = [
  "/audio/speakers",
  "/audio/streamers",
  "/audio/dac",
  "/audio/amplifiers",
  "/audio/perfect-conductors",
];

const lineRoutes = ["/audio/perfect-conductors/prima-materia"];

const editorialRoutes = [
  "/brand",
  "/technology",
  "/craftsmanship",
  "/projects",
  "/journal",
  "/downloads",
  "/contact",
];

const productSlugs = [
  "vision-max-premium",
  "vision-max-lux",
  "living-glass-oled",
  "hologram-vitrine",
  "pictorial-canvas",
  "exhibition-wall",
  "exhibition-table",
  "exhibition-rail",
  "monolith-reference",
  "nexus-reference-hub",
  "prism-reference-dac",
  "vela-integrated-amplifier",
  "prima-materia-lux-speaker",
];

const productRoutes = productSlugs.map((slug) => `/products/${slug}`);
const requestRoutes = productSlugs.map((slug) => `/request/${slug}`);
const supportRoutes = [
  "/admin-preview",
  "/motion-catalog-prototype",
  "/product-scene-prototype",
  "/product-motion-prototype",
];

const canonicalRoutes = [
  "/",
  ...directions,
  ...audioCategories,
  ...lineRoutes,
  ...productRoutes,
  ...editorialRoutes,
  ...requestRoutes,
  ...supportRoutes,
];

const auditedStaticAppRoutes = [
  "/",
  "/admin-preview",
  "/audio",
  "/brand",
  "/contact",
  "/craftsmanship",
  "/downloads",
  "/exhibition-displays",
  "/hologram",
  "/invisible-display",
  "/journal",
  "/motion-catalog-prototype",
  "/pictorial-art-display",
  "/product-motion-prototype",
  "/product-scene-prototype",
  "/projects",
  "/technology",
  "/vision-max",
];

const forbiddenPatterns = [
  /Киносистема масштаба комнаты/i,
  /Материальный язык/i,
  /Материальный тон/i,
  /Куда идти/i,
  /Куда перейти/i,
  /Что можно сделать/i,
  /Как пользоваться/i,
  /Точки входа/i,
  /С чего начать/i,
  /Кратко о направлении/i,
  /Переходите дальше/i,
  /Продукт раскрывается/i,
  /продукт раскрывается/i,
  /На текущей глубине/i,
  /текущей глубине каталога/i,
  /форма собирает/i,
  /пунк(?:т|тов) для брифа/i,
  /связь с выбранным продуктом/i,
  /Формат консультации:/i,
  /Product detail/i,
  /Карточка продукта/i,
  /Category routes/i,
  /Kategorierouten/i,
  /Маршруты консультации/i,
  /Маршруты Montelar/i,
  /Montelar paths/i,
  /Montelar Wege/i,
  /Rutas Montelar/i,
  /Parcours Montelar/i,
  /Montelar 路径/i,
  /Montelarの導線/i,
  /Выберите направление/i,
  /Выберите подкатегорию/i,
  /Select a direction/i,
  /Choose a subcategory/i,
  /Richtung wählen/i,
  /Unterkategorie wählen/i,
  /Elige una dirección/i,
  /Elige una subcategoría/i,
  /Choisir une direction/i,
  /Choisir une sous-catégorie/i,
  /选择方向/i,
  /选择子类别/i,
  /方向を選択/i,
  /サブカテゴリを選択/i,
  /Inquiry pathways/i,
  /Selected focus:/i,
  /Return to the product\b/i,
  /The presentation balances\b/i,
  /The project is discussed\b/i,
  /Files can be shared\b/i,
  /The private request frames\b/i,
  /Share only the context\b/i,
  /A Montelar advisor receives\b/i,
  /Hero/i,
  /Object Stage/i,
  /Content Mode/i,
  /Use Cases/i,
  /\bPDP\b/i,
  /\broute\b/i,
  /\btemplate\b/i,
  /\bCMS\b/i,
  /\bPayload\b/i,
  /\bscaffold\b/i,
  /\bplaceholder\b/i,
  /\bgated assets\b/i,
  /\bnarrative layer/i,
  /\bproof ledger\b/i,
  /\bworkflow\b/i,
  /\bdownstream\b/i,
  /\bSTART HERE\b/i,
  /\bWHAT YOU CAN DO HERE\b/i,
  /\bWHERE TO GO NEXT\b/i,
  /\bmaterial language\b/i,
  /\bMaterial tone\b/i,
  /\bmanager\b/i,
  /\blead routing\b/i,
  /\bcontract\b/i,
  /настоящая голограмма/i,
  /магия/i,
  /ヒーローシーン/i,
  /このルート/i,
  /该路由/i,
];

const fallbackPatterns = [
  /lorem ipsum/i,
  /coming soon/i,
  /(?<![A-Za-zÀ-ÿ])TODO(?![A-Za-zÀ-ÿ])/,
  /undefined/i,
  /null/i,
  /fallback/i,
];

const nonEnglishFallbackPatterns = [
  /\bSelected focus:/,
  /\bReturn to the product\b/i,
  /\bThe presentation balances\b/i,
  /\bThe project is discussed\b/i,
  /\bFiles can be shared\b/i,
  /\bPrivate consultation starts\b/i,
  /\bThe direction shows\b/i,
  /\bSeries context\b/i,
  /\bWhen no series\b/i,
  /\bThe consultation request remains\b/i,
  /\bThis topic connects\b/i,
  /\bReview the product\b/i,
  /\bCurrent product context\b/i,
  /\bRelated products\b/i,
  /\bProduct details stay available\b/i,
  /\bA Montelar advisor receives\b/i,
  /\bShare only the context\b/i,
  /\bThe private request frames\b/i,
];

const nonEnglishRequestFormFallbackPatterns = [
  /\bCOMPANY \/ FAMILY OFFICE\b/i,
  /\bCOMPANY \/ STUDIO \/ FAMILY OFFICE\b/i,
  /\bCOMPANY \/ BRAND \/ FAMILY OFFICE\b/i,
  /\bPREFERRED CONTACT METHOD\b/i,
  /\bPROJECT TYPE\b/i,
  /\bRESIDENCE TYPE\b/i,
  /\bPROJECT PATH\b/i,
  /\bPrivate cinema\b/,
  /\bMedia room\b/,
  /\bEstate renovation\b/,
  /\bNew build\b/,
  /\bRetrofit\b/,
  /\bCompany \/ family office\b/i,
  /\bCompany \/ studio \/ family office\b/i,
  /\bCompany \/ brand \/ family office\b/i,
  /\bPreferred contact method\b/i,
  /\bProject type\b/i,
  /\bResidence type\b/i,
  /\bProject path\b/i,
];

function joinUrl(route) {
  return `${baseUrl}${route.startsWith("/") ? route : `/${route}`}`;
}

function localizedPath(locale, route) {
  return route === "/" ? `/${locale}` : `/${locale}${route}`;
}

function slugify(value) {
  return value.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
}

function matchPatterns(text, patterns) {
  return patterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const bodyText = document.body.innerText.replace(/\s+/g, " ").trim();
    const textTargets = [
      ...document.querySelectorAll(
        "h1,h2,h3,h4,p,li,a,button,label,summary,input,textarea,select,[class*='route'],[class*='product'],[class*='form']",
      ),
    ];
    const clippedText = [];

    for (const element of textTargets) {
      const style = getComputedStyle(element);
      const className = typeof element.className === "string" ? element.className : "";
      if (style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity || "1") === 0) {
        continue;
      }
      if (
        className.includes("locale-switcher-label") ||
        className.includes("product-scene-prototype") ||
        element.closest(".product-scene-prototype")
      ) {
        continue;
      }
      if (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2) {
        const rect = element.getBoundingClientRect();
        const overflowX = style.overflowX;
        const overflowY = style.overflowY;
        const clipsX = overflowX !== "visible" && element.scrollWidth > element.clientWidth + 8;
        const clipsY = overflowY !== "visible" && element.scrollHeight > element.clientHeight + 8;
        if (rect.width > 4 && rect.height > 4 && (clipsX || clipsY)) {
          clippedText.push({
            tag: element.tagName.toLowerCase(),
            className,
            overflowX,
            overflowY,
            text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "",
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
          });
        }
      }
    }

    return {
      title: document.title,
      bodyText,
      textStart: bodyText.slice(0, 2200),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      clippedText: clippedText.slice(0, 20),
      pathname: window.location.pathname,
    };
  });
}

async function capture(browser, route, locale, viewportName, options = {}) {
  const viewport = viewports[viewportName];
  const page = await browser.newPage({ viewport });
  const pathName = localizedPath(locale, route);
  const response = await page.goto(joinUrl(pathName), { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(200);
  const status = response?.status() ?? 0;
  const inspection = await inspectPage(page);
  const forbiddenMatches = matchPatterns(inspection.bodyText, forbiddenPatterns);
  const fallbackMatches = matchPatterns(inspection.bodyText, fallbackPatterns);
  const languageMatches =
    locale === "en"
      ? []
      : route.startsWith("/products/") || route.startsWith("/request/") || supportRoutes.includes(route)
        ? matchPatterns(inspection.bodyText, nonEnglishFallbackPatterns)
        : [];
  const requestFormMatches =
    locale === "en" || !route.startsWith("/request/")
      ? []
      : matchPatterns(inspection.bodyText, nonEnglishRequestFormFallbackPatterns);
  const failures = [];

  if (status < 200 || status >= 400) failures.push(`status:${status}`);
  if (inspection.horizontalOverflow > 2) failures.push(`horizontal-overflow:${inspection.horizontalOverflow}`);
  if (inspection.clippedText.length > 0) failures.push(`clipped-text:${inspection.clippedText.length}`);
  if (forbiddenMatches.length > 0) failures.push(`forbidden:${forbiddenMatches.join(",")}`);
  if (fallbackMatches.length > 0) failures.push(`fallback:${fallbackMatches.join(",")}`);
  if (languageMatches.length > 0) failures.push(`language-fallback:${languageMatches.join(",")}`);
  if (requestFormMatches.length > 0) failures.push(`request-form-fallback:${requestFormMatches.join(",")}`);

  let screenshotPath = null;
  if (options.screenshot) {
    screenshotPath = path.join(
      artifactRoot,
      `${locale}-${slugify(route)}-${viewportName}-${viewport.width}x${viewport.height}.jpg`,
    );
    await page.screenshot({ path: screenshotPath, fullPage: false, type: "jpeg", quality: 72 });
  }

  await page.close();

  return {
    route: pathName,
    canonicalRoute: route,
    locale,
    viewport: viewportName,
    status,
    layoutStatus: failures.some((failure) => failure.startsWith("horizontal") || failure.startsWith("clipped"))
      ? "fail"
      : "pass",
    textStatus: forbiddenMatches.length || fallbackMatches.length ? "fail" : "pass",
    languageStatus: languageMatches.length || requestFormMatches.length ? "fail" : "pass",
    translationStatus: inspection.bodyText.length > 80 ? "pass" : "fail",
    horizontalOverflow: inspection.horizontalOverflow,
    clippedTextCount: inspection.clippedText.length,
    clippedText: inspection.clippedText,
    forbiddenMatches,
    fallbackMatches,
    languageMatches,
    requestFormMatches,
    failures,
    title: inspection.title,
    textStart: inspection.textStart,
    screenshotPath,
  };
}

function shouldScreenshot(route, locale, viewportName) {
  if (screenshotMode === "none") return false;

  let selected = false;
  if (screenshotMode === "all") {
    selected = true;
  } else if (screenshotMode === "representative") {
    const primaryLocales = ["ru", "en"];
    const representativeRoutes = [
      "/",
      "/vision-max",
      "/hologram",
      "/products/monolith-reference",
      "/products/hologram-vitrine",
      "/request/vision-max-premium",
      "/request/hologram-vitrine",
      "/contact",
    ];

    selected = primaryLocales.includes(locale) && representativeRoutes.includes(route);
    if (selected && route.startsWith("/request/")) {
      selected = ["desktop", "mobile"].includes(viewportName);
    } else if (selected) {
      selected = viewportName === "desktop";
    }
  } else {
    throw new Error(`Unsupported MONTELAR_QA_SCREENSHOT_MODE: ${screenshotMode}`);
  }

  if (!selected) return false;
  if (Number.isFinite(maxScreenshots) && screenshotCount >= maxScreenshots) return false;
  screenshotCount += 1;
  return true;
}

function assertAuditedRouteInventory() {
  const appRoot = path.resolve(process.cwd(), "src/app");
  const missingStaticRoutes = auditedStaticAppRoutes.filter((route) => !canonicalRoutes.includes(route));
  if (missingStaticRoutes.length > 0) {
    throw new Error(`Audited static app routes missing from matrix: ${missingStaticRoutes.join(", ")}`);
  }

  for (const route of auditedStaticAppRoutes) {
    const routeDir = route === "/" ? appRoot : path.join(appRoot, route.replace(/^\//, ""));
    const pagePath = path.join(routeDir, "page.tsx");
    if (!existsSync(pagePath)) {
      throw new Error(`Audited route ${route} does not match an existing app page: ${pagePath}`);
    }
  }
}

async function main() {
  assertAuditedRouteInventory();
  await mkdir(artifactRoot, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true });
  const rows = [];

  try {
    for (const locale of locales) {
      for (const route of canonicalRoutes) {
        rows.push(await capture(browser, route, locale, "desktop", { screenshot: shouldScreenshot(route, locale, "desktop") }));

        if (route.startsWith("/request/")) {
          for (const viewportName of ["laptop", "tablet", "mobile"]) {
            rows.push(
              await capture(browser, route, locale, viewportName, {
                screenshot: shouldScreenshot(route, locale, viewportName),
              }),
            );
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  const failedRows = rows.filter((row) => row.failures.length > 0 || row.translationStatus === "fail");
  const requestRows = rows.filter((row) => row.canonicalRoute.startsWith("/request/"));
  const screenshotRows = rows.filter((row) => row.screenshotPath);
  const report = {
    summary: {
      baseUrl,
      generatedAt: new Date().toISOString(),
      canonicalRouteCount: canonicalRoutes.length,
      localeCount: locales.length,
      rowCount: rows.length,
      requestRowCount: requestRows.length,
      screenshotCount: screenshotRows.length,
      failedRowCount: failedRows.length,
      status: failedRows.length === 0 ? "PASS" : "FAIL",
    },
    routes: canonicalRoutes,
    requestRoutes,
    supportRoutes,
    auditedStaticAppRoutes,
    rows,
  };

  await writeFile(path.join(artifactRoot, "route-locale-matrix.json"), JSON.stringify(report, null, 2));
  await writeFile(
    path.join(artifactRoot, "route-locale-matrix.md"),
    [
      "# MNT-SITE-VIS-012 Route/Locale Matrix",
      "",
      `Status: ${report.summary.status}`,
      `Generated: ${report.summary.generatedAt}`,
      `Base URL: ${baseUrl}`,
      `Canonical routes: ${report.summary.canonicalRouteCount}`,
      `Locales: ${locales.join(", ")}`,
      `Rows: ${report.summary.rowCount}`,
      `Request rows: ${report.summary.requestRowCount}`,
      `Screenshots: ${report.summary.screenshotCount}`,
      `Screenshot mode: ${screenshotMode}`,
      `Screenshot cap: ${Number.isFinite(maxScreenshots) ? maxScreenshots : "none"}`,
      `Failures: ${report.summary.failedRowCount}`,
      "",
      "## Request Routes",
      "",
      ...requestRoutes.map((route) => `- ${route}`),
      "",
      "## Hidden/Support Routes Included In Rendered Scan",
      "",
      ...supportRoutes.map((route) => `- ${route}`),
      "",
      "## Screenshots",
      "",
      ...screenshotRows.map(
        (row) =>
          `- ${row.locale} ${row.canonicalRoute} ${row.viewport}: ${path.relative(artifactRoot, row.screenshotPath)}`,
      ),
      "",
      "## Failures",
      "",
      ...(failedRows.length
        ? failedRows.map((row) => `- ${row.route} ${row.viewport}: ${row.failures.join("; ") || row.translationStatus}`)
        : ["- none"]),
      "",
    ].join("\n"),
  );

  if (failedRows.length > 0) {
    console.error(`site text route matrix failed: ${failedRows.length} failing rows`);
    process.exitCode = 1;
    return;
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
