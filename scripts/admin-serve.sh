#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${MONTELAR_ADMIN_APP_DIR:-/root/montelar/apps/admin}"
HOST="${MONTELAR_ADMIN_HOST:-127.0.0.1}"
PORT="${MONTELAR_ADMIN_PORT:-3001}"

if [ ! -d "$APP_DIR" ]; then
  echo "admin-serve: app dir not found: $APP_DIR" >&2
  exit 1
fi

if [ ! -f "$APP_DIR/.next/BUILD_ID" ]; then
  echo "admin-serve: missing Next.js build in $APP_DIR/.next; run npm --workspace @montelar/admin run build first" >&2
  exit 1
fi

cd "$APP_DIR"
exec npx next start -H "$HOST" -p "$PORT"
