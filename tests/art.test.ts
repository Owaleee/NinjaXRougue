import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ATTR_ICON, CHARACTER_ARTS, ELEMENT_ICON, ENEMY_ART, ITEM_ICON, characterUrl, clanArt, enemyArt, iconUrl, jutsuIconRef, SCREEN_BGS, screenBg, screenBgUrl } from '../src/data/art';
import { JUTSU_LIST } from '../src/data/jutsus';
import { PLAYABLE_CLANS } from '../src/data/clans';
import { ENEMY_LIST } from '../src/data/enemies';
import { ITEM_LIST } from '../src/data/items';

const publicFile = (url: string) => join(__dirname, '..', 'public', url);

describe('arte', () => {
  it('todo personagem e ícone mapeado existe em public/', () => {
    for (const art of CHARACTER_ARTS) expect(existsSync(publicFile(characterUrl(art))), art).toBe(true);
    const icons = [...Object.values(ATTR_ICON), ...Object.values(ELEMENT_ICON), ...Object.values(ITEM_ICON), ...JUTSU_LIST.map((j) => jutsuIconRef(j.id))];
    for (const icon of icons) expect(existsSync(publicFile(iconUrl(icon))), JSON.stringify(icon)).toBe(true);
  });

  it('cada clã jogável tem o seu desenho', () => {
    expect(new Set(PLAYABLE_CLANS.map(clanArt)).size).toBe(PLAYABLE_CLANS.length);
  });

  it('todo inimigo tem desenho próprio (não cai no padrão)', () => {
    for (const e of ENEMY_LIST) expect(ENEMY_ART[e.id], e.id).toBeDefined();
    expect(enemyArt('zabuza')).toBe('chefe_zabuza');
    expect(enemyArt('haku')).toBe('chefe_haku');
  });

  it('todo item tem ícone', () => {
    for (const i of ITEM_LIST) expect(ITEM_ICON[i.id], i.id).toBeDefined();
  });

  it('todo fundo de tela existe e toda tela (menos a batalha) tem um fundo', () => {
    for (const bg of SCREEN_BGS) expect(existsSync(publicFile(screenBgUrl(bg))), bg).toBe(true);
    for (const s of ['menu', 'create', 'map', 'prep', 'result', 'sheet', 'encyclopedia', 'history', 'titles', 'runEnd', 'error']) expect(screenBg(s), s).not.toBeNull();
    expect(screenBg('battle')).toBeNull();
    expect(screenBg('runEnd', 'victory')).toBe('fim_vitoria');
    expect(screenBg('runEnd', 'dead')).toBe('fim_morte');
  });

  it('as fontes e o favicon existem, e nenhum SVG publicado tem script ou imagem embutida', () => {
    for (const f of ['assets/fontes/titulo.woff2', 'assets/fontes/texto.woff2', 'favicon.svg', 'apple-touch-icon.png']) expect(existsSync(publicFile(f)), f).toBe(true);
    const manifest = JSON.parse(readFileSync(publicFile('assets/manifest.json'), 'utf-8')) as Record<string, Record<string, string[]>>;
    for (const [dir, groups] of Object.entries(manifest))
      for (const [grp, ids] of Object.entries(groups))
        for (const id of ids) {
          const f = join(dir, grp === '.' ? '' : grp, `${id}.svg`);
          const path = publicFile(`assets/${f}`);
          if (!existsSync(path)) continue; // webp/woff2 entram no manifesto também
          expect(readFileSync(path, 'utf-8'), f).not.toMatch(/<script|<image|href="https?:/i);
        }
  });
});
