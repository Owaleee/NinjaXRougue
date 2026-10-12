import { describe, it, expect } from 'vitest';
import { DEFAULT_DATA, validateGameData, assertGameData } from '../src/data/validate';
import { SAGA_ONDA } from '../src/data/saga';
import { JUTSUS } from '../src/data/jutsus';
import { ARCHETYPES } from '../src/data/enemies';
import { sumAttributes } from '../src/game/attributes';
import { storyIndex } from '../src/data/story';

describe('dados do jogo', () => {
  it('passam na validação de esquema e de referências', () => {
    expect(validateGameData()).toEqual([]);
    expect(() => assertGameData()).not.toThrow();
  });

  it('acusa pré-requisito inexistente', () => {
    const jutsus = DEFAULT_DATA.jutsus.map((j) => (j.id === 'rasengan' ? { ...j, prereq: 'nao_existe' } : j));
    const issues = validateGameData({ ...DEFAULT_DATA, jutsus });
    expect(issues.some((i) => i.includes('nao_existe'))).toBe(true);
  });

  it('acusa efeito inexistente e id duplicado', () => {
    const bad = { ...JUTSUS['bola_de_fogo']!, effects: [{ effectId: 'xyz', target: 'enemy' as const, chance: 0.1 }] };
    const issues = validateGameData({ ...DEFAULT_DATA, jutsus: [...DEFAULT_DATA.jutsus, bad] });
    expect(issues.some((i) => i.includes('xyz'))).toBe(true);
    expect(issues.some((i) => i.includes('duplicado'))).toBe(true);
  });

  it('acusa custo negativo (esquema Zod)', () => {
    const jutsus = DEFAULT_DATA.jutsus.map((j) => (j.id === 'kai' ? { ...j, cost: -1 } : j));
    expect(validateGameData({ ...DEFAULT_DATA, jutsus }).length).toBeGreaterThan(0);
  });

  it('Saga da Onda tem 26 nós com os níveis do Apêndice A.3', () => {
    const n = SAGA_ONDA.nodes;
    expect(n).toHaveLength(26);
    expect(n.map((x) => x.storyLevel)).toEqual([
      1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10,
    ]);
    expect(n[12]).toMatchObject({ kind: 'boss', bossId: 'zabuza', campBefore: true, advancesStoryTo: 'onda_pos_zabuza' });
    expect(n[25]).toMatchObject({ kind: 'boss', bossId: 'haku', campBefore: true });
  });

  it('pesos de arquétipo somam 100%', () => {
    for (const w of Object.values(ARCHETYPES)) expect(sumAttributes(w)).toBeCloseTo(1, 6);
  });

  it('Gogyou Fuuin é geral e F2 (spec C7); Suiryuudan só após Zabuza', () => {
    expect(JUTSUS['gogyou_fuuin']).toMatchObject({ clan: null, phase: 'F2' });
    expect(storyIndex(JUTSUS['suiryuudan']!.minStory)).toBeGreaterThan(storyIndex('onda'));
  });
});
