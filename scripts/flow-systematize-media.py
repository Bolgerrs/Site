#!/usr/bin/env python3
"""Systematize Google Flow/Nano media extraction artifacts.

Flow project media grids often mix current generated outputs, uploaded source
references, logo files, old generated media and duplicates. This script creates
the mandatory Montelar run taxonomy before Telegram/reviewer handoff.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageDraw, ImageFont


FOLDERS = {
    "source": "01-source-uploads",
    "current": "02-current-generated-candidates",
    "rejected": "03-current-rejected",
    "old": "04-old-or-cross-task-media",
    "sheets": "05-contact-sheets",
    "handoff": "06-review-handoff",
    "package": "07-review-package-current-only",
}


@dataclass
class MediaItem:
    index: int
    src: str
    alt: str
    width: int | None
    height: int | None
    media_id: str
    file: Path | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", required=True, type=Path)
    parser.add_argument("--after-json", required=True, type=Path)
    parser.add_argument("--before-json", type=Path)
    parser.add_argument("--raw-dir", type=Path)
    parser.add_argument("--out-dir", type=Path)
    parser.add_argument("--source-file", action="append", default=[], type=Path)
    parser.add_argument("--current-index", action="append", default=[], type=int)
    parser.add_argument("--source-index", action="append", default=[], type=int)
    parser.add_argument("--old-index", action="append", default=[], type=int)
    parser.add_argument("--rejected-index", action="append", default=[], type=int)
    parser.add_argument("--family-key", help="Optional product family key for product-review-packages.")
    parser.add_argument("--product-key", help="Optional product key for product-review-packages.")
    parser.add_argument("--product-root", type=Path, help="Optional root for product-review-packages.")
    parser.add_argument("--title", default="Flow media systematized review")
    return parser.parse_args()


def read_images(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("images") or []


def media_id(src: str) -> str:
    parsed = urlparse(src)
    qs = parse_qs(parsed.query)
    if "name" in qs and qs["name"]:
        return qs["name"][0]
    return Path(parsed.path).name or src


def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def image_size(path: Path) -> tuple[int, int] | None:
    try:
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None


def source_signature(paths: list[Path]) -> tuple[set[str], set[tuple[int, int]], set[str]]:
    names: set[str] = set()
    sizes: set[tuple[int, int]] = set()
    hashes: set[str] = set()
    for p in paths:
        if not p.exists():
            continue
        names.add(p.name.lower())
        names.add(p.stem.lower())
        sz = image_size(p)
        if sz:
            sizes.add(sz)
        try:
            hashes.add(file_hash(p))
        except Exception:
            pass
    return names, sizes, hashes


def find_raw_file(raw_dir: Path, index: int) -> Path | None:
    patterns = [
        f"generated-{index:02d}-*",
        f"img-{index:02d}-*",
    ]
    for pattern in patterns:
        matches = sorted(p for p in raw_dir.glob(pattern) if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
        if matches:
            return matches[0]
    return None


def build_items(after_json: Path, raw_dir: Path) -> list[MediaItem]:
    items: list[MediaItem] = []
    for idx, img in enumerate(read_images(after_json), start=1):
        src = img.get("src", "")
        items.append(
            MediaItem(
                index=idx,
                src=src,
                alt=str(img.get("alt") or ""),
                width=img.get("width") or img.get("naturalWidth"),
                height=img.get("height") or img.get("naturalHeight"),
                media_id=media_id(src),
                file=find_raw_file(raw_dir, idx),
            )
        )
    return items


def label_for_item(
    item: MediaItem,
    before_ids: set[str],
    source_names: set[str],
    source_sizes: set[tuple[int, int]],
    source_hashes: set[str],
    manual_current: set[int],
    manual_source: set[int],
    manual_old: set[int],
    manual_rejected: set[int],
    seen_hashes: set[str],
) -> tuple[str, str]:
    if item.index in manual_current:
        return "current", "manual current-index override"
    if item.index in manual_source:
        return "source", "manual source-index override"
    if item.index in manual_old:
        return "old", "manual old-index override"
    if item.index in manual_rejected:
        return "rejected", "manual rejected-index override"

    if item.media_id in before_ids:
        return "old", "media id existed before current create"

    alt = item.alt.lower()
    if alt and alt != "generated image":
        if any(name and name in alt for name in source_names):
            return "source", "alt matches uploaded source filename"
        return "source", "non-generated alt in Flow media grid"

    if item.file and item.file.exists():
        digest = file_hash(item.file)
        if digest in seen_hashes:
            return "old", "duplicate file hash in same extraction"
        seen_hashes.add(digest)
        if digest in source_hashes:
            return "source", "file hash matches uploaded source"
        sz = image_size(item.file)
        if sz and sz in source_sizes:
            return "source", "image dimensions match uploaded source/logo"
        if sz and sz[1] and sz[0] / sz[1] > 5.0:
            return "source", "very wide logo/wordmark-like image"

    if item.width and item.height and item.height and item.width / item.height > 5.0:
        return "source", "very wide logo/wordmark-like media"

    return "current", "new generated image not present before and not source-like"


def copy_item(item: MediaItem, folder: Path) -> Path | None:
    if not item.file or not item.file.exists():
        return None
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / item.file.name
    shutil.copy2(item.file, dest)
    return dest


def make_sheet(folder: Path, out_path: Path, title: str) -> None:
    files = sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    if not files:
        return
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except Exception:
        font = None
    thumbs = []
    for p in files:
        with Image.open(p) as raw:
            im = raw.convert("RGB")
        im.thumbnail((420, 290))
        canvas = Image.new("RGB", (440, 340), (9, 8, 7))
        canvas.paste(im, ((440 - im.width) // 2, 44 + (290 - im.height) // 2))
        draw = ImageDraw.Draw(canvas)
        label = re.sub(r"\.(jpe?g|png|webp)$", "", p.name, flags=re.I)
        draw.text((12, 10), label[:34], fill=(244, 223, 176), font=font)
        thumbs.append(canvas)
    cols = 2 if len(thumbs) <= 2 else 3
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 460, rows * 360 + 54), (4, 4, 4))
    draw = ImageDraw.Draw(sheet)
    draw.text((14, 12), title, fill=(244, 223, 176), font=font)
    for idx, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((idx % cols) * 460 + 10, (idx // cols) * 360 + 54))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=92)


def make_review_package(out_dir: Path, title: str) -> None:
    package_dir = out_dir / FOLDERS["package"]
    current_dir = out_dir / FOLDERS["current"]
    sheet = out_dir / FOLDERS["sheets"] / "current-generated-candidates.jpg"
    current_files = sorted(
        p for p in current_dir.iterdir()
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    for p in current_files:
        shutil.copy2(p, package_dir / p.name)
    if sheet.exists():
        shutil.copy2(sheet, package_dir / "00-current-generated-candidates-contact-sheet.jpg")
    lines = [
        f"# {title} - current-only review package",
        "",
        "This is the only folder the autonomous contour should inspect for owner/reviewer creative review.",
        "",
        "It intentionally excludes:",
        "",
        "- source uploads;",
        "- logo files;",
        "- old Flow media;",
        "- cross-task media;",
        "- raw DOM extraction dumps.",
        "",
        f"Current candidate count: {len(current_files)}",
        "",
    ]
    for idx, p in enumerate(current_files, start=1):
        lines.append(f"{idx}. `{p.name}`")
    (package_dir / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def mirror_product_package(out_dir: Path, args: argparse.Namespace) -> None:
    if not args.family_key or not args.product_key:
        return
    package_dir = out_dir / FOLDERS["package"]
    if not package_dir.exists():
        return
    product_root = args.product_root or args.run_dir.parent.parent / "product-review-packages"
    target = product_root / args.family_key / args.product_key / args.run_dir.name
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(package_dir, target)
    index_path = product_root / args.family_key / args.product_key / "latest-current-review-package.txt"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(str(target.relative_to(product_root)) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    run_dir: Path = args.run_dir
    raw_dir: Path = args.raw_dir or run_dir / "extracted-generated"
    out_dir: Path = args.out_dir or run_dir / "systematized-flow-media"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    for folder in FOLDERS.values():
        (out_dir / folder).mkdir(parents=True, exist_ok=True)

    before_ids = set()
    if args.before_json and args.before_json.exists():
        before_ids = {media_id(img.get("src", "")) for img in read_images(args.before_json)}

    source_names, source_sizes, source_hashes = source_signature(args.source_file)
    items = build_items(args.after_json, raw_dir)

    manifest = []
    seen_hashes: set[str] = set()
    manual_current = set(args.current_index)
    manual_source = set(args.source_index)
    manual_old = set(args.old_index)
    manual_rejected = set(args.rejected_index)

    for item in items:
        lane, reason = label_for_item(
            item,
            before_ids,
            source_names,
            source_sizes,
            source_hashes,
            manual_current,
            manual_source,
            manual_old,
            manual_rejected,
            seen_hashes,
        )
        dest = copy_item(item, out_dir / FOLDERS[lane])
        manifest.append(
            {
                "index": item.index,
                "media_id": item.media_id,
                "alt": item.alt,
                "width": item.width,
                "height": item.height,
                "raw_file": str(item.file) if item.file else None,
                "classified_as": lane,
                "reason": reason,
                "output_file": str(dest.relative_to(out_dir)) if dest else None,
            }
        )

    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    readme = [
        f"# {args.title}",
        "",
        "This folder was generated by `scripts/flow-systematize-media.py`.",
        "",
        "Primary owner/reviewer surface: `02-current-generated-candidates` and its contact sheet only.",
        "Source uploads, logo files, old media and duplicates are not new creative outputs.",
        "",
    ]
    make_sheet(out_dir / FOLDERS["current"], out_dir / FOLDERS["sheets"] / "current-generated-candidates.jpg", "CURRENT GENERATED CANDIDATES ONLY")
    make_sheet(out_dir / FOLDERS["source"], out_dir / FOLDERS["sheets"] / "source-uploads-not-for-review.jpg", "SOURCE UPLOADS / LOGO - NOT FOR REVIEW")
    make_sheet(out_dir / FOLDERS["old"], out_dir / FOLDERS["sheets"] / "old-cross-task-not-current.jpg", "OLD / CROSS-TASK MEDIA - NOT CURRENT")
    make_sheet(out_dir / FOLDERS["rejected"], out_dir / FOLDERS["sheets"] / "current-rejected.jpg", "CURRENT REJECTED")
    make_review_package(out_dir, args.title)
    mirror_product_package(out_dir, args)

    for key, folder in FOLDERS.items():
        if key == "handoff":
            continue
        count = len([p for p in (out_dir / folder).iterdir() if p.is_file()])
        readme.append(f"- `{folder}`: {count} files")
    (out_dir / "README.md").write_text("\n".join(readme) + "\n", encoding="utf-8")

    current_count = len([p for p in (out_dir / FOLDERS["current"]).iterdir() if p.is_file()])
    if current_count == 0:
        print(f"flow-systematize-media: no current generated candidates in {out_dir}")
    else:
        print(f"flow-systematize-media: {current_count} current generated candidate(s) in {out_dir / FOLDERS['current']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
