#!/usr/bin/env python3
"""Turn a notebook photo into a transparent ink-only PNG.

usage: clean_handwriting.py in.jpg out.png [--pad 24]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def clean(src: str, dst: str, pad: int = 24) -> None:
    img = Image.open(src).convert("L")
    if max(img.size) > 2400:
        img.thumbnail((2400, 2400), Image.LANCZOS)
    g = np.asarray(img, dtype=np.float32)

    # local paper level -> adaptive threshold
    paper = ndimage.uniform_filter(g, size=51)
    ink_mask = g < (paper - 18)

    lab, n = ndimage.label(ink_mask)
    if n:
        h, w = ink_mask.shape
        border = np.zeros_like(ink_mask)
        border[0, :] = border[-1, :] = True
        border[:, 0] = border[:, -1] = True
        objs = ndimage.find_objects(lab)
        sizes = ndimage.sum(ink_mask, lab, range(1, n + 1))
        touching = set(np.unique(lab[border])) - {0}
        for i, sl in enumerate(objs, start=1):
            bh = sl[0].stop - sl[0].start
            bw = sl[1].stop - sl[1].start
            area = bh * bw
            fill = sizes[i - 1] / max(area, 1)
            big = area > 0.05 * h * w
            streak = max(bh, bw) > 0.6 * max(h, w) and fill < 0.12
            if (i in touching and big) or streak or sizes[i - 1] < 12:
                ink_mask[lab == i] = False

    # soft alpha from luminance, only where ink survived
    floor = np.percentile(g[ink_mask], 5) if ink_mask.any() else 0.0
    alpha = np.clip((paper - g) / max(paper.mean() - floor, 1.0), 0, 1)
    alpha = np.where(ink_mask, alpha, 0.0)

    ys, xs = np.nonzero(alpha > 0.08)
    if len(ys):
        y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, alpha.shape[0])
        x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, alpha.shape[1])
        alpha = alpha[y0:y1, x0:x1]

    a = (alpha * 255).astype(np.uint8)
    ink = np.zeros((*a.shape, 4), dtype=np.uint8)
    ink[..., 0:3] = 26  # near-black ink
    ink[..., 3] = a
    Image.fromarray(ink, "RGBA").save(dst)
    print(f"wrote {dst} {ink.shape[1]}x{ink.shape[0]}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    pad = 24
    if "--pad" in sys.argv:
        pad = int(sys.argv[sys.argv.index("--pad") + 1])
    clean(args[0], args[1], pad)
