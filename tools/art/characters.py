"""Os 8 lutadores: proporções, paletas, acessórios e a "pele" do rig.

Desenhos ORIGINAIS: inspirados no papel de cada personagem, sem símbolo oficial de
vila ou de clã. As placas das bandanas são lisas ou têm marcas inventadas.
"""
from __future__ import annotations

import math

from PIL import Image

from rig import (Capsule, Circle, Glow, Group, Line, Poly, add, dirv, ik, lerp, mul, norm,
                 polar, rotate, shade, sub, transform_item, bounds)

BASE_X = 80.0

# Proporções-base (unidades do quadro de 192 px).
STD = dict(head_r=20.5, neck=4.0, torso=35.0, sw=19.0, hw=17.0, ua=20.0, la=19.0, th=24.0, sh=24.0,
           foot=11.0, arm_w=8.6, leg_w=10.5, scale=1.08)


def body(**kw):
    b = dict(STD)
    b.update(kw)
    s = b.pop('scale') * (1.08 if 'scale' in kw else 1.0)
    return {k: v * s for k, v in b.items()} | {'scale': s}


CHARACTERS: dict[str, dict] = {
    'player_semclan': dict(
        nome='Ninja sem clã', archetype='kunai', body=body(),
        skin='#f0c6a0', hair='#5b3b25', hair_style='spiky', eye='#3a2a20',
        top='#2b3040', sleeve='#2b3040', forearm='wrap', pants='#272b38', wraps='#e4e0d3', sandal='#2e3140',
        vest='#3f708f', belt='#6b4a2e', headband='#2e3a5a', plate='#b8c0c9', plate_mark='none',
        weapon='kunai', grip='forward'),
    'player_uchiha': dict(
        nome='Ninja do clã do leque (original)', archetype='kunai_rev', body=body(head_r=20, torso=36),
        skin='#f2cfb0', hair='#1b1c2a', hair_style='swept', eye='#1a1420',
        top='#1e2134', sleeve='#1e2134', forearm='wrap', pants='#22243a', wraps='#dcdde6', sandal='#262838',
        collar='#2a2e48', belt='#b3262b', sash_tail='#b3262b', armband='#b3262b',
        headband='#23263a', plate='#aeb6c2', plate_mark='none', weapon='kunai', grip='reverse'),
    'player_uzumaki': dict(
        nome='Ninja do clã do redemoinho (original)', archetype='fist', body=body(head_r=21),
        skin='#f3c9a2', hair='#d8452a', hair_style='wild', eye='#2c3f6a',
        top='#e07a2e', sleeve='#2a2a33', forearm='skin', pants='#2c2b36', wraps='#e9e4d6', sandal='#2b2a33',
        shoulder='#2a2a33', belt='#2a2a33', scarf='#c7302a', back_scroll='#e2cf9e',
        headband='#2a2a33', plate='#c4cbd3', plate_mark='none', weapon='none', grip='fist'),
    'inimigo_bandido': dict(
        nome='Bandido', archetype='brute', body=body(head_r=20, torso=38, sw=24, hw=21, arm_w=10.5, leg_w=12, ua=21, la=20, th=23, sh=22),
        skin='#c58b5f', hair='#2a1e18', hair_style='messy', eye='#2a1a12', stubble=True, brow='angry',
        top='#8a7350', sleeve='#8a7350', forearm='skin', pants='#3f3329', wraps='#8f846c', sandal='#3a2e26',
        ragged='#8a7350', belt='#b59a6a', bandana='#a8322a',
        weapon='machete', grip='forward'),
    'inimigo_renegado': dict(
        nome='Ninja renegado', archetype='kunai_rev', body=body(torso=36),
        skin='#e8bf9c', hair='#221f2b', hair_style='spiky', eye='#1f1a26', brow='angry',
        top='#4a3a66', sleeve='#4a3a66', forearm='wrap', pants='#2a2438', wraps='#b9b2c8', sandal='#24202f',
        mask='#2c2a3a', belt='#2c2a3a', scarf='#5d4682',
        headband='#2c2a3a', plate='#9aa1ab', plate_mark='scratch', weapon='kunai', grip='reverse'),
    'inimigo_ninjaagua': dict(
        nome='Mercenário da Névoa', archetype='kunai', body=body(torso=36, sw=20),
        skin='#e6c2a2', hair='#2b2f3a', hair_style='spiky', eye='#1d2633', brow='angry',
        top='#3b4a5e', sleeve='#3b4a5e', forearm='wrap', pants='#29313f', wraps='#a9b4c2', sandal='#232a36',
        mask='#3a4656', cape='#2f5f88', shoulder_armor='#8a96a4', belt='#232a36',
        headband='#2f5f88', plate='#a6b0bb', plate_mark='waves', weapon='kunai', grip='forward'),
    'chefe_zabuza': dict(
        nome='Espadachim da Névoa (original)', archetype='greatsword', frame=256, base_frac=0.4,
        body=body(head_r=17.5, neck=5, torso=42, sw=23, hw=19, ua=22, la=21, th=27, sh=27, arm_w=10, leg_w=11.5, scale=1.12),
        skin='#d8ae8b', hair='#20232b', hair_style='short', eye='#1a1a1a', brow='angry',
        top='#2b2f3a', sleeve=None, forearm='camo', camo='#6f7782', pants='#5d636e', wraps='#b8b3a6', sandal='#2a2d35',
        harness='#4a3a2e', belt='#4a3a2e', bandage='#ddd7c9',
        headband='#2b2f3a', plate='#a2aab4', plate_mark='none', plate_side=True, weapon='greatsword', grip='forward'),
    'chefe_haku': dict(
        nome='Caçador mascarado (original)', archetype='needles', frame=224,
        body=body(head_r=19, torso=37, sw=17, hw=15, ua=21, la=20, th=27, sh=27, arm_w=7.6, leg_w=9.4, scale=1.06),
        skin='#f3d8c2', hair='#1a1b26', hair_style='long', eye='#1a1b26',
        top='#e1e9ee', sleeve='#e1e9ee', forearm='sleeve', pants='#2a2e3a', wraps='#cfd7de', sandal='#262a35',
        tunic='#e1e9ee', trim='#3f93a8', belt='#3f93a8', haku_mask='#f4f3ee',
        weapon='senbon', grip='fingers'),
}


# --------------------------------------------------------------- pose padrão
DEFAULT_POSE = dict(
    hx=0.0, hy=0.08, lean=6.0, head=0.0,
    hf=(0.55, 0.42), hb=(0.30, 0.55),   # mãos relativas ao centro dos ombros (× braço)
    ff=(0.42, 0.0), fb=(-0.38, 0.0),    # pés (x relativo à base, elevação) × perna
    tf=0.0, tb=0.0,                     # inclinação dos pés (graus, + aponta a ponta para baixo)
    ebf=1, ebb=1,                       # lado do cotovelo
    wa=None, woff=0.0,                  # ângulo absoluto da arma, ou deslocamento sobre o antebraço
    rot=0.0, ground=False, lift=0.0,
    ph=0.0, wind=1.0,                   # fase das fitas/cabelo e força do vento
    eyes='open', glow=0.0, glow_hand='mid', smear=None, fist=False, drop=False, open_hand=False,
)


def pose(**kw):
    p = dict(DEFAULT_POSE)
    p.update(kw)
    return p


def mix(a: dict, b: dict, t: float) -> dict:
    out = {}
    for k in a:
        va, vb = a[k], b.get(k, a[k])
        if va is None or vb is None:
            out[k] = vb if t >= 0.5 else va
        else:
            out[k] = lerp(va, vb, t)
    return out


# --------------------------------------------------------------- esqueleto
def frame_of(ch: dict) -> int:
    return ch.get('frame', 192)


def ground_of(ch: dict) -> float:
    return frame_of(ch) - 14.0


def solve(ch: dict, p: dict) -> dict:
    b = ch['body']
    GROUND = ground_of(ch)
    L = b['th'] + b['sh']
    A = b['ua'] + b['la']
    bx = frame_of(ch) * ch.get('base_frac', BASE_X / 192)
    hip = (bx + p['hx'] * L, GROUND - 3 - L * 0.97 + p['hy'] * L)
    lean = math.radians(p['lean'])
    u = (math.sin(lean), -math.cos(lean))
    n = (-u[1], u[0])
    C = add(hip, mul(u, b['torso']))
    hr = math.radians(p['lean'] + p['head'])
    hu = (math.sin(hr), -math.cos(hr))
    head = add(C, mul(hu, b['neck'] + b['head_r'] * 0.92))
    sf = add(add(C, mul(n, b['sw'] * 0.12)), mul(u, -2.5))
    sb = add(add(C, mul(n, -b['sw'] * 0.18)), mul(u, -2.5))
    tf_ = add(C, mul(p['hf'], A))
    tb_ = add(C, mul(p['hb'], A))
    ef, hf = ik(sf, tf_, b['ua'], b['la'], p['ebf'])
    eb, hb = ik(sb, tb_, b['ua'], b['la'], p['ebb'])
    pf = add(hip, mul(n, b['hw'] * 0.16))
    pb = add(hip, mul(n, -b['hw'] * 0.16))
    af_t = (bx + p['ff'][0] * L, GROUND - 3 - p['ff'][1] * L)
    ab_t = (bx + p['fb'][0] * L, GROUND - 3 - p['fb'][1] * L)
    kf, af = ik(pf, af_t, b['th'], b['sh'], -1)
    kb, ab = ik(pb, ab_t, b['th'], b['sh'], -1)
    return dict(G=GROUND, bx=bx, hip=hip, u=u, n=n, C=C, head=head, hu=hu, sf=sf, sb=sb, ef=ef, eb=eb, hf=hf, hb=hb,
                pf=pf, pb=pb, kf=kf, kb=kb, af=af, ab=ab, L=L, A=A)


# --------------------------------------------------------------- peças
def Ribbon(pts, color):
    return Poly(pts, color, soft=True)


def ribbon(anchor, angle, ln, w, ph, amp=4.0, seg=7, taper=0.35, wave=1.3):
    """Fita/tecido ondulando a partir de um ponto (ângulo de membro)."""
    left, right = [], []
    prev = anchor
    pts = [anchor]
    for i in range(1, seg + 1):
        t = i / seg
        a = angle + math.sin(ph * 2 * math.pi + t * wave * math.pi) * amp * t * 6
        prev = add(prev, dirv(a, ln / seg))
        pts.append(prev)
    for i, q in enumerate(pts):
        t = i / seg
        if i < len(pts) - 1:
            d = norm(sub(pts[i + 1], q))
        else:
            d = norm(sub(q, pts[i - 1]))
        nn = (-d[1], d[0])
        ww = w * (1 - t * (1 - taper)) / 2
        left.append(add(q, mul(nn, ww)))
        right.append(add(q, mul(nn, -ww)))
    return left + right[::-1]


def limb(a, j, e, w1, w2, c1, c2, extras=()):
    g = Group([Capsule(a, j, w1, c1), Capsule(j, e, w2, c2)])
    g.items.extend(extras)
    return g


def wrap_lines(a, b, w, col, n=3, t0=0.25, t1=0.9):
    out = []
    d = norm(sub(b, a))
    nn = (-d[1], d[0])
    for i in range(n):
        t = t0 + (t1 - t0) * i / max(1, n - 1)
        c = lerp(a, b, t)
        out.append(Line([add(c, mul(nn, w * 0.45)), add(add(c, mul(nn, -w * 0.45)), mul(d, 1.2))], 0.8, col))
    return out


def foot(ankle, toe_dir_deg, ln, w, sandal, skin):
    toe = add(ankle, dirv(90 + toe_dir_deg, ln))
    heel = add(ankle, dirv(-90 + toe_dir_deg, 2.5))
    return [Capsule(heel, toe, w, sandal), Capsule(lerp(heel, toe, 0.35), lerp(heel, toe, 0.95), w * 0.45, skin, shaded=False, outline=False)]


def ellipse_pts(c, rx, ry, rot_deg=0, n=20):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        pts.append(rotate((c[0] + math.cos(t) * rx, c[1] + math.sin(t) * ry), c, rot_deg))
    return pts


def weapon_items(ch, J, p, hand, forearm_dir):
    kind = ch['weapon']
    if kind == 'none':
        return []
    ang = p['wa'] if p['wa'] is not None else forearm_dir + p['woff']
    d = dirv(ang)
    nn = (-d[1], d[0])
    metal = '#aeb7c1'
    dark = '#3a3f48'
    items = []
    if kind == 'kunai':
        grip_back = add(hand, mul(d, -7))
        ring = add(grip_back, mul(d, -2.5))
        base = add(hand, mul(d, 4))
        tip = add(base, mul(d, 17))
        items.append(Capsule(grip_back, base, 2.6, '#3b3226', shaded=False))
        items.append(Circle(ring, 2.4, '#5c626c', shaded=False))
        items.append(Poly([add(base, mul(nn, 3.4)), tip, add(base, mul(nn, -3.4)), add(base, mul(d, -1))], metal))
        items.append(Line([add(base, mul(d, 1)), add(tip, mul(d, -2))], 0.7, '#e8eef4'))
    elif kind == 'machete':
        base = add(hand, mul(d, 4))
        tip = add(base, mul(d, 34))
        items.append(Capsule(add(hand, mul(d, -7)), base, 3.6, '#4b3523', shaded=False))
        items.append(Capsule(add(base, mul(nn, -4.5)), add(base, mul(nn, 4.5)), 2.4, dark, shaded=False))
        items.append(Poly([add(base, mul(nn, 3)), add(tip, mul(nn, 4.5)), add(tip, mul(d, 3)), add(add(tip, mul(nn, -5.5)), mul(d, -6)),
                           add(base, mul(nn, -4))], '#9aa3ab'))
        items.append(Line([add(base, mul(nn, 2)), add(tip, mul(nn, 3))], 0.9, '#dfe5ea'))
    elif kind == 'greatsword':
        s = ch['body']['scale']
        base = add(hand, mul(d, 7 * s))
        tip = add(base, mul(d, 74 * s))
        wb = 9.5 * s
        items.append(Capsule(add(hand, mul(d, -12 * s)), base, 4.2 * s, '#3a2d26'))
        items.extend(wrap_lines(add(hand, mul(d, -12 * s)), base, 4.2 * s, '#cbbf9e', n=4, t0=0.1, t1=0.9))
        items.append(Capsule(add(base, mul(nn, -6 * s)), add(base, mul(nn, 6 * s)), 3.2 * s, '#2c2f36', shaded=False))
        # lâmina larga e reta, ponta em cunha (desenho próprio, sem furo nem entalhe canônico)
        blade = [add(base, mul(nn, wb)), add(add(tip, mul(nn, wb)), mul(d, -6 * s)), add(tip, mul(nn, -wb * 0.2)),
                 add(add(tip, mul(nn, -wb)), mul(d, -14 * s)), add(base, mul(nn, -wb))]
        items.append(Poly(blade, '#a7b0ba'))
        items.append(Line([add(add(base, mul(nn, -wb + 2)), mul(d, 3)), add(add(tip, mul(nn, -wb + 2)), mul(d, -15 * s))], 1.6, '#e8edf2'))
        items.append(Line([add(add(base, mul(nn, wb - 3)), mul(d, 3)), add(add(tip, mul(nn, wb - 3)), mul(d, -8 * s))], 1.0, '#6c7480'))
        for k in (0.35, 0.6):
            q = lerp(base, tip, k)
            items.append(Line([add(q, mul(nn, -wb * 0.4)), add(q, mul(nn, wb * 0.4))], 0.9, '#7d8590'))
    elif kind == 'senbon':
        for k, off in ((-1, -12), (0, 0), (1, 12)):
            dd = dirv(ang + off)
            a0 = add(hand, mul(dd, 1))
            items.append(Line([a0, add(a0, mul(dd, 19))], 0.9, '#dfe7ee'))
    return [Group(items, weapon=True)]


def head_items(ch, J, p):
    b = ch['body']
    r = b['head_r']
    c = J['head']
    rot = math.degrees(math.atan2(J['hu'][0], -J['hu'][1]))  # inclinação da cabeça

    def R(pt):
        return rotate(pt, c, rot)

    def PP(theta, rr):
        return R(polar(c, rr, theta))

    out_back, out_front = [], []
    skin = ch['skin']
    hair = ch['hair']
    style = ch['hair_style']
    ph = p['ph']
    # cabelo de trás (rabo/longo) e fitas da bandana ficam atrás do corpo
    if style == 'long':
        nape = PP(165, r * 0.9)
        out_back.append(Ribbon(ribbon(nape, -18 + math.sin(ph * 6.283) * 3, r * 2.3, r * 0.8, ph, amp=0.7, taper=0.35), hair))
    if ch.get('headband') and not ch.get('plate_side'):
        knot = PP(-165, r * 0.95)
        for k, ln in ((0, 1.6), (1, 1.25)):
            out_back.append(Ribbon(ribbon(knot, -70 - k * 14, r * ln, 4.2, ph + k * 0.3, amp=1.2 * p['wind'], taper=0.6), ch['headband']))
    if ch.get('bandana'):
        knot = PP(-170, r * 0.95)
        for k, ln in ((0, 1.5), (1, 1.15)):
            out_back.append(Ribbon(ribbon(knot, -60 - k * 18, r * ln, 5.0, ph + k * 0.35, amp=1.3 * p['wind'], taper=0.5), ch['bandana']))

    face = []
    face.append(Circle(c, r, skin))
    face.append(Circle(R(add(c, (-r * 0.2, r * 0.14))), r * 0.15, shade(skin, 0.85), shaded=False, outline=False))  # orelha (na nuca, lado de trás)
    # olho (olha para a direita)
    eye_c = PP(12, r * 0.52)
    eyes = p['eyes']
    ink = ch['eye']
    if eyes == 'open':
        face.append(Poly(ellipse_pts(eye_c, r * 0.17, r * 0.24, rot, 14), '#f7f5f0', shaded=False, outline=False))
        face.append(Circle(R(add(polar(c, r * 0.52, 12), (r * 0.06, r * 0.02))), r * 0.12, ink, shaded=False, outline=False))
        face.append(Circle(R(add(polar(c, r * 0.52, 12), (r * 0.1, -r * 0.07))), r * 0.04, '#ffffff', shaded=False, outline=False))
    elif eyes == 'squint':
        face.append(Line([R(add(eye_c, (-r * 0.14, -r * 0.12))), R(add(eye_c, (r * 0.12, 0))), R(add(eye_c, (-r * 0.14, r * 0.12)))], 1.3, ink))
    else:  # closed / morto
        face.append(Line([R(add(eye_c, (-r * 0.15, 0.02 * r))), R(add(eye_c, (r * 0.15, 0.06 * r)))], 1.3, ink))
    brow_y = -r * 0.3
    if ch.get('brow') == 'angry' and eyes == 'open':
        face.append(Line([R(add(eye_c, (-r * 0.2, brow_y - r * 0.06))), R(add(eye_c, (r * 0.2, brow_y + r * 0.06)))], 1.4, ink))
    elif eyes == 'open':
        face.append(Line([R(add(eye_c, (-r * 0.18, brow_y))), R(add(eye_c, (r * 0.18, brow_y - r * 0.03)))], 1.1, ink))
    covered = ch.get('mask') or ch.get('bandage') or ch.get('haku_mask')
    if not covered:
        m = PP(42, r * 0.78)
        face.append(Line([m, R(add(polar(c, r * 0.78, 42), (-r * 0.18, r * 0.02)))], 1.0, shade(skin, 0.55)))
    if ch.get('stubble'):
        for th in (25, 45, 65, 85):
            face.append(Circle(PP(th, r * 0.8), 0.7, shade(skin, 0.6), shaded=False, outline=False))
    if ch.get('mask') or ch.get('bandage'):
        col = ch.get('mask') or ch.get('bandage')
        pts = [PP(8, r * 1.0)] + [PP(t, r * 1.0) for t in range(8, 125, 12)] + [PP(150, r * 0.35), PP(-5, r * 0.25)]
        pts = [PP(5, r * 1.02)] + [PP(t, r * 1.03) for t in range(15, 120, 12)] + [PP(140, r * 0.55), PP(175, r * 0.05), R(add(polar(c, r * 0.6, 5), (0, r * 0.12)))]
        face.append(Poly(pts, col, outline=False))
        if ch.get('bandage'):
            for k in range(3):
                y = 0.25 + k * 0.22
                face.append(Line([R(add(c, (r * 0.95, r * y))), R(add(c, (-r * 0.2, r * (y + 0.12))))], 0.8, shade(col, 0.7)))
    if ch.get('haku_mask'):
        mc = R(add(c, (r * 0.42, r * 0.05)))
        face.append(Poly(ellipse_pts(mc, r * 0.55, r * 0.86, rot, 22), ch['haku_mask']))
        sl = R(add(c, (r * 0.62, -r * 0.05)))
        face.append(Line([R(add(sl, (-r * 0.12, 0))), R(add(sl, (r * 0.14, r * 0.04)))], 1.4, '#1a1b26'))
        for k in (-1, 1):
            face.append(Line([R(add(c, (r * 0.7, r * (0.28 + 0.06 * k)))), R(add(c, (r * 0.55, r * (0.45 + 0.06 * k))))], 0.8, ch['trim']))

    # cabelo da frente / topo
    if style in ('spiky', 'swept', 'wild', 'messy', 'short', 'long'):
        n_sp = {'spiky': 6, 'swept': 6, 'wild': 8, 'messy': 9, 'short': 7, 'long': 0}[style]
        amp = {'spiky': 0.42, 'swept': 0.5, 'wild': 0.55, 'messy': 0.22, 'short': 0.2, 'long': 0}[style]
        bias = {'spiky': -10, 'swept': -26, 'wild': -12, 'messy': -5, 'short': -8, 'long': 0}[style]
        th0, th1 = -18, -228
        outer = []
        steps = max(1, n_sp) * 2 if n_sp else 16
        for i in range(steps + 1):
            t = i / steps
            th = th0 + (th1 - th0) * t
            if n_sp and i % 2 == 1:
                rr = r * (1.08 + amp * (0.75 + 0.25 * math.sin(i * 2.3)))
                th += bias
            else:
                rr = r * 1.06
            if style == 'long':
                rr = r * 1.1
            outer.append(PP(th, rr))
        hairline = [PP(-218, r * 0.75), PP(-190, r * 0.32), R(add(c, (r * 0.1, -r * 0.42))), R(add(c, (r * 0.62, -r * 0.42))), PP(-18, r * 0.98)]
        face.append(Poly(outer + hairline, hair))
        if style == 'long':
            # franja que cai na frente
            face.append(Poly([R(add(c, (r * 0.3, -r * 0.95))), R(add(c, (r * 0.95, -r * 0.4))), R(add(c, (r * 0.72, r * 0.1))), R(add(c, (r * 0.5, -r * 0.45)))], hair))
            face.append(Circle(PP(-150, r * 0.95), r * 0.38, hair))  # coque
        if style in ('wild', 'spiky', 'swept'):
            face.append(Poly([R(add(c, (r * 0.35, -r * 0.95))), R(add(c, (r * 1.12, -r * 0.42))), R(add(c, (r * 0.58, -r * 0.45)))], hair))
    if ch.get('headband'):
        a = PP(-28, r * 1.0)
        bpt = PP(-168, r * 0.98)
        face.append(Capsule(a, bpt, r * 0.3, ch['headband']))
        if ch.get('plate_side'):
            pc = PP(-110, r * 0.9)
        else:
            pc = R(add(polar(c, r * 0.72, -38), (0, 0)))
        pl = ellipse_pts(pc, r * 0.36, r * 0.2, rot - 22 if not ch.get('plate_side') else rot + 15, 4)
        pl = [R(add(pc, q)) for q in ((-r * 0.34, -r * 0.18), (r * 0.36, -r * 0.08), (r * 0.36, r * 0.15), (-r * 0.34, r * 0.13))]
        face.append(Poly(pl, ch['plate']))
        mark = ch.get('plate_mark')
        if mark == 'scratch':
            face.append(Line([R(add(pc, (-r * 0.3, r * 0.12))), R(add(pc, (r * 0.3, -r * 0.08)))], 1.0, '#3b3f46'))
        elif mark == 'waves':
            for k in (-1, 1):
                face.append(Line([R(add(pc, (-r * 0.22, r * 0.06 * k))), R(add(pc, (-r * 0.05, r * (0.06 * k - 0.05)))),
                                  R(add(pc, (r * 0.12, r * 0.06 * k))), R(add(pc, (r * 0.26, r * (0.06 * k - 0.05))))], 0.7, '#4f5966'))
    if ch.get('bandana'):
        a = PP(-25, r * 1.02)
        bpt = PP(-172, r * 1.0)
        face.append(Capsule(a, bpt, r * 0.36, ch['bandana']))
    return out_back, face


def build(ch: dict, p: dict) -> list:
    """Lista de primitivas (ordem de trás para a frente) para uma pose."""
    J = solve(ch, p)
    b = ch['body']
    u, n = J['u'], J['n']
    ph = p['ph']
    back_dim = 0.8
    items: list = []
    hb_items, head = head_items(ch, J, p)

    # ---------- atrás de tudo
    if ch.get('cape'):
        top = add(J['sb'], mul(u, 2))
        items.append(Ribbon(ribbon(top, -18 + 6 * math.sin(ph * 6.283), b['torso'] * 1.4, b['sw'] * 0.8, ph, amp=0.8 * p['wind'], taper=1.6, wave=1.0), ch['cape']))
    if ch.get('scarf'):
        nk = add(J['C'], mul(n, -b['sw'] * 0.3))
        items.append(Ribbon(ribbon(nk, -60, b['torso'] * 1.35, 7.5, ph, amp=1.4 * p['wind'], taper=0.55), ch['scarf']))
    if ch.get('back_scroll'):
        a = add(add(J['C'], mul(n, -b['sw'] * 0.55)), mul(u, -2))
        bb = add(add(J['hip'], mul(n, -b['sw'] * 0.6)), mul(u, 6))
        items.append(Capsule(a, bb, 9, ch['back_scroll']))
        items.append(Line([lerp(a, bb, 0.15), lerp(a, bb, 0.15)], 9.5, '#7a4b2a'))
    if ch.get('weapon') == 'greatsword' and p.get('sheathed'):
        pass
    items.extend(hb_items)

    # ---------- braço de trás
    def arm(side):
        s, e, h = (J['sf'], J['ef'], J['hf']) if side == 'f' else (J['sb'], J['eb'], J['hb'])
        k = 1.0 if side == 'f' else back_dim
        sleeve = ch.get('sleeve') or ch['skin']
        fa = ch['forearm']
        fcol = {'wrap': ch['wraps'], 'skin': ch['skin'], 'camo': ch.get('camo', ch['wraps']), 'sleeve': sleeve}[fa]
        extras = []
        g = limb(s, e, h, b['arm_w'], b['arm_w'] * 0.88, shade(sleeve, k), shade(fcol, k))
        if fa in ('wrap', 'camo'):
            g.items.extend(wrap_lines(e, h, b['arm_w'] * 0.88, shade(fcol, 0.6 * k), n=3))
        if ch.get('armband') and side == 'f':
            q = lerp(s, e, 0.55)
            d = norm(sub(e, s))
            g.items.append(Capsule(add(q, mul(d, -1.5)), add(q, mul(d, 1.5)), b['arm_w'] * 1.05, ch['armband'], shaded=False))
        if ch.get('shoulder_armor'):
            g.items.append(Circle(lerp(s, e, 0.12), b['arm_w'] * 0.75, shade(ch['shoulder_armor'], k)))
        if ch.get('shoulder') and side == 'f':
            pass
        if fa == 'sleeve':  # manga larga (túnica)
            d = norm(sub(h, e))
            nn = (-d[1], d[0])
            cuff = add(e, mul(d, b['la'] * 0.75))
            g.items.append(Poly([add(e, mul(nn, b['arm_w'] * 0.5)), add(cuff, mul(nn, b['arm_w'] * 0.95)), add(cuff, mul(nn, -b['arm_w'] * 0.95)), add(e, mul(nn, -b['arm_w'] * 0.5))], shade(sleeve, k)))
            g.items.append(Line([add(cuff, mul(nn, b['arm_w'] * 0.9)), add(cuff, mul(nn, -b['arm_w'] * 0.9))], 1.2, shade(ch['trim'], k)))
        hr = b['arm_w'] * (0.62 if (p['fist'] or ch['grip'] == 'fist') else 0.56)
        g.items.append(Circle(h, hr, shade(ch['skin'], k)))
        if p['open_hand'] and side == 'f':
            d = norm(sub(h, e))
            g.items.append(Capsule(h, add(h, mul(d, hr * 1.4)), hr * 1.1, shade(ch['skin'], k)))
        fd = math.degrees(math.atan2(h[0] - e[0], h[1] - e[1]))
        return g, fd, h

    held_back = []
    gb, fdb, hbk = arm('b')
    gf, fdf, hfr = arm('f')
    if ch['weapon'] == 'greatsword' and not p['drop']:
        pass
    items.append(gb)

    # ---------- perna de trás
    def leg(side):
        hp, kn, an = (J['pf'], J['kf'], J['af']) if side == 'f' else (J['pb'], J['kb'], J['ab'])
        k = 1.0 if side == 'f' else back_dim
        g = limb(hp, kn, an, b['leg_w'], b['leg_w'] * 0.9, shade(ch['pants'], k), shade(ch['pants'], k))
        g.items.append(Capsule(lerp(kn, an, 0.5), lerp(kn, an, 0.97), b['leg_w'] * 0.92, shade(ch['wraps'], k)))
        g.items.extend(wrap_lines(lerp(kn, an, 0.5), an, b['leg_w'] * 0.92, shade(ch['wraps'], 0.62 * k), n=2, t0=0.2, t1=0.75))
        tilt = p['tf'] if side == 'f' else p['tb']
        g.items.extend(foot(an, tilt + math.degrees(-p['rot'] * 0) , b['foot'], b['leg_w'] * 0.62, shade(ch['sandal'], k), shade(ch['skin'], k)))
        return g

    items.append(leg('b'))

    # ---------- tronco
    hip, C = J['hip'], J['C']
    sw, hw = b['sw'], b['hw']
    torso = [add(hip, mul(n, hw * 0.55)), add(lerp(hip, C, 0.5), mul(n, sw * 0.5)), add(add(C, mul(n, sw * 0.58)), mul(u, -3)),
             add(add(C, mul(n, sw * 0.3)), mul(u, 3)), add(add(C, mul(n, -sw * 0.45)), mul(u, 2)), add(add(C, mul(n, -sw * 0.55)), mul(u, -4)),
             add(lerp(hip, C, 0.45), mul(n, -sw * 0.48)), add(hip, mul(n, -hw * 0.55))]
    # túnica de trás (Haku) / aba rasgada atrás
    if ch.get('tunic'):
        items.append(Poly([add(hip, mul(n, -hw * 0.5)), add(lerp(J['pb'], J['kb'], 1.15), mul(n, -6)), add(lerp(J['pb'], J['kb'], 1.15), mul(n, 5)), add(hip, mul(n, hw * 0.2))], shade(ch['tunic'], 0.82)))
    items.append(Poly(torso, ch['top']))
    if ch.get('harness'):
        items.append(Line([add(add(C, mul(n, sw * 0.4)), mul(u, -2)), add(lerp(hip, C, 0.2), mul(n, -sw * 0.45))], 2.2, ch['harness']))
    if ch.get('vest'):
        v = [add(lerp(hip, C, 0.12), mul(n, hw * 0.56)), add(lerp(hip, C, 0.5), mul(n, sw * 0.53)), add(add(C, mul(n, sw * 0.5)), mul(u, -4)),
             add(add(C, mul(n, -sw * 0.35)), mul(u, -2)), add(lerp(hip, C, 0.45), mul(n, -sw * 0.5)), add(lerp(hip, C, 0.12), mul(n, -hw * 0.56))]
        items.append(Poly(v, ch['vest']))
        for t in (0.3, 0.52):
            q = lerp(hip, C, t)
            items.append(Poly([add(q, mul(n, sw * 0.1)), add(q, mul(n, sw * 0.45)), add(add(q, mul(n, sw * 0.45)), mul(u, 6)), add(add(q, mul(n, sw * 0.1)), mul(u, 6))], shade(ch['vest'], 0.85)))
    if ch.get('shoulder'):
        items.append(Poly([add(add(C, mul(n, sw * 0.55)), mul(u, -3)), add(add(C, mul(n, -sw * 0.55)), mul(u, -4)), add(lerp(hip, C, 0.7), mul(n, -sw * 0.52)), add(lerp(hip, C, 0.72), mul(n, sw * 0.55))], ch['shoulder']))
        items.append(Line([add(lerp(hip, C, 0.08), mul(n, sw * 0.42)), add(lerp(hip, C, 0.92), mul(n, sw * 0.5))], 1.2, '#f3efe6'))  # zíper
    if ch.get('ragged'):
        z = []
        base_l = add(hip, mul(n, hw * 0.6))
        base_r = add(hip, mul(n, -hw * 0.6))
        for i in range(7):
            t = i / 6
            q = lerp(base_l, base_r, t)
            z.append(add(q, mul(u, -(7 if i % 2 else 1))))
        items.append(Poly([add(base_l, mul(u, 6))] + z + [add(base_r, mul(u, 6))], ch['ragged']))
        items.append(Line([add(lerp(hip, C, 0.55), mul(n, sw * 0.2)), add(lerp(hip, C, 0.7), mul(n, sw * 0.42))], 0.9, shade(ch['ragged'], 0.55)))
    # cinto
    bl = add(add(hip, mul(n, hw * 0.62)), mul(u, 3))
    br = add(add(hip, mul(n, -hw * 0.62)), mul(u, 3))
    items.append(Capsule(bl, br, 5.2, ch['belt']))
    if ch.get('sash_tail'):
        items.append(Ribbon(ribbon(br, -15, 16, 4.5, ph, amp=0.8, taper=0.6), ch['sash_tail']))
    if ch.get('collar'):
        items.append(Capsule(add(add(C, mul(n, -sw * 0.35)), mul(u, 3.5)), add(add(C, mul(n, sw * 0.3)), mul(u, 3.5)), 8.0, ch['collar']))
    if ch.get('scarf'):
        items.append(Capsule(add(add(C, mul(n, -sw * 0.45)), mul(u, 2.5)), add(add(C, mul(n, sw * 0.4)), mul(u, 2.5)), 8.5, ch['scarf']))

    # ---------- perna da frente e túnica da frente
    items.append(leg('f'))
    if ch.get('tunic'):
        kf = J['kf']
        items.append(Poly([add(hip, mul(n, hw * 0.55)), add(lerp(J['pf'], kf, 1.12), mul(n, 6)), add(lerp(J['pf'], kf, 1.12), mul(n, -5)), add(hip, mul(n, -hw * 0.3))], ch['tunic']))
        items.append(Line([add(lerp(J['pf'], kf, 1.1), mul(n, 6)), add(lerp(J['pf'], kf, 1.1), mul(n, -5))], 1.4, ch['trim']))
        items.append(Capsule(bl, br, 5.6, ch['belt']))
    if ch.get('bandana') or ch.get('ragged'):
        pass

    # ---------- cabeça
    items.extend(head)

    # ---------- braço da frente + arma + brilho
    w_back = []
    if ch['weapon'] == 'greatsword':
        # as duas mãos no cabo quando o braço de trás está perto
        pass
    items.append(gf)
    if not p['drop']:
        w_items = weapon_items(ch, J, p, hfr, fdf)
        ang = p['wa'] if p['wa'] is not None else fdf + p['woff']
        if ch['weapon'] == 'greatsword' and ang % 360 > 195:
            items[0:0] = w_items  # espada no ombro: fica atrás da cabeça e do corpo
        else:
            items.extend(w_items)
    if p['glow'] > 0:
        mid = J['hb'] if p['glow_hand'] == 'b' else lerp(J['hf'], J['hb'], 0.5)
        items.append(Glow(mid, 10 + 10 * p['glow'], '#7fd0ff', int(90 + 110 * p['glow'])))
    if p['smear']:
        items.insert(0, smear(J, p['smear'], ch))
    # arma caída (morte)
    if p['drop'] and ch['weapon'] != 'none':
        J2 = dict(J)
        fake = (J['bx'] + J['L'] * (0.3 if ch['weapon'] == 'greatsword' else 1.0), J['G'] - 2)
        items.extend(weapon_items(ch, J2, dict(p, wa=95, woff=0), fake, 95))

    # ---------- rotação global (queda) e chão
    if p['rot']:
        piv = J['hip']
        items = [transform_item(it, lambda q: rotate(q, piv, p['rot'])) if not (isinstance(it, Group) and it.weapon and p['drop']) else it for it in items]
    if p['ground']:
        x0, y0, x1, y1 = bounds(items)
        dy = J['G'] + 1 - y1
        items = [transform_item(it, lambda q: (q[0], q[1] + dy)) if not (isinstance(it, Group) and it.weapon and p['drop']) else it for it in items]
    if p['lift']:
        items = [transform_item(it, lambda q: (q[0], q[1] - p['lift'])) for it in items]
    x0, y0, x1, y1 = bounds(items)
    dx = 0.0
    if x0 < 4:
        dx = 4 - x0
    elif x1 > frame_of(ch) - 4:
        dx = frame_of(ch) - 4 - x1
    if dx:
        items = [transform_item(it, lambda q: (q[0] + dx, q[1])) for it in items]
    return items


def smear(J, kind, ch):
    """Rastro de golpe (arco claro e translúcido) desenhado dentro do quadro."""
    h = J['hf']
    col = (235, 245, 255, 150)
    pts_o, pts_i = [], []
    if kind == 'arc':        # corte de cima para a frente
        c = J['sf']
        R = J['A'] * 1.05
        for a in range(-80, 50, 10):
            pts_o.append(polar(c, R + 10, a))
        for a in range(50, -80, -10):
            pts_i.append(polar(c, R - 2 + (a + 80) / 130 * 8, a))
    elif kind == 'thrust':   # estocada/soco reto
        y = h[1]
        return Poly([(h[0] - 34, y - 2), (h[0] + 6, y - 6), (h[0] + 12, y), (h[0] + 6, y + 6), (h[0] - 34, y + 2)], col, shaded=False, outline=False)
    elif kind == 'wide':     # espada gigante: arco largo
        c = J['sf']
        R = J['A'] * 0.75 + 54 * ch['body']['scale']
        for a in range(-70, 56, 8):
            pts_o.append(polar(c, R, a))
        for a in range(56, -70, -8):
            pts_i.append(polar(c, R - 16 - (56 - a) / 126 * 10, a))
    elif kind == 'chop':     # golpe de cima para baixo
        c = J['sf']
        R = J['A'] + 30
        for a in range(-110, 40, 10):
            pts_o.append(polar(c, R, a))
        for a in range(40, -110, -10):
            pts_i.append(polar(c, R - 12, a))
    return Poly(pts_o + pts_i, col, shaded=False, outline=False)


def render(ch: dict, p: dict, ss: int = 4):
    """Um quadro RGBA (frame × frame) do personagem na pose."""
    from rig import Painter
    F = frame_of(ch)
    pt = Painter(F * ss, ss, outline_color=ch.get('outline', (20, 17, 26)))
    pt.draw(build(ch, p))
    im = pt.result(F)
    if p.get('ground'):
        # caído: o que passa do chão (fitas, cabelo) fica escondido atrás dele
        import numpy as np
        a = np.array(im)
        a[int(ground_of(ch)) + 3:, :, 3] = 0
        im = Image.fromarray(a)
    return im


def render_view(ch: dict, p: dict, view: tuple, out: int, ss: int = 4):
    """Recorte ampliado (retrato): view = (x0, y0, lado) no espaço do quadro."""
    from rig import Painter
    x0, y0, side = view
    k = out * ss / side
    pt = Painter(out * ss, k, offset=(x0, y0), outline_color=ch.get('outline', (20, 17, 26)), outline_w=1.35 * 192 / side * 0.55)
    pt.draw(build(ch, p))
    return pt.result(out)
