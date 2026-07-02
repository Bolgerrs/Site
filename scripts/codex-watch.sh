#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="/tmp/montelar-codex-logs"
mkdir -p "$LOG_DIR"

if [ "${1:-}" = "--runner" ]; then
  touch "$LOG_DIR/runner.log"
  exec tail -f "$LOG_DIR/runner.log"
fi

LATEST=$(ls -t "$LOG_DIR"/autonomous-*.log 2>/dev/null | head -1 || true)
if [ -z "$LATEST" ]; then
  echo "No autonomous logs yet. Runner log:"
  touch "$LOG_DIR/runner.log"
  exec tail -f "$LOG_DIR/runner.log"
fi

echo "Watching $LATEST"
exec tail -f "$LATEST"
