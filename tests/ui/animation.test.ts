import { describe, it, expect, vi } from 'vitest';
import type { GameEvent } from '../../src/game/events';
import { AnimationQueue, DURATIONS, FALLBACK_MARGIN_MS, stepsFor, waitStep } from '../../src/scenes/animationQueue';
import { scenario } from './memoryStore';

const start: GameEvent = { type: 'battleStart', playerId: 'player', enemyId: 'enemy:bandido' };
const hit: GameEvent = { type: 'damage', sourceId: 'player', targetId: 'enemy:bandido', amount: 10, crit: false, elementMult: 1, jutsuId: null, hpAfter: 20 };
const dodge: GameEvent = { type: 'dodge', sourceId: 'enemy:bandido', targetId: 'player' };
const turn: GameEvent = { type: 'turnStart', actorId: 'player', round: 1 };

describe('stepsFor', () => {
  it('ignora eventos sem animação e atrasa o início do turno do inimigo', () => {
    const steps = stepsFor(
      [turn, { type: 'actionChosen', actorId: 'enemy:bandido', action: { type: 'attack' } }, { type: 'actionChosen', actorId: 'player', action: { type: 'attack' } }],
      300,
    );
    expect(steps).toHaveLength(2);
    expect(steps[0]!.durationMs).toBe(DURATIONS.actionChosen! + 300);
    expect(steps[1]!.durationMs).toBe(DURATIONS.actionChosen!);
  });
});

describe('AnimationQueue', () => {
  it('toca em ordem, aceita eventos novos no meio e avisa UMA vez ao esvaziar', async () => {
    const played: string[] = [];
    let idle = 0;
    const q = new AnimationQueue(async (s) => {
      played.push(s.event.type);
    }, () => idle++);
    q.enqueue([start, hit]);
    expect(q.busy).toBe(true);
    q.enqueue([dodge]);
    await vi.waitFor(() => expect(idle).toBe(1));
    expect(played).toEqual(['battleStart', 'damage', 'dodge']);
    expect(q.busy).toBe(false);
  });

  it('lote sem nada para animar libera na hora', () => {
    let idle = 0;
    const q = new AnimationQueue(async () => {}, () => idle++);
    q.enqueue([turn]);
    expect(idle).toBe(1);
  });

  it('uma animação que falha não trava a fila', async () => {
    const played: string[] = [];
    let idle = 0;
    const q = new AnimationQueue(async (s) => {
      played.push(s.event.type);
      if (s.event.type === 'battleStart') throw new Error('textura faltando');
    }, () => idle++);
    q.enqueue([start, hit]);
    await vi.waitFor(() => expect(idle).toBe(1));
    expect(played).toEqual(['battleStart', 'damage']);
  });
});

describe('waitStep (garantia com o Phaser parado)', () => {
  it('relógio do motor parado: o setTimeout de garantia resolve depois de duração + folga', async () => {
    vi.useFakeTimers();
    try {
      let resolved = false;
      void waitStep(400, () => {}).then(() => (resolved = true));
      await vi.advanceTimersByTimeAsync(400 + FALLBACK_MARGIN_MS - 1);
      expect(resolved).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(resolved).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('relógio do motor andando: resolve no tempo dele e uma vez só', async () => {
    let engineCb: (() => void) | null = null;
    let timerCb: (() => void) | null = null;
    let count = 0;
    const p = waitStep(
      400,
      (_ms, cb) => (engineCb = cb),
      (cb) => (timerCb = cb),
    ).then(() => count++);
    engineCb!();
    timerCb!();
    await p;
    expect(count).toBe(1);
  });

  it('com o loop do Phaser dormindo, a fila ainda libera o store (animationsDone)', async () => {
    vi.useFakeTimers();
    try {
      const { store } = scenario();
      const q = new AnimationQueue((s) => waitStep(s.durationMs, () => {}), () => store.animationsDone());
      store.onBattleEvents((events) => q.enqueue(events));
      store.fight();
      expect(store.state.locked).toBe(true);
      await vi.runAllTimersAsync();
      expect(store.state.locked).toBe(false);
      expect(q.busy).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
