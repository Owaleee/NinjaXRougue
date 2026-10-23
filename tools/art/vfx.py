"""Efeitos visuais de batalha por partículas e formas (Pillow), determinísticos.

Cada efeito é uma função draw(fx, t, i) chamada por quadro (t de 0 a 1). As
partículas nascem de uma semente fixa por efeito, então o resultado é sempre igual.
Cores dos elementos = ELEMENT_COLOR de src/scenes/BattleScene.ts.
"""
from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw, ImageFilter

FOGO, VENTO, RAIO, TERRA, AGUA, NEUTRO = '#e4572e', '#9bd17b', '#f2d04b', '#a47148', '#3f88c5', '#8a8f9c'
SS = 3  # supersampling


def rgb(h):
    if isinstance(h, tuple):
        return h[:3]
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def mixc(a, b, t):
    a, b = rgb(a), rgb(b)
    t = max(0.0, min(1.0, t))
    return tuple(int(a[k] + (b[k] - a[k]) * t) for k in range(3))


def ease_out(t):
    return 1 - (1 - t) ** 3


def ease_in(t):
    return t ** 2


def env(t, a=0.15, b=0.6):
    """Envelope: sobe até a, fica, e some depois de b."""
    if t < a:
        return t / a
    if t > b:
        return max(0.0, 1 - (t - b) / (1 - b))
    return 1.0


class FX:
    """Tela de um quadro. Cada forma é desenhada opaca num calque do tamanho dela e
    composta com a opacidade pedida (mistura correta sobre fundo transparente)."""

    def __init__(self, n: int):
        self.n = n
        self.img = Image.new('RGBA', (n * SS, n * SS), (0, 0, 0, 0))
        self.c = (n / 2, n / 2)

    def P(self, p):
        return (p[0] * SS, p[1] * SS)

    def _blit(self, pts, pad, a, fn):
        a = int(max(0, min(255, a)))
        if a <= 0 or not pts:
            return
        W, H = self.img.size
        x0 = max(0, int(min(p[0] for p in pts) - pad))
        y0 = max(0, int(min(p[1] for p in pts) - pad))
        x1 = min(W, int(max(p[0] for p in pts) + pad) + 1)
        y1 = min(H, int(max(p[1] for p in pts) + pad) + 1)
        if x1 <= x0 or y1 <= y0:
            return
        L = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
        fn(ImageDraw.Draw(L), lambda q: (q[0] - x0, q[1] - y0))
        if a < 255:
            L.putalpha(L.getchannel('A').point(lambda v: v * a // 255))
        self.img.alpha_composite(L, (x0, y0))

    def circle(self, c, r, color, a=255, outline=None, w=0):
        if r <= 0:
            return
        x, y = self.P(c)
        R = r * SS
        Wd = int(max(1, w * SS)) if outline else 0

        def fn(d, T):
            q0, q1 = T((x - R, y - R)), T((x + R, y + R))
            d.ellipse([q0, q1], fill=rgb(color) + (255,) if color else None, outline=rgb(outline) + (255,) if outline else None, width=Wd)
        self._blit([(x - R, y - R), (x + R, y + R)], Wd + 2, a, fn)

    def ellipse(self, c, rx, ry, color, a=255, outline=None, w=0):
        x, y = self.P(c)
        Wd = int(max(1, w * SS)) if outline else 0
        box = [(x - rx * SS, y - ry * SS), (x + rx * SS, y + ry * SS)]

        def fn(d, T):
            d.ellipse([T(box[0]), T(box[1])], fill=rgb(color) + (255,) if color else None, outline=rgb(outline) + (255,) if outline else None, width=Wd)
        self._blit(box, Wd + 2, a, fn)

    def poly(self, pts, color, a=255, outline=None, w=1):
        Q = [self.P(p) for p in pts]
        Wd = int(max(1, w * SS))

        def fn(d, T):
            QQ = [T(q) for q in Q]
            if color:
                d.polygon(QQ, fill=rgb(color) + (255,))
            if outline:
                d.line(QQ + [QQ[0]], fill=rgb(outline) + (255,), width=Wd, joint='curve')
        self._blit(Q, Wd + 2, a, fn)

    def line(self, pts, color, a=255, w=1.0):
        Q = [self.P(p) for p in pts]
        Wd = max(1, int(round(w * SS)))

        def fn(d, T):
            QQ = [T(q) for q in Q]
            col = rgb(color) + (255,)
            d.line(QQ, fill=col, width=Wd, joint='curve')
            for q in (QQ[0], QQ[-1]):
                d.ellipse([q[0] - Wd / 2, q[1] - Wd / 2, q[0] + Wd / 2, q[1] + Wd / 2], fill=col)
        self._blit(Q, Wd + 2, a, fn)

    def glow(self, c, r, color, a=160, blur=0.5):
        a = int(max(0, min(255, a)))
        if a <= 0 or r <= 0:
            return
        x, y = self.P(c)
        R = r * SS
        pad = R * (1 + blur * 3)
        W, H = self.img.size
        x0, y0 = max(0, int(x - pad)), max(0, int(y - pad))
        x1, y1 = min(W, int(x + pad) + 1), min(H, int(y + pad) + 1)
        if x1 <= x0 or y1 <= y0:
            return
        L = Image.new('RGBA', (x1 - x0, y1 - y0), rgb(color) + (0,))
        ImageDraw.Draw(L).ellipse([x - R - x0, y - R - y0, x + R - x0, y + R - y0], fill=rgb(color) + (a,))
        L = L.filter(ImageFilter.GaussianBlur(R * blur))
        self.img.alpha_composite(L, (x0, y0))

    def layer_blur(self, fn, radius):
        """Desenha com fn(sub-FX) num calque separado e borra com alfa pré-multiplicado."""
        sub = FX(self.n)
        fn(sub)
        im = sub.img.convert('RGBa').filter(ImageFilter.GaussianBlur(radius * SS)).convert('RGBA')
        self.img.alpha_composite(im)

    def star(self, c, ro, ri, k, rot, color, a=255, outline=None, w=1):
        pts = []
        for j in range(k * 2):
            r = ro if j % 2 == 0 else ri
            th = math.radians(rot + j * 180 / k)
            pts.append((c[0] + math.cos(th) * r, c[1] + math.sin(th) * r))
        self.poly(pts, color, a, outline, w)

    def arc_band(self, c, r_out, r_in, a0, a1, color, a=255, steps=24, taper=True):
        """Crescente entre dois raios (corte); afina nas pontas."""
        outer, inner = [], []
        for j in range(steps + 1):
            t = j / steps
            th = math.radians(a0 + (a1 - a0) * t)
            k = math.sin(math.pi * t) if taper else 1
            ro = r_in + (r_out - r_in) * (0.15 + 0.85 * k)
            outer.append((c[0] + math.cos(th) * ro, c[1] + math.sin(th) * ro))
            inner.append((c[0] + math.cos(th) * r_in, c[1] + math.sin(th) * r_in))
        self.poly(outer + inner[::-1], color, a)

    def result(self):
        return self.img.convert('RGBa').resize((self.n, self.n), Image.LANCZOS).convert('RGBA')


def rng(seed):
    return random.Random(seed)


# ------------------------------------------------------------------ peças reaproveitadas
def impact(fx, t, color, core='#ffffff', seed=1, scale=1.0, rays=8):
    c = fx.c
    R = rng(seed)
    e = env(t, 0.1, 0.45)
    r = (8 + 34 * ease_out(min(1, t * 1.6))) * scale
    fx.glow(c, r * 0.7, color, 130 * e)
    if t < 0.75:
        fx.star(c, r, r * 0.38, 4 if rays <= 4 else 6, 12 + t * 40, color, 235 * e, outline=None)
        fx.star(c, r * 0.6, r * 0.22, 4 if rays <= 4 else 6, 12 + t * 40, core, 255 * e)
    ring_r = (10 + 50 * ease_out(t)) * scale
    fx.circle(c, ring_r, None, 220 * (1 - t), outline=color, w=max(0.6, 3 * (1 - t)))
    for k in range(rays):
        th = math.radians(k * 360 / rays + R.uniform(-12, 12))
        d0 = (6 + 40 * ease_out(t)) * scale
        d1 = d0 + (14 * (1 - t) + 2) * scale
        fx.line([(c[0] + math.cos(th) * d0, c[1] + math.sin(th) * d0), (c[0] + math.cos(th) * d1, c[1] + math.sin(th) * d1)],
                core if k % 2 else color, 255 * (1 - t), w=2.2 * scale * (1 - t * 0.6))


def smoke(fx, t, base='#b9bdc6', seed=3, n=11, spread=34, rise=18, center=None, size=1.0, dark=0.72):
    c = center or fx.c
    R = rng(seed)
    parts = [(R.uniform(0, 6.283), R.uniform(0.3, 1.0), R.uniform(9, 17), R.uniform(-0.2, 0.2)) for _ in range(n)]
    e = 1 - ease_in(t)

    def draw(sub):
        for ang, dist, rad, sp in parts:
            d = spread * dist * ease_out(min(1, t * 1.3))
            x = c[0] + math.cos(ang) * d
            y = c[1] + math.sin(ang) * d * 0.7 - rise * ease_out(t)
            rr = rad * size * (0.5 + 0.8 * ease_out(t))
            sub.circle((x, y + rr * 0.15), rr, mixc(base, '#30333c', 1 - dark), 235 * e)
            sub.circle((x - rr * 0.18, y - rr * 0.18), rr * 0.75, base, 235 * e)
            sub.circle((x - rr * 0.32, y - rr * 0.34), rr * 0.35, '#ffffff', 90 * e)
    fx.layer_blur(draw, 0.6)


def flame(fx, base, h, w, t, color_a='#fff3a8', color_b=FOGO, color_c='#7a1f12', a=255, sway=0.0):
    """Uma língua de fogo (gota invertida) com 3 tons."""
    x, y = base
    for k, (col, s) in enumerate(((color_c, 1.0), (color_b, 0.78), (color_a, 0.45))):
        hh, ww = h * s, w * s
        tip = (x + sway * hh * 0.4, y - hh)
        pts = []
        for j in range(13):
            th = math.pi * j / 12
            pts.append((x + math.cos(th) * ww / 2, y - math.sin(th) * ww * 0.45 + ww * 0.05))
        pts = [(x - ww / 2, y)] + [(x - ww * 0.42, y - hh * 0.35), (tip[0] - ww * 0.1, tip[1] + hh * 0.25), tip,
                                   (tip[0] + ww * 0.12, tip[1] + hh * 0.3), (x + ww * 0.45, y - hh * 0.35), (x + ww / 2, y)] + \
            [(x + math.cos(math.pi * j / 8) * ww / 2, y + math.sin(math.pi * j / 8) * ww * 0.3) for j in range(9)]
        fx.poly(pts, col, a)


def fireball(fx, c, r, t, tail=1.0, seed=5):
    R = rng(seed)
    fx.glow(c, r * 1.05, FOGO, 120)
    # cauda (para trás, -x)
    for k in range(7):
        ph = (t * 2 + k / 7) % 1
        x = c[0] - r * (0.4 + 1.9 * ph) * tail
        y = c[1] + math.sin(ph * 9 + k) * r * 0.25
        rr = r * (0.75 - 0.6 * ph)
        fx.circle((x, y), rr, mixc('#ffd36a', '#8a2414', ph), 230 * (1 - ph))
    fx.circle(c, r, '#a8301a')
    fx.circle((c[0] + r * 0.08, c[1] - r * 0.05), r * 0.82, FOGO)
    fx.circle((c[0] + r * 0.2, c[1] - r * 0.12), r * 0.55, '#ffb347')
    fx.circle((c[0] + r * 0.3, c[1] - r * 0.18), r * 0.3, '#fff3a8')
    for k in range(6):
        th = t * 6.283 + k * 1.05
        fx.circle((c[0] + math.cos(th) * r * 0.95, c[1] + math.sin(th) * r * 0.95), r * 0.22, '#ffd36a', 200)


def explosion(fx, t, scale=1.0, seed=9):
    c = fx.c
    R = rng(seed)
    e = env(t, 0.05, 0.5)
    rr = (12 + 46 * ease_out(min(1, t * 1.5))) * scale
    fx.glow(c, rr * 0.75, FOGO, 170 * e)
    blobs = [(R.uniform(0, 6.283), R.uniform(0.2, 0.9), R.uniform(0.35, 0.6)) for _ in range(12)]
    for ang, dist, sz in blobs:
        d = rr * dist
        p = (c[0] + math.cos(ang) * d, c[1] + math.sin(ang) * d * 0.85)
        col = mixc('#ffe28a', '#ff7a2a', t * 2.2) if t < 0.45 else mixc('#ff7a2a', '#6a2418', (t - 0.45) / 0.55)
        rad = rr * sz * (1 - t * 0.3)
        fx.circle(p, rad, mixc(col, '#3a1208', 0.45), 255 * (1 - ease_in(t)))
        fx.circle((p[0] - rad * 0.12, p[1] - rad * 0.12), rad * 0.82, col, 255 * (1 - ease_in(t)))
        fx.circle((p[0] - rad * 0.3, p[1] - rad * 0.3), rad * 0.35, mixc(col, '#fff6c8', 0.6), 220 * (1 - ease_in(t)))
    if t < 0.4:
        fx.circle(c, rr * 0.5 * (1 - t / 0.4), '#ffffff', 230)
    for k in range(10):
        ang = R.uniform(0, 6.283)
        d = rr * (0.8 + 0.9 * t)
        p = (c[0] + math.cos(ang) * d, c[1] + math.sin(ang) * d)
        fx.circle(p, 1.6 * scale * (1 - t), '#ffd36a', 255 * (1 - t))
    if t > 0.45:
        smoke(fx, (t - 0.45) / 0.55, base='#5c5658', seed=seed + 1, spread=rr * 0.8, rise=16, size=scale)


def needle(fx, a, b, color='#dfe7ee', alpha=255, w=1.1):
    fx.line([a, b], '#2a2e36', alpha, w + 1.2)
    fx.line([a, b], color, alpha, w)


def kunai_shape(fx, c, ang_deg, ln=40, alpha=255):
    th = math.radians(ang_deg)
    d = (math.cos(th), math.sin(th))
    n = (-d[1], d[0])
    tip = (c[0] + d[0] * ln * 0.55, c[1] + d[1] * ln * 0.55)
    base = (c[0] - d[0] * ln * 0.05, c[1] - d[1] * ln * 0.05)
    hb = (c[0] - d[0] * ln * 0.38, c[1] - d[1] * ln * 0.38)
    ring = (c[0] - d[0] * ln * 0.46, c[1] - d[1] * ln * 0.46)
    fx.line([hb, base], '#1c1a20', alpha, 4.2)
    fx.line([hb, base], '#4a3b2a', alpha, 2.6)
    fx.circle(ring, 3.6, None, alpha, outline='#1c1a20', w=2.6)
    fx.circle(ring, 3.6, None, alpha, outline='#8f97a2', w=1.2)
    bl = [(base[0] + n[0] * 6, base[1] + n[1] * 6), tip, (base[0] - n[0] * 6, base[1] - n[1] * 6)]
    fx.poly(bl, '#aeb7c1', alpha, outline='#1c1a20', w=1.4)
    fx.line([base, tip], '#eef3f8', alpha, 1.0)


def chain_links(fx, pts, color='#c9ced6', dark='#4b505a', alpha=255, size=5.0, phase=0):
    for k in range(len(pts) - 1):
        a, b = pts[k], pts[k + 1]
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
        if (k + phase) % 2 == 0:
            ell = []
            for j in range(16):
                th = 2 * math.pi * j / 16
                x, y = math.cos(th) * size, math.sin(th) * size * 0.55
                r = math.radians(ang)
                ell.append((m[0] + x * math.cos(r) - y * math.sin(r), m[1] + x * math.sin(r) + y * math.cos(r)))
            fx.line(ell + [ell[0]], dark, alpha, 2.8)
            fx.line(ell + [ell[0]], color, alpha, 1.5)
        else:
            fx.line([a, b], dark, alpha, 3.2)
            fx.line([a, b], color, alpha, 1.6)


def shield(fx, c, r, color, a, cracks=0, seed=4):
    pts = [(c[0] + math.cos(math.radians(-90 + k * 60)) * r, c[1] + math.sin(math.radians(-90 + k * 60)) * r * 1.1) for k in range(6)]
    fx.poly(pts, color, a * 0.35, outline=color, w=2.2)
    inner = [(c[0] + (p[0] - c[0]) * 0.7, c[1] + (p[1] - c[1]) * 0.7) for p in pts]
    fx.poly(inner, None, a, outline='#ffffff', w=1.0)
    fx.line([(c[0] - r * 0.4, c[1] - r * 0.5), (c[0] - r * 0.1, c[1] - r * 0.75)], '#ffffff', a * 0.8, 2)
    R = rng(seed)
    for k in range(cracks):
        p = c
        ang = R.uniform(0, 6.283)
        path = [p]
        for j in range(3):
            ang += R.uniform(-0.7, 0.7)
            p = (p[0] + math.cos(ang) * r * 0.33, p[1] + math.sin(ang) * r * 0.33)
            path.append(p)
        fx.line(path, '#1b1d24', a, 2.0)
        fx.line(path, '#ffffff', a * 0.7, 0.8)


def leaf(fx, c, ang, s, color='#7fb85e', a=255):
    th = math.radians(ang)
    d = (math.cos(th), math.sin(th))
    n = (-d[1], d[0])
    pts = [(c[0] - d[0] * s, c[1] - d[1] * s), (c[0] + n[0] * s * 0.45, c[1] + n[1] * s * 0.45), (c[0] + d[0] * s, c[1] + d[1] * s),
           (c[0] - n[0] * s * 0.45, c[1] - n[1] * s * 0.45)]
    fx.poly(pts, color, a, outline='#2b4a22', w=1)


def aura(fx, t, color, light, seed=21, height=150):
    """Aura em loop: línguas de chakra subindo em volta de uma silhueta (elipse do corpo)."""
    c = (fx.c[0], fx.n - 14 - height / 2)
    R = rng(seed)
    tongues = [(R.uniform(-1, 1), R.uniform(0, 1), R.uniform(0.7, 1.2)) for _ in range(16)]

    def draw(sub):
        sub.ellipse(c, height * 0.32, height * 0.5, light, 26)
        for xn, ph0, s in tongues:
            ph = (ph0 + t) % 1
            x = c[0] + xn * height * 0.3 * (1 - 0.25 * ph)
            base_y = c[1] + height * 0.45 - abs(xn) * height * 0.12
            y = base_y - ph * height * 0.95
            h = 40 * s * (1 - ph * 0.45)
            flame(sub, (x, y), h, 17 * s, t, color_a=light, color_b=color, color_c=color, a=190 * math.sin(math.pi * ph), sway=xn * 0.6)
    fx.glow(c, height * 0.36, color, 70)
    fx.layer_blur(draw, 1.6)
    for k in range(6):
        ph = (R.random() + t) % 1
        x = c[0] + R.uniform(-1, 1) * height * 0.38
        y = c[1] + height * 0.5 - ph * height * 1.05
        fx.circle((x, y), 1.8, light, 255 * math.sin(math.pi * ph))


# ------------------------------------------------------------------ efeitos
def fx_hit(fx, t, i):
    impact(fx, t, '#ffe07a', seed=11)


def fx_hit_neutro(fx, t, i):
    impact(fx, t, NEUTRO, core='#f2f3f5', seed=12)


def fx_hit_fogo(fx, t, i):
    c = fx.c
    R = rng(13)
    e = 1 - ease_in(t)
    fx.glow(c, 20 + 12 * t, FOGO, 170 * e)
    for k in range(9):
        ang = -math.pi / 2 + R.uniform(-1.6, 1.6)
        d = 8 + 26 * ease_out(t) * R.uniform(0.6, 1.1)
        p = (c[0] + math.cos(ang) * d, c[1] + 10 + math.sin(ang) * d * 0.6)
        flame(fx, p, (16 + 18 * R.random()) * (1 - t * 0.6), 11 + 6 * R.random(), t, a=255 * e, sway=math.cos(ang))
    for k in range(10):
        ang = R.uniform(0, 6.283)
        d = 10 + 44 * ease_out(t)
        fx.circle((c[0] + math.cos(ang) * d, c[1] + math.sin(ang) * d - 10 * t), 1.8 * (1 - t) + 0.4, '#ffd36a', 255 * e)
    if t > 0.55:
        smoke(fx, (t - 0.55) / 0.45, base='#4f4a4c', seed=14, spread=22, rise=20, size=0.8)


def fx_hit_vento(fx, t, i):
    c = fx.c
    e = env(t, 0.1, 0.55)
    for k, (rot, off) in enumerate(((-30, -8), (150, 8), (20, 0))):
        tt = max(0, min(1, (t - k * 0.12) * 1.8))
        if tt <= 0:
            continue
        a0 = rot - 70
        a1 = a0 + 140 * ease_out(tt)
        
        fx.arc_band((c[0], c[1] + off), 44, 31, a0, a1, '#3f7a35', 240 * (1 - ease_in(tt)))
        fx.arc_band((c[0], c[1] + off), 42, 33, a0, a1, VENTO, 255 * (1 - ease_in(tt)))
        fx.arc_band((c[0], c[1] + off), 38, 34, a0 + 6, a1, '#f4ffe8', 255 * (1 - ease_in(tt)))
    R = rng(15)
    for k in range(6):
        ang = R.uniform(0, 6.283)
        d = 12 + 40 * ease_out(t)
        leaf(fx, (c[0] + math.cos(ang) * d, c[1] + math.sin(ang) * d), math.degrees(ang) + t * 300, 5, a=255 * e)


def bolt(fx, a, b, R, color, alpha, w):
    pts = [a]
    n = 6
    for k in range(1, n):
        t = k / n
        p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        nx, ny = -(b[1] - a[1]), b[0] - a[0]
        L = math.hypot(nx, ny) or 1
        off = R.uniform(-1, 1) * 9
        pts.append((p[0] + nx / L * off, p[1] + ny / L * off))
    pts.append(b)
    fx.line(pts, color, alpha * 0.6, w * 2.6)
    fx.line(pts, '#ffffff', alpha, w)


def fx_hit_raio(fx, t, i):
    c = fx.c
    R = rng(100 + i)  # o raio muda de forma a cada quadro (cintilação)
    e = env(t, 0.05, 0.5)
    fx.glow(c, 22, RAIO, 170 * e)
    for k in range(5):
        ang = R.uniform(0, 6.283)
        d = 24 + 30 * ease_out(t)
        bolt(fx, c, (c[0] + math.cos(ang) * d, c[1] + math.sin(ang) * d), R, RAIO, 255 * e, 1.6)
    fx.circle(c, 9 * (1 - t), '#ffffff', 255 * e)


def fx_hit_terra(fx, t, i):
    c = fx.c
    R = rng(17)
    e = 1 - ease_in(t)
    smoke(fx, t, base='#8a6a4c', seed=18, spread=30, rise=8, size=0.9)
    for k in range(9):
        ang = -math.pi / 2 + R.uniform(-1.4, 1.4)
        sp = R.uniform(30, 55)
        x = c[0] + math.cos(ang) * sp * t
        y = c[1] + 16 + math.sin(ang) * sp * t + 60 * t * t
        s = R.uniform(4, 8) * (1 - 0.3 * t)
        rot = R.uniform(0, 360) + t * 200
        pts = [(x + math.cos(math.radians(rot + j * 72 + R.uniform(-15, 15))) * s, y + math.sin(math.radians(rot + j * 72)) * s) for j in range(5)]
        fx.poly(pts, TERRA, 255 * e, outline='#3b2a1c', w=1.2)
    impact(fx, min(1, t * 1.4), '#d9b98c', core='#fff2dc', seed=19, scale=0.6, rays=4)


def fx_hit_agua(fx, t, i):
    c = fx.c
    R = rng(20)
    e = 1 - ease_in(t)
    fx.ellipse((c[0], c[1] + 18), 12 + 40 * ease_out(t), 4 + 10 * ease_out(t), None, 230 * e, outline='#bfe3ff', w=2.4 * (1 - t) + 0.5)
    for k in range(14):
        ang = -math.pi / 2 + R.uniform(-1.3, 1.3)
        sp = R.uniform(30, 60)
        x = c[0] + math.cos(ang) * sp * t
        y = c[1] + 14 + math.sin(ang) * sp * t + 70 * t * t
        r = R.uniform(2.2, 4.4) * (1 - 0.4 * t)
        fx.circle((x, y), r + 0.8, '#173d63', 255 * e)
        fx.circle((x, y), r, AGUA, 255 * e)
        fx.circle((x - r * 0.3, y - r * 0.3), r * 0.4, '#e8f6ff', 255 * e)
    if t < 0.5:
        fx.ellipse((c[0], c[1] + 6), 14 * (1 - t), 22 * (1 - t), AGUA, 200)
        fx.ellipse((c[0] - 3, c[1]), 6 * (1 - t), 12 * (1 - t), '#e8f6ff', 220)


def fx_crit(fx, t, i):
    c = fx.c
    e = env(t, 0.08, 0.55)
    fx.glow(c, 40, '#ffd23f', 170 * e)
    for k in range(12):
        th = math.radians(k * 30 + t * 30)
        L1 = 20 + 60 * ease_out(t)
        L0 = L1 * 0.35
        w = 6 if k % 2 == 0 else 3
        fx.line([(c[0] + math.cos(th) * L0, c[1] + math.sin(th) * L0), (c[0] + math.cos(th) * L1, c[1] + math.sin(th) * L1)], '#ffd23f', 230 * e, w)
    r = 22 + 30 * ease_out(min(1, t * 2))
    fx.star(c, r * 1.25, r * 0.5, 5, -90 + t * 60, '#ff9f1c', 255 * e, outline='#3a1d05', w=2)
    fx.star(c, r * 0.85, r * 0.34, 5, -90 + t * 60, '#ffe66d', 255 * e)
    fx.circle(c, 12 + 70 * ease_out(t), None, 255 * (1 - t), outline='#fff6c8', w=3 * (1 - t) + 0.5)


def fx_slash(fx, t, i):
    c = fx.c
    tt = min(1, t * 1.7)
    a0 = -150
    a1 = a0 + 200 * ease_out(tt)
    fade = 1 - ease_in(max(0, (t - 0.45) / 0.55))
    fx.arc_band(c, 50, 38, a0, a1, '#9fc6ff', 220 * fade)
    fx.arc_band(c, 47, 40, a0 + 10, a1, '#ffffff', 255 * fade)
    if t > 0.25:
        for k in range(5):
            th = math.radians(a1 - 10 - k * 12)
            fx.circle((c[0] + math.cos(th) * 52, c[1] + math.sin(th) * 52), 1.6, '#ffffff', 255 * fade)


def fx_dodge(fx, t, i):
    c = fx.c
    R = rng(22)
    e = env(t, 0.1, 0.5)
    for k in range(9):
        y = c[1] - 50 + k * 12 + R.uniform(-3, 3)
        x1 = c[0] + 40 - 90 * ease_out(t) + R.uniform(-8, 8)
        ln = R.uniform(30, 60) * (1 - t * 0.5)
        fx.line([(x1, y), (x1 + ln, y)], '#cfe3ff', 220 * e, 2.2 if k % 3 else 3.2)
    for k in range(3):
        x = c[0] + 30 - k * 18 - 40 * t
        fx.ellipse((x, c[1]), 14, 44, '#cfe3ff', 70 * e * (1 - k * 0.25))


def fx_fumaca(fx, t, i):
    smoke(fx, t, seed=23, spread=34, rise=14)
    if t < 0.3:
        fx.circle(fx.c, 30 * (1 - t / 0.3), '#ffffff', 200 * (1 - t / 0.3))


def fx_tronco(fx, t, i):
    c = fx.c
    if t > 0.15:
        tt = min(1, (t - 0.15) / 0.3)
        y = c[1] + 10 - 6 * math.sin(tt * math.pi) * (1 - tt)
        a = 255 * (1 if t < 0.85 else 1 - (t - 0.85) / 0.15)
        x0, x1 = c[0] - 16, c[0] + 16
        fx.poly([(x0, y - 34), (x1, y - 34), (x1, y + 34), (x0, y + 34)], '#7a5232', a, outline='#2a1a10', w=2)
        fx.poly([(x0 + 4, y - 34), (x0 + 12, y - 34), (x0 + 12, y + 34), (x0 + 4, y + 34)], '#966a44', a)
        fx.ellipse((c[0], y - 34), 16, 6, '#c8a06c', a, outline='#2a1a10', w=1.6)
        fx.ellipse((c[0], y - 34), 9, 3, None, a, outline='#7a5232', w=1)
        fx.line([(x1, y - 4), (x1 + 8, y - 10)], '#2a1a10', a, 3)
    smoke(fx, min(1, t * 1.25), seed=24, spread=36, rise=10)


def fx_heal(fx, t, i):
    c = fx.c
    R = rng(25)
    fx.glow((c[0], c[1] + 10), 34, '#59c98a', 120 * env(t, 0.2, 0.6))
    for k in range(12):
        ph0 = R.random()
        ph = min(1, max(0, t * 1.2 - ph0 * 0.35))
        x = c[0] + R.uniform(-34, 34)
        y = c[1] + 44 - ph * 90
        a = 255 * math.sin(math.pi * ph)
        if k % 3 == 0:
            s = 5
            fx.poly([(x - s * 0.35, y - s), (x + s * 0.35, y - s), (x + s * 0.35, y - s * 0.35), (x + s, y - s * 0.35), (x + s, y + s * 0.35),
                     (x + s * 0.35, y + s * 0.35), (x + s * 0.35, y + s), (x - s * 0.35, y + s), (x - s * 0.35, y + s * 0.35), (x - s, y + s * 0.35),
                     (x - s, y - s * 0.35), (x - s * 0.35, y - s * 0.35)], '#8ff0b4', a, outline='#1d5a37', w=1)
        else:
            fx.star((x, y), 3.5, 1.2, 4, 0, '#d8ffe6', a)


def fx_chakra(fx, t, i):
    aura(fx, t, '#3a7bd5', '#bfe6ff', seed=26, height=150)


def fx_aura_sharingan(fx, t, i):
    aura(fx, t, '#d61f1f', '#ffb3a8', seed=27, height=150)


def fx_transform_on(fx, t, i):
    c = (fx.c[0], fx.n - 14 - 75)
    e = env(t, 0.1, 0.5)
    fx.glow(c, 46, '#ff2a2a', 170 * e)
    for k in range(10):
        th = math.radians(k * 36 + 18)
        L = 30 + 80 * ease_out(t)
        fx.line([(c[0] + math.cos(th) * L * 0.3, c[1] + math.sin(th) * L * 0.3), (c[0] + math.cos(th) * L, c[1] + math.sin(th) * L)], '#ff6b5b', 230 * e, 4)
    fx.circle(c, 20 + 80 * ease_out(t), None, 255 * (1 - t), outline='#ff2a2a', w=5 * (1 - t) + 1)
    fx.circle(c, 10 + 60 * ease_out(t), None, 255 * (1 - t), outline='#ffd0c8', w=2 * (1 - t) + 0.6)


def fx_defend(fx, t, i):
    c = fx.c
    tt = ease_out(min(1, t * 2))
    a = 255 * (1 if t < 0.8 else 1 - (t - 0.8) / 0.2 * 0.5)
    fx.glow(c, 32, '#7fc8ff', 70 * tt)
    r = 22 + 26 * tt + 1.5 * math.sin(t * 9)
    shield(fx, c, r, '#7fc8ff', a * tt)
    gx = c[0] - r + 2 * r * ((t * 1.6) % 1)
    fx.line([(gx - 6, c[1] + r * 0.6), (gx + 6, c[1] - r * 0.6)], '#ffffff', 180 * tt, 2.4)


def fx_resisted(fx, t, i):
    c = fx.c
    R = rng(28)
    if t < 0.45:
        shield(fx, c, 44, '#d8dde6', 255, cracks=int(1 + t * 10), seed=29)
    else:
        tt = (t - 0.45) / 0.55
        for k in range(8):
            ang = R.uniform(0, 6.283)
            d = 10 + 50 * ease_out(tt)
            p = (c[0] + math.cos(ang) * d, c[1] + math.sin(ang) * d + 30 * tt * tt)
            s = R.uniform(6, 11)
            pts = [(p[0] + math.cos(ang + j * 2.1) * s, p[1] + math.sin(ang + j * 2.1) * s) for j in range(3)]
            fx.poly(pts, '#d8dde6', 255 * (1 - tt), outline='#ffffff', w=1)
    fx.circle(c, 10 + 50 * t, None, 200 * (1 - t), outline='#ffffff', w=2)


def fx_defeated(fx, t, i):
    c = (fx.c[0], fx.n - 50)
    smoke(fx, t, base='#8d909a', seed=30, n=16, spread=70, rise=30, center=c, size=1.6)


def fx_turn_marker(fx, t, i):
    c = (fx.c[0], fx.n * 0.72)
    ph = t
    fx.ellipse(c, 46, 13, '#f08a24', 50)
    fx.ellipse(c, 46 + 6 * math.sin(ph * 6.283), 13 + 1.6 * math.sin(ph * 6.283), None, 230, outline='#f08a24', w=2.4)
    fx.ellipse(c, 34, 9, None, 160, outline='#ffd29a', w=1.2)
    for k in range(3):
        th = ph * 6.283 + k * 2.094
        p = (c[0] + math.cos(th) * 46, c[1] + math.sin(th) * 13)
        fx.circle(p, 2.6, '#fff1d6', 255)
    y = c[1] - 60 - 6 * math.sin(ph * 6.283)
    fx.poly([(c[0] - 10, y), (c[0] + 10, y), (c[0], y + 14)], '#f08a24', 255, outline='#3a1f08', w=1.6)


def fx_bola_de_fogo(fx, t, i):
    fireball(fx, (fx.c[0] + 18, fx.c[1]), 18, t, seed=31)


def fx_explosao(fx, t, i):
    explosion(fx, t, scale=1.4, seed=32)


def fx_goukakyuu(fx, t, i):
    c = (fx.c[0] + 20, fx.c[1])
    fireball(fx, c, 46 + 3 * math.sin(t * 6.283 * 2), t, tail=0.9, seed=33)
    R = rng(34)
    for k in range(8):
        th = t * 6.283 + k * 0.785
        flame(fx, (c[0] + math.cos(th) * 40, c[1] + math.sin(th) * 40 + 10), 22, 12, t, a=200, sway=-0.6)


def fx_daitoppa(fx, t, i):
    R = rng(35)
    n = fx.n
    for k in range(14):
        ph = (R.random() + t) % 1
        y = 30 + k * (n - 60) / 13 + math.sin(ph * 6 + k) * 6
        x0 = -40 + ph * (n + 80)
        ln = R.uniform(40, 90)
        a = 230 * math.sin(math.pi * ph)
        fx.line([(x0, y), (x0 + ln * 0.5, y - 3), (x0 + ln, y)], VENTO if k % 3 else '#f4ffe8', a, 2.6 if k % 2 else 4)
    for k in range(9):
        ph = (R.random() + t * 1.3) % 1
        x = ph * n
        y = R.uniform(30, n - 30) + math.sin(ph * 12) * 10
        leaf(fx, (x, y), ph * 720, 6, '#7fb85e' if k % 2 else '#a6c95a', 255 * math.sin(math.pi * ph))


def fx_suiryuudan(fx, t, i):
    n = fx.n
    head_x = 20 + (n - 40) * ease_out(t)
    pts = []
    for k in range(18):
        x = head_x - k * 9
        y = n * 0.55 + math.sin(k * 0.6 - t * 9) * 16 * (k / 18 + 0.3)
        pts.append((x, y))
    a = 255 * (1 if t < 0.85 else (1 - t) / 0.15)
    for k in range(len(pts) - 1, 0, -1):
        w = 26 * (1 - k / 22)
        fx.line([pts[k], pts[k - 1]], '#173d63', a, w + 4)
    for k in range(len(pts) - 1, 0, -1):
        w = 26 * (1 - k / 22)
        fx.line([pts[k], pts[k - 1]], AGUA, a, w)
        fx.line([(pts[k][0], pts[k][1] - w * 0.25), (pts[k - 1][0], pts[k - 1][1] - w * 0.25)], '#9fd3ff', a, w * 0.25)
    hx, hy = pts[0]
    # cabeça estilizada (forma própria): focinho, mandíbula, olho e "chifres" de espuma
    fx.poly([(hx - 16, hy - 16), (hx + 20, hy - 8), (hx + 30, hy - 2), (hx + 10, hy + 2), (hx + 26, hy + 12), (hx - 6, hy + 14), (hx - 18, hy + 6)],
            AGUA, a, outline='#173d63', w=2)
    fx.circle((hx + 6, hy - 7), 3, '#e8f6ff', a)
    fx.circle((hx + 7, hy - 7), 1.4, '#0d2238', a)
    for k in range(3):
        fx.line([(hx - 10 - k * 6, hy - 14), (hx - 22 - k * 8, hy - 28 + k * 2)], '#cfeaff', a, 2.4)
    R = rng(36)
    for k in range(10):
        ph = (R.random() + t) % 1
        p = pts[min(len(pts) - 1, int(R.random() * len(pts)))]
        fx.circle((p[0] - ph * 12, p[1] + R.uniform(-16, 16) + ph * 14), 2.4 * (1 - ph), '#cfeaff', a * (1 - ph))


def fx_onda_agua(fx, t, i):
    n = fx.n
    a = 255 * (1 if t < 0.8 else (1 - t) / 0.2)
    crest = n * 0.25 + (1 - ease_out(t)) * 40
    pts = [(0, n - 20)]
    for k in range(25):
        x = k * n / 24
        y = crest + 30 * math.sin(x / n * math.pi * 1.1 + t * 4) * 0.5 + (x / n) * 40
        pts.append((x, y))
    pts += [(n, n - 20)]
    fx.poly(pts, '#2a6aa3', a, outline='#123355', w=2)
    fx.poly([(p[0], p[1] + 10) for p in pts[1:-1]] + [(n, n - 20), (0, n - 20)], AGUA, a)
    fx.line(pts[1:-1], '#e8f6ff', a, 4)
    for k in range(1, len(pts) - 2, 3):
        fx.circle((pts[k][0] + 3, pts[k][1] - 2), 4, '#ffffff', a)
    R = rng(37)
    for k in range(12):
        ph = (R.random() + t) % 1
        x = R.uniform(0, n)
        fx.circle((x, crest - ph * 30), 2.6 * (1 - ph), '#cfeaff', a * (1 - ph))


def fx_sennen_goroshi(fx, t, i):
    c = fx.c
    e = env(t, 0.1, 0.6)
    impact(fx, min(1, t * 1.3), '#ffb3c7', core='#ffffff', seed=38, scale=0.7, rays=6)
    y = c[1] - 20 - 30 * ease_out(t)
    fx.star((c[0] + 10, y), 14, 6, 5, -90 + t * 200, '#ffe066', 255 * e, outline='#3a2a05', w=1.6)
    fx.circle((c[0] + 7, y - 2), 1.5, '#3a2a05', 255 * e)
    fx.circle((c[0] + 13, y - 2), 1.5, '#3a2a05', 255 * e)


def fx_investida(fx, t, i):
    n = fx.n
    R = rng(39)
    e = env(t, 0.1, 0.55)
    for k in range(12):
        y = n * 0.25 + k * n * 0.5 / 11 + R.uniform(-4, 4)
        x1 = n * 0.75 + R.uniform(-10, 10)
        ln = (40 + 70 * ease_out(t)) * R.uniform(0.6, 1)
        fx.line([(x1 - ln, y), (x1, y)], '#ffffff' if k % 2 else '#ffd29a', 220 * e, 2 + (k % 3))
    smoke(fx, t, base='#9a8466', seed=40, n=7, spread=30, rise=6, center=(n * 0.3, n * 0.8), size=0.8)


def fx_golpe_pesado(fx, t, i):
    n = fx.n
    c = (n / 2, n * 0.72)
    R = rng(41)
    e = 1 - ease_in(t)
    for k in range(6):
        ang = math.radians(180 + k * 36 + R.uniform(-10, 10))
        ln = 20 + 50 * ease_out(min(1, t * 2)) * R.uniform(0.6, 1)
        p1 = (c[0] + math.cos(ang) * ln, c[1] + math.sin(ang) * ln * 0.25 + 2)
        mid = ((c[0] + p1[0]) / 2 + R.uniform(-5, 5), (c[1] + p1[1]) / 2 + R.uniform(-2, 2))
        fx.line([c, mid, p1], '#1b140e', 255 * e, 3)
        fx.line([c, mid, p1], '#d9b98c', 160 * e, 1)
    smoke(fx, t, base='#9a8466', seed=42, n=12, spread=60, rise=18, center=(c[0], c[1] - 6), size=1.1)
    impact(fx, min(1, t * 1.2), '#ffe07a', seed=43, scale=0.9, rays=6)


def fx_kunai(fx, t, i):
    c = fx.c
    R = rng(44)
    for k in range(4):
        y = c[1] + (k - 1.5) * 6
        x0 = c[0] - 60 + ((t * 40 + k * 9) % 18)
        fx.line([(x0, y), (x0 + 30, y)], '#dfe7ee', 120, 1.4)
    kunai_shape(fx, (c[0] + 4, c[1] + math.sin(t * 6.283) * 1.5), math.sin(t * 6.283) * 4, 54)


def fx_kubikiribouchou(fx, t, i):
    c = (fx.c[0] - 10, fx.c[1] + 10)
    tt = min(1, t * 1.6)
    a0 = -160
    a1 = a0 + 230 * ease_out(tt)
    fade = 1 - ease_in(max(0, (t - 0.4) / 0.6))
    fx.arc_band(c, 86, 60, a0, a1, '#6e8db8', 220 * fade, steps=36)
    fx.arc_band(c, 80, 66, a0 + 8, a1, '#e8f2ff', 255 * fade, steps=36)
    if t > 0.3:
        impact(fx, (t - 0.3) / 0.7, '#ffffff', seed=45, scale=0.8, rays=6)


def fx_nevoa(fx, t, i):
    n = fx.n
    R = rng(46)
    parts = [(R.uniform(0, n), R.uniform(n * 0.3, n * 0.9), R.uniform(20, 40), R.uniform(-1, 1)) for _ in range(18)]
    e = env(t, 0.3, 0.85)

    def draw(sub):
        for x, y, r, v in parts:
            xx = x + v * 30 * t
            rr = r * (0.6 + 0.6 * ease_out(t))
            sub.circle((xx, y), rr, '#cfd8e3', 120 * e)
    fx.layer_blur(draw, 5)


def fx_muon_satsujin(fx, t, i):
    c = fx.c
    if t < 0.5:
        tt = t / 0.5
        fx.circle(c, 60 * (1 - ease_in(tt)), None, 255 * (1 - tt), outline='#9fd3ff', w=3)
        for k in range(14):
            th = math.radians(k * 25.7 + tt * 300)
            d = 60 * (1 - ease_in(tt))
            fx.circle((c[0] + math.cos(th) * d, c[1] + math.sin(th) * d * 0.8), 3 * (1 - tt) + 0.8, '#cfeaff', 255 * (1 - tt))
        smoke(fx, tt, base='#cfd8e3', seed=47, spread=24, rise=6, size=0.9)
    else:
        tt = (t - 0.5) / 0.5
        impact(fx, tt, '#9fd3ff', core='#ffffff', seed=48, scale=1.2, rays=8)
        fx.arc_band(c, 70, 58, 160, 160 + 120 * ease_out(min(1, tt * 2)), '#e8f2ff', 255 * (1 - tt))


def fx_senbon(fx, t, i):
    c = fx.c
    for k in range(5):
        ang = math.radians((k - 2) * 7)
        L = 40
        d = (math.cos(ang), math.sin(ang))
        o = 10 + (t * 30 + k * 7) % 12
        p0 = (c[0] - 30 + d[0] * o, c[1] + (k - 2) * 9 + d[1] * o)
        needle(fx, p0, (p0[0] + d[0] * L, p0[1] + d[1] * L))
        fx.line([(p0[0] - 24, p0[1]), (p0[0] - 4, p0[1])], '#cfeaff', 90, 1)


def mirror(fx, c, w, h, a, glint=0.0):
    pts = [(c[0] - w / 2, c[1] - h / 2), (c[0] + w / 2, c[1] - h / 2), (c[0] + w / 2, c[1] + h / 2), (c[0] - w / 2, c[1] + h / 2)]
    fx.poly(pts, '#bfe6ff', a * 0.55, outline='#e8f8ff', w=2)
    fx.poly([(c[0] - w / 2 + 3, c[1] - h / 2 + 3), (c[0] + w / 2 - 3, c[1] - h / 2 + 3), (c[0] + w / 2 - 3, c[1] + h / 2 - 3), (c[0] - w / 2 + 3, c[1] + h / 2 - 3)],
            None, a * 0.8, outline='#7fb9e0', w=1)
    gx = c[0] - w / 2 + w * glint
    fx.line([(gx - 4, c[1] + h / 2 - 4), (gx + 6, c[1] - h / 2 + 4)], '#ffffff', a * 0.9, 2.2)


def fx_makyou(fx, t, i):
    n = fx.n
    for k in range(5):
        tt = max(0, min(1, (t - k * 0.1) * 2))
        if tt <= 0:
            continue
        x = n * (0.14 + 0.18 * k)
        h = 70 * ease_out(tt)
        y = n * 0.85 - h / 2
        mirror(fx, (x, y), 28, h, 255 * min(1, tt * 1.5), glint=(t * 1.5 + k * 0.2) % 1)
        if tt < 1:
            for j in range(4):
                fx.circle((x + (j - 1.5) * 8, n * 0.85 - h - 4), 2, '#e8f8ff', 255 * (1 - tt))


def fx_sensatsu(fx, t, i):
    c = fx.c
    R = rng(49)
    for k in range(16):
        ang = R.uniform(0, 6.283)
        d0 = 90 * (1 - ease_in(min(1, t * 1.15))) + 8
        L = 26
        p = (c[0] + math.cos(ang) * d0, c[1] + math.sin(ang) * d0)
        q = (c[0] + math.cos(ang) * (d0 + L), c[1] + math.sin(ang) * (d0 + L))
        a = 255 if t < 0.85 else 255 * (1 - t) / 0.15
        fx.line([q, (q[0] + math.cos(ang) * 14, q[1] + math.sin(ang) * 14)], '#9fd3ff', a * 0.5, 1.2)
        needle(fx, p, q, '#e8f6ff', a, 1.8)
    if t > 0.8:
        impact(fx, (t - 0.8) / 0.2, '#9fd3ff', seed=50, scale=0.8)


def fx_doryuuheki(fx, t, i):
    n = fx.n
    h = 120 * ease_out(min(1, t * 1.4))
    base = n - 16
    top = base - h
    w = 70
    x0 = n / 2 - w / 2
    pts = [(x0 - 8, base), (x0, top + 10), (x0 + w * 0.3, top), (x0 + w * 0.7, top + 4), (x0 + w, top + 12), (x0 + w + 8, base)]
    fx.poly(pts, '#6e4b30', 255, outline='#2a1a10', w=2)
    for k in range(4):
        y = top + 18 + k * (h - 24) / 4
        if y < base - 6:
            fx.line([(x0 + 6, y), (x0 + w * 0.5, y + 3), (x0 + w - 6, y)], '#8f6844', 255, 3)
    for k in range(5):
        fx.circle((x0 + 10 + k * 13, top + 14), 4, '#8f6844', 255)
    if t < 0.8:
        smoke(fx, t, base='#8a6a4c', seed=51, n=10, spread=50, rise=8, center=(n / 2, base - 4), size=0.9)
    for k in range(4):
        ph = (t * 1.7 + k * 0.27) % 1
        x = x0 + 12 + k * 15
        fx.circle((x, top + 16 + ph * (h - 20)), 2.6, '#5a3d26', 255 * (1 - ph))


def fx_kai(fx, t, i):
    c = fx.c
    R = rng(52)
    r = 10 + 80 * ease_out(t)
    fx.circle(c, r, None, 255 * (1 - t), outline='#e6d4ff', w=4 * (1 - t) + 0.6)
    fx.circle(c, r * 0.8, None, 200 * (1 - t), outline='#b98ce8', w=2 * (1 - t) + 0.4)
    for k in range(10):
        ang = R.uniform(0, 6.283)
        d = r * R.uniform(0.6, 1.0)
        p = (c[0] + math.cos(ang) * d, c[1] + math.sin(ang) * d + 20 * t * t)
        s = R.uniform(6, 12) * (1 - 0.5 * t)
        pts = [(p[0] + math.cos(ang + j * 2.2) * s, p[1] + math.sin(ang + j * 2.2) * s * 0.8) for j in range(3)]
        fx.poly(pts, '#efe4ff', 200 * (1 - t), outline='#ffffff', w=1)


def fx_kongou_fuusa(fx, t, i):
    n = fx.n
    for k in range(3):
        tt = max(0, min(1, (t - k * 0.08) * 1.5))
        L = (n - 20) * ease_out(tt)
        y0 = n * (0.3 + 0.2 * k)
        pts = []
        for j in range(int(L / 9) + 2):
            x = 10 + j * 9
            if x > 10 + L:
                break
            pts.append((x, y0 + math.sin(j * 0.7 + k + t * 6) * 6 * (1 - tt * 0.5)))
        if len(pts) > 1:
            fx.glow(pts[-1], 14, '#ffd23f', 120)
            chain_links(fx, pts, color='#ffd96a', dark='#6b4a08', size=5.5, phase=int(t * 8))
            hx, hy = pts[-1]
            fx.poly([(hx, hy - 6), (hx + 12, hy), (hx, hy + 6)], '#ffe9a0', 255, outline='#6b4a08', w=1.4)


def fx_genjutsu_sharingan(fx, t, i):
    c = fx.c
    open_ = ease_out(min(1, t * 2.2))
    e = 1 if t < 0.8 else (1 - t) / 0.2
    w, h = 80, 36 * open_
    up = [(c[0] - w + 2 * w * j / 20, c[1] - h * math.sin(math.pi * j / 20)) for j in range(21)]
    dn = [(c[0] + w - 2 * w * j / 20, c[1] + h * math.sin(math.pi * j / 20)) for j in range(21)]
    fx.glow(c, 70, '#d61f1f', 120 * e)
    fx.poly(up + dn, '#f7efe8', 255 * e, outline='#1b0f12', w=3)
    if h > 6:
        fx.circle(c, min(30, h * 0.9), '#c0161c', 255 * e)
        # íris própria: anéis concêntricos e uma espiral girando (sem o desenho canônico)
        for k in range(3):
            fx.circle(c, min(30, h * 0.9) * (0.85 - k * 0.22), None, 255 * e, outline='#5a0a0e', w=1.4)
        sp = []
        for j in range(30):
            th = j * 0.35 + t * 12
            rr = j * 0.9
            sp.append((c[0] + math.cos(th) * rr, c[1] + math.sin(th) * rr))
        fx.line(sp, '#2a0507', 255 * e, 2)
        fx.circle(c, 5, '#120203', 255 * e)
    fx.line(up, '#1b0f12', 255 * e, 4)


# ---- status em loop
def st_queimadura(fx, t, i):
    n = fx.n
    R = rng(53)
    for k in range(5):
        ph = (k / 5 + t) % 1
        x = n * 0.2 + k * n * 0.15
        h = (22 + 14 * math.sin(ph * 6.283 + k)) * (0.8 + 0.2 * R.random())
        flame(fx, (x, n - 14), h, 14, t, a=235, sway=math.sin(ph * 6.283) * 0.6)
    for k in range(4):
        ph = (R.random() + t) % 1
        fx.circle((n * 0.2 + R.random() * n * 0.6, n - 20 - ph * 60), 1.6, '#ffd36a', 255 * (1 - ph))


def st_imobilizado(fx, t, i):
    n = fx.n
    for ring_k, (cy, rx) in enumerate(((n * 0.45, 58), (n * 0.62, 54))):
        pts = []
        for j in range(25):
            th = 2 * math.pi * j / 24 + t * 2 * math.pi / 3 * (1 if ring_k == 0 else -1)
            pts.append((n / 2 + math.cos(th) * rx, cy + math.sin(th) * 12))
        back = [p for p in pts if p[1] < cy]
        chain_links(fx, pts, size=6.5, phase=ring_k + int(t * 6))
    fx.glow((n / 2, n * 0.53), 30, '#ffd96a', 40)


def st_atordoado(fx, t, i):
    n = fx.n
    c = (n / 2, n * 0.3)
    fx.ellipse(c, 36, 9, None, 120, outline='#ffe066', w=1)
    for k in range(4):
        th = t * 6.283 + k * 1.571
        p = (c[0] + math.cos(th) * 36, c[1] + math.sin(th) * 9)
        s = 7 + 2 * math.sin(th)
        fx.star(p, s, s * 0.45, 5, -90 + t * 360, '#ffe066', 255, outline='#5a3d00', w=1.2)


def st_ilusao(fx, t, i):
    c = fx.c
    for k in range(3):
        ph = (k / 3 + t) % 1
        r = 14 + ph * 46
        pts = [(c[0] + math.cos(j * 0.2618) * r * (1 + 0.08 * math.sin(j * 1.5 + t * 12)), c[1] + math.sin(j * 0.2618) * r * 0.8) for j in range(24)]
        fx.line(pts + [pts[0]], '#b98ce8', 200 * (1 - ph), 2.2)
    a = 150 + 60 * math.sin(t * 6.283)
    fx.poly([(c[0] - 18, c[1]), (c[0], c[1] - 9), (c[0] + 18, c[1]), (c[0], c[1] + 9)], '#efe4ff', a, outline='#5d3b8a', w=1.6)
    fx.circle(c, 6, '#7b4bc0', a)
    fx.circle(c, 2.4, '#1a0f2a', a)


def st_lentidao(fx, t, i):
    n = fx.n
    for k in range(3):
        ph = (k / 3 + t) % 1
        y = n * 0.2 + ph * n * 0.55
        a = 230 * math.sin(math.pi * ph)
        x = n / 2
        fx.line([(x - 18, y), (x, y + 12), (x + 18, y)], '#7fb3ff', a, 4)
        fx.line([(x - 18, y), (x, y + 12), (x + 18, y)], '#e0ecff', a, 1.5)
    # espiral lenta (relógio)
    c = (n * 0.78, n * 0.25)
    fx.circle(c, 11, '#3a5f9a', 230, outline='#cfe0ff', w=1.6)
    th = t * 6.283
    fx.line([c, (c[0] + math.cos(th - 1.57) * 8, c[1] + math.sin(th - 1.57) * 8)], '#ffffff', 255, 1.8)
    fx.line([c, (c[0] + 5, c[1])], '#ffffff', 255, 1.6)


def st_defesa_reduzida(fx, t, i):
    c = fx.c
    pulse = 0.88 + 0.12 * math.sin(t * 6.283 + 0.5)
    shield(fx, c, 34 * pulse, '#c7a07a', 230, cracks=3, seed=54)
    fx.poly([(c[0] + 26, c[1] + 14), (c[0] + 38, c[1] + 14), (c[0] + 32, c[1] + 26)], '#ff5a4f', 255, outline='#3a0c08', w=1.2)


def st_reforco(fx, t, i):
    n = fx.n
    R = rng(55)
    fx.ellipse((n / 2, n - 16), 44, 10, '#ffffff', 60 + 30 * math.sin(t * 6.283))
    for k in range(14):
        ph = (R.random() + t) % 1
        x = n / 2 + R.uniform(-44, 44)
        y = n - 16 - ph * n * 0.8
        fx.line([(x, y), (x, y + 10 * (1 - ph) + 3)], '#ffffff', 220 * math.sin(math.pi * ph), 2)


def st_tenacidade(fx, t, i):
    n = fx.n
    c = (n / 2, n - 14 - 75)
    a = 150 + 80 * math.sin(t * 6.283)
    fx.ellipse(c, 44, 80, None, a, outline='#e6ebf2', w=3)
    fx.ellipse(c, 40, 76, None, a * 0.6, outline='#9aa3b0', w=1.4)
    th = t * 6.283
    fx.star((c[0] + math.cos(th) * 44, c[1] + math.sin(th) * 80), 6, 2, 4, 0, '#ffffff', 255)


# ------------------------------------------------------------------ catálogo
def spec(fn, size=128, frames=8, fps=14, loop=False, prio='P0', uso='', blend='normal', colors=None):
    return dict(fn=fn, size=size, frames=frames, fps=fps, loop=loop, prio=prio, uso=uso, blend=blend, colors=colors)


EFFECTS = {
    # §6.1 genéricos
    'fx_hit': spec(fx_hit, 128, 7, 18, uso='damage sem jutsu (Atacar)'),
    'fx_hit_neutro': spec(fx_hit_neutro, 128, 7, 18, uso='damage de jutsu sem elemento'),
    'fx_hit_fogo': spec(fx_hit_fogo, 128, 8, 16, uso='damage de jutsu de Fogo'),
    'fx_hit_vento': spec(fx_hit_vento, 128, 8, 18, uso='damage de jutsu de Vento'),
    'fx_hit_raio': spec(fx_hit_raio, 128, 7, 18, uso='damage de jutsu de Raio'),
    'fx_hit_terra': spec(fx_hit_terra, 128, 8, 16, uso='damage de jutsu de Terra'),
    'fx_hit_agua': spec(fx_hit_agua, 128, 8, 16, uso='damage de jutsu de Água'),
    'fx_slash': spec(fx_slash, 128, 7, 20, uso='corte físico (golpe com arma)'),
    'fx_crit': spec(fx_crit, 192, 8, 16, uso='damage crítico'),
    'fx_dodge': spec(fx_dodge, 128, 6, 18, uso='dodge (rastro)'),
    'fx_fumaca': spec(fx_fumaca, 128, 8, 14, uso='miss (Henge), negated por clone, Henge/Bunshin/Kage Bunshin'),
    'fx_tronco': spec(fx_tronco, 128, 9, 12, uso='negated por Kawarimi (tronco)'),
    'fx_heal': spec(fx_heal, 128, 10, 14, uso='heal (kit médico)'),
    'fx_chakra': spec(fx_chakra, 192, 8, 12, loop=True, uso='heal (pílula), meditate, chakraRegen'),
    'fx_defend': spec(fx_defend, 128, 6, 14, uso='defend'),
    'fx_resisted': spec(fx_resisted, 128, 8, 14, uso='effectResisted (Tenacidade)'),
    'fx_defeated': spec(fx_defeated, 192, 9, 12, uso='defeated (nuvem de fumaça)'),
    'fx_turn_marker': spec(fx_turn_marker, 128, 8, 10, loop=True, uso='turnStart (marcador sob o lutador)'),
    # §3.2 Sharingan
    'fx_aura_sharingan': spec(fx_aura_sharingan, 192, 8, 12, loop=True, uso='transformação ativa (overlay em loop)'),
    'fx_transform_on': spec(fx_transform_on, 192, 7, 16, uso='transformOn (flash de ativação; tocar ao contrário no transformOff)'),
    # §6.3 jutsus de dano
    'fx_bola_de_fogo': spec(fx_bola_de_fogo, 128, 6, 14, loop=True, uso='bola_de_fogo (projétil)'),
    'fx_explosao': spec(fx_explosao, 192, 9, 16, uso='impacto de bola_de_fogo / goukakyuu'),
    'fx_goukakyuu': spec(fx_goukakyuu, 192, 6, 12, loop=True, uso='goukakyuu (projétil grande)'),
    'fx_daitoppa': spec(fx_daitoppa, 192, 8, 14, loop=True, uso='daitoppa (rajada de vento)'),
    'fx_suiryuudan': spec(fx_suiryuudan, 192, 10, 14, uso='suiryuudan (torrente com cabeça de dragão, forma própria)'),
    'fx_onda_agua': spec(fx_onda_agua, 192, 8, 12, uso='onda de água (impacto grande de Água)'),
    'fx_sennen_goroshi': spec(fx_sennen_goroshi, 128, 8, 14, uso='sennen_goroshi (estrela cômica)'),
    'fx_investida': spec(fx_investida, 192, 7, 18, uso='investida_ninja (rastro de velocidade)'),
    # §6.4 golpes de inimigos
    'fx_golpe_pesado': spec(fx_golpe_pesado, 192, 8, 16, uso='golpe_pesado (impacto no chão)'),
    'fx_kunai': spec(fx_kunai, 128, 6, 16, loop=True, uso='kunai_lancada (projétil)'),
    'fx_kubikiribouchou': spec(fx_kubikiribouchou, 192, 8, 18, uso='kubikiribouchou (corte largo)'),
    'fx_nevoa': spec(fx_nevoa, 192, 8, 10, uso='kirigakure (nuvem de névoa; depois ligar overlay_nevoa)'),
    'fx_muon_satsujin': spec(fx_muon_satsujin, 192, 10, 14, uso='muon_satsujin (some e reaparece)'),
    'fx_senbon': spec(fx_senbon, 128, 6, 16, loop=True, uso='senbon (leque de agulhas, projétil)'),
    'fx_makyou': spec(fx_makyou, 192, 10, 14, uso='makyou_hyoushou (espelhos surgindo; depois overlay_espelhos_gelo)'),
    'fx_sensatsu': spec(fx_sensatsu, 192, 9, 16, uso='sensatsu_suishou (agulhas convergindo)'),
    # §6.5 status em loop
    'st_queimadura': spec(st_queimadura, 128, 8, 12, loop=True, uso='queimadura (chamas nos pés)'),
    'st_imobilizado': spec(st_imobilizado, 192, 8, 10, loop=True, uso='imobilizado (correntes)'),
    'st_atordoado': spec(st_atordoado, 128, 8, 12, loop=True, uso='atordoado (estrelas sobre a cabeça)'),
    'st_ilusao': spec(st_ilusao, 128, 8, 10, loop=True, uso='ilusao (ondas + olho)'),
    'st_lentidao': spec(st_lentidao, 128, 8, 8, loop=True, uso='lentidao'),
    'st_defesa_reduzida': spec(st_defesa_reduzida, 128, 6, 8, loop=True, uso='defesa_reduzida (escudo rachado)'),
    'st_reforco': spec(st_reforco, 192, 8, 10, loop=True, uso='reforco_* (brilho; tingir com setTint pela cor do atributo)'),
    'st_tenacidade': spec(st_tenacidade, 192, 6, 10, loop=True, uso='tenacidade (contorno prateado)'),
    # P1 suporte
    'fx_doryuuheki': spec(fx_doryuuheki, 192, 8, 14, prio='P1', uso='doryuuheki (muralha; segurar o último quadro)'),
    'fx_kai': spec(fx_kai, 192, 7, 16, prio='P1', uso='kai (ilusão quebrando)'),
    'fx_kongou_fuusa': spec(fx_kongou_fuusa, 192, 8, 14, prio='P1', uso='kongou_fuusa (correntes douradas)'),
    'fx_genjutsu_sharingan': spec(fx_genjutsu_sharingan, 192, 9, 12, prio='P1', uso='genjutsu_sharingan (olho vermelho, desenho próprio)'),
}


def render(name: str) -> list[Image.Image]:
    s = EFFECTS[name]
    out = []
    N = s['frames']
    for i in range(N):
        t = i / N if s['loop'] else i / (N - 1) * 0.97 + 0.015
        fx = FX(s['size'])
        s['fn'](fx, t, i)
        out.append(edge_fade(fx.result()))
    return out


def edge_fade(im: Image.Image, margin_frac: float = 0.09) -> Image.Image:
    """Apaga suavemente o alfa perto da borda do quadro (brilho nunca termina em quina)."""
    import numpy as np
    a = np.array(im).astype(np.float32)
    n = im.width
    m = max(4.0, n * margin_frac)
    idx = np.arange(n, dtype=np.float32)
    d = np.minimum(idx, n - 1 - idx)
    w = np.clip(d / m, 0, 1)
    w = w * w * (3 - 2 * w)
    mask = np.minimum(w[None, :], w[:, None])
    a[..., 3] *= mask
    return Image.fromarray(a.round().astype(np.uint8))
