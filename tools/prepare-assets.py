"""
Gera as versões leves da arte que o jogo carrega.
  python3 tools/prepare-assets.py

Lê os originais em assets/ (alta resolução, fora do bundle) e escreve em
public/assets/: recorta a borda transparente e reduz o tamanho
(personagens: 480 px de altura máx.; ícones: 96 px). Requer Pillow.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
JOBS = [
    (ROOT / 'assets' / 'personagens', ROOT / 'public' / 'assets' / 'personagens', 480),
    (ROOT / 'assets' / 'icones_originais', ROOT / 'public' / 'assets' / 'icones', 96),
]

for src, dst, size in JOBS:
    dst.mkdir(parents=True, exist_ok=True)
    for f in sorted(src.glob('*.png')):
        im = Image.open(f).convert('RGBA')
        bbox = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        if bbox:
            im = im.crop(bbox)
        im.thumbnail((size, size), Image.LANCZOS)
        out = dst / f.name
        im.save(out, optimize=True)
        print(f'{out.relative_to(ROOT)}  {im.width}x{im.height}  {out.stat().st_size // 1024} KB')


# ---------------------------------------------------------------------------
# Entrega de arte vetorial (SVG), fundos (WebP), fontes e identidade.
# Fontes editáveis em assets/{icones,ui,cenarios,fontes,identidade}; saída em
# public/assets/ (apagada e regerada a cada execução, então um id removido some).
# assets/_quarentena (retratos com risco de PI) e assets/_referencia nunca entram.
# ---------------------------------------------------------------------------
import json
import re
import shutil

ASSETS = ROOT / 'assets'
OUT = ROOT / 'public' / 'assets'
SVG_DIRS = ['icones', 'ui', 'identidade']
BIN_DIRS = {'cenarios': {'.webp'}, 'fontes': {'.woff2'}}
LIMITE_KB = {'icones': 4, 'ui': 10, 'identidade': 30}
PROIBIDO = re.compile(r'<script|\son\w+\s*=|href\s*=\s*["\']https?:|<image|<foreignObject', re.I)
ID_RE = re.compile(r'\bid="([^"]+)"')


def sanear_svg(texto: str, prefixo: str, rel: Path) -> str:
    """Prefixa os ids internos (gradientes, filtros) para o SVG poder ir inline sem colisão."""
    if PROIBIDO.search(texto):
        raise SystemExit(f'{rel}: SVG com script, evento, imagem embutida ou link externo')
    if 'viewBox' not in texto:
        raise SystemExit(f'{rel}: SVG sem viewBox')
    for i in set(ID_RE.findall(texto)):
        novo = f'{prefixo}-{i}'
        texto = texto.replace(f'id="{i}"', f'id="{novo}"').replace(f'url(#{i})', f'url(#{novo})').replace(f'href="#{i}"', f'href="#{novo}"')
    return texto


manifesto: dict = {}
for sub in SVG_DIRS + list(BIN_DIRS):
    alvo = OUT / sub
    for old in list(alvo.rglob('*.svg')) + list(alvo.rglob('*.webp')) + list(alvo.rglob('*.woff2')):
        # icones/ guarda também os PNG antigos na raiz: só limpa as subpastas geradas
        if sub != 'icones' or old.parent != alvo:
            old.unlink()

for sub in SVG_DIRS:
    for f in sorted((ASSETS / sub).rglob('*.svg')):
        rel = f.relative_to(ASSETS)
        texto = f.read_text(encoding='utf-8')
        kb = len(texto.encode('utf-8')) / 1024
        if kb > LIMITE_KB[sub]:
            print(f'AVISO {rel}: {kb:.1f} KB (limite {LIMITE_KB[sub]} KB)')
        if '<text' in texto:
            print(f'AVISO {rel}: usa <text> (depende da fonte do sistema)')
        saida = OUT / rel
        saida.parent.mkdir(parents=True, exist_ok=True)
        saida.write_text(sanear_svg(texto, '-'.join(rel.with_suffix('').parts[1:]), rel), encoding='utf-8')
        manifesto.setdefault(sub, {}).setdefault(rel.parent.name if sub != 'identidade' else '.', []).append(f.stem)

for sub, exts in BIN_DIRS.items():
    for f in sorted((ASSETS / sub).rglob('*')):
        if f.suffix in exts:
            rel = f.relative_to(ASSETS)
            (OUT / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(f, OUT / rel)
            manifesto.setdefault(sub, {}).setdefault(rel.parent.name, []).append(f.stem)

# favicon: precisa ficar na raiz de public/
for src, dst in [('favicon.svg', 'favicon.svg'), ('favicon_32.png', 'favicon-32.png'), ('favicon_180.png', 'apple-touch-icon.png')]:
    shutil.copyfile(ASSETS / 'identidade' / src, ROOT / 'public' / dst)

for g in manifesto.values():
    for k in g:
        g[k].sort()
(OUT / 'manifest.json').write_text(json.dumps(manifesto, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf-8')
print(f'manifest.json  {sum(len(v) for g in manifesto.values() for v in g.values())} arquivos')
