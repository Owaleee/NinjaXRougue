import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ATTR_ICON, CHARACTER_ARTS, ELEMENT_ICON, ENEMY_ART, ITEM_ICON, characterUrl, clanArt, enemyArt, iconUrl } from '../src/data/art';
import { PLAYABLE_CLANS } from '../src/data/clans';
import { ENEMY_LIST } from '../src/data/enemies';
import { ITEM_LIST } from '../src/data/items';

const publicFile = (url: string) => join(__dirname, '..', 'public', url);

describe('arte', () => {
  it('todo personagem e ícone mapeado existe em public/', () => {
    for (const art of CHARACTER_ARTS) expect(existsSync(publicFile(characterUrl(art))), art).toBe(true);
    const icons = [...Object.values(ATTR_ICON), ...Object.values(ELEMENT_ICON), ...Object.values(ITEM_ICON)];
    for (const icon of icons) expect(existsSync(publicFile(iconUrl(icon))), icon).toBe(true);
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
});
