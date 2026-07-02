#!/usr/bin/env bash
# Resource guard for the Montelar autonomous Codex loop.
# Fails before a heavy iteration can pressure the production host.

set -uo pipefail

ROOT_DIR="${MONTELAR_ROOT_DIR:-/root/montelar}"
MIN_FREE_KB="${CODEX_MIN_FREE_KB:-1048576}" # 1 GiB
MAX_DISK_USE_PCT="${CODEX_MAX_DISK_USE_PCT:-99}"
MIN_AVAILABLE_MEM_KB="${CODEX_MIN_AVAILABLE_MEM_KB:-1048576}" # 1 GiB
MAX_LOAD_PER_CPU="${CODEX_MAX_LOAD_PER_CPU:-4}"

fail() {
  echo "RESOURCE_GUARD: FAIL: $*"
  exit 1
}

disk_line="$(df -Pk "$ROOT_DIR" | awk 'NR==2 { print $4 " " $5 }')"
free_kb="${disk_line%% *}"
use_pct="${disk_line##* }"
use_pct="${use_pct%%%}"

if [ -z "$free_kb" ] || [ -z "$use_pct" ]; then
  fail "cannot read disk usage for $ROOT_DIR"
fi

if [ "$free_kb" -lt "$MIN_FREE_KB" ]; then
  fail "free disk is ${free_kb}KB, required at least ${MIN_FREE_KB}KB"
fi

if [ "$use_pct" -gt "$MAX_DISK_USE_PCT" ]; then
  fail "disk usage is ${use_pct}%, emergency max allowed ${MAX_DISK_USE_PCT}%"
fi

available_mem_kb="$(awk '/MemAvailable:/ { print $2 }' /proc/meminfo)"
if [ -z "$available_mem_kb" ]; then
  fail "cannot read MemAvailable"
fi

if [ "$available_mem_kb" -lt "$MIN_AVAILABLE_MEM_KB" ]; then
  fail "available memory is ${available_mem_kb}KB, required at least ${MIN_AVAILABLE_MEM_KB}KB"
fi

load_1m="$(awk '{ print $1 }' /proc/loadavg)"
cpu_count="$(nproc 2>/dev/null || echo 1)"
load_limit="$(awk -v cpu="$cpu_count" -v per_cpu="$MAX_LOAD_PER_CPU" 'BEGIN { printf "%.2f", cpu * per_cpu }')"
load_ok="$(awk -v current_load="$load_1m" -v limit="$load_limit" 'BEGIN { print (current_load <= limit) ? 1 : 0 }')"
if [ "$load_ok" != "1" ]; then
  fail "1m load is ${load_1m}, max allowed ${load_limit}"
fi

echo "RESOURCE_GUARD: PASS disk_free_kb=$free_kb min_free_kb=$MIN_FREE_KB disk_use_pct=$use_pct emergency_max_disk_use_pct=$MAX_DISK_USE_PCT mem_available_kb=$available_mem_kb load_1m=$load_1m"
