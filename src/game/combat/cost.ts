import type { JutsuDef } from '../../data/jutsus';
import { aggregateMods } from '../effects/EffectSystem';
import { jutsuChakraCost, masteryLevelFromUses } from '../progression/mastery';
import type { Combatant } from './types';

export function currentMasteryLevel(c: Combatant, j: JutsuDef): number {
  return masteryLevelFromUses(c.masteryUses[j.id] ?? 0, j, c.clan, c.element);
}

/** Custo de chakra do jutsu para este combatente agora (maestria, clã, afinidade, título). */
export function costFor(c: Combatant, j: JutsuDef): number {
  return jutsuChakraCost(j, {
    clan: c.clan,
    affinity: c.element,
    masteryLevel: currentMasteryLevel(c, j),
    costPct: aggregateMods(c).chakraCostPct,
  });
}
