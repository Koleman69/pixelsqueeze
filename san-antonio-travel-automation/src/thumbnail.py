"""Generate a 1280x720 YouTube thumbnail: a stock still (or a frame pulled
from stock video) with a dark gradient for legibility, bold overlay text,
and a small channel badge."""

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

THUMB_SIZE = (1280, 720)

_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for candidate in _FONT_CANDIDATES:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size=size)


def _extract_frame(video_path: Path, out_path: Path, at_seconds: float = 1.0) -> Path:
    subprocess.run(
        [
            "ffmpeg", "-y", "-ss", str(at_seconds), "-i", str(video_path),
            "-frames:v", "1", str(out_path),
        ],
        check=True, capture_output=True,
    )
    return out_path


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def build_thumbnail(background_path: Path, thumbnail_text: str, out_path: Path, channel_name: str) -> Path:
    if background_path.suffix.lower() in (".mp4", ".mov", ".webm"):
        frame_path = out_path.with_suffix(".frame.jpg")
        background_path = _extract_frame(background_path, frame_path)

    img = Image.open(background_path).convert("RGB")
    img.thumbnail((THUMB_SIZE[0] * 2, THUMB_SIZE[1] * 2))

    # Cover-crop to exactly 1280x720.
    target_ratio = THUMB_SIZE[0] / THUMB_SIZE[1]
    w, h = img.size
    current_ratio = w / h
    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        img = img.crop(((w - new_w) // 2, 0, (w - new_w) // 2 + new_w, h))
    else:
        new_h = int(w / target_ratio)
        img = img.crop((0, (h - new_h) // 2, w, (h - new_h) // 2 + new_h))
    img = img.resize(THUMB_SIZE)

    # Dark gradient across the bottom two-thirds for text legibility.
    gradient = Image.new("L", (1, THUMB_SIZE[1]), color=0)
    for y in range(THUMB_SIZE[1]):
        frac = max(0.0, (y - THUMB_SIZE[1] * 0.25) / (THUMB_SIZE[1] * 0.75))
        gradient.putpixel((0, y), int(180 * frac))
    gradient = gradient.resize(THUMB_SIZE)
    overlay = Image.new("RGB", THUMB_SIZE, (0, 0, 0))
    img = Image.composite(overlay, img, gradient)

    draw = ImageDraw.Draw(img)

    # Channel badge, top-left.
    badge_font = _load_font(34)
    badge_text = channel_name.upper()
    draw.rectangle([30, 30, 30 + draw.textlength(badge_text, font=badge_font) + 40, 90], fill=(200, 40, 30))
    draw.text((50, 40), badge_text, font=badge_font, fill=(255, 255, 255))

    # Headline text, bottom-left, wrapped, with a subtle outline for pop.
    headline_font = _load_font(78)
    max_text_width = THUMB_SIZE[0] - 100
    lines = _wrap_text(draw, thumbnail_text.upper(), headline_font, max_text_width)
    line_height = 90
    total_height = line_height * len(lines)
    y = THUMB_SIZE[1] - total_height - 50

    for line in lines:
        for dx, dy in ((-3, -3), (-3, 3), (3, -3), (3, 3)):
            draw.text((50 + dx, y + dy), line, font=headline_font, fill=(0, 0, 0))
        draw.text((50, y), line, font=headline_font, fill=(255, 220, 60))
        y += line_height

    img.save(out_path, quality=92)
    return out_path
