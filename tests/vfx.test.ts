import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BATTLE_SCENES, ENEMY_ART, JUTSU_FX, SCENE_LAYERS, STATUS_FX, VFX_NAMES, battleSceneFor, sceneLayerUrl, vfxAtlasUrl, vfxSheetUrl } from '../src/data/art';
import { ENEMY_LIST } from '../src/data/enemies';
import { JUTSUS } from '../src/data/jutsus';
import { EFFECTS } from '../src/data/effects';
import { vfxForEvent } from '../src/scenes/vfx';

const pub = (u: string) => join(__dirname, '..', 'public', u);
const other = (id: string) => (id === 'p' ? 'e' : 'p');

describe('efeitos visuais (VFX)', () => {
  it('todo VFX listado existe e toda pasta de vfx está listada', () => {
    for (const n of VFX_NAMES) {
      expect(existsSync(pub(vfxSheetUrl(n))), n).toBe(true);
      expect(existsSync(pub(vfxAtlasUrl(n))), n).toBe(true);
    }
    const dirs = readdirSync(pub('assets/vfx'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
    expect([...VFX_NAMES].sort()).toEqual(dirs);
  });

  it('os mapas apontam só para jutsus e efeitos que existem', () => {
    for (const id of Object.keys(JUTSU_FX)) expect(JUTSUS[id], id).toBeDefined();
    for (const id of Object.keys(STATUS_FX)) expect(EFFECTS[id], id).toBeDefined();
  });

  it('golpe: Atacar usa o impacto simples, jutsu usa o seu efeito ou o do elemento, crítico soma a estrela', () => {
    const dmg = (jutsuId: string | null, crit = false) => ({ type: 'damage', sourceId: 'p', targetId: 'e', amount: 9, crit, elementMult: 1, jutsuId, hpAfter: 1 }) as const;
    expect(vfxForEvent(dmg(null), other)).toEqual([{ name: 'fx_hit', on: 'e' }]);
    expect(vfxForEvent(dmg('bola_de_fogo'), other)).toEqual([{ name: 'fx_bola_de_fogo', on: 'e' }]);
    expect(vfxForEvent(dmg('chidori'), other)).toEqual([{ name: 'fx_hit_raio', on: 'e' }]);
    expect(vfxForEvent(dmg('rasengan'), other)).toEqual([{ name: 'fx_hit_neutro', on: 'e' }]);
    expect(vfxForEvent(dmg(null, true), other)).toEqual([{ name: 'fx_hit', on: 'e' }, { name: 'fx_crit', on: 'e' }]);
  });

  it('jutsu de suporte mostra o efeito em quem usa; Kongou Fuusa e Genjutsu Sharingan, no oponente', () => {
    const used = (jutsuId: string) => ({ type: 'jutsuUsed', actorId: 'p', jutsuId, cost: 1 }) as const;
    expect(vfxForEvent(used('doryuuheki'), other)).toEqual([{ name: 'fx_doryuuheki', on: 'p' }]);
    expect(vfxForEvent(used('kongou_fuusa'), other)).toEqual([{ name: 'fx_kongou_fuusa', on: 'e' }]);
    expect(vfxForEvent(used('bola_de_fogo'), other)).toEqual([]); // o golpe aparece no evento damage
  });

  it('todo inimigo tem cenário, e todas as camadas existem', () => {
    for (const e of ENEMY_LIST) expect(ENEMY_ART[e.id] && battleSceneFor(e.id).scene, e.id).toBeTruthy();
    expect(battleSceneFor('zabuza')).toEqual({ scene: 'ponte', overlay: 'nevoa' });
    expect(battleSceneFor('haku').overlay).toBe('gelo');
    expect(battleSceneFor(null).scene).toBe('estrada_floresta');
    for (const s of BATTLE_SCENES) for (const l of SCENE_LAYERS) expect(existsSync(pub(sceneLayerUrl(s, l))), `${s}/${l}`).toBe(true);
  });
});
