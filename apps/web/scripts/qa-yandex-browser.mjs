import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const executablePath = process.env.YANDEX_BROWSER_PATH || "/usr/bin/yandex-browser-stable";
const targetUrl = process.env.QA_URL || "http://89.150.34.66:8093/en";
const artifactRoot =
  path.resolve(
    repoRoot,
    process.env.QA_ARTIFACT_DIR ||
      process.env.MONTELAR_QA_ARTIFACT_DIR ||
      "docs/strategy/artifacts/visual-qa/real-yandex",
  );

async function main() {
  if (!existsSync(executablePath)) {
    throw new Error(`Yandex Browser executable not found: ${executablePath}`);
  }

  await mkdir(artifactRoot, { recursive: true });

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(`${targetUrl}${targetUrl.includes("?") ? "&" : "?"}qa=real-yandex`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(800);

  const topState = await page.evaluate(() => {
    const figure = document.querySelector(".home-product-reel-item figure");
    const image = figure?.querySelector("img") ?? null;

    return {
      userAgent: navigator.userAgent,
      htmlClasses: document.documentElement.className,
      chooseDirectionVisible: document.body.innerText.includes("Choose a direction"),
      figure: figure
        ? {
            backgroundImage: getComputedStyle(figure).backgroundImage,
            boxShadow: getComputedStyle(figure).boxShadow,
            beforeDisplay: getComputedStyle(figure, "::before").display,
            afterDisplay: getComputedStyle(figure, "::after").display,
          }
        : null,
      imageTransform: image ? getComputedStyle(image).transform : null,
    };
  });

  await page.evaluate(() => window.scrollTo({ top: 2250, behavior: "instant" }));
  await page.waitForTimeout(900);

  const scrollState = await page.evaluate(() => {
    const item = document.querySelector(".home-product-reel-item");
    const figure = document.querySelector(".home-product-reel-item figure");
    const image = figure?.querySelector("img") ?? null;

    return {
      scrollY: window.scrollY,
      itemOpacity: item ? getComputedStyle(item).opacity : null,
      itemTransform: item ? getComputedStyle(item).transform : null,
      figureOpacity: figure ? getComputedStyle(figure).opacity : null,
      figureTransform: figure ? getComputedStyle(figure).transform : null,
      imageTransform: image ? getComputedStyle(image).transform : null,
      figureBoxShadow: figure ? getComputedStyle(figure).boxShadow : null,
      figureBackgroundImage: figure ? getComputedStyle(figure).backgroundImage : null,
      figureBeforeDisplay: figure ? getComputedStyle(figure, "::before").display : null,
      figureAfterDisplay: figure ? getComputedStyle(figure, "::after").display : null,
    };
  });

  const screenshot = path.join(artifactRoot, "home-real-yandex.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  await browser.close();

  const result = { executablePath, targetUrl, screenshot, topState, scrollState };
  await writeFile(path.join(artifactRoot, "yandex-browser-report.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  if (!topState.userAgent.includes("YaBrowser/")) {
    throw new Error("Real Yandex Browser did not expose YaBrowser user agent.");
  }
  if (topState.chooseDirectionVisible) {
    throw new Error("Removed homepage direction block is visible again.");
  }
  if (scrollState.figureBoxShadow !== "none" || scrollState.figureBackgroundImage !== "none") {
    throw new Error("Homepage image oval/background returned.");
  }
  if (scrollState.figureBeforeDisplay !== "none" || scrollState.figureAfterDisplay !== "none") {
    throw new Error("Homepage image pseudo oval returned.");
  }
  if (
    scrollState.itemTransform === "none" &&
    scrollState.figureTransform === "none" &&
    scrollState.imageTransform === "none"
  ) {
    throw new Error("Homepage scroll motion is not active.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
