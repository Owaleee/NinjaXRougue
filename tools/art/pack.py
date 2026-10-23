"""Gera toda a arte procedural e empacota em public/assets/.

    python3 tools/art/pack.py                 # tudo
    python3 tools/art/pack.py sprites vfx     # só alguns grupos
    python3 tools/art/pack.py --preview DIR   # também GIFs e folhas de contato em DIR

Sem rede e determinístico (sementes fixas). Grupos: sprites, retratos, vfx, cenarios, loading.
Saídas:
  public/assets/sprites/<id>/{sheet.png, atlas.json}      + sprites/manifest.json
  public/assets/retratos_originais/portrait_<id>.png
  public/assets/vfx/<nome>/{sheet.png, atlas.json}         + vfx/manifest.json
  public/assets/cenarios/batalha/<cenario>_<camada>.webp   + cenarios/batalha/manifest.json
  public/assets/identidade/loading_screen.webp
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from PIL import Image  # noqa: E402

ROOT = HERE.parent.parent
PUB = ROOT / 'public' / 'assets'


def quantize(img: Image.Image, colors: int = 128) -> Image.Image:
    """Paleta de 8 bits com alfa (PNG leve). Mantém > 16 cores para o PNG sair com 8 bits."""
    return img.quantize(colors=max(17, colors), method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)


def save_png(img: Image.Image, path: Path, colors: int | None = 128) -> int:
    """colors=None grava RGBA de 8 bits por canal (degradês de brilho sem faixas)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if colors is None:
        import numpy as np
        a = np.array(img.convert('RGBA'))
        a[a[..., 3] < 5] = 0          # limpa a poeira de alfa (comprime melhor, invisível)
        a[..., :3] &= 0xFC            # 6 bits por canal de cor: sem faixa visível, PNG menor
        Image.fromarray(a).save(path, optimize=True)
    else:
        quantize(img, colors).save(path, optimize=True)
    return path.stat().st_size


def pack_sheet(anims: dict[str, list[Image.Image]], fps: dict, loop: dict, out_dir: Path, colors=128, extra_meta=None) -> dict:
    """Uma linha por animação. Atlas no formato "JSON Array" do Phaser + meta.animations."""
    F = next(iter(anims.values()))[0].width
    cols = max(len(v) for v in anims.values())
    rows = len(anims)
    sheet = Image.new('RGBA', (cols * F, rows * F), (0, 0, 0, 0))
    frames, meta_anims = [], {}
    for r, (name, imgs) in enumerate(anims.items()):
        names = []
        for c, im in enumerate(imgs):
            sheet.alpha_composite(im, (c * F, r * F))
            fn = f'{name}_{c:02d}'
            names.append(fn)
            frames.append({'filename': fn, 'frame': {'x': c * F, 'y': r * F, 'w': F, 'h': F}, 'rotated': False, 'trimmed': False,
                           'spriteSourceSize': {'x': 0, 'y': 0, 'w': F, 'h': F}, 'sourceSize': {'w': F, 'h': F}})
        meta_anims[name] = {'frames': names, 'fps': fps[name], 'loop': bool(loop[name])}
    size = save_png(sheet, out_dir / 'sheet.png', colors)
    meta = {'app': 'tools/art/pack.py (procedural, determinístico)', 'version': '1', 'image': 'sheet.png', 'format': 'RGBA8888',
            'size': {'w': sheet.width, 'h': sheet.height}, 'scale': '1', 'frameSize': {'w': F, 'h': F}, 'animations': meta_anims}
    if extra_meta:
        meta.update(extra_meta)
    (out_dir / 'atlas.json').write_text(json.dumps({'frames': frames, 'meta': meta}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return {'bytes': size, 'frame': F, 'anims': {k: len(v) for k, v in anims.items()}}


def save_gif(frames: list[Image.Image], fps: int, path: Path, bg=(34, 38, 48)):
    path.parent.mkdir(parents=True, exist_ok=True)
    out = []
    for f in frames:
        b = Image.new('RGBA', f.size, bg + (255,))
        b.alpha_composite(f)
        out.append(b.convert('RGB').quantize(colors=128, method=Image.Quantize.MEDIANCUT))
    out[0].save(path, save_all=True, append_images=out[1:], duration=int(1000 / fps), loop=0, disposal=1)


def contact(rows: list[list[Image.Image]], path: Path, bg=(34, 38, 48)):
    cell = max(f.width for r in rows for f in r)
    W = cell * max(len(r) for r in rows)
    im = Image.new('RGBA', (W, cell * len(rows)), bg + (255,))
    for j, r in enumerate(rows):
        for i, f in enumerate(r):
            im.alpha_composite(f, (i * cell + (cell - f.width) // 2, j * cell + (cell - f.height) // 2))
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(path)


# ------------------------------------------------------------------ grupos
def build_sprites(preview: Path | None):
    from anims import ANIM_ORDER, FPS, LOOP, animations
    from characters import CHARACTERS, frame_of, ground_of, render
    manifest = {}
    for cid, ch in CHARACTERS.items():
        A = animations(ch['archetype'])
        imgs = {a: [render(ch, p) for p in A[a]] for a in ANIM_ORDER}
        F = frame_of(ch)
        anchor = {'x': round(F * ch.get('base_frac', 80 / 192) / F, 4), 'y': round(ground_of(ch) / F, 4)}
        info = pack_sheet(imgs, FPS, LOOP, PUB / 'sprites' / cid, colors=96,
                          extra_meta={'anchor': anchor, 'facing': 'right', 'character': cid, 'origem': 'desenho original procedural'})
        info['anchor'] = anchor
        manifest[cid] = info
        print(f'  sprite {cid}: {F}px, {sum(info["anims"].values())} quadros, {info["bytes"] // 1024} KB')
        if preview:
            for a in ANIM_ORDER:
                save_gif(imgs[a], FPS[a], preview / 'sprites' / cid / f'{a}.gif')
            contact([imgs[a] for a in ANIM_ORDER], preview / 'sprites' / f'{cid}_contato.png')
    (PUB / 'sprites' / 'manifest.json').write_text(json.dumps({'personagens': manifest}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


PORTRAIT_IDS = ['player_uchiha', 'player_uzumaki', 'player_semclan', 'chefe_zabuza', 'chefe_haku',
                'inimigo_bandido', 'inimigo_renegado', 'inimigo_ninjaagua']


def build_portraits(preview: Path | None):
    from anims import idle
    from characters import CHARACTERS, render_view, solve
    out = []
    for cid in PORTRAIT_IDS:
        ch = CHARACTERS[cid]
        p = dict(idle(ch['archetype'])[0])
        p.update(hf=(0.25, 0.75), hb=(0.1, 0.8), wa=200 if ch['weapon'] == 'greatsword' else None, glow=0)
        if ch['weapon'] != 'greatsword':
            p['woff'] = 170
        J = solve(ch, p)
        r = ch['body']['head_r']
        side = r * 4.4
        hc = J['head']
        view = (hc[0] - side * 0.5, hc[1] - side * 0.4, side)
        im = render_view(ch, p, view, 256)
        path = PUB / 'retratos_originais' / f'portrait_{cid}.png'
        size = save_png(im, path, colors=128)
        print(f'  retrato {cid}: {size // 1024} KB')
        out.append(im)
    if preview:
        contact([out], preview / 'retratos_contato.png')


def build_vfx(preview: Path | None):
    import vfx
    manifest = {}
    for name, spec in vfx.EFFECTS.items():
        frames = vfx.render(name)
        info = pack_sheet({'play': frames}, {'play': spec['fps']}, {'play': spec['loop']}, PUB / 'vfx' / name, colors=spec.get('colors'),
                          extra_meta={'effect': name, 'blend': spec.get('blend', 'normal'), 'prioridade': spec['prio'], 'evento': spec['uso']})
        info['loop'] = spec['loop']
        info['fps'] = spec['fps']
        manifest[name] = info
        print(f'  vfx {name}: {len(frames)} quadros {frames[0].width}px, {info["bytes"] // 1024} KB')
        if preview:
            save_gif(frames, spec['fps'], preview / 'vfx' / f'{name}.gif')
    (PUB / 'vfx' / 'manifest.json').write_text(json.dumps({'efeitos': manifest}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    if preview:
        rows = [vfx.render(n) for n in vfx.EFFECTS]
        contact([r[:10] for r in rows], preview / 'vfx_contato.png')


def build_scenes(preview: Path | None):
    import scenes
    manifest = {}
    for name in scenes.SCENES:
        layers = scenes.render(name)
        files = {}
        for layer, im in layers.items():
            path = PUB / 'cenarios' / 'batalha' / f'{name}_{layer}.webp'
            path.parent.mkdir(parents=True, exist_ok=True)
            q = 82
            while True:
                im.save(path, 'WEBP', quality=q, method=6, exact=False)
                if path.stat().st_size <= 240 * 1024 or q <= 40:
                    break
                q -= 8
            files[layer] = path.stat().st_size
        manifest[name] = {'camadas': list(layers), 'bytes': files, 'chao_y': scenes.FLOOR_Y}
        print(f'  cenário {name}: ' + ', '.join(f'{k} {v // 1024} KB' for k, v in files.items()))
        if preview:
            comp = Image.new('RGBA', (1280, 720))
            for im in layers.values():
                comp.alpha_composite(im.convert('RGBA'))
            comp.convert('RGB').save(preview / f'cenario_{name}.png')
    for name, im in scenes.overlays().items():
        path = PUB / 'cenarios' / 'batalha' / f'{name}.webp'
        im.save(path, 'WEBP', quality=80, method=6)
        manifest[name] = {'overlay': True, 'bytes': path.stat().st_size, 'size': list(im.size)}
        print(f'  overlay {name}: {path.stat().st_size // 1024} KB')
    (PUB / 'cenarios' / 'batalha' / 'manifest.json').write_text(json.dumps({'cenarios': manifest}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def build_loading(preview: Path | None):
    import scenes
    im = scenes.loading_screen()
    path = PUB / 'identidade' / 'loading_screen.webp'
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'WEBP', quality=80, method=6)
    print(f'  loading_screen: {path.stat().st_size // 1024} KB')
    if preview:
        im.convert('RGB').save(preview / 'loading_screen.png')


GROUPS = {'sprites': build_sprites, 'retratos': build_portraits, 'vfx': build_vfx, 'cenarios': build_scenes, 'loading': build_loading}


def main(argv: list[str]) -> None:
    preview = None
    if '--preview' in argv:
        i = argv.index('--preview')
        preview = Path(argv[i + 1]).resolve()
        argv = argv[:i] + argv[i + 2:]
        preview.mkdir(parents=True, exist_ok=True)
    groups = argv or list(GROUPS)
    for g in groups:
        print(f'[{g}]')
        GROUPS[g](preview)


if __name__ == '__main__':
    main(sys.argv[1:])
