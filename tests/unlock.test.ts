import { describe, it, expect } from 'vitest';
import { createCharacter } from '../src/game/progression/character';
import { checkUnlocks, meetsRequirements, missingRequirements } from '../src/game/progression/unlock';
import { equipJutsu, setLoadout, unequipJutsu } from '../src/game/progression/loadout';
import { RuleError } from '../src/game/errors';
import { JUTSUS } from '../src/data/jutsus';
import type { Attributes, ClanId } from '../src/game/types';

const mk = (clan: ClanId, allocation: Partial<Attributes>) =>
  createCharacter({ name: 'T', clan, affinity: 'vento', allocation, titleId: null });

describe('regra fixa de desbloqueio (spec §5)', () => {
  it('aprende automaticamente o que já cumpre e equipa nos slots livres', () => {
    const r = checkUnlocks(mk('semcla', { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }), 'onda', 0);
    expect(r.learned).toEqual(['henge', 'bunshin', 'bola_de_fogo']);
    expect(r.character.equipped).toEqual(['henge', 'bunshin', 'bola_de_fogo']);
    expect(r.character.learnedAt['bola_de_fogo']).toEqual({ level: 1, nodeIndex: 0 });
  });

  it('atributo efetivo (equipamento) NÃO desbloqueia', () => {
    const c = mk('semcla', { tai: 6, hp: 4 }); // Tai base 11
    c.equipment.weapon = 'katana'; // efetivo 15
    const r = checkUnlocks(c, 'onda', 0);
    expect(r.learned).toContain('sennen_goroshi');
    expect(r.learned).not.toContain('investida_ninja');
  });

  it('jutsu exclusivo só para o próprio clã', () => {
    expect(checkUnlocks(mk('uzumaki', { nin: 7, hp: 3 }), 'onda', 0).learned).not.toContain('goukakyuu');
    expect(checkUnlocks(mk('uchiha', { nin: 7, hp: 3 }), 'onda', 0).learned).toContain('goukakyuu');
  });

  it('saga mínima trava Suiryuudan até vencer Zabuza', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 22;
    expect(checkUnlocks(c, 'onda', 0).learned).not.toContain('suiryuudan');
    expect(checkUnlocks(c, 'onda_pos_zabuza', 13).learned).toContain('suiryuudan');
  });

  it('pré-requisito: Rasengan exige Kage Bunshin (cadeia resolvida na mesma checagem)', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 40;
    c.baseAttrs.int = 20;
    expect(meetsRequirements(c, JUTSUS['rasengan']!, 'busca_tsunade')).toBe(false);
    const r = checkUnlocks(c, 'busca_tsunade', 0);
    expect(r.learned).toContain('kage_bunshin');
    expect(r.learned).toContain('rasengan');
  });

  it('com os 4 slots cheios, o novo jutsu vai só para o repertório', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 22;
    c.baseAttrs.vel = 8;
    const r = checkUnlocks(c, 'onda', 0);
    expect(r.learned.length).toBeGreaterThan(4);
    expect(r.character.equipped).toHaveLength(4);
    expect(r.character.equipped).toEqual(r.learned.slice(0, 4));
    const again = checkUnlocks(r.character, 'onda', 1);
    expect(again.learned).toEqual([]);
    expect(again.character.equipped).toEqual(r.character.equipped);
  });

  it('missingRequirements diz quantos pontos faltam', () => {
    const c = mk('semcla', { nin: 4, hp: 6 }); // Nin 9
    expect(missingRequirements(c, JUTSUS['kage_bunshin']!)).toEqual([{ attr: 'nin', missing: 11 }]);
  });

  it('golpes de inimigo nunca são aprendidos', () => {
    const c = mk('semcla', { tai: 10 });
    expect(meetsRequirements(c, JUTSUS['golpe_pesado']!, 'onda')).toBe(false);
  });
});

describe('slots de jutsu', () => {
  it('equipa, troca quando cheio e valida', () => {
    const c = mk('semcla', { nin: 10 });
    c.baseAttrs.nin = 22;
    c.baseAttrs.vel = 8;
    const r = checkUnlocks(c, 'onda', 0).character;
    const reserve = r.learned.find((id) => !r.equipped.includes(id))!;
    expect(() => equipJutsu(r, reserve)).toThrow(RuleError);
    const swapped = equipJutsu(r, reserve, r.equipped[0]);
    expect(swapped.equipped[0]).toBe(reserve);
    expect(() => equipJutsu(r, 'rasengan')).toThrow(RuleError); // não aprendido
    expect(unequipJutsu(r, r.equipped[0]!).equipped).toHaveLength(3);
    expect(() => setLoadout(r, [...r.learned.slice(0, 5)])).toThrow(RuleError);
    expect(setLoadout(r, [reserve]).equipped).toEqual([reserve]);
  });
});
