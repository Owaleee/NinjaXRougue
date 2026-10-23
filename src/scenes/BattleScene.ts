import Phaser from 'phaser';
import type { Combatant } from '../game/combat/types';
import type { GameEvent } from '../game/events';
import { CHARACTER_FACING, SCENE_LAYERS, battleSceneFor, clanArt, enemyArt, type VfxName } from '../data/art';
import { EFFECTS } from '../data/effects';
import { JUTSUS } from '../data/jutsus';
import { t } from '../i18n/pt-BR';
import type { GameStore } from '../store/GameStore';
import { AnimationQueue, waitStep, type AnimStep } from './animationQueue';
import { OVERLAY_KEY, VFX_MANIFEST_KEY, sceneKey, vfxKey } from './keys';
import { vfxForEvent } from './vfx';
import { REQUIRED_ANIMS, animForEvent, animKey, atlasKey, hasAnimations, metaKey, parseSpriteMeta, type FighterAnim, type SpriteMeta } from './spriteAnims';

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

/** Altura do sprite na arena (o canvas tem 720 px; o HUD cobre o topo e a base). */
const SPRITE_HEIGHT = 240;
const FIGHTER_Y = 345;
/** Folhas de quadros: pixels da tela por pixel do quadro (192 px de quadro → 288 px). Chefes têm quadros maiores e, por isso, aparecem maiores. */
const SHEET_SCALE = 1.5;
/** Âncora dos pés dentro do quadro quando o atlas não informa. */
const DEFAULT_ANCHOR = { x: 0.4167, y: 0.9271 };
/** Chão da arena (linha dos pés), igual ao dos cenários em camadas. */
const FLOOR_Y = FIGHTER_Y + SPRITE_HEIGHT / 2;

interface Fighter {
  container: Phaser.GameObjects.Container;
  /** Sprite com a arte do personagem, ou o retângulo placeholder se a textura faltar. */
  body: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  /** Metadados das animações por quadros (null = imagem estática ou retângulo). */
  meta: SpriteMeta | null;
  art: string;
  dead: boolean;
  aura: Phaser.GameObjects.Arc;
  /** Aura animada (VFX) enquanto a transformação está ativa; null = usa o círculo. */
  auraFx: Phaser.GameObjects.Sprite | null;
  baseX: number;
  color: number;
  /** Altura visual do corpo (para posicionar textos flutuantes acima da cabeça). */
  height: number;
}

/**
 * Arena da batalha. NÃO decide nada: só anima a lista de eventos que o store
 * publica e avisa `animationsDone()` quando a fila esvazia (spec §2).
 */
export class BattleScene extends Phaser.Scene {
  private queue!: AnimationQueue;
  private fighters = new Map<string, Fighter>();
  private unsubscribe: (() => void) | null = null;
  private scenery: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly store: GameStore) {
    super('battle');
  }

  create(): void {
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

  /** Cenário em 3 camadas por inimigo; sem as imagens, o chão liso de antes. */
  private buildScenery(templateId: string | null): void {
    for (const o of this.scenery) o.destroy();
    this.scenery = [];
    const { scene, overlay } = battleSceneFor(templateId);
    const hasLayers = SCENE_LAYERS.every((l) => this.textures.exists(sceneKey(scene, l)));
    if (!hasLayers) {
      this.scenery.push(this.add.rectangle(640, FLOOR_Y + 105, 1280, 210, 0x1d2a20).setDepth(-10));
      return;
    }
    SCENE_LAYERS.forEach((l, i) => this.scenery.push(this.add.image(640, 360, sceneKey(scene, l)).setDepth(-30 + i * 10)));
    const key = overlay ? OVERLAY_KEY[overlay] : null;
    if (key && this.textures.exists(key)) {
      if (overlay === 'nevoa') {
        const mist = this.add.tileSprite(640, 360, 1280, 720, key).setAlpha(0.45).setDepth(40);
        this.tweens.add({ targets: mist, tilePositionX: 512, duration: 30000, repeat: -1 });
        this.scenery.push(mist);
      } else {
        this.scenery.push(this.add.image(640, 360, key).setAlpha(0.7).setDepth(40));
      }
    }
  }

  private resetFighters(): void {
    for (const f of this.fighters.values()) f.container.destroy();
    this.fighters.clear();
    this.buildScenery(this.combatants().find((c) => c.side === 'enemy')?.templateId ?? null);
    for (const c of this.combatants()) {
      const x = c.side === 'player' ? 420 : 860;
      const color = c.side === 'player' ? PLAYER_COLOR : (ELEMENT_COLOR[c.element ?? 'none'] ?? ELEMENT_COLOR['none']!);
      const art = c.side === 'player' ? clanArt(c.clan) : enemyArt(c.templateId);
      const { body, height, meta } = this.makeBody(art, c.side, color);
      const shadow = this.add.ellipse(0, height / 2 - 6, height * 0.55, 26, 0x000000, 0.35);
      const aura = this.add.circle(0, 0, height * 0.55, 0xff2a2a, 0.22).setVisible(false);
      const label = this.add
        .text(0, -height / 2 - 18, c.name, { fontFamily: FONT, fontSize: '20px', color: '#e8e6e1', stroke: '#000000', strokeThickness: 4 })
        .setOrigin(0.5);
      const container = this.add.container(x, FIGHTER_Y, [shadow, aura, body, label]);
      this.fighters.set(c.id, { container, body, aura, auraFx: null, baseX: x, color, height, meta, art, dead: false });
      this.playAnim(this.fighters.get(c.id)!, 'idle');
    }
  }

  /**
   * Corpo do lutador, do melhor para o pior: folha animada (quadros reais), imagem
   * estática, retângulo placeholder. Arquivo faltando nunca quebra a arena.
   */
  private makeBody(art: string, side: 'player' | 'enemy', color: number): { body: Fighter['body']; height: number; meta: SpriteMeta | null } {
    const meta = this.textures.exists(atlasKey(art)) ? parseSpriteMeta(this.cache.json.get(metaKey(art))) : null;
    if (meta && hasAnimations(meta, REQUIRED_ANIMS)) {
      this.ensureAnims(art, meta);
      const first = meta.animations['idle']!.frames[0]!;
      const anchor = parseAnchor(this.cache.json.get(metaKey(art))) ?? DEFAULT_ANCHOR;
      const flip = side === 'enemy';
      // Origem nos pés (o container fica no centro da altura do lutador): os pés pousam sempre no chão do cenário.
      // As folhas são desenhadas viradas para a direita: o inimigo é espelhado, e a âncora também.
      const sprite = this.add.sprite(0, SPRITE_HEIGHT / 2, atlasKey(art), first).setOrigin(flip ? 1 - anchor.x : anchor.x, anchor.y);
      sprite.setScale(SHEET_SCALE).setFlipX(flip);
      return { body: sprite, height: SPRITE_HEIGHT, meta };
    }
    if (!this.textures.exists(art)) {
      return { body: this.add.rectangle(0, 0, 110, 170, color).setStrokeStyle(3, 0xffffff, 0.6), height: 170, meta: null };
    }
    const img = this.add.image(0, 0, art);
    img.setScale(SPRITE_HEIGHT / img.height);
    // Jogador olha para a direita, inimigo para a esquerda.
    const facing = CHARACTER_FACING[art as keyof typeof CHARACTER_FACING] ?? 'right';
    img.setFlipX(side === 'player' ? facing === 'left' : facing === 'right');
    return { body: img, height: SPRITE_HEIGHT, meta: null };
  }

  private ensureAnims(art: string, meta: SpriteMeta): void {
    for (const [name, a] of Object.entries(meta.animations)) {
      const key = animKey(art, name);
      if (this.anims.exists(key)) continue;
      this.anims.create({ key, frames: a.frames.map((frame) => ({ key: atlasKey(art), frame })), frameRate: a.fps, repeat: a.loop ? -1 : 0 });
    }
  }

  /** Toca a animação por quadros; as que não repetem voltam ao idle (menos a morte). */
  private playAnim(f: Fighter, anim: FighterAnim): void {
    if (!f.meta || !(f.body instanceof Phaser.GameObjects.Sprite) || f.dead) return;
    const sprite = f.body;
    sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
    sprite.play(animKey(f.art, anim));
    if (anim === 'death') {
      f.dead = true;
    } else if (anim !== 'idle') {
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.playAnim(f, 'idle'));
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
    const category = e.type === 'jutsuUsed' ? (JUTSUS[e.jutsuId]?.category ?? null) : null;
    for (const [id, f] of this.fighters) {
      const anim = animForEvent(e, id, category);
      if (anim) this.playAnim(f, anim);
    }
    const opponentOf = (id: string) => [...this.fighters.keys()].find((k) => k !== id);
    for (const v of vfxForEvent(e, opponentOf)) this.playVfx(v.name, v.on);
    switch (e.type) {
      case 'actionChosen':
      case 'jutsuUsed':
        return this.lunge(e.actorId);
      case 'damage': {
        const element = e.jutsuId ? (JUTSUS[e.jutsuId]?.element ?? null) : null;
        this.flash(e.targetId, element ? (ELEMENT_COLOR[element] ?? 0xffffff) : 0xffffff);
        this.shake(e.targetId);
        return this.float(e.targetId, e.crit ? t('fx.damageCrit', { n: e.amount, crit: t('fx.crit') }) : t('fx.damage', { n: e.amount }), e.crit ? '#ffd23f' : '#ff5a4f', e.crit ? 34 : 26);
      }
      case 'dot':
        return this.float(e.targetId, t('fx.damage', { n: e.amount }), '#ff8c42', 22);
      case 'dodge':
        return this.float(e.targetId, t('fx.dodge'), '#cfd8dc', 26);
      case 'miss':
        return this.float(e.targetId, t('fx.miss'), '#cfd8dc', 26);
      case 'negated':
        return this.float(e.targetId, t('fx.negated'), '#b98ce8', 26);
      case 'heal':
        return this.float(e.targetId, t('fx.heal', { n: e.hp }), '#59c98a', 26);
      case 'effectApplied':
        return this.float(e.targetId, EFFECTS[e.effectId]?.name ?? e.effectId, '#b98ce8', 18);
      case 'transformOn':
        return this.setAura(e.actorId, true);
      case 'transformOff':
        return this.setAura(e.actorId, false);
      case 'defeated': {
        const f = this.fighters.get(e.targetId);
        if (f && !f.meta) this.tweens.add({ targets: f.container, alpha: 0.25, duration: 500 });
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
    const body = f.body;
    if (!(body instanceof Phaser.GameObjects.Rectangle)) {
      body.setTintFill(color);
      // Volta ao tom da transformação se ela estiver ativa.
      this.time.delayedCall(150, () => (f.aura.visible ? body.setTint(0xffb0b0) : body.clearTint()));
    } else {
      body.setFillStyle(color);
      this.time.delayedCall(150, () => body.setFillStyle(f.color));
    }
  }

  private float(id: string, text: string, color: string, size: number): void {
    const f = this.fighters.get(id);
    if (!f) return;
    const txt = this.add
      .text(f.container.x, f.container.y - f.height / 2 - 40, text, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5);
    this.tweens.add({ targets: txt, y: txt.y - 60, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  /** Efeito animado sobre um lutador, uma vez; sem a textura (arquivo faltando), não faz nada. */
  private playVfx(name: VfxName, onId: string, loop = false): Phaser.GameObjects.Sprite | null {
    const f = this.fighters.get(onId);
    const key = vfxKey(name);
    if (!f || !this.textures.exists(key)) return null;
    const animName = `${key}:play`;
    const entry = (this.cache.json.get(VFX_MANIFEST_KEY) as { efeitos?: Record<string, { fps?: number }> } | undefined)?.efeitos?.[name];
    if (!this.anims.exists(animName)) {
      const frames = this.textures.get(key).getFrameNames().sort().map((frame) => ({ key, frame }));
      this.anims.create({ key: animName, frames, frameRate: entry?.fps ?? 14, repeat: loop ? -1 : 0 });
    }
    const sprite = this.add.sprite(f.container.x, f.container.y + 10, key).setDepth(20);
    sprite.setScale(280 / sprite.height);
    if (!loop) sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
    sprite.play(animName);
    return sprite;
  }

  /** Aura e contorno vermelhos enquanto a transformação está ativa (spec §4.1 "Visual"). */
  private setAura(id: string, on: boolean): void {
    const f = this.fighters.get(id);
    if (!f) return;
    const fx = on ? this.playVfx('fx_aura_sharingan', id, true) : null;
    if (on && fx) {
      f.auraFx?.destroy();
      f.auraFx = fx;
      f.container.add(fx);
      fx.setPosition(0, SPRITE_HEIGHT / 2 - 100).setDepth(0);
      f.container.sendToBack(fx);
    } else if (!on && f.auraFx) {
      f.auraFx.destroy();
      f.auraFx = null;
    }
    f.aura.setVisible(on && !fx);
    const body = f.body;
    if (!(body instanceof Phaser.GameObjects.Rectangle)) {
      if (on) body.setTint(0xffb0b0);
      else body.clearTint();
    } else {
      body.setStrokeStyle(3, on ? 0xff2a2a : 0xffffff, on ? 1 : 0.6);
    }
  }
}

/** Âncora dos pés (fração do quadro) escrita no atlas.json; null se faltar. */
function parseAnchor(json: unknown): { x: number; y: number } | null {
  const a = (json as { meta?: { anchor?: { x?: unknown; y?: unknown } } } | null)?.meta?.anchor;
  return a && typeof a.x === 'number' && typeof a.y === 'number' ? { x: a.x, y: a.y } : null;
}
