#!/usr/bin/env python3
"""
Regenerate wallpapers_database.json by scanning wall-bin/ and wall-phone-bin/.

Usage:  python3 scripts/gen-index.py

Emits one record per image: filename, source dir, byte size, extension, and a
small set of tags (best-effort) derived from the filename / directory so the
gallery can filter with @tag queries.
"""
from __future__ import annotations

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "wallpapers_database.json")
BINS = {"wall-bin": "desktop", "wall-phone-bin": "phone"}
EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# theme / subject keywords sniffed from filenames (case-insensitive substring)
KEYWORDS = [
    "abstract", "anime", "arch", "astronaut", "cat", "cyberpunk", "dark",
    "eldenring", "forest", "gradient", "gruvbox", "halftone", "japan", "lake",
    "landscape", "light", "minimal", "moon", "mountain", "nature", "neon",
    "nord", "ocean", "pixel", "portrait", "red", "space", "sunset", "tokyo",
    "ultrawide", "void", "wallhaven", "water", "windows", "witchhat",
]

# artist patterns: "... - by 焦茶", "...by-NAME", "sources from X"
BY_PATTERNS = [
    re.compile(r"by\s+([a-z0-9_]+)", re.IGNORECASE),
    re.compile(r"-by-([a-z0-9]+)", re.IGNORECASE),
]


def derive_tags(name: str, bin_dir: str) -> list[str]:
    lower = name.lower()
    tags = {"desktop" if bin_dir == "wall-bin" else "phone"}

    # Elden Ring files start with "ER-"
    if re.match(r"^er[-_]", lower):
        tags.add("eldenring")

    # artist credits
    for pat in BY_PATTERNS:
        m = pat.search(name)
        if m:
            tags.add("by-" + m.group(1).lower())
            break

    # theme / subject keywords
    for kw in KEYWORDS:
        if kw in lower:
            tags.add(kw)

    # embedded resolutions like 3840x2400 count as a tag too
    m = re.search(r"(\d{3,5})x(\d{3,5})", lower)
    if m:
        tags.add(m.group(0))

    return sorted(tags)


def main() -> None:
    db: dict[str, dict] = {}
    for bin_dir, _ in BINS.items():
        path = os.path.join(ROOT, bin_dir)
        for entry in sorted(os.listdir(path)):
            ext = os.path.splitext(entry)[1].lower()
            if ext not in EXTS:
                continue
            full = os.path.join(path, entry)
            db[entry] = {
                "filename": entry,
                "dir": bin_dir,
                "size": os.path.getsize(full),
                "ext": ext.lstrip("."),
                "tags": derive_tags(entry, bin_dir),
            }

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(db, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print(f"wrote {len(db)} wallpapers -> {OUT}")


if __name__ == "__main__":
    main()
