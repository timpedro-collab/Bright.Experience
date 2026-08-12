#!/usr/bin/env python3
"""One-off: trim the baked-in navy deck frames off the Europa gallery photos.

The source JPEGs under public/catalog/machines/europa/ were exported from a
slide deck and carry a dark-navy border (and rounded photo corners) baked into
the pixels. This writes cleaned copies to public/partners/nrs/gallery/ for the
partner pricing microsite, leaving the catalog originals untouched.
"""
from PIL import Image
import os

SRC = "public/catalog/machines/europa"
DST = "public/partners/nrs/gallery"

def is_frame(px):
    r, g, b = px[:3]
    # Dark navy: low brightness, blue-dominant
    return (r + g + b) < 210 and b >= r

def trim_box(im):
    w, h = im.size
    px = im.load()

    def row_is_frame(y):
        hits = sum(1 for x in range(0, w, 2) if is_frame(px[x, y]))
        return hits / (w // 2) > 0.88

    def col_is_frame(x):
        hits = sum(1 for y in range(0, h, 2) if is_frame(px[x, y]))
        return hits / (h // 2) > 0.88

    top = 0
    while top < h // 3 and row_is_frame(top):
        top += 1
    bottom = h - 1
    while bottom > 2 * h // 3 and row_is_frame(bottom):
        bottom -= 1
    left = 0
    while left < w // 3 and col_is_frame(left):
        left += 1
    right = w - 1
    while right > 2 * w // 3 and col_is_frame(right):
        right -= 1
    return left, top, right + 1, bottom + 1

# Per-file extra insets (l, t, r, b) after auto-trim: kills rounded-corner
# arcs (~14px radius) and, for 05, a sliver of a neighbouring deck photo.
EXTRA = {
    "01-hero-pelion.jpg": (12, 12, 12, 12),
    "02-costa-cup.jpg": (12, 12, 12, 12),
    "04-pepsi.jpg": (12, 12, 12, 12),
    "05-play-to-win.jpg": (64, 12, 12, 12),
}

os.makedirs(DST, exist_ok=True)
for name, (el, et, er, eb) in EXTRA.items():
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    l, t, r, b = trim_box(im)
    box = (l + el, t + et, r - er, b - eb)
    out = im.crop(box)
    out.save(os.path.join(DST, name), quality=88)
    print(f"{name}: {im.size} -> trim {(l, t, r, b)} -> final {out.size}")
