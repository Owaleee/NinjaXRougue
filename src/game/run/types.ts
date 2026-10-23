import type { BattleState } from '../combat/types';
import type { RunStats } from '../meta/stats';
import type { PlayerCharacter } from '../progression/character';
import type { Grade, StoryPointId } from '../types';
import type { ShopStock } from './shop';

export interface RunNode {
  index: number;
  kind: 'common' | 'boss';
  storyLevel: number;
  enemyId: string;
  /** Se houver, o mapa oferece a bifurcação "Comum ou Elite". */
  eliteEnemyId: string | null;
  campBefore: boolean;
  advancesStoryTo: StoryPointId | null;
}

export type RunPhase = 'camp' | 'map' | 'battle' | 'result' | 'dead' | 'victory';

/** Opções da escolha 1-de-3 ao subir de nível (spec C12: nunca jutsu). */
export const REWARD_OPTIONS = ['kit', 'pilula', 'reforco', 'ryo', 'treino'] as const;
export type RewardOptionId = (typeof REWARD_OPTIONS)[number];

export interface EncounterResult {
  nodeIndex: number;
  enemyId: string;
  enemyName: string;
  grade: Grade;
  isBoss: boolean;
  elite: boolean;
  won: boolean;
  xp: number;
  ryo: number;
  rep: number;
  levelsGained: number;
  learned: string[];
  damageTaken: number;
  rounds: number;
  hpPctEnd: number;
}

export interface RunState {
  version: 1;
  seed: number;
  rngState: number;
  /** Foto do início do encontro: recarregar no meio da luta volta exatamente para cá. */
  encounterStart: { rngState: number; stats: RunStats } | null;
  startedAt: number;
  sagaId: string;
  story: StoryPointId;
  character: PlayerCharacter;
  nodes: RunNode[];
  nodeIndex: number;
  phase: RunPhase;
  battle: BattleState | null;
  elite: boolean;
  battleTally: { damageTaken: number; rounds: number };
  shop: ShopStock;
  /** Uma oferta 1-de-3 por nível ganho, resolvidas em ordem. */
  pendingChoices: RewardOptionId[][];
  stats: RunStats;
  lastResult: EncounterResult | null;
}
