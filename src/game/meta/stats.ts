import type { GameEvent } from '../events';
import type { Grade } from '../types';

/**
 * Estatísticas da run, alimentadas SÓ por eventos do motor (DD v2 §14).
 * A Ficha, os títulos e o histórico leem daqui; o combate não sabe que isso existe.
 */
export interface RunStats {
  defeatedByGrade: Partial<Record<Grade, number>>;
  bossesDefeated: string[];
  elitesDefeated: number;
  encountersWon: number;
  damageDealt: number;
  damageTaken: number;
  biggestHit: number;
  crits: number;
  jutsuUses: Record<string, number>;
  turns: number;
  chakraSpent: number;
  ryoEarned: number;
  ryoSpent: number;
  itemsUsed: number;
  flawlessWins: number;
  bossNoDamage: boolean;
  /** Menor hpPctEnd entre os chefes vencidos; null = nenhum chefe vencido ainda. */
  bossMinHpPct: number | null;
}

export interface EncounterSummary {
  won: boolean;
  grade: Grade;
  isBoss: boolean;
  elite: boolean;
  enemyId: string;
  damageTaken: number;
  /** HP/HP máximo ao fim da luta, ANTES da recuperação pós-encontro. */
  hpPctEnd: number;
  ryo: number;
}

export function emptyRunStats(): RunStats {
  return {
    defeatedByGrade: {},
    bossesDefeated: [],
    elitesDefeated: 0,
    encountersWon: 0,
    damageDealt: 0,
    damageTaken: 0,
    biggestHit: 0,
    crits: 0,
    jutsuUses: {},
    turns: 0,
    chakraSpent: 0,
    ryoEarned: 0,
    ryoSpent: 0,
    itemsUsed: 0,
    flawlessWins: 0,
    bossNoDamage: false,
    bossMinHpPct: null,
  };
}

export function trackBattleEvents(stats: RunStats, events: GameEvent[], playerId: string): RunStats {
  const s = structuredClone(stats);
  for (const e of events) {
    switch (e.type) {
      case 'damage':
        if (e.sourceId === playerId) {
          s.damageDealt += e.amount;
          s.biggestHit = Math.max(s.biggestHit, e.amount);
          if (e.crit) s.crits++;
        } else if (e.targetId === playerId) {
          s.damageTaken += e.amount;
        }
        break;
      case 'dot':
        if (e.targetId === playerId) s.damageTaken += e.amount;
        else s.damageDealt += e.amount;
        break;
      case 'jutsuUsed':
        if (e.actorId === playerId) {
          s.jutsuUses[e.jutsuId] = (s.jutsuUses[e.jutsuId] ?? 0) + 1;
          s.chakraSpent += e.cost;
        }
        break;
      case 'turnStart':
        if (e.actorId === playerId) s.turns++;
        break;
      case 'itemUsed':
        if (e.actorId === playerId) s.itemsUsed++;
        break;
      default:
        break;
    }
  }
  return s;
}

export function trackEncounterEnd(stats: RunStats, r: EncounterSummary): RunStats {
  const s = structuredClone(stats);
  if (!r.won) return s;
  s.encountersWon++;
  s.defeatedByGrade[r.grade] = (s.defeatedByGrade[r.grade] ?? 0) + 1;
  s.ryoEarned += r.ryo;
  if (r.elite) s.elitesDefeated++;
  if (r.damageTaken === 0) s.flawlessWins++;
  if (r.isBoss) {
    s.bossesDefeated.push(r.enemyId);
    if (r.damageTaken === 0) s.bossNoDamage = true;
    s.bossMinHpPct = s.bossMinHpPct === null ? r.hpPctEnd : Math.min(s.bossMinHpPct, r.hpPctEnd);
  }
  return s;
}

export function mostUsedJutsu(stats: RunStats): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [id, n] of Object.entries(stats.jutsuUses)) {
    if (n > max) {
      max = n;
      best = id;
    }
  }
  return best;
}
