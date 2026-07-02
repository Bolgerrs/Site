#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/root/montelar"
HOST="${MONTELAR_PREVIEW_HOST:-0.0.0.0}"
PORT="${MONTELAR_PREVIEW_PORT:-8093}"
RUNTIME="${MONTELAR_PREVIEW_RUNTIME:-static-root}"
STATIC_DIR="${MONTELAR_PREVIEW_STATIC_DIR:-$ROOT_DIR}"
NEXT_APP_DIR="${MONTELAR_PREVIEW_NEXT_APP_DIR:-$ROOT_DIR/apps/web}"

cd "$ROOT_DIR"

case "$RUNTIME" in
  static-root)
    exec python3 -m http.server "$PORT" --bind "$HOST" --directory "$STATIC_DIR"
    ;;
  nextjs-app)
    if [ ! -d "$NEXT_APP_DIR" ]; then
      echo "preview-serve: missing Next.js app directory: $NEXT_APP_DIR" >&2
      exit 2
    fi
    if [ ! -d "$NEXT_APP_DIR/.next" ]; then
      echo "preview-serve: missing Next.js build output in $NEXT_APP_DIR/.next" >&2
      echo "preview-serve: build the frontend before switching runtime to nextjs-app" >&2
      exit 3
    fi
    cd "$NEXT_APP_DIR"
    exec npx next start -H "$HOST" -p "$PORT"
    ;;
  *)
    echo "preview-serve: unsupported runtime '$RUNTIME'" >&2
    exit 4
    ;;
esac
