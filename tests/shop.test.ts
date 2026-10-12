import { describe, it, expect } from 'vitest';
import { buyItem, equipItem, generateStock, priceOf, useRareScroll, type ShopStock } from '../src/game/run/shop';
import { characterMaxHp, createCharacter } from '../src/game/progression/character';
import { EQUIPMENT_POOL } from '../src/data/items';
import { RuleError } from '../src/game/errors';
import { Rng } from '../src/game/Rng';

const rich = () => {
  const c = createCharacter({ name: 'T', clan: 'semcla', affinity: 'vento', allocation: { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }, titleId: null });
  c.ryo = 5000;
  return c;
};
const stock = (): ShopStock => ({ consumables: ['kit_medico', 'pilula_chakra', 'pergaminho_reforco'], equipment: ['kunai', 'colete_reforcado'], rareScrolls: 1 });

describe('loja', () => {
  it('estoque: consumíveis fixos, 2 equipamentos distintos do pool e 1 Pergaminho Raro', () => {
    const s = generateStock(new Rng(4));
    expect(s.consumables).toEqual(['kit_medico', 'pilula_chakra', 'pergaminho_reforco']);
    expect(s.equipment).toHaveLength(2);
    expect(new Set(s.equipment).size).toBe(2);
    for (const id of s.equipment) expect(EQUIPMENT_POOL).toContain(id);
    expect(s.rareScrolls).toBe(1);
  });

  it('consumível: desconta ryo e soma ao inventário (estoque ilimitado)', () => {
    let { character, stock: st } = buyItem(rich(), stock(), 'kit_medico');
    ({ character, stock: st } = buyItem(character, st, 'kit_medico'));
    expect(character.ryo).toBe(5000 - 160);
    expect(character.inventory['kit_medico']).toBe(2);
    expect(st.consumables).toContain('kit_medico');
  });

  it('sem ryo suficiente ou item fora do estoque gera RuleError', () => {
    const c = rich();
    c.ryo = 79;
    expect(() => buyItem(c, stock(), 'kit_medico')).toThrow(RuleError);
    expect(() => buyItem(rich(), stock(), 'katana')).toThrow(RuleError);
  });

  it('equipamento sai do estoque e não pode ser comprado duas vezes', () => {
    const r = buyItem(rich(), stock(), 'kunai');
    expect(r.character.ownedEquipment).toEqual(['kunai']);
    expect(r.stock.equipment).toEqual(['colete_reforcado']);
    expect(() => buyItem(r.character, stock(), 'kunai')).toThrow(RuleError);
  });

  it('equipar aplica o bônus e sobe o HP atual junto com o máximo', () => {
    const { character } = buyItem(rich(), stock(), 'colete_reforcado');
    const before = character.hp;
    const eq = equipItem(character, 'colete_reforcado');
    expect(eq.equipment.armor).toBe('colete_reforcado');
    expect(characterMaxHp(eq)).toBe(characterMaxHp(character) + 12);
    expect(eq.hp).toBe(before + 12);
    expect(() => equipItem(rich(), 'katana')).toThrow(RuleError);
    expect(() => equipItem(character, 'kit_medico')).toThrow(RuleError);
  });

  it('Pergaminho Raro: um por estoque, +1 no atributo base, limite de 5 por run', () => {
    const r = buyItem(rich(), stock(), 'pergaminho_raro');
    expect(r.stock.rareScrolls).toBe(0);
    expect(() => buyItem(r.character, r.stock, 'pergaminho_raro')).toThrow(RuleError);
    let c = r.character;
    c.inventory['pergaminho_raro'] = 6;
    const nin = c.baseAttrs.nin;
    for (let i = 0; i < 5; i++) c = useRareScroll(c, 'nin');
    expect(c.baseAttrs.nin).toBe(nin + 5);
    expect(c.rareScrollsUsed).toBe(5);
    expect(() => useRareScroll(c, 'nin')).toThrow(RuleError);
  });

  it('título Colecionador dá 5% de desconto', () => {
    const c = rich();
    c.titleId = 'colecionador';
    expect(priceOf('kit_medico', c)).toBe(76);
  });
});
