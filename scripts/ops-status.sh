#!/usr/bin/env bash
set -euo pipefail

PREVIEW_UNIT="${MONTELAR_PREVIEW_UNIT:-montelar-preview.service}"
AUTONOMOUS_UNIT="${MONTELAR_AUTONOMOUS_UNIT:-montelar-codex-autonomous.service}"
ADMIN_UNIT="${MONTELAR_ADMIN_UNIT:-montelar-admin.service}"
PREVIEW_PORT="${MONTELAR_PREVIEW_PORT:-8093}"
ADMIN_PORT="${MONTELAR_ADMIN_PORT:-3002}"
LOG_DIR="${MONTELAR_AUTONOMOUS_LOG_DIR:-/tmp/montelar-codex-logs}"
MODE="${1:---summary}"

print_service_block() {
  local unit="$1"
  echo "== $unit =="
  systemctl status "$unit" --no-pager -l | sed -n '1,14p'
  echo
}

case "$MODE" in
  --summary)
    print_service_block "$PREVIEW_UNIT"
    print_service_block "$AUTONOMOUS_UNIT"
    if systemctl list-unit-files "$ADMIN_UNIT" >/dev/null 2>&1; then
      print_service_block "$ADMIN_UNIT"
    else
      echo "== $ADMIN_UNIT =="
      echo "not installed"
      echo
    fi

    echo "== listener check =="
    ss -ltnp | rg ":${PREVIEW_PORT}\\b" || true
    ss -ltnp | rg ":${ADMIN_PORT}\\b" || true
    echo

    echo "== preview journal tail =="
    journalctl -u "$PREVIEW_UNIT" -n 12 --no-pager || true
    echo

    echo "== autonomous runner tail =="
    if [ -f "$LOG_DIR/runner.log" ]; then
      tail -n 12 "$LOG_DIR/runner.log"
    else
      echo "runner log not found: $LOG_DIR/runner.log"
    fi
    echo

    echo "== latest autonomous iteration =="
    LATEST=$(ls -t "$LOG_DIR"/autonomous-*.log 2>/dev/null | head -1 || true)
    if [ -n "$LATEST" ]; then
      echo "$LATEST"
      tail -n 12 "$LATEST"
    else
      echo "no autonomous iteration logs yet"
    fi
    ;;
  --preview-log)
    exec journalctl -u "$PREVIEW_UNIT" -n 40 -f
    ;;
  --autonomous-runner)
    touch "$LOG_DIR/runner.log"
    exec tail -f "$LOG_DIR/runner.log"
    ;;
  --autonomous-iteration)
    LATEST=$(ls -t "$LOG_DIR"/autonomous-*.log 2>/dev/null | head -1 || true)
    if [ -z "$LATEST" ]; then
      echo "no autonomous iteration logs yet" >&2
      exit 1
    fi
    echo "Watching $LATEST"
    exec tail -f "$LATEST"
    ;;
  *)
    echo "usage: $0 [--summary|--preview-log|--autonomous-runner|--autonomous-iteration]" >&2
    exit 2
    ;;
esac
