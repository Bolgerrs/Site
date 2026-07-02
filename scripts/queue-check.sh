#!/usr/bin/env bash
set -euo pipefail

QUEUE_FILE="${1:-docs/tasks/INDEX.md}"

if [ ! -f "$QUEUE_FILE" ]; then
  echo "queue-check: missing $QUEUE_FILE" >&2
  exit 1
fi

TMP_IDS=$(mktemp)
TMP_ROWS=$(mktemp)
trap 'rm -f "$TMP_IDS" "$TMP_ROWS"' EXIT

awk -F'|' '
  /^\| MNT-/ {
    id=$2; status=$3; dep=$5; name=$6;
    gsub(/^ +| +$/, "", id);
    gsub(/^ +| +$/, "", status);
    gsub(/^ +| +$/, "", dep);
    gsub(/^ +| +$/, "", name);
    print id "|" status "|" dep "|" name;
    print id > ids_file;
  }
' ids_file="$TMP_IDS" "$QUEUE_FILE" > "$TMP_ROWS"

if [ ! -s "$TMP_ROWS" ]; then
  echo "queue-check: no MNT task rows found" >&2
  exit 1
fi

IN_PROGRESS=$(awk -F'|' '$2 == "in_progress" {count++} END {print count+0}' "$TMP_ROWS")
if [ "$IN_PROGRESS" -gt 1 ]; then
  echo "queue-check: more than one in_progress task ($IN_PROGRESS)" >&2
  exit 1
fi

DUPLICATES=$(sort "$TMP_IDS" | uniq -d)
if [ -n "$DUPLICATES" ]; then
  echo "queue-check: duplicate task ids:" >&2
  echo "$DUPLICATES" >&2
  exit 1
fi

latest_review_artifact_time() {
  local task_id="$1"
  local verdict="$2"
  local self_review_filter=()

  if [ "$verdict" = "PASS" ]; then
    self_review_filter=( ! -name "${task_id}-*-SELF-REVIEW-PASS.md" )
  fi

  find docs/strategy/artifacts/autonomous-review \
    -type f \
    -name "${task_id}-*-${verdict}.md" \
    "${self_review_filter[@]}" \
    -printf '%T@\n' 2>/dev/null \
    | sort -n \
    | tail -1
}

has_unresolved_reviewer_fail() {
  local task_id="$1"
  local latest_fail
  local latest_pass

  latest_fail="$(latest_review_artifact_time "$task_id" "FAIL")"
  if [ -z "$latest_fail" ]; then
    return 1
  fi

  latest_pass="$(latest_review_artifact_time "$task_id" "PASS")"
  if [ -z "$latest_pass" ]; then
    return 0
  fi

  awk -v fail="$latest_fail" -v pass="$latest_pass" 'BEGIN { exit(pass > fail ? 1 : 0) }'
}

awk -F'|' -v ids="$TMP_IDS" '
  BEGIN {
    while ((getline id < ids) > 0) {
      known[id] = 1;
    }
  }
  {
    dep=$3;
    if (dep == "-" || dep == "") next;
    n=split(dep, deps, ",");
    for (i=1; i<=n; i++) {
      gsub(/^ +| +$/, "", deps[i]);
      if (deps[i] != "" && !known[deps[i]]) {
        print "queue-check: missing dependency " deps[i] " for " $1 > "/dev/stderr";
        bad=1;
      }
    }
  }
  END { exit bad ? 1 : 0 }
' "$TMP_ROWS"

if rg -n '/root/bitcomp-b2b-platform|BitComp services|bitcomp-codex-autonomous' "$QUEUE_FILE" >/tmp/montelar-queue-bitcomp-hit 2>/dev/null; then
  echo "queue-check: queue must not instruct Montelar tasks to modify BitComp" >&2
  cat /tmp/montelar-queue-bitcomp-hit >&2
  exit 1
fi

while IFS='|' read -r task_id status _dep _name; do
  case "$task_id" in
    MNT-ADMIN-BFF-*) ;;
    *) continue ;;
  esac

  if [ "$status" = "in_progress" ]; then
    IFS=',' read -r -a deps <<< "$_dep"
    for dep in "${deps[@]}"; do
      dep="${dep#"${dep%%[![:space:]]*}"}"
      dep="${dep%"${dep##*[![:space:]]}"}"
      case "$dep" in
        MNT-ADMIN-BFF-*) ;;
        *) continue ;;
      esac

      if has_unresolved_reviewer_fail "$dep"; then
        echo "queue-check: $task_id is in_progress but dependency $dep still has unresolved reviewer FAIL" >&2
        exit 1
      fi
    done
  fi

  if [ "$status" != "done" ]; then
    continue
  fi

  if has_unresolved_reviewer_fail "$task_id"; then
    echo "queue-check: $task_id is done after reviewer FAIL but has no newer external reviewer PASS artifact; SELF-REVIEW-PASS is not sufficient" >&2
    exit 1
  fi
done < "$TMP_ROWS"

echo "queue-check: ok, tasks=$(wc -l < "$TMP_ROWS"), in_progress=$IN_PROGRESS"
