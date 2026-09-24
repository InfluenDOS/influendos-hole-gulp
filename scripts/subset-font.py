"""Rebuild the Noto Sans CJK SC subset used by the game UI.

The full font is not vendored. Download NotoSansCJKsc-Bold.otf from
https://github.com/notofonts/noto-cjk (SIL OFL) and pass its path.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [ROOT / "src", ROOT / "index.html", ROOT / "README.md"]


def collect() -> str:
    chars: set[str] = set()
    files: list[Path] = []
    for source in SOURCES:
        if source.is_dir():
            files.extend(source.rglob("*.ts"))
            files.extend(source.rglob("*.html"))
        elif source.is_file():
            files.append(source)
    for path in files:
        chars.update(ch for ch in path.read_text(encoding="utf-8") if "\u4e00" <= ch <= "\u9fff")
    chars.update("，。、：；！？·「」『』（）【】《》+×—…%￥★☆♪～")
    chars.update(chr(i) for i in range(32, 127))
    return "".join(sorted(chars))


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: subset-font.py /path/to/NotoSansCJKsc-Bold.otf")
    out = ROOT / "public" / "assets" / "fonts" / "NotoSansSC-Bold.woff2"
    payload = collect()
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
        handle.write(payload)
        text_path = handle.name
    subprocess.check_call(
        [
            "pyftsubset",
            sys.argv[1],
            f"--text-file={text_path}",
            f"--output-file={out}",
            "--flavor=woff2",
            "--layout-features=*",
            "--no-hinting",
        ]
    )
    print(f"wrote {out} ({out.stat().st_size} bytes, {len(payload)} chars)")


if __name__ == "__main__":
    main()
