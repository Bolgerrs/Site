# Montelar staging export

This repository is a clean code export of the Montelar staging website that was served from `/root/montelar-staging` on port `8096`.

Use this repo for website review, frontend editing, page/component analysis, and GPT Web access.

Important runtime facts:
- Main app: `apps/web`
- Admin app source may be present under `apps/admin`, but the visual staging target is the public web app.
- Runtime/build folders are intentionally not committed: `node_modules`, `.next`, `.turbo`, caches and logs.
- Heavy autonomous-contour artifacts and generated QA archives are intentionally not committed.

Install/build normally from repository root using the package manager/lockfile present in the project.
