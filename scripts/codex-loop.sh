#!/usr/bin/env bash
# Continuous Codex autonomous loop for Montelar.
# Managed by montelar-codex-autonomous.service when explicitly installed/started.

set -uo pipefail

ROOT_DIR="/root/montelar"
LOG_DIR="/tmp/montelar-codex-logs"
CODEX_CMD="${CODEX_CMD:-codex}"
COOLDOWN_SEC="${CODEX_COOLDOWN_SEC:-10}"
REVIEWER_HANDLES_SCOPE_GUARDS="${CODEX_REVIEWER_HANDLES_SCOPE_GUARDS:-1}"
MAIN_TIMEOUT_SEC="${CODEX_MAIN_TIMEOUT_SEC:-5400}"
REVIEWER_TIMEOUT_SEC="${CODEX_REVIEWER_TIMEOUT_SEC:-2700}"
GUARD_RETRY_SEC="${CODEX_GUARD_RETRY_SEC:-60}"
RESOURCE_GUARD="${CODEX_RESOURCE_GUARD:-scripts/autonomous-resource-guard.sh}"

mkdir -p "$LOG_DIR"
cd "$ROOT_DIR" || exit 1

LOCK_FILE="$LOG_DIR/codex-loop.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  TS_LOCK=$(date +%Y%m%d-%H%M%S)
  echo "[$TS_LOCK] guard: another codex-loop process is already running; refusing parallel start" >> "$LOG_DIR/runner.log"
  exit 0
fi

next_task_id() {
  awk -F'|' '
    function trim(s) {
      gsub(/^ +| +$/, "", s);
      return s;
    }
    $0 ~ /^\| MNT-/ {
      id=trim($2); status=trim($3); deps=trim($5);
      count++;
      ids[count]=id;
      task_status[id]=status;
      task_deps[id]=deps;
      if (status == "in_progress" && active == "") active=id;
    }
    END {
      if (active != "") { print active; exit }
      for (i = 1; i <= count; i++) {
        id=ids[i];
        if (task_status[id] != "pending") continue;

        deps=task_deps[id];
        if (deps == "" || deps == "-") { print id; exit }

        split(deps, dep_list, ",");
        ready=1;
        for (j in dep_list) {
          dep=trim(dep_list[j]);
          if (dep == "" || dep == "-") continue;
          if (task_status[dep] != "done") {
            ready=0;
            break;
          }
        }
        if (ready) { print id; exit }
      }
    }
  ' docs/tasks/INDEX.md
}

task_profile() {
  case "$1" in
    MNT-PROD-019|MNT-PROD-02[1-9]|MNT-PROD-030) echo "fast-skeleton"; return ;;
    MNT-SITE-VIS-021*) echo "flow-safe"; return ;;
    MNT-CRE-*|MNT-VIS-*|MNT-LUX-*|MNT-SITE-VIS-*|MNT-PROD-VIS-*|MNT-RSCH-014) echo "visual-mcp"; return ;;
    MNT-STANDALONE-*) echo "visual-mcp"; return ;;
    MNT-WEB-*|MNT-CMS-*|MNT-FORM-*|MNT-I18N-*|MNT-PQA-*|MNT-SEO-*|MNT-OPS-*|MNT-LANG-*|MNT-CRM-*) echo "code"; return ;;
    MNT-RSCH-*|MNT-PROD-*) echo "docs"; return ;;
    *) echo "code"; return ;;
  esac
}

web_tree_fingerprint() {
  if [ ! -d apps/web ]; then
    echo "missing"
    return
  fi

  find apps/web \
    \( -path 'apps/web/.next' -o -path 'apps/web/.next/*' \
       -o -path 'apps/web/.next-verify' -o -path 'apps/web/.next-verify/*' \
       -o -path 'apps/web/node_modules' -o -path 'apps/web/node_modules/*' \
       -o -path 'apps/web/.turbo' -o -path 'apps/web/.turbo/*' \) -prune \
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

is_site_visual_task() {
  case "$1" in
    MNT-SITE-VIS-*|MNT-PROD-VIS-*) return 0 ;;
    *) return 1 ;;
  esac
}

creative_rework_qa_hold_summary() {
  local queue="docs/strategy/creative-rework/QUEUE.md"
  if [ ! -f "$queue" ]; then
    return 1
  fi

  awk '
    /^### / {
      current=$0
      next
    }
    /^Status:[[:space:]]*generated_hold_for_visual_qa/ {
      print current " -> " $0
    }
  ' "$queue"
}

creative_rework_has_qa_hold() {
  local summary
  summary="$(creative_rework_qa_hold_summary || true)"
  [ -n "$summary" ]
}

cleanup_flow_mcp_processes() {
  local matched

  matched="$(pgrep -af 'chrome-devtools-mcp|playwright-mcp|@playwright/mcp' 2>/dev/null || true)"
  if [ -n "$matched" ]; then
    printf '%s\n' "$matched" > "$LOG_DIR/flow-forbidden-mcp-$TS.txt" 2>/dev/null || true
    pkill -f 'chrome-devtools-mcp' 2>/dev/null || true
    pkill -f 'playwright-mcp' 2>/dev/null || true
    pkill -f '@playwright/mcp' 2>/dev/null || true
    echo "[$TS] guard: removed forbidden Flow MCP processes before flow-safe iteration; see $LOG_DIR/flow-forbidden-mcp-$TS.txt" >> "$LOG_DIR/runner.log"
  fi
}

install_flow_safe_bin_guard() {
  local guard_dir="$LOG_DIR/flow-safe-bin"

  mkdir -p "$guard_dir"
  cat > "$guard_dir/npm" <<'FLOW_SAFE_NPM_GUARD'
#!/usr/bin/env bash
set -euo pipefail

args=" $* "
if [[ "$args" == *" chrome-devtools-mcp"* ]] || [[ "$args" == *" playwright-mcp"* ]] || [[ "$args" == *" @playwright/mcp"* ]]; then
  {
    printf '[%s] blocked npm %s\n' "$(date +%Y%m%d-%H%M%S)" "$*"
  } >> "${CODEX_FLOW_SAFE_MCP_BLOCK_LOG:-/tmp/montelar-codex-logs/flow-mcp-blocked.log}" 2>/dev/null || true
  echo "flow-safe guard: forbidden MCP startup blocked: npm $*" >&2
  exit 127
fi

exec /usr/bin/npm "$@"
FLOW_SAFE_NPM_GUARD

  cat > "$guard_dir/npx" <<'FLOW_SAFE_NPX_GUARD'
#!/usr/bin/env bash
set -euo pipefail

args=" $* "
if [[ "$args" == *" chrome-devtools-mcp"* ]] || [[ "$args" == *" playwright-mcp"* ]] || [[ "$args" == *" @playwright/mcp"* ]]; then
  {
    printf '[%s] blocked npx %s\n' "$(date +%Y%m%d-%H%M%S)" "$*"
  } >> "${CODEX_FLOW_SAFE_MCP_BLOCK_LOG:-/tmp/montelar-codex-logs/flow-mcp-blocked.log}" 2>/dev/null || true
  echo "flow-safe guard: forbidden MCP startup blocked: npx $*" >&2
  exit 127
fi

exec /usr/bin/npx "$@"
FLOW_SAFE_NPX_GUARD

  chmod +x "$guard_dir/npm" "$guard_dir/npx"
  printf '%s\n' "$guard_dir"
}

is_admin_bff_block_closer() {
  case "$1" in
    MNT-ADMIN-BFF-003|MNT-ADMIN-BFF-006|MNT-ADMIN-BFF-010|MNT-ADMIN-BFF-015|MNT-ADMIN-BFF-016) return 0 ;;
    *) return 1 ;;
  esac
}

admin_bff_forbidden_commit_paths() {
  local before="$1"
  local after="$2"

  if [ -z "$before" ] || [ -z "$after" ] || [ "$before" = "$after" ] || [ "$before" = "none" ] || [ "$after" = "none" ]; then
    return 0
  fi

  git diff --name-only "$before" "$after" -- 2>/dev/null \
    | awk '
      /^apps\/admin\// { next }
      /^docs\/tasks\// { next }
      /^docs\/strategy\// { next }
      /^docs\/AUDIT_LOG\.md$/ { next }
      /^docs\/DAILY_REPORT\.md$/ { next }
      /^docs\/BLOCKERS\.md$/ { next }
      { print }
    '
}

unexpected_worktree_status_diff() {
  local before_status="$1"
  local after_status="$2"
  local before_head="$3"
  local after_head="$4"
  local committed_paths
  local before_untracked_dirs

  committed_paths="$(mktemp)"
  before_untracked_dirs="$(mktemp)"
  if [ -n "$before_head" ] && [ -n "$after_head" ] && [ "$before_head" != "$after_head" ] && [ "$before_head" != "none" ] && [ "$after_head" != "none" ]; then
    git diff --name-only "$before_head" "$after_head" -- > "$committed_paths" 2>/dev/null || true
  else
    : > "$committed_paths"
  fi

  awk '
    /^\?\? / {
      path = substr($0, 4)
      if (path ~ /\/$/) print path
    }
  ' "$before_status" > "$before_untracked_dirs" 2>/dev/null || true

  diff -u "$before_status" "$after_status" 2>/dev/null \
    | awk -v committed="$committed_paths" -v before_dirs="$before_untracked_dirs" '
      BEGIN {
        while ((getline path < committed) > 0) {
          committed_paths[path] = 1
        }
        while ((getline dir < before_dirs) > 0) {
          before_untracked_dirs[dir] = 1
        }
      }
      function inside_preexisting_untracked_dir(path, dir) {
        for (dir in before_untracked_dirs) {
          if (index(path, dir) == 1) return 1
        }
        return 0
      }
      /^--- / || /^\+\+\+ / || /^@@/ { next }
      /^-/ {
        path = substr($0, 5)
        if (committed_paths[path]) { next }
        if (inside_preexisting_untracked_dir(path)) { next }
        print
        next
      }
      /^\+/ {
        path = substr($0, 5)
        if (committed_paths[path]) { next }
        if (inside_preexisting_untracked_dir(path)) { next }
        print
        next
      }
    '

  rm -f "$committed_paths" "$before_untracked_dirs"
}

latest_review_artifact() {
  local task_id="$1"
  local verdict="$2"
  local marker="$3"
  local self_review_exclusion=()

  if [ "$verdict" = "PASS" ]; then
    self_review_exclusion=( ! -name "${task_id}-*-SELF-REVIEW-PASS.md" )
  fi

  find docs/strategy/artifacts/autonomous-review \
    -type f \
    -name "${task_id}-*-${verdict}.md" \
    "${self_review_exclusion[@]}" \
    -newer "$marker" \
    -printf '%T@ %p\n' 2>/dev/null \
    | sort -n \
    | tail -1 \
    | cut -d' ' -f2-
}

has_review_pass_artifact() {
  local task_id="$1"
  local artifact

  artifact="$(find docs/strategy/artifacts/autonomous-review \
    -type f \
    -name "${task_id}-*-PASS.md" \
    ! -name "${task_id}-*-SELF-REVIEW-PASS.md" \
    -print -quit 2>/dev/null)"

  [ -n "$artifact" ]
}

has_review_accept_commit() {
  local task_id="$1"
  local subjects

  subjects="$(git log --format=%s -n 80 -- 2>/dev/null)"
  grep -Fxq "review: accept $task_id" <<< "$subjects"
}

task_dependency_id() {
  local task_id="$1"

  awk -F'|' -v wanted="$task_id" '
    $0 ~ /^\| MNT-/ {
      id=$2; dep=$5;
      gsub(/^ +| +$/, "", id);
      gsub(/^ +| +$/, "", dep);
      if (id == wanted) { print dep; exit }
    }
  ' docs/tasks/INDEX.md
}

task_status_by_id() {
  local task_id="$1"

  awk -F'|' -v wanted="$task_id" '
    function trim(s) {
      gsub(/^ +| +$/, "", s);
      return s;
    }
    $0 ~ /^\| MNT-/ {
      id=trim($2);
      status=trim($3);
      if (id == wanted) { print status; exit }
    }
  ' docs/tasks/INDEX.md
}

assert_admin_bff_dependency_reviewed() {
  local task_id="$1"
  local dep

  if ! is_admin_bff_task "$task_id"; then
    return 0
  fi

  dep="$(task_dependency_id "$task_id")"
  if ! is_admin_bff_task "$dep"; then
    return 0
  fi

  if has_review_pass_artifact "$dep" && has_review_accept_commit "$dep"; then
    return 0
  fi

  echo "admin BFF dependency $dep has no committed external review accept; refusing to start $task_id"
  return 1
}

is_fast_skeleton_task() {
  case "$1" in
    MNT-PROD-019|MNT-PROD-02[1-9]|MNT-PROD-030) return 0 ;;
    *) return 1 ;;
  esac
}

PROMPT="Ты — автономный CTO Montelar. Работай автономно, качественно и экономно по токенам.

Проект: /root/montelar. Не трогай BitComp и /root/bitcomp-b2b-platform.

Обязательные skills/рабочие принципы:
- используй skill/workflow codex-autonomous-loop для очереди, логов, коммитов и статусов;
- для всех публичных визуальных/frontend задач используй skill/workflow montelar-lux-visual-engineering и контракт docs/strategy/15-lux-visual-engineering-contract.md; слабый scaffold/card/pill дизайн, отсутствие CSS-системы, эффектов, open-state screenshots или результата хуже root HTML baseline запрещают закрывать задачу;
- для крупных visual задач используй Montelar AI design contour: Codex отвечает за код/git/проверки; Stitch — только screen concepts; Google Flow — основной браузерный контур для Nano Banana stills и Veo/video work, когда задача явно разрешает generation; Gemini не является default generation pipeline и используется только для отдельного analysis/vision audit, если задача явно просит; ChatGPT Canvas/Codex Cloud — опциональный concept/review input при доступности; Playwright/Chrome screenshots/video — источник истины. Нельзя писать, что AI design использован, если нет сохраненного prompt/output или скриншота результата;
- для крупных visual задач используй Dribbble как pattern-mining source: 8-12 релевантных references, краткая таблица composition/palette/type/menu/motion/product-storytelling/anti-patterns, затем только Montelar-specific implementation. Не копируй shots, цвета, чужой brand identity, product imagery или generic SaaS tropes;
- MNT-LUX visual tasks are implementation tasks, not analysis-only tasks. If a Dribbble/reference table already exists, use it as input and move quickly into concrete React/CSS changes, screenshots, deploy and commit. Do not spend an iteration only rereading old briefs unless a blocker is recorded.
- for major visual tasks, pass through a reference-to-code gate before broad edits: 3-5 concrete references per surface, extracted mechanic, Montelar adaptation, exact React/CSS hook, and verification evidence. Dribbble alone is not enough for motion; use Framer/Awwwards/GSAP/CodePen/Rive/Lottie-style motion references or saved videos/traces for animation work. Do not repeat the rejected MNT-LUX-002 rail/list reshuffle.
- для visual/browser/Flow/Stitch задач используй workflow references bitcomp-frontend-vision-stack, bitcomp-gemini-visual-orchestrator и stitch-design-workflow, адаптируя их под Montelar;
- качество важнее скорости, но логи должны быть короткими;
- не печатай большие diff, большие фрагменты INDEX.md, длинные исходники или research dumps в stdout;
- пиши подробности в документы/artifacts, а в лог — краткий статус, измененные файлы, проверки и результат.
- старый HTML в корне проекта — не production runtime, но это минимальная утвержденная визуальная база и ДНК бренда. Не обслуживай и не развивай root HTML как продуктовый код; переноси его визуальную ДНК в Next.js app: темный premium canvas, компактная fixed-шапка бренда, спокойная Kharma-like навигационная механика, serif display scale, gold/beige accent, спокойные отступы, слоган и концепция Montelar. Не копируй HTML слепо и не зажимай творчество: новый вариант может и должен быть сильнее прототипа, если он премиальнее, спокойнее, точнее для Montelar и это видно на скриншотах.
- не придумывай Gemini/Flow endpoints/API под генерацию визуалов. Creative stack описывай по реальным ролям и доступам: Google Flow — рабочая браузерная поверхность для Nano Banana still visuals и Veo video/motion, когда задача явно требует generated assets; Gemini не default generation pipeline, только explicit separate analysis/vision audit; Stitch — UI/design screens; Codex/local shell — extraction, frame cleanup, WebP/canvas implementation and QA. Если доступ/API не проверен, фиксируй как tooling dependency, не пиши фейковый integration code.
- Google Flow separation rule: не путай Flow/Veo/Nano Banana с обычной frontend задачей. Для Flow-задач сначала открой/используй существующий залогиненный shared Chrome/noVNC профиль, зафиксируй входной файл, prompt, candidate, выбранный output, artifact paths и cleanup. Не пиши пароли в repo/log/tasks. Если generation не входит в acceptance текущей задачи, Flow не открывай.
- когда в research задачах посещаешь сайты конкурентов/референсов, скачивай полезные презентационные, product-card, product-detail и интерьерные/context изображения в банк идей: docs/strategy/artifacts/idea-bank/. Используй scripts/idea-bank-fetch-images.py когда применимо. Всегда сохраняй source metadata. Эти файлы только reference-only, не production assets.
- Product depth correction от owner: не закапывайся в финальную проработку каждого продукта до того, как есть сайт, CMS/admin и шаблоны страниц. Заверши текущую in_progress product task, затем оставшиеся индивидуальные product tasks делай как compact skeleton specs: name, role, category, page sections, inquiry form, CMS fields, visual/reference notes, owner-open decisions. Не трать длинные итерации на финальные engineering details, точные specs, цены, финальный copywriting или exhaustive passports без явного owner checkpoint. Как только skeletons достаточно для navigation, PDP templates, forms and CMS schemas, ускоряй переход к Next.js foundation, CMS/admin, multilingual content model, preview deploy and visual implementation.
- Product skeleton speed lane: индивидуальные product skeleton tasks должны закрываться быстро. Для них запрещены web research, idea-bank downloads, image fetching, helper agents, broad artifact rereads и длинные reasoning loops, если нет конкретного blocker. Используй уже готовую strategy artifact как source of truth, держи artifact компактным, и когда зависимости позволяют, закрывай несколько sibling skeleton tasks за одну autonomous iteration. В очереди все равно держи максимум одну in_progress task одновременно, но можешь последовательно закрыть несколько sibling tasks в одном запуске. Docs verification можно запускать один раз на batch, если scope docs-only и безопасен. Commit делай понятным: per task или compact batch commit для последовательных docs-only skeletons.
- Profile router rule: для docs/product/CMS/web/code задач не требуй браузерные/MCP инструменты без явной необходимости. Тяжелые visual/browser/Stitch/Chrome/Playwright режимы нужны только для creative/visual/browser задач. Если текущий профиль docs/code, работай обычными shell/git/file commands и не блокируйся на отсутствии MCP.
- Admin UX correction rule: для задач MNT-ADMIN-UX текущая plug-and-play админка считается недостаточной. Используй docs/strategy/artifacts/MNT-ADMIN-UX-001-owner-admin-scope.md как обязательный source of truth. Делай админку как понятный Webasyst-like owner console: первый слой для хозяина/менеджера по страницам и задачам, второй слой для простых site-admin настроек, третий слой оставь на базе текущей Payload/raw админки, но только через раздел Расширенные. Нельзя закрывать UX-задачу, если первый слой выглядит как Payload collection browser, содержит непонятные кнопки или требует объяснений разработчика.
- Admin UXR rejection correction rule: для задач MNT-ADMIN-UXR обязательно используй docs/strategy/artifacts/MNT-ADMIN-UXR-owner-admin-redesign-tz.md и уже снятый пакет docs/strategy/artifacts/admin-reference-pack/REFERENCE_NOTES.md. Это не polish и не добавление очередных карточек. Нужно заменить interaction model первого слоя админки: единый admin shell, left nav, top bar, main work area, right inspector, page/tree/list/detail workflows, click-path evidence, screenshots before/after/mobile, text snapshot forbidden terms. Перед кодом обязательно открыть и разобрать captured HTML/PNG/JSON референсы: Webasyst live Shop-Script pack, Metronic Tailwind Next.js authenticated pack, Limitless live HTML pack. Нельзя закрывать задачу, если остались service-console wall, дубли быстрых действий, raw/Payload/record/schema/route/template vocabulary в первом слое или если нормальный владелец не понимает путь click -> edit -> preview -> publish.
- Admin UI foundation rule: в apps/admin установлены Mantine, TanStack Table, Radix primitives, lucide-react, cva/clsx/tailwind-merge и motion. Для admin/workbench UI задач используй эту основу как production UI toolkit: Mantine для форм/модалок/dropzone/notifications, TanStack Table для реальных списков, Radix для доступных low-level primitives, lucide для иконок, motion только для спокойных переходов. Нельзя закрывать UI-задачу, если вместо нормальных controls снова собраны самописные fake-select/fake-modal/card-wall/pлашки без documented reason. В task evidence запиши component-foundation note: что использовано или почему не использовано.
- Self-runner rule: если ты запущен как дочерний codex exec внутри montelar-codex-autonomous.service, не останавливай этот service из-за того, что он active. Это твой собственный runner. Останавливать service можно только при явном внешнем ручном вмешательстве или явном owner request.
- Dirty-worktree rule: в проекте может быть заранее грязный worktree с ручными визуальными правками owner-approved baseline. Перед задачей зафиксируй git status --short; меняй только scope текущей задачи; stage/commit только файлы, которые относятся к текущей задаче и которые ты сам изменил в этой итерации. Не добавляй в commit старые screenshots/artifacts/build logs/caches и не делай broad git add dot.
- Admin BFF public-site protection: для задач MNT-ADMIN-BFF-* публичный сайт является read-only. Не редактируй apps/web, apps/web/public, public web components, homepage, header, CSS, web package files или web runtime scripts. Разрешены только read-only public smoke/checks. Если BFF-задача требует preview/revalidation, проверяй сайт без изменения файлов. Любая правка apps/web в BFF-задаче считается regression risk и должна быть вынесена в отдельную явно согласованную web task. Если BFF acceptance объективно заблокирован public runtime проблемой, разрешено создать отдельный минимальный MNT-WEB-* support task/commit, доказать clean public runtime проверками и затем вернуться к BFF task. Такой support commit должен быть явно указан в BFF task evidence и reviewer artifact.
- Admin BFF write-scope rule: для задач MNT-ADMIN-BFF-* разрешенные write paths: apps/admin/**, docs/tasks/**, docs/strategy/**, docs/AUDIT_LOG.md, docs/DAILY_REPORT.md, docs/BLOCKERS.md. Любой другой committed path запрещен внутри BFF closure commit. Если нужен другой path, оформи отдельный support task/commit с другим ID и докажи его проверки; reviewer решает, достаточно ли это для продолжения BFF queue.
- Admin BFF executor self-review gate: перед тем как помечать MNT-ADMIN-BFF-* task как done и делать commit, сделай отдельный self-review pass как строгий внутренний ревизор. Не закрывай задачу по списку замечаний. Найди класс дефекта, закрой класс дефекта и докажи это проверкой. Для каждого reviewer FAIL открой самый свежий FAIL artifact, выпиши все exact files/functions/routes, затем расширь поиск на соседние генераторы snapshots/components/API/smoke, которые могут породить тот же дефект. Если reviewer нашел false-green smoke, сначала расширь smoke/scan так, чтобы он падал на найденном классе дефекта, потом исправляй код. В отчете task обязательно запиши раздел Self-review evidence: latest FAIL addressed, class-wide rg/scan commands, files intentionally allowed/forbidden, smoke/typecheck results.
- Admin BFF anti-green rule: зеленый smoke не является доказательством, если предыдущий reviewer FAIL показал, что этот smoke был слишком узким. После такого FAIL следующая попытка обязана расширить scanner на весь owner/editor/BFF source surface, а не только на последние названные файлы. Для raw-layer задач прямые \`/admin/collections\` в owner/editor flow запрещены даже если они приходят из payload snapshot builder, editor helper или React component. Разрешенный raw layer должен быть только явным developer/advanced handoff. Для raw-layer/self-review запускай \`bash scripts/admin-bff-self-review-scan.sh\` и сохраняй результат в task evidence; если он падает, task нельзя закрывать.
- Site visual modernization rule: для MNT-SITE-VIS-* задач сначала соблюдай rebuilt plan \`docs/strategy/artifacts/visual-modernization-2026-05-21/MNT-SITE-VIS-rebuilt-autonomous-plan.md\`. Старый MNT-SITE-VIS-017 rejected/deferred не возобновлять. New Flow/Nano/Veo product-motion work начинается только через MNT-SITE-VIS-018 contract and later prototype tasks. Production homepage/header/mobile menu защищены; high-risk changes only through prototype/flag/rollback.
- Production visual sprint rule: для MNT-PROD-VIS-* задач это implementation sprint, а не план/инвентаризация. Нельзя закрывать task документами, словесным "подготовлено", статичным poster-only proof или переносом старых артефактов. До done должны быть реальные изменения production public web code/assets, минимум один видимый preview route, before/after screenshots, browser video для motion, reduced-motion/performance notes, commit и smoke. Если git diff не затрагивает apps/web/**, apps/web/public/** или production visual CSS/components, task нельзя считать done, кроме MNT-PROD-VIS-001 baseline/preflight. Approved/usable source policy is docs/strategy/artifacts/production-visual-sprint-20260604/APPROVED_CREATIVE_SOURCE_POLICY.md. Current canonical owner-selected source pack is docs/strategy/artifacts/creative-rework/owner-selected-rework-source-pack-20260604 with MANIFEST.tsv, MANIFEST.json and files symlink folder. Use the manifest or find -L; plain find -type f on files is invalid because it contains symlinks. Count must be 77 manifest rows, 77 live symlinks, 0 broken symlinks. These files are owner-selected rework master sources, not final public-site approved creatives; use them as source-locked inputs for imagegen/recomposition/motion, then require evidence and approval registry before final rollout. Never treat /creative-pack/approved/ folder name as owner approval; never use hologram visuals in this sprint unless owner explicitly resumes holograms.
- Human-style visual QA rule: любая MNT-SITE-VIS implementation task, которая меняет видимый public UI, обязана перед закрытием пройти browser-тест как реальный пользователь: открыть страницы, прокликать/протыкать changed buttons/CTA/menu/language/product/category links/forms, проверить геометрию, crop, текст, overlap, анимации, hover/touch, smoothness, reduced-motion и общее premium quality. Для motion surfaces обязателен video artifact; screenshots alone are not enough.
- Site creative reviewer rule: в MNT-SITE-VIS creative задачах не жди ручного owner approval для каждой пачки. Исполнитель генерит, извлекает outputs, готовит evidence и отправляет meaningful batches в Telegram, но не утверждает сам себя. Ревьюер независимо решает по рубрике: contour-approved-for-prototype, needs-regeneration, reference-only, rejected. Продолжай downstream prototype work только с reviewer-granted contour-approved-for-prototype или явным fallback; мусор, source-incoherent mechanics, fantasy product parts и плохой crop ревьюер обязан отправить на regeneration.
- Flow artifact taxonomy rule: для MNT-SITE-VIS creative задач нельзя отправлять или утверждать сырой список картинок из Flow DOM. Flow UI часто смешивает новые outputs, загруженные source references, logo sources, старые generated media, failed remnants и duplicates. Каждый run обязан разложить файлы по папкам 00-browser-evidence, 01-source-uploads, 02-current-generated-candidates, 03-current-rejected, 04-old-or-cross-task-media, 05-contact-sheets, 06-review-handoff. Обязательный baseline для diff — состояние после uploads/prompt-ready, но до Create. Используй scripts/flow-systematize-media.py или более строгий эквивалент. В Telegram primary review отправляй только contact sheet из 02-current-generated-candidates. Если там 0 файлов, это rework/no-current-output, а не новые креативы. Mixed archive/source/logo/old-media как новые креативы = FAIL и rework.
- Flow per-pass folder discipline: после systematize текущая рабочая поверхность для executor/reviewer/Telegram только 07-review-package-current-only. Не просматривай extracted-generated как креативный сет; это raw DOM dump для отладки. Не трать итерацию на визуальный разбор 01-source-uploads или 04-old-or-cross-task-media, кроме forensic/debug. Если 07-review-package-current-only пустой, это rework/no-current-output. Owner Telegram review должен брать contact sheet и individual current files из 07-review-package-current-only, а не all-media dump.
- Flow Telegram full-current handoff rule: если 07-review-package-current-only не пустой, executor обязан сразу отправить в Telegram не только лучший файл, а весь current-only review pack: короткий статус с family/product/run, contact sheet, каждый current generated candidate отдельным файлом/фото и все подготовленные 2K review candidates из 06-review-handoff/2k-review-candidates. Запиши все message_id в run-report, production handoff и task evidence. Частичная отправка только contact sheet + один chosen candidate допустима лишь если остальные current candidates явно помечены как rejected в этом же run-report с причиной; иначе reviewer ставит rework за incomplete owner handoff.
- Flow product folder discipline: каждый creative run обязан относиться к одному family-key и одному product-key. После scripts/flow-systematize-media.py передавай --family-key и --product-key, чтобы появился product-review-packages/<family>/<product>/<run-name>/ с current-only файлами. Для ревью и Telegram используй product-review-packages, а не плоский список flow-runs. Mixed family/product batch = FAIL.
- Fresh creative generation rule: для MNT-SITE-VIS-021A и любых MNT-SITE-VIS creative generation задач старые flow-runs, incomplete old flow-runs и старые Telegram ids являются только историей. Нельзя тратить итерацию только на переупаковку, повторную классификацию, продолжение старого run или повторную отправку старых run как результат. Прогрессом считается только новый timestamped Flow/Nano/Veo run, созданный после старта текущей итерации, с pre-create baseline, post-create scan, scripts/flow-systematize-media.py и новыми Telegram ids для непустой папки 02-current-generated-candidates. Если папка current candidates пустая, запиши rework/no-current-output и делай retry/fallback, а не отправляй старые медиа.
- Flow browser operator rule: Flow должен работать как одна человеческая noVNC/Chrome-сессия montelar-flow-browser.service, а не как пачка автоматизированных вкладок. Не запускай параллельные Flow scripts, Playwright MCP, Chrome DevTools MCP или второй browser context для генерации. Не кликай Create через blind DOM automation; перед каждым действием должна быть видимая UI-проверка. Если Flow показал unusual activity/Application error/repeated Failed, не заканчивай итерацию статусным сообщением владельцу. Запусти recovery ladder внутри той же задачи: сохрани evidence, проверь что нет лишних browser/MCP процессов, оставь одну Flow-сессию, обнови/открой чистый composer в том же профиле, сделай короткий cooldown, затем один чистый retry с новым timestamped run. Если retry снова не дал current-only output, зафиксируй rework/no-current-output и продолжай полезную работу внутри MNT-SITE-VIS-021A: подготовь следующий product/family source-locked prompt pack, reference/contact sheet, product-essence notes или alternate explicit fallback slot. Для MNT-SITE-VIS-021R owner-facing status обязателен на старт request, Flow retry и blocker/retry-needed; статус должен быть текстом без невалидных картинок.
- Flow source attachment gate: папка \`01-source-uploads\` сама по себе не доказывает, что исходники прикреплены к Flow prompt. Перед Create обязательно сохрани visible evidence, где в composer/upload area видны все expected source filenames или один явно собранный \`source-contact-sheet/reference-board\` с нужными референсами. Не используй \`setInputFiles([...])\` вслепую: если Flow UI принимает только один файл или показывает только последний файл, собери единый reference board/contact sheet с продуктовой физикой, кадрами, логотипом и подписью family/product, прикрепи именно его, затем проверь visible text/screenshot. Если before-create evidence не показывает реальные attachments, run считается \`rework/source-not-attached\`; current candidates нельзя отправлять как валидные, кроме forensic/debug с явной пометкой.
- Flow speed rule: не делай фиксированный polling 7x30 или 8x30 после Create. Используй adaptive polling: первая проверка через 45-60 секунд, затем каждые 10-15 секунд, прекращай ожидание сразу после появления новых current media или явного Failed/unusual activity. Hard cap ожидания без видимого прогресса 180 секунд. Если current-only pack непустой, сначала отправь owner-facing Telegram пакет креативов, затем дописывай длинные reports/evidence.
- Product essence gate: перед каждой Flow/Nano/Veo генерацией сначала зафиксируй product essence, mechanism class, visible product truth, final composition/use-case scene, forbidden substitution и allowed premiumization. Для web-context/category/PDP/homepage не генерируй изолированный объект: нужна итоговая композиция, где понятна установка и применение продукта. Гибкий/прозрачный дисплей не превращать в монитор/TV/tablet/portal; голограмму не превращать в free-air magic без физического устройства; embedded display не превращать в бытовой TV или controller box; Vision MAX не превращать в standalone screen. Если prompt не содержит сути продукта, механики и use-case композиции, перепиши prompt до Create.
- Montelar logo replacement rule: если generated creative содержит чужие надписи, Avito/source marks, competitor/fake logos, watermark-like text, pseudo-letters или любые non-Montelar labels, это не успешная регенерация. Это касается всех приборов/корпусов: усилки, источники, проекторы, колонки, сетевые фильтры, кабели/коннекторы, голограммные устройства, витрины, экраны, панели, пьедесталы. Если текст/логотип не нужен поверхности, перегенерируй с no text/no logo/no watermark/no labels. Если бренд физически нужен на экране/панели/canvas/product face/device корпусе, прикладывай one-line Montelar logo source apps/web/public/images/brand/montelar-wordmark-gold-20260515.png или fallback /opt/codex-telegram-agent/data/MONTELAR_Монтажная_область_4_копия_5_3.png и требуй заменить все visible foreign/source text на attached Montelar wordmark only, сохранив geometry/material/crop. На приборах логотип должен выглядеть как реальная маленькая печать/гравировка/шильдик на поверхности, а не floating overlay. Не утверждай такие outputs без 100 percent visual inspection.
- Telegram env rule: не делай shell source для /opt/codex-telegram-agent/.env; этот файл содержит аргументы, не безопасные для shell source. Для отправки в Telegram читай TELEGRAM_BOT_TOKEN и ALLOWED_CHAT_ID парсером key=value в Python/Node или используй существующие helper scripts.
- Telegram dialogue rule: для owner-facing contact sheets, current generated files, 2K review files, коротких вопросов и действий, где реально нужен владелец, используй python3 scripts/telegram-send.py --text ..., --photo ... или --document .... Все owner-facing Telegram-сообщения по Montelar должны быть на русском; английский допустим только внутри Flow prompt, технических evidence-файлов и внутренних отчетов. После отправки записывай message_id в task evidence. Ответы владельца в Telegram попадают в docs/strategy/OWNER_FEEDBACK_LIVE.md; перед каждым новым creative/reviewer шагом перечитывай этот файл и применяй свежие комментарии. Если Flow/Nano/Veo не дал current-only output, не спамь владельца статусом не-получилось/жду, пока есть автономные recovery/fallback шаги внутри задачи. Исключение: для MNT-SITE-VIS-021R отправляй короткие статусные Telegram-сообщения на старт request, retry/blocker и clean handoff, потому что owner выбирает доработки и должен видеть ход очереди; такие сообщения не являются owner-review output и не должны содержать невалидные картинки. Для creative пакетов не ограничивайся одним selected candidate: владелец должен получить полный current-only пакет или явный список rejected current candidates с причинами.

Сначала прочитай только короткий рабочий контекст:
1. docs/CODEX_CHARTER.md
2. docs/CEO_NOTES.md
3. docs/strategy/OWNER_FEEDBACK_LIVE.md
4. docs/BLOCKERS.md
5. docs/strategy/06-owner-decisions.md
6. docs/strategy/07-git-deploy-rules.md
7. docs/tasks/INDEX.md
8. active task file из docs/tasks/ если он есть

Live owner feedback rule:
- docs/strategy/OWNER_FEEDBACK_LIVE.md — обязательный мост текущих комментариев владельца в автономный контур. Если в нем есть open correction для текущей задачи, сначала применяй ее, ссылайся на конкретные файлы/креативы/Telegram ids/run folders и фиксируй выполнение в task evidence. Не продолжай downstream-задачи, если live feedback явно отверг текущий output.

Большие SPEC/research файлы читай только когда текущая задача требует:
- docs/strategy/08-full-product-spec.md
- docs/strategy/09-data-admin-spec.md
- docs/strategy/10-technical-architecture.md
- docs/strategy/11-gemini-creative-spec.md
- docs/strategy/13-visual-redesign-brief.md

Если есть in_progress задача — сначала продолжи и закрой ее. Если in_progress нет — выбери первый pending task с выполненными depends-on, переведи в in_progress и выполни полностью.

Workflow задачи:
1. targeted discovery через rg/sed/git status;
2. меняй только scope текущей задачи;
3. запускай минимальный verification profile;
4. используй scripts/deploy-if-dirty.sh, если task требует deploy/runtime update;
5. docs-only задачи не build/deploy;
6. commit обязателен после каждой завершенной задачи;
7. обнови docs/tasks/INDEX.md, task file, DAILY_REPORT.md и AUDIT_LOG.md;
8. для MNT-SITE-VIS задач не ставь blocked: возвращай task в pending/rework и переделывай до PASS. Даже внешний сбой Flow/Stitch/browser не должен останавливать весь контур: архивируй evidence, делай cooldown/retry/recovery, готовь source-locked prompt packs/reference boards/fallback artifacts и продолжай полезную работу в рамках задачи без утверждения мусора.

Гигиена логов:
- показывай только текущую строку task, git diff --stat, git diff --name-only и краткий итог;
- полный diff выводи только при ошибке или когда без него нельзя принять решение;
- research summaries сохраняй в docs/strategy/artifacts или docs/research, не в stdout.

Sub-agents/помощники:
- используй 1-2 helper agents в задачах, где это реально ускоряет работу без потери качества: product specs, competitor validation, CMS/form checklist, naming/conflict review, visual reference synthesis;
- для продуктовой линейки можно параллелить только независимые sidecar-части: один helper собирает/проверяет референсы и guardrails, второй готовит черновую структуру или соседний продуктовый draft; основной Codex сводит результат, вычищает стиль, проверяет зависимости и сам коммитит;
- helper agents не владеют очередью и не меняют docs/tasks/INDEX.md, docs/DAILY_REPORT.md, docs/AUDIT_LOG.md, service/scripts, package/deploy files или общие контракты без явного решения основного Codex;
- если helper пишет файл, он должен быть в уникальном scope текущей задачи или черновиком под docs/strategy/artifacts/; основной Codex обязан проверить и нормализовать его перед commit;
- не запускать helper agents ради формальности: если задача маленькая или общий контекст важнее параллельности, работай одним основным Codex;
- при конфликте, росте токенов или сомнительном качестве helper-результата прекращай параллельность и закрывай задачу основным Codex;
- основной Codex всегда владеет task, интеграцией, проверками, commit, отчетом и deploy decision;
- не плодить параллельные мусорные задачи.

Git/deploy:
- не коммить .env, tokens, node_modules, build artifacts, logs, caches;
- не запускать full deploy без причины;
- деплоить только измененный слой согласно docs/strategy/07-git-deploy-rules.md;
- Web preview artifact rule: не запускай сырой \`npm run build\` / \`npm --workspace @montelar/web run build\` как простую проверку, пока \`montelar-preview.service\` обслуживает этот worktree. Next.js перезаписывает \`apps/web/.next/static/chunks\`, и живой \`next start\` начинает отдавать HTML со ссылками на исчезнувшие chunks. Для verification используй \`npm run build:verify\` или \`npm --workspace @montelar/web run build:verify\`, он пишет в \`.next-verify\`. Обычный \`npm run build\` допустим только как runtime rollout через \`scripts/deploy-if-dirty.sh\` с немедленным restart \`montelar-preview.service\` и smoke.
- в первых control-plane задачах обеспечить server preview, чтобы владелец видел изменения сразу;
- для текущего статического каркаса использовать montelar-preview.service и lightweight smoke, но не считать старый HTML целевым runtime;
- если deploy/check падает дважды — не продолжай вслепую, запиши blocker или откати только свои изменения.

Работай до завершения итерации. Не спрашивай подтверждений внутри автономной итерации, кроме случаев owner checkpoint из task явно требует ручного решения."

FAST_PROMPT="Ты — автономный Codex Montelar в fast-lane режиме для docs-only product skeleton задач.

Проект: /root/montelar. Не трогай BitComp.

Цель: быстро закрывать индивидуальные product skeleton tasks, сейчас это MNT-PROD-019 и MNT-PROD-021..MNT-PROD-030.

Жесткие ограничения скорости:
- не используй web research, browser tools, MCP, image fetching, idea-bank downloads, helper agents;
- не перечитывай большие strategy/spec файлы целиком;
- читай только docs/CEO_NOTES.md, docs/tasks/INDEX.md, active/current task file если есть, и один нужный source artifact: для amplifier skeleton docs/strategy/artifacts/MNT-PROD-014-amplifier-line-strategy.md, для cable skeleton docs/strategy/artifacts/MNT-PROD-020-prima-materia-strategy.md;
- previous sibling skeleton читай только если без него нельзя сохранить naming/style consistency;
- артефакт skeleton должен быть компактным: name, role, category, audience, page sections, inquiry form fields, CMS fields, visual/reference notes, owner-open decisions, handoff;
- не пиши финальные engineering specs, prices, long copy, measurements, supplier claims or exhaustive passport;
- закрывай 2-3 sibling skeleton tasks за один запуск, не больше. В INDEX держи максимум одну in_progress строку в момент редактирования, но внутри одной итерации можно перевести task в in_progress, создать compact files, отметить done, затем перейти к следующей sibling task;
- начинай с файловых изменений сразу после чтения source artifact; не делай длинный предварительный план в stdout;
- docs verification можно запустить один раз на batch: scripts/queue-check.sh и git diff --check -- docs;
- commit обязателен: один compact batch commit допустим для последовательных docs-only skeletons.

Workflow:
1. Определи первую pending/in_progress fast skeleton task из docs/tasks/INDEX.md.
2. Используй готовую strategy artifact как source of truth.
3. Закрой 2-3 соседних skeleton tasks без расширения scope.
4. Обнови task files, docs/tasks/INDEX.md, docs/DAILY_REPORT.md, docs/AUDIT_LOG.md.
5. Проверь docs и commit.
6. В stdout только короткий итог: tasks, files, checks, commit."

while true; do
  TS=$(date +%Y%m%d-%H%M%S)
  LOG_FILE="$LOG_DIR/autonomous-$TS.log"
  TASK_ID="$(next_task_id)"
  PROFILE="$(task_profile "$TASK_ID")"
  echo "[$TS] iteration start -> $LOG_FILE" >> "$LOG_DIR/runner.log"

  if [ -z "$TASK_ID" ]; then
    echo "[$TS] no runnable task found; stopping autonomous loop" >> "$LOG_DIR/runner.log"
    exit 0
  fi

  if [ -x "$RESOURCE_GUARD" ]; then
    if ! RESOURCE_GUARD_OUTPUT="$("$RESOURCE_GUARD" 2>&1)"; then
      echo "[$TS] guard: $RESOURCE_GUARD_OUTPUT; retrying after ${GUARD_RETRY_SEC}s without starting Codex" >> "$LOG_DIR/runner.log"
      sleep "$GUARD_RETRY_SEC"
      continue
    fi
    echo "[$TS] guard: $RESOURCE_GUARD_OUTPUT" >> "$LOG_DIR/runner.log"
  fi

  if [ -n "${CODEX_ONLY_TASK:-}" ] && [ "$TASK_ID" != "$CODEX_ONLY_TASK" ]; then
    echo "[$TS] guard: CODEX_ONLY_TASK=$CODEX_ONLY_TASK but next task is $TASK_ID; stopping before execution" >> "$LOG_DIR/runner.log"
    exit 0
  fi

  if ! ADMIN_BFF_DEP_REVIEW_MSG="$(assert_admin_bff_dependency_reviewed "$TASK_ID")"; then
    echo "[$TS] guard: $ADMIN_BFF_DEP_REVIEW_MSG; retrying after ${GUARD_RETRY_SEC}s instead of stopping loop" >> "$LOG_DIR/runner.log"
    sleep "$GUARD_RETRY_SEC"
    continue
  fi

  if [ "$TASK_ID" = "MNT-SITE-VIS-021R" ] && creative_rework_has_qa_hold; then
    HOLD_SUMMARY="$(creative_rework_qa_hold_summary | head -5 | tr '\n' '; ')"
    echo "[$TS] guard: MNT-SITE-VIS-021R has generated_hold_for_visual_qa; waiting for owner/operator decision before next creative. $HOLD_SUMMARY" >> "$LOG_DIR/runner.log"
    sleep "$GUARD_RETRY_SEC"
    continue
  fi

  if [ -x scripts/safe-git-pull.sh ]; then
    bash scripts/safe-git-pull.sh >> "$LOG_DIR/runner.log" 2>&1
  fi

  echo "[$TS] profile=$PROFILE task=$TASK_ID" >> "$LOG_DIR/runner.log"
  HEAD_BEFORE="$(git rev-parse HEAD 2>/dev/null || echo none)"
  STATUS_BEFORE="$LOG_DIR/status-before-$TS.txt"
  STATUS_AFTER="$LOG_DIR/status-after-$TS.txt"
  STATUS_DIFF="$LOG_DIR/status-diff-$TS.txt"
  WEB_TREE_BEFORE="$(web_tree_fingerprint)"
  git status --porcelain=v1 > "$STATUS_BEFORE" 2>/dev/null || true
  MAIN_MODEL="gpt-5.4"
  MAIN_REASONING_EFFORT="medium"
  export NEXT_TELEMETRY_DISABLED=1
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"
  export MONTELAR_QA_SCREENSHOT_MODE="${MONTELAR_QA_SCREENSHOT_MODE:-representative}"
  export MONTELAR_QA_MAX_SCREENSHOTS="${MONTELAR_QA_MAX_SCREENSHOTS:-80}"

  if is_admin_bff_task "$TASK_ID"; then
    MAIN_MODEL="${CODEX_ADMIN_BFF_MODEL:-gpt-5.5}"
    MAIN_REASONING_EFFORT="${CODEX_ADMIN_BFF_REASONING_EFFORT:-high}"
  fi

  if is_site_visual_task "$TASK_ID"; then
    MAIN_MODEL="${CODEX_SITE_VIS_MODEL:-gpt-5.5}"
    MAIN_REASONING_EFFORT="${CODEX_SITE_VIS_REASONING_EFFORT:-high}"
  fi

  case "$TASK_ID" in
    MNT-STANDALONE-*)
      MAIN_MODEL="${CODEX_SITE_VIS_MODEL:-gpt-5.5}"
      MAIN_REASONING_EFFORT="${CODEX_SITE_VIS_REASONING_EFFORT:-high}"
      ;;
  esac

  if [ "$PROFILE" = "flow-safe" ]; then
    cleanup_flow_mcp_processes
  fi

  if [ "$PROFILE" = "fast-skeleton" ]; then
    timeout --kill-after=30s "$MAIN_TIMEOUT_SEC" "$CODEX_CMD" exec \
      --ignore-user-config \
      --ephemeral \
      -m gpt-5.4-mini \
      -c 'model_reasoning_effort="low"' \
      --dangerously-bypass-approvals-and-sandbox \
      --skip-git-repo-check \
      "$FAST_PROMPT" \
      > "$LOG_FILE" 2>&1
  elif [ "$PROFILE" = "flow-safe" ]; then
    FLOW_SAFE_BIN="$(install_flow_safe_bin_guard)"
    CODEX_FLOW_SAFE_MCP_BLOCK_LOG="$LOG_DIR/flow-mcp-blocked-$TS.log" \
    PATH="$FLOW_SAFE_BIN:$PATH" \
      timeout --kill-after=30s "$MAIN_TIMEOUT_SEC" "$CODEX_CMD" exec \
        --ignore-user-config \
        --ephemeral \
        -m "$MAIN_MODEL" \
        -c "model_reasoning_effort=\"$MAIN_REASONING_EFFORT\"" \
        --dangerously-bypass-approvals-and-sandbox \
        --skip-git-repo-check \
        "$PROMPT" \
        > "$LOG_FILE" 2>&1
  elif [ "$PROFILE" = "visual-mcp" ]; then
    timeout --kill-after=30s "$MAIN_TIMEOUT_SEC" "$CODEX_CMD" exec \
      -m "$MAIN_MODEL" \
      -c "model_reasoning_effort=\"$MAIN_REASONING_EFFORT\"" \
      --dangerously-bypass-approvals-and-sandbox \
      --skip-git-repo-check \
      "$PROMPT" \
      > "$LOG_FILE" 2>&1
  elif [ "$PROFILE" = "docs" ]; then
    timeout --kill-after=30s "$MAIN_TIMEOUT_SEC" "$CODEX_CMD" exec \
      --ignore-user-config \
      --ephemeral \
      -m gpt-5.4 \
      -c 'model_reasoning_effort="low"' \
      --dangerously-bypass-approvals-and-sandbox \
      --skip-git-repo-check \
      "$PROMPT" \
      > "$LOG_FILE" 2>&1
  else
    timeout --kill-after=30s "$MAIN_TIMEOUT_SEC" "$CODEX_CMD" exec \
      --ignore-user-config \
      --ephemeral \
      -m "$MAIN_MODEL" \
      -c "model_reasoning_effort=\"$MAIN_REASONING_EFFORT\"" \
      --dangerously-bypass-approvals-and-sandbox \
      --skip-git-repo-check \
      "$PROMPT" \
      > "$LOG_FILE" 2>&1
  fi

  EXIT=$?
  TS_END=$(date +%Y%m%d-%H%M%S)
  HEAD_AFTER_MAIN="$(git rev-parse HEAD 2>/dev/null || echo none)"
  echo "[$TS_END] iteration end (exit=$EXIT), reviewer eligibility check next" >> "$LOG_DIR/runner.log"
  if [ "$PROFILE" = "flow-safe" ]; then
    cleanup_flow_mcp_processes
  fi

  if [ "$EXIT" -ne 0 ]; then
    if [ "$EXIT" -eq 124 ] || [ "$EXIT" -eq 137 ]; then
      echo "[$TS_END] guard: codex exec timed out for task=$TASK_ID after ${MAIN_TIMEOUT_SEC}s; retrying after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
    else
      echo "[$TS_END] guard: codex exec failed for task=$TASK_ID exit=$EXIT; retrying after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
    fi
    sleep "$GUARD_RETRY_SEC"
    continue
  fi

  if is_admin_bff_task "$TASK_ID"; then
    WEB_TREE_AFTER_MAIN="$(web_tree_fingerprint)"
    if [ "$WEB_TREE_BEFORE" != "$WEB_TREE_AFTER_MAIN" ]; then
      echo "[$TS_END] guard: apps/web changed during admin BFF task=$TASK_ID; deferring to reviewer instead of stopping loop" >> "$LOG_DIR/runner.log"
    fi

    FORBIDDEN_MAIN_PATHS="$(admin_bff_forbidden_commit_paths "$HEAD_BEFORE" "$HEAD_AFTER_MAIN")"
    if [ -n "$FORBIDDEN_MAIN_PATHS" ]; then
      printf '%s\n' "$FORBIDDEN_MAIN_PATHS" > "$LOG_DIR/forbidden-paths-$TS-$TASK_ID.txt"
      echo "[$TS_END] guard: forbidden committed paths during admin BFF task=$TASK_ID; see $LOG_DIR/forbidden-paths-$TS-$TASK_ID.txt; deferring to reviewer instead of stopping loop" >> "$LOG_DIR/runner.log"
    fi
  fi

  TASK_STATUS_AFTER_MAIN="$(task_status_by_id "$TASK_ID")"
  if [ "${CODEX_REVIEWER_ENABLED:-1}" != "0" ] && [ "$TASK_STATUS_AFTER_MAIN" != "done" ]; then
    echo "[$TS_END] reviewer skip task=$TASK_ID status=${TASK_STATUS_AFTER_MAIN:-unknown}; final review runs only after executor marks task done" >> "$LOG_DIR/runner.log"
  fi

  if [ "${CODEX_REVIEWER_ENABLED:-1}" != "0" ] && [ "$TASK_STATUS_AFTER_MAIN" = "done" ]; then
    REVIEW_LOG_FILE="$LOG_DIR/reviewer-$TS_END-$TASK_ID.log"
    REVIEW_MARKER="$LOG_DIR/review-marker-$TS_END-$TASK_ID"
    : > "$REVIEW_MARKER"
    REVIEW_PROMPT="$(
      printf 'Task ID: %s\nHead before main iteration: %s\nHead after main iteration: %s\nMain iteration log: %s\nReviewer timestamp: %s\n\n' \
        "$TASK_ID" "$HEAD_BEFORE" "$HEAD_AFTER_MAIN" "$LOG_FILE" "$TS_END"
      cat <<'REVIEW_PROMPT_BODY'
Ты — независимый автономный ревизор Montelar. Твоя роль: senior backend/product/QA engineer и строгий acceptance gate после основного автономного контура.

Важно:
- ты не основной исполнитель;
- не исправляй продуктовый код;
- не редактируй apps/admin, apps/web, packages, runtime scripts или CSS/React ради "починки";
- разрешено менять только docs/tasks/INDEX.md, текущий task file, docs/DAILY_REPORT.md, docs/AUDIT_LOG.md и свой review artifact;
- если задача плохая, не делай код сам: верни ее в pending/rework и напиши конкретный список переделок;
- если задача хорошая, напиши PASS review artifact и не трогай продуктовый код.

Обязательные источники:
1. docs/tasks/INDEX.md
2. active/current task file for Task ID
3. docs/strategy/OWNER_FEEDBACK_LIVE.md
4. docs/strategy/artifacts/MNT-ADMIN-BFF-000-full-plug-play-modernization-tz.md for BFF tasks
5. docs/strategy/artifacts/MNT-ADMIN-BFF-autonomous-roles-and-reviewer-charter.md
6. main iteration log path from context above
7. git diff/stat/log between Head before main iteration and Head after main iteration
8. changed files and verification outputs/artifacts referenced by the task

Проверь независимо:
- не осталось ли raw /admin/collections в owner flow, если task касается owner/admin first/second layer;
- есть ли в task/report/log явный executor self-review pass: свежий FAIL artifact прочитан, класс дефекта расширен на соседние sources, false-green smoke исправлен scanner-first, а не только закрыты перечисленные строки;
- для raw-layer задач есть ли успешный bash scripts/admin-bff-self-review-scan.sh или более строгая эквивалентная проверка с recorded output;
- есть ли реальные API-команды, если task обещает функциональность, а не только UI;
- если task MNT-ADMIN-BFF-*: apps/web и публичный сайт не изменялись внутри BFF closure commit; committed paths находятся только в allowed scope: apps/admin/**, docs/tasks/**, docs/strategy/**, docs/AUDIT_LOG.md, docs/DAILY_REPORT.md, docs/BLOCKERS.md; public smoke/checks были read-only. Исключение можно принять только если есть отдельный минимальный MNT-WEB-* support task/commit, он documented in task evidence, прошел свои проверки, а BFF closure commit сам не содержит apps/web/**;
- покрыты ли нужные senior-компетенции из charter для этой задачи: backend/BFF, data/schema, frontend layout, interaction UX, visual admin design, browser QA, release safety;
- не закрыта ли задача формально без выполнения acceptance;
- прошли ли заявленные browser/smoke/typecheck/scan проверки;
- если task backend/API: есть smoke evidence для каждой обещанной mutation/command group;
- если task менял UI: есть before screenshot, after desktop 1440, laptop 1366, tablet, mobile, browser click-path и reference-mechanics note;
- если task менял admin UI: есть component-foundation note по Mantine/TanStack/Radix/lucide/motion, и нет самописных weak controls/card-wall imitation без documented reason;
- если task MNT-SITE-VIS-* или MNT-PROD-VIS-*: она следует active task contract, не закрывается планом/инвентаризацией вместо production changes, не меняет production homepage/header/mobile menu без rollback evidence, использует Google Flow/Nano Banana/Veo только при explicit task scope and saved ledger, не публикует raw Pinterest/reference media, имеет reference-to-code mechanic note, browser screenshots/video for motion surfaces, reduced-motion/performance/Yandex risk notes, and no плашечная/card-wall imitation;
- если docs/strategy/OWNER_FEEDBACK_LIVE.md содержит open correction для task: main iteration прочитал ее, применил конкретные owner comments, сослался на точные файлы/креативы/Telegram ids/run folders и не продолжил downstream с отвергнутыми output;
- для MNT-SITE-VIS creative задач после каждого executor шага сверяй результат с последними owner comments, а не только со старым task text. FAIL, если исполнитель пропустил конкретику владельца: живопись внутри Pictorial, presentation screenshots для embedded displays, кабели целиком и без выдуманных разъемов, реальные Montelar logo sources, 2K long-edge quality, current-only product folders/Telegram handoff;
- для MNT-SITE-VIS creative задач проверь Telegram dialogue evidence: исполнитель отправлял meaningful statuses/contact sheets через scripts/telegram-send.py, записал message_id, а ответы владельца из OWNER_FEEDBACK_LIVE.md реально повлияли на следующий prompt/retry. Если контур молчал при no-output/failure или не записал message_id для отправленного owner-facing файла, это rework. Если non-empty 07-review-package-current-only был отправлен частично без явного rejected списка по неотправленным current candidates, это incomplete owner handoff и rework.
- если task MNT-SITE-VIS-* или MNT-PROD-VIS-* меняет видимый public UI: есть human-style browser QA evidence по геометрии, анимациям, кнопкам, ссылкам, меню, языкам, crop/text fit/overlap и overall premium quality; для motion surfaces есть видео, not just screenshots;
- если task MNT-SITE-VIS-* или MNT-PROD-VIS-* меняет copy: нет internal CMS/route/block labels, RU/EN quality checked first, all enabled locales have safe text/fallback and layout QA evidence;
- если task закрывает блок BFF-003/BFF-006/BFF-010/BFF-015/BFF-016: есть Block Gate section в PASS artifact;
- не получилась ли плашечная/card imitation, если task менял UI;
- не появились ли guest shell, forbidden пустые экраны или route dead ends;
- не были ли затронуты не относящиеся к задаче файлы;
- есть ли commit/result record после основной итерации.

Правило вердикта:
- PASS только если acceptance task file и TZ реально выполнены и есть проверяемые доказательства.
- FAIL, если есть сомнение по ключевому acceptance, task MNT-ADMIN-BFF изменил apps/web или committed path вне allowed scope без отдельного documented MNT-WEB-* support task/commit, не покрыта нужная senior-компетенция, нет проверок, нет реальных команд, остался raw owner path, задача закрыта словами, UI-task без скринов/click-path, API-task без smoke evidence, или block-closing task без Block Gate section.
- FAIL для MNT-SITE-VIS/MNT-PROD-VIS implementation task, если нет visible production/public web change, нет human-style browser QA, нет browser video для motion surface, нет reduced-motion fallback, нет Yandex/Chromium smoothness note, нет Flow ledger при AI generation, или production homepage/header/mobile menu changed without prototype/rollback evidence.
- FAIL, если после предыдущего reviewer FAIL исполнитель исправил только перечисленные файлы без class-wide scan/self-review evidence, или если smoke снова может быть false-green из-за узкого coverage.
- FAIL, если raw-layer task не запускал scripts/admin-bff-self-review-scan.sh и не доказал, что owner/site-admin/editor sources не содержат прямых /admin/collections.

Если FAIL:
0. Перед решением проверь предыдущие unresolved FAIL artifacts for this task. Если это повторный FAIL по тому же task/class, НЕ ставь MNT-SITE-VIS task в blocked. Усиль rework: назови класс дефекта, расширь acceptance/checks, потребуй deeper discovery/human browser QA/reference-to-code evidence и верни task в pending. Основной контур обязан переделывать до PASS. Даже реальный внешний стопор оформляй как retry/recovery/fallback внутри task, а не как остановку очереди.
1. Создай review artifact: docs/strategy/artifacts/autonomous-review/<TASK_ID>-<timestamp>-FAIL.md
2. В нем напиши:
   - verdict FAIL;
   - concrete failed acceptance items;
   - exact files/routes/functions/screens to revisit;
   - required checks before next PASS;
   - whether the previous code should be fixed forward or reverted by the main contour.
3. В docs/tasks/INDEX.md поставь task status pending.
4. В task file поставь Status: pending и добавь раздел "Reviewer Rework" с конкретными пунктами.
5. Append concise entry to docs/AUDIT_LOG.md and docs/DAILY_REPORT.md.
6. Commit only review/task/docs changes with message: review: request rework for <TASK_ID>
7. Финальная строка в stdout: REVIEW_VERDICT: FAIL

Если PASS:
1. Создай review artifact: docs/strategy/artifacts/autonomous-review/<TASK_ID>-<timestamp>-PASS.md
2. В нем напиши:
   - verdict PASS;
   - evidence reviewed;
   - checks verified;
   - residual risks if any.
3. Append concise entry to docs/AUDIT_LOG.md and docs/DAILY_REPORT.md.
4. Commit only review/docs changes with message: review: accept <TASK_ID>
5. Финальная строка в stdout: REVIEW_VERDICT: PASS

Перед завершением:
- git status --short должен быть чистым либо содержать только заранее существовавшие unrelated dirty files; не оставляй свои review edits unstaged/uncommitted;
- не печатай большой diff в stdout.
REVIEW_PROMPT_BODY
    )"

    REVIEWER_MODEL="${CODEX_REVIEWER_MODEL:-gpt-5.4}"
    REVIEWER_REASONING_EFFORT="${CODEX_REVIEWER_REASONING_EFFORT:-high}"
    if is_admin_bff_task "$TASK_ID"; then
      REVIEWER_MODEL="${CODEX_ADMIN_BFF_REVIEWER_MODEL:-gpt-5.5}"
      REVIEWER_REASONING_EFFORT="${CODEX_ADMIN_BFF_REVIEWER_REASONING_EFFORT:-high}"
    fi
    if is_site_visual_task "$TASK_ID"; then
      REVIEWER_MODEL="${CODEX_SITE_VIS_REVIEWER_MODEL:-gpt-5.5}"
      REVIEWER_REASONING_EFFORT="${CODEX_SITE_VIS_REVIEWER_REASONING_EFFORT:-high}"
    fi

    echo "[$TS_END] reviewer start task=$TASK_ID model=$REVIEWER_MODEL effort=$REVIEWER_REASONING_EFFORT -> $REVIEW_LOG_FILE" >> "$LOG_DIR/runner.log"
    timeout --kill-after=30s "$REVIEWER_TIMEOUT_SEC" "$CODEX_CMD" exec \
      --ignore-user-config \
      --ephemeral \
      -m "$REVIEWER_MODEL" \
      -c "model_reasoning_effort=\"$REVIEWER_REASONING_EFFORT\"" \
      --dangerously-bypass-approvals-and-sandbox \
      --skip-git-repo-check \
      "$REVIEW_PROMPT" \
      > "$REVIEW_LOG_FILE" 2>&1
    REVIEW_EXIT=$?
    TS_REVIEW_END=$(date +%Y%m%d-%H%M%S)
    echo "[$TS_REVIEW_END] reviewer end task=$TASK_ID exit=$REVIEW_EXIT" >> "$LOG_DIR/runner.log"

    if [ "$REVIEW_EXIT" -ne 0 ]; then
      if [ "$REVIEW_EXIT" -eq 124 ] || [ "$REVIEW_EXIT" -eq 137 ]; then
        echo "[$TS_REVIEW_END] guard: reviewer timed out for task=$TASK_ID after ${REVIEWER_TIMEOUT_SEC}s; retrying task after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
      else
        echo "[$TS_REVIEW_END] guard: reviewer failed for task=$TASK_ID exit=$REVIEW_EXIT; retrying task after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
      fi
      sleep "$GUARD_RETRY_SEC"
      continue
    fi

    if ! grep -Eq 'REVIEW_VERDICT: (PASS|FAIL)' "$REVIEW_LOG_FILE"; then
      echo "[$TS_REVIEW_END] guard: reviewer did not emit REVIEW_VERDICT for task=$TASK_ID; retrying task after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
      sleep "$GUARD_RETRY_SEC"
      continue
    fi

    REVIEW_VERDICT="$(grep -Eo 'REVIEW_VERDICT: (PASS|FAIL)' "$REVIEW_LOG_FILE" | tail -1 | awk '{print $2}')"
    REVIEW_ARTIFACT="$(latest_review_artifact "$TASK_ID" "$REVIEW_VERDICT" "$REVIEW_MARKER")"
    if [ -z "$REVIEW_ARTIFACT" ]; then
      echo "[$TS_REVIEW_END] guard: reviewer emitted $REVIEW_VERDICT but no matching review artifact was created for task=$TASK_ID; retrying task after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
      sleep "$GUARD_RETRY_SEC"
      continue
    fi

    if is_admin_bff_task "$TASK_ID" && is_admin_bff_block_closer "$TASK_ID" && [ "$REVIEW_VERDICT" = "PASS" ]; then
      if ! grep -q 'Block Gate' "$REVIEW_ARTIFACT"; then
        echo "[$TS_REVIEW_END] guard: block-closing task=$TASK_ID PASS artifact lacks Block Gate section: $REVIEW_ARTIFACT; retrying task after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
        sleep "$GUARD_RETRY_SEC"
        continue
      fi
    fi
  fi

  if is_admin_bff_task "$TASK_ID"; then
    WEB_TREE_AFTER_REVIEW="$(web_tree_fingerprint)"
    if [ "$WEB_TREE_BEFORE" != "$WEB_TREE_AFTER_REVIEW" ]; then
      if [ "$REVIEWER_HANDLES_SCOPE_GUARDS" != "0" ] && [ "${REVIEW_VERDICT:-}" = "PASS" ]; then
        echo "[$TS_END] guard: apps/web changed during admin BFF task/review=$TASK_ID but reviewer PASS accepted the exception; continuing" >> "$LOG_DIR/runner.log"
      else
        echo "[$TS_END] guard: apps/web changed during admin BFF task or review=$TASK_ID; public site is read-only for BFF tasks; retrying after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
        sleep "$GUARD_RETRY_SEC"
        continue
      fi
    fi

    HEAD_AFTER_REVIEW="$(git rev-parse HEAD 2>/dev/null || echo none)"
    FORBIDDEN_REVIEW_PATHS="$(admin_bff_forbidden_commit_paths "$HEAD_BEFORE" "$HEAD_AFTER_REVIEW")"
    if [ -n "$FORBIDDEN_REVIEW_PATHS" ]; then
      printf '%s\n' "$FORBIDDEN_REVIEW_PATHS" > "$LOG_DIR/forbidden-paths-after-review-$TS-$TASK_ID.txt"
      if [ "$REVIEWER_HANDLES_SCOPE_GUARDS" != "0" ] && [ "${REVIEW_VERDICT:-}" = "PASS" ]; then
        echo "[$TS_END] guard: forbidden committed paths during admin BFF task/review=$TASK_ID but reviewer PASS accepted the exception; see $LOG_DIR/forbidden-paths-after-review-$TS-$TASK_ID.txt; continuing" >> "$LOG_DIR/runner.log"
      else
        echo "[$TS_END] guard: forbidden committed paths during admin BFF task/review=$TASK_ID; see $LOG_DIR/forbidden-paths-after-review-$TS-$TASK_ID.txt; retrying after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
        sleep "$GUARD_RETRY_SEC"
        continue
      fi
    fi
  fi

  HEAD_AFTER="$(git rev-parse HEAD 2>/dev/null || echo none)"
  git status --porcelain=v1 > "$STATUS_AFTER" 2>/dev/null || true

  if ! cmp -s "$STATUS_BEFORE" "$STATUS_AFTER"; then
    unexpected_worktree_status_diff "$STATUS_BEFORE" "$STATUS_AFTER" "$HEAD_BEFORE" "$HEAD_AFTER" > "$STATUS_DIFF" || true
    if [ -s "$STATUS_DIFF" ]; then
      echo "[$TS_END] guard: unexpected worktree status changed after task=$TASK_ID (head_before=$HEAD_BEFORE head_after=$HEAD_AFTER); see $STATUS_DIFF; retrying after ${GUARD_RETRY_SEC}s" >> "$LOG_DIR/runner.log"
      sleep "$GUARD_RETRY_SEC"
      continue
    fi
    echo "[$TS_END] guard: worktree status changed only by committed task-owned cleanup for task=$TASK_ID; continuing" >> "$LOG_DIR/runner.log"
  fi

  if [ "${CODEX_STOP_AFTER_ONE_TASK:-0}" != "0" ]; then
    echo "[$TS_END] guard: CODEX_STOP_AFTER_ONE_TASK enabled; stopping after task=$TASK_ID" >> "$LOG_DIR/runner.log"
    exit 0
  fi

  if is_admin_bff_task "$TASK_ID" && is_admin_bff_block_closer "$TASK_ID" && [ "${CODEX_STOP_AFTER_BFF_BLOCK_GATE:-0}" != "0" ]; then
    if [ -n "${REVIEW_LOG_FILE:-}" ] && grep -q 'REVIEW_VERDICT: PASS' "$REVIEW_LOG_FILE"; then
      echo "[$TS_END] guard: completed admin BFF block gate task=$TASK_ID with PASS; stopping for owner checkpoint" >> "$LOG_DIR/runner.log"
      echo "[$TS_END] next: run bash scripts/codex-preflight.sh before resuming the autonomous service" >> "$LOG_DIR/runner.log"
      exit 0
    fi
  fi

  sleep "$COOLDOWN_SEC"
done
