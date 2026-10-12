import { describe, it, expect } from 'vitest';
import { emptyAttributes, sumAttributes } from '../../src/game/attributes';
import { PRESET_IDS, PRESET_WEIGHTS, presetAllocation } from '../../src/game/progression/presets';

describe('presets de distribuição (spec C9 e §6)', () => {
  it('pesos de cada preset somam 100%', () => {
    for (const id of PRESET_IDS) {
      const total = Object.values(PRESET_WEIGHTS[id]).reduce((s, v) => s + (v ?? 0), 0);
      expect(total, id).toBeCloseTo(1, 5);
    }
  });

  it('distribui exatamente os pontos pedidos, só em atributos do preset', () => {
    const add = presetAllocation(emptyAttributes(5), 10, 'ninjutsu');
    expect(sumAttributes(add)).toBe(10);
    expect(add.nin).toBe(4);
    expect(add.tai).toBe(0);
    expect(add.gen).toBe(0);
  });

  it('Taijutsu troca Nin por Tai', () => {
    const add = presetAllocation(emptyAttributes(5), 10, 'taijutsu');
    expect(add.tai).toBe(4);
    expect(add.nin).toBe(0);
  });

  it('respeita o que já foi investido (corrige a build na direção do preset)', () => {
    const current = { ...emptyAttributes(5), nin: 15 };
    const add = presetAllocation(current, 5, 'ninjutsu');
    expect(add.nin).toBe(0);
    expect(sumAttributes(add)).toBe(5);
  });

  it('0 pontos devolve tudo zerado', () => {
    expect(sumAttributes(presetAllocation(emptyAttributes(5), 0, 'equilibrado'))).toBe(0);
  });
});
