import { describe, it, expect } from 'vitest';
import { allocationByWeights, botAction, simulateRun } from '../src/game/sim/bot';
import { SIM_BUILDS } from '../src/game/sim/builds';
import { checkTargets, formatTable, simulateMany } from '../src/game/sim/report';
import type { BattleState } from '../src/game/combat/types';
import { makeCombatant } from './helpers';
import { emptyAttributes, sumAttributes } from '../src/game/attributes';

describe('simulador', () => {
  it('distribui pontos seguindo os pesos', () => {
    const a = allocationByWeights(emptyAttributes(5), 10, { nin: 0.4, hp: 0.2, def: 0.15, vel: 0.15, crit: 0.05, int: 0.05 });
    expect(sumAttributes(a)).toBe(10);
    expect(a.nin).toBe(4);
    expect(a.hp).toBe(2);
    expect(a.tai).toBe(0);
  });

  it('uma run simulada termina e é determinística', () => {
    const a = simulateRun(SIM_BUILDS[0]!, 1);
    const b = simulateRun(SIM_BUILDS[0]!, 1);
    expect(a).toEqual(b);
    expect(a.encountersWon).toBeGreaterThan(0);
    expect(a.commonRounds.length).toBeGreaterThan(0);
  });

  it('agrega, formata e confere metas', () => {
    const rows = [simulateMany(SIM_BUILDS[1]!, 5, 100)];
    expect(rows[0]!.runs).toBe(5);
    expect(formatTable(rows)).toContain(SIM_BUILDS[1]!.label);
    const focusedBad = { ...rows[0]!, build: { ...rows[0]!.build, focused: true }, hpEndCommon: 0.1 };
    expect(checkTargets([focusedBad]).some((f) => f.includes('hpEndCommon'))).toBe(true);
    const unfocused = { ...focusedBad, build: { ...focusedBad.build, focused: false } };
    expect(checkTargets([unfocused])).toEqual([]);
  });

  it('nunca defende dois turnos seguidos', () => {
    const me = makeCombatant({ id: 'player', side: 'player', hp: 10, inventory: {} });
    const foe = makeCombatant({ id: 'e', side: 'enemy', ai: 'basic' });
    const s: BattleState = { combatants: [me, foe], round: 1, order: [], turnPos: 0, activeId: 'player', status: 'awaitingInput', winner: null, transformToggled: false, onlyKai: false };
    expect(botAction(s).type).toBe('defend');
    expect(botAction(s, true).type).not.toBe('defend');
  });
});
