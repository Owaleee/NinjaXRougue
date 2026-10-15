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
