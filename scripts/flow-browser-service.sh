#!/usr/bin/env bash
set -euo pipefail

export FLOW_DISPLAY="${FLOW_DISPLAY:-:99}"
export DISPLAY="$FLOW_DISPLAY"
export FLOW_PROFILE_DIR="${FLOW_PROFILE_DIR:-/root/.config/montelar-flow-playwright}"
export FLOW_CDP_PORT="${FLOW_CDP_PORT:-9222}"
export FLOW_NOVNC_PORT="${FLOW_NOVNC_PORT:-6081}"
export FLOW_VNC_PORT="${FLOW_VNC_PORT:-5901}"
export FLOW_START_URL="${FLOW_START_URL:-https://labs.google/fx/tools/flow}"

mkdir -p "$FLOW_PROFILE_DIR"
rm -f "$FLOW_PROFILE_DIR"/SingletonCookie "$FLOW_PROFILE_DIR"/SingletonLock "$FLOW_PROFILE_DIR"/SingletonSocket

cleanup() {
  jobs -pr | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

Xvfb "$FLOW_DISPLAY" -screen 0 1600x1000x24 -ac -nolisten tcp &
sleep 0.6

x11vnc \
  -display "$FLOW_DISPLAY" \
  -localhost \
  -rfbport "$FLOW_VNC_PORT" \
  -nopw \
  -forever \
  -shared \
  -quiet &
sleep 0.4

websockify \
  --web=/usr/share/novnc \
  "127.0.0.1:${FLOW_NOVNC_PORT}" \
  "127.0.0.1:${FLOW_VNC_PORT}" &
sleep 0.4

cd /root/montelar
exec /opt/google/chrome/chrome \
  --user-data-dir="$FLOW_PROFILE_DIR" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port="$FLOW_CDP_PORT" \
  --no-sandbox \
  --disable-dev-shm-usage \
  --no-first-run \
  --no-default-browser-check \
  --password-store=basic \
  --use-mock-keychain \
  --start-maximized \
  "$FLOW_START_URL"
