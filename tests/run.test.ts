import { describe, it, expect } from 'vitest';
import {
  allocateRunPoints,
  battleAction,
  buyInRun,
  chooseReward,
  continueFromResult,
  newRun,
  restAtCamp,
  startEncounter,
  useRareScrollInRun,
} from '../src/game/run/runManager';
import type { RunState } from '../src/game/run/types';
import { characterMaxHp, type CreateParams } from '../src/game/progression/character';
import { xpForCommon } from '../src/game/formulas';
import { RuleError } from '../src/game/errors';

const params: CreateParams = { name: 'Teste', clan: 'semcla', affinity: 'vento', allocation: { nin: 4, hp: 2, def: 2, vel: 1, crit: 1 }, titleId: null };

function overpowered(run: RunState): RunState {
  const r = structuredClone(run);
  Object.assign(r.character.baseAttrs, { tai: 300, vel: 300, hp: 300, def: 200 });
  r.character.hp = characterMaxHp(r.character);
  return r;
}

function winCurrent(run: RunState, elite = false): RunState {
  let r = startEncounter(run, elite).run;
  while (r.phase === 'battle') r = battleAction(r, { type: 'attack' }).run;
  return r;
}

function takeAllChoices(run: RunState): RunState {
  let r = run;
  while (r.pendingChoices.length) {
    const opt = r.pendingChoices[0]![0]!;
    r = chooseReward(r, opt, opt === 'treino' ? r.character.equipped[0] : undefined);
  }
  return r;
}

describe('nova run', () => {
  it('26 nós, 3 bifurcações de elite (nunca antes de Acampamento), loja e jutsus iniciais', () => {
    const r = newRun(params, 42, 1000);
    expect(r.nodes).toHaveLength(26);
    const elites = r.nodes.filter((n) => n.eliteEnemyId);
    expect(elites).toHaveLength(3);
    for (const n of elites) {
      expect(n.kind).toBe('common');
      expect([11, 24]).not.toContain(n.index);
    }
    expect(r.phase).toBe('map');
    expect(r.story).toBe('onda');
    expect(r.character.learned).toContain('bola_de_fogo');
    expect(r.shop.equipment).toHaveLength(2);
    expect(r.startedAt).toBe(1000);
  });

  it('mesma semente gera a mesma run', () => {
    expect(JSON.stringify(newRun(params, 7, 0))).toBe(JSON.stringify(newRun(params, 7, 0)));
  });
});

describe('encontros', () => {
  it('vencer um comum dá as recompensas da tabela e avança', () => {
    let r = winCurrent(overpowered(newRun(params, 1, 0)));
    expect(r.phase).toBe('result');
    expect(r.lastResult).toMatchObject({ won: true, xp: 12, ryo: 30, rep: 22, nodeIndex: 0, elite: false });
    expect(r.character.ryo).toBe(30);
    expect(r.character.reputation).toBe(22);
    expect(r.nodeIndex).toBe(1);
    expect(r.stats.encountersWon).toBe(1);
    r = continueFromResult(r);
    expect(r.phase).toBe('map');
  });

  it('elite só onde há bifurcação; paga 50 ryo e XP ×1,6', () => {
    const base = overpowered(newRun(params, 1, 0));
    const plain = { ...structuredClone(base), nodeIndex: base.nodes.find((n) => n.kind === 'common' && !n.eliteEnemyId)!.index };
    expect(() => startEncounter(plain, true)).toThrow(RuleError);
    const node = base.nodes.find((n) => n.eliteEnemyId)!;
    const r = winCurrent({ ...structuredClone(base), nodeIndex: node.index }, true);
    expect(r.lastResult).toMatchObject({ elite: true, ryo: 50, rep: 38, xp: Math.round(xpForCommon(node.storyLevel) * 1.6) });
  });

  it('Zabuza: Acampamento, vários níveis com uma escolha por nível, saga avança e loja renova (Review Focus 5)', () => {
    let r = overpowered(newRun(params, 3, 0));
    r.nodeIndex = 12;
    r.phase = 'camp';
    r.character.hp = 1;
    r.shop.rareScrolls = 0;
    r = restAtCamp(r);
    expect(r.character.hp).toBe(characterMaxHp(r.character));
    expect(r.phase).toBe('map');
    r = winCurrent(r);
    expect(r.lastResult).toMatchObject({ xp: 112, ryo: 200, rep: 160, isBoss: true, levelsGained: 2 });
    expect(r.character.level).toBe(3);
    expect(r.character.unspentPoints).toBe(12);
    expect(r.pendingChoices).toHaveLength(2);
    for (const offer of r.pendingChoices) expect(new Set(offer).size).toBe(3);
    expect(r.story).toBe('onda_pos_zabuza');
    expect(r.stats.bossesDefeated).toEqual(['zabuza']);
    expect(r.shop.rareScrolls).toBe(1);
    expect(() => continueFromResult(r)).toThrow(RuleError);
    r = continueFromResult(takeAllChoices(r));
    expect(r.phase).toBe('map');
  });

  it('chooseReward aplica a recompensa e valida a oferta', () => {
    const r = newRun(params, 2, 0);
    r.phase = 'result';
    r.pendingChoices = [['kit', 'ryo', 'treino']];
    expect(chooseReward(r, 'kit').character.inventory['kit_medico']).toBe(1);
    expect(chooseReward(r, 'ryo').character.ryo).toBe(60);
    expect(() => chooseReward(r, 'reforco')).toThrow(RuleError);
    expect(() => chooseReward(r, 'treino')).toThrow(RuleError);
    const id = r.character.equipped[0]!;
    expect(chooseReward(r, 'treino', id).character.masteryUses[id]).toBe(4);
  });

  it('derrota encerra a run e guarda a causa', () => {
    const r0 = newRun(params, 11, 0);
    r0.character.hp = 1;
    r0.character.baseAttrs.vel = 0;
    const r = winCurrent(r0);
    expect(r.phase).toBe('dead');
    expect(r.lastResult).toMatchObject({ won: false, nodeIndex: 0 });
    expect(r.lastResult!.enemyName.length).toBeGreaterThan(0);
  });

  it('vencer Haku conclui a saga', () => {
    let r = overpowered(newRun(params, 4, 0));
    r.nodeIndex = 25;
    r.phase = 'camp';
    r = winCurrent(restAtCamp(r));
    expect(r.phase).toBe('victory');
    expect(r.pendingChoices).toEqual([]);
  });

  it('não muta a run e rejeita ação na fase errada', () => {
    const r = newRun(params, 5, 0);
    expect(() => battleAction(r, { type: 'attack' })).toThrow(RuleError);
    startEncounter(r);
    expect(r.phase).toBe('map');
    expect(r.battle).toBeNull();
  });

  it('mesma semente + mesmas ações = mesma run', () => {
    const play = () => {
      let r = overpowered(newRun(params, 9, 0));
      for (let i = 0; i < 3; i++) r = continueFromResult(takeAllChoices(winCurrent(r)));
      return JSON.stringify(r);
    };
    expect(play()).toBe(play());
  });
});

describe('preparação entre encontros', () => {
  it('distribuir pontos e usar Pergaminho Raro podem desbloquear jutsus (regra de status)', () => {
    const r = newRun(params, 6, 0);
    r.character.unspentPoints = 3;
    const a = allocateRunPoints(r, { nin: 3 });
    expect(a.learned).toEqual(expect.arrayContaining(['daitoppa', 'doryuuheki']));
    const s = structuredClone(a.run);
    s.character.inventory['pergaminho_raro'] = 1;
    s.character.baseAttrs.vel = 7;
    expect(useRareScrollInRun(s, 'vel').learned).toContain('kawarimi');
  });

  it('comprar desconta ryo e registra o gasto', () => {
    const r = newRun(params, 8, 0);
    r.character.ryo = 100;
    const b = buyInRun(r, 'kit_medico');
    expect(b.character.ryo).toBe(20);
    expect(b.stats.ryoSpent).toBe(80);
  });
});
