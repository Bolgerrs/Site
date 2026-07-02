#!/usr/bin/env bash
set -euo pipefail

SOURCE="current-shell"
PROFILE="preview"

while [ $# -gt 0 ]; do
  case "$1" in
    --source)
      SOURCE="${2:-}"
      shift 2
      ;;
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    *)
      echo "usage: $0 --source <current-shell|systemd-preview|systemd-autonomous|systemd-admin> --profile <preview|autonomous|app|admin>" >&2
      exit 2
      ;;
  esac
done

load_current_shell() {
  env
}

load_systemd_env() {
  local unit="$1"
  systemctl show "$unit" --property=Environment --value | tr ' ' '\n' | sed '/^$/d'
}

case "$SOURCE" in
  current-shell)
    ENV_LINES="$(load_current_shell)"
    ;;
  systemd-preview)
    ENV_LINES="$(load_systemd_env montelar-preview.service)"
    ;;
  systemd-autonomous)
    ENV_LINES="$(load_systemd_env montelar-codex-autonomous.service)"
    ;;
  systemd-admin)
    ENV_LINES="$(load_systemd_env montelar-admin.service)"
    ;;
  *)
    echo "env-check: unsupported source '$SOURCE'" >&2
    exit 2
    ;;
esac

is_set() {
  local key="$1"
  printf '%s\n' "$ENV_LINES" | rg -q "^${key}="
}

report_var() {
  local key="$1"
  local required="$2"
  if is_set "$key"; then
    printf 'set              %s\n' "$key"
    return 0
  fi

  if [ "$required" = "required" ]; then
    printf 'missing          %s\n' "$key" >&2
    return 1
  fi

  printf 'optional-missing %s\n' "$key"
  return 0
}

case "$PROFILE" in
  preview)
    REQUIRED_VARS=(
      MONTELAR_PREVIEW_HOST
      MONTELAR_PREVIEW_PORT
      MONTELAR_PREVIEW_RUNTIME
      MONTELAR_PREVIEW_PUBLIC_URL
      MONTELAR_PREVIEW_NEXT_APP_DIR
    )
    OPTIONAL_VARS=(
      NODE_ENV
      MONTELAR_PREVIEW_STATIC_DIR
      MONTELAR_PREVIEW_SMOKE_DELAY_SEC
    )
    ;;
  autonomous)
    REQUIRED_VARS=(
      PATH
    )
    OPTIONAL_VARS=(
      CODEX_COOLDOWN_SEC
      MONTELAR_AUTONOMOUS_LOG_DIR
    )
    ;;
  app)
    REQUIRED_VARS=()
    OPTIONAL_VARS=(
      NEXT_PUBLIC_SITE_URL
      MONTELAR_CMS_PROVIDER
      MONTELAR_PAYLOAD_BASE_URL
      MONTELAR_LEAD_NOTIFICATION_WEBHOOK_URL
      MONTELAR_ADMIN_DEPLOY_MODE
    )
    ;;
  admin)
    REQUIRED_VARS=()
    OPTIONAL_VARS=(
      PAYLOAD_SECRET
      DATABASE_URL
      MONTELAR_ADMIN_HOST
      MONTELAR_ADMIN_PORT
      NEXT_PUBLIC_ADMIN_URL
      NEXT_PUBLIC_SITE_URL
      MONTELAR_PREVIEW_SECRET
      MONTELAR_UPLOADS_DIR
    )
    ;;
  *)
    echo "env-check: unsupported profile '$PROFILE'" >&2
    exit 2
    ;;
esac

echo "env-check: source=$SOURCE profile=$PROFILE"

FAILED=0
for key in "${REQUIRED_VARS[@]}"; do
  report_var "$key" required || FAILED=1
done

for key in "${OPTIONAL_VARS[@]}"; do
  report_var "$key" optional || true
done

exit "$FAILED"
