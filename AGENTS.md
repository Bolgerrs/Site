# AGENTS.md

This file is the handoff guide for AI assistants working on this repository.

## Project
Montelar website repository.

## User goal
Use this repository as a fast preview/iteration workspace. Good pages can later be manually moved/promoted to production by the user.

## Important URLs
- GitHub Pages preview target: https://bolgerrs.github.io/Site/
- Historical staging mentioned in README: /root/montelar-staging, montelar-staging.service on port 8096
- Preview scripts mention montelar-preview.service and port 8093

## Actual public preview model
The GitHub Pages site is a static HTML export that lives at the repository root on `main`.

Important: do not assume Pages should build `apps/web/out`. The currently intended preview is the root static export:
- `index.html`
- `about.html`
- `products.html`
- `contact.html`
- `product-monolith.html`
- `product-linea.html`
- `product-arc.html`
- `product-cables.html`

The workflow `.github/workflows/github-pages.yml` builds `_site` by copying root `*.html` files, adds `.nojekyll`, creates `404.html` from `index.html`, uploads `_site`, and deploys with `actions/deploy-pages`.

## Stack
- Root static HTML export for GitHub Pages preview.
- npm workspaces also exist for app source:
  - apps/web: Next.js app
  - apps/admin: admin app
- Root `package.json` delegates scripts to workspaces.

## Key files
- `PROJECT_MEMORY.md`: project context and current operating model.
- `CHANGELOG_AI.md`: AI-maintained change log.
- `.github/workflows/github-pages.yml`: publishes the root static HTML export to GitHub Pages.
- `.github/workflows/preview-deploy.yml`: SSH/server preview deployment, requires secrets.
- `scripts/deploy-if-dirty.sh`: existing server rollout script.
- `scripts/preview-smoke.sh`: existing smoke test script.
- `apps/web/next.config.ts`: Next app config; do not use it as the primary Pages deployment path unless the user explicitly asks to publish the Next app.

## Working rules
- Prefer small, focused commits.
- Do not break the root static HTML preview.
- Do not replace the root static Pages workflow with a Next build unless requested.
- If GitHub search returns empty results, do not trust it blindly; direct `fetch_file` calls have worked better in this repo.
- When a workflow fails, inspect workflow jobs/logs before guessing.
