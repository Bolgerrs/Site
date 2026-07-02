#!/usr/bin/env bash
set -euo pipefail

ADMIN_UNIT="${MONTELAR_ADMIN_UNIT:-montelar-admin.service}"
ADMIN_HOST="${MONTELAR_ADMIN_HOST:-127.0.0.1}"
ADMIN_PORT="${MONTELAR_ADMIN_PORT:-3002}"
BASE_URL="${MONTELAR_ADMIN_BASE_URL:-http://${ADMIN_HOST}:${ADMIN_PORT}}"
RETRIES="${MONTELAR_ADMIN_SMOKE_RETRIES:-6}"
INTERVAL_SEC="${MONTELAR_ADMIN_SMOKE_INTERVAL_SEC:-2}"
CHECK_ROUTES=("/api/health" "/admin")

BASE_URL="${BASE_URL%/}"

service_is_active() {
  systemctl is-active --quiet "$ADMIN_UNIT"
}

probe_url() {
  local url="$1"
  local attempt=1
  local response=""
  local code=""
  local final_url=""

  while [ "$attempt" -le "$RETRIES" ]; do
    if response="$(curl -fsS -L -o /dev/null -w '%{http_code} %{url_effective}' "$url" 2>/dev/null)"; then
      code="${response%% *}"
      final_url="${response#* }"
      printf 'admin-smoke: ok %s -> %s (%s)\n' "$url" "$code" "$final_url"
      return 0
    fi

    if [ "$attempt" -lt "$RETRIES" ]; then
      sleep "$INTERVAL_SEC"
    fi
    attempt=$((attempt + 1))
  done

  printf 'admin-smoke: failed %s after %s attempts\n' "$url" "$RETRIES" >&2
  return 1
}

if ! service_is_active; then
  echo "admin-smoke: $ADMIN_UNIT is not active" >&2
  exit 1
fi

echo "admin-smoke: unit=$ADMIN_UNIT base=$BASE_URL retries=$RETRIES interval=${INTERVAL_SEC}s"

FAILED=0
for route in "${CHECK_ROUTES[@]}"; do
  probe_url "${BASE_URL}${route}" || FAILED=1
done

exit "$FAILED"
