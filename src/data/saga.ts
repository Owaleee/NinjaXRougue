import type { StoryPointId } from '../game/types';

export interface SagaNodeDef {
  index: number;
  kind: 'common' | 'boss';
  /** Nível de história: define a força do inimigo (DD v2 §9). */
  storyLevel: number;
  pool: string[];
  bossId: string | null;
  campBefore: boolean;
  advancesStoryTo: StoryPointId | null;
}

export interface SagaDef {
  id: string;
  name: string;
  startStory: StoryPointId;
  nodes: SagaNodeDef[];
}

/** 26 encontros: 12 comuns, Zabuza, 12 comuns, Haku (Apêndice A.3). Três comuns = um nível. */
function buildOndaNodes(): SagaNodeDef[] {
  const nodes: SagaNodeDef[] = [];
  for (let i = 0; i < 26; i++) {
    if (i === 12) {
      nodes.push({ index: i, kind: 'boss', storyLevel: 5, pool: [], bossId: 'zabuza', campBefore: true, advancesStoryTo: 'onda_pos_zabuza' });
    } else if (i === 25) {
      nodes.push({ index: i, kind: 'boss', storyLevel: 10, pool: [], bossId: 'haku', campBefore: true, advancesStoryTo: null });
    } else {
      const firstHalf = i < 12;
      const storyLevel = firstHalf ? Math.floor(i / 3) + 1 : Math.floor((i - 13) / 3) + 6;
      const pool = firstHalf ? ['bandido', 'ninja_renegado'] : ['mercenario_nevoa', 'ninja_renegado'];
      nodes.push({ index: i, kind: 'common', storyLevel, pool, bossId: null, campBefore: false, advancesStoryTo: null });
    }
  }
  return nodes;
}

export const SAGA_ONDA: SagaDef = {
  id: 'onda',
  name: 'Saga da Onda',
  startStory: 'onda',
  nodes: buildOndaNodes(),
};
