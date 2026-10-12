import { BALANCE as B } from '../Balance';
import type { Attributes, ClanId, Element, Grade } from '../types';
import { JUTSU_LIST, JUTSUS, type JutsuDef } from '../../data/jutsus';
import { SAGA_ONDA } from '../../data/saga';
import { TITLE_LIST, type TitleDef } from '../../data/titles';
import { masteryLevelFromUses } from '../progression/mastery';
import type { RunState } from '../run/types';
import type { RunStats } from './stats';

/**
 * Tudo o que sobrevive entre runs (DD v2 §15): coleção de jutsus, títulos,
 * estatísticas vitalícias e histórico. Atualizada uma vez, no fim de cada run.
 */
export type RunResult = 'dead' | 'victory' | 'abandoned';

export interface HistoryEntry {
  id: string;
  date: number;
  name: string;
  clan: ClanId;
  affinity: Element;
  level: number;
  reputation: number;
  encountersWon: number;
  result: RunResult;
  text: string;
  snapshot: {
    baseAttrs: Attributes;
    learned: string[];
    mastery: Record<string, number>;
    equipment: { weapon: string | null; armor: string | null };
    stats: RunStats;
  };
}

export interface LifetimeStats {
  runs: number;
  victories: number;
  defeatedByGrade: Partial<Record<Grade, number>>;
  bossesDefeated: Record<string, number>;
}

export interface MetaState {
  version: 1;
  learnedEver: string[];
  masteredEver: string[];
  titlesUnlocked: string[];
  lifetime: LifetimeStats;
  history: HistoryEntry[];
  /** Última run registrada; garante idempotência mesmo depois do histórico ser cortado em 50. */
  lastRecordedRunId: string | null;
}

export function emptyMeta(): MetaState {
  return {
    version: 1,
    learnedEver: [],
    masteredEver: [],
    titlesUnlocked: [],
    lifetime: { runs: 0, victories: 0, defeatedByGrade: {}, bossesDefeated: {} },
    history: [],
    lastRecordedRunId: null,
  };
}

export function runEndText(run: RunState, result: RunResult): string {
  const level = run.character.level;
  if (result === 'victory') return `Concluiu a ${SAGA_ONDA.name} no nível ${level}`;
  if (result === 'abandoned') return `Abandonou a run no encontro ${run.nodeIndex + 1} de ${run.nodes.length}`;
  return `Morreu na ${SAGA_ONDA.name}, nível ${level}, para ${run.lastResult?.enemyName ?? 'um inimigo'}`;
}

function masteryLevels(run: RunState): Record<string, number> {
  const c = run.character;
  const out: Record<string, number> = {};
  for (const id of c.learned) {
    const j = JUTSUS[id];
    if (j) out[id] = masteryLevelFromUses(c.masteryUses[id] ?? 0, j, c.clan, c.affinity);
  }
  return out;
}

/** Avalia a condição de um título. `meta` já deve conter os números desta run. */
export function isTitleEarned(t: TitleDef, meta: MetaState, run: RunState): boolean {
  const cond = t.condition;
  switch (cond.kind) {
    case 'bossDefeated':
      return (meta.lifetime.bossesDefeated[cond.enemyId] ?? 0) > 0;
    case 'lifetimeDefeatedGrade':
      return (meta.lifetime.defeatedByGrade[cond.grade] ?? 0) >= cond.count;
    case 'bossNoDamage':
      return run.stats.bossNoDamage;
    case 'bossLowHp':
      return run.stats.bossMinHpPct !== null && run.stats.bossMinHpPct < cond.maxHpPct;
    case 'jutsusLearnedInRun':
      return run.character.learned.length >= cond.count;
    case 'elementMastery':
      return meta.masteredEver.filter((id) => JUTSUS[id]?.element === cond.element).length >= cond.count;
    case 'rareScrollsInRun':
      return run.character.rareScrollsUsed >= cond.count;
    case 'promotedRank':
      return false; // promoção só existe a partir da Fase 2
  }
}

/**
 * Registra o fim de uma run na meta. Finalizar = recordRunEnd → saveMeta → deleteRun;
 * chamar de novo com a mesma run é seguro (no-op: devolve a mesma meta e nenhum título novo).
 * O id da run é estável (`run-${startedAt}-${seed}`).
 */
export function recordRunEnd(
  meta: MetaState,
  run: RunState,
  result: RunResult,
  now: number,
): { meta: MetaState; newTitles: string[] } {
  const id = `run-${run.startedAt}-${run.seed}`;
  if (meta.lastRecordedRunId === id || meta.history.some((h) => h.id === id)) return { meta, newTitles: [] };
  const m = structuredClone(meta);
  m.lastRecordedRunId = id;
  const c = run.character;
  m.lifetime.runs++;
  if (result === 'victory') m.lifetime.victories++;
  for (const [grade, n] of Object.entries(run.stats.defeatedByGrade) as [Grade, number][]) {
    m.lifetime.defeatedByGrade[grade] = (m.lifetime.defeatedByGrade[grade] ?? 0) + n;
  }
  for (const id of run.stats.bossesDefeated) m.lifetime.bossesDefeated[id] = (m.lifetime.bossesDefeated[id] ?? 0) + 1;

  const mastery = masteryLevels(run);
  m.learnedEver = [...new Set([...m.learnedEver, ...c.learned])];
  const masteredNow = Object.entries(mastery)
    .filter(([, lvl]) => lvl >= B.mastery.maxLevel)
    .map(([id]) => id);
  m.masteredEver = [...new Set([...m.masteredEver, ...masteredNow])];

  m.history.unshift({
    id,
    date: now,
    name: c.name,
    clan: c.clan,
    affinity: c.affinity,
    level: c.level,
    reputation: c.reputation,
    encountersWon: run.stats.encountersWon,
    result,
    text: runEndText(run, result),
    snapshot: {
      baseAttrs: { ...c.baseAttrs },
      learned: [...c.learned],
      mastery,
      equipment: { ...c.equipment },
      stats: structuredClone(run.stats),
    },
  });
  m.history = m.history.slice(0, B.history.maxEntries);

  const newTitles = TITLE_LIST.filter((t) => !m.titlesUnlocked.includes(t.id) && isTitleEarned(t, m, run)).map((t) => t.id);
  m.titlesUnlocked.push(...newTitles);
  return { meta: m, newTitles };
}

/** Títulos que o jogador pode escolher na criação (ocultos nunca aparecem no MVP). */
export function availableTitles(meta: MetaState): TitleDef[] {
  return TITLE_LIST.filter((t) => !t.hidden && meta.titlesUnlocked.includes(t.id));
}

export interface EncyclopediaEntry {
  jutsu: JutsuDef;
  learned: boolean;
  mastered: boolean;
}

/** Pool COMPLETO de jutsus (todas as fases e clãs), sem golpes exclusivos de inimigos. */
export function encyclopedia(meta: MetaState): EncyclopediaEntry[] {
  return JUTSU_LIST.filter((j) => !j.enemyOnly).map((jutsu) => ({
    jutsu,
    learned: meta.learnedEver.includes(jutsu.id),
    mastered: meta.masteredEver.includes(jutsu.id),
  }));
}
