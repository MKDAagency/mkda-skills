#!/usr/bin/env python3
"""Make a 16:9 PDF from proposal.template.html, plus preview sheets.

Usage: build.py <source_folder> <output.pdf> [--profile profile.md] [--title "..."]
"""
import argparse, base64, html, io, json, mimetypes, os, re, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, SCALE = 1280, 720, 2


def frontmatter(path):
    text = open(os.path.expanduser(path), encoding="utf-8").read()
    m = re.match(r"﻿?---\s*\n(.*?)\n---", text, re.S)
    rows = re.findall(r"^(\w+):[ \t]*(.*)$", m.group(1) if m else "", re.M)
    return {k: v.strip().strip("\"'") for k, v in rows}


def data_uri(path):
    mime = mimetypes.guess_type(path)[0] or "image/png"
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def render_html(src, prof):
    tpl = open(os.path.join(src, "proposal.template.html"), encoding="utf-8").read()
    fonts = json.load(open(os.path.join(SKILL, "assets", "fonts.json"), encoding="utf-8"))
    missing = []

    def img(m):
        f = os.path.join(src, "assets", "img", m.group(1))
        if os.path.isfile(f):
            return data_uri(f)
        missing.append(m.group(0))
        return ""

    def logo(m):
        f = os.path.expanduser(prof.get(m.group(1).lower(), ""))
        brand = html.escape(prof.get("brand", ""))
        if f and os.path.isfile(f):
            return f'<img class="logo" src="{data_uri(f)}" alt="{brand}">'
        if f:
            missing.append(f"{m.group(1)}: {f}")
        return f'<span class="logo-text">{brand}</span>'

    out = re.sub(r"\{\{IMG:([\w. \-]+)\}\}", img, tpl)
    out = re.sub(r"\{\{(LOGO_LIGHT|LOGO_DARK)\}\}", logo, out)
    out = re.sub(r"\{\{FONT:(\w+)\}\}", lambda m: fonts.get(m.group(1), m.group(0)), out)
    for k in ("brand", "author", "email", "phone", "website", "color_background", "color_text", "color_accent", "color_dark"):
        out = out.replace("{{%s}}" % k.upper(), html.escape(prof.get(k, "")) if prof.get(k) else {
            "color_background": "#F6F4F0", "color_text": "#17181C", "color_accent": "#2F5BD8", "color_dark": "#14161D"}.get(k, ""))
    left = missing + re.findall(r"\{\{[^}]+\}\}", out)
    if left:
        sys.exit(f"unresolved: {left}")
    path = os.path.join(src, "proposal.html")
    open(path, "w", encoding="utf-8").write(out)
    return path


def render_pdf(path, pdf, title, author):
    try:
        from pathlib import Path
        from PIL import Image
        from playwright.sync_api import sync_playwright
        from pypdf import PdfReader, PdfWriter
    except ImportError as e:
        sys.exit(f"missing {e.name}: see 'Build and check' in SKILL.md")
    images, bad = [], []
    # one screenshot per slide: Chromium's page.pdf() scales 16:9 pages badly
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=SCALE)
        page.goto(Path(path).resolve().as_uri())
        page.evaluate("document.fonts.ready.then(() => 1)")
        page.wait_for_timeout(500)
        for i, el in enumerate(page.query_selector_all(".page"), 1):
            box = el.bounding_box()
            if not box or (round(box["width"]), round(box["height"])) != (W, H):
                bad.append(f"page {i}: size {box}")
            bad += [f"page {i}: text cut or over the footer: {t}" for t in el.evaluate(
                """s => { const r = s.getBoundingClientRect(), f = s.querySelector('.foot,.sign');
                const low = f ? f.getBoundingClientRect().top : r.bottom;
                return [...s.querySelectorAll('h1,h2,h3,h4,p,li,td,b,.lbl,.eur,.n,.t')].filter(e => {
                  if (e.closest('.foot,.sign') || !e.textContent.trim()) return false;
                  const q = e.getBoundingClientRect();
                  return q.bottom > low + 1 || q.right > r.right + 1 || q.left < r.left - 1 || q.top < r.top - 1 || e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).display !== 'inline';
                }).map(e => e.textContent.trim().slice(0, 50)); }""")]
            images.append(Image.open(io.BytesIO(el.screenshot())).convert("RGB"))
        b.close()
    if not images:
        sys.exit('no <section class="page"> found')
    if bad:
        sys.exit("TO FIX:\n - " + "\n - ".join(bad))
    os.makedirs(os.path.dirname(os.path.abspath(pdf)), exist_ok=True)
    images[0].save(pdf, save_all=True, append_images=images[1:], resolution=96.0 * SCALE)
    w = PdfWriter()
    for pg in PdfReader(pdf).pages:
        w.add_page(pg)
    w.add_metadata({"/Title": title, "/Author": author})
    with open(pdf + ".tmp", "wb") as f:
        w.write(f)
    os.replace(pdf + ".tmp", pdf)
    for k in range(0, len(images), 4):
        sheet = Image.new("RGB", (W * 2 + 10, H * 2 + 10), "white")
        for i, im in enumerate(images[k:k + 4]):
            sheet.paste(im.resize((W, H)), ((i % 2) * (W + 10), (i // 2) * (H + 10)))
        out = os.path.join(os.path.dirname(path), f"preview-{k // 4 + 1}.jpg")
        sheet.save(out, quality=85)
        print("preview:", out)
    return len(images)


if __name__ == "__main__":
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("src"); a.add_argument("pdf")
    a.add_argument("--profile", default=os.path.join(os.environ.get("MKDA_HOME", "~/MKDA"), "profile.md"))
    a.add_argument("--title", default="Proposal")
    o = a.parse_args()
    if os.path.exists(o.pdf):
        sys.exit(f"{o.pdf} already exists: use a new version number")
    try:
        prof = frontmatter(o.profile)
        page = render_html(os.path.abspath(o.src), prof)
    except OSError as e:
        sys.exit(f"cannot read: {e}")
    n = render_pdf(page, o.pdf, o.title, prof.get("author") or prof.get("brand", ""))
    print(f"OK: {o.pdf} ({n} pages)")
