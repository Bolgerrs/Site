#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
NEXT_ENV_FILE="$WEB_DIR/next-env.d.ts"
NEXT_ENV_BACKUP="$(mktemp)"

cp "$NEXT_ENV_FILE" "$NEXT_ENV_BACKUP"

cleanup() {
  cp "$NEXT_ENV_BACKUP" "$NEXT_ENV_FILE"
  rm -f "$NEXT_ENV_BACKUP"
  rm -rf "$WEB_DIR/.next-verify"
}

trap cleanup EXIT

rm -rf "$WEB_DIR/.next-verify"

(
  cd "$WEB_DIR"
  MONTELAR_NEXT_DIST_DIR=.next-verify npx next build
)
