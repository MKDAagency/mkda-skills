#!/usr/bin/env python3
"""Check a batch of scripts against the basics and the user's layer.

Usage: check.py <scripts.json> [profile.md] [client.md] [rules.md] ...   (later files win; banned words add up)
       check.py --selftest
Exit code 1 if there is a problem.
"""
import json, re, sys

FIELDS = ["n", "level", "persona", "title", "hook", "body", "closing", "facts", "source", "to_confirm", "shoot_note"]


def frontmatter(text):
    """shortcut: one-line keys only, enough while learning.md keeps that rule."""
    m = re.match(r"﻿?---\s*\n(.*?)\n---", text, re.S)
    out = {}
    for row in (m.group(1) if m else "").splitlines():
        k = re.match(r"(\w+):\s*(.*)", row)
        if k:
            v = k.group(2).strip()
            if v.startswith("[") and v.endswith("]"):
                out[k.group(1)] = [x.strip().strip("\"'") for x in re.findall(r'\s*(?:"[^"]*"|\'[^\']*\'|[^,]+)', v[1:-1]) if x.strip()]
            else:
                out[k.group(1)] = v.strip("\"'")
    return out


def merge(profiles):
    out, banned = {}, []
    for p in profiles:
        b = p.get("banned") or []
        banned += b if isinstance(b, list) else [b]
        out.update({k: v for k, v in p.items() if v not in ("", [])})
    out["banned"] = banned
    return out


def problems(scripts, p):
    err = []
    if not isinstance(scripts, list) or not scripts:
        return ["the json must be a list with at least one script"]
    lo, hi = (int(x) for x in p.get("words", [60, 110]))
    brand, least = p.get("brand", ""), int(p.get("brand_min_mentions", 0))
    for s in scripts:
        n = s.get("n", "?")
        err += [f"{n}: empty or missing field: {f}" for f in FIELDS if not s.get(f)]
        if not isinstance(s.get("body"), list):
            err.append(f"{n}: body must be a list of lines")
            continue
        spoken = " ".join([s.get("hook", ""), *s["body"], s.get("closing", "")])
        seen = f'{s.get("title", "")} {spoken}'
        err += [f"{n}: banned: {b}" for b in ["—", *p["banned"]] if b and re.search(r"(?<!\w)" + re.escape(b) + r"(?!\w)", seen, re.I)]
        count = len(spoken.split())
        if not lo <= count <= hi:
            err.append(f"{n}: {count} words, outside {lo}-{hi}")
        if brand and least and len(re.findall(re.escape(brand), spoken, re.I)) < least:
            err.append(f"{n}: {brand} mentioned fewer than {least} times")
    return err


def selftest():
    p = merge([frontmatter('---\nbanned: [cheap]\nbrand: Acme\n---\n'), frontmatter('---\nbanned: [x1, "a, b"]\nbrand_min_mentions: 2\nwords: [3, 30]\n---\n')])
    assert p["banned"] == ["cheap", "x1", "a, b"] and p["brand"] == "Acme"
    ok = {f: "x" for f in FIELDS} | {"hook": "Acme helps you.", "body": ["With Acme it is quicker."], "closing": "Visit us."}
    assert problems([ok], p) == [], problems([ok], p)
    e = " ".join(problems([ok | {"hook": "Cheap — today."}], p))
    assert "banned: cheap" in e and "banned: —" in e and "fewer than 2" in e, e
    assert not any("banned" in x for x in problems([ok | {"hook": "Acme is cheaper."}], p))
    assert problems({}, p) and problems([ok | {"body": "text"}], p)
    print("selftest ok")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if sys.argv[1] == "--selftest":
        selftest()
        sys.exit()
    try:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
        prof = merge([frontmatter(open(f, encoding="utf-8").read()) for f in sys.argv[2:]])
    except (OSError, ValueError) as e:
        sys.exit(f"cannot read: {e}")
    err = problems(data, prof)
    print("\n".join(err) or "all ok")
    sys.exit(1 if err else 0)
