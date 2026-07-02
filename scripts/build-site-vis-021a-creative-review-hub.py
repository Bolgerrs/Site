#!/usr/bin/env python3
"""Build a single review hub for MNT-SITE-VIS-021A generated creatives."""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTS = {".mp4", ".webm", ".mov"}


@dataclass
class CreativeItem:
    family: str
    product_key: str
    run_name: str
    candidate: str
    kind: str
    original_path: str
    hub_path: str
    width: int | None
    height: int | None
    bytes: int
    mtime: str


def safe_name(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9._-]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-") or "item"


def classify(path: Path) -> str | None:
    name = path.name.lower()
    suffix = path.suffix.lower()
    if suffix in VIDEO_EXTS and name.startswith("current-"):
        return "video"
    if suffix not in IMAGE_EXTS:
        return None
    if not name.startswith(("generated-", "current-")):
        return None
    if any(token in name for token in ("upscale", "review-only", "2k", "2752", "3669", "2064")):
        return "review-upscale"
    if re.search(r"(1376x768|1200x896|896x1200|1280x720)", name):
        return "native-candidate"
    if name.startswith("current-") and "thumbnail" in name:
        return "video-thumbnail"
    return None


def image_size(path: Path) -> tuple[int | None, int | None]:
    if path.suffix.lower() not in IMAGE_EXTS:
        return None, None
    try:
        with Image.open(path) as image:
            return image.size
    except OSError:
        return None, None


def symlink_or_copy(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() or dest.is_symlink():
        dest.unlink()
    rel = os.path.relpath(src, dest.parent)
    try:
        dest.symlink_to(rel)
    except OSError:
        shutil.copy2(src, dest)


def discover(root: Path, out_dir: Path) -> list[CreativeItem]:
    items: list[CreativeItem] = []
    package_root = root / "product-review-packages"
    for path in sorted(package_root.rglob("*")):
        if not path.is_file():
            continue
        kind = classify(path)
        if not kind:
            continue
        try:
            rel = path.relative_to(package_root)
        except ValueError:
            continue
        parts = rel.parts
        if len(parts) < 4:
            continue
        family, product_key, run_name = parts[0], parts[1], parts[2]
        width, height = image_size(path)
        candidate = path.stem
        flat = "__".join(
            safe_name(part)
            for part in (family, product_key, run_name, path.name)
        )
        hub_rel = Path("files") / kind / safe_name(family) / flat
        hub_abs = out_dir / hub_rel
        symlink_or_copy(path, hub_abs)
        stat = path.stat()
        items.append(
            CreativeItem(
                family=family,
                product_key=product_key,
                run_name=run_name,
                candidate=candidate,
                kind=kind,
                original_path=str(path),
                hub_path=str(hub_rel),
                width=width,
                height=height,
                bytes=stat.st_size,
                mtime=datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
            )
        )
    return items


def label_for(item: CreativeItem) -> str:
    return f"{item.family} / {item.product_key}\n{item.run_name}\n{item.candidate}"


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font: ImageFont.ImageFont, width: int) -> None:
    x, y = xy
    lines: list[str] = []
    for raw_line in text.splitlines():
        words = raw_line.split()
        line = ""
        for word in words:
            test = f"{line} {word}".strip()
            bbox = draw.textbbox((0, 0), test, font=font)
            if bbox[2] - bbox[0] <= width or not line:
                line = test
            else:
                lines.append(line)
                line = word
        if line:
            lines.append(line)
    for line in lines[:4]:
        draw.text((x, y), line, fill=(235, 226, 207), font=font)
        y += 13


def make_sheet(items: list[CreativeItem], out_path: Path, title: str, root: Path) -> None:
    if not items:
        return
    font = ImageFont.load_default()
    thumb_w, thumb_h, label_h = 220, 124, 58
    cols = 4
    rows = (len(items) + cols - 1) // cols
    pad = 18
    title_h = 44
    sheet = Image.new("RGB", (cols * (thumb_w + pad) + pad, rows * (thumb_h + label_h + pad) + pad + title_h), (18, 15, 12))
    draw = ImageDraw.Draw(sheet)
    draw.text((pad, pad), title, fill=(214, 177, 102), font=font)
    for idx, item in enumerate(items):
        x = pad + (idx % cols) * (thumb_w + pad)
        y = pad + title_h + (idx // cols) * (thumb_h + label_h + pad)
        src = root / item.original_path
        try:
            with Image.open(src) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                frame = Image.new("RGB", (thumb_w, thumb_h), (34, 29, 23))
                frame.paste(image, ((thumb_w - image.width) // 2, (thumb_h - image.height) // 2))
        except OSError:
            frame = Image.new("RGB", (thumb_w, thumb_h), (48, 18, 18))
        sheet.paste(frame, (x, y))
        draw.rectangle((x, y, x + thumb_w - 1, y + thumb_h - 1), outline=(87, 68, 40))
        draw_wrapped(draw, (x, y + thumb_h + 7), label_for(item), font, thumb_w)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=88, optimize=True)


def write_contact_sheets(items: list[CreativeItem], out_dir: Path, root: Path) -> None:
    native = [item for item in items if item.kind in {"native-candidate", "video-thumbnail"}]
    sheets_dir = out_dir / "contact-sheets"
    by_family: dict[str, list[CreativeItem]] = {}
    for item in native:
        by_family.setdefault(item.family, []).append(item)
    for family, family_items in sorted(by_family.items()):
        for offset in range(0, len(family_items), 40):
            page = offset // 40 + 1
            suffix = f"-{page:02d}" if len(family_items) > 40 else ""
            make_sheet(
                family_items[offset : offset + 40],
                sheets_dir / f"{safe_name(family)}{suffix}.jpg",
                f"MNT-SITE-VIS-021A / {family} / native generated candidates / page {page}",
                root,
            )
    for offset in range(0, len(native), 40):
        page = offset // 40 + 1
        make_sheet(
            native[offset : offset + 40],
            sheets_dir / f"00-all-native-generated-{page:02d}.jpg",
            f"MNT-SITE-VIS-021A / all native generated candidates / page {page}",
            root,
        )


def write_html(items: list[CreativeItem], out_dir: Path) -> None:
    rows = []
    for item in items:
        link = html.escape(item.hub_path)
        caption = html.escape(f"{item.family} / {item.product_key} / {item.run_name} / {item.candidate}")
        meta = html.escape(f"{item.kind} {item.width or '-'}x{item.height or '-'}")
        if item.kind == "video":
            media = f'<video src="{link}" controls preload="metadata"></video>'
        elif item.kind in {"native-candidate", "video-thumbnail"}:
            media = f'<img src="{link}" loading="lazy" alt="{caption}">'
        else:
            media = f'<a href="{link}">review upscale file</a>'
        rows.append(f'<article class="item" data-family="{html.escape(item.family)}" data-kind="{html.escape(item.kind)}">{media}<p>{caption}</p><small>{meta}</small></article>')
    families = sorted({item.family for item in items})
    family_buttons = " ".join(f'<button type="button" data-filter="{html.escape(family)}">{html.escape(family)}</button>' for family in families)
    html_text = f"""<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MNT-SITE-VIS-021A Creative Selection Hub</title>
<style>
body{{margin:0;background:#14110e;color:#eee2ce;font-family:Arial,sans-serif}}
header{{position:sticky;top:0;z-index:2;background:#14110ef2;border-bottom:1px solid #5e4727;padding:18px 24px}}
h1{{margin:0 0 8px;font-family:Georgia,serif;font-weight:400;color:#d6b166}}
.filters{{display:flex;gap:8px;flex-wrap:wrap}}
button{{background:#261f17;color:#eee2ce;border:1px solid #6f542c;border-radius:0;padding:8px 10px;cursor:pointer}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;padding:24px}}
.item{{border:1px solid #443420;background:#1d1813;padding:10px;min-width:0}}
img,video{{width:100%;aspect-ratio:16/9;object-fit:contain;background:#090806;display:block}}
p{{font-size:12px;line-height:1.35;margin:10px 0 6px;overflow-wrap:anywhere}}
small{{color:#bfa679}}
.hidden{{display:none}}
</style>
<header>
<h1>MNT-SITE-VIS-021A Creative Selection Hub</h1>
<div class="filters"><button type="button" data-filter="all">all</button>{family_buttons}<button type="button" data-kind="native-candidate">native only</button><button type="button" data-kind="video">videos</button></div>
</header>
<main>
{''.join(rows)}
</main>
<script>
document.querySelector('.filters').addEventListener('click', (event) => {{
  const button = event.target.closest('button');
  if (!button) return;
  const family = button.dataset.filter;
  const kind = button.dataset.kind;
  document.querySelectorAll('.item').forEach((item) => {{
    let visible = true;
    if (family && family !== 'all') visible = item.dataset.family === family;
    if (kind) visible = item.dataset.kind === kind;
    item.classList.toggle('hidden', !visible);
  }});
}});
</script>
</html>
"""
    (out_dir / "gallery.html").write_text(html_text, encoding="utf-8")


def write_markdown(items: list[CreativeItem], out_dir: Path, root: Path) -> None:
    counts: dict[str, int] = {}
    families: dict[str, int] = {}
    for item in items:
        counts[item.kind] = counts.get(item.kind, 0) + 1
        families[item.family] = families.get(item.family, 0) + 1
    lines = [
        "# MNT-SITE-VIS-021A Creative Selection Hub",
        "",
        f"Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        "",
        "Purpose: one server-side place for owner selection of generated creative candidates.",
        "",
        "Important: this hub is a selection surface. It does not mean the candidates are rollout-approved.",
        "",
        "## Open",
        "",
        "- `gallery.html` - browser gallery with family filters.",
        "- `manifest.json` - machine-readable list of every included generated candidate.",
        "- `contact-sheets/` - consolidated preview sheets.",
        "- `files/native-candidate/` - symlinks to native generated candidates in one place.",
        "- `files/review-upscale/` - symlinks to review-only upscales, separated from native candidates.",
        "- `files/video/` - generated video candidates, if present.",
        "",
        "## Counts",
        "",
    ]
    for key in sorted(counts):
        lines.append(f"- `{key}`: {counts[key]}")
    lines += ["", "## Families", ""]
    for key in sorted(families):
        lines.append(f"- `{key}`: {families[key]}")
    lines += [
        "",
        "## Rule Applied",
        "",
        "- Included generated current/review package media from `product-review-packages/`.",
        "- Kept raw Flow DOM dumps, source uploads, logos and old mixed media out of the selection grid.",
        "- Kept review upscales separate from native candidates.",
        "- Preserved original source paths in `manifest.json` for auditability.",
        "",
        "## Root",
        "",
        f"- `{root}`",
    ]
    (out_dir / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="docs/strategy/artifacts/visual-modernization-2026-05-21/MNT-SITE-VIS-021A")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    root = Path(args.root).resolve()
    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    items = discover(root, out_dir)
    items.sort(key=lambda item: (item.family, item.product_key, item.run_name, item.candidate, item.kind))
    (out_dir / "manifest.json").write_text(
        json.dumps([asdict(item) for item in items], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_contact_sheets(items, out_dir, Path.cwd())
    write_html(items, out_dir)
    write_markdown(items, out_dir, root)
    print(f"creative review hub: {out_dir}")
    print(f"items: {len(items)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
