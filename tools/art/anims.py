"""Animações por quadros: poses-chave por arquétipo de luta.

Cada animação é uma lista de poses (dicionários de characters.pose) com
antecipação, impacto e recuperação. Os valores são normalizados pelo tamanho da
perna e do braço, então a mesma pose serve para corpos diferentes.
"""
from __future__ import annotations

import math

from characters import mix, pose

ANIM_ORDER = ['idle', 'attack', 'cast', 'hit', 'death', 'dodge']
FPS = {'idle': 6, 'attack': 12, 'cast': 10, 'hit': 10, 'death': 9, 'dodge': 12}
LOOP = {'idle': True, 'attack': False, 'cast': False, 'hit': False, 'death': False, 'dodge': False}
MIN_FRAMES = {'idle': 4, 'attack': 5, 'cast': 5, 'hit': 3, 'death': 5}


def stance(arch: str) -> dict:
    if arch == 'kunai':
        return pose(hf=(0.62, 0.36), hb=(0.3, 0.5), woff=55)
    if arch == 'kunai_rev':
        return pose(hf=(0.58, 0.4), hb=(0.32, 0.48), woff=170, lean=8)
    if arch == 'fist':
        return pose(hf=(0.6, 0.28), hb=(0.36, 0.36), fist=True, lean=9)
    if arch == 'brute':
        return pose(hf=(0.45, 0.62), hb=(0.25, 0.5), woff=35, lean=10, hy=0.1, ff=(0.5, 0), fb=(-0.45, 0))
    if arch == 'greatsword':
        return pose(hf=(0.36, 0.3), hb=(0.2, 0.62), wa=252, lean=4, hy=0.06, ff=(0.45, 0), fb=(-0.42, 0))
    if arch == 'needles':
        return pose(hf=(0.62, 0.18), hb=(0.12, 0.66), woff=-5, lean=4, hy=0.05, ff=(0.34, 0), fb=(-0.32, 0))
    raise KeyError(arch)


def P(base: dict, **kw) -> dict:
    p = dict(base)
    p.update(kw)
    return p


def idle(arch):
    st = stance(arch)
    out = []
    for i in range(6):
        s = math.sin(2 * math.pi * i / 6)
        c = math.cos(2 * math.pi * i / 6)
        out.append(P(st, hy=st['hy'] + 0.035 * (s + 1), lean=st['lean'] + 1.6 * s,
                     hf=(st['hf'][0] + 0.02 * c, st['hf'][1] + 0.04 * s), hb=(st['hb'][0], st['hb'][1] + 0.035 * s),
                     head=-1.5 * s, ph=i / 6))
    return out


def attack(arch):
    st = stance(arch)
    if arch in ('kunai', 'kunai_rev'):
        antic = P(st, hx=-0.08, hy=0.17, lean=-6, hf=(0.15, -0.62), hb=(0.45, 0.3), woff=st['woff'])
        strike = P(st, hx=0.3, hy=0.13, lean=24, hf=(0.98, 0.18), hb=(-0.28, 0.5), ff=(0.86, 0), fb=(-0.22, 0.04), tb=25, smear='arc')
        follow = P(st, hx=0.27, hy=0.16, lean=20, hf=(0.75, 0.55), hb=(-0.12, 0.5), ff=(0.86, 0), fb=(-0.2, 0.0))
    elif arch == 'fist':
        antic = P(st, hx=-0.1, hy=0.18, lean=-5, hf=(-0.28, 0.32), hb=(0.5, 0.2))
        strike = P(st, hx=0.32, hy=0.12, lean=24, hf=(1.02, -0.02), hb=(-0.3, 0.45), ff=(0.88, 0), fb=(-0.22, 0.04), tb=25, smear='thrust')
        follow = P(st, hx=0.28, hy=0.15, lean=20, hf=(0.9, 0.12), hb=(-0.15, 0.45), ff=(0.88, 0), fb=(-0.2, 0))
    elif arch == 'brute':
        antic = P(st, hx=-0.08, hy=0.14, lean=-10, hf=(-0.3, -0.7), hb=(0.4, 0.2), wa=205)
        strike = P(st, hx=0.25, hy=0.24, lean=30, hf=(0.85, 0.5), hb=(-0.2, 0.55), wa=80, ff=(0.88, 0), fb=(-0.3, 0), smear='chop')
        follow = P(st, hx=0.24, hy=0.28, lean=32, hf=(0.7, 0.72), hb=(-0.15, 0.6), wa=30, ff=(0.88, 0), fb=(-0.3, 0))
    elif arch == 'greatsword':
        antic = P(st, hx=-0.08, hy=0.16, lean=-12, hf=(0.0, -0.3), hb=(0.08, -0.22), wa=235)
        strike = P(st, hx=0.12, hy=0.16, lean=22, hf=(0.8, 0.2), hb=(0.6, 0.25), wa=92, ff=(0.8, 0), fb=(-0.3, 0.03), tb=20, smear='wide')
        follow = P(st, hx=0.12, hy=0.22, lean=26, hf=(0.68, 0.5), hb=(0.5, 0.5), wa=48, ff=(0.8, 0), fb=(-0.3, 0))
    elif arch == 'needles':
        antic = P(st, hx=-0.06, hy=0.14, lean=-8, hf=(-0.18, -0.42), hb=(0.5, 0.3), woff=0)
        strike = P(st, hx=0.2, hy=0.1, lean=18, hf=(1.0, -0.06), hb=(-0.25, 0.55), ff=(0.65, 0), fb=(-0.3, 0.03), tb=20, smear='thrust')
        follow = P(st, hx=0.18, hy=0.12, lean=14, hf=(0.9, 0.18), hb=(-0.1, 0.6), ff=(0.65, 0), fb=(-0.3, 0))
    frames = [mix(st, antic, 0.5), antic, mix(antic, strike, 0.55), strike, follow, mix(follow, st, 0.5), mix(follow, st, 0.85)]
    for i, f in enumerate(frames):
        f['ph'] = i / 7
        f['wind'] = 1.6 if i in (3, 4) else 1.0
        if i != 3:
            f['smear'] = None
    frames[2]['smear'] = None
    return frames


def cast(arch):
    st = stance(arch)
    w = dict(wa=172) if arch in ('kunai', 'kunai_rev', 'needles', 'brute') else {}
    if arch == 'greatsword':
        hold = dict(hf=(0.36, 0.3), wa=252)
        seals = [dict(hb=(0.32, 0.42)), dict(hb=(0.34, 0.2)), dict(hb=(0.34, -0.02))]
        release = dict(hb=(0.85, 0.0), hf=(0.36, 0.3))
        gather = P(st, hy=0.12, lean=4, hb=(0.3, 0.45), glow=0.2, glow_hand='b', **hold)
        s1 = P(st, hy=0.16, lean=2, glow=0.45, glow_hand='b', **hold, **seals[0])
        s2 = P(st, hy=0.14, lean=0, head=-4, glow=0.7, glow_hand='b', **hold, **seals[1])
        s3 = P(st, hy=0.12, lean=-3, glow=1.0, glow_hand='b', **hold, **seals[2])
        rel = P(st, hy=0.1, lean=14, hx=0.08, glow=0.6, glow_hand='b', **dict(hold, **release))
    else:
        gather = P(st, hy=0.12, lean=4, hf=(0.42, 0.42), hb=(0.3, 0.46), glow=0.2, **w)
        s1 = P(st, hy=0.17, lean=2, hf=(0.36, 0.36), hb=(0.33, 0.37), glow=0.45, ebb=1, **w)
        s2 = P(st, hy=0.15, lean=0, head=-4, hf=(0.4, 0.14), hb=(0.37, 0.15), glow=0.7, **w)
        s3 = P(st, hy=0.13, lean=-3, head=-2, hf=(0.42, -0.08), hb=(0.39, -0.06), glow=1.0, **w)
        rel = P(st, hy=0.1, lean=16, hx=0.12, hf=(0.98, 0.02), hb=(-0.22, 0.5), open_hand=True, glow=0.6, ff=(0.6, 0), **w)
    frames = [mix(st, gather, 0.5), gather, s1, s2, s3, rel, mix(rel, st, 0.6)]
    for i, f in enumerate(frames):
        f['ph'] = i / 7
        f['wind'] = 0.6 + f.get('glow', 0)
    frames[6]['glow'] = 0.15
    frames[6]['open_hand'] = False
    return frames


def hit(arch):
    st = stance(arch)
    if arch == 'greatsword':
        st = P(st, wa=228)
    h0 = P(st, hx=-0.1, hy=0.1, lean=-22, head=-14, hf=(0.6, -0.15), hb=(0.55, 0.0), eyes='squint', ff=(0.5, 0.03), tf=10)
    h1 = P(st, hx=-0.17, hy=0.18, lean=-12, head=-6, hf=(0.45, 0.32), hb=(0.3, 0.42), eyes='squint')
    h2 = P(st, hx=-0.08, hy=0.13, lean=-2, head=-2)
    frames = [h0, h1, h2, mix(h2, st, 0.7)]
    for i, f in enumerate(frames):
        f['ph'] = i / 4
        f['wind'] = 1.5
    return frames


def death(arch):
    st = stance(arch)
    if arch == 'greatsword':
        st = P(st, wa=228)
    d0 = P(st, hx=-0.1, hy=0.1, lean=-22, head=-14, hf=(0.6, -0.15), hb=(0.55, 0.0), eyes='squint')
    d1 = P(st, hx=-0.2, hy=0.2, lean=-28, head=-18, hf=(0.32, -0.32), hb=(0.45, -0.22), eyes='squint', ff=(0.32, 0.06), tf=20)
    d2 = P(st, hx=-0.12, hy=0.42, lean=-6, head=12, hf=(0.32, 0.72), hb=(0.22, 0.75), eyes='closed', ff=(0.38, 0), fb=(-0.3, 0), drop=True)
    limp = dict(hf=(-0.05, 0.85), hb=(0.1, 0.9), eyes='closed', drop=True, ground=True, head=6, ff=(0.05, 0.0), fb=(-0.02, 0.0))
    d3 = P(st, hy=0.3, lean=-8, rot=-30, **limp)
    d4 = P(st, hy=0.15, lean=-4, rot=-62, **limp)
    d5 = P(st, hy=-0.02, lean=0, rot=-88, lift=4, **limp)
    d6 = P(st, hy=-0.04, lean=0, rot=-90, **dict(limp, head=10))
    frames = [d0, d1, d2, d3, d4, d5, d6]
    for i, f in enumerate(frames):
        f['ph'] = i / 7
        f['wind'] = 0.8
    return frames


def dodge(arch):
    st = stance(arch)
    a = P(st, hx=-0.14, hy=0.2, lean=-14, hf=(0.35, 0.1), hb=(0.15, 0.4), ff=(0.3, 0.04))
    b = P(st, hx=-0.32, hy=0.12, lean=-10, hf=(0.3, 0.2), hb=(0.1, 0.45), ff=(0.0, 0.12), fb=(-0.6, 0.1), lift=7, tf=25, tb=25)
    c = P(st, hx=-0.26, hy=0.22, lean=-4, ff=(0.05, 0), fb=(-0.6, 0))
    frames = [a, b, c, mix(c, st, 0.6)]
    for i, f in enumerate(frames):
        f['ph'] = i / 4
        f['wind'] = 1.8
    return frames


def animations(arch: str) -> dict[str, list[dict]]:
    return {'idle': idle(arch), 'attack': attack(arch), 'cast': cast(arch), 'hit': hit(arch), 'death': death(arch), 'dodge': dodge(arch)}
