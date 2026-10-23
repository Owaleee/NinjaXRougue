import { describe, it, expect } from 'vitest';
import {
  allocatePoints,
  characterMaxChakra,
  characterMaxHp,
  createCharacter,
  effectiveAttrs,
  gainXp,
} from '../src/game/progression/character';
import {
  isOffAffinity,
  jutsuChakraCost,
  masteryLevelFromUses,
  masteryProgress,
  masteryStepUses,
} from '../src/game/progression/mastery';
import { sumAttributes } from '../src/game/attributes';
import { expectedPoints } from '../src/game/formulas';
import { RuleError } from '../src/game/errors';
import { JUTSUS } from '../src/data/jutsus';

const base = { name: 'Tester', affinity: 'vento' as const, titleId: null };
const ninAlloc = { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 };
const J = (id: string) => JUTSUS[id]!;

describe('criação de personagem', () => {
  it('rejeita título inexistente', () => {
    expect(() => createCharacter({ ...base, clan: 'uzumaki', allocation: ninAlloc, titleId: 'nao_existe' })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, clan: 'uzumaki', allocation: ninAlloc, titleId: 'demonio_da_nevoa' })).not.toThrow();
  });

  it('começa com 50 pontos, nível 1, HP e chakra cheios', () => {
    const c = createCharacter({ ...base, clan: 'uzumaki', allocation: ninAlloc });
    expect(sumAttributes(c.baseAttrs)).toBe(50);
    expect(c.level).toBe(1);
    expect(c.hp).toBe(characterMaxHp(c));
    expect(c.hp).toBe(Math.round((80 + 4 * 7 + 6) * 1.1));
    expect(c.chakra).toBe(characterMaxChakra(c));
  });

  it('Uchiha tem afinidade Fogo fixa', () => {
    const c = createCharacter({ ...base, affinity: 'agua', clan: 'uchiha', allocation: ninAlloc });
    expect(c.affinity).toBe('fogo');
  });

  it('rejeita distribuição inválida, nome vazio e clã não jogável', () => {
    expect(() => createCharacter({ ...base, clan: 'semcla', allocation: { nin: 9 } })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, clan: 'semcla', allocation: { nin: 11, hp: -1 } })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, clan: 'semcla', allocation: { nin: 9.5, hp: 0.5 } })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, name: '   ', clan: 'semcla', allocation: ninAlloc })).toThrow(RuleError);
    expect(() => createCharacter({ ...base, clan: 'hyuuga', allocation: ninAlloc })).toThrow(RuleError);
  });
});

describe('XP e níveis', () => {
  it('216 de XP leva do nível 1 ao 5 (Apêndice A.1)', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    const r = gainXp(c, 216);
    expect(r.character.level).toBe(5);
    expect(r.levelsGained).toBe(4);
    expect(r.character.xp).toBe(0);
  });

  it('clã: 5 pontos livres + 1 em cada destaque; total = P(N)', () => {
    const c = createCharacter({ ...base, clan: 'uzumaki', allocation: ninAlloc });
    const r = gainXp(c, 216).character;
    expect(r.unspentPoints).toBe(20);
    expect(r.baseAttrs.hp).toBe(c.baseAttrs.hp + 4);
    expect(r.baseAttrs.int).toBe(c.baseAttrs.int + 4);
    expect(sumAttributes(r.baseAttrs) + r.unspentPoints).toBe(expectedPoints(5));
  });

  it('Sem clã: 6 pontos livres por nível, sem destaques', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    const r = gainXp(c, 216).character;
    expect(r.unspentPoints).toBe(24);
    expect(sumAttributes(r.baseAttrs)).toBe(50);
  });

  it('subir de nível cura 25% do HP máximo (além do aumento do máximo)', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    c.hp = 10;
    const before = characterMaxHp(c);
    const r = gainXp(c, 36).character;
    const after = characterMaxHp(r);
    expect(r.hp).toBe(Math.min(after, 10 + (after - before) + Math.round(after * 0.25)));
  });

  it('não muta o personagem original', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    gainXp(c, 500);
    expect(c.level).toBe(1);
  });
});

describe('distribuição de pontos e atributo efetivo', () => {
  it('aplica pontos e sobe o HP atual junto com o máximo', () => {
    const c = gainXp(createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc }), 36).character;
    const hpBefore = c.hp;
    const r = allocatePoints(c, { hp: 5 });
    expect(r.baseAttrs.hp).toBe(c.baseAttrs.hp + 5);
    expect(r.unspentPoints).toBe(c.unspentPoints - 5);
    expect(r.hp).toBe(Math.min(characterMaxHp(r), hpBefore + 20));
  });

  it('rejeita mais pontos que o disponível', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    expect(() => allocatePoints(c, { nin: 1 })).toThrow(RuleError);
  });

  it('equipamento entra no efetivo, mas não no base', () => {
    const c = createCharacter({ ...base, clan: 'semcla', allocation: ninAlloc });
    c.equipment.armor = 'colete_ninja';
    expect(effectiveAttrs(c).def).toBe(c.baseAttrs.def + 3);
    expect(c.baseAttrs.def).toBe(7);
  });
});

describe('maestria e custo de chakra', () => {
  it('limiares acumulados 6/15/27/42/60', () => {
    expect(masteryStepUses('uchiha')).toEqual([6, 9, 12, 15, 18]);
    const g = J('goukakyuu');
    expect(masteryLevelFromUses(5, g, 'uchiha', 'fogo')).toBe(0);
    expect(masteryLevelFromUses(6, g, 'uchiha', 'fogo')).toBe(1);
    expect(masteryLevelFromUses(15, g, 'uchiha', 'fogo')).toBe(2);
    expect(masteryLevelFromUses(59, g, 'uchiha', 'fogo')).toBe(4);
    expect(masteryLevelFromUses(60, g, 'uchiha', 'fogo')).toBe(5);
    expect(masteryLevelFromUses(999, g, 'uchiha', 'fogo')).toBe(5);
  });

  it('Sem clã precisa de 25% menos usos (arredondado para cima)', () => {
    expect(masteryStepUses('semcla')).toEqual([5, 7, 9, 12, 14]);
    expect(masteryLevelFromUses(47, J('bunshin'), 'semcla', 'vento')).toBe(5);
  });

  it('fora da afinidade trava em +3 (exceto Sem clã e jutsus neutros)', () => {
    expect(isOffAffinity(J('bola_de_fogo'), 'uzumaki', 'agua')).toBe(true);
    expect(masteryLevelFromUses(60, J('bola_de_fogo'), 'uzumaki', 'agua')).toBe(3);
    expect(masteryLevelFromUses(60, J('bola_de_fogo'), 'semcla', 'agua')).toBe(5);
    expect(masteryLevelFromUses(60, J('bunshin'), 'uzumaki', 'agua')).toBe(5);
  });

  it('progresso dentro do nível para a barra da interface', () => {
    expect(masteryProgress(8, J('goukakyuu'), 'uchiha', 'fogo')).toEqual({ level: 1, usesIntoLevel: 2, usesForNext: 9 });
    expect(masteryProgress(60, J('goukakyuu'), 'uchiha', 'fogo')).toEqual({ level: 5, usesIntoLevel: 0, usesForNext: null });
  });

  it('custo de chakra combina maestria, afinidade, clã e título', () => {
    const ctx = (clan: 'uzumaki' | 'semcla' | 'uchiha' | null, affinity: 'agua' | 'fogo' | null, m = 0, costPct = 0) => ({ clan, affinity, masteryLevel: m, costPct });
    expect(jutsuChakraCost(J('kage_bunshin'), ctx('uzumaki', 'agua'))).toBe(19);
    expect(jutsuChakraCost(J('bola_de_fogo'), ctx('uzumaki', 'agua'))).toBe(10);
    expect(jutsuChakraCost(J('bola_de_fogo'), ctx('semcla', 'agua'))).toBe(7);
    expect(jutsuChakraCost(J('goukakyuu'), ctx('uchiha', 'fogo', 5))).toBe(11);
    expect(jutsuChakraCost(J('kubikiribouchou'), ctx(null, 'agua'))).toBe(0);
    expect(jutsuChakraCost(J('bunshin'), ctx('semcla', null, 0, -0.03))).toBe(7);
  });
});
