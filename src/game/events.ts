import type { Action } from './combat/types';
import type { StoryPointId } from './types';

/**
 * Tudo o que acontece no jogo vira um evento. A interface anima os eventos,
 * o log os descreve e o rastreador de estatísticas os conta — o motor não
 * conhece nenhum deles (DD v2 §14 "Como funciona por baixo").
 */
export type GameEvent =
  | { type: 'battleStart'; playerId: string; enemyId: string }
  | { type: 'roundStart'; round: number; order: string[] }
  | { type: 'turnStart'; actorId: string; round: number }
  | { type: 'chakraRegen'; actorId: string; amount: number }
  | { type: 'actionChosen'; actorId: string; action: Action }
  | { type: 'jutsuUsed'; actorId: string; jutsuId: string; cost: number }
  | { type: 'damage'; sourceId: string; targetId: string; amount: number; crit: boolean; elementMult: number; jutsuId: string | null; hpAfter: number }
  | { type: 'dodge'; sourceId: string; targetId: string }
  | { type: 'miss'; sourceId: string; targetId: string; reason: 'henge' }
  | { type: 'negated'; sourceId: string; targetId: string; reason: 'kawarimi' | 'clone' }
  | { type: 'dot'; targetId: string; effectId: string; amount: number; hpAfter: number }
  | { type: 'heal'; targetId: string; hp: number; chakra: number }
  | { type: 'defend'; actorId: string; chakra: number }
  | { type: 'meditate'; actorId: string; chakra: number }
  | { type: 'itemUsed'; actorId: string; itemId: string }
  | { type: 'effectApplied'; targetId: string; effectId: string; remaining: number | null }
  | { type: 'effectResisted'; targetId: string; effectId: string; reason: 'tenacity' | 'chance' }
  | { type: 'effectExpired'; targetId: string; effectId: string }
  | { type: 'controlledSkip'; actorId: string; effectId: string }
  | { type: 'transformOn'; actorId: string; transformationId: string }
  | { type: 'transformOff'; actorId: string; transformationId: string; reason: 'manual' | 'noChakra' | 'battleEnd' }
  | { type: 'transformUpkeep'; actorId: string; amount: number }
  | { type: 'masteryUp'; actorId: string; jutsuId: string; level: number }
  | { type: 'defeated'; targetId: string }
  | { type: 'battleEnd'; winner: 'player' | 'enemy'; reason: 'ko' | 'timeout' }
  | { type: 'reward'; xp: number; ryo: number; rep: number }
  | { type: 'levelUp'; level: number }
  | { type: 'jutsuLearned'; jutsuId: string }
  | { type: 'bossDefeated'; enemyId: string }
  | { type: 'storyAdvanced'; story: StoryPointId }
  | { type: 'runEnded'; result: 'dead' | 'victory' };
