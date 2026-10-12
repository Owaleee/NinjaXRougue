import { describe, it, expect } from 'vitest';
import * as F from '../src/game/formulas';
import { addAttributes, emptyAttributes, sumAttributes } from '../src/game/attributes';

describe('fórmulas de base (DD v2 §3 e Apêndice A)', () => {
  it('HP máximo bate com a tabela A.1', () => {
    expect(F.maxHp(7, 1)).toBe(114);
    expect(F.maxHp(11, 5)).toBe(154);
    expect(F.maxHp(7, 1, 1.1)).toBe(125); // Uzumaki
  });

  it('chakra máximo e regeneração', () => {
    expect(F.maxChakra(6, 1)).toBe(40);
    expect(F.maxChakra(7, 5)).toBe(57);
    expect(F.chakraRegen(7)).toBe(2);
    expect(F.chakraRegen(8)).toBe(3);
    expect(F.chakraRegen(16)).toBe(4);
  });

  it('redução de dano pela Defesa (com tetos)', () => {
    expect(F.defenseReduction(10)).toBeCloseTo(0.1667, 3);
    expect(F.defenseReduction(30)).toBeCloseTo(0.375, 5);
    expect(F.defenseReduction(50)).toBeCloseTo(0.5, 5);
    expect(F.defenseReduction(500)).toBe(0.6);
    expect(F.totalReduction(500, 0.5)).toBe(0.75);
    expect(F.totalReduction(10, 0.25)).toBeCloseTo(0.4167, 3);
  });

  it('chance de crítico (curva assintótica, teto 55%)', () => {
    expect(F.critChance(5)).toBeCloseTo(0.0385, 3);
    expect(F.critChance(60)).toBeCloseTo(0.25, 5);
    expect(F.critChance(60, 0.5)).toBe(0.55);
  });

  it('chance de esquiva (teto 40%, piso 0%)', () => {
    expect(F.dodgeChance(10, 10)).toBeCloseTo(0.04, 5);
    expect(F.dodgeChance(100, 10)).toBeCloseTo(0.4, 5);
    expect(F.dodgeChance(0, 30)).toBe(0);
    expect(F.dodgeChance(10, 10, 0.5)).toBeCloseTo(0.4, 5);
  });

  it('roda elemental Fogo → Vento → Raio → Terra → Água → Fogo', () => {
    expect(F.elementMultiplier('fogo', 'vento')).toBe(1.3);
    expect(F.elementMultiplier('agua', 'fogo')).toBe(1.3);
    expect(F.elementMultiplier('terra', 'agua')).toBe(1.3);
    expect(F.elementMultiplier('fogo', 'agua')).toBe(0.8);
    expect(F.elementMultiplier('fogo', 'terra')).toBe(1);
    expect(F.elementMultiplier(null, 'agua')).toBe(1);
    expect(F.elementMultiplier('fogo', null)).toBe(1);
  });

  it('XP e pontos esperados P(N)', () => {
    expect(F.xpToNext(1)).toBe(36);
    expect(F.xpToNext(10)).toBe(144);
    expect([1, 2, 3, 4].reduce((s, n) => s + F.xpToNext(n), 0)).toBe(216);
    expect(F.xpForCommon(1)).toBe(12);
    expect(F.xpForCommon(9)).toBe(44);
    expect(F.expectedPoints(1)).toBe(50);
    expect(F.expectedPoints(10)).toBe(113);
  });

  it('chance de controle (ilusão, maestria, chefe, teto 85%)', () => {
    expect(F.controlChance(0.4, 20, true, 0, false)).toBeCloseTo(0.48, 5);
    expect(F.controlChance(0.4, 20, true, 0, true)).toBeCloseTo(0.24, 5);
    expect(F.controlChance(0.55, 0, false, 5, false)).toBeCloseTo(0.77, 5);
    expect(F.controlChance(0.9, 100, true, 5, false)).toBe(0.85);
  });

  it('chance de efeito comum cresce com a maestria', () => {
    expect(F.effectChance(0.2, 5)).toBeCloseTo(0.28, 5);
    expect(F.effectChance(1, 3)).toBe(1);
  });
});

describe('utilitários de atributos', () => {
  it('cria, soma e totaliza', () => {
    const a = emptyAttributes(5);
    expect(sumAttributes(a)).toBe(40);
    const b = addAttributes(a, { nin: 3, def: 2 });
    expect(b.nin).toBe(8);
    expect(b.def).toBe(7);
    expect(a.nin).toBe(5); // não muta
  });
});
