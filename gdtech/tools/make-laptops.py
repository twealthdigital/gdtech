"""Draws the Laptops collection renders (three-quarter view, transparent background).

Run from the project root:  python tools/make-laptops.py
Needs:  pip install cairosvg pillow
Writes: source-images/laptops-<brand>.png  (full size, transparent)
        public/laptops/<brand>.webp        (760px tall, tight crop, like public/phones)
"""
import io, os
import cairosvg
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(ROOT, "source-images"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "public", "laptops"), exist_ok=True)

# Base footprint (top face of the keyboard deck) and the screen's "up" vector
FL, FR, BR, BL = (110, 610), (650, 696), (840, 540), (300, 454)
UP = (-26, -430)
THICK = 24

def lerp(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
def deck(u, v):  # u: left->right, v: front->back
    p = lerp(FL, FR, u)
    return (p[0] + (BL[0] - FL[0]) * v, p[1] + (BL[1] - FL[1]) * v)
def scr(u, w):   # u: left->right, w: bottom->top of the lid
    p = lerp(BL, BR, u)
    return (p[0] + UP[0] * w, p[1] + UP[1] * w)
def pts(*ps): return " ".join(f"{x:.1f},{y:.1f}" for x, y in ps)

BRANDS = {
    #            deck top     deck front  deck side   bezel      key        key-top    wallpaper (a, b, c)                 accent
    "apple":  dict(top="#dfe1e5", front="#b9bcc2", side="#a3a6ad", bezel="#0b0b0d", key="#16161a", keytop="#23232a", wp=("#1b2a8f", "#7a3df0", "#ff7ab6"), acc="#ffffff", notch=True, thin=0.018),
    "dell":   dict(top="#c9ced6", front="#9ba1ab", side="#868c96", bezel="#08090b", key="#101216", keytop="#1d2026", wp=("#052a63", "#0a74da", "#7fd0ff"), acc="#0a74da", notch=False, thin=0.012),
    "hp":     dict(top="#e9ebef", front="#c3c7ce", side="#adb2ba", bezel="#0d0e10", key="#1a1c20", keytop="#2a2d33", wp=("#0b3d6e", "#1aa3c8", "#bdf2ff"), acc="#1aa3c8", notch=False, thin=0.02),
    "lenovo": dict(top="#3a3d44", front="#1e2025", side="#15161a", bezel="#050506", key="#0b0c0e", keytop="#191b1f", wp=("#3a0a0a", "#d11a2a", "#ff8a4c"), acc="#e2231a", notch=False, thin=0.02),
    "asus":   dict(top="#3d4658", front="#252b38", side="#1b202a", bezel="#07080a", key="#0e1016", keytop="#1b1f29", wp=("#2a0b4d", "#ff5a1f", "#ffc23d"), acc="#ff5a1f", notch=False, thin=0.012),
    "acer":   dict(top="#d4d8de", front="#a8adb6", side="#929aa3", bezel="#0a0b0d", key="#14161a", keytop="#23262c", wp=("#06361f", "#16b364", "#c8ffd9"), acc="#16b364", notch=False, thin=0.02),
}

def build_svg(name, c):
    o = []
    A = o.append
    A('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 800" width="1920" height="1600">')
    A('<defs>')
    A(f'<linearGradient id="wp" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="{c["wp"][0]}"/><stop offset=".55" stop-color="{c["wp"][1]}"/><stop offset="1" stop-color="{c["wp"][2]}"/></linearGradient>')
    A(f'<radialGradient id="blob1" cx=".3" cy=".75" r=".6"><stop offset="0" stop-color="{c["wp"][2]}" stop-opacity=".95"/><stop offset="1" stop-color="{c["wp"][2]}" stop-opacity="0"/></radialGradient>')
    A(f'<radialGradient id="blob2" cx=".8" cy=".2" r=".55"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>')
    A(f'<linearGradient id="deck" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="{c["top"]}"/><stop offset="1" stop-color="#ffffff" stop-opacity=".0"/></linearGradient>')
    A('<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".06"/></linearGradient>')
    A('<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>')
    A('</defs>')

    # ground shadow
    sh = pts((FL[0] - 10, FL[1] + 36), (FR[0] + 10, FR[1] + 38), (BR[0] + 40, BR[1] + 30), (BL[0] - 10, BL[1] + 26))
    A(f'<polygon points="{sh}" fill="#000" opacity=".38" filter="url(#soft)"/>')

    # deck: side faces
    A(f'<polygon points="{pts(FL, FR, (FR[0], FR[1] + THICK), (FL[0], FL[1] + THICK))}" fill="{c["front"]}"/>')
    A(f'<polygon points="{pts(FR, BR, (BR[0], BR[1] + THICK), (FR[0], FR[1] + THICK))}" fill="{c["side"]}"/>')
    # front lip highlight
    A(f'<polyline points="{pts(FL, FR)}" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>')
    # deck top
    A(f'<polygon points="{pts(FL, FR, BR, BL)}" fill="{c["top"]}"/>')
    A(f'<polygon points="{pts(FL, FR, BR, BL)}" fill="url(#sheen)"/>')

    # keyboard well
    well = pts(deck(.055, .42), deck(.945, .42), deck(.945, .93), deck(.055, .93))
    A(f'<polygon points="{well}" fill="{c["key"]}"/>')
    rows, cols = 5, 14
    gap = 0.006
    u0, u1, v0, v1 = .065, .935, .435, .915
    cw = (u1 - u0) / cols
    ch = (v1 - v0) / rows
    for r in range(rows):
        for k in range(cols):
            ua, ub = u0 + k * cw + gap, u0 + (k + 1) * cw - gap
            va, vb = v0 + r * ch + gap * 1.6, v0 + (r + 1) * ch - gap * 1.6
            if r == rows - 1 and 3 <= k <= 9:      # space bar
                if k != 3: continue
                ub = u0 + 10 * cw - gap
            A(f'<polygon points="{pts(deck(ua, va), deck(ub, va), deck(ub, vb), deck(ua, vb))}" fill="{c["keytop"]}"/>')
    # speaker slits either side
    for side in (0.0, 1.0):
        for i in range(7):
            u = (.012 + i * .0075) if side == 0 else (.988 - i * .0075)
            A(f'<polyline points="{pts(deck(u, .5), deck(u, .88))}" stroke="{c["key"]}" stroke-opacity=".5" stroke-width="2"/>')
    # trackpad
    tp = pts(deck(.34, .05), deck(.66, .05), deck(.66, .36), deck(.34, .36))
    A(f'<polygon points="{tp}" fill="#fff" fill-opacity=".14" stroke="#000" stroke-opacity=".22" stroke-width="1.6"/>')
    if name == "lenovo":  # red trackpoint
        x, y = deck(.5, .675)
        A(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="{c["acc"]}"/>')

    # hinge
    A(f'<polygon points="{pts(deck(.08, 1.0), deck(.92, 1.0), scr(.92, .012), scr(.08, .012))}" fill="{c["front"]}"/>')

    # lid
    A(f'<polygon points="{pts(scr(0, 0), scr(1, 0), scr(1, 1), scr(0, 1))}" fill="{c["bezel"]}"/>')
    t = c["thin"]
    ui0, ui1, wi0, wi1 = t * 1.2, 1 - t * 1.2, t * 1.5 + .012, 1 - t * 2.2
    disp = (scr(ui0, wi0), scr(ui1, wi0), scr(ui1, wi1), scr(ui0, wi1))
    A(f'<polygon points="{pts(*disp)}" fill="url(#wp)"/>')
    # wallpaper shapes (clipped to display)
    A(f'<clipPath id="dc"><polygon points="{pts(*disp)}"/></clipPath><g clip-path="url(#dc)">')
    A(f'<polygon points="{pts(*disp)}" fill="url(#blob1)"/>')
    A(f'<polygon points="{pts(*disp)}" fill="url(#blob2)"/>')
    cx, cy = scr(.5, .52)
    A(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="150" ry="205" transform="rotate(10 {cx:.1f} {cy:.1f})" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>')
    A(f'<ellipse cx="{cx+40:.1f}" cy="{cy+30:.1f}" rx="95" ry="140" transform="rotate(10 {cx:.1f} {cy:.1f})" fill="#fff" fill-opacity=".12"/>')
    # glass reflection
    A(f'<polygon points="{pts(scr(.0, .0), scr(.55, .0), scr(.9, 1), scr(.0, 1))}" fill="#fff" opacity=".07"/>')
    A('</g>')
    if c["notch"]:
        n0, n1 = scr(.43, wi1 + .003), scr(.57, wi1 + .003)
        n0b, n1b = scr(.43, wi1 - .03), scr(.57, wi1 - .03)
        A(f'<polygon points="{pts(n0, n1, n1b, n0b)}" fill="{c["bezel"]}"/>')
    else:
        x, y = scr(.5, 1 - t * 1.1)
        A(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="#2b2f36"/>')
    # lid edge highlight
    A(f'<polyline points="{pts(scr(0, 1), scr(1, 1))}" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"/>')
    A(f'<polyline points="{pts(scr(1, 0), scr(1, 1))}" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none"/>')
    A('</svg>')
    return "".join(o)

def trim(im, pad=6):
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    l, t, r, b = bbox
    return im.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, im.width), min(b + pad, im.height)))

if __name__ == "__main__":
    for name, c in BRANDS.items():
        png = cairosvg.svg2png(bytestring=build_svg(name, c).encode())
        im = trim(Image.open(io.BytesIO(png)).convert("RGBA"))
        im.save(os.path.join(ROOT, "source-images", f"laptops-{name}.png"))
        h = 760
        w = round(im.width * h / im.height)
        out = im.resize((w, h), Image.LANCZOS)
        out.save(os.path.join(ROOT, "public", "laptops", f"{name}.webp"), "WEBP", quality=90, method=6)
        print(name, w, h)
