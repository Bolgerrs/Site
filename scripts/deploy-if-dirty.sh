#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

if [ "${DEPLOY_CHANGED_FILES:-}" != "" ]; then
  CHANGED=$(printf "%s\n" "$DEPLOY_CHANGED_FILES" | sed '/^$/d' | sort -u)
elif [ "${DEPLOY_DIFF_RANGE:-}" != "" ]; then
  CHANGED=$(git diff --name-only "$DEPLOY_DIFF_RANGE")
elif [ -n "$(git status --porcelain)" ]; then
  CHANGED=$(git diff --name-only HEAD)
  STAGED=$(git diff --cached --name-only HEAD)
  UNTRACKED=$(git ls-files --others --exclude-standard)
  CHANGED=$(printf "%s\n%s\n%s\n" "$CHANGED" "$STAGED" "$UNTRACKED" | sed '/^$/d' | sort -u)
else
  CHANGED=$(git diff --name-only HEAD~1..HEAD 2>/dev/null || true)
fi

if [ -z "$CHANGED" ]; then
  echo "deploy-if-dirty: no changed files"
  exit 0
fi

PROFILE="docs-only"

if echo "$CHANGED" | rg -q '^(app|apps|components|lib|public|styles|assets|index\\.html|about\\.html|products\\.html|product-|contact\\.html|package.json|pnpm-lock.yaml|next.config|tsconfig)'; then
  PROFILE="frontend-only"
fi

if echo "$CHANGED" | rg -q '^(admin|cms|directus|database|migrations|schema|packages/content-model|payload\.config|apps/admin/|apps/web/src/app/(admin|admin-preview)(/|$)|apps/web/src/components/admin|apps/web/src/lib/leads/|apps/web/src/app/api/leads/)'; then
  if [ "$PROFILE" = "frontend-only" ]; then
    PROFILE="admin-only"
  else
    PROFILE="admin-only"
  fi
fi

if echo "$CHANGED" | rg -q '^(ops|scripts|\\.env.example|docker|systemd|docs/runbook)'; then
  PROFILE="infra"
fi

echo "deploy-if-dirty: changed files:"
echo "$CHANGED" | sed -n '1,80p'
echo "deploy-if-dirty: selected profile=$PROFILE"

if [ "$DRY_RUN" = "1" ]; then
  exit 0
fi

build_frontend_with_static_retention() {
  local app_dir="apps/web"
  local static_keep_dir=""

  if [ -d "$app_dir/.next/static" ]; then
    static_keep_dir="$(mktemp -d /tmp/montelar-next-static-keep.XXXXXX)"
    cp -a "$app_dir/.next/static/." "$static_keep_dir/"
  fi

  MONTELAR_RUNTIME_BUILD=1 npm run build

  if [ -n "$static_keep_dir" ] && [ -d "$static_keep_dir" ]; then
    mkdir -p "$app_dir/.next/static"
    cp -an "$static_keep_dir/." "$app_dir/.next/static/"
    rm -rf "$static_keep_dir"
  fi
}

case "$PROFILE" in
  docs-only)
    if [ -n "$(git status --porcelain)" ]; then
      git diff --check -- docs
    else
      git diff --check HEAD~1..HEAD -- docs
    fi
    echo "deploy-if-dirty: docs-only, no deploy"
    ;;
  frontend-only)
    if systemctl list-unit-files montelar-preview.service >/dev/null 2>&1; then
      build_frontend_with_static_retention
      systemctl restart montelar-preview.service
      bash scripts/preview-smoke.sh
      echo "deploy-if-dirty: frontend built and preview refreshed at ${MONTELAR_PREVIEW_PUBLIC_URL:-http://89.150.34.66:${MONTELAR_PREVIEW_PORT:-8093}/}"
    else
      echo "deploy-if-dirty: montelar-preview.service is not installed yet"
      exit 3
    fi
    ;;
  admin-only)
    ADMIN_MODE="${MONTELAR_ADMIN_DEPLOY_MODE:-integrated-nextjs-preview}"
    echo "deploy-if-dirty: admin deploy mode=$ADMIN_MODE"
    case "$ADMIN_MODE" in
      integrated-nextjs-preview)
        if systemctl list-unit-files montelar-preview.service >/dev/null 2>&1; then
          build_frontend_with_static_retention
          systemctl restart montelar-preview.service
          bash scripts/preview-smoke.sh --route /en/admin-preview
          PUBLIC_BASE="${MONTELAR_PREVIEW_PUBLIC_URL:-http://89.150.34.66:${MONTELAR_PREVIEW_PORT:-8093}/}"
          PUBLIC_BASE="${PUBLIC_BASE%/}"
          echo "deploy-if-dirty: admin preview built and refreshed at $PUBLIC_BASE/en/admin-preview"
        else
          echo "deploy-if-dirty: montelar-preview.service is not installed yet"
          exit 3
        fi
        ;;
      standalone-payload)
        if systemctl list-unit-files montelar-admin.service >/dev/null 2>&1; then
          npm run build --workspace @montelar/admin
          systemctl restart montelar-admin.service
          systemctl status montelar-admin.service --no-pager -l >/dev/null
          bash scripts/admin-smoke.sh
          bash scripts/preview-smoke.sh --route /en
          echo "deploy-if-dirty: standalone Payload admin service refreshed"
        else
          echo "deploy-if-dirty: standalone Payload admin service is not installed yet"
          exit 3
        fi
        ;;
      *)
        echo "deploy-if-dirty: unknown admin deploy mode $ADMIN_MODE" >&2
        exit 2
        ;;
    esac
    ;;
  schema-content-model)
    echo "deploy-if-dirty: schema/content-model runtime not implemented yet"
    ;;
  infra)
    echo "deploy-if-dirty: infra change, manual service verification required"
    ;;
  *)
    echo "deploy-if-dirty: unknown profile $PROFILE" >&2
    exit 2
    ;;
esac
