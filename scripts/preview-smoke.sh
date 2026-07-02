#!/usr/bin/env bash
set -euo pipefail

PREVIEW_UNIT="${MONTELAR_PREVIEW_UNIT:-montelar-preview.service}"
PREVIEW_PORT="${MONTELAR_PREVIEW_PORT:-8093}"
LOCAL_BASE="${MONTELAR_PREVIEW_LOCAL_URL:-http://127.0.0.1:${PREVIEW_PORT}}"
PUBLIC_BASE="${MONTELAR_PREVIEW_PUBLIC_URL:-http://89.150.34.66:${PREVIEW_PORT}/}"
RETRIES="${MONTELAR_PREVIEW_SMOKE_RETRIES:-6}"
INTERVAL_SEC="${MONTELAR_PREVIEW_SMOKE_INTERVAL_SEC:-2}"

LOCAL_BASE="${LOCAL_BASE%/}"
PUBLIC_BASE="${PUBLIC_BASE%/}"

CHECK_LOCAL=1
CHECK_PUBLIC=1
ROUTES=()

usage() {
  echo "usage: $0 [--route <path>] [--local-only|--public-only]" >&2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --route)
      ROUTES+=("${2:-}")
      shift 2
      ;;
    --local-only)
      CHECK_LOCAL=1
      CHECK_PUBLIC=0
      shift
      ;;
    --public-only)
      CHECK_LOCAL=0
      CHECK_PUBLIC=1
      shift
      ;;
    *)
      usage
      exit 2
      ;;
  esac
done

if [ "${#ROUTES[@]}" -eq 0 ]; then
  ROUTES=( "/" "/en" )
fi

join_url() {
  local base="$1"
  local route="$2"

  if [ "$route" = "/" ]; then
    printf '%s/\n' "$base"
    return 0
  fi

  printf '%s/%s\n' "$base" "${route#/}"
}

service_is_active() {
  systemctl is-active --quiet "$PREVIEW_UNIT"
}

probe_url() {
  local label="$1"
  local url="$2"
  local attempt=1
  local response=""
  local code=""
  local final_url=""

  while [ "$attempt" -le "$RETRIES" ]; do
    if response="$(curl -fsS -L -o /dev/null -w '%{http_code} %{url_effective}' "$url" 2>/dev/null)"; then
      code="${response%% *}"
      final_url="${response#* }"
      printf 'preview-smoke: ok %s %s -> %s (%s)\n' "$label" "$url" "$code" "$final_url"
      return 0
    fi

    if [ "$attempt" -lt "$RETRIES" ]; then
      sleep "$INTERVAL_SEC"
    fi
    attempt=$((attempt + 1))
  done

  printf 'preview-smoke: failed %s %s after %s attempts\n' "$label" "$url" "$RETRIES" >&2
  return 1
}

if ! service_is_active; then
  echo "preview-smoke: $PREVIEW_UNIT is not active" >&2
  exit 1
fi

echo "preview-smoke: unit=$PREVIEW_UNIT retries=$RETRIES interval=${INTERVAL_SEC}s"

FAILED=0
for route in "${ROUTES[@]}"; do
  if [ "$CHECK_LOCAL" = "1" ]; then
    probe_url "local" "$(join_url "$LOCAL_BASE" "$route")" || FAILED=1
  fi

  if [ "$CHECK_PUBLIC" = "1" ]; then
    probe_url "public" "$(join_url "$PUBLIC_BASE" "$route")" || FAILED=1
  fi
done

exit "$FAILED"
