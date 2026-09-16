#!/usr/bin/env python3
"""
Converts typing-prompts.txt into data/snippets.json.

Entry header format expected:
    [id] | language | difficulty

Everything until the next header (or a line of only '=' characters, or EOF)
is treated as that entry's code, with trailing blank lines stripped.

Run this from the project root whenever typing-prompts.txt changes:
    python3 tools/convert_prompts.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "typing-prompts.txt"
DEST = ROOT / "data" / "snippets.json"

HEADER_RE = re.compile(r"^\[(?P<id>[\w-]+)\]\s*\|\s*(?P<lang>\w+)\s*\|\s*(?P<diff>\w+)\s*$")


def parse(text: str):
    lines = text.splitlines()
    entries = []
    current = None
    code_lines = []

    def flush():
        if current is None:
            return
        # strip trailing blank lines, keep internal blank lines intact
        while code_lines and code_lines[-1].strip() == "":
            code_lines.pop()
        entries.append({
            "id": current["id"],
            "language": current["lang"].lower(),
            "difficulty": current["diff"].lower(),
            "code": "\n".join(code_lines),
        })

    for line in lines:
        header_match = HEADER_RE.match(line.strip())
        is_separator = set(line.strip()) == {"="} and len(line.strip()) > 0

        if header_match:
            flush()
            current = header_match.groupdict()
            code_lines.clear()
        elif is_separator:
            flush()
            current = None
            code_lines.clear()
        elif current is not None:
            code_lines.append(line)

    flush()
    return entries


def main():
    text = SRC.read_text(encoding="utf-8")
    entries = parse(text)

    if not entries:
        raise SystemExit("No entries parsed — check typing-prompts.txt formatting.")

    seen_ids = set()
    for e in entries:
        if e["id"] in seen_ids:
            raise SystemExit(f"Duplicate snippet id found: {e['id']}")
        seen_ids.add(e["id"])
        if not e["code"].strip():
            raise SystemExit(f"Snippet {e['id']} has empty code body.")

    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} snippets to {DEST}")

    by_lang = {}
    for e in entries:
        by_lang[e["language"]] = by_lang.get(e["language"], 0) + 1
    for lang, count in sorted(by_lang.items()):
        print(f"  {lang}: {count}")


if __name__ == "__main__":
    main()
