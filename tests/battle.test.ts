import { describe, it, expect } from 'vitest';
import { applyAction, getEnemy, getPlayer, startBattle } from '../src/game/combat/battle';
import { activeControl, applyEffect } from '../src/game/effects/EffectSystem';
import type { Action, BattleState, Combatant } from '../src/game/combat/types';
import { Rng } from '../src/game/Rng';
import { RuleError } from '../src/game/errors';
import { makeCombatant, SeqRng, type CombatantOverrides } from './helpers';

function players(over: CombatantOverrides = {}): { p: Combatant; e: Combatant } {
  const p = makeCombatant({ id: 'player', side: 'player', attrs: { vel: 30, tai: 10, gen: 8 }, jutsus: ['bola_de_fogo'], ...over });
  const e = makeCombatant({ id: 'enemy', side: 'enemy', ai: 'basic', attrs: { vel: 1 }, jutsus: ['golpe_pesado'] });
  return { p, e };
}

function codeOf(fn: () => unknown): string | null {
  try {
    fn();
  } catch (err) {
    return err instanceof RuleError ? err.code : 'not-a-rule-error';
  }
  return null;
}

describe('fluxo da batalha', () => {
  it('o mais rápido recebe o primeiro turno', () => {
    const { p, e } = players();
    const { state, events } = startBattle(p, e, new Rng(1));
    expect(events[0]).toEqual({ type: 'battleStart', playerId: 'player', enemyId: 'enemy' });
    expect(events.some((x) => x.type === 'roundStart')).toBe(true);
    expect(state.status).toBe('awaitingInput');
    expect(state.activeId).toBe('player');
  });

  it('depois da ação do jogador o inimigo age e a vez volta', () => {
    const { p, e } = players();
    const s0 = startBattle(p, e, new Rng(1)).state;
    const { state, events } = applyAction(s0, { type: 'attack' }, new Rng(2));
    expect(events.some((x) => x.type === 'turnStart' && x.actorId === 'enemy')).toBe(true);
    expect(state.status).toBe('awaitingInput');
    expect(state.round).toBe(2);
    expect(s0.round).toBe(1); // não muta o estado anterior
  });

  it('erros de regra: sem chakra, não equipado, batalha encerrada', () => {
    const { p, e } = players();
    const s = startBattle(p, e, new Rng(1)).state;
    getPlayer(s).chakra = 0;
    expect(codeOf(() => applyAction(s, { type: 'jutsu', jutsuId: 'bola_de_fogo' }, new Rng(1)))).toBe('noChakra');
    expect(codeOf(() => applyAction(s, { type: 'jutsu', jutsuId: 'goukakyuu' }, new Rng(1)))).toBe('notEquipped');
    const ended: BattleState = { ...s, status: 'ended' };
    expect(codeOf(() => applyAction(ended, { type: 'attack' }, new Rng(1)))).toBe('battleEnded');
  });

  it('vitória quando o inimigo chega a 0 de HP', () => {
    const { p, e } = players();
    e.hp = 1;
    const rng = new SeqRng([], 0.99);
    const s = startBattle(p, e, rng).state;
    const { state, events } = applyAction(s, { type: 'attack' }, rng);
    expect(state.status).toBe('ended');
    expect(state.winner).toBe('player');
    expect(events.at(-1)).toEqual({ type: 'battleEnd', winner: 'player', reason: 'ko' });
  });

  it('jogador morre por queimadura no início do próprio turno (Review Focus 3)', () => {
    const { p, e } = players({ hp: 1 });
    applyEffect(p, 'queimadura', { sourceId: 'enemy' });
    const { state, events } = startBattle(p, e, new SeqRng([], 0.99));
    expect(state.status).toBe('ended');
    expect(state.winner).toBe('enemy');
    expect(events.some((x) => x.type === 'dot' && x.targetId === 'player')).toBe(true);
  });
});

describe('ações', () => {
  it('transformação é ação livre (1×/turno) e cobra manutenção no turno seguinte', () => {
    const { p, e } = players({ transformationId: 'sharingan' });
    const rng = new Rng(7);
    const s0 = startBattle(p, e, rng).state;
    const r1 = applyAction(s0, { type: 'transform' }, rng);
    expect(r1.events).toContainEqual({ type: 'transformOn', actorId: 'player', transformationId: 'sharingan' });
    expect(r1.state.status).toBe('awaitingInput');
    expect(r1.state.activeId).toBe('player');
    expect(codeOf(() => applyAction(r1.state, { type: 'transform' }, rng))).toBe('alreadyToggled');
    const r2 = applyAction(r1.state, { type: 'attack' }, rng);
    expect(r2.events).toContainEqual({ type: 'transformUpkeep', actorId: 'player', amount: 2 });
  });

  it('inimigo controlado perde o turno', () => {
    const { p, e } = players();
    applyEffect(e, 'imobilizado', { sourceId: 'player', duration: 1 });
    const s = startBattle(p, e, new Rng(3)).state;
    const { events } = applyAction(s, { type: 'attack' }, new Rng(4));
    expect(events).toContainEqual({ type: 'controlledSkip', actorId: 'enemy', effectId: 'imobilizado' });
  });

  it('sob Ilusão o jogador só pode usar Kai', () => {
    const { p, e } = players({ jutsus: ['kai'] });
    applyEffect(p, 'ilusao', { sourceId: 'enemy' });
    const s = startBattle(p, e, new Rng(5)).state;
    expect(s.onlyKai).toBe(true);
    expect(codeOf(() => applyAction(s, { type: 'attack' }, new Rng(1)))).toBe('onlyKai');
    const { state } = applyAction(s, { type: 'jutsu', jutsuId: 'kai' }, new Rng(1));
    expect(activeControl(getPlayer(state))).toBeUndefined();
  });

  it('maestria sobe com o uso e emite masteryUp', () => {
    const { p, e } = players({ masteryUses: { bola_de_fogo: 5 } });
    const s = startBattle(p, e, new Rng(9)).state;
    const { state, events } = applyAction(s, { type: 'jutsu', jutsuId: 'bola_de_fogo' }, new Rng(9));
    expect(getPlayer(state).masteryUses['bola_de_fogo']).toBe(6);
    expect(events).toContainEqual({ type: 'masteryUp', actorId: 'player', jutsuId: 'bola_de_fogo', level: 1 });
  });

  it('Meditar recupera 25% do chakra máximo (Uzumaki 30%)', () => {
    for (const [clan, gain] of [[null, 13], ['uzumaki', 15]] as const) {
      const { p, e } = players({ clan });
      const s = startBattle(p, e, new Rng(1)).state;
      getPlayer(s).chakra = 0;
      const { events } = applyAction(s, { type: 'meditate' }, new Rng(1));
      expect(events).toContainEqual({ type: 'meditate', actorId: 'player', chakra: gain });
    }
  });

  it('Defender: ganha 10% de chakra e reduz o dano até o próximo turno', () => {
    const { p, e } = players();
    const s = startBattle(p, e, new Rng(1)).state;
    getPlayer(s).chakra = 0;
    const { events } = applyAction(s, { type: 'defend' }, new Rng(1));
    expect(events).toContainEqual({ type: 'defend', actorId: 'player', chakra: 5 });
  });

  it('Item: kit cura 40% e é consumido; sem item gera erro', () => {
    const { p, e } = players({ hp: 50, inventory: { kit_medico: 1 } });
    const s = startBattle(p, e, new Rng(1)).state;
    const r = applyAction(s, { type: 'item', itemId: 'kit_medico' }, new Rng(1));
    expect(r.events).toContainEqual({ type: 'heal', targetId: 'player', hp: 40, chakra: 0 });
    expect(getPlayer(r.state).inventory['kit_medico']).toBe(0);
    expect(codeOf(() => applyAction(r.state, { type: 'item', itemId: 'kit_medico' }, new Rng(1)))).toBe('noItem');
    expect(codeOf(() => applyAction(s, { type: 'item', itemId: 'katana' }, new Rng(1)))).toBe('notConsumable');
  });

  it('mesma semente + mesmas ações = mesmo resultado', () => {
    const play = () => {
      const { p, e } = players();
      const rng = new Rng(123);
      let s = startBattle(p, e, rng).state;
      const act: Action = { type: 'attack' };
      for (let i = 0; i < 30 && s.status === 'awaitingInput'; i++) s = applyAction(s, act, rng).state;
      return JSON.stringify(s);
    };
    expect(play()).toBe(play());
  });

  it('getEnemy devolve o lado inimigo', () => {
    const { p, e } = players();
    expect(getEnemy(startBattle(p, e, new Rng(1)).state).id).toBe('enemy');
  });
});
