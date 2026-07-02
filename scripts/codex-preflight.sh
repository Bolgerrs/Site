#!/usr/bin/env bash
# Non-destructive preflight for the Montelar autonomous loop.

set -uo pipefail

ROOT_DIR="${MONTELAR_ROOT_DIR:-/root/montelar}"
MIN_FREE_KB="${MONTELAR_PREFLIGHT_MIN_FREE_KB:-3145728}"
BFF_BASELINE_MANIFEST="${MONTELAR_BFF_BASELINE_MANIFEST:-docs/strategy/artifacts/autonomous-baseline/bff-current-baseline.env}"

cd "$ROOT_DIR" || exit 1

next_task_id() {
  awk -F'|' '
    $0 ~ /^\| MNT-/ {
      id=$2; status=$3;
      gsub(/^ +| +$/, "", id);
      gsub(/^ +| +$/, "", status);
      if (status == "in_progress") { print id; exit }
      if (status == "pending" && first == "") first=id;
    }
    END { if (first != "") print first }
  ' docs/tasks/INDEX.md
}

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

is_admin_bff_task() {
  case "$1" in
    MNT-ADMIN-BFF-*) return 0 ;;
    *) return 1 ;;
  esac
}

apps_dirty_status_fingerprint() {
  git status --porcelain=v1 apps/admin apps/web | sha256sum | awk '{print $1}'
}

fail=0
task_id="$(next_task_id)"
free_kb="$(df -Pk "$ROOT_DIR" | awk 'NR==2 {print $4}')"
web_fp="$(tree_fingerprint apps/web)"
admin_fp="$(tree_fingerprint apps/admin)"
apps_status_fp="$(apps_dirty_status_fingerprint)"

echo "codex-preflight: root=$ROOT_DIR"
echo "codex-preflight: task=${task_id:-none}"
echo "codex-preflight: free_kb=$free_kb min_kb=$MIN_FREE_KB"
echo "codex-preflight: apps_web_fingerprint=$web_fp"
echo "codex-preflight: apps_admin_fingerprint=$admin_fp"
echo "codex-preflight: apps_dirty_status_fingerprint=$apps_status_fp"

if [ -z "$task_id" ]; then
  echo "codex-preflight: no runnable task found" >&2
  fail=1
fi

if [ "${free_kb:-0}" -lt "$MIN_FREE_KB" ]; then
  echo "codex-preflight: not enough free disk space" >&2
  fail=1
fi

if ! bash -n scripts/codex-loop.sh; then
  echo "codex-preflight: scripts/codex-loop.sh syntax check failed" >&2
  fail=1
fi

if systemctl is-active --quiet montelar-codex-autonomous.service; then
  echo "codex-preflight: autonomous service already active" >&2
  fail=1
else
  echo "codex-preflight: autonomous service inactive"
fi

if [ -x scripts/queue-check.sh ]; then
  if ! bash scripts/queue-check.sh >/tmp/montelar-preflight-queue-check.log 2>&1; then
    echo "codex-preflight: queue-check failed, see /tmp/montelar-preflight-queue-check.log" >&2
    fail=1
  else
    echo "codex-preflight: queue-check ok"
  fi
fi

if [ -x scripts/preview-smoke.sh ]; then
  if ! bash scripts/preview-smoke.sh >/tmp/montelar-preflight-preview-smoke.log 2>&1; then
    echo "codex-preflight: preview smoke failed, see /tmp/montelar-preflight-preview-smoke.log" >&2
    fail=1
  else
    echo "codex-preflight: preview smoke ok"
  fi
fi

if [ -x scripts/admin-smoke.sh ]; then
  if ! bash scripts/admin-smoke.sh >/tmp/montelar-preflight-admin-smoke.log 2>&1; then
    echo "codex-preflight: admin smoke failed, see /tmp/montelar-preflight-admin-smoke.log" >&2
    fail=1
  else
    echo "codex-preflight: admin smoke ok"
  fi
fi

apps_web_dirty=0
apps_admin_dirty=0

if git status --short apps/web | grep -q .; then
  apps_web_dirty=1
  echo "codex-preflight: apps/web has existing dirty baseline; BFF guard will protect against new changes"
  git status --short apps/web | sed 's/^/codex-preflight: apps-web-dirty: /'
fi

if git status --short apps/admin | grep -q .; then
  apps_admin_dirty=1
  echo "codex-preflight: apps/admin has existing dirty baseline; expected only if continuing current BFF work"
  git status --short apps/admin | sed 's/^/codex-preflight: apps-admin-dirty: /' | head -60
fi

if is_admin_bff_task "$task_id" && { [ "$apps_web_dirty" -ne 0 ] || [ "$apps_admin_dirty" -ne 0 ]; }; then
  if [ ! -f "$BFF_BASELINE_MANIFEST" ]; then
    echo "codex-preflight: BFF dirty baseline manifest missing: $BFF_BASELINE_MANIFEST" >&2
    echo "codex-preflight: run scripts/codex-capture-bff-baseline.sh before guarded BFF start" >&2
    fail=1
  else
    # shellcheck disable=SC1090
    . "$BFF_BASELINE_MANIFEST"
    if [ "${apps_web_fingerprint:-}" != "$web_fp" ] || \
       [ "${apps_admin_fingerprint:-}" != "$admin_fp" ] || \
       [ "${apps_dirty_status_fingerprint:-}" != "$apps_status_fp" ]; then
      echo "codex-preflight: BFF dirty baseline manifest does not match current apps/admin+apps/web state" >&2
      echo "codex-preflight: manifest=$BFF_BASELINE_MANIFEST" >&2
      fail=1
    else
      echo "codex-preflight: BFF dirty baseline manifest matches current state"
    fi
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo "codex-preflight: FAIL" >&2
  exit 1
fi

echo "codex-preflight: PASS"
