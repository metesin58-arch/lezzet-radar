"""Lezzet Radar app icons: a white map pin with radar arcs on the accent color.

Usage: python3 scripts/make-icons.py   (writes to public/icons/ and src/app/)
"""
from pathlib import Path
from PIL import Image, ImageDraw

ACCENT = (232, 69, 44, 255)
WHITE = (255, 255, 255, 255)
ROOT = Path(__file__).resolve().parent.parent
S = 1024  # drawn at high resolution, then downscaled


def draw_mark(d: ImageDraw.ImageDraw, cx: float, cy: float, k: float) -> None:
    """Pin + radar arcs. k: scale (1 = full size for a 1024 canvas)."""
    r = 190 * k
    tip = cy + 330 * k
    head_cy = cy - 40 * k
    # pin body: circle + triangle toward the tip
    d.ellipse([cx - r, head_cy - r, cx + r, head_cy + r], fill=WHITE)
    d.polygon([(cx - r * 0.86, head_cy + r * 0.5), (cx + r * 0.86, head_cy + r * 0.5), (cx, tip)], fill=WHITE)
    # inner hole
    ir = 78 * k
    d.ellipse([cx - ir, head_cy - ir, cx + ir, head_cy + ir], fill=ACCENT)
    # radar arcs at the top right
    for i, rad in enumerate((290 * k, 380 * k)):
        w = int(34 * k)
        box = [cx - rad, head_cy - rad, cx + rad, head_cy + rad]
        d.arc(box, start=-75, end=-20, fill=WHITE, width=w)


def icon(maskable: bool) -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle([0, 0, S, S], fill=ACCENT)  # the OS crops it; full bleed
        draw_mark(d, S * 0.47, S * 0.5, 0.72)  # inside the safe zone (80%)
    else:
        d.rounded_rectangle([0, 0, S, S], radius=int(S * 0.22), fill=ACCENT)
        draw_mark(d, S * 0.47, S * 0.5, 0.9)
    return img


def save(img: Image.Image, path: Path, size: int, flatten: bool = False) -> None:
    out = img.resize((size, size), Image.LANCZOS)
    if flatten:  # iOS does not want transparent corners on apple-touch-icon
        bg = Image.new("RGBA", out.size, ACCENT)
        bg.alpha_composite(out)
        out = bg.convert("RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, optimize=True)


normal, mask = icon(False), icon(True)
save(normal, ROOT / "public/icons/icon-192.png", 192)
save(normal, ROOT / "public/icons/icon-512.png", 512)
save(mask, ROOT / "public/icons/icon-maskable-512.png", 512)
save(mask, ROOT / "src/app/apple-icon.png", 180, flatten=True)
save(normal, ROOT / "src/app/icon.png", 64)
print("ikonlar yazıldı")
