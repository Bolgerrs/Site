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

## Stack
- npm workspaces
- apps/web: Next.js app
- apps/admin: admin app
- root package.json delegates scripts to workspaces

## Key files
- PROJECT_MEMORY.md: project context and current operating model
- CHANGELOG_AI.md: AI-maintained change log
- apps/web/next.config.ts: supports normal server mode and GitHub Pages static export when MONTELAR_GITHUB_PAGES=1
- scripts/deploy-if-dirty.sh: existing server rollout script
- scripts/preview-smoke.sh: existing smoke test script
- .github/workflows/github-pages.yml: GitHub Pages Actions deployment
- .github/workflows/preview-deploy.yml: SSH/server preview deployment, requires secrets

## Working rules
- Prefer small, focused commits.
- Do not break the server deployment path while fixing GitHub Pages preview.
- Keep GitHub Pages preview static-export-specific changes behind MONTELAR_GITHUB_PAGES=1.
- If GitHub search returns empty results, do not trust it blindly; direct fetch_file calls have worked better in this repo.
- When a workflow fails, inspect workflow jobs/logs before guessing.

## GitHub Pages notes
GitHub Pages preview is intended as a non-production visual review environment at /Site/. Because this is a project page, static export must use basePath /Site and assetPrefix /Site/.
