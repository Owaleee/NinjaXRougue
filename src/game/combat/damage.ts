import { BALANCE as B } from '../Balance';
import type { GameEvent } from '../events';
import { critChance, dodgeChance, elementMultiplier, totalReduction } from '../formulas';
import type { Rng } from '../Rng';
import type { AttrKey, Element } from '../types';
import { EFFECTS } from '../../data/effects';
import { aggregateMods, consumeCharge, effectiveAttr } from '../effects/EffectSystem';
import type { Combatant } from './types';

export interface HitSpec {
  power: number;
  attrKey: AttrKey;
  element: Element | null;
  masteryLevel: number;
  jutsuId: string | null;
}

export interface HitResult {
  events: GameEvent[];
  /** O golpe acertou? Efeitos "no inimigo" de um jutsu de dano só valem se acertar. */
  landed: boolean;
}

/**
 * Resolve UM golpe (DD v2 §9 + spec §4). Ordem:
 * 1. Kawarimi anula;  2. Henge pode fazer errar;  3. esquiva;
 * 4. clone do Kage Bunshin absorve;  5. dano.
 * Dano = Poder × (1+0,03·m) × (1+Atr/40) × Elem × (1+Σbônus) × (1−Red) × Crit × Var × multGrau × (0,5 se defendendo)
 *
 * Muta `tgt` (HP e cargas): opera sobre batalha já clonada pelo chamador.
 */
export function resolveHit(att: Combatant, tgt: Combatant, spec: HitSpec, rng: Rng): HitResult {
  const base = { sourceId: att.id, targetId: tgt.id };

  if (consumeCharge(tgt, 'negateHit')) {
    return { events: [{ type: 'negated', ...base, reason: 'kawarimi' }], landed: false };
  }
  const henge = consumeCharge(tgt, 'missChance');
  if (henge && rng.chance(EFFECTS[henge.effectId]?.chargeChance ?? 0)) {
    return { events: [{ type: 'miss', ...base, reason: 'henge' }], landed: false };
  }

  const am = aggregateMods(att);
  const tm = aggregateMods(tgt);
  if (rng.chance(dodgeChance(effectiveAttr(tgt, 'vel'), effectiveAttr(att, 'vel'), tm.dodge))) {
    return { events: [{ type: 'dodge', ...base }], landed: false };
  }
  if (consumeCharge(tgt, 'absorbHit')) {
    return { events: [{ type: 'negated', ...base, reason: 'clone' }], landed: false };
  }

  const attr = effectiveAttr(att, spec.attrKey);
  const elem = elementMultiplier(spec.element, tgt.element);
  const bonus =
    am.damagePct + (spec.jutsuId ? am.jutsuDamagePct : 0) + (spec.element ? am.elementDamagePct[spec.element] : 0);
  const reduction = totalReduction(effectiveAttr(tgt, 'def'), tm.reduction);
  const crit = rng.chance(critChance(effectiveAttr(att, 'crit'), am.crit));
  const variance = rng.range(B.damage.varianceMin, B.damage.varianceMax);

  let dmg =
    spec.power *
    (1 + B.mastery.damagePerLevel * spec.masteryLevel) *
    (1 + attr / B.damage.attrDivisor) *
    elem *
    (1 + bonus) *
    (1 - reduction) *
    (crit ? B.damage.critMultiplier : 1) *
    variance *
    att.damageMult;
  if (tgt.defending) dmg *= B.actions.defendDamageMult;

  const amount = Math.max(B.damage.minDamage, Math.round(dmg));
  tgt.hp = Math.max(0, tgt.hp - amount);
  const events: GameEvent[] = [
    { type: 'damage', ...base, amount, crit, elementMult: elem, jutsuId: spec.jutsuId, hpAfter: tgt.hp },
  ];
  if (tgt.hp === 0) events.push({ type: 'defeated', targetId: tgt.id });
  return { events, landed: true };
}
