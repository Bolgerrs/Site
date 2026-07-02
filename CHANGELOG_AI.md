# AI Changelog

## 2026-07-02

### Project context captured
- Added `PROJECT_MEMORY.md` to preserve high-level project goals and workflow for future sessions.
- Added `AGENTS.md` with operational guidance for future AI assistants.

### Preview deployment work
- Added `.github/workflows/preview-deploy.yml` for SSH-based preview rollout through the existing `scripts/deploy-if-dirty.sh` path.
- Added GitHub Pages support for static preview at `https://bolgerrs.github.io/Site/`.
- Updated `apps/web/next.config.ts` so GitHub Pages export is only active when `MONTELAR_GITHUB_PAGES=1`.
- Added `.github/workflows/github-pages.yml` to build and deploy `apps/web/out` via GitHub Pages Actions.

### Known current issue
- User reports `https://bolgerrs.github.io/Site/` is not accessible yet.
- Most likely causes to verify next:
  1. GitHub Pages Source is not set to GitHub Actions in repository settings.
  2. GitHub Pages workflow failed during build/export/deploy.
  3. Static export failed because some routes use server-only Next.js features.
  4. Repository visibility/settings prevent public Pages access until Pages is enabled.

### Important investigation notes
- GitHub code search returned empty results earlier even when files existed. Prefer direct `fetch_file` calls for known paths.
- Directly fetched files confirmed this is not an empty repository.
