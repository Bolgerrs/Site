import { chromium } from "playwright";

const profileDir = process.env.FLOW_PROFILE_DIR || "/root/.config/montelar-flow-playwright";
const cdpPort = process.env.FLOW_CDP_PORT || "9222";
const startUrl = process.env.FLOW_START_URL || "https://labs.google/fx/tools/flow";

const context = await chromium.launchPersistentContext(profileDir, {
  channel: "chrome",
  headless: false,
  viewport: null,
  args: [
    `--remote-debugging-address=127.0.0.1`,
    `--remote-debugging-port=${cdpPort}`,
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--start-maximized",
  ],
});

const page = context.pages()[0] || (await context.newPage());
await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

console.log(`FLOW_PLAYWRIGHT_READY profile=${profileDir} cdp=http://127.0.0.1:${cdpPort} url=${startUrl}`);

const shutdown = async () => {
  try {
    await context.close();
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await new Promise(() => {});
