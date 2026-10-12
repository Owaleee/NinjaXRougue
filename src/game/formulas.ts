import { BALANCE as B } from './Balance';
import { ELEMENTS, type Element } from './types';

/**
 * Fórmulas puras do DD v2 §3. Chances são devolvidas como FRAÇÃO (0..1).
 * Nada aqui sorteia: quem sorteia é o combate, usando o Rng.
 */

/** P(N): pontos totais esperados de um personagem de clã no nível N. */
export function expectedPoints(level: number): number {
  return B.attributes.expectedBase + B.attributes.expectedPerLevel * (level - 1);
}

export function maxHp(hpAttr: number, level: number, mult = 1): number {
  return Math.round((B.hp.base + B.hp.perPoint * hpAttr + B.hp.perLevel * level) * mult);
}

export function maxChakra(int: number, level: number): number {
  return B.chakra.base + B.chakra.perLevel * level + B.chakra.perInt * Math.floor(int);
}

export function chakraRegen(int: number): number {
  return B.chakra.regenBase + Math.floor(int / B.chakra.regenIntDivisor);
}

/** Redução só pela Defesa: mín(60%, Def/(Def+50)). */
export function defenseReduction(def: number): number {
  if (def <= 0) return 0;
  return Math.min(B.defense.cap, def / (def + B.defense.k));
}

/** Defesa + bônus de efeitos (ex.: Doryuuheki), com teto total de 75% (spec §4). */
export function totalReduction(def: number, bonus: number): number {
  return Math.min(B.defense.totalCap, defenseReduction(def) + bonus);
}

export function dodgeChance(targetVel: number, attackerVel: number, bonus = 0): number {
  const basePct = Math.min(B.dodge.capPct, Math.max(0, B.dodge.basePct + B.dodge.perVelPct * (targetVel - attackerVel)));
  return Math.min(B.dodge.capPct / 100, basePct / 100 + bonus);
}

export function critChance(critAttr: number, bonus = 0): number {
  const fromAttr = critAttr <= 0 ? 0 : (B.crit.scalePct * critAttr) / (critAttr + B.crit.k) / 100;
  return Math.min(B.crit.capPct / 100, fromAttr + bonus);
}

/** true se o elemento a vence o elemento b na roda. */
export function elementBeats(a: Element, b: Element): boolean {
  const i = ELEMENTS.indexOf(a);
  return ELEMENTS[(i + 1) % ELEMENTS.length] === b;
}

export function elementMultiplier(atk: Element | null, def: Element | null): number {
  if (!atk || !def) return 1;
  if (elementBeats(atk, def)) return B.damage.elementAdvantage;
  if (elementBeats(def, atk)) return B.damage.elementDisadvantage;
  return 1;
}

export function xpToNext(level: number): number {
  return B.xp.toNextBase + B.xp.toNextPerLevel * level;
}

export function xpForCommon(storyLevel: number): number {
  return B.xp.commonBase + B.xp.commonPerLevel * storyLevel;
}

/**
 * Chance de aplicar controle (DD v2 §10):
 * base × (1 + Gen/100 se ilusão) × (1 + 0,08·maestria) × (0,5 se chefe), teto 85%.
 */
export function controlChance(
  base: number,
  gen: number,
  isIllusion: boolean,
  masteryLevel: number,
  isBoss: boolean,
): number {
  let p = base * (1 + (isIllusion ? gen / B.control.genjutsuDivisor : 0));
  p *= 1 + B.mastery.effectChancePerLevel * masteryLevel;
  if (isBoss) p *= B.control.bossChanceMult;
  return Math.min(B.control.chanceCap, p);
}

/** Chance de efeito que não é controle (queimadura, lentidão...): +8% relativo por nível. */
export function effectChance(base: number, masteryLevel: number): number {
  return Math.min(1, base * (1 + B.mastery.effectChancePerLevel * masteryLevel));
}
