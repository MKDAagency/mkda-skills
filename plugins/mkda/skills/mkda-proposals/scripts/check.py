#!/usr/bin/env python3
"""Check a proposal before delivery.

Usage: check.py <source_folder> [file.pdf] [profile.md] [rules.md] ...      check.py --selftest
"""
import html, os, re, sys

RULES = [
    ("—", "em dash"),
    (r"\[[A-Z][A-Z0-9 ,.'/_-]{2,}\]|lorem ipsum", "placeholder left"),
]


def visible(s):
    s = re.sub(r"<!--.*?-->|<style.*?</style>|<script.*?</script>", " ", s, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s)))


def banned(text):
    m = re.match(r"﻿?---\s*\n(.*?)\n---", text, re.S)
    row = re.search(r"^banned:\s*\[(.*)\]", m.group(1) if m else "", re.M)
    return [x.strip().strip("\"'") for x in re.findall(r'\s*(?:"[^"]*"|\'[^\']*\'|[^,]+)', row.group(1)) if x.strip()] if row else []


def problems(text, words):
    t = visible(text)
    rules = RULES + [(r"(?<!\w)" + re.escape(w) + r"(?!\w)", f"banned: {w}") for w in words]
    return [f"{msg}: ...{t[max(0, m.start() - 40):m.end() + 40].strip()}..."
            for rx, msg in rules for m in re.finditer(rx, t, re.I if msg.startswith("banned") else 0)]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if sys.argv[1] == "--selftest":
        assert banned('---\nbanned: [cheap, "a, b"]\n---\n') == ["cheap", "a, b"]
        assert len(problems("<p>Cheap — [CLIENT NAME]</p><style>—</style>", ["cheap"])) == 3
        assert problems("<p>Fine, cheaper</p>", ["cheap"]) == []
        print("selftest ok")
        sys.exit()
    pdf = [x for x in sys.argv[2:] if x.lower().endswith(".pdf")]
    words = [w for f in sys.argv[2:] if f not in pdf and os.path.exists(f) for w in banned(open(f, encoding="utf-8").read())]
    err = problems(open(os.path.join(sys.argv[1], "proposal.template.html"), encoding="utf-8").read(), words)
    for f in pdf:
        from pypdf import PdfReader
        for i, p in enumerate(PdfReader(f).pages, 1):
            if abs(float(p.mediabox.width) / float(p.mediabox.height) - 16 / 9) > 0.01:
                err.append(f"page {i} is not 16:9")
    print("TO FIX:\n - " + "\n - ".join(err) if err else "OK: no problem found")
    sys.exit(1 if err else 0)
