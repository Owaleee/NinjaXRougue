import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { CHARACTER_ARTS } from '../src/data/art';
import { parseSpriteMeta } from '../src/scenes/spriteAnims';

/**
 * Arte procedural gerada por `python3 tools/art/pack.py` (sprites, VFX, cenários de
 * batalha, retratos originais, tela de carregamento). Confere formato, limites e que
 * as animações são quadros de verdade (pixels diferentes entre quadros vizinhos).
 */
const PUB = join(__dirname, '..', 'public', 'assets');
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

interface Png {
  width: number;
  height: number;
  /** 1 byte (índice da paleta) ou 4 bytes (RGBA) por pixel. */
  bpp: number;
  pixels: Uint8Array;
}

/** Decodificador mínimo de PNG: 8 bits, tipo 3 (paleta) ou 6 (RGBA), sem entrelaçamento. */
function decodePng(file: string): Png {
  const buf = readFileSync(file);
  expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  let off = 8;
  let width = 0;
  let height = 0;
  let type = 0;
  const idat: Buffer[] = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const kind = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect(data[8], 'profundidade de 8 bits').toBe(8);
      type = data[9]!;
      expect([3, 6]).toContain(type);
      expect(data[12], 'sem entrelaçamento').toBe(0);
    } else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    off += 12 + len;
  }
  const bpp = type === 6 ? 4 : 1;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]!;
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp]! : 0;
      const b = y > 0 ? out[dst - stride + x]! : 0;
      const c = x >= bpp && y > 0 ? out[dst - stride + x - bpp]! : 0;
      const v = raw[src + x]!;
      let r: number;
      switch (f) {
        case 0: r = v; break;
        case 1: r = v + a; break;
        case 2: r = v + b; break;
        case 3: r = v + ((a + b) >> 1); break;
        default: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        }
      }
      out[dst + x] = r & 0xff;
    }
  }
  return { width, height, bpp, pixels: out };
}

interface Frame { filename: string; frame: { x: number; y: number; w: number; h: number }; sourceSize: { w: number; h: number }; spriteSourceSize: { x: number; y: number; w: number; h: number } }
interface Atlas { frames: Frame[]; meta: { image: string; size: { w: number; h: number }; animations: Record<string, { frames: string[]; fps: number; loop: boolean }> } }

/** Quantos pixels mudam entre dois quadros da mesma folha. */
function diffPixels(png: Png, a: Frame['frame'], b: Frame['frame']): number {
  let n = 0;
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      const ia = ((a.y + y) * png.width + a.x + x) * png.bpp;
      const ib = ((b.y + y) * png.width + b.x + x) * png.bpp;
      for (let k = 0; k < png.bpp; k++) {
        if (png.pixels[ia + k] !== png.pixels[ib + k]) {
          n++;
          break;
        }
      }
    }
  }
  return n;
}

function checkAtlas(dir: string, maxKb: number): { atlas: Atlas; png: Png } {
  const atlasPath = join(dir, 'atlas.json');
  const sheetPath = join(dir, 'sheet.png');
  expect(existsSync(atlasPath), atlasPath).toBe(true);
  expect(existsSync(sheetPath), sheetPath).toBe(true);
  expect(statSync(sheetPath).size / 1024, `${sheetPath} ≤ ${maxKb} KB`).toBeLessThanOrEqual(maxKb);
  const atlas = readJson(atlasPath) as Atlas;
  const png = decodePng(sheetPath);
  expect(Array.isArray(atlas.frames)).toBe(true);
  expect(atlas.meta.image).toBe('sheet.png');
  expect(atlas.meta.size).toEqual({ w: png.width, h: png.height });
  expect(png.width).toBeLessThanOrEqual(2048);
  expect(png.height).toBeLessThanOrEqual(2048);
  const names = new Set<string>();
  for (const f of atlas.frames) {
    expect(names.has(f.filename), `quadro repetido ${f.filename}`).toBe(false);
    names.add(f.filename);
    const r = f.frame;
    expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= png.width && r.y + r.h <= png.height, `${f.filename} dentro da imagem`).toBe(true);
    expect(f.sourceSize).toEqual({ w: r.w, h: r.h });
    expect(f.spriteSourceSize).toEqual({ x: 0, y: 0, w: r.w, h: r.h });
  }
  for (const [name, anim] of Object.entries(atlas.meta.animations)) {
    expect(anim.fps, name).toBeGreaterThan(0);
    for (const fn of anim.frames) expect(names.has(fn), `${name}: ${fn}`).toBe(true);
  }
  return { atlas, png };
}

function consecutiveFramesDiffer(atlas: Atlas, png: Png, anim: string, minPixels: number) {
  const byName = new Map(atlas.frames.map((f) => [f.filename, f.frame]));
  const frames = atlas.meta.animations[anim]!.frames;
  for (let i = 1; i < frames.length; i++) {
    const d = diffPixels(png, byName.get(frames[i - 1]!)!, byName.get(frames[i]!)!);
    expect(d, `${anim}: ${frames[i - 1]} → ${frames[i]} muda ${d} pixels`).toBeGreaterThanOrEqual(minPixels);
  }
}

const MIN_FRAMES: Record<string, number> = { idle: 4, attack: 5, cast: 5, hit: 3, death: 5 };

describe('sprites animados dos lutadores', () => {
  const manifest = readJson(join(PUB, 'sprites', 'manifest.json')) as { personagens: Record<string, unknown> };

  it('o manifesto lista os 8 personagens do jogo', () => {
    expect(Object.keys(manifest.personagens).sort()).toEqual([...CHARACTER_ARTS].sort());
  });

  for (const art of CHARACTER_ARTS) {
    it(`${art}: atlas válido, animações com o mínimo de quadros e quadros diferentes entre si`, () => {
      const { atlas, png } = checkAtlas(join(PUB, 'sprites', art), 300);
      const meta = parseSpriteMeta(atlas);
      expect(meta, 'meta.animations legível pelo jogo').not.toBeNull();
      for (const [anim, min] of Object.entries(MIN_FRAMES)) {
        expect(atlas.meta.animations[anim], anim).toBeDefined();
        expect(atlas.meta.animations[anim]!.frames.length, anim).toBeGreaterThanOrEqual(min);
        consecutiveFramesDiffer(atlas, png, anim, 40);
      }
      expect(atlas.meta.animations['idle']!.loop).toBe(true);
      expect(atlas.meta.animations['death']!.loop).toBe(false);
      const sizes = new Set(atlas.frames.map((f) => `${f.frame.w}x${f.frame.h}`));
      expect(sizes.size, 'todos os quadros do mesmo tamanho').toBe(1);
      expect(atlas.frames[0]!.frame.w).toBeGreaterThanOrEqual(192);
    });
  }
});

describe('efeitos visuais (VFX)', () => {
  const manifest = readJson(join(PUB, 'vfx', 'manifest.json')) as { efeitos: Record<string, { loop: boolean }> };
  const names = Object.keys(manifest.efeitos);

  it('cobre os genéricos e status P0 principais', () => {
    for (const n of ['fx_hit', 'fx_hit_fogo', 'fx_hit_vento', 'fx_hit_raio', 'fx_hit_terra', 'fx_hit_agua', 'fx_crit', 'fx_heal', 'fx_chakra',
      'fx_defend', 'fx_fumaca', 'fx_aura_sharingan', 'st_queimadura', 'st_atordoado', 'st_imobilizado']) expect(names, n).toContain(n);
  });

  for (const n of names) {
    it(`${n}: atlas válido, ≥ 6 quadros e quadros diferentes`, () => {
      const { atlas, png } = checkAtlas(join(PUB, 'vfx', n), 300);
      const anim = atlas.meta.animations['play']!;
      expect(anim.frames.length).toBeGreaterThanOrEqual(6);
      expect(anim.loop).toBe(manifest.efeitos[n]!.loop);
      expect([128, 192]).toContain(atlas.frames[0]!.frame.w);
      consecutiveFramesDiffer(atlas, png, 'play', 10);
    });
  }
});

describe('cenários de batalha, retratos e carregamento', () => {
  const sc = readJson(join(PUB, 'cenarios', 'batalha', 'manifest.json')) as { cenarios: Record<string, { camadas?: string[] }> };

  it('5 cenários com 3 camadas WebP de até 250 KB, e os 2 overlays', () => {
    for (const name of ['estrada_floresta', 'costa_nevoa', 'lago_nevoa', 'ponte', 'acampamento']) {
      expect(sc.cenarios[name]?.camadas).toEqual(['ceu', 'meio', 'chao']);
      for (const layer of ['ceu', 'meio', 'chao']) {
        const p = join(PUB, 'cenarios', 'batalha', `${name}_${layer}.webp`);
        expect(existsSync(p), p).toBe(true);
        const b = readFileSync(p);
        expect(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12)).toBe('RIFFWEBP');
        expect(statSync(p).size / 1024).toBeLessThanOrEqual(250);
      }
    }
    for (const o of ['overlay_nevoa', 'overlay_espelhos_gelo']) expect(existsSync(join(PUB, 'cenarios', 'batalha', `${o}.webp`)), o).toBe(true);
  });

  it('retratos originais 256 × 256 (≤ 60 KB) para os 3 clãs e os 2 chefes', () => {
    for (const id of ['player_uchiha', 'player_uzumaki', 'player_semclan', 'chefe_zabuza', 'chefe_haku']) {
      const p = join(PUB, 'retratos_originais', `portrait_${id}.png`);
      expect(existsSync(p), p).toBe(true);
      const png = decodePng(p);
      expect([png.width, png.height]).toEqual([256, 256]);
      expect(statSync(p).size / 1024).toBeLessThanOrEqual(60);
    }
  });

  it('tela de carregamento existe', () => {
    const p = join(PUB, 'identidade', 'loading_screen.webp');
    expect(existsSync(p)).toBe(true);
    expect(statSync(p).size / 1024).toBeLessThanOrEqual(250);
  });
});
