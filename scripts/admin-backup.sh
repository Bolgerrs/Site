#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_ROOT="$PROJECT_ROOT/apps/admin"
DEFAULT_DATABASE_URL="file:$APP_ROOT/.tmp/payload-dev.db"
DEFAULT_UPLOADS_DIR="$APP_ROOT/.uploads"
BACKUP_ROOT="${MONTELAR_ADMIN_BACKUP_ROOT:-/root/backups/montelar-admin}"
RETENTION_NOTE="${MONTELAR_ADMIN_BACKUP_RETENTION:-7 daily / 4 weekly / 3 monthly}"
LABEL="manual"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"

usage() {
  cat <<'EOF'
usage: admin-backup.sh [--label <label>] [--timestamp <utc-stamp>] [--output-root <path>]

Creates a CMS backup bundle for the current admin runtime:
- PostgreSQL: pg_dump custom archive
- SQLite: filesystem copy of the current database file
- uploads: tar.gz archive of the uploads directory

Output files:
- <backup>.tar.gz
- <backup>.tar.gz.manifest.txt
- <backup>.tar.gz.sha256
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --label)
      LABEL="${2:-}"
      shift 2
      ;;
    --timestamp)
      TIMESTAMP="${2:-}"
      shift 2
      ;;
    --output-root)
      BACKUP_ROOT="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "admin-backup: unsupported argument '$1'" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$LABEL" ]; then
  echo "admin-backup: --label must not be empty" >&2
  exit 2
fi

SAFE_LABEL="$(printf '%s' "$LABEL" | tr '[:space:]/:' '-' | tr -cd '[:alnum:]._-' )"
if [ -z "$SAFE_LABEL" ]; then
  echo "admin-backup: label resolved to empty safe value" >&2
  exit 2
fi

DATABASE_URL_VALUE="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
UPLOADS_DIR_VALUE="${MONTELAR_UPLOADS_DIR:-$DEFAULT_UPLOADS_DIR}"
BUNDLE_NAME="montelar-admin-${TIMESTAMP}-${SAFE_LABEL}"
ARCHIVE_PATH="$BACKUP_ROOT/${BUNDLE_NAME}.tar.gz"
MANIFEST_PATH="${ARCHIVE_PATH}.manifest.txt"
CHECKSUM_PATH="${ARCHIVE_PATH}.sha256"

mkdir -p "$BACKUP_ROOT"

STAGE_ROOT="$(mktemp -d "$BACKUP_ROOT/.admin-backup.XXXXXX")"
BUNDLE_DIR="$STAGE_ROOT/$BUNDLE_NAME"

cleanup() {
  rm -rf "$STAGE_ROOT"
}
trap cleanup EXIT

mkdir -p "$BUNDLE_DIR"

DB_KIND="sqlite"
DB_ARTIFACT=""
DB_SOURCE=""

if [[ "$DATABASE_URL_VALUE" == postgres://* || "$DATABASE_URL_VALUE" == postgresql://* ]]; then
  DB_KIND="postgres"
  DB_ARTIFACT="database.pgdump"
  DB_SOURCE="postgres://configured"

  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "admin-backup: pg_dump is required for postgres backups" >&2
    exit 3
  fi

  pg_dump \
    --format=custom \
    --no-owner \
    --file "$BUNDLE_DIR/$DB_ARTIFACT" \
    "$DATABASE_URL_VALUE"
else
  DB_SOURCE="${DATABASE_URL_VALUE#file:}"
  DB_ARTIFACT="database.sqlite"

  if [ ! -f "$DB_SOURCE" ]; then
    echo "admin-backup: sqlite database not found at '$DB_SOURCE'" >&2
    exit 3
  fi

  cp -p "$DB_SOURCE" "$BUNDLE_DIR/$DB_ARTIFACT"
fi

if [ ! -d "$UPLOADS_DIR_VALUE" ]; then
  echo "admin-backup: uploads directory not found at '$UPLOADS_DIR_VALUE'" >&2
  exit 3
fi

tar -C "$UPLOADS_DIR_VALUE" -czf "$BUNDLE_DIR/uploads.tar.gz" .

cat > "$BUNDLE_DIR/README.txt" <<EOF
Montelar admin backup bundle
created_at_utc=$TIMESTAMP
project_root=$PROJECT_ROOT
admin_app_root=$APP_ROOT
db_kind=$DB_KIND
db_source=$DB_SOURCE
uploads_source=$UPLOADS_DIR_VALUE
retention_expectation=$RETENTION_NOTE
scope=database dump/copy + uploads archive only
excluded=caches, logs, build artifacts, secrets, node_modules, preview/runtime bundles
restore_followup=see docs/runbook/admin-backup-recovery.md
EOF

find "$BUNDLE_DIR" -maxdepth 1 -type f -printf '%f\t%s bytes\n' | sort > "$BUNDLE_DIR/contents.txt"

tar -C "$STAGE_ROOT" -czf "$ARCHIVE_PATH" "$BUNDLE_NAME"
tar -tzf "$ARCHIVE_PATH" > "$MANIFEST_PATH"
sha256sum "$ARCHIVE_PATH" > "$CHECKSUM_PATH"

echo "admin-backup: archive=$ARCHIVE_PATH"
echo "admin-backup: manifest=$MANIFEST_PATH"
echo "admin-backup: checksum=$CHECKSUM_PATH"
echo "admin-backup: db_kind=$DB_KIND uploads_dir=$UPLOADS_DIR_VALUE"
