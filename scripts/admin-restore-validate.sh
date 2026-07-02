#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ADMIN_TMP_DIR="$PROJECT_ROOT/apps/admin/.tmp"
SITE_URL="${MONTELAR_RESTORE_VALIDATE_SITE_URL:-http://127.0.0.1:8093/en}"
ADMIN_PREVIEW_URL="${MONTELAR_RESTORE_VALIDATE_ADMIN_PREVIEW_URL:-http://127.0.0.1:8093/en/admin-preview}"
SKIP_HTTP=0

usage() {
  cat <<'EOF'
usage: admin-restore-validate.sh [--skip-http] [--site-url <url>] [--admin-preview-url <url>]

Runs non-destructive post-restore validation for the current Montelar admin baseline.
Automated checks cover:
- role/access boundaries
- published read and draft isolation via public CMS allowlist smoke
- authorized lead-access workspace behavior

Manual follow-up remains required for real admin login until standalone Payload runtime exists.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-http)
      SKIP_HTTP=1
      shift
      ;;
    --site-url)
      SITE_URL="${2:-}"
      shift 2
      ;;
    --admin-preview-url)
      ADMIN_PREVIEW_URL="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "admin-restore-validate: unsupported argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done

mkdir -p "$ADMIN_TMP_DIR"

run_smoke() {
  local script_name="$1"
  local db_path="$ADMIN_TMP_DIR/$2"

  rm -f "$db_path"
  DATABASE_URL="file:$db_path" npm --workspace @montelar/admin run "$script_name"
  rm -f "$db_path"
}

echo "admin-restore-validate: running access boundary smoke"
npm --workspace @montelar/admin run smoke:access

echo "admin-restore-validate: running published read + draft isolation smoke"
run_smoke "smoke:public-api-allowlist" "restore-validate-public-api.db"

echo "admin-restore-validate: running authorized lead access smoke"
run_smoke "smoke:leads-inbox" "restore-validate-leads.db"

if [ "$SKIP_HTTP" = "0" ]; then
  echo "admin-restore-validate: checking preview routes"
  curl -fsS "$SITE_URL" >/dev/null
  curl -fsS "$ADMIN_PREVIEW_URL" >/dev/null
fi

cat <<EOF
admin-restore-validate: automated checks passed
manual checklist:
- confirm real admin login with an Owner/Admin account once standalone admin runtime exists;
- confirm the restored backup point matches the expected timestamp before reopening writes;
- confirm uploads referenced by a published product/page resolve in the recovered runtime;
- record the restore operator, timestamp and backup archive in audit/recovery notes.
EOF
