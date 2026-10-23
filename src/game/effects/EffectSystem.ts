import { BALANCE as B } from '../Balance';
import { emptyAttributes } from '../attributes';
import { RuleError } from '../errors';
import type { GameEvent } from '../events';
import { ATTR_KEYS, ELEMENTS, type AttrKey, type Element, type Modifiers } from '../types';
import { EFFECTS, type EffectDef } from '../../data/effects';
import type { ActiveEffect, Combatant } from '../combat/types';

/**
 * Sistema GENÉRICO de efeitos (DD v2 §10). Buff, debuff, controle, dano
 * contínuo e transformação passam todos por aqui.
 * Todas as funções que recebem um `Combatant` operam IN-PLACE (mutam o
 * combatente): são chamadas sempre sobre estado já clonado pelo chamador.
 */

export interface ModTotals {
  attrPct: Record<AttrKey, number>;
  dodge: number;
  crit: number;
  damagePct: number;
  jutsuDamagePct: number;
  elementDamagePct: Record<Element, number>;
  reduction: number;
  chakraCostPct: number;
  ryoPct: number;
  repPct: number;
  shopPricePct: number;
}

export function emptyTotals(): ModTotals {
  return {
    attrPct: emptyAttributes(0),
    dodge: 0,
    crit: 0,
    damagePct: 0,
    jutsuDamagePct: 0,
    elementDamagePct: { fogo: 0, vento: 0, raio: 0, terra: 0, agua: 0 },
    reduction: 0,
    chakraCostPct: 0,
    ryoPct: 0,
    repPct: 0,
    shopPricePct: 0,
  };
}

export function addMods(t: ModTotals, m: Modifiers): void {
  for (const k of ATTR_KEYS) t.attrPct[k] += m.attrPct?.[k] ?? 0;
  for (const e of ELEMENTS) t.elementDamagePct[e] += m.elementDamagePct?.[e] ?? 0;
  t.dodge += m.dodge ?? 0;
  t.crit += m.crit ?? 0;
  t.damagePct += m.damagePct ?? 0;
  t.jutsuDamagePct += m.jutsuDamagePct ?? 0;
  t.reduction += m.reduction ?? 0;
  t.chakraCostPct += m.chakraCostPct ?? 0;
  t.ryoPct += m.ryoPct ?? 0;
  t.repPct += m.repPct ?? 0;
  t.shopPricePct += m.shopPricePct ?? 0;
}

export function sumModifiers(list: Modifiers[]): ModTotals {
  const t = emptyTotals();
  for (const m of list) addMods(t, m);
  return t;
}

function def(id: string): EffectDef {
  const d = EFFECTS[id];
  if (!d) throw new RuleError('unknownEffect', `Efeito desconhecido: ${id}`);
  return d;
}

/** Soma passivas (clã, título) + efeitos ativos num único "balde" aditivo. */
export function aggregateMods(c: Combatant): ModTotals {
  const t = sumModifiers(c.passiveMods);
  for (const e of c.effects) {
    const d = def(e.effectId);
    if (d.mods) addMods(t, d.mods);
  }
  return t;
}

/** Atributo efetivo em batalha = (base + equipamento) × (1 + % de efeitos). */
export function effectiveAttr(c: Combatant, k: AttrKey): number {
  return c.attrs[k] * (1 + aggregateMods(c).attrPct[k]);
}

export function hasEffect(c: Combatant, id: string): boolean {
  return c.effects.some((e) => e.effectId === id);
}

export function activeControl(c: Combatant): ActiveEffect | undefined {
  return c.effects.find((e) => def(e.effectId).type === 'control');
}

export function activeTransformation(c: Combatant): ActiveEffect | undefined {
  return c.effects.find((e) => def(e.effectId).type === 'transformation');
}

/** Controle dura no máximo 2 turnos em comuns e 1 em chefes. */
export function controlDuration(c: Combatant, requested: number): number {
  const cap = c.isBoss ? B.control.maxTurnsBoss : B.control.maxTurnsCommon;
  return Math.max(1, Math.min(requested, cap));
}

export function applyEffect(c: Combatant, effectId: string, opts: { sourceId: string; duration?: number }): GameEvent[] {
  const d = def(effectId);

  if (d.type === 'control') {
    if (c.tenacity > 0) return [{ type: 'effectResisted', targetId: c.id, effectId, reason: 'tenacity' }];
    const duration = controlDuration(c, opts.duration ?? (typeof d.duration === 'number' ? d.duration : 1));
    const current = activeControl(c);
    if (current) {
      // Um controle por vez: o novo só renova a duração do atual (sem somar).
      current.remaining = Math.max(current.remaining ?? 0, duration);
      return [{ type: 'effectApplied', targetId: c.id, effectId: current.effectId, remaining: current.remaining }];
    }
    c.effects.push({ effectId, remaining: duration, sourceId: opts.sourceId, chargeUsed: false });
    return [{ type: 'effectApplied', targetId: c.id, effectId, remaining: duration }];
  }

  const events: GameEvent[] = [];
  if (d.type === 'transformation') {
    const current = activeTransformation(c);
    if (current && current.effectId !== effectId) events.push(...removeEffect(c, current.effectId));
  }
  const remaining = typeof d.duration === 'number' ? (opts.duration ?? d.duration) : null;
  const existing = c.effects.find((e) => e.effectId === effectId);
  if (existing) {
    existing.remaining = remaining; // renova, não acumula
    existing.chargeUsed = false;
    existing.sourceId = opts.sourceId;
  } else {
    c.effects.push({ effectId, remaining, sourceId: opts.sourceId, chargeUsed: false });
  }
  events.push({ type: 'effectApplied', targetId: c.id, effectId, remaining });
  return events;
}

/** Remove um efeito. Se for controle, começa a Tenacidade. */
export function removeEffect(c: Combatant, effectId: string): GameEvent[] {
  const e = c.effects.find((x) => x.effectId === effectId);
  if (!e) return [];
  c.effects = c.effects.filter((x) => x !== e);
  if (def(effectId).type === 'control') c.tenacity = B.control.tenacityTurns;
  return [{ type: 'effectExpired', targetId: c.id, effectId }];
}

/**
 * Consome a primeira carga disponível do tipo pedido. Efeitos que SÓ têm
 * carga (Kawarimi, Henge) somem; os que também têm bônus (Kage Bunshin) ficam.
 */
export function consumeCharge(c: Combatant, kind: 'negateHit' | 'absorbHit' | 'missChance'): ActiveEffect | null {
  const e = c.effects.find((x) => def(x.effectId).charge === kind && !x.chargeUsed);
  if (!e) return null;
  e.chargeUsed = true;
  if (!def(e.effectId).mods) c.effects = c.effects.filter((x) => x !== e);
  return e;
}

export function applyDots(c: Combatant): GameEvent[] {
  const events: GameEvent[] = [];
  for (const e of c.effects) {
    const d = def(e.effectId);
    if (d.type !== 'dot' || !d.dotPctMaxHp || c.hp <= 0) continue;
    const amount = Math.max(1, Math.round(c.maxHp * d.dotPctMaxHp));
    c.hp = Math.max(0, c.hp - amount);
    events.push({ type: 'dot', targetId: c.id, effectId: e.effectId, amount, hpAfter: c.hp });
    if (c.hp === 0) events.push({ type: 'defeated', targetId: c.id });
  }
  return events;
}

/** Cobra o custo por turno da transformação ativa; sem chakra, ela termina. */
export function payTransformationUpkeep(c: Combatant): GameEvent[] {
  const t = activeTransformation(c);
  if (!t) return [];
  const upkeep = def(t.effectId).upkeepPerTurn ?? 0;
  if (c.chakra < upkeep) {
    return [
      ...removeEffect(c, t.effectId),
      { type: 'transformOff', actorId: c.id, transformationId: t.effectId, reason: 'noChakra' },
    ];
  }
  c.chakra -= upkeep;
  c.transformTurns++;
  return [{ type: 'transformUpkeep', actorId: c.id, amount: upkeep }];
}

/**
 * Passa um turno do portador: Tenacidade −1 e duração dos efeitos −1.
 * `keep` preserva efeitos específicos (Ilusão enquanto o jogador decide usar Kai).
 */
export function tickDurations(c: Combatant, keep: string[] = []): GameEvent[] {
  const events: GameEvent[] = [];
  if (c.tenacity > 0) c.tenacity--;
  for (const e of [...c.effects]) {
    if (e.remaining === null || keep.includes(e.effectId)) continue;
    e.remaining--;
    if (e.remaining <= 0) events.push(...removeEffect(c, e.effectId));
  }
  return events;
}

/** Kai: remove Ilusão e efeitos de Genjutsu de si mesmo. */
export function cleanseIllusions(c: Combatant): GameEvent[] {
  const events: GameEvent[] = [];
  for (const e of [...c.effects]) if (def(e.effectId).removableByKai) events.push(...removeEffect(c, e.effectId));
  return events;
}
