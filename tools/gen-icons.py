"""
Redesenha os ícones SVG repetidos ou sem sentido da entrega de arte.
  python3 tools/gen-icons.py          # reescreve os SVG listados em GLIFOS e ALIASES
  python3 tools/gen-icons.py --lista  # só mostra o que seria escrito

Fonte: assets/icones/<tipo>/<id>.svg (e <id>_locked.svg quando o tipo tem bloqueio).
Depois rode `python3 tools/prepare-assets.py` para publicar em public/assets/.

Todos os ícones usam o mesmo quadro da entrega: moldura dourada 64×64, fundo
noturno, uma diagonal sutil e dois cantos na cor de destaque; o desenho vai num
<g> central. A variante _locked repete a lógica da entrega: sem fundo interno,
desenho com opacidade .18 e o cadeado por cima. Só Python 3 + stdlib.
Ícones que não aparecem aqui continuam como a entrega os mandou.
"""
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ICONES = ROOT / 'assets' / 'icones'
# tipos em que a entrega traz variante _locked
COM_LOCKED = {'jutsu', 'clan', 'title'}

# ---------------------------------------------------------------- paleta da entrega
G = '#d9b577'   # ouro
L = '#edca80'   # ouro claro
K = '#0b101a'   # tinta (contorno)
W = '#eee8dc'   # branco-papel
R = '#f16849'   # fogo
O = '#f08a24'   # laranja
H = '#ef6466'   # vermelho (coração, Sharingan)
B = '#65bcfa'   # água / chakra
C = '#90e8ff'   # gelo
V = '#8ccf9b'   # vento
P = '#be90ea'   # genjutsu
Y = '#f4d16b'   # raio
E = '#c9a37a'   # terra
E2 = '#a47148'  # madeira escura
E3 = '#bc9165'  # pergaminho
PA = '#dbbd84'  # rolo do pergaminho
ST = '#94a1b1'  # aço
GR = '#80b693'  # verde chunin
SH = '#2e3b4e'  # sombra

GRAD = {
    'metal': '<linearGradient id="metal" x1="0" y1="0" x2="0.1" y2="1"><stop stop-color="#f8d894"/><stop offset=".35" stop-color="#be8744"/><stop offset=".65" stop-color="#7c4c26"/><stop offset="1" stop-color="#edbd67"/></linearGradient>',
    'night': '<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#263749"/><stop offset=".4" stop-color="#162536"/><stop offset="1" stop-color="#0b1019"/></linearGradient>',
}
FRAME = (
    '<path d="M12 2 H52 V4 H60 V12 H62 V52 H60 V60 H52 V62 H12 V60 H4 V52 H2 V12 H4 V4 H12Z" fill="url(#metal)" stroke="none" stroke-width="1" stroke-linejoin="miter" stroke-linecap="square"/>'
    '<path d="M12 6 H52 V7 H57 V12 H58 V52 H57 V57 H52 V58 H12 V57 H7 V52 H6 V12 H7 V7 H12Z" fill="url(#night)" stroke="none" stroke-width="1" stroke-linejoin="miter" stroke-linecap="square"/>'
    '<path d="M12 6 H52 V7 H57 V12 H58 V52 H57 V57 H52 V58 H12 V57 H7 V52 H6 V12 H7 V7 H12Z" fill="none" stroke="#364353" stroke-width="1" stroke-linejoin="miter" stroke-linecap="square"/>'
    '<polygon points="5,5 10,5 5,10" fill="#edca80" stroke="none" stroke-width="1" stroke-linejoin="miter"/>'
    '<polygon points="59,5 54,5 59,10" fill="#edca80" stroke="none" stroke-width="1" stroke-linejoin="miter"/>'
    '<polygon points="5,59 10,59 5,54" fill="#edca80" stroke="none" stroke-width="1" stroke-linejoin="miter"/>'
    '<polygon points="59,59 54,59 59,54" fill="#edca80" stroke="none" stroke-width="1" stroke-linejoin="miter"/>'
)
HEAD = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs>\n' + GRAD['metal'] + '\n' + GRAD['night'] + '\n</defs>' + FRAME


def fundo(acento):
    return ('<rect x="8" y="8" width="48" height="48" rx="2" fill="#101a28" stroke="none" stroke-width="0"/>'
            f'<g opacity=".14"><path d="M10 52 L54 10" stroke="{acento}" stroke-width="1" stroke-linecap="square"/></g>')


def cantos(acento):
    return (f'<rect x="7" y="7" width="3" height="3" rx="0" fill="{acento}" stroke="none" stroke-width="1"/>'
            f'<rect x="54" y="54" width="3" height="3" rx="0" fill="{acento}" stroke="none" stroke-width="1"/>')


LOCK = ('<rect x="35" y="36" width="23" height="23" rx="2" fill="#121a25" stroke="#68748a" stroke-width="2"/>'
        '<g transform="translate(32 32) scale(.48) translate(-32 -32)"><path d="M21 29 V20 C21 5 43 5 43 20 V29" fill="none" stroke="#edca80" stroke-width="6" stroke-linejoin="miter" stroke-linecap="square"/>'
        '<rect x="14" y="27" width="36" height="30" rx="4" fill="#eee8dc" stroke="#0b101a" stroke-width="2"/>'
        '<circle cx="32" cy="40" r="4" fill="#0b101a" stroke="none" stroke-width="1"/>'
        '<rect x="30" y="43" width="4" height="8" rx="0" fill="#0b101a" stroke="none" stroke-width="1"/></g>')


def svg(glifo, acento=G):
    return HEAD + fundo(acento) + '<g>' + glifo + '</g>' + cantos(acento) + '</svg>'


def svg_locked(glifo):
    return HEAD + '<g opacity=".18">' + glifo + '</g>' + LOCK + '</svg>'


# ---------------------------------------------------------------- primitivas
def F(d, fill, w=2, extra=''):
    """Forma cheia com contorno de tinta (w=0: sem contorno)."""
    s = f' stroke="{K}" stroke-width="{w}" stroke-linejoin="round"' if w else ''
    return f'<path d="{d}" fill="{fill}"{s}{extra}/>'


def S(d, cor, w=3, cap='round', extra=''):
    """Traço sem preenchimento."""
    return f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="round"{extra}/>'


def Cc(cx, cy, r, fill, w=0, stroke=K):
    s = f' stroke="{stroke}" stroke-width="{w}"' if w else ''
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{s}/>'


def ring(cx, cy, r, cor, w=3, extra=''):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{cor}" stroke-width="{w}"{extra}/>'


def PG(pts, fill, w=2):
    s = f' stroke="{K}" stroke-width="{w}" stroke-linejoin="round"' if w else ''
    return f'<polygon points="{pts}" fill="{fill}"{s}/>'


def num(v):
    v = round(v, 1)
    return str(int(v)) if v == int(v) else str(v)


def estrela(cx, cy, ro, ri, n, rot=-90):
    pts = []
    for i in range(2 * n):
        a = math.radians(rot + i * 180 / n)
        r = ro if i % 2 == 0 else ri
        pts.append(f'{num(cx + r * math.cos(a))},{num(cy + r * math.sin(a))}')
    return ' '.join(pts)


def poligono(cx, cy, r, n, rot=-90):
    return ' '.join(f'{num(cx + r * math.cos(math.radians(rot + i * 360 / n)))},{num(cy + r * math.sin(math.radians(rot + i * 360 / n)))}' for i in range(n))


def cp(pts):
    """Lista de pontos -> 'M.. L.. Z'."""
    return 'M' + ' L'.join(pts.split(' ')) + 'Z'


def sm(glifo, x, y, s):
    """Põe um glifo de 64×64 com o canto em (x, y) e escala s."""
    return f'<g transform="translate({num(x)} {num(y)}) scale({s})">{glifo}</g>'


def rot(glifo, a):
    return f'<g transform="rotate({a} 32 32)">{glifo}</g>'


def selo(glifo, cx, cy, r=11):
    """Selinho redondo com um glifo pequeno (usado nos pergaminhos de reforço)."""
    s = (2 * r - 4) / 64
    return Cc(cx, cy, r, K, 2, L) + sm(glifo, cx - 32 * s, cy - 32 * s, round(s, 3))


# ---------------------------------------------------------------- peças reutilizadas
PUNHO = (F('M16 51 V32 H21 V17 Q26 11 30 18 L31 12 Q39 8 41 17 L45 16 Q52 16 50 26 L52 33 L45 53Z', G)
         + S('M21 31 H46 M30 19 V30 M40 18 V30', L, 3, 'square'))
OLHO = F('M7 32 Q32 5 57 32 Q32 59 7 32Z', P) + Cc(32, 32, 12, L) + Cc(32, 32, 4, K)
ESCUDO = F('M32 7 L54 16 V35 Q52 50 32 58 Q12 50 10 35 V16Z', G) + F('M32 14 V51 Q47 43 47 33 V21Z', L, 0)
CORACAO = F('M32 55 L10 35 C-1 17 24 6 32 23 C41 6 66 17 54 35Z', H) + S('M23 30 H41 M32 21 V39', L, 4, 'square')
FOGO_D = 'M33 7 C41 21 34 24 40 29 C46 27 49 19 47 15 C62 37 53 55 37 58 C19 62 9 46 18 30 C19 39 24 41 26 38 C18 27 24 17 33 7Z'
FOGO = F(FOGO_D, R) + F('M34 29 C34 39 44 41 39 51 C34 57 25 50 27 44Z', L, 0)
RAIO = PG('34,6 18,33 31,33 24,57 50,26 36,26 44,6', Y) + PG('33,12 24,30 37,30 29,46 45,27 33,27', L, 0)
SETA = F('M32 8 L54 30 H41 V56 H23 V30 H10Z', G) + F('M32 14 L47 28 H37 V51', L, 0)  # aponta para cima


def pergaminho(cor=E3, rolo=PA, linhas=E2):
    return (f'<rect x="14" y="18" width="35" height="29" rx="3" fill="{cor}" stroke="{G}" stroke-width="2"/>'
            f'<rect x="10" y="17" width="7" height="33" rx="3" fill="{rolo}" stroke="{K}" stroke-width="2"/>'
            f'<rect x="47" y="17" width="7" height="33" rx="3" fill="{rolo}" stroke="{K}" stroke-width="2"/>'
            + (S('M25 28 H40 M25 34 H42 M25 40 H35', linhas, 2, 'square') if linhas else ''))


def figura(c=G, contorno=2):
    return Cc(32, 17, 8, c, contorno) + F('M16 56 V45 Q16 29 32 29 Q48 29 48 45 V56Z', c, contorno)


FIG_CONTORNO = 'M16 56 V45 Q16 29 32 29 Q48 29 48 45 V56Z M40 17 A8 8 0 1 1 24 17 A8 8 0 1 1 40 17Z'


def palma(c=G):
    """Mão aberta, palma de frente."""
    return (F('M20 52 V27 Q20 24 23 24 V13 Q23 10 26 10 Q29 10 29 13 V22 V9 Q29 6 32 6 Q35 6 35 9 V22 V11 Q35 8 38 8 Q41 8 41 11 V24 V16 Q41 13 44 13 Q47 13 47 16 V38 Q47 52 36 56 H24 Q20 56 20 52Z', c)
            + F('M20 40 L12 30 Q10 26 14 25 Q17 25 21 31Z', c))


def inseto(c=G):
    return (S('M22 28 L13 23 M22 36 L12 36 M23 43 L14 49 M42 28 L51 23 M42 36 L52 36 M41 43 L50 49', c, 3)
            + F('M32 20 Q42 20 42 34 Q42 48 32 48 Q22 48 22 34 Q22 20 32 20Z', c) + Cc(32, 16, 5, c, 2)
            + S('M32 22 V47', K, 2))


def nevoa(c=W, op='.7'):
    return S('M8 40 Q14 35 20 40 T32 40 T44 40 T56 40 M12 48 Q18 43 24 48 T36 48 T48 48 M8 56 Q14 51 20 56 T32 56 T44 56', c, 3, extra=f' opacity="{op}"')


def fumaca(cx, cy, s=1, c=W):
    r = lambda v: num(v * s)
    return (Cc(num(cx - 7 * s), num(cy), r(6), c) + Cc(num(cx + 7 * s), num(cy), r(6), c)
            + Cc(num(cx), num(cy - 5 * s), r(7), c))


def pena(c=W):
    return F('M14 52 Q10 30 34 12 Q50 4 52 8 Q54 14 44 28 Q32 46 14 52Z', c) + S('M14 52 L46 14', G, 2)


def balanca(c=G):
    return (S('M32 10 V50 M14 18 H50', c, 4) + S('M22 56 H42', c, 5, 'square')
            + S('M14 18 L7 36 M14 18 L21 36 M50 18 L43 36 M50 18 L57 36', L, 2)
            + F('M5 36 H23 Q14 46 5 36Z', L) + F('M41 36 H59 Q50 46 41 36Z', L) + Cc(32, 10, 4, L))


def engrenagem(cx, cy, ro, ri, n, c):
    pts, passo = [], 360 / n
    for i in range(n):
        a0 = passo * i
        for da, r in ((-passo * .32, ri), (-passo * .2, ro), (passo * .2, ro), (passo * .32, ri)):
            a = math.radians(a0 + da)
            pts.append(f'{num(cx + r * math.cos(a))},{num(cy + r * math.sin(a))}')
    return PG(' '.join(pts), c)


def colete(c, gola=L):
    return (F('M18 12 L26 10 Q32 18 38 10 L46 12 L52 22 L50 54 H14 L12 22Z', c)
            + S('M32 18 V54', K, 2) + S('M26 10 L32 30 L38 10', gola, 3))


def cutelo(c=ST):
    """Espada decapitadora: lâmina larga com furo e meia-lua."""
    return (F('M14 50 L40 10 L56 20 Q53 24 55 28 L30 60Z', c) + Cc(45, 18, 3.5, K)
            + S('M14 50 L4 58', E2, 5, 'square'))


def ondas_raio(cx, cy):
    return S(f'M{cx} {cy} l-5 -9 l6 -2 l-4 -10 M{cx} {cy} l9 -5 l1 6 l10 -3 M{cx} {cy} l7 9 l-6 2 l6 9 M{cx} {cy} l-10 5 l-1 -6 l-10 2', Y, 3)


# ---------------------------------------------------------------- glifos novos
MAOS_SELO = (F('M25 31 V12 Q25 8 28.5 8 Q32 8 32 12 V31Z', L) + F('M32 31 V11 Q32 7 35.5 7 Q39 7 39 11 V31Z', G)
             + F('M15 38 Q15 28 24 28 H40 Q49 28 49 38 V46 Q49 57 32 57 Q15 57 15 46Z', G)
             + S('M21 31 V39 M27 30 V40 M33 30 V40 M39 30 V40 M44 31 V39', K, 2) + S('M23 49 Q32 44 41 49', L, 3))
NIN = (S('M10 20 Q3 34 11 48 M54 20 Q61 34 53 48', B, 3) + Cc(13, 12, 2.5, B) + Cc(51, 12, 2.5, B) + MAOS_SELO)

MEDITAR = (S('M8 46 A24 24 0 0 1 22 12 M42 12 A24 24 0 0 1 56 46', B, 3.5) + Cc(32, 7, 2.5, B)
           + Cc(32, 17, 7, G, 2)
           + F('M24 27 Q32 23 40 27 L38 42 H26Z', G)
           + S('M25 29 L17 42 L30 45 M39 29 L47 42 L34 45', G, 5)
           + F('M11 48 Q32 36 53 48 Q32 56 11 48Z', L)
           + Cc(32, 45, 3, B))

VEL = (PG('10,18 22,32 10,46 17,46 29,32 17,18', L) + PG('24,18 36,32 24,46 31,46 43,32 31,18', G)
       + PG('38,18 50,32 38,46 45,46 57,32 45,18', G))
CRIT = (ring(32, 32, 18, G, 4) + S('M32 8 V20 M32 44 V56 M8 32 H20 M44 32 H56', L, 4, 'square')
        + PG(estrela(32, 32, 9, 4, 6), H, 1.5))

DEF_DOWN = ESCUDO + PG('32,50 21,37 27.5,37 27.5,22 36.5,22 36.5,37 43,37', H) + S('M14 16 L20 30', W, 2)
REDUCAO = (sm(ESCUDO, 18, 10, .78) + S('M6 12 L20 26', W, 3) + PG('24,30 14,26 20,20', W, 0)
           + S('M10 40 L16 34 M8 30 L15 30', Y, 3))
TENACIDADE = (S('M10 22 L20 12 L30 22 L20 32Z', G, 5) + S('M34 42 L44 32 L54 42 L44 52Z', G, 5)
              + S('M27 28 L31 32 M37 33 L33 37', L, 4) + PG(estrela(32, 32, 7, 3, 4, -45), Y, 0))
SUSTENTADO = (S('M32 32 C24 18 8 20 8 32 C8 44 24 46 32 32 C40 18 56 20 56 32 C56 44 40 46 32 32Z', B, 6)
              + S('M32 32 C24 18 8 20 8 32 C8 44 24 46 32 32 C40 18 56 20 56 32 C56 44 40 46 32 32Z', W, 2)
              + Cc(32, 32, 4, L) + Cc(32, 12, 3, B) + Cc(32, 52, 3, B))
NEVOA_EF = (S('M10 18 Q18 12 26 18 T42 18 T56 18', W, 4) + S('M8 30 Q16 24 24 30 T40 30 T56 30', W, 4, extra=' opacity=".8"')
            + S('M8 42 Q16 36 24 42 T40 42 T56 42', W, 4, extra=' opacity=".6"') + S('M12 54 Q20 48 28 54 T44 54', W, 4, extra=' opacity=".45"'))
SHARINGAN = (F('M7 32 Q32 8 57 32 Q32 56 7 32Z', W) + Cc(32, 32, 12, H, 2) + ring(32, 32, 7, K, 1.5)
             + Cc(32, 32, 3.5, K) + ''.join(Cc(num(32 + 7 * math.cos(math.radians(a))), num(32 + 7 * math.sin(math.radians(a))), 2.2, K) for a in (-90, 30, 150)))

# reforço: pergaminho + selo do atributo
REFORCO = {k: sm(pergaminho(), 0, -2, .78) + selo(g, 40, 40, 16) for k, g in {
    'tai': PUNHO, 'nin': NIN, 'gen': OLHO, 'vel': VEL, 'def': ESCUDO}.items()}

# ---------------------------------------------------------------- jutsus
J = {}
J['bunshin'] = (sm(figura(P), 0, 14, .6) + sm(figura(P), 26, 14, .6)).replace('<g transform', '<g opacity=".6" transform') + sm(figura(G), 11, 8, .7)
J['kage_bunshin'] = (sm(figura(L), 0, 10, .62) + sm(figura(L), 24, 10, .62) + sm(figura(G), 12, 6, .7)
                     + fumaca(14, 52, .7) + fumaca(50, 52, .7))
J['kawarimi'] = (F('M12 46 L40 18 Q46 12 52 18 Q58 24 52 30 L24 58 Z', E2) + F('M40 18 Q46 12 52 18 Q58 24 52 30 Q46 36 40 30 Q34 24 40 18Z', E)
                 + ring(46, 24, 3.5, E2, 2) + S('M20 46 L30 36 M26 50 L36 40', '#7c4c26', 2) + fumaca(18, 18, 1))
J['bola_de_fogo'] = (F('M28 22 Q14 30 8 52 Q22 46 38 42Z', O) + Cc(38, 28, 14, R, 2) + Cc(40, 26, 7, L)
                     + S('M18 40 L10 50', L, 2))
J['goukakyuu'] = (PG(estrela(32, 33, 25, 18, 12), R) + Cc(32, 33, 16, O) + Cc(32, 33, 9, L)
                  + S('M24 33 A8 8 0 0 1 32 25', W, 3))
J['ryuuka'] = (S('M10 54 C16 34 40 50 44 26', R, 12) + S('M10 54 C16 34 40 50 44 26', L, 4)
               + F('M36 26 L46 8 L50 18 L58 16 L52 30 Q44 36 36 26Z', R) + Cc(47, 21, 2.5, K))
J['amaterasu'] = (F(FOGO_D, '#1b0f1a', 0) + S(FOGO_D, H, 3) + F('M34 29 C34 39 44 41 39 51 C34 57 25 50 27 44Z', K, 0)
                  + S('M34 29 C34 39 44 41 39 51 C34 57 25 50 27 44Z', P, 2))
J['sennen_goroshi'] = (S('M6 30 L14 34 M4 42 L14 42 M8 54 L16 48', L, 3) + sm(rot(MAOS_SELO, 45), 10, 12, .8)
                       + PG(estrela(50, 14, 10, 4, 8), Y))
J['investida_ninja'] = (S('M8 20 H24 M6 32 H20 M8 44 H24', L, 3) + F('M22 14 H36 L52 32 L36 50 H22 L36 32Z', G)
                        + PG(estrela(54, 32, 8, 3.5, 6), Y, 0))
J['kai'] = (F('M7 32 Q32 8 57 32 Q32 56 7 32Z', P) + Cc(32, 32, 10, L) + Cc(32, 32, 4, K)
            + S('M32 4 L28 18 L36 26 L30 34 L36 44 L32 60', W, 3) + S('M12 12 L18 18 M52 12 L46 18 M12 52 L18 46 M52 52 L46 46', W, 3))
J['daitoppa'] = (S('M6 18 H38 Q50 18 50 10 Q50 4 44 6', V, 5) + S('M6 32 H50 Q58 32 58 26', V, 6)
                 + S('M6 46 H38 Q50 46 50 54 Q50 60 44 58', V, 5) + S('M12 25 H30 M12 39 H34', L, 2))
DORYUU = (F('M8 54 V30 Q12 20 20 24 Q26 12 34 20 Q42 12 48 24 Q54 22 56 30 V54Z', E)
          + S('M8 38 H56 M8 46 H56 M20 30 V38 M36 30 V38 M28 38 V46 M46 38 V46 M16 46 V54 M38 46 V54', E2, 2)
          + S('M4 56 H60', E2, 3))
J['doryuuheki'] = DORYUU
J['suiryuudan'] = (S('M10 56 C4 38 30 44 30 30 C30 18 40 16 44 18', B, 10) + S('M10 56 C4 38 30 44 30 30 C30 18 40 16 44 18', C, 3)
                   + F('M36 12 L56 10 L52 18 L58 22 L44 28 Q34 26 36 12Z', B) + Cc(44, 16, 2.5, K)
                   + S('M38 12 L34 4 M44 11 L44 4', C, 2))
J['kongou_fuusa'] = (S('M8 56 L22 42', L, 4) + ''.join(
    f'<rect x="-7" y="-4" width="14" height="8" rx="4" fill="none" stroke="{c}" stroke-width="4" transform="translate({x} {y}) rotate({a})"/>'
    for x, y, a, c in ((22, 42, -45, G), (30, 34, 45, L), (38, 26, -45, G))) + PG('44,20 58,6 52,24 46,26', W))
J['genjutsu_sharingan'] = (ring(32, 32, 26, P, 2, ' opacity=".6"') + ring(32, 32, 21, P, 2) + SHARINGAN.replace('M7 32 Q32 8 57 32 Q32 56 7 32Z', 'M10 32 Q32 12 54 32 Q32 52 10 32Z'))
J['konoha_senpuu'] = (F('M32 14 Q50 26 32 50 Q14 26 32 14Z', GR) + S('M32 18 V48 M32 30 L26 26 M32 38 L38 34', K, 2)
                      + S('M10 34 A22 22 0 0 1 38 10', L, 4) + PG('38,4 44,12 34,14', L, 0)
                      + S('M54 30 A22 22 0 0 1 26 54', L, 4) + PG('26,60 20,52 30,50', L, 0))
J['jubaku_satsu'] = (ring(32, 32, 24, P, 2, ' opacity=".6"') + F('M26 58 Q28 40 22 30 Q16 22 10 20 L14 16 Q22 20 28 26 Q28 14 22 8 L28 6 Q34 16 33 26 Q38 16 48 12 L50 16 Q38 24 37 36 Q36 46 40 58Z', E2)
                     + S('M18 44 Q32 34 46 44', P, 4) + S('M20 52 Q32 44 44 52', P, 4))
J['nehan_shouja'] = (sm(pena(W), 4, 8, .55) + sm(pena(L), 26, 4, .5) + sm(pena(W), 16, 26, .6)
                     + S('M44 40 H52 L44 48 H52', P, 2.5) + S('M48 30 H54 L48 36 H54', P, 2))
J['gogyou_fuuin'] = (ring(32, 32, 23, P, 3) + PG(estrela(32, 33, 21, 8, 5), 'none', 0).replace('fill="none"', f'fill="none" stroke="{L}" stroke-width="2"')
                     + ''.join(Cc(num(32 + 21 * math.cos(math.radians(-90 + i * 72))), num(33 + 21 * math.sin(math.radians(-90 + i * 72))), 4.5, c, 2)
                               for i, c in enumerate((R, V, E, B, Y))) + Cc(32, 33, 5, P))
J['naruto_rendan'] = (PG(estrela(32, 14, 10, 4, 8), Y) + sm(figura(G), 2, 34, .38) + sm(figura(L), 20, 30, .4) + sm(figura(G), 38, 34, .38)
                      + S('M16 34 L26 22 M32 30 V24 M48 34 L38 22', L, 3))
J['shishi_rendan'] = (PG(estrela(32, 32, 26, 18, 14), O) + Cc(32, 33, 15, G, 2) + Cc(26, 30, 2.5, K) + Cc(38, 30, 2.5, K)
                      + F('M28 38 H36 L32 43Z', K, 0) + S('M26 46 Q32 49 38 46', K, 2))
J['chidori'] = (ring(32, 34, 16, B, 2, ' opacity=".7"') + ondas_raio(32, 34) + Cc(32, 34, 9, W, 2) + Cc(32, 34, 4, Y))
J['rasengan'] = (Cc(32, 32, 22, B, 2) + S('M18 36 C16 22 34 14 44 24 M42 42 C30 50 16 42 16 34 M30 18 C44 16 52 32 44 42', W, 3)
                 + Cc(32, 32, 6, W) + S('M14 22 A20 20 0 0 1 24 12', C, 2))
J['kuchiyose'] = (S('M8 48 Q32 60 56 48 Q32 36 8 48Z', L, 3) + S('M14 46 L50 50 M20 54 L44 42 M32 40 V56', G, 2)
                  + fumaca(32, 32, 1.4) + Cc(20, 18, 5, W) + Cc(44, 16, 6, W) + Cc(32, 10, 5, W))
J['rasen_shuriken'] = (''.join(F('M30 30 Q29 14 51 7 Q43 20 42 34Z', W, 2, f' transform="rotate({a} 32 32)"') for a in (0, 90, 180, 270))
                       + Cc(32, 32, 11, B, 2) + S('M26 30 Q32 22 38 30 Q32 40 28 34', W, 2) + ring(32, 32, 16, V, 2))
J['omote_renge'] = (''.join(F('M32 34 Q22 22 32 8 Q42 22 32 34Z', c, 2, f' transform="rotate({a} 32 40)"') for a, c in ((-70, G), (70, G), (-35, L), (35, L), (0, W)))
                    + F('M10 44 Q32 56 54 44 Q32 50 10 44Z', GR) + Cc(32, 40, 4, O))
J['hakke_no_fuuin_shiki'] = (PG(poligono(32, 32, 25, 8, -67.5), 'none', 0).replace('fill="none"', f'fill="none" stroke="{G}" stroke-width="3"')
                             + ''.join(S('M27 11 H37 M27 15 H37', L, 2, 'square').replace('/>', f' transform="rotate({a} 32 32)"/>') for a in range(0, 360, 45))
                             + Cc(32, 32, 10, K, 2, L) + S('M32 32 m-5 0 a5 5 0 1 1 5 5 a3 3 0 1 1 -3 -3', P, 2.5))


def disco_trigramas(c=G):
    return (ring(32, 32, 24, c, 2) + ''.join(S('M28 9 H36', L, 3, 'square').replace('/>', f' transform="rotate({a} 32 32)"/>') for a in range(0, 360, 45)))


J['jyuuken'] = ring(32, 34, 25, B, 2, ' opacity=".6"') + sm(palma(G), 6, 6, .8) + Cc(28, 40, 3, B) + Cc(38, 26, 2, B) + Cc(26, 24, 2, B)
J['hakke_sanjuuni'] = disco_trigramas() + sm(palma(L), 14, 12, .58)
J['hakke_rokujuuyon'] = (disco_trigramas(B) + PG(estrela(32, 32, 20, 13, 8, -67.5), '#1d3b5a', 1.5) + sm(palma(G), 12, 11, .62))
J['kaiten'] = (F('M8 50 A24 24 0 0 1 56 50Z', '#1d3b5a') + S('M8 50 A24 24 0 0 1 56 50', B, 3)
               + S('M14 40 A19 19 0 0 1 40 22', W, 3) + PG('42,16 46,26 36,24', W, 0) + S('M50 40 A19 19 0 0 0 44 30', W, 3)
               + sm(figura(G), 22, 30, .3) + S('M4 52 H60', L, 3))
SOMBRA = '#1d2735'
J['kagemane'] = (F('M4 58 Q6 40 22 42 Q34 44 38 34 L54 36 Q54 52 30 56Z', SOMBRA) + S('M4 58 Q6 40 22 42 Q34 44 38 34', L, 2.5)
                 + sm(figura(G), 22, 2, .58))
J['kagenui'] = (F('M6 58 H58 V54 H6Z', SOMBRA) + ''.join(F(f'M{x} 56 L{x + 3} 56 L{x + dx} {y}Z', SOMBRA, 0) + S(f'M{x} 56 L{x + dx} {y} L{x + 3} 56', L, 1.5)
                                                     for x, dx, y in ((10, 6, 14), (20, 4, 8), (30, 4, 18), (40, 2, 6), (48, 0, 16))))
J['kage_kubishibari'] = (F('M4 58 Q32 50 60 58Z', SOMBRA) + sm(palma(SOMBRA), 10, 4, .72).replace(f'stroke="{K}"', f'stroke="{L}"') + Cc(18, 14, 3, L))
J['bubun_baika'] = (sm(PUNHO, 18, 4, .72) + sm(figura(L), 2, 34, .34)
                    + S('M12 26 L4 18 M4 26 V18 H12', W, 3, 'square') + S('M54 54 L60 60 M60 52 V60 H52', W, 3, 'square'))
J['baika'] = (Cc(32, 34, 17, G, 2) + Cc(32, 14, 7, G, 2) + Cc(27, 30, 2, K) + Cc(37, 30, 2, K)
              + S('M12 22 L6 16 M6 22 V16 H12 M52 22 L58 16 M52 16 H58 V22 M12 48 L6 54 M6 48 V54 H12 M52 48 L58 54 M58 48 V54 H52', W, 3, 'square'))
J['nikudan_sensha'] = (S('M4 24 H16 M2 34 H14 M4 44 H16', L, 3) + Cc(38, 34, 19, G, 2)
                       + S('M38 34 m-12 0 a12 12 0 1 1 12 12 a8 8 0 1 1 -8 -8 a4 4 0 1 1 4 4', E2, 3)
                       + S('M18 56 Q24 50 30 56 M44 56 Q50 50 56 56', E, 3))
J['chou_baika'] = (sm(figura(G), 6, 2, .82) + S('M8 50 V20 M4 26 L8 20 L12 26 M56 50 V20 M52 26 L56 20 L60 26', W, 3) + S('M4 58 H60', L, 3))
J['kikaichuu'] = sm(inseto(G), 2, 2, .5) + sm(inseto(L), 30, 6, .45) + sm(inseto(G), 14, 30, .5)
def _dentro_fig(x, y):
    return (x - 32) ** 2 + (y - 17) ** 2 <= 64 or (16 <= x <= 48 and 30 <= y <= 56 and (y >= 45 or (x - 32) ** 2 + (y - 45) ** 2 <= 256))


def _linhas_pontos(dentro, y0, y1, x0=8, x1=56, passo=5):
    """Fileiras de pontos (traço com dasharray 0) cobrindo uma silhueta."""
    d = []
    for y in range(y0, y1, passo):
        xs = [x for x in range(x0, x1 + 1, passo) if dentro(x, y)]
        if xs:
            d.append(f'M{xs[0]} {y} H{xs[-1] + .1}')
    return ' '.join(d)


J['mushi_bunshin'] = (S(_linhas_pontos(_dentro_fig, 11, 57, 17), G, 4.4, extra=' stroke-dasharray="0 5"')
                      + sm(inseto(L), 44, 6, .26) + sm(inseto(L), 4, 22, .24) + sm(inseto(L), 46, 30, .2))
J['mushidama'] = (Cc(32, 32, 21, SH, 2, G) + ''.join(Cc(num(32 + r * math.cos(math.radians(a))), num(32 + r * math.sin(math.radians(a))), 2.4, c)
                                                    for r, n, c in ((17, 12, L), (10, 7, G)) for a in range(0, 360, 360 // n)) + Cc(32, 32, 3, L)
                  + sm(inseto(L), 44, 2, .25))
J['golpe_pesado'] = (F('M10 50 L40 18 Q46 10 54 14 Q60 20 52 28 L18 58Z', E2) + S('M44 16 l2 2 M50 22 l2 2 M40 24 l2 2 M46 28 l2 2', K, 3)
                     + S('M10 50 L4 56', E, 6, 'square') + PG(estrela(52, 46, 9, 4, 8), Y, 0))
J['kunai_lancada'] = (S('M4 40 H20 M8 50 H22 M10 30 H20', L, 3) + rot(PG('15,49 33,16 49,9 46,27 24,52', ST) + S('M33 16 L46 27', W, 2)
                                                                     + S('M20 45 L10 53', E2, 4, 'square') + ring(8, 55, 3, G, 2), 30))
J['kubikiribouchou'] = cutelo(ST) + S('M22 44 L44 12', W, 2)
J['kirigakure'] = sm(figura(ST), 12, 4, .62) + nevoa(W, '.85') + S('M8 26 Q14 21 20 26 T32 26 T44 26 T56 26', W, 3, extra=' opacity=".5"')
J['muon_satsujin'] = (S('M10 50 Q30 44 52 10', W, 4) + S('M14 54 Q36 46 56 16', ST, 2) + nevoa(W, '.35')
                      + F('M40 14 L54 6 L48 20Z', ST) + Cc(18, 18, 2, H))
J['senbon'] = ''.join(S(f'M{x} {y} l26 -26', ST, 3) + Cc(x, y, 2, W) for x, y in ((10, 40), (18, 48), (26, 56))) + S('M36 14 l4 -4 M44 22 l4 -4 M52 30 l4 -4', W, 2)
ESPELHOS = (''.join(f'<rect x="-6" y="-10" width="12" height="20" fill="{C}" fill-opacity=".75" stroke="{W}" stroke-width="2" transform="translate({num(32 + 22 * math.cos(math.radians(a)))} {num(40 + 22 * math.sin(math.radians(a)))}) rotate({a + 90})"/>'
                    for a in (-180, -135, -90, -45, 0)) + sm(figura(B), 22, 26, .3) + S('M6 56 H58', C, 2))
J['makyou_hyoushou'] = ESPELHOS
J['sensatsu_suishou'] = (Cc(32, 32, 4, B) + ''.join(F('M0 -26 L2 -12 L0 -8 L-2 -12Z', C, 1, f' transform="translate(32 32) rotate({a})"') for a in range(0, 360, 30)))
J['tsukuyomi'] = (Cc(32, 32, 22, H, 2) + Cc(40, 26, 18, '#5a1a24') + Cc(24, 38, 3, '#8e2834') + Cc(18, 28, 2, '#8e2834')
                  + S('M12 54 H52', P, 2) + Cc(50, 50, 1.5, W) + Cc(14, 12, 1.5, W))

# ---------------------------------------------------------------- outros tipos
GLIFOS = {f'jutsu/{k}': v for k, v in J.items()}
GLIFOS.update({
    'attr/nin': NIN,
    'attr/vel': VEL,
    'attr/crit': CRIT,
    'ui/meditate': MEDITAR,
    'effect/def-down': DEF_DOWN,
    'effect/tenacity': TENACIDADE,
    'effect/sustained': SUSTENTADO,
    'effect/mist': NEVOA_EF,
    'effect/sharingan': SHARINGAN,
    **{f'effect/scroll_{k}': v for k, v in REFORCO.items()},
    # itens
    'item/kit_medico': (F('M8 22 H56 V52 H8Z', W) + S('M24 22 V14 H40 V22', G, 4, 'square') + PG('28,26 36,26 36,33 43,33 43,41 36,41 36,48 28,48 28,41 21,41 21,33 28,33', H, 0)),
    'item/pilula_chakra': (rot(F('M18 24 H32 V40 H18 Q10 40 10 32 Q10 24 18 24Z', W) + F('M32 24 H46 Q54 24 54 32 Q54 40 46 40 H32Z', B) + S('M16 28 H26', '#ffffff', 2), -35)
                           + PG(estrela(50, 14, 6, 2, 4), C, 0) + PG(estrela(14, 50, 4, 1.5, 4), C, 0)),
    'item/pergaminho_reforco': pergaminho(linhas='') + F('M32 20 L43 31 H37 V44 H27 V31 H21Z', GR),
    'item/katana': (S('M14 50 Q30 26 56 8', ST, 6) + S('M16 46 Q30 26 54 9', W, 2) + S('M20 46 L12 38', L, 4, 'square')
                    + S('M15 44 L6 54', E2, 6, 'square') + S('M10 49 l2 2', L, 2)),
    'item/colete_ninja': colete(GR),
    'item/colete_reforcado': colete(ST, G) + ''.join(f'<rect x="{x}" y="{y}" width="9" height="8" rx="1" fill="{G}" stroke="{K}" stroke-width="1.5"/>' for x, y in ((18, 30), (37, 30), (18, 42), (37, 42))),
    'item/pergaminho_raro': pergaminho('#8b6bb0', L, '') + PG(estrela(32, 33, 11, 5, 5), Y, 1.5) + PG(estrela(52, 10, 5, 2, 4), W, 0) + PG(estrela(10, 54, 4, 1.5, 4), W, 0),
    # estilos e presets
    'style/estrategista': (F('M8 10 H56 V54 H8Z', SH, 2) + S('M8 10 H56 V54 H8Z', G, 2) + S('M14 16 L24 26 M24 16 L14 26', H, 3)
                           + ring(44, 44, 6, B, 3) + S('M22 32 Q22 46 34 46', L, 3, extra=' stroke-dasharray="3 3"') + PG('34,40 40,46 34,52', L, 0)),
    'style/muralha': (S('M6 56 H58', L, 3) + ''.join(f'<rect x="{x}" y="{y}" width="14" height="9" fill="{G}" stroke="{K}" stroke-width="2"/>'
                                                     for x, y in ((9, 45), (25, 45), (41, 45), (17, 34), (33, 34), (9, 23), (25, 23), (41, 23), (17, 12), (33, 12)))),
    'style/agil': sm(pena(L), 10, 4, .85) + S('M6 22 H18 M4 32 H14 M8 42 H16', W, 3),
    'style/equilibrado': balanca(),
    # interface
    'ui/back': rot(SETA, -90),
    'ui/next': rot(SETA, 90),
    'ui/up': SETA,
    'ui/down': rot(SETA, 180),
    'ui/home': F('M8 32 L32 10 L56 32 H48 V54 H16 V32Z', G) + F('M27 54 V40 H37 V54Z', K, 0) + F('M40 14 H46 V24 L40 19Z', L),
    'ui/menu': S('M12 18 H52 M12 32 H52 M12 46 H52', G, 7, 'square'),
    'ui/profile': ring(32, 32, 24, L, 3) + Cc(32, 25, 9, G, 2) + F('M14 50 Q16 37 32 37 Q48 37 50 50 Q42 56 32 56 Q22 56 14 50Z', G),
    'ui/cancel': ring(32, 32, 21, G, 6) + S('M18 46 L46 18', L, 6, 'square'),
    'ui/confirm': F('M10 14 Q10 10 14 10 H50 Q54 10 54 14 V50 Q54 54 50 54 H14 Q10 54 10 50Z', G) + S('M18 33 L28 43 L46 22', K, 7),
    'ui/attack': (rot(PG('15,49 33,16 49,9 46,27 24,52', G) + S('M33 16 L46 27 M20 45 L10 55', L, 3, 'square'), 0)
                  + S('M40 40 Q50 36 56 26 M44 48 Q54 44 58 36', W, 3)),
    'ui/power': (S('M10 46 A23 23 0 1 1 54 46', G, 6) + S('M16 26 l4 3 M32 15 v5 M48 26 l-4 3', L, 3) + S('M32 42 L45 22', R, 4) + Cc(32, 42, 5, L, 2)),
    'ui/radar': (S(cp(poligono(32, 32, 24, 8, -90)), G, 3) + S(cp(poligono(32, 32, 13, 8, -90)), G, 1.5)
                 + S('M32 8 V56 M8 32 H56 M15 15 L49 49 M49 15 L15 49', G, 1)
                 + PG(' '.join(f'{num(32 + r * math.cos(math.radians(-90 + i * 45)))},{num(32 + r * math.sin(math.radians(-90 + i * 45)))}' for i, r in enumerate((22, 11, 19, 8, 21, 13, 9, 17))), B, 2).replace(f'fill="{B}"', f'fill="{B}" fill-opacity=".85"')),
    'ui/settings': engrenagem(32, 32, 24, 18, 8, G) + Cc(32, 32, 8, K, 2, L),
    'ui/transform': (F('M32 6 C40 16 52 16 50 30 C56 40 54 52 46 58 H18 C10 52 8 40 14 30 C12 16 24 16 32 6Z', P)
                     + sm(figura(G), 15, 18, .54)),
    'ui/xp': (PG(estrela(30, 34, 20, 6, 4), Y) + PG(estrela(48, 14, 8, 2.5, 4), L, 0) + PG(estrela(14, 14, 5, 1.8, 4), W, 0) + PG(estrela(50, 50, 5, 1.8, 4), W, 0)),
    'ui/level_up': (PG('32,8 52,24 44,24 32,15 20,24 12,24', Y) + PG('32,22 52,38 44,38 32,29 20,38 12,38', G)
                    + PG('32,36 52,52 44,52 32,43 20,52 12,52', G)),
    'ui/help': ring(32, 32, 25, G, 3) + S('M23 23 Q23 13 32 13 Q42 13 42 22 Q42 28 32 32 V39', L, 6) + Cc(32, 49, 4, L),
    'ui/retry': S('M48 22 A19 19 0 1 0 51 36', G, 6) + PG('54,10 56,30 40,24', G, 0),
    'ui/swap': (S('M10 22 H44', G, 6, 'square') + PG('42,12 56,22 42,32', G, 0) + S('M54 42 H20', L, 6, 'square') + PG('22,32 8,42 22,52', L, 0)),
    'ui/pause': F('M16 12 H28 V52 H16Z', G) + F('M36 12 H48 V52 H36Z', G),
    'ui/filter': F('M8 12 H56 L38 32 V50 L26 56 V32Z', G) + S('M16 18 H48', L, 2),
    'ui/search': ring(27, 27, 15, G, 6) + S('M38 38 L54 54', L, 8) + S('M19 22 A9 9 0 0 1 26 16', W, 2),
    'ui/tab': (F('M8 54 V24 H22 L26 16 H38 L42 24 H56 V54Z', G) + S('M8 24 H22 M42 24 H56', K, 2) + F('M10 12 H22 L24 18 H8Z', SH, 1)),
    'ui/new': PG(estrela(32, 32, 25, 18, 12), R) + S('M32 18 V35', W, 6, 'square') + Cc(32, 45, 3.5, W),
    'ui/item': (F('M26 8 H38 V20 Q52 26 52 40 Q52 56 32 56 Q12 56 12 40 Q12 26 26 20Z', W) + F('M14 40 Q22 36 32 40 Q42 44 50 40 Q50 54 32 54 Q14 54 14 40Z', H, 0)
                + F('M24 6 H40 V12 H24Z', E2) + S('M20 30 Q18 36 20 42', '#ffffff', 2)),
    'ui/inventory': (F('M12 26 Q12 18 20 18 H44 Q52 18 52 26 V50 Q52 56 46 56 H18 Q12 56 12 50Z', E2) + F('M12 26 Q32 40 52 26 V22 Q32 32 12 22Z', E)
                     + S('M24 18 Q24 8 32 8 Q40 8 40 18', G, 4) + Cc(32, 33, 4, L, 2)),
    'ui/ficha': (F('M14 6 H44 L52 14 V58 H14Z', W) + F('M44 6 V14 H52Z', PA) + Cc(26, 20, 5, G, 2) + F('M18 34 Q18 26 26 26 Q34 26 34 34Z', G)
                 + S('M38 22 H46 M38 28 H46 M20 40 H46 M20 46 H46 M20 52 H38', E2, 2.5, 'square')),
    'ui/equipped': (rot(PG('15,49 33,16 49,9 46,27 24,52', G) + S('M33 16 L46 27 M20 45 L10 55', L, 3, 'square'), 0)
                    + Cc(44, 44, 11, '#3f8a55', 2) + S('M38 44 L43 49 L51 39', W, 3)),
    'ui/sustained': SUSTENTADO,
    'ui/story_point': (F('M32 58 Q14 36 14 25 Q14 8 32 8 Q50 8 50 25 Q50 36 32 58Z', G) + Cc(32, 25, 8, K) + Cc(32, 25, 4, L)),
    'ui/reduction': REDUCAO,
    # menu
    'menu/continue': ring(32, 32, 24, G, 3) + F('M25 18 L47 32 L25 46Z', L),
    'menu/history': (S('M16 8 H48 M16 56 H48', G, 4, 'square') + F('M18 10 H46 Q46 24 34 32 Q46 40 46 54 H18 Q18 40 30 32 Q18 24 18 10Z', SH)
                     + S('M18 10 H46 Q46 24 34 32 Q46 40 46 54 H18 Q18 40 30 32 Q18 24 18 10Z', L, 2.5) + F('M22 52 Q32 42 42 52Z', L, 0) + F('M24 16 H40 Q38 24 32 28 Q26 24 24 16Z', L, 0)),
    'menu/titles': (F('M20 6 H30 L36 26 H26Z', H) + F('M44 6 H34 L28 26 H38Z', B) + Cc(32, 40, 16, G, 2) + PG(estrela(32, 40, 10, 4.5, 5), L, 0)),
    'menu/bingo': (F('M12 8 H50 Q54 8 54 12 V56 H16 Q12 56 12 52Z', '#7a2e30') + S('M18 8 V56', K, 2) + Cc(36, 28, 8, W, 2)
                   + S('M28 40 Q36 48 44 40 M28 18 L44 38 M44 18 L28 38', H, 3)),
    # títulos
    'title/cacador_de_bandidos': (ring(32, 32, 22, H, 3) + S('M32 4 V14 M32 50 V60 M4 32 H14 M50 32 H60', H, 3, 'square')
                                  + Cc(32, 30, 11, G, 2) + F('M21 32 H43 V38 Q32 46 21 38Z', SH) + Cc(28, 27, 1.8, K) + Cc(36, 27, 1.8, K)),
    'title/colecionador': (sm(pergaminho('#8b6bb0', L, ''), 2, 26, .6) + sm(pergaminho('#8b6bb0', L, ''), 24, 26, .6) + sm(pergaminho('#8b6bb0', L, ''), 13, 4, .6)
                           + PG(estrela(32, 22, 4, 1.8, 5), Y, 0) + PG(estrela(21, 44, 4, 1.8, 5), Y, 0) + PG(estrela(43, 44, 4, 1.8, 5), Y, 0)),
    'title/demonio_da_nevoa': sm(cutelo(ST), 4, 0, .85) + nevoa(W, '.8'),
    'title/mestre_de_jutsus': (S('M16 54 Q6 40 10 22 M48 54 Q58 40 54 22', GR, 5) + S('M10 30 l-4 -2 M9 40 l-5 0 M12 48 l-4 2 M54 30 l4 -2 M55 40 l5 0 M52 48 l4 2', GR, 3)
                               + sm(NIN, 13, 13, .6) + PG(estrela(32, 10, 5, 2.2, 5), Y, 0)),
    'title/novo_chunin': (S('M4 30 Q10 26 14 30 M50 30 Q56 26 60 30', SH, 6) + S('M4 40 Q8 50 2 56 M60 40 Q56 50 62 56', SH, 4)
                          + F('M12 22 H52 Q56 22 56 26 V40 Q56 44 52 44 H12 Q8 44 8 40 V26 Q8 22 12 22Z', ST)
                          + ''.join(Cc(x, y, 1.5, K) for x in (13, 51) for y in (27, 39)) + PG(estrela(32, 33, 7, 3, 4), GR, 1.5)),
    'title/por_um_fio': (S('M32 55 L10 35 C-1 17 24 6 32 23 C41 6 66 17 54 35Z', H, 3) + F('M24 48 Q32 44 40 48 L32 55Z', H, 0)
                         + S('M6 10 Q20 26 30 40 Q34 46 30 50', W, 1.5) + S('M6 10 l4 0 l0 4', W, 1.5)),
    'title/sem_um_arranhao': (ESCUDO + PG(estrela(46, 14, 7, 2.5, 4), W, 0) + PG(estrela(14, 46, 5, 1.8, 4), W, 0) + PG(estrela(54, 40, 4, 1.5, 4), W, 0)),
})

# ---------------------------------------------------------------- graus
# Letras desenhadas como traço (sem <text>, sem fonte do sistema).
LETRA = {
    'D': 'M25 22 V44 H30 Q40 44 40 33 Q40 22 30 22Z',
    'C': 'M41 25 Q37 21 32 21 Q22 21 22 33 Q22 45 32 45 Q37 45 41 41',
    'B': 'M25 22 V44 H33 Q40 44 40 38.5 Q40 33 33 33 H25 M25 22 H32 Q38 22 38 27.5 Q38 33 32 33',
    'A': 'M22 45 L32 21 L42 45 M26 37 H38',
    'S': 'M40 25 Q37 21 32 21 Q24 21 24 27 Q24 32 32 33 Q40 34 40 39 Q40 45 32 45 Q26 45 23 41',
    'R': 'M25 45 V22 H32 Q39 22 39 28 Q39 34 32 34 H25 M31 34 L39 45',
    '+': 'M41 33 H51 M46 28 V38',
}


def letra(ch, dx=0):
    d = LETRA[ch]
    t = f' transform="translate({dx} 0)"' if dx else ''
    return S(d, K, 9, 'square').replace('/>', f'{t}/>') + S(d, W, 4.5, 'square').replace('/>', f'{t}/>')


def arco_circ(cx, cy, r):
    return f'M{cx - r} {cy} A{r} {r} 0 1 1 {cx + r} {cy} A{r} {r} 0 1 1 {cx - r} {cy}Z'


GRAUS = {
    # D: círculo liso
    'd': (F(arco_circ(32, 32, 24), '#8790a2', 3), letra('D')),
    # D+: círculo com quatro pontas
    'd_plus': (F('M32 4 L37 10 A22.5 22.5 0 0 1 54 27 L60 32 L54 37 A22.5 22.5 0 0 1 37 54 L32 60 L27 54 A22.5 22.5 0 0 1 10 37 L4 32 L10 27 A22.5 22.5 0 0 1 27 10Z', '#80b693', 3),
               letra('D', -5) + letra('+', 2)),
    # C: hexágono
    'c': (F(cp(poligono(32, 32, 27, 6, -90)), '#65b7e7', 3), letra('C')),
    # B: losango
    'b': (F('M32 3 L61 32 L32 61 L3 32Z', '#ba93dd', 3), letra('B')),
    # A: escudo
    'a': (F('M32 4 L55 12 V32 Q54 50 32 60 Q10 50 9 32 V12Z', '#e8b35d', 3), letra('A')),
    # S: estrela de cinco pontas
    's': (F(cp(estrela(32, 34, 30, 15, 5)), '#eb6760', 3), letra('S')),
    # Raro: gema lapidada
    'raro': (F('M18 8 H46 L60 24 L32 60 L4 24Z', '#d8c9f9', 3) + S('M4 24 H60 M18 8 L24 24 L32 60 L40 24 L46 8', '#8b6bb0', 1.5, extra=' opacity=".7"'), letra('R')),
}
for g, (forma, l) in GRAUS.items():
    disco = '' if g in ('s', 'raro') else Cc(32, 33, 15, K, 2, L)
    GLIFOS[f'grade/{g}'] = forma + disco + l

# ---------------------------------------------------------------- mesmos significados, mesmo desenho
ALIASES = {
    'category/ninjutsu': 'attr/nin',
    'style/ninjutsu': 'attr/nin',
    'preset/ninjutsu': 'attr/nin',
    'style/genjutsu': 'attr/gen',
    'preset/equilibrado': 'style/equilibrado',
    'ui/crit': 'attr/crit',
    'effect/clones': 'jutsu/bunshin',
    'effect/shadow-clones': 'jutsu/kage_bunshin',
    'effect/log': 'jutsu/kawarimi',
    'effect/wall': 'jutsu/doryuuheki',
    'effect/mirrors': 'jutsu/makyou_hyoushou',
}
# glifos reaproveitados da entrega (não reescritos aqui), para os aliases acharem
ENTREGA = {'attr/gen': OLHO}


def main():
    so_lista = '--lista' in sys.argv
    # --para <dir>: escreve numa pasta à parte (prévia), sem tocar em assets/
    base = Path(sys.argv[sys.argv.index('--para') + 1]) if '--para' in sys.argv else ICONES
    alvos = dict(GLIFOS)
    for a, src in ALIASES.items():
        alvos[a] = GLIFOS.get(src) or ENTREGA[src]
    acento = {}
    escritos = 0
    for chave, glifo in sorted(alvos.items()):
        tipo, ident = chave.split('/')
        texto = svg(glifo, acento.get(chave, G))
        destino = ICONES / tipo / f'{ident}.svg'
        if not destino.exists():
            raise SystemExit(f'{chave}: id não existe em assets/icones (crie o id antes)')
        (base / tipo).mkdir(parents=True, exist_ok=True)
        saidas = [(base / tipo / f'{ident}.svg', texto)]
        if tipo in COM_LOCKED:
            saidas.append((base / tipo / f'{ident}_locked.svg', svg_locked(glifo)))
        for f, t in saidas:
            tam = len(t.encode('utf-8'))
            if tam > 4096:
                raise SystemExit(f'{f}: {tam} bytes (limite 4096)')
            if not so_lista:
                f.write_text(t, encoding='utf-8')
            escritos += 1
            if so_lista:
                print(f'{f}  {tam} B')
    print(f'{escritos} SVG {"seriam escritos" if so_lista else "escritos"} ({len(alvos)} ids)')


if __name__ == '__main__':
    main()
