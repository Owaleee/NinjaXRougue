import type { GameEvent } from '../game/events';

/**
 * Fila de animações, SEM Phaser (testável). A BattleScene só fornece a função
 * `play`; a fila garante ordem, aceita eventos novos no meio e chama `onIdle`
 * (→ store.animationsDone) exatamente uma vez quando esvazia.
 */
export interface AnimStep {
  event: GameEvent;
  durationMs: number;
}

/** Duração de cada tipo de evento animado. Ausente = não anima. */
export const DURATIONS: Partial<Record<GameEvent['type'], number>> = {
  battleStart: 400,
  actionChosen: 450,
  jutsuUsed: 600,
  damage: 500,
  dodge: 400,
  miss: 400,
  negated: 400,
  dot: 350,
  heal: 350,
  defend: 250,
  meditate: 250,
  itemUsed: 300,
  effectApplied: 250,
  effectExpired: 150,
  controlledSkip: 350,
  transformOn: 450,
  transformOff: 300,
  defeated: 800,
  battleEnd: 500,
};

/** Folga do relógio de garantia sobre a duração do passo. */
export const FALLBACK_MARGIN_MS = 1000;

/** Converte eventos em passos. O início do turno do inimigo ganha um atraso curto (spec §10). */
export function stepsFor(events: GameEvent[], enemyDelayMs = 350): AnimStep[] {
  const steps: AnimStep[] = [];
  for (const e of events) {
    const d = DURATIONS[e.type];
    if (d === undefined) continue;
    const enemyTurn = e.type === 'actionChosen' && e.actorId !== 'player';
    steps.push({ event: e, durationMs: d + (enemyTurn ? enemyDelayMs : 0) });
  }
  return steps;
}

/**
 * Espera um passo terminar: pelo relógio do Phaser (`engineDelay`) OU, se ele
 * não andar (aba em segundo plano, loop dormindo), pelo `setTimeout` de garantia.
 * Resolve uma vez só, o que vier primeiro.
 */
export function waitStep(
  durationMs: number,
  engineDelay: (ms: number, cb: () => void) => void,
  timer: (cb: () => void, ms: number) => unknown = (cb, ms) => setTimeout(cb, ms),
): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    try {
      engineDelay(durationMs, finish);
    } catch {
      // Relógio do motor indisponível: o timer de garantia resolve.
    }
    timer(finish, durationMs + FALLBACK_MARGIN_MS);
  });
}

export class AnimationQueue {
  private queue: AnimStep[] = [];
  private running = false;

  constructor(
    private readonly play: (step: AnimStep) => Promise<void>,
    private readonly onIdle: () => void,
  ) {}

  get busy(): boolean {
    return this.running;
  }

  enqueue(events: GameEvent[]): void {
    this.queue.push(...stepsFor(events));
    if (!this.running) void this.run();
  }

  private async run(): Promise<void> {
    this.running = true;
    try {
      while (this.queue.length) {
        const step = this.queue.shift() as AnimStep;
        try {
          await this.play(step);
        } catch {
          // Uma animação quebrada nunca pode travar a entrada do jogador.
        }
      }
    } finally {
      this.running = false;
      this.onIdle();
    }
  }
}
