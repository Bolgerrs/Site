import assert from "node:assert/strict";
import { chromium, request } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:3002").replace(/\/+$/, "");
const ownerEmail = process.env.MONTELAR_QA_EMAIL || "owner@montelar.example";
const wrongRoleEmail = process.env.MONTELAR_QA_WRONG_ROLE_EMAIL || "lead-manager@montelar.example";
const password = process.env.MONTELAR_QA_PASSWORD || "MontelarSmoke123!";

async function loginContext(browser, email) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login", {
      timeout: 30000,
    }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.close();
  return context;
}

async function expectStatus(api, method, url, status, body) {
  const requestUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  const response = await api.fetch(requestUrl, {
    data: body,
    failOnStatusCode: false,
    method,
  });
  assert.equal(response.status(), status, `${method} ${url} should return ${status}`);
  return response;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const anonymous = await request.newContext({ baseURL: baseUrl });
  const owner = await loginContext(browser, ownerEmail);
  const wrongRole = await loginContext(browser, wrongRoleEmail);

  try {
    const checksResponse = await expectStatus(owner.request, "GET", "/api/internal/owner/checks?check=site-health", 200);
    const checks = await checksResponse.json();
    const siteHealth = checks.checks.find((entry) => entry.id === "site-health");
    const issue = siteHealth?.issues?.[0];
    assert.ok(issue?.id, "owner checks smoke needs a site-health issue");
    const actionId = issue.actions?.[0]?.id;
    assert.ok(actionId, "owner checks smoke needs a repair action");

    const issuePath = `/api/internal/owner/checks/site-health/issues/${encodeURIComponent(issue.id)}/fix`;

    const issuesResponse = await expectStatus(owner.request, "GET", "/api/internal/owner/checks/site-health/issues", 200);
    const issues = await issuesResponse.json();
    assert.ok(Array.isArray(issues.issues), "owner issues response should include issues array");

    const fixResponse = await expectStatus(owner.request, "POST", issuePath, 200, { actionId });
    const fix = await fixResponse.json();
    assert.equal(fix.ok, true);
    assert.equal(fix.mutates, false);
    assert.equal(fix.commandContract, "open-guided-editor-target");
    assert.match(fix.targetHref, /^\/admin\//);
    assert.doesNotMatch(fix.targetHref, /\/admin\/collections/);

    await expectStatus(anonymous, "GET", "/api/internal/owner/checks?check=site-health", 401);
    await expectStatus(anonymous, "GET", "/api/internal/owner/checks/site-health/issues", 401);
    await expectStatus(anonymous, "POST", issuePath, 401, { actionId });

    await expectStatus(wrongRole.request, "GET", "/api/internal/owner/checks?check=site-health", 403);
    await expectStatus(wrongRole.request, "GET", "/api/internal/owner/checks/site-health/issues", 403);
    await expectStatus(wrongRole.request, "POST", issuePath, 403, { actionId });

    console.log(
      JSON.stringify(
        {
          baseUrl,
          checks: "owner 200, anonymous 401, wrong-role 403",
          fixContract: {
            commandContract: fix.commandContract,
            mutates: fix.mutates,
            targetHref: fix.targetHref,
          },
          issues: "owner 200, anonymous 401, wrong-role 403",
        },
        null,
        2,
      ),
    );
    console.log("owner-checks-api-access-smoke: ok");
  } finally {
    await anonymous.dispose();
    await wrongRole.close();
    await owner.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
