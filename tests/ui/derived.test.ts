import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/game/Rng';
import { emptyAttributes } from '../../src/game/attributes';
import { startBattle } from '../../src/game/combat/battle';
import { costFor } from '../../src/game/combat/cost';
import { createEnemy } from '../../src/game/combat/enemyFactory';
import { applyEffect } from '../../src/game/effects/EffectSystem';
import { critChance, defenseReduction } from '../../src/game/formulas';
import { playerToCombatant } from '../../src/game/run/battleSetup';
import { JUTSUS } from '../../src/data/jutsus';
import {
  combatantView,
  creationPreview,
  fightingStyle,
  jutsuButtons,
  jutsuGoals,
  ninjaPower,
  previewCharacter,
} from '../../src/ui-dom/view/derived';

describe('Poder Ninja e estilo de luta (DD v2 §3 e §14)', () => {
  it('Poder Ninja segue a fórmula de referência', () => {
    // 2·5 + 3·5 + 5 + 5 + 2·5 + 5 + 2·5 + 2·5 = 70
    expect(ninjaPower(emptyAttributes(5))).toBe(70);
    // nin 15 vira o "maior ofensivo": 70 + 3·10 = 100
    expect(ninjaPower({ ...emptyAttributes(5), nin: 15 })).toBe(100);
  });

  it('estilo pelo atributo mais investido (≥ 30% do investido)', () => {
    expect(fightingStyle({ ...emptyAttributes(5), nin: 9, hp: 7, def: 6, vel: 6, int: 6, crit: 6 })).toBe('ninjutsu');
    expect(fightingStyle(emptyAttributes(5))).toBe('equilibrado');
    expect(fightingStyle(emptyAttributes(7))).toBe('equilibrado');
    expect(fightingStyle({ ...emptyAttributes(5), int: 12 })).toBe('estrategista');
  });
});

describe('prévia da criação (spec §10: fórmulas derivadas e jutsus liberados)', () => {
  it('calcula HP, chakra e derivados para qualquer distribuição parcial', () => {
    const p = creationPreview('semcla', 'vento', { hp: 2, nin: 8 });
    expect(p.hp).toBe(114);
    expect(p.chakra).toBe(39);
    expect(p.regen).toBe(2);
    expect(p.critPct).toBeCloseTo(critChance(5), 6);
    expect(p.reductionPct).toBeCloseTo(defenseReduction(5), 6);
  });

  it('lista os jutsus que a build libera, sem jutsus de outro clã', () => {
    const semcla = creationPreview('semcla', 'vento', { nin: 10 }).unlocks;
    expect(semcla).toContain('henge');
    expect(semcla).toContain('daitoppa');
    expect(semcla).not.toContain('goukakyuu');
    const uchiha = creationPreview('uchiha', 'fogo', { nin: 7, gen: 3 }).unlocks;
    expect(uchiha).toContain('goukakyuu');
  });

  it('Uzumaki aplica o multiplicador de HP do clã', () => {
    expect(creationPreview('uzumaki', 'vento', { hp: 2 }).hp).toBe(125);
  });
});

describe('metas de jutsu ("faltam X para...")', () => {
  it('ordena pelos que estão mais perto e ignora outro clã e jutsus já aprendidos', () => {
    const c = previewCharacter('semcla', 'vento', { nin: 4 }); // nin 9
    const goals = jutsuGoals(c, 'onda');
    expect(goals.length).toBeLessThanOrEqual(3);
    expect(goals[0]?.jutsuId).toBe('sennen_goroshi'); // falta 1 de Tai
    expect(goals.map((g) => g.jutsuId)).not.toContain('goukakyuu');
    expect(goals.map((g) => g.jutsuId)).not.toContain('henge');
  });
});

describe('modelos do HUD de batalha', () => {
  function battle() {
    const c = previewCharacter('semcla', 'vento', { hp: 2, nin: 8 });
    c.learned = ['henge', 'bunshin', 'bola_de_fogo', 'daitoppa'];
    c.equipped = [...c.learned];
    return startBattle(playerToCombatant(c), createEnemy('ninja_renegado', 1), new Rng(1)).state;
  }

  it('combatantView traz vitais, porcentagens e efeitos com turnos', () => {
    const s = battle();
    const p = s.combatants.find((x) => x.side === 'player')!;
    const e = s.combatants.find((x) => x.side === 'enemy')!;
    applyEffect(p, 'queimadura', { sourceId: e.id });
    const v = combatantView(p, e);
    expect(v.maxHp).toBe(114);
    expect(v.reductionPct).toBeCloseTo(defenseReduction(5), 6);
    expect(v.effects[0]?.name).toBe('Queimadura');
    expect(v.effects[0]?.remaining).toBe(3);
    expect(v.transformed).toBe(false);
  });

  it('jutsuButtons mostra custo real, apaga sem chakra e bloqueia tudo sob Ilusão (menos Kai)', () => {
    const s = battle();
    const p = s.combatants.find((x) => x.side === 'player')!;
    const btns = jutsuButtons(s);
    expect(btns.map((b) => b.id)).toEqual(['henge', 'bunshin', 'bola_de_fogo', 'daitoppa']);
    expect(btns[3]?.cost).toBe(costFor(p, JUTSUS['daitoppa']!));
    p.chakra = 0;
    expect(jutsuButtons(s).every((b) => !b.affordable)).toBe(true);
    s.onlyKai = true;
    expect(jutsuButtons(s).every((b) => !b.allowed)).toBe(true);
  });
});
