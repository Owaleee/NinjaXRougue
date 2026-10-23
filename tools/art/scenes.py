"""Cenários de batalha em 3 camadas (céu, meio, chão), overlays e tela de carregamento.

Paisagens originais pintadas por código (numpy + Pillow), determinísticas.
Arena lógica 1280 × 720; os pés dos lutadores ficam em y = 465 (FLOOR_Y).
"""
from __future__ import annotations

import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1280, 720
FLOOR_Y = 465
K = 2  # supersampling das silhuetas

SCENES = ['estrada_floresta', 'costa_nevoa', 'lago_nevoa', 'ponte', 'acampamento']


# ------------------------------------------------------------------ utilidades
def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)], dtype=np.float32)


def noise2(w, h, cell, seed, wrap=False):
    rs = np.random.RandomState(seed)
    gw, gh = max(2, int(math.ceil(w / cell)) + 1), max(2, int(math.ceil(h / cell)) + 1)
    if wrap:
        g = rs.rand(gh - 1, gw - 1).astype(np.float32)
        g = np.tile(g, (3, 3))
        big = Image.fromarray(g).resize(((gw - 1) * 3 * cell, (gh - 1) * 3 * cell), Image.BICUBIC)
        a = np.array(big)
        oy, ox = (gh - 1) * cell, (gw - 1) * cell
        return a[oy:oy + h, ox:ox + w]
    g = rs.rand(gh, gw).astype(np.float32)
    big = Image.fromarray(g).resize((gw * cell, gh * cell), Image.BICUBIC)
    return np.array(big)[:h, :w]


def fbm2(w, h, cell, seed, octaves=4, wrap=False):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        c = max(2, cell // (2 ** o))
        out += noise2(w, h, c, seed + o * 17, wrap) * amp
        tot += amp
        amp *= 0.5
    return out / tot


def fbm1(n, cell, seed, octaves=4):
    return fbm2(n, 1, cell, seed, octaves)[0] if False else fbm2(n, 8, cell, seed, octaves)[4]


def vgrad(h, w, stops):
    """Degradê vertical: stops = [(y_frac, '#hex'), ...]."""
    ys = np.linspace(0, 1, h)[:, None]
    out = np.zeros((h, w, 3), np.float32)
    for (y0, c0), (y1, c1) in zip(stops, stops[1:]):
        m = (ys >= y0) & (ys <= y1)
        t = np.clip((ys - y0) / max(1e-6, y1 - y0), 0, 1)
        col = hexc(c0)[None, None, :] * (1 - t[..., None]) + hexc(c1)[None, None, :] * t[..., None]
        out = np.where(m[..., None], np.broadcast_to(col, (h, w, 3)), out)
    return out


def rgba_canvas():
    return np.zeros((H, W, 4), np.float32)


def over(dst, color, alpha):
    """Pinta color (H×W×3 ou cor) com alpha (H×W) por cima de dst (RGBA float, alfa 0..1)."""
    a = np.clip(alpha, 0, 1)[..., None]
    col = color if isinstance(color, np.ndarray) and color.ndim == 3 else np.broadcast_to(np.asarray(color, np.float32), dst[..., :3].shape)
    da = dst[..., 3:4]
    out_a = a + da * (1 - a)
    safe = np.where(out_a > 0, out_a, 1)
    dst[..., :3] = (col * a + dst[..., :3] * da * (1 - a)) / safe
    dst[..., 3:4] = out_a
    return dst


def to_img(arr, mode='RGBA'):
    a = arr.copy()
    if mode == 'RGBA':
        a[..., 3] *= 255
        return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return Image.fromarray(np.clip(a[..., :3], 0, 255).astype(np.uint8))


def ridge_mask(base, amp, cell, seed, octaves=5, sharp=False):
    xs = fbm2(W, 8, cell, seed, octaves)[4]
    if sharp:
        xs = 1 - np.abs(xs * 2 - 1)
    y = base - amp * (xs - 0.5) * 2
    rows = np.arange(H)[:, None]
    # borda suave de 1,5 px
    return np.clip((rows - y[None, :]) / 1.5 + 0.5, 0, 1)


class Sil:
    """Silhuetas desenhadas com Pillow em 2× (árvores, rochas, postes)."""

    def __init__(self):
        self.im = Image.new('L', (W * K, H * K), 0)
        self.d = ImageDraw.Draw(self.im)

    def poly(self, pts, v=255):
        self.d.polygon([(x * K, y * K) for x, y in pts], fill=v)

    def circle(self, c, r, v=255):
        self.d.ellipse([(c[0] - r) * K, (c[1] - r) * K, (c[0] + r) * K, (c[1] + r) * K], fill=v)

    def rect(self, x0, y0, x1, y1, v=255):
        self.d.rectangle([x0 * K, y0 * K, x1 * K, y1 * K], fill=v)

    def line(self, pts, w, v=255):
        self.d.line([(x * K, y * K) for x, y in pts], fill=v, width=int(w * K), joint='curve')

    def mask(self, blur=0.0):
        im = self.im.resize((W, H), Image.LANCZOS)
        if blur:
            im = im.filter(ImageFilter.GaussianBlur(blur))
        return np.array(im).astype(np.float32) / 255


def conifer(s: Sil, x, base, h, R, w_frac=0.34):
    tiers = 5
    for k in range(tiers):
        t0 = k / tiers
        y_top = base - h * (0.18 + 0.82 * (1 - t0)) if k else base - h
        y_bot = base - h * (0.12 + 0.62 * (1 - (k + 1) / tiers)) if k < tiers - 1 else base - h * 0.08
        half = h * w_frac * (0.35 + 0.65 * (k + 1) / tiers) * R.uniform(0.85, 1.1)
        y_top = base - h * (1 - 0.18 * k)
        y_bot = base - h * (0.78 - 0.16 * k)
        jag = []
        n = 6
        for j in range(n + 1):
            xx = x - half + 2 * half * j / n
            yy = y_bot + (R.uniform(2, 6) if j % 2 else 0)
            jag.append((xx, yy))
        s.poly([(x + R.uniform(-2, 2), y_top)] + jag[::-1])
    s.rect(x - h * 0.025, base - h * 0.12, x + h * 0.025, base)


def broadleaf(s: Sil, x, base, h, R):
    s.poly([(x - h * 0.04, base), (x - h * 0.025, base - h * 0.55), (x + h * 0.025, base - h * 0.55), (x + h * 0.045, base)])
    for k in range(9):
        a = R.uniform(0, math.pi)
        d = R.uniform(0.05, 0.28) * h
        s.circle((x + math.cos(a) * d * 1.2, base - h * 0.68 - math.sin(a) * d * 0.9), h * R.uniform(0.14, 0.22))


def tint_noise(shape_hw, base_col, var_col, cell, seed, amt=1.0):
    n = fbm2(shape_hw[1], shape_hw[0], cell, seed, 4)
    return hexc(base_col)[None, None, :] * (1 - n[..., None] * amt) + hexc(var_col)[None, None, :] * (n[..., None] * amt)


def fog_band(y, thick, seed, strength, cell=180):
    rows = np.arange(H)[:, None].astype(np.float32)
    band = np.exp(-((rows - y) / thick) ** 2)
    n = fbm2(W, H, cell, seed, 4)
    return np.clip(band * (0.35 + 0.9 * n) * strength, 0, 1)


def finish(arr, darken=1.0):
    arr[..., :3] *= darken
    return arr


# ------------------------------------------------------------------ cenários
def sky_common(stops, seed, clouds=0.25, cloud_col='#c9d2da', cloud_y=0.35):
    sky = vgrad(H, W, stops)
    arr = np.concatenate([sky, np.ones((H, W, 1), np.float32)], axis=2)
    if clouds:
        n = fbm2(W, H, 220, seed, 5)
        rows = np.linspace(0, 1, H)[:, None]
        m = np.clip((n - 0.52) * 3.2, 0, 1) * np.exp(-((rows - cloud_y) / 0.22) ** 2) * clouds
        over(arr, hexc(cloud_col), m)
    return arr


def scene_estrada_floresta():
    R = random.Random(101)
    sky = sky_common([(0, '#2b3a4a'), (0.45, '#5d7480'), (0.62, '#8a9a94'), (1, '#8a9a94')], 11, clouds=0.35, cloud_col='#b8c4c4')
    # montanhas e linha de árvores ao fundo (no céu)
    over(sky, hexc('#56707a'), ridge_mask(300, 70, 300, 12) * 0.9)
    over(sky, hexc('#41575e'), ridge_mask(340, 40, 160, 13) * 1.0)
    s = Sil()
    for k in range(60):
        x = k * 22 + R.uniform(-8, 8)
        conifer(s, x, 400, R.uniform(70, 120), R)
    over(sky, hexc('#2f4440'), s.mask())
    over(sky, hexc('#9fb0a8'), fog_band(395, 26, 14, 0.55))
    # meio: árvores maiores, mais densas nas laterais
    mid = rgba_canvas()
    s2 = Sil()
    for k in range(26):
        x = k * 52 + R.uniform(-20, 20)
        side = min(x, W - x) / (W / 2)
        if side < 0.25 or R.random() < 0.55:
            h = R.uniform(190, 320) * (1.15 - side * 0.3)
            (conifer if R.random() < 0.6 else broadleaf)(s2, x, 452, h, R)
    m2 = s2.mask()
    col = tint_noise((H, W), '#203329', '#2f4a35', 90, 15, 0.8)
    over(mid, col, m2)
    # luz de cima nas copas
    hi = np.clip(m2 - np.roll(m2, 3, axis=0), 0, 1)
    over(mid, hexc('#4f6e4a'), hi * 0.8)
    over(mid, hexc('#8fa39a'), fog_band(440, 22, 16, 0.35) * (m2 > -1))
    # chão: grama, estrada de terra horizontal, borda clara onde os pés pisam
    gnd = rgba_canvas()
    rows = np.arange(H)[:, None].astype(np.float32)
    top = 438 + (fbm2(W, 8, 120, 17, 4)[4] - 0.5) * 10
    grass = np.clip((rows - top[None, :]) / 1.5, 0, 1)
    over(gnd, tint_noise((H, W), '#24361f', '#3a5230', 40, 18, 0.9), grass)
    road_top = 452 + (fbm2(W, 8, 200, 19, 3)[4] - 0.5) * 6
    road_bot = 560 + (fbm2(W, 8, 200, 20, 3)[4] - 0.5) * 16
    road = np.clip((rows - road_top[None, :]) / 1.5, 0, 1) * np.clip((road_bot[None, :] - rows) / 1.5, 0, 1)
    dirt = tint_noise((H, W), '#5a4532', '#7a5f42', 26, 21, 1.0)
    ruts = np.exp(-((rows - 505) / 6) ** 2) * 0.25 + np.exp(-((rows - 535) / 5) ** 2) * 0.2
    dirt = dirt * (1 - ruts[..., None] * (fbm2(W, H, 30, 22, 3)[..., None]))
    over(gnd, dirt, road)
    edge = np.exp(-((rows - (road_top[None, :] + 10)) / 6) ** 2)
    over(gnd, hexc('#a58a63'), edge * road * 0.55)
    # pedrinhas
    s3 = Sil()
    for k in range(70):
        x = R.uniform(0, W)
        y = R.uniform(470, 560)
        s3.circle((x, y), R.uniform(1.2, 3.2))
    over(gnd, hexc('#8c7a62'), s3.mask() * road)
    # grama da frente e tufos
    s4 = Sil()
    for k in range(260):
        x = R.uniform(0, W)
        y = R.uniform(552, 720)
        h = R.uniform(8, 22)
        s4.poly([(x - 3, y), (x + R.uniform(-4, 4), y - h), (x + 3, y)])
    over(gnd, hexc('#1c2b19'), np.clip(s4.mask() + np.clip((rows - road_bot[None, :] - 6) / 3, 0, 1) * 0.0, 0, 1))
    front = np.clip((rows - road_bot[None, :]) / 1.5, 0, 1)
    over(gnd, tint_noise((H, W), '#1b2a18', '#2a3d24', 50, 23, 0.9), front)
    s5 = Sil()
    for k in range(200):
        x = R.uniform(0, W)
        y = R.uniform(440, 456)
        s5.poly([(x - 2, y + 4), (x + R.uniform(-3, 3), y - R.uniform(5, 12)), (x + 2, y + 4)])
    over(gnd, hexc('#2f4529'), s5.mask())
    # arbustos nos cantos (primeiro plano)
    s6 = Sil()
    for cx in (40, 1240):
        for k in range(10):
            s6.circle((cx + R.uniform(-90, 90), 700 + R.uniform(-70, 20)), R.uniform(30, 60))
    over(gnd, hexc('#121c12'), s6.mask())
    return {'ceu': sky, 'meio': mid, 'chao': gnd}


def scene_costa_nevoa():
    R = random.Random(202)
    sky = sky_common([(0, '#2a3442'), (0.5, '#647482'), (0.62, '#8c99a3'), (1, '#8c99a3')], 31, clouds=0.3, cloud_col='#aeb9c2')
    # mar ao fundo
    rows = np.arange(H)[:, None].astype(np.float32)
    sea = np.clip((rows - 360) / 1.5, 0, 1)
    seacol = vgrad(H, W, [(0, '#3c5160'), (0.5, '#3c5160'), (0.7, '#2b3c4a'), (1, '#22303b')])
    waves = fbm2(W, H, 18, 32, 3)
    over(sky, seacol * (0.92 + 0.16 * waves[..., None]), sea)
    over(sky, hexc('#9aa8b2'), np.exp(-((rows - 362) / 3) ** 2) * 0.6 * np.ones((1, W)))
    s = Sil()
    for x, w, h in ((180, 50, 90), (260, 26, 55), (990, 70, 120), (1090, 30, 60)):
        s.poly([(x - w, 362), (x - w * 0.6, 362 - h * 0.7), (x - w * 0.2, 362 - h), (x + w * 0.4, 362 - h * 0.85), (x + w, 362)])
    over(sky, hexc('#4a5a66'), s.mask())
    over(sky, hexc('#a9b5be'), fog_band(355, 40, 33, 0.7))
    mid = rgba_canvas()
    s2 = Sil()
    # falésias nas laterais
    s2.poly([(0, 470), (0, 170), (60, 150), (130, 210), (190, 230), (260, 330), (300, 470)])
    s2.poly([(W, 470), (W, 200), (1200, 180), (1140, 240), (1080, 260), (1010, 360), (980, 470)])
    for k in range(5):
        x = R.uniform(320, 960)
        s2.poly([(x - 40, 455), (x - 20, 420 - R.uniform(0, 30)), (x + 15, 410 - R.uniform(0, 30)), (x + 45, 455)])
    m2 = s2.mask()
    rock = tint_noise((H, W), '#2c3540', '#46525e', 40, 34, 0.9)
    over(mid, rock, m2)
    hi = np.clip(m2 - np.roll(np.roll(m2, 4, axis=0), -3, axis=1), 0, 1)
    over(mid, hexc('#6f7f8c'), hi * 0.7)
    s3 = Sil()
    for x in (40, 110, 1180, 1230):
        conifer(s3, x + R.uniform(-10, 10), 200 + R.uniform(-30, 30), R.uniform(70, 110), R, 0.3)
    over(mid, hexc('#1e2a2c'), s3.mask())
    over(mid, hexc('#b3bec6'), fog_band(430, 40, 35, 0.55))
    gnd = rgba_canvas()
    top = 446 + (fbm2(W, 8, 90, 36, 4)[4] - 0.5) * 14
    ground = np.clip((rows - top[None, :]) / 1.5, 0, 1)
    stone = tint_noise((H, W), '#3a4048', '#555d66', 22, 37, 1.0)
    cracks = fbm2(W, H, 60, 38, 3)
    stone *= (1 - 0.18 * (np.abs(cracks - 0.5) < 0.008)[..., None])
    over(gnd, stone * vgrad(H, W, [(0, '#ffffff'), (0.65, '#ffffff'), (1, '#9a9a9a')]) / 255, ground)
    edge = np.exp(-((rows - (top[None, :] + 14)) / 7) ** 2)
    over(gnd, hexc('#8d98a3'), edge * ground * 0.5)
    # poças
    s4 = Sil()
    for k in range(6):
        x, y = R.uniform(80, 1200), R.uniform(520, 660)
        s4.d.ellipse([(x - 70) * K, (y - 9) * K, (x + 70) * K, (y + 9) * K], fill=255)
    over(gnd, hexc('#5a7184'), s4.mask() * 0.8)
    s5 = Sil()
    for cx in (60, 1220):
        for k in range(6):
            x = cx + R.uniform(-80, 80)
            s5.poly([(x - 60, 720), (x - 30, 640 - R.uniform(0, 40)), (x + 20, 630 - R.uniform(0, 40)), (x + 60, 720)])
    over(gnd, hexc('#1a1f26'), s5.mask())
    over(gnd, hexc('#b3bec6'), fog_band(470, 18, 39, 0.35) * ground)
    return {'ceu': sky, 'meio': mid, 'chao': gnd}


def scene_lago_nevoa():
    R = random.Random(303)
    sky = sky_common([(0, '#25303c'), (0.5, '#5b6b78'), (0.6, '#7e8c96'), (1, '#7e8c96')], 41, clouds=0.2)
    over(sky, hexc('#5c6c78'), ridge_mask(320, 60, 260, 42) * 0.85)
    rows = np.arange(H)[:, None].astype(np.float32)
    lake = np.clip((rows - 345) / 1.5, 0, 1)
    lakecol = vgrad(H, W, [(0, '#6f7f8a'), (0.48, '#6f7f8a'), (0.62, '#3e505c'), (1, '#2a3944')])
    rip = fbm2(W, H, 14, 43, 2)
    over(sky, lakecol * (0.9 + 0.2 * rip[..., None]), lake)
    # reflexos horizontais
    for k in range(40):
        y = R.uniform(350, 450)
        x = R.uniform(0, W)
        ln = R.uniform(30, 140)
        m = np.zeros((H, W), np.float32)
        y0 = int(y)
        m[y0:y0 + 2, int(max(0, x)):int(min(W, x + ln))] = 0.35
        over(sky, hexc('#c2ccd2'), m)
    over(sky, hexc('#c0cad1'), fog_band(345, 34, 44, 0.85))
    mid = rgba_canvas()
    s2 = Sil()
    # árvores secas e juncos nas margens
    for x in (70, 160, 1130, 1220):
        xx = x + R.uniform(-15, 15)
        h = R.uniform(220, 300)
        s2.line([(xx, 455), (xx + R.uniform(-10, 10), 455 - h)], 10)
        for j in range(5):
            y = 455 - h * R.uniform(0.4, 0.95)
            d = R.choice((-1, 1))
            s2.line([(xx, y), (xx + d * R.uniform(30, 70), y - R.uniform(20, 50))], 4)
    for k in range(120):
        x = R.uniform(0, 330) if k % 2 else R.uniform(950, W)
        h = R.uniform(30, 80)
        s2.line([(x, 456), (x + R.uniform(-6, 6), 456 - h)], 2)
    over(mid, hexc('#1f2a2e'), s2.mask())
    over(mid, hexc('#c0cad1'), fog_band(420, 40, 45, 0.6))
    gnd = rgba_canvas()
    top = 448 + (fbm2(W, 8, 150, 46, 3)[4] - 0.5) * 8
    shore = np.clip((rows - top[None, :]) / 1.5, 0, 1)
    over(gnd, tint_noise((H, W), '#2d3a30', '#45523f', 30, 47, 1.0), shore)
    wet = np.exp(-((rows - (top[None, :] + 4)) / 4) ** 2)
    over(gnd, hexc('#8a9aa2'), wet * shore * 0.6)
    s3 = Sil()
    for k in range(240):
        x = R.uniform(0, W)
        y = R.uniform(560, 720)
        s3.poly([(x - 3, y), (x + R.uniform(-5, 5), y - R.uniform(10, 26)), (x + 3, y)])
    front = np.clip((rows - 575) / 40, 0, 1)
    over(gnd, hexc('#1a241c'), np.clip(s3.mask() + front * 0.6, 0, 1))
    over(gnd, hexc('#c0cad1'), fog_band(475, 22, 48, 0.4) * shore)
    return {'ceu': sky, 'meio': mid, 'chao': gnd}


def scene_ponte():
    R = random.Random(404)
    sky = sky_common([(0, '#2a2f40'), (0.45, '#6a6a78'), (0.58, '#a08f86'), (1, '#a08f86')], 51, clouds=0.45, cloud_col='#c8b8ae', cloud_y=0.3)
    rows = np.arange(H)[:, None].astype(np.float32)
    sea = np.clip((rows - 330) / 1.5, 0, 1)
    over(sky, vgrad(H, W, [(0, '#4a5a68'), (0.46, '#4a5a68'), (0.75, '#2a3846'), (1, '#1d2833')]) * (0.9 + 0.2 * fbm2(W, H, 16, 52, 2)[..., None]), sea)
    s = Sil()
    s.poly([(0, 332), (0, 300), (120, 290), (260, 310), (330, 332)])
    s.poly([(W, 332), (W, 296), (1150, 286), (1000, 312), (940, 332)])
    over(sky, hexc('#45505a'), s.mask())
    mid = rgba_canvas()
    s2 = Sil()
    # andaimes e postes da ponte em construção
    for k in range(9):
        x = 40 + k * 150 + R.uniform(-10, 10)
        top = 170 + R.uniform(0, 60)
        s2.rect(x - 6, top, x + 6, 460)
        if k % 2 == 0:
            s2.line([(x, top + 30), (x + 150, top + 120)], 4)
            s2.line([(x + 150, top + 30), (x, top + 120)], 4)
        s2.rect(x - 14, top - 6, x + 14, top + 4)
    s2.line([(0, 250), (W, 238)], 5)
    s2.line([(0, 330), (W, 322)], 4)
    # guindaste rústico
    s2.line([(1080, 460), (1080, 120)], 10)
    s2.line([(1080, 130), (900, 170)], 7)
    s2.line([(930, 166), (930, 260)], 2)
    over(mid, hexc('#2c2521'), s2.mask())
    s3 = Sil()
    for k in range(40):
        x = k * 33
        s3.rect(x, 396, x + 5, 452)
    s3.rect(0, 392, W, 400)
    over(mid, hexc('#3a2f28'), s3.mask())
    over(mid, hexc('#bfb4ad'), fog_band(360, 30, 53, 0.35))
    gnd = rgba_canvas()
    deck = np.clip((rows - 450) / 1.5, 0, 1) * np.clip((580 - rows) / 1.5, 0, 1)
    planks = tint_noise((H, W), '#5b4433', '#7a5c43', 20, 54, 1.0)
    xs = np.arange(W)[None, :]
    seams = (np.mod(xs + (rows - 450) * 0.15, 64) < 2).astype(np.float32)
    planks = planks * (1 - 0.45 * seams[..., None])
    grain = fbm2(W, H, 8, 55, 2)
    planks = planks * (0.85 + 0.3 * grain[..., None])
    over(gnd, planks, deck)
    over(gnd, hexc('#b08e6a'), np.exp(-((rows - 460) / 5) ** 2) * deck * 0.6)
    over(gnd, hexc('#2a1e16'), (np.abs(rows - 578) < 5).astype(np.float32) * np.ones((1, W)))
    below = np.clip((rows - 583) / 1.5, 0, 1)
    over(gnd, vgrad(H, W, [(0, '#1d2833'), (0.8, '#1d2833'), (1, '#121a22')]) * (0.85 + 0.3 * fbm2(W, H, 20, 56, 2)[..., None]), below)
    s4 = Sil()
    for k in range(10):
        x = 60 + k * 130
        s4.rect(x - 10, 580, x + 10, 720)
        s4.line([(x, 600), (x + 130, 700)], 5)
    over(gnd, hexc('#2a201a'), s4.mask())
    s5 = Sil()
    for k in range(14):
        x = k * 98
        s5.rect(x, 610 + (k % 3) * 2, x + 8, 720)
    s5.rect(0, 612, W, 622)
    over(gnd, hexc('#1c1511'), s5.mask())
    return {'ceu': sky, 'meio': mid, 'chao': gnd}


def scene_acampamento():
    R = random.Random(505)
    sky = sky_common([(0, '#0c1020'), (0.5, '#1d2440'), (0.62, '#2a2f48'), (1, '#2a2f48')], 61, clouds=0.15, cloud_col='#3a4060')
    st = Sil()
    for k in range(160):
        st.circle((R.uniform(0, W), R.uniform(0, 300)), R.uniform(0.6, 1.6))
    over(sky, hexc('#dfe6ff'), st.mask() * 0.8)
    mo = Sil()
    mo.circle((1010, 110), 38)
    over(sky, hexc('#e8e4d0'), mo.mask())
    over(sky, hexc('#e8e4d0'), mo.mask(blur=30) * 0.35)
    over(sky, hexc('#1a2236'), ridge_mask(330, 60, 260, 62))
    s = Sil()
    for k in range(60):
        conifer(s, k * 22 + R.uniform(-6, 6), 410, R.uniform(80, 130), R)
    over(sky, hexc('#111a1e'), s.mask())
    mid = rgba_canvas()
    s2 = Sil()
    for k in range(22):
        x = k * 62 + R.uniform(-20, 20)
        if abs(x - 640) < 200:
            continue
        conifer(s2, x, 455, R.uniform(220, 340), R)
    over(mid, hexc('#0d1416'), s2.mask())
    # barraca à esquerda
    s3 = Sil()
    s3.poly([(150, 456), (230, 330), (330, 456)])
    over(mid, hexc('#4a3a2c'), s3.mask())
    s3b = Sil()
    s3b.poly([(230, 456), (230, 360), (270, 456)])
    over(mid, hexc('#1c140e'), s3b.mask())
    # luz quente da fogueira
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    glow = np.exp(-(((xx - 640) / 330) ** 2 + ((yy - 470) / 170) ** 2))
    over(mid, hexc('#f08a24'), glow * 0.28)
    gnd = rgba_canvas()
    rows = yy[:, :1]
    top = 446 + (fbm2(W, 8, 110, 63, 3)[4] - 0.5) * 10
    ground = np.clip((rows - top[None, :]) / 1.5, 0, 1)
    soil = tint_noise((H, W), '#1f1c18', '#332c24', 26, 64, 1.0)
    soil = soil * (1 + glow[..., None] * 0.8) + hexc('#f08a24')[None, None, :] * glow[..., None] * 0.12
    over(gnd, soil, ground)
    over(gnd, hexc('#8a6a48'), np.exp(-((rows - (top[None, :] + 12)) / 6) ** 2) * ground * 0.5)
    # fogueira entre os lutadores (x = 640), atrás da linha dos pés
    f = Sil()
    for k in range(7):
        a = k / 7 * math.pi
        f.circle((640 + math.cos(a) * 40, 470 + math.sin(a) * 8), 9)
    over(gnd, hexc('#4a4440'), f.mask())
    lg = Sil()
    lg.line([(600, 470), (680, 452)], 10)
    lg.line([(600, 452), (680, 470)], 10)
    over(gnd, hexc('#3a2618'), lg.mask())
    fl = Sil()
    for k in range(5):
        x = 640 + (k - 2) * 12
        h = 50 + 20 * math.sin(k * 1.7)
        fl.poly([(x - 14, 462), (x - 4, 462 - h * 0.6), (x + R.uniform(-4, 4), 462 - h), (x + 6, 462 - h * 0.5), (x + 14, 462)])
    over(gnd, hexc('#e4572e'), fl.mask())
    fl2 = Sil()
    for k in range(3):
        x = 640 + (k - 1) * 12
        fl2.poly([(x - 8, 462), (x, 462 - 34 - k * 4), (x + 8, 462)])
    over(gnd, hexc('#ffd36a'), fl2.mask())
    over(gnd, hexc('#ffb347'), np.exp(-(((xx - 640) / 60) ** 2 + ((yy - 440) / 40) ** 2)) * 0.5)
    s4 = Sil()
    for cx in (50, 1230):
        for k in range(8):
            s4.circle((cx + R.uniform(-90, 90), 700 + R.uniform(-60, 20)), R.uniform(30, 55))
    over(gnd, hexc('#080c0c'), s4.mask())
    return {'ceu': sky, 'meio': mid, 'chao': gnd}


BUILDERS = {'estrada_floresta': scene_estrada_floresta, 'costa_nevoa': scene_costa_nevoa, 'lago_nevoa': scene_lago_nevoa,
            'ponte': scene_ponte, 'acampamento': scene_acampamento}


def grade(arr, k=0.82):
    """Escurece e dessatura de leve para casar com a interface (#12141a)."""
    rgb = arr[..., :3]
    lum = rgb.mean(axis=2, keepdims=True)
    rgb = rgb * 0.88 + lum * 0.12
    arr[..., :3] = rgb * k + hexc('#12141a')[None, None, :] * (1 - k) * 0.6
    return arr


def render(name: str) -> dict[str, Image.Image]:
    layers = BUILDERS[name]()
    out = {}
    for k, arr in layers.items():
        arr = grade(arr)
        out[k] = to_img(arr, 'RGB' if k == 'ceu' else 'RGBA')
    return out


# ------------------------------------------------------------------ overlays
def overlays() -> dict[str, Image.Image]:
    n = 512
    f = fbm2(n, n, 128, 71, 5, wrap=True)
    f2 = fbm2(n, n, 64, 72, 4, wrap=True)
    a = np.clip((f * 0.7 + f2 * 0.3 - 0.35) * 1.6, 0, 1) * 0.62
    col = np.zeros((n, n, 4), np.float32)
    col[..., :3] = hexc('#cdd6df')
    col[..., 3] = a
    nevoa = to_img(col)
    # espelhos de gelo: cúpula em volta do jogador (x = 420, pés em 465)
    im = Image.new('RGBA', (W * K, H * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, 'RGBA')
    cx, cy, rx, ry = 420, 330, 250, 120
    mirrors = []
    for j in range(12):
        th = math.pi + j / 12 * 2 * math.pi
        x = cx + math.cos(th) * rx
        y = cy + math.sin(th) * ry
        depth = (math.sin(th) + 1) / 2  # 0 = atrás, 1 = na frente
        mirrors.append((depth, x, y))
    for depth, x, y in sorted(mirrors):
        w, h = 46 + 18 * depth, 120 + 40 * depth
        a_fill = int(60 + 60 * depth)
        box = [(x - w / 2) * K, (y - h / 2 + 30) * K, (x + w / 2) * K, (y + h / 2 + 30) * K]
        d.rectangle(box, fill=(190, 230, 255, a_fill), outline=(232, 248, 255, 220), width=3 * K)
        d.rectangle([box[0] + 6 * K, box[1] + 6 * K, box[2] - 6 * K, box[3] - 6 * K], outline=(127, 185, 224, 160), width=K)
        d.line([(box[0] + 10 * K, box[3] - 14 * K), (box[0] + w * 0.6 * K, box[1] + 12 * K)], fill=(255, 255, 255, 200), width=3 * K)
    esp = im.resize((W, H), Image.LANCZOS)
    return {'overlay_nevoa': nevoa, 'overlay_espelhos_gelo': esp}


# ------------------------------------------------------------------ carregamento
def loading_screen() -> Image.Image:
    """1920 × 1080: noite, lua, montanhas, um ninja em silhueta no penhasco. Espaço livre
    no centro-esquerda para o logo e embaixo para a barra (desenhados pelo código)."""
    LW, LH = 1920, 1080
    R = random.Random(909)
    sky = vgrad(LH, LW, [(0, '#090c16'), (0.55, '#1a2138'), (0.75, '#2a2440'), (1, '#120f1a')])
    arr = np.concatenate([sky, np.ones((LH, LW, 1), np.float32)], axis=2)
    yy, xx = np.mgrid[0:LH, 0:LW].astype(np.float32)
    moon = np.clip((150 - np.hypot(xx - 1420, yy - 300)) / 2, 0, 1)
    halo = np.exp(-(np.hypot(xx - 1420, yy - 300) / 320) ** 2)

    def ov(c, m):
        a = np.clip(m, 0, 1)[..., None]
        arr[..., :3] = arr[..., :3] * (1 - a) + hexc(c) * a

    ov('#3a3550', halo * 0.55)
    ov('#efe6cf', moon)
    crater = fbm2(LW, LH, 40, 91, 3)
    ov('#cfc4aa', moon * np.clip((crater - 0.55) * 4, 0, 1) * 0.5)
    st = np.zeros((LH, LW), np.float32)
    for k in range(320):
        x, y = int(R.uniform(0, LW - 2)), int(R.uniform(0, 700))
        st[y:y + 2, x:x + 2] = R.uniform(0.3, 0.9)
    ov('#dfe6ff', st)
    rows = np.arange(LH)[:, None].astype(np.float32)
    for base, amp, cell, seed, col in ((690, 140, 420, 92, '#232a44'), (790, 110, 260, 93, '#1a1f33'), (880, 70, 160, 94, '#12151f')):
        xs = fbm2(LW, 8, cell, seed, 5)[4]
        y = base - amp * (xs - 0.5) * 2
        ov(col, np.clip((rows - y[None, :]) / 1.5, 0, 1))
        band = np.exp(-((rows - base - 20) / 40) ** 2) * fbm2(LW, LH, 300, seed + 5, 3)
        ov('#4a4f6a', band * 0.35)
    # penhasco à direita
    img = Image.fromarray(np.clip(arr[..., :3], 0, 255).astype(np.uint8)).convert('RGBA')
    sil = Image.new('L', (LW * K, LH * K), 0)
    d = ImageDraw.Draw(sil)
    pts = [(1180, 1080), (1260, 905), (1380, 880), (1560, 872), (1700, 890), (1800, 940), (1920, 960), (1920, 1080)]
    d.polygon([(x * K, y * K) for x, y in pts], fill=255)
    sil = sil.resize((LW, LH), Image.LANCZOS)
    img.paste(Image.new('RGBA', (LW, LH), (8, 9, 14, 255)), (0, 0), sil)
    # ninja em silhueta (o próprio rig, em pose de vigia) sobre o penhasco
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from characters import CHARACTERS, render_view
    from anims import idle
    ch = CHARACTERS['player_semclan']
    p = dict(idle('kunai')[2], ph=0.3, wind=2.2)
    fig = render_view(ch, p, (0, 0, 192), 420)
    a = fig.getchannel('A')
    dark = Image.new('RGBA', fig.size, (6, 7, 12, 255))
    rim = Image.new('RGBA', fig.size, (120, 110, 150, 255))
    shifted = Image.new('L', fig.size, 0)
    shifted.paste(a, (-3, 2))
    rim_mask = Image.fromarray(np.clip(np.array(a).astype(np.int16) - np.array(shifted).astype(np.int16), 0, 255).astype(np.uint8))
    fx0, fy0 = 1330, 872 - int(420 * (178 / 192))
    img.paste(dark, (fx0, fy0), a)
    img.paste(rim, (fx0, fy0), rim_mask)
    # folhas ao vento
    d2 = ImageDraw.Draw(img, 'RGBA')
    for k in range(26):
        x, y = R.uniform(200, 1900), R.uniform(150, 900)
        s = R.uniform(4, 9)
        ang = R.uniform(0, 6.28)
        pts = [(x + math.cos(ang) * s, y + math.sin(ang) * s), (x + math.cos(ang + 1.6) * s * 0.4, y + math.sin(ang + 1.6) * s * 0.4),
               (x - math.cos(ang) * s, y - math.sin(ang) * s), (x - math.cos(ang + 1.6) * s * 0.4, y - math.sin(ang + 1.6) * s * 0.4)]
        d2.polygon(pts, fill=(140, 120, 150, 150))
    # vinheta
    v = np.exp(-(((xx - LW / 2) / (LW * 0.75)) ** 2 + ((yy - LH / 2) / (LH * 0.75)) ** 2))
    base = np.array(img.convert('RGB')).astype(np.float32)
    base *= (0.55 + 0.45 * v)[..., None]
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
