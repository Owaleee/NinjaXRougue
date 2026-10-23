import { BALANCE as B } from '../Balance';
import { RuleError } from '../errors';
import type { GameEvent } from '../events';
import { xpForCommon } from '../formulas';
import { Rng } from '../Rng';
import type { AttrKey, Attributes, Grade } from '../types';
import { ELITE_OF, ENEMIES } from '../../data/enemies';
import { SAGA_ONDA } from '../../data/saga';
import { TITLES } from '../../data/titles';
import { applyActionInPlace, getEnemy, getPlayer, startBattle } from '../combat/battle';
import { createEnemy } from '../combat/enemyFactory';
import type { Action } from '../combat/types';
import { emptyRunStats, trackBattleEvents, trackEncounterEnd } from '../meta/stats';
import {
  allocatePoints,
  characterMaxChakra,
  characterMaxHp,
  clampVitals,
  createCharacter,
  gainXp,
  type CreateParams,
  type PlayerCharacter,
} from '../progression/character';
import { equipJutsu, setLoadout } from '../progression/loadout';
import { checkUnlocks } from '../progression/unlock';
import { applyBattleResult, playerToCombatant } from './battleSetup';
import { buyItem, equipItem, generateStock, priceOf, useRareScroll } from './shop';
import { REWARD_OPTIONS, type RewardOptionId, type RunNode, type RunPhase, type RunState } from './types';

/**
 * Ciclo da run (spec §7): mapa → (Acampamento) → batalha → resultado → ...
 * Todas as funções devolvem uma NOVA run (exceto battleAction com inPlace).
 * O RNG da run vive em `rngState`; cada função recria o Rng, usa e guarda o novo estado.
 */

export function buildRunNodes(rng: Rng): RunNode[] {
  const defs = SAGA_ONDA.nodes;
  // Elite nunca no nó imediatamente antes de um Acampamento (spec §7).
  const eligible = defs.filter((n) => n.kind === 'common' && !defs[n.index + 1]?.campBefore).map((n) => n.index);
  const elites = new Set(rng.shuffle(eligible).slice(0, B.run.eliteForks));
  return defs.map((n) => {
    const enemyId = n.kind === 'boss' ? (n.bossId as string) : rng.pick(n.pool);
    return {
      index: n.index,
      kind: n.kind,
      storyLevel: n.storyLevel,
      enemyId,
      eliteEnemyId: elites.has(n.index) ? (ELITE_OF[enemyId] ?? null) : null,
      campBefore: n.campBefore,
      advancesStoryTo: n.advancesStoryTo,
    };
  });
}

export function newRun(params: CreateParams, seed: number, now: number): RunState {
  const rng = new Rng(seed);
  const { character } = checkUnlocks(createCharacter(params), SAGA_ONDA.startStory, 0);
  const nodes = buildRunNodes(rng);
  const shop = generateStock(rng);
  return {
    version: 1,
    seed,
    rngState: rng.state,
    encounterStart: null,
    startedAt: now,
    sagaId: SAGA_ONDA.id,
    story: SAGA_ONDA.startStory,
    character,
    nodes,
    nodeIndex: 0,
    phase: nodes[0]?.campBefore ? 'camp' : 'map',
    battle: null,
    elite: false,
    battleTally: { damageTaken: 0, rounds: 0 },
    shop,
    pendingChoices: [],
    stats: emptyRunStats(),
    lastResult: null,
  };
}

export function currentNode(run: RunState): RunNode {
  const n = run.nodes[run.nodeIndex];
  if (!n) throw new RuleError('noNode', 'A run já terminou.');
  return n;
}

function requirePhase(run: RunState, ...phases: RunPhase[]): void {
  if (!phases.includes(run.phase)) throw new RuleError('wrongPhase', `Ação indisponível na fase "${run.phase}".`);
}

const PREP_PHASES: RunPhase[] = ['map', 'camp', 'result'];

/** Acampamento antes de chefe: HP e chakra 100% (checkpoint). */
export function restAtCamp(run: RunState): RunState {
  requirePhase(run, 'camp');
  const r = structuredClone(run);
  r.character.hp = characterMaxHp(r.character);
  r.character.chakra = characterMaxChakra(r.character);
  r.phase = 'map';
  return r;
}

export function startEncounter(run: RunState, elite = false): { run: RunState; events: GameEvent[] } {
  requirePhase(run, 'map');
  const node = currentNode(run);
  if (elite && !node.eliteEnemyId) throw new RuleError('noElite', 'Este encontro não tem variante elite.');
  const r = structuredClone(run);
  r.encounterStart = { rngState: r.rngState, stats: structuredClone(r.stats) };
  const rng = Rng.fromState(r.rngState);
  const enemy = createEnemy(elite ? (node.eliteEnemyId as string) : node.enemyId, node.storyLevel);
  const { state, events } = startBattle(playerToCombatant(r.character), enemy, rng);
  r.battle = state;
  r.elite = elite;
  r.phase = 'battle';
  r.battleTally = { damageTaken: 0, rounds: 0 };
  r.rngState = rng.state;
  absorbBattleEvents(r, events);
  if (state.status === 'ended') events.push(...finishEncounter(r));
  return { run: r, events };
}

/**
 * Executa uma ação do jogador. ATENÇÃO: com `inPlace: true` a run recebida é
 * MUTADA (sem clonar) e devolvida; uso exclusivo do simulador, por desempenho.
 */
export function battleAction(run: RunState, action: Action, opts: { inPlace?: boolean } = {}): { run: RunState; events: GameEvent[] } {
  requirePhase(run, 'battle');
  if (!run.battle) throw new RuleError('noBattle', 'Nenhuma batalha em andamento.');
  const r = opts.inPlace ? run : structuredClone(run);
  const rng = Rng.fromState(r.rngState);
  const events = applyActionInPlace(r.battle as NonNullable<RunState['battle']>, action, rng);
  r.rngState = rng.state;
  absorbBattleEvents(r, events);
  if (r.battle?.status === 'ended') events.push(...finishEncounter(r));
  return { run: r, events };
}

function absorbBattleEvents(r: RunState, events: GameEvent[]): void {
  r.stats = trackBattleEvents(r.stats, events, 'player');
  for (const e of events) {
    if ((e.type === 'damage' || e.type === 'dot') && e.targetId === 'player') r.battleTally.damageTaken += e.amount;
    if (e.type === 'roundStart') r.battleTally.rounds = e.round;
  }
}

function xpReward(node: RunNode, grade: Grade, elite: boolean): number {
  const base = xpForCommon(node.storyLevel);
  if (node.kind === 'boss') return base * (B.xp.bossMult[grade] ?? B.xp.bossMultDefault);
  return elite ? Math.round(base * B.xp.eliteMult) : base;
}

function rollRewardChoices(c: PlayerCharacter, rng: Rng): RewardOptionId[] {
  const options = REWARD_OPTIONS.filter((o) => o !== 'treino' || c.equipped.length > 0);
  return rng.shuffle(options).slice(0, 3);
}

/** Fecha o encontro: aplica resultado, recompensas, níveis, recuperação, saga, loja e desbloqueios (muta r). */
function finishEncounter(r: RunState): GameEvent[] {
  const events: GameEvent[] = [];
  const battle = r.battle as NonNullable<RunState['battle']>;
  const node = currentNode(r);
  const enemy = getEnemy(battle);
  const template = ENEMIES[enemy.templateId as string];
  if (!template) throw new RuleError('unknownEnemy', `Inimigo desconhecido: ${enemy.templateId}`);

  r.character = applyBattleResult(r.character, getPlayer(battle));
  const hpPctEnd = r.character.hp / characterMaxHp(r.character);
  const won = battle.winner === 'player';
  const common = {
    nodeIndex: node.index,
    enemyId: template.id,
    enemyName: template.name,
    grade: template.grade,
    isBoss: template.isBoss,
    elite: r.elite,
    won,
    damageTaken: r.battleTally.damageTaken,
    rounds: r.battleTally.rounds,
    hpPctEnd,
  };
  r.battle = null;
  r.encounterStart = null;

  if (!won) {
    r.lastResult = { ...common, xp: 0, ryo: 0, rep: 0, levelsGained: 0, learned: [] };
    r.phase = 'dead';
    events.push({ type: 'runEnded', result: 'dead' });
    return events;
  }

  const rng = Rng.fromState(r.rngState);
  const mods = r.character.titleId ? (TITLES[r.character.titleId]?.mods ?? {}) : {};
  const table = B.rewards[template.grade] ?? { ryo: 0, rep: 0 };
  const ryo = Math.round(table.ryo * (1 + (mods.ryoPct ?? 0)));
  const rep = Math.round(table.rep * (1 + (mods.repPct ?? 0)));
  const xp = xpReward(node, template.grade, r.elite);
  r.character.ryo += ryo;
  r.character.reputation += rep;
  events.push({ type: 'reward', xp, ryo, rep });

  const startLevel = r.character.level;
  const lv = gainXp(r.character, xp);
  r.character = lv.character;
  for (let i = 1; i <= lv.levelsGained; i++) {
    events.push({ type: 'levelUp', level: startLevel + i });
    r.pendingChoices.push(rollRewardChoices(r.character, rng));
  }

  // Recuperação pós-encontro (DD v2 §9): +25% HP e +50% chakra.
  r.character.hp += Math.round(characterMaxHp(r.character) * B.recovery.encounterHpPct);
  r.character.chakra += Math.round(characterMaxChakra(r.character) * B.recovery.encounterChakraPct);
  clampVitals(r.character);

  if (template.isBoss) {
    events.push({ type: 'bossDefeated', enemyId: template.id });
    r.shop = generateStock(rng);
  }
  if (node.advancesStoryTo) {
    r.story = node.advancesStoryTo;
    events.push({ type: 'storyAdvanced', story: r.story });
  }
  const unlocked = checkUnlocks(r.character, r.story, node.index);
  r.character = unlocked.character;
  for (const id of unlocked.learned) events.push({ type: 'jutsuLearned', jutsuId: id });

  r.rngState = rng.state;
  r.stats = trackEncounterEnd(r.stats, {
    won: true,
    grade: template.grade,
    isBoss: template.isBoss,
    elite: r.elite,
    enemyId: template.id,
    damageTaken: common.damageTaken,
    hpPctEnd,
    ryo,
  });
  r.lastResult = { ...common, xp, ryo, rep, levelsGained: lv.levelsGained, learned: unlocked.learned };
  r.nodeIndex++;
  if (r.nodeIndex >= r.nodes.length) {
    r.phase = 'victory';
    // A run acabou: escolhas 1-de-3 pendentes são descartadas de propósito.
    r.pendingChoices = [];
    events.push({ type: 'runEnded', result: 'victory' });
  } else {
    r.phase = 'result';
  }
  return events;
}

const REWARD_ITEM: Partial<Record<RewardOptionId, string>> = {
  kit: 'kit_medico',
  pilula: 'pilula_chakra',
  reforco: 'pergaminho_reforco',
};

/** Resolve a primeira oferta 1-de-3 pendente. "treino" exige um jutsu equipado. */
export function chooseReward(run: RunState, option: RewardOptionId, jutsuId?: string): RunState {
  requirePhase(run, 'result');
  const offer = run.pendingChoices[0];
  if (!offer) throw new RuleError('noPendingChoice', 'Não há escolha pendente.');
  if (!offer.includes(option)) throw new RuleError('notOffered', 'Esta opção não foi oferecida.');
  const r = structuredClone(run);
  const c = r.character;
  const itemId = REWARD_ITEM[option];
  if (itemId) {
    c.inventory[itemId] = (c.inventory[itemId] ?? 0) + 1;
  } else if (option === 'ryo') {
    c.ryo += B.shop.rewardRyo;
    r.stats.ryoEarned += B.shop.rewardRyo;
  } else {
    if (!jutsuId || !c.equipped.includes(jutsuId)) throw new RuleError('needJutsu', 'Escolha um jutsu equipado para o treino.');
    c.masteryUses[jutsuId] = (c.masteryUses[jutsuId] ?? 0) + B.shop.trainingUses;
  }
  r.pendingChoices.shift();
  return r;
}

export function continueFromResult(run: RunState): RunState {
  requirePhase(run, 'result');
  if (run.pendingChoices.length) throw new RuleError('pendingChoices', 'Resolva as escolhas de recompensa antes de seguir.');
  const r = structuredClone(run);
  r.phase = currentNode(r).campBefore ? 'camp' : 'map';
  return r;
}

export function allocateRunPoints(run: RunState, alloc: Partial<Attributes>): { run: RunState; learned: string[] } {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  const u = checkUnlocks(allocatePoints(r.character, alloc), r.story, r.nodeIndex);
  r.character = u.character;
  return { run: r, learned: u.learned };
}

export function buyInRun(run: RunState, itemId: string): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  const price = priceOf(itemId, r.character);
  const b = buyItem(r.character, r.shop, itemId);
  r.character = b.character;
  r.shop = b.stock;
  r.stats.ryoSpent += price;
  return r;
}

export function equipItemInRun(run: RunState, itemId: string): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  r.character = equipItem(r.character, itemId);
  return r;
}

export function useRareScrollInRun(run: RunState, attr: AttrKey): { run: RunState; learned: string[] } {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  const u = checkUnlocks(useRareScroll(r.character, attr), r.story, r.nodeIndex);
  r.character = u.character;
  return { run: r, learned: u.learned };
}

export function equipJutsuInRun(run: RunState, jutsuId: string, replaceId: string | null = null): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  r.character = equipJutsu(r.character, jutsuId, replaceId);
  return r;
}

export function setLoadoutInRun(run: RunState, ids: string[]): RunState {
  requirePhase(run, ...PREP_PHASES);
  const r = structuredClone(run);
  r.character = setLoadout(r.character, ids);
  return r;
}
