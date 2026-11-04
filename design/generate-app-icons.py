"""Build every app icon asset from the brand wordmark.

Source: assets/logo-me-source.jpg (1024x1024, dark wordmark on white).
Run from the project root: python3 design/generate-app-icons.py
"""
from PIL import Image, ImageOps
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "logo-me-source.jpg")
A = lambda *p: os.path.join(ROOT, "assets", *p)

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Android adaptive icons: the image is 108dp, the guaranteed-visible safe zone is a 66dp
# circle. A wordmark is wide, so it has to be inscribed in that circle, not in a square.
SAFE_FRACTION = 66 / 108


def load_mark():
    """The wordmark cropped to its ink, plus an alpha mask taken from its darkness."""
    src = Image.open(SRC).convert("RGB")
    gray = src.convert("L")
    # Alpha from darkness: white paper becomes transparent, the ink stays opaque.
    alpha = gray.point(lambda v: max(0, min(255, int((235 - v) * 6))))
    mark = src.copy()
    mark.putalpha(alpha)
    return mark.crop(alpha.getbbox())


def place(mark, canvas_size, target_width, background=None):
    """Center the mark on a square canvas at the given ink width."""
    w, h = mark.size
    scaled = mark.resize((round(target_width), round(target_width * h / w)), Image.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (background or (0, 0, 0, 0)))
    canvas.paste(scaled, ((canvas_size - scaled.width) // 2,
                          (canvas_size - scaled.height) // 2), scaled)
    return canvas


def inscribed_width(mark, canvas_size):
    """Widest the mark can be and still sit inside the adaptive-icon safe circle."""
    aspect = mark.size[0] / mark.size[1]
    diameter = canvas_size * SAFE_FRACTION
    return diameter * aspect / (1 + aspect ** 2) ** 0.5


def recolor(mark, color):
    """Same silhouette, one flat colour, original alpha kept for the E's lighter weight."""
    flat = Image.new("RGBA", mark.size, color + (255,))
    flat.putalpha(mark.getchannel("A"))
    return flat


def save(image, path, background=None):
    if background is not None:
        flat = Image.new("RGB", image.size, background)
        flat.paste(image, (0, 0), image)
        image = flat
    image.save(path)
    print(os.path.relpath(path, ROOT))


mark = load_mark()
print(f"ink bbox {mark.size[0]}x{mark.size[1]}, aspect {mark.size[0] / mark.size[1]:.3f}")

# iOS, three layers. Light keeps the original gradient; dark and tinted invert to white ink.
save(place(mark, 1024, 1024 * 0.74), A("icon-ios-light.png"), WHITE)
save(place(recolor(mark, WHITE), 1024, 1024 * 0.74), A("icon-ios-dark.png"), BLACK)
save(place(recolor(mark, WHITE), 1024, 1024 * 0.74), A("icon-ios-tinted.png"), BLACK)

# Top-level icon: the fallback Expo uses for web and anything without a platform layer.
save(place(mark, 1024, 1024 * 0.74), A("icon.png"), WHITE)
save(place(mark, 48, 48 * 0.80), A("favicon.png"), WHITE)

# Android adaptive. Foreground and monochrome stay inside the safe circle.
save(place(mark, 512, inscribed_width(mark, 512)), A("android-icon-foreground.png"))
save(Image.new("RGBA", (512, 512), WHITE + (255,)), A("android-icon-background.png"), WHITE)
save(place(recolor(mark, BLACK), 432, inscribed_width(mark, 432)), A("android-icon-monochrome.png"))
