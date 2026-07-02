#!/usr/bin/env bash
set -euo pipefail

PREVIEW_UNIT="${MONTELAR_PREVIEW_UNIT:-montelar-preview.service}"

if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet "$PREVIEW_UNIT"; then
  if [ "${MONTELAR_RUNTIME_BUILD:-0}" != "1" ]; then
    cat >&2 <<MSG
web-build-runtime: refusing to run next build while $PREVIEW_UNIT is active.
Use npm run build:verify for checks, or run scripts/deploy-if-dirty.sh for runtime rollout.
MSG
    exit 2
  fi
fi

npx next build
