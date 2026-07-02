#!/usr/bin/env python3
"""Privileged Telegram Codex chat layer for the Montelar project.

It builds live Montelar context and asks Codex to answer the owner in Russian
like a normal Codex chat running on the same server. This is not a narrow
ACK/status bridge: the agent may inspect the repo, logs, task files and
feedback queue, and may update Montelar control documents when the owner gives
a concrete instruction.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path


ROOT = Path("/root/montelar")
LOG_DIR = Path("/tmp/montelar-codex-logs")


def read_text(path: Path, limit: int = 12000, tail: bool = False) -> str:
    try:
        data = path.read_text(encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return f"[missing: {path}]"
    if len(data) <= limit:
        return data
    return data[-limit:] if tail else data[:limit]


def run(cmd: list[str], cwd: Path = ROOT, timeout: int = 20) -> str:
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=timeout,
        )
        return proc.stdout.strip()
    except Exception as exc:
        return f"[command failed: {' '.join(cmd)} :: {exc}]"


def latest_file(pattern: str) -> Path | None:
    files = sorted(LOG_DIR.glob(pattern), key=lambda p: p.stat().st_mtime if p.exists() else 0, reverse=True)
    return files[0] if files else None


def latest_flow_run(task_id: str) -> Path | None:
    base = ROOT / "docs/strategy/artifacts/visual-modernization-2026-05-21" / task_id / "flow-runs"
    if not base.exists():
        return None
    dirs = [path for path in base.iterdir() if path.is_dir() and not path.name.startswith(".")]
    if not dirs:
        return None
    return sorted(dirs, key=lambda p: p.stat().st_mtime, reverse=True)[0]


def list_latest_run_files(run_dir: Path | None) -> str:
    if not run_dir or not run_dir.exists():
        return ""
    return run(
        [
            "bash",
            "-lc",
            "find \"$1\" -maxdepth 3 -type f -printf '%TY-%Tm-%Td %TH:%TM %s %P\\n' | sort | tail -80",
            "bash",
            str(run_dir),
        ],
        cwd=ROOT,
        timeout=20,
    )


def active_task_id() -> str:
    index = read_text(ROOT / "docs/tasks/INDEX.md", limit=90000)
    for line in index.splitlines():
        if "| in_progress |" in line:
            parts = [part.strip() for part in line.strip("|").split("|")]
            if parts:
                return parts[0]
    for line in index.splitlines():
        if "| pending |" in line and line.startswith("| MNT-"):
            parts = [part.strip() for part in line.strip("|").split("|")]
            if parts:
                return parts[0]
    return "unknown"


def task_file_for(task_id: str) -> Path | None:
    matches = sorted((ROOT / "docs/tasks").glob(f"{task_id}-*.md"))
    return matches[0] if matches else None


def classify_owner_message(text: str) -> str:
    low = text.lower()
    if any(x in low for x in ["что делает", "что там", "статус", "контур", "этап", "застрял", "почему"]):
        return "status_or_diagnostics"
    if any(x in low for x in ["сделай", "надо", "исправ", "добав", "убери", "не нравится", "мусор", "хует", "крив"]):
        return "owner_correction_or_instruction"
    return "general_contour_chat"


def build_context(owner_text: str, event_id: str) -> str:
    task_id = active_task_id()
    task_path = task_file_for(task_id)
    latest_auto = latest_file("autonomous-*.log")
    latest_reviewer = latest_file(f"reviewer-*-{task_id}.log") or latest_file("reviewer-*.log")
    flow_run = latest_flow_run(task_id)

    context = {
        "event_id": event_id,
        "owner_message_type": classify_owner_message(owner_text),
        "active_task_id": task_id,
        "service": run(["systemctl", "is-active", "montelar-codex-autonomous.service"], cwd=Path("/root")),
        "processes": run(["bash", "-lc", "pgrep -af 'codex exec|flow-persistent|playwright|chrome' | tail -20"], cwd=Path("/root")),
        "git_head": run(["git", "log", "--oneline", "-8"]),
        "git_status_short": run(["git", "status", "--short"], timeout=20)[:8000],
        "runner_tail": read_text(LOG_DIR / "runner.log", limit=9000, tail=True),
        "latest_autonomous_log_path": str(latest_auto) if latest_auto else "",
        "latest_autonomous_tail": read_text(latest_auto, limit=14000, tail=True) if latest_auto else "",
        "latest_reviewer_log_path": str(latest_reviewer) if latest_reviewer else "",
        "latest_reviewer_tail": read_text(latest_reviewer, limit=12000, tail=True) if latest_reviewer else "",
        "latest_flow_run_path": str(flow_run) if flow_run else "",
        "latest_flow_prompt": read_text(flow_run / "prompt.md", limit=6000) if flow_run else "",
        "latest_flow_contract": read_text(flow_run / "creative-contract.md", limit=8000) if flow_run else "",
        "latest_flow_recent_files": list_latest_run_files(flow_run),
        "task_file_path": str(task_path) if task_path else "",
        "task_file_tail": read_text(task_path, limit=18000, tail=True) if task_path else "",
        "owner_feedback_tail": read_text(ROOT / "docs/strategy/OWNER_FEEDBACK_LIVE.md", limit=14000, tail=True),
    }
    return json.dumps(context, ensure_ascii=False, indent=2)


def contour_chat_privileged() -> bool:
    raw = os.getenv("MONTELAR_CONTOUR_CHAT_PRIVILEGED", "1").strip().lower()
    return raw in {"1", "true", "yes", "y", "on"}


def codex_cli_args(output_path: Path) -> list[str]:
    args = [
        "codex",
        "exec",
        "-m",
        os.getenv("MONTELAR_CONTOUR_CHAT_MODEL", "gpt-5.5"),
        "-c",
        f'model_reasoning_effort="{os.getenv("MONTELAR_CONTOUR_CHAT_REASONING", "medium")}"',
        "-c",
        'approval_policy="never"',
        "--cd",
        str(ROOT),
        "--skip-git-repo-check",
        "--output-last-message",
        str(output_path),
    ]
    if contour_chat_privileged():
        args.append("--dangerously-bypass-approvals-and-sandbox")
    else:
        args.extend(["--sandbox", "read-only"])
    args.append("-")
    return args


def codex_answer(owner_text: str, event_id: str, timeout: int) -> str:
    context_json = build_context(owner_text, event_id)
    prompt = f"""
Ты — Codex в Telegram для проекта Montelar.

Представь, что владелец пишет тебе не в отдельный тупой бот, а прямо в обычный
Codex-чат, только через Telegram. Ты знаешь, что работа идет над `/root/montelar`,
что рядом может работать автономный контур, и что Telegram-сообщения владельца
могут быть обычным диалогом, командой, замечанием к креативу или правкой правил.

Главное:
- Отвечай как штатный Codex-инженер в рабочем чате, а не как "представитель контура".
- Автономный контур — это один из инструментов/подпроцессов проекта, а не твоя личность.
- Если вопрос про контур, логи, Flow, креативы, задачи или Telegram feedback — используй живой контекст и отвечай точно.
- Если владелец дает обычную инженерную задачу, помогай как Codex: разберись, сделай безопасные точечные изменения или зафиксируй задачу там, где это правильно.
- Если действие лучше выполнить основному автономному контуру, не отделывайся "передал"; сформулируй, что именно записано/изменено и какой следующий проверяемый шаг.

Задача этого запуска: ответить владельцу проекта на русском как нормальный Codex-чат с доступом к Montelar.

Полномочия:
- Можешь читать проект `/root/montelar`, task files, strategy docs, логи `/tmp/montelar-codex-logs`, Telegram feedback inbox и evidence.
- Можешь обновлять Montelar control docs/feedback/task constraints, если сообщение владельца явно требует изменить правила, очередь, ТЗ или трактовку итераций.
- Можешь запускать безопасные диагностические команды внутри `/root/montelar`, если без этого нельзя дать точный ответ.
- Не меняй BitComp, системные секреты, `.env`, токены, feed endpoints и unrelated проекты.
- Не делай широкие правки production сайта из обычного Telegram-вопроса; для этого либо создай/уточни задачу, либо зафиксируй owner feedback для autonomous contour.
- Если делаешь изменение файла, скажи в ответе какой именно файл изменен и зачем.

Markdown:
- Отвечай Telegram-friendly Markdown: короткие абзацы, `inline code`, списки через `-`.
- Не заворачивай весь ответ в code block.
- Не используй сырые огромные логи.
- Длинные пути давай в `backticks`.

Правила:
- Отвечай как живой инженер: конкретика, причина, что делаем дальше.
- Не отвечай ACK вроде "передал", "я на месте", "смотрю живой контур", "event записан".
- Не используй OpenCode и не упоминай старый LLM-роутер.
- Не используй канцелярит "задача остается pending/rework" без объяснения человеческими словами.
- Не утверждай, что задача выполнена, если в логах/ревью нет доказательств.
- Если владелец спрашивает статус: дай короткий конкретный ответ по текущему факту из логов.
- Если владелец дал правку/ругательное замечание: сначала ответь по сути претензии, затем скажи конкретно что будет изменено в контуре.
- Если есть Flow failure/no-output/unusual activity: скажи это прямо, но без канцелярита и без повторения всех acceptance rules.
- Не пересказывай всю механику current-only/reviewer/downstream, если владелец прямо не спрашивал почему задача не движется.
- Если владелец спрашивает "что это?", "что за дичь?", "какое видео?", отвечай первой строкой прямым именованием объекта: "Это ..."; затем коротко поясни, по какому prompt/run это сделано.
- Если вопрос в Telegram был reply на твое сообщение, учитывай `Replied message text` в сообщении владельца и не отвечай как будто контекста нет.
- Не называй рабочий Flow-прогон "шумом", если владелец спрашивает, что именно было отправлено/сгенерировано. Назови run, цель, prompt и текущий статус.
- Если видишь, что контур сделал методологическую ошибку, скажи это прямо: "это ошибка пайплайна", "это нельзя было засчитывать", "ветку надо откатить в reference-only".
- Не оправдывай плохой результат правилами. Объясняй причину и ближайшее инженерное действие.
- Ответ должен быть короткий: обычно 3-7 строк. Длиннее только если вопрос реально требует разбора.
- Не давай длинные логи и не цитируй весь контекст.
- Если владелец говорит, что замечания нужны для будущих итераций, трактуй это как правило пайплайна: замечание остается открытым до свежей генерации/правки, где дефект реально исправлен.

Сообщение владельца:
{owner_text}

Событие уже записано в OWNER_FEEDBACK_LIVE.md как event {event_id}.

Живой контекст:
{context_json}
"""
    with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False) as out:
        out_path = Path(out.name)
    try:
        proc = subprocess.run(
            codex_cli_args(out_path),
            input=prompt,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=timeout,
        )
        answer = read_text(out_path, limit=5000).strip()
        if not answer:
            answer = proc.stdout.strip()[-4000:]
        if not answer:
            answer = "Не смог получить текстовый ответ от chat-agent, но событие записано в контур."
        return answer[:3900]
    except subprocess.TimeoutExpired:
        return (
            "Записал сообщение в контур, но умный Telegram-ответ не успел собраться за таймаут. "
            "Это не OpenCode: событие уже лежит в OWNER_FEEDBACK_LIVE.md, контур прочитает его на следующем шаге."
        )
    finally:
        try:
            out_path.unlink()
        except Exception:
            pass


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--message", required=True)
    parser.add_argument("--event-id", default="")
    parser.add_argument("--timeout", type=int, default=180)
    args = parser.parse_args()
    print(codex_answer(args.message, args.event_id, args.timeout))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
