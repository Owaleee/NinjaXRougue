import Phaser from 'phaser';
import type { Combatant } from '../game/combat/types';
import type { GameEvent } from '../game/events';
import { EFFECTS } from '../data/effects';
import { JUTSUS } from '../data/jutsus';
import { t } from '../i18n/pt-BR';
import type { GameStore } from '../store/GameStore';
import { AnimationQueue, waitStep, type AnimStep } from './animationQueue';

/** Cor do placeholder por elemento (nunca arte oficial: só formas e nomes). */
const ELEMENT_COLOR: Record<string, number> = {
  fogo: 0xe4572e,
  vento: 0x9bd17b,
  raio: 0xf2d04b,
  terra: 0xa47148,
  agua: 0x3f88c5,
  none: 0x8a8f9c,
};
const PLAYER_COLOR = 0x4f7cff;
const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';

interface Fighter {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  aura: Phaser.GameObjects.Arc;
  baseX: number;
  color: number;
}

/**
 * Arena da batalha. NÃO decide nada: só anima a lista de eventos que o store
 * publica e avisa `animationsDone()` quando a fila esvazia (spec §2).
 */
export class BattleScene extends Phaser.Scene {
  private queue!: AnimationQueue;
  private fighters = new Map<string, Fighter>();
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly store: GameStore) {
    super('battle');
  }

  create(): void {
    this.add.rectangle(640, 600, 1280, 240, 0x1d2a20);
    this.queue = new AnimationQueue((step) => this.play(step), () => this.store.animationsDone());
    this.unsubscribe = this.store.onBattleEvents((events) => {
      if (events.some((e) => e.type === 'battleStart')) this.resetFighters();
      this.queue.enqueue(events);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
    this.resetFighters();
  }

  private combatants(): Combatant[] {
    const s = this.store.state;
    return (s.run?.battle ?? s.battleSnapshot)?.combatants ?? [];
  }

  private resetFighters(): void {
    for (const f of this.fighters.values()) f.container.destroy();
    this.fighters.clear();
    for (const c of this.combatants()) {
      const x = c.side === 'player' ? 400 : 880;
      const color = c.side === 'player' ? PLAYER_COLOR : (ELEMENT_COLOR[c.element ?? 'none'] ?? ELEMENT_COLOR['none']!);
      const aura = this.add.circle(0, 0, 115, 0xff2a2a, 0.22).setVisible(false);
      const body = this.add.rectangle(0, 0, 110, 170, color).setStrokeStyle(3, 0xffffff, 0.6);
      const label = this.add.text(0, -115, c.name, { fontFamily: FONT, fontSize: '20px', color: '#e8e6e1' }).setOrigin(0.5);
      const container = this.add.container(x, 430, [aura, body, label]);
      this.fighters.set(c.id, { container, body, aura, baseX: x, color });
    }
  }

  /**
   * Toca um passo e espera a duração dele pelo relógio do Phaser. Garantia: com a aba
   * em segundo plano (ou o loop dormindo) o relógio para; o setTimeout de `waitStep`
   * resolve mesmo assim e a fila chega ao `animationsDone()`.
   */
  private play(step: AnimStep): Promise<void> {
    const wait = waitStep(step.durationMs, (ms, cb) => this.time.delayedCall(ms, cb));
    this.animate(step.event);
    return wait;
  }

  private animate(e: GameEvent): void {
    switch (e.type) {
      case 'actionChosen':
      case 'jutsuUsed':
        return this.lunge(e.actorId);
      case 'damage': {
        const element = e.jutsuId ? (JUTSUS[e.jutsuId]?.element ?? null) : null;
        this.flash(e.targetId, element ? (ELEMENT_COLOR[element] ?? 0xffffff) : 0xffffff);
        this.shake(e.targetId);
        return this.float(e.targetId, `-${e.amount}${e.crit ? ` ${t('fx.crit')}` : ''}`, e.crit ? '#ffd23f' : '#ff5a4f', e.crit ? 34 : 26);
      }
      case 'dot':
        return this.float(e.targetId, `-${e.amount}`, '#ff8c42', 22);
      case 'dodge':
        return this.float(e.targetId, t('fx.dodge'), '#cfd8dc', 26);
      case 'miss':
        return this.float(e.targetId, t('fx.miss'), '#cfd8dc', 26);
      case 'negated':
        return this.float(e.targetId, t('fx.negated'), '#b98ce8', 26);
      case 'heal':
        return this.float(e.targetId, `+${e.hp}`, '#59c98a', 26);
      case 'effectApplied':
        return this.float(e.targetId, EFFECTS[e.effectId]?.name ?? e.effectId, '#b98ce8', 18);
      case 'transformOn':
        return this.setAura(e.actorId, true);
      case 'transformOff':
        return this.setAura(e.actorId, false);
      case 'defeated': {
        const f = this.fighters.get(e.targetId);
        if (f) this.tweens.add({ targets: f.container, alpha: 0.25, duration: 500 });
        return;
      }
      default:
        return;
    }
  }

  private lunge(id: string): void {
    const f = this.fighters.get(id);
    if (!f) return;
    const dir = f.baseX < 640 ? 1 : -1;
    this.tweens.add({ targets: f.container, x: f.baseX + 40 * dir, duration: 120, yoyo: true, onComplete: () => f.container.setX(f.baseX) });
  }

  private shake(id: string): void {
    const f = this.fighters.get(id);
    if (!f) return;
    this.tweens.add({ targets: f.container, x: f.baseX + 8, duration: 40, yoyo: true, repeat: 3, onComplete: () => f.container.setX(f.baseX) });
  }

  private flash(id: string, color: number): void {
    const f = this.fighters.get(id);
    if (!f) return;
    f.body.setFillStyle(color);
    this.time.delayedCall(150, () => f.body.setFillStyle(f.color));
  }

  private float(id: string, text: string, color: string, size: number): void {
    const f = this.fighters.get(id);
    if (!f) return;
    const txt = this.add
      .text(f.container.x, f.container.y - 150, text, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5);
    this.tweens.add({ targets: txt, y: txt.y - 60, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  /** Aura e contorno vermelhos enquanto a transformação está ativa (spec §4.1 "Visual"). */
  private setAura(id: string, on: boolean): void {
    const f = this.fighters.get(id);
    if (!f) return;
    f.aura.setVisible(on);
    f.body.setStrokeStyle(3, on ? 0xff2a2a : 0xffffff, on ? 1 : 0.6);
  }
}
