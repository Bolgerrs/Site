#!/usr/bin/env bash
# Guard owner/site-admin/editor flows against direct raw Payload links.

set -uo pipefail

ROOT_DIR="${MONTELAR_ROOT_DIR:-/root/montelar}"
cd "$ROOT_DIR" || exit 1

paths=(
  apps/admin/src/lib/payload/admin-dashboard.ts
  apps/admin/src/lib/payload/checks-workspace.ts
  apps/admin/src/lib/payload/media-workspace.ts
  apps/admin/src/lib/payload/owner-products.ts
  apps/admin/src/lib/payload/owner-settings-workspace.ts
  apps/admin/src/lib/payload/owner-site-block.ts
  apps/admin/src/lib/payload/site-admin-workspace.ts
  apps/admin/src/lib/payload/site-workspace.ts
  apps/admin/src/lib/payload/translations-workspace.ts
  apps/admin/src/lib/payload/page-editor.ts
  apps/admin/src/lib/payload/product-editor.ts
  apps/admin/src/lib/payload/forms-editor.ts
  apps/admin/src/lib/payload/category-editor.ts
  apps/admin/src/components/admin-shell
  apps/admin/src/components/page-editor
  apps/admin/src/components/product-editor
  apps/admin/src/components/forms-editor
  apps/admin/src/components/category-editor
  apps/admin/src/app/api/internal
)

existing=()
for path in "${paths[@]}"; do
  if [ -e "$path" ]; then
    existing+=("$path")
  fi
done

if [ "${#existing[@]}" -eq 0 ]; then
  echo "admin-bff-self-review-scan: no guarded paths found" >&2
  exit 1
fi

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

if rg -n '/admin/collections' "${existing[@]}" \
  --glob '!apps/admin/src/components/admin-shell/MontelarAdvancedSettings.tsx' \
  --glob '!apps/admin/src/app/(payload)/admin/advanced/**' \
  > "$tmp_file"; then
  echo "admin-bff-self-review-scan: direct /admin/collections leak(s) in owner/site-admin/editor flow:" >&2
  cat "$tmp_file" >&2
  echo "admin-bff-self-review-scan: raw links must be wrapped through /admin/advanced?raw=... or kept only in explicit advanced/developer surfaces" >&2
  exit 1
fi

echo "admin-bff-self-review-scan: ok"
