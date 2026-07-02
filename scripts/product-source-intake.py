#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any
from zipfile import ZipFile
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "presentation"
OUT_DIR = ROOT / "docs/strategy/artifacts/product-research-2026-05-14"
TEXT_DIR = OUT_DIR / "extracted-text"
MEDIA_DIR = OUT_DIR / "embedded-media"
PREVIEW_DIR = OUT_DIR / "previews"
TMP_DIR = OUT_DIR / "_tmp"

SUPPORTED = {".pdf", ".docx", ".pptx", ".ppt", ".doc"}


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=check,
    )


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def slugify(path: Path) -> str:
    base = path.stem.lower()
    base = re.sub(r"[^a-z0-9а-яё]+", "-", base, flags=re.IGNORECASE).strip("-")
    return base[:96] or "source"


def text_stats(text: str) -> dict[str, int]:
    compact = re.sub(r"\s+", "", text)
    return {
        "chars": len(text),
        "non_whitespace_chars": len(compact),
        "lines": len(text.splitlines()),
    }


def extract_docx(path: Path, slug: str) -> dict[str, Any]:
    text_path = TEXT_DIR / f"{slug}.txt"
    result = run(["pandoc", str(path), "-t", "plain"], check=False)
    text_path.write_text(result.stdout, encoding="utf-8")

    media_out = MEDIA_DIR / slug
    media_out.mkdir(parents=True, exist_ok=True)
    media_files: list[dict[str, Any]] = []
    with ZipFile(path) as zf:
        for name in sorted(n for n in zf.namelist() if n.startswith("word/media/")):
            target = media_out / Path(name).name
            target.write_bytes(zf.read(name))
            media_files.append({"path": rel(target), "bytes": target.stat().st_size})

    return {
        "text_path": rel(text_path),
        "text_stats": text_stats(result.stdout),
        "extractor": "pandoc plain + docx media zip extraction",
        "media_files": media_files,
        "warnings": [] if result.returncode == 0 else [result.stderr.strip()],
    }


def pptx_slide_text(path: Path) -> tuple[str, list[dict[str, Any]]]:
    ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
    slides: list[dict[str, Any]] = []
    with ZipFile(path) as zf:
        slide_names = sorted(
            [n for n in zf.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")],
            key=lambda name: int(re.search(r"slide(\d+)\.xml$", name).group(1)),  # type: ignore[union-attr]
        )
        for index, name in enumerate(slide_names, start=1):
            root = ET.fromstring(zf.read(name))
            chunks = [t.text.strip() for t in root.findall(".//a:t", ns) if t.text and t.text.strip()]
            slides.append({"slide": index, "text": " / ".join(chunks)})

    text = "\n\n".join(f"Slide {s['slide']}\n{s['text']}" for s in slides)
    return text, slides


def extract_pptx(path: Path, slug: str) -> dict[str, Any]:
    text, slides = pptx_slide_text(path)
    text_path = TEXT_DIR / f"{slug}.txt"
    text_path.write_text(text, encoding="utf-8")

    media_out = MEDIA_DIR / slug
    media_out.mkdir(parents=True, exist_ok=True)
    media_files: list[dict[str, Any]] = []
    with ZipFile(path) as zf:
        for name in sorted(n for n in zf.namelist() if n.startswith("ppt/media/")):
            target = media_out / Path(name).name
            target.write_bytes(zf.read(name))
            media_files.append({"path": rel(target), "bytes": target.stat().st_size})

    preview_files: list[str] = []
    pdf_tmp = TMP_DIR / f"{slug}.pdf"
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    convert = run(
        ["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(TMP_DIR), str(path)],
        check=False,
    )
    generated = TMP_DIR / f"{path.stem}.pdf"
    if generated.exists():
        if generated != pdf_tmp:
            generated.replace(pdf_tmp)
        preview_files = render_pdf_previews(pdf_tmp, slug, max_pages=6)

    warnings: list[str] = []
    if convert.returncode != 0:
        warnings.append(convert.stderr.strip() or convert.stdout.strip())
    if not preview_files:
        warnings.append("PPTX slide preview render unavailable; text/media extraction succeeded.")

    return {
        "text_path": rel(text_path),
        "text_stats": text_stats(text),
        "extractor": "python pptx XML text + zip media extraction + LibreOffice/PDF preview",
        "slides": slides,
        "slide_count": len(slides),
        "media_files": media_files,
        "preview_files": preview_files,
        "warnings": warnings,
    }


def pdf_page_count(path: Path) -> int | None:
    info = run(["pdfinfo", str(path)], check=False)
    for line in info.stdout.splitlines():
        if line.startswith("Pages:"):
            return int(line.split(":", 1)[1].strip())
    return None


def render_pdf_previews(path: Path, slug: str, max_pages: int = 3) -> list[str]:
    out = PREVIEW_DIR / slug
    out.mkdir(parents=True, exist_ok=True)
    prefix = out / "page"
    pages = pdf_page_count(path) or max_pages
    last_page = min(max_pages, pages)
    run(
        [
            "pdftoppm",
            "-jpeg",
            "-r",
            "96",
            "-f",
            "1",
            "-l",
            str(last_page),
            str(path),
            str(prefix),
        ],
        check=False,
    )
    return [rel(p) for p in sorted(out.glob("page-*.jpg"))]


def extract_pdf(path: Path, slug: str) -> dict[str, Any]:
    text_path = TEXT_DIR / f"{slug}.txt"
    result = run(["pdftotext", "-layout", str(path), str(text_path)], check=False)
    text = text_path.read_text(encoding="utf-8", errors="replace") if text_path.exists() else ""
    previews = render_pdf_previews(path, slug)
    info = run(["pdfinfo", str(path)], check=False)

    warnings: list[str] = []
    if result.returncode != 0:
        warnings.append(result.stderr.strip())
    if text_stats(text)["non_whitespace_chars"] < 200:
        warnings.append("Low extracted text volume; likely scanned/image PDF or OCR gap.")

    return {
        "text_path": rel(text_path),
        "text_stats": text_stats(text),
        "extractor": "poppler pdftotext + pdftoppm previews",
        "pdfinfo": info.stdout,
        "page_count": pdf_page_count(path),
        "preview_files": previews,
        "warnings": warnings,
    }


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def main() -> int:
    for directory in (TEXT_DIR, MEDIA_DIR, PREVIEW_DIR, TMP_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    sources = sorted(p for p in SOURCE_DIR.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED)
    inventory: list[dict[str, Any]] = []
    by_hash: dict[str, list[str]] = {}

    for source in sources:
        digest = sha256(source)
        by_hash.setdefault(digest, []).append(rel(source))
        slug = slugify(source)
        item: dict[str, Any] = {
            "source_path": rel(source),
            "slug": slug,
            "extension": source.suffix.lower(),
            "bytes": source.stat().st_size,
            "mtime": source.stat().st_mtime,
            "sha256": digest,
        }
        if source.suffix.lower() == ".docx":
            item.update(extract_docx(source, slug))
        elif source.suffix.lower() == ".pptx":
            item.update(extract_pptx(source, slug))
        elif source.suffix.lower() == ".pdf":
            item.update(extract_pdf(source, slug))
        else:
            item["warnings"] = ["File type discovered but extractor not implemented."]
        inventory.append(item)

    duplicates = [
        {"sha256": digest, "paths": paths}
        for digest, paths in sorted(by_hash.items())
        if len(paths) > 1
    ]
    manifest = {
        "generated_at": "2026-05-14",
        "source_dir": rel(SOURCE_DIR),
        "artifact_dir": rel(OUT_DIR),
        "sources": inventory,
        "duplicate_candidates": duplicates,
    }

    (OUT_DIR / "source-intake-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    if TMP_DIR.exists():
        shutil.rmtree(TMP_DIR)
    print(f"Extracted {len(inventory)} sources into {rel(OUT_DIR)}")
    print(f"Duplicate candidate groups: {len(duplicates)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
