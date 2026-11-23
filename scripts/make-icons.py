"""Draws the app icons (Σ* monogram on the accent blue) into public/. Run: python3 scripts/make-icons.py"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
BG = (31, 78, 140)      # --accent
FG = (248, 246, 241)    # --paper

def icon(size, path, maskable=False, rounded=False):
    scale = 4
    s = size * scale
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.22), fill=BG)
    else:
        d.rectangle((0, 0, s, s), fill=BG)
    # maskable icons keep content inside the central 80% safe zone
    text_h = s * (0.42 if maskable else 0.52)
    font = ImageFont.truetype(FONT, int(text_h))
    label = "Σ*"
    box = d.textbbox((0, 0), label, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text(((s - w) / 2 - box[0], (s - h) / 2 - box[1] + s * 0.02), label, font=font, fill=FG)
    im = im.resize((size, size), Image.LANCZOS)
    im.save(os.path.join(OUT, path))

icon(192, "icon-192.png")
icon(512, "icon-512.png")
icon(512, "icon-maskable-512.png", maskable=True)
icon(180, "apple-touch-icon.png")
icon(64, "icon-64.png", rounded=True)
print("icons written")
