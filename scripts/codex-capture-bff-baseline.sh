#!/usr/bin/env bash
# Capture the current dirty apps/admin + apps/web baseline for guarded BFF runs.

set -uo pipefail

ROOT_DIR="${MONTELAR_ROOT_DIR:-/root/montelar}"
BASELINE_DIR="${MONTELAR_BFF_BASELINE_DIR:-docs/strategy/artifacts/autonomous-baseline}"
BASELINE_ENV="$BASELINE_DIR/bff-current-baseline.env"
BASELINE_STATUS="$BASELINE_DIR/bff-current-baseline.status.txt"

cd "$ROOT_DIR" || exit 1
mkdir -p "$BASELINE_DIR"

tree_fingerprint() {
  local root="$1"

  if [ ! -d "$root" ]; then
    echo "missing"
    return
  fi

  find "$root" \
    \( -path "$root/.next" -o -path "$root/.next/*" \
       -o -path "$root/.next-verify" -o -path "$root/.next-verify/*" \
       -o -path "$root/node_modules" -o -path "$root/node_modules/*" \
       -o -path "$root/.turbo" -o -path "$root/.turbo/*" \
       -o -path "$root/.tmp" -o -path "$root/.tmp/*" \) -prune \
    -o -type f -print0 \
    | sort -z \
    | xargs -0 sha256sum 2>/dev/null \
    | sha256sum \
    | awk '{print $1}'
}

apps_web_fingerprint="$(tree_fingerprint apps/web)"
apps_admin_fingerprint="$(tree_fingerprint apps/admin)"
apps_dirty_status_fingerprint="$(git status --porcelain=v1 apps/admin apps/web | sha256sum | awk '{print $1}')"
created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

git status --porcelain=v1 apps/admin apps/web > "$BASELINE_STATUS"

{
  printf 'created_at=%q\n' "$created_at"
  printf 'apps_web_fingerprint=%q\n' "$apps_web_fingerprint"
  printf 'apps_admin_fingerprint=%q\n' "$apps_admin_fingerprint"
  printf 'apps_dirty_status_fingerprint=%q\n' "$apps_dirty_status_fingerprint"
  printf 'status_file=%q\n' "$BASELINE_STATUS"
} > "$BASELINE_ENV"

echo "codex-capture-bff-baseline: manifest=$BASELINE_ENV"
echo "codex-capture-bff-baseline: status=$BASELINE_STATUS"
echo "codex-capture-bff-baseline: apps_web_fingerprint=$apps_web_fingerprint"
echo "codex-capture-bff-baseline: apps_admin_fingerprint=$apps_admin_fingerprint"
echo "codex-capture-bff-baseline: apps_dirty_status_fingerprint=$apps_dirty_status_fingerprint"
