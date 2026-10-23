"""Rig 2D procedural: esqueleto, cinemática inversa e desenho com Pillow.

Coordenadas no "espaço do quadro" de 192 × 192 (y para baixo). O desenho é feito
em supersampling (S vezes maior) e reduzido no fim, para dar contorno liso.

Convenção de ângulo dos membros: 0° = para baixo, 90° = para a frente (+x),
180° = para cima. Os personagens olham para a DIREITA.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from PIL import Image, ImageDraw

Vec = tuple[float, float]

GROUND = 178.0  # y dos pés no quadro de 192
LIGHT = (0.55, -0.83)  # luz vindo de cima e da frente


# --------------------------------------------------------------- vetores
def add(a: Vec, b: Vec) -> Vec:
    return (a[0] + b[0], a[1] + b[1])


def sub(a: Vec, b: Vec) -> Vec:
    return (a[0] - b[0], a[1] - b[1])


def mul(a: Vec, k: float) -> Vec:
    return (a[0] * k, a[1] * k)


def length(a: Vec) -> float:
    return math.hypot(a[0], a[1])


def norm(a: Vec) -> Vec:
    d = length(a) or 1.0
    return (a[0] / d, a[1] / d)


def lerp(a, b, t: float):
    if isinstance(a, tuple):
        return tuple(lerp(x, y, t) for x, y in zip(a, b))
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a + (b - a) * t
    return b if t >= 0.5 else a


def dirv(angle_deg: float, ln: float = 1.0) -> Vec:
    """Vetor do ângulo de membro (0 = baixo, 90 = frente)."""
    r = math.radians(angle_deg)
    return (math.sin(r) * ln, math.cos(r) * ln)


def polar(c: Vec, r: float, theta_deg: float) -> Vec:
    """Ponto em coordenadas polares de tela (0° = frente, -90° = cima)."""
    t = math.radians(theta_deg)
    return (c[0] + math.cos(t) * r, c[1] + math.sin(t) * r)


def rotate(p: Vec, c: Vec, deg: float) -> Vec:
    t = math.radians(deg)
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(t) - y * math.sin(t), c[1] + x * math.sin(t) + y * math.cos(t))


def ik(root: Vec, target: Vec, a: float, b: float, bend: int) -> tuple[Vec, Vec]:
    """IK de 2 ossos. bend=-1 joga a articulação para a frente (joelho), +1 para trás (cotovelo)."""
    dx, dy = sub(target, root)
    d = math.hypot(dx, dy)
    d = max(abs(a - b) + 1e-3, min(a + b - 1e-3, d))
    base = math.atan2(dy, dx)
    c = (a * a + d * d - b * b) / (2 * a * d)
    ang = math.acos(max(-1.0, min(1.0, c)))
    j = base + bend * ang
    joint = (root[0] + math.cos(j) * a, root[1] + math.sin(j) * a)
    end = (root[0] + math.cos(base) * d, root[1] + math.sin(base) * d)
    return joint, end


# --------------------------------------------------------------- cores
def hex2rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def shade(c, k: float):
    c = hex2rgb(c) if isinstance(c, str) else c
    return tuple(max(0, min(255, int(round(v * k)))) for v in c[:3])


def tint(c, other, t: float):
    a = hex2rgb(c) if isinstance(c, str) else c
    b = hex2rgb(other) if isinstance(other, str) else other
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def rgba(c, alpha: int = 255):
    if isinstance(c, tuple) and len(c) == 4:
        return c
    c = hex2rgb(c) if isinstance(c, str) else c
    return (c[0], c[1], c[2], alpha)


# --------------------------------------------------------------- primitivas
@dataclass
class Capsule:
    a: Vec
    b: Vec
    w: float
    color: object
    shaded: bool = True
    outline: bool = True


@dataclass
class Poly:
    pts: list
    color: object
    shaded: bool = True
    outline: bool = True
    soft: bool = False  # tecido solto (fitas, cachecol): não conta para apoiar no chão


@dataclass
class Circle:
    c: Vec
    r: float
    color: object
    shaded: bool = True
    outline: bool = True


@dataclass
class Line:
    """Detalhe interno (sem contorno): costura, faixa, olho."""
    pts: list
    w: float
    color: object


@dataclass
class Glow:
    c: Vec
    r: float
    color: object
    alpha: int = 120


@dataclass
class Group:
    """Contornos de todas as peças primeiro, preenchimentos depois (membro sem emenda)."""
    items: list = field(default_factory=list)
    weapon: bool = False


def transform_item(it, fn):
    if isinstance(it, Capsule):
        return Capsule(fn(it.a), fn(it.b), it.w, it.color, it.shaded, it.outline)
    if isinstance(it, Poly):
        return Poly([fn(p) for p in it.pts], it.color, it.shaded, it.outline, it.soft)
    if isinstance(it, Circle):
        return Circle(fn(it.c), it.r, it.color, it.shaded, it.outline)
    if isinstance(it, Line):
        return Line([fn(p) for p in it.pts], it.w, it.color)
    if isinstance(it, Glow):
        return Glow(fn(it.c), it.r, it.color, it.alpha)
    if isinstance(it, Group):
        return Group([transform_item(x, fn) for x in it.items], it.weapon)
    raise TypeError(it)


def bounds(items, skip_weapon=True):
    xs, ys = [], []

    def walk(it):
        if isinstance(it, Group):
            if skip_weapon and it.weapon:
                return
            for x in it.items:
                walk(x)
        elif isinstance(it, Capsule):
            for p in (it.a, it.b):
                xs.extend([p[0] - it.w / 2, p[0] + it.w / 2])
                ys.extend([p[1] - it.w / 2, p[1] + it.w / 2])
        elif isinstance(it, Circle):
            xs.extend([it.c[0] - it.r, it.c[0] + it.r])
            ys.extend([it.c[1] - it.r, it.c[1] + it.r])
        elif isinstance(it, Poly):
            if it.soft:
                return
            for p in it.pts:
                xs.append(p[0])
                ys.append(p[1])

    for it in items:
        walk(it)
    if not xs:
        return (0, 0, 0, 0)
    return (min(xs), min(ys), max(xs), max(ys))


# --------------------------------------------------------------- desenho
class Painter:
    def __init__(self, size: int, scale: float, offset: Vec = (0, 0), outline_color=(18, 16, 24), outline_w: float = 1.35):
        self.size = size
        self.k = scale  # pixels de supersampling por unidade do quadro
        self.off = offset
        self.img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)
        self.oc = rgba(outline_color)
        self.ow = outline_w
        self.glows: list[Glow] = []

    def P(self, p: Vec) -> Vec:
        return ((p[0] - self.off[0]) * self.k, (p[1] - self.off[1]) * self.k)

    def _cap(self, a, b, w, col):
        A, B = self.P(a), self.P(b)
        W = max(1.0, w * self.k)
        self.d.line([A, B], fill=col, width=int(round(W)))
        r = W / 2
        for q in (A, B):
            self.d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=col)

    def _poly(self, pts, col):
        self.d.polygon([self.P(p) for p in pts], fill=col)

    def _poly_outline(self, pts, w):
        Q = [self.P(p) for p in pts]
        W = w * self.k
        self.d.line(Q + [Q[0]], fill=self.oc, width=int(round(W)), joint='curve')
        r = W / 2
        for q in Q:
            self.d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=self.oc)
        self.d.polygon(Q, fill=self.oc)

    def outline(self, it):
        o = self.ow
        if isinstance(it, Capsule) and it.outline:
            self._cap(it.a, it.b, it.w + 2 * o, self.oc)
        elif isinstance(it, Circle) and it.outline:
            self._circle(it.c, it.r + o, self.oc)
        elif isinstance(it, Poly) and it.outline:
            self._poly_outline(it.pts, 2 * o)

    def _circle(self, c, r, col):
        C = self.P(c)
        R = r * self.k
        self.d.ellipse([C[0] - R, C[1] - R, C[0] + R, C[1] + R], fill=col)

    def fill(self, it):
        if isinstance(it, Capsule):
            base = rgba(it.color)
            if not it.shaded or it.w < 2.2:
                self._cap(it.a, it.b, it.w, base)
                return
            self._cap(it.a, it.b, it.w, rgba(shade(it.color, 0.66)))
            d = norm(sub(it.b, it.a))
            n = (-d[1], d[0])
            if n[0] * LIGHT[0] + n[1] * LIGHT[1] < 0:
                n = (-n[0], -n[1])
            o = mul(n, it.w * 0.17)
            self._cap(add(it.a, o), add(it.b, o), it.w * 0.62, base)
        elif isinstance(it, Circle):
            base = rgba(it.color)
            if not it.shaded:
                self._circle(it.c, it.r, base)
                return
            self._circle(it.c, it.r, rgba(shade(it.color, 0.7)))
            self._circle(add(it.c, mul(LIGHT, it.r * 0.13)), it.r * 0.86, base)
        elif isinstance(it, Poly):
            base = rgba(it.color)
            if not it.shaded:
                self._poly(it.pts, base)
                return
            self._poly(it.pts, rgba(shade(it.color, 0.68)))
            cx = sum(p[0] for p in it.pts) / len(it.pts)
            cy = sum(p[1] for p in it.pts) / len(it.pts)
            xs = [p[0] for p in it.pts]
            ext = (max(xs) - min(xs) + max(p[1] for p in it.pts) - min(p[1] for p in it.pts)) / 2
            o = mul(LIGHT, ext * 0.09)
            inner = [add((cx + (p[0] - cx) * 0.84, cy + (p[1] - cy) * 0.84), o) for p in it.pts]
            self._poly(inner, base)
        elif isinstance(it, Line):
            Q = [self.P(p) for p in it.pts]
            col = rgba(it.color) if not (isinstance(it.color, tuple) and len(it.color) == 4) else it.color
            W = max(1, int(round(it.w * self.k)))
            self.d.line(Q, fill=col, width=W, joint='curve')
            r = W / 2
            for q in (Q[0], Q[-1]):
                self.d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=col)
        elif isinstance(it, Glow):
            self.glows.append(it)

    def draw(self, items):
        for it in items:
            if isinstance(it, Group):
                for x in it.items:
                    self.outline(x)
                for x in it.items:
                    self.fill(x)
            else:
                self.outline(it)
                self.fill(it)

    def result(self, out_size: int) -> Image.Image:
        img = self.img
        if self.glows:
            from PIL import ImageFilter
            layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
            gd = ImageDraw.Draw(layer)
            for g in self.glows:
                C = self.P(g.c)
                R = g.r * self.k
                gd.ellipse([C[0] - R, C[1] - R, C[0] + R, C[1] + R], fill=rgba(g.color, g.alpha))
            layer = layer.convert('RGBa').filter(ImageFilter.GaussianBlur(max(g.r for g in self.glows) * self.k * 0.35)).convert('RGBA')
            base = Image.new('RGBA', img.size, (0, 0, 0, 0))
            base.alpha_composite(layer)
            base.alpha_composite(img)
            core = Image.new('RGBA', img.size, (0, 0, 0, 0))
            cd = ImageDraw.Draw(core)
            for g in self.glows:
                C = self.P(g.c)
                R = g.r * self.k * 0.35
                cd.ellipse([C[0] - R, C[1] - R, C[0] + R, C[1] + R], fill=(255, 255, 255, int(g.alpha * 0.9)))
            core = core.convert('RGBa').filter(ImageFilter.GaussianBlur(R * 0.5 + 1)).convert('RGBA')
            base.alpha_composite(core)
            img = base
        return img.convert('RGBa').resize((out_size, out_size), Image.LANCZOS).convert('RGBA')
