#!/usr/bin/env python3
"""Download images the user may use and prepare light copies.

Usage: get_images.py <source_folder> URL [URL ...]
"""
import io, os, re, sys, urllib.parse, urllib.request

MAX = 25 * 1024 * 1024

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    from PIL import Image
    out_dir = os.path.join(sys.argv[1], "assets", "img")
    os.makedirs(out_dir, exist_ok=True)
    for i, url in enumerate(sys.argv[2:], 1):
        try:
            if urllib.parse.urlparse(url).scheme not in ("http", "https"):
                raise ValueError("only http and https")
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=30).read(MAX + 1)
            if len(data) > MAX:
                raise ValueError("larger than 25 MB")
            im = Image.open(io.BytesIO(data))
            im.load()
        except Exception as e:
            print(f"SKIPPED {url}: {e}")
            continue
        base = os.path.splitext(os.path.basename(urllib.parse.urlparse(url).path))[0]
        base = f"{i:02d}-" + (re.sub(r"[^\w-]+", "-", base).strip("-")[:50] or "image")
        im.thumbnail((1800, 1800))
        alpha = im.mode in ("RGBA", "LA", "P")
        name = base + (".png" if alpha else ".jpg")
        (im if alpha else im.convert("RGB")).save(os.path.join(out_dir, name), quality=84)
        print(f"{name}  {im.size[0]}x{im.size[1]}")
