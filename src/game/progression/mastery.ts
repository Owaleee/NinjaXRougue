import { BALANCE as B } from '../Balance';
import { CLANS } from '../../data/clans';
import type { JutsuDef } from '../../data/jutsus';
import type { ClanId, Element } from '../types';

/**
 * Maestria de jutsu (DD v2 §8): +1..+5 por uso.
 * Sem clã precisa de 25% menos usos; jutsu elemental fora da afinidade
 * para em +3 (exceto Sem clã, que ignora a penalidade).
 */
export function masteryStepUses(clan: ClanId | null): number[] {
  const mult = clan ? CLANS[clan].masteryUseMult : 1;
  return B.mastery.stepUses.map((u) => Math.ceil(u * mult));
}

export function isOffAffinity(j: JutsuDef, clan: ClanId | null, affinity: Element | null): boolean {
  if (!clan || !j.element) return false;
  if (CLANS[clan].ignoresAffinityPenalty) return false;
  return j.element !== affinity;
}

export function masteryCap(j: JutsuDef, clan: ClanId | null, affinity: Element | null): number {
  return isOffAffinity(j, clan, affinity) ? B.mastery.maxLevelOffAffinity : B.mastery.maxLevel;
}

export function masteryLevelFromUses(uses: number, j: JutsuDef, clan: ClanId | null, affinity: Element | null): number {
  let level = 0;
  let acc = 0;
  for (const step of masteryStepUses(clan)) {
    acc += step;
    if (uses >= acc) level++;
    else break;
  }
  return Math.min(level, masteryCap(j, clan, affinity));
}

/** Para a barra de progresso: quantos usos já entraram no nível atual e quantos o próximo exige. */
export function masteryProgress(
  uses: number,
  j: JutsuDef,
  clan: ClanId | null,
  affinity: Element | null,
): { level: number; usesIntoLevel: number; usesForNext: number | null } {
  const level = masteryLevelFromUses(uses, j, clan, affinity);
  const steps = masteryStepUses(clan);
  if (level >= masteryCap(j, clan, affinity)) return { level, usesIntoLevel: 0, usesForNext: null };
  const spent = steps.slice(0, level).reduce((s, x) => s + x, 0);
  return { level, usesIntoLevel: uses - spent, usesForNext: steps[level] ?? null };
}

export interface CostContext {
  clan: ClanId | null;
  affinity: Element | null;
  masteryLevel: number;
  /** Soma de chakraCostPct de títulos/efeitos (ex.: −0,03). */
  costPct: number;
}

/**
 * Custo final de chakra. Modificadores MULTIPLICATIVOS (spec §4):
 * maestria (−5%/nível) × fora da afinidade (+25%) × Sem clã em geral (−10%)
 * × desconto específico do clã (Uzumaki em Kage Bunshin −20%) × (1 + título).
 */
export function jutsuChakraCost(j: JutsuDef, ctx: CostContext): number {
  if (j.cost === 0) return 0;
  let mult = 1 - B.mastery.costPerLevel * ctx.masteryLevel;
  if (isOffAffinity(j, ctx.clan, ctx.affinity)) mult *= B.cost.offAffinityMult;
  if (ctx.clan) {
    const clan = CLANS[ctx.clan];
    if (j.clan === null) mult *= clan.generalJutsuCostMult;
    mult *= clan.jutsuCostMult[j.id] ?? 1;
  }
  mult *= 1 + ctx.costPct;
  return Math.max(1, Math.round(j.cost * mult));
}
