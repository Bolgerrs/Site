#!/usr/bin/env python3
"""Send Montelar autonomous-loop messages/files to the owner Telegram chat.

The bot .env is intentionally parsed as key=value text instead of being sourced
by shell because Telegram env values may contain characters unsafe for `source`.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path


DEFAULT_ENV = Path("/opt/codex-telegram-agent/.env")


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        raise SystemExit(f"telegram-send: env file not found: {path}")

    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        values[key] = value
    return values


def request_json(url: str, fields: dict[str, str], files: dict[str, Path] | None = None) -> dict:
    if not files:
        data = urllib.parse.urlencode(fields).encode("utf-8")
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))

    boundary = "----montelar-telegram-boundary"
    chunks: list[bytes] = []
    for key, value in fields.items():
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        chunks.append(str(value).encode("utf-8"))
        chunks.append(b"\r\n")

    for key, path in files.items():
        content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(
            (
                f'Content-Disposition: form-data; name="{key}"; '
                f'filename="{path.name}"\r\n'
                f"Content-Type: {content_type}\r\n\r\n"
            ).encode("utf-8")
        )
        chunks.append(path.read_bytes())
        chunks.append(b"\r\n")

    chunks.append(f"--{boundary}--\r\n".encode())
    body = b"".join(chunks)
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a Telegram message/file through the Montelar bot.")
    parser.add_argument("--text", default="", help="Message text/caption.")
    parser.add_argument("--photo", type=Path, help="Photo path to send.")
    parser.add_argument("--document", type=Path, help="Document/file path to send.")
    parser.add_argument("--chat-id", default="", help="Override chat id.")
    parser.add_argument("--env", type=Path, default=DEFAULT_ENV, help="Bot .env path.")
    parser.add_argument("--dry-run", action="store_true", help="Validate inputs without sending.")
    args = parser.parse_args()

    env = read_env(args.env)
    token = env.get("TELEGRAM_BOT_TOKEN") or env.get("BOT_TOKEN") or os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = args.chat_id or env.get("ALLOWED_CHAT_ID") or env.get("TELEGRAM_CHAT_ID") or os.environ.get("ALLOWED_CHAT_ID")
    if not token:
        raise SystemExit("telegram-send: missing TELEGRAM_BOT_TOKEN/BOT_TOKEN")
    if not chat_id:
        raise SystemExit("telegram-send: missing ALLOWED_CHAT_ID/TELEGRAM_CHAT_ID")

    text = args.text.strip()
    if args.photo and not args.photo.exists():
        raise SystemExit(f"telegram-send: photo not found: {args.photo}")
    if args.document and not args.document.exists():
        raise SystemExit(f"telegram-send: document not found: {args.document}")
    if not text and not args.photo and not args.document:
        raise SystemExit("telegram-send: provide --text, --photo or --document")

    if args.dry_run:
        target = "photo" if args.photo else "document" if args.document else "text"
        print(f"telegram-send: dry-run ok target={target} chat_id={chat_id}")
        return 0

    base = f"https://api.telegram.org/bot{token}"
    if args.photo:
        result = request_json(
            f"{base}/sendPhoto",
            {"chat_id": str(chat_id), "caption": text[:1024]},
            {"photo": args.photo},
        )
    elif args.document:
        result = request_json(
            f"{base}/sendDocument",
            {"chat_id": str(chat_id), "caption": text[:1024]},
            {"document": args.document},
        )
    else:
        result = request_json(
            f"{base}/sendMessage",
            {"chat_id": str(chat_id), "text": text[:4096]},
        )

    if not result.get("ok"):
        print(json.dumps(result, ensure_ascii=False), file=sys.stderr)
        return 1
    message = result.get("result", {})
    print(json.dumps({"ok": True, "message_id": message.get("message_id")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
