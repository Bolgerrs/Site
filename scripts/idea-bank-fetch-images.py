#!/usr/bin/env python3
"""Fetch reference images from visited competitor pages into the Montelar idea bank.

This script is for research/reference collection only. Downloaded images must not
be used as production assets unless licensing is separately verified.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import sys
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
CSS_URL_RE = re.compile(r"url\((['\"]?)(.*?)\1\)")


class ImageHTMLParser(HTMLParser):
    def __init__(self, page_url: str) -> None:
        super().__init__()
        self.page_url = page_url
        self.images: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key.lower(): value or "" for key, value in attrs}

        if tag == "img":
            for key in ("src", "data-src", "data-original", "data-lazy-src"):
                self.add_url(attr.get(key, ""), tag, key)
            self.add_srcset(attr.get("srcset", ""), tag)
            self.add_style_urls(attr.get("style", ""), tag)

        if tag == "source":
            self.add_srcset(attr.get("srcset", ""), tag)

        if tag == "meta":
            prop = attr.get("property") or attr.get("name")
            if prop in {"og:image", "og:image:url", "twitter:image", "twitter:image:src"}:
                self.add_url(attr.get("content", ""), tag, prop)

        if tag == "link":
            rel = attr.get("rel", "")
            as_attr = attr.get("as", "")
            if "preload" in rel and as_attr == "image":
                self.add_url(attr.get("href", ""), tag, "preload")

        if "style" in attr:
            self.add_style_urls(attr["style"], tag)

    def add_url(self, raw_url: str, tag: str, source: str) -> None:
        if not raw_url:
            return
        absolute = urljoin(self.page_url, raw_url.strip())
        if not absolute.startswith(("http://", "https://")):
            return
        self.images.append({"url": absolute, "tag": tag, "source": source})

    def add_srcset(self, srcset: str, tag: str) -> None:
        if not srcset:
            return
        for part in srcset.split(","):
            candidate = part.strip().split(" ", 1)[0]
            self.add_url(candidate, tag, "srcset")

    def add_style_urls(self, style: str, tag: str) -> None:
        for match in CSS_URL_RE.finditer(style):
            self.add_url(match.group(2), tag, "style-url")


def request_bytes(url: str, max_bytes: int) -> tuple[bytes, str]:
    request = Request(
        url,
        headers={
            "User-Agent": "MontelarResearchBot/1.0 (+reference collection; no production reuse)",
            "Accept": "text/html,image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
    )
    with urlopen(request, timeout=20) as response:
        content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        data = response.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ValueError(f"file too large over {max_bytes} bytes")
    return data, content_type


def extension_for(url: str, content_type: str) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        return suffix
    guessed = mimetypes.guess_extension(content_type) or ""
    if guessed == ".jpe":
        guessed = ".jpg"
    if guessed in IMAGE_EXTENSIONS:
        return guessed
    return ".bin"


def safe_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower().replace(":", "_") or "unknown"


def collect_page(
    url: str,
    out_dir: Path,
    max_images: int,
    min_bytes: int,
    max_bytes: int,
    max_candidates: int,
) -> int:
    html_bytes, _ = request_bytes(url, max_bytes=max_bytes)
    html = html_bytes.decode("utf-8", errors="replace")

    parser = ImageHTMLParser(url)
    parser.feed(html)

    seen: set[str] = set()
    images = []
    for item in parser.images:
        image_url = item["url"]
        if image_url in seen:
            continue
        seen.add(image_url)
        images.append(item)

    domain = safe_domain(url)
    day = time.strftime("%Y%m%d")
    image_dir = out_dir / domain / day / "images"
    image_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = out_dir / domain / day / "metadata.jsonl"

    saved = 0
    with metadata_path.open("a", encoding="utf-8") as metadata:
        for item in images[:max_candidates]:
            if saved >= max_images:
                break
            image_url = item["url"]
            try:
                data, content_type = request_bytes(image_url, max_bytes=max_bytes)
            except Exception as exc:  # noqa: BLE001 - keep reference collection resilient.
                metadata.write(json.dumps({
                    "page_url": url,
                    "image_url": image_url,
                    "status": "error",
                    "error": str(exc),
                    "collected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }, ensure_ascii=False) + "\n")
                continue

            if len(data) < min_bytes:
                continue
            if content_type and not content_type.startswith("image/"):
                continue

            digest = hashlib.sha256(data).hexdigest()[:16]
            ext = extension_for(image_url, content_type)
            if ext == ".bin":
                continue
            filename = f"{digest}{ext}"
            file_path = image_dir / filename
            if not file_path.exists():
                file_path.write_bytes(data)

            metadata.write(json.dumps({
                "page_url": url,
                "image_url": image_url,
                "file": str(file_path.relative_to(out_dir)),
                "bytes": len(data),
                "content_type": content_type,
                "tag": item.get("tag"),
                "source": item.get("source"),
                "status": "saved",
                "usage": "reference-only-not-production-asset",
                "collected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }, ensure_ascii=False) + "\n")
            saved += 1

    return saved


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch presentation/card images into Montelar idea bank.")
    parser.add_argument("urls", nargs="+", help="Competitor/reference page URLs.")
    parser.add_argument("--out", default="docs/strategy/artifacts/idea-bank", help="Idea bank output directory.")
    parser.add_argument("--max-images", type=int, default=40, help="Maximum images per page.")
    parser.add_argument("--max-candidates", type=int, default=120, help="Maximum image URLs to try per page.")
    parser.add_argument("--min-bytes", type=int, default=6_000, help="Skip tiny icons/logos below this size.")
    parser.add_argument("--max-bytes", type=int, default=8_000_000, help="Maximum downloaded file size.")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    total = 0
    for url in args.urls:
        try:
            saved = collect_page(url, out_dir, args.max_images, args.min_bytes, args.max_bytes, args.max_candidates)
        except Exception as exc:  # noqa: BLE001 - CLI should continue over failed pages.
            print(f"idea-bank: {url}: error: {exc}", file=sys.stderr)
            continue
        print(f"idea-bank: {url}: saved={saved}", flush=True)
        total += saved

    print(f"idea-bank: total_saved={total}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
