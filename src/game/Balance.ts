import type { Grade } from './types';

/**
 * TODAS as constantes de balanceamento do jogo vivem aqui.
 * POR QUÊ: mudar um número não pode exigir caçar valores espalhados pelo código.
 * Toda mudança neste arquivo deve ser conferida com `npm run sim:check`.
 * Fonte: DD v2 §3, §7, §9, §10, §11 e Apêndice A, com as correções da spec §3.
 */
export interface GradeScaling {
  /** Fração de P(N) que o inimigo recebe em pontos de atributo. */
  pointsRatio: number;
  hpMult: number;
  /** Multiplica o Poder dos golpes do inimigo. */
  damageMult: number;
}

const enemyGrades: Record<Grade, GradeScaling> = {
  D: { pointsRatio: 0.7, hpMult: 0.8, damageMult: 0.6 },
  'D+': { pointsRatio: 0.9, hpMult: 1.0, damageMult: 0.8 },
  C: { pointsRatio: 1.1, hpMult: 1.3, damageMult: 0.72 },
  B: { pointsRatio: 1.2, hpMult: 1.5, damageMult: 0.8 }, // spec C6: HP 1,3 → 1,5
  A: { pointsRatio: 1.35, hpMult: 1.5, damageMult: 0.9 },
  S: { pointsRatio: 1.5, hpMult: 1.7, damageMult: 1.0 },
};

const rewards: Partial<Record<Grade, { ryo: number; rep: number }>> = {
  D: { ryo: 30, rep: 22 },
  'D+': { ryo: 50, rep: 38 },
  C: { ryo: 200, rep: 160 },
  B: { ryo: 300, rep: 240 },
  A: { ryo: 500, rep: 400 },
};

const bossXpMult: Partial<Record<Grade, number>> = { C: 4, B: 4, A: 6, S: 6 };

export const BALANCE = {
  attributes: { start: 5, creationPoints: 10, expectedBase: 50, expectedPerLevel: 7 },
  hp: { base: 80, perPoint: 4, perLevel: 6 },
  chakra: { base: 30, perLevel: 4, perInt: 1, regenBase: 2, regenIntDivisor: 8 },
  damage: {
    attrDivisor: 40,
    critMultiplier: 1.5,
    varianceMin: 0.9,
    varianceMax: 1.1,
    minDamage: 1,
    elementAdvantage: 1.3,
    elementDisadvantage: 0.8,
  },
  power: { D: 26, C: 40, B: 60, A: 90, S: 130, attack: 18 },
  defense: { k: 50, cap: 0.6, totalCap: 0.75 },
  dodge: { basePct: 4, perVelPct: 0.8, capPct: 40 },
  crit: { scalePct: 50, k: 60, capPct: 55 },
  turnOrderJitter: 0.1,
  battle: { maxRounds: 200 },
  actions: { defendDamageMult: 0.5, defendChakraPct: 0.1, meditateChakraPct: 0.25 },
  recovery: { encounterHpPct: 0.25, encounterChakraPct: 0.5, levelUpHpPct: 0.25 },
  control: {
    maxTurnsCommon: 2,
    maxTurnsBoss: 1,
    bossChanceMult: 0.5,
    chanceCap: 0.85,
    tenacityTurns: 2,
    genjutsuDivisor: 100,
  },
  mastery: {
    stepUses: [6, 9, 12, 15, 18],
    costPerLevel: 0.05,
    damagePerLevel: 0.03,
    effectChancePerLevel: 0.08,
    maxLevel: 5,
    maxLevelOffAffinity: 3,
  },
  cost: { offAffinityMult: 1.25 },
  xp: { toNextBase: 24, toNextPerLevel: 12, commonBase: 8, commonPerLevel: 4, eliteMult: 1.6, bossMult: bossXpMult },
  enemyGrades,
  rewards,
  loadout: { geninSlots: 4 },
  shop: { equipmentOffers: 2, rareScrollsPerStock: 1, rareScrollMaxPerRun: 5, rewardRyo: 60, trainingUses: 4 },
  history: { maxEntries: 50 },
};
