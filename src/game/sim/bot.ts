import { BALANCE as B } from '../Balance';
import { emptyAttributes } from '../attributes';
import { ATTR_KEYS, type AttrKey, type Attributes } from '../types';
import { ITEMS } from '../../data/items';
import { JUTSUS } from '../../data/jutsus';
import { attackExpected, expectedDamage } from '../combat/ai';
import { getEnemy, getPlayer } from '../combat/battle';
import { costFor } from '../combat/cost';
import type { Action, BattleState } from '../combat/types';
import { EFFECTS } from '../../data/effects';
import { activeTransformation } from '../effects/EffectSystem';
import { mostUsedJutsu } from '../meta/stats';
import { masteryLevelFromUses } from '../progression/mastery';
import {
  allocateRunPoints,
  battleAction,
  buyInRun,
  chooseReward,
  continueFromResult,
  currentNode,
  equipItemInRun,
  newRun,
  restAtCamp,
  setLoadoutInRun,
  startEncounter,
} from '../run/runManager';
import { priceOf } from '../run/shop';
import type { RewardOptionId, RunState } from '../run/types';
import type { BuildDef } from './builds';

/**
 * Robô jogador do simulador (DD v2 Apêndice A.5). Simples de propósito:
 * um humano deve se sair MELHOR que ele. Os limiares abaixo são do robô
 * (ferramenta de simulação), não balanceamento do jogo.
 */

/** Abaixo desta fração de HP o robô usa o kit médico. */
const BOT_KIT_HP_PCT = 0.35;
/** Abaixo desta fração de HP (sem kit) o robô se defende. */
const BOT_DEFEND_HP_PCT = 0.25;
/** Nos chefes, abaixo desta fração de chakra o robô usa a pílula. */
const BOT_PILL_CHAKRA_PCT = 0.3;
/** Sem jutsu utilizável, abaixo desta fração de chakra o robô medita. */
const BOT_MEDITATE_CHAKRA_PCT = 0.5;
/** Trava de segurança contra simulação em laço infinito. */
const BOT_MAX_STEPS = 5000;

/** A cada ponto, investe no atributo mais "atrasado" em relação ao peso desejado. */
export function allocationByWeights(current: Attributes, points: number, weights: Partial<Record<AttrKey, number>>): Attributes {
  const alloc = emptyAttributes(0);
  const keys = ATTR_KEYS.filter((k) => (weights[k] ?? 0) > 0);
  const invested = (k: AttrKey) => current[k] - B.attributes.start + alloc[k];
  for (let p = 0; p < points; p++) {
    const total = keys.reduce((s, k) => s + invested(k), 0) + 1;
    let best = keys[0] as AttrKey;
    let bestGap = -Infinity;
    for (const k of keys) {
      const gap = (weights[k] ?? 0) * total - invested(k);
      if (gap > bestGap) {
        bestGap = gap;
        best = k;
      }
    }
    alloc[best]++;
  }
  return alloc;
}

export function creationAllocation(build: BuildDef): Attributes {
  return allocationByWeights(emptyAttributes(B.attributes.start), B.attributes.creationPoints, build.weights);
}

export function botAllocate(run: RunState, build: BuildDef): RunState {
  const c = run.character;
  if (c.unspentPoints <= 0) return run;
  return allocateRunPoints(run, allocationByWeights(c.baseAttrs, c.unspentPoints, build.weights)).run;
}

const BUY_ORDER = ['colete_ninja', 'kunai', 'kit_medico', 'kit_medico', 'pilula_chakra', 'katana', 'colete_reforcado'];

export function botShop(run: RunState, build: BuildDef): RunState {
  let r = run;
  const taiBuild = (build.weights.tai ?? 0) > (build.weights.nin ?? 0);
  for (const id of BUY_ORDER) {
    const item = ITEMS[id];
    if (!item) continue;
    const c = r.character;
    if (item.kind === 'consumable') {
      const want = id === 'kit_medico' ? 2 : 1;
      if ((c.inventory[id] ?? 0) >= want) continue;
    } else {
      if (c.ownedEquipment.includes(id) || !r.shop.equipment.includes(id)) continue;
      if (id === 'katana' && !taiBuild) continue;
    }
    // Interpretação do A.5: compra estrita na ordem. Sem ryo para o próximo
    // item, o robô para e poupa (não gasta em itens mais baixos da lista).
    if (c.ryo < priceOf(id, c)) break;
    r = buyInRun(r, id);
    if (item.kind === 'weapon' || item.kind === 'armor') r = equipItemInRun(r, id);
  }
  return r;
}

/** Equipa os 4 jutsus de dano mais fortes (o robô ignora buffs e controle). */
export function botLoadout(run: RunState): RunState {
  const damaging = run.character.learned
    .map((id) => JUTSUS[id])
    .filter((j): j is NonNullable<typeof j> => !!j && j.power !== null)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.cost - b.cost)
    .slice(0, B.loadout.geninSlots)
    .map((j) => j.id);
  if (damaging.length === 0 || damaging.join() === run.character.equipped.join()) return run;
  return setLoadoutInRun(run, damaging);
}

const REWARD_PRIORITY: RewardOptionId[] = ['kit', 'pilula', 'treino', 'ryo', 'reforco'];

export function botReward(run: RunState): RunState {
  const offer = run.pendingChoices[0];
  if (!offer) return run;
  const option = REWARD_PRIORITY.find((o) => offer.includes(o)) as RewardOptionId;
  return chooseReward(run, option, option === 'treino' ? run.character.equipped[0] : undefined);
}

/**
 * `justDefended`: o robô defendeu no turno anterior. Nunca defende dois turnos
 * seguidos (evita a espiral de defesa até a morte). O chamador guarda o flag,
 * pois `defending` do combatente é zerado no início de cada turno.
 */
export function botAction(s: BattleState, justDefended = false): Action {
  const me = getPlayer(s);
  const foe = getEnemy(s);
  if (s.onlyKai) {
    const kai = me.jutsus.find((id) => JUTSUS[id]?.cleanse);
    if (kai) return { type: 'jutsu', jutsuId: kai };
  }
  const transf = me.transformationId ? EFFECTS[me.transformationId] : undefined;
  if (transf && !activeTransformation(me) && !s.transformToggled && me.chakra >= (transf.activationCost ?? 0) + (transf.upkeepPerTurn ?? 0)) {
    return { type: 'transform' };
  }
  const hpPct = me.hp / me.maxHp;
  if (hpPct < BOT_KIT_HP_PCT && (me.inventory['kit_medico'] ?? 0) > 0) return { type: 'item', itemId: 'kit_medico' };
  if (foe.isBoss && me.chakra < me.maxChakra * BOT_PILL_CHAKRA_PCT && (me.inventory['pilula_chakra'] ?? 0) > 0) {
    return { type: 'item', itemId: 'pilula_chakra' };
  }
  if (hpPct < BOT_DEFEND_HP_PCT && !justDefended) return { type: 'defend' };
  const usable = me.jutsus
    .map((id) => JUTSUS[id])
    .filter((j): j is NonNullable<typeof j> => !!j && j.power !== null && costFor(me, j) <= me.chakra)
    .sort((a, b) => expectedDamage(me, foe, b) - expectedDamage(me, foe, a));
  const best = usable[0];
  if (best && expectedDamage(me, foe, best) > attackExpected(me)) return { type: 'jutsu', jutsuId: best.id };
  const hasDamageJutsu = me.jutsus.some((id) => (JUTSUS[id]?.power ?? null) !== null);
  if (hasDamageJutsu && !best && me.chakra < me.maxChakra * BOT_MEDITATE_CHAKRA_PCT) return { type: 'meditate' };
  return { type: 'attack' };
}

export interface RunOutcome {
  reachedZabuza: boolean;
  beatZabuza: boolean;
  completed: boolean;
  zabuzaRounds: number | null;
  hakuRounds: number | null;
  commonRounds: number[];
  commonHpEnd: number[];
  /** Nível de maestria do jutsu mais usado da run (spec §12). */
  mainJutsuMastery: number;
  encountersWon: number;
}

export function simulateRun(build: BuildDef, seed: number): RunOutcome {
  let run = newRun(
    { name: 'Robô', clan: build.clan, affinity: build.affinity, allocation: creationAllocation(build), titleId: null },
    seed,
    0,
  );
  const out: RunOutcome = {
    reachedZabuza: false,
    beatZabuza: false,
    completed: false,
    zabuzaRounds: null,
    hakuRounds: null,
    commonRounds: [],
    commonHpEnd: [],
    mainJutsuMastery: 0,
    encountersWon: 0,
  };
  for (let guard = 0; run.phase !== 'dead' && run.phase !== 'victory'; guard++) {
    if (guard > BOT_MAX_STEPS) throw new Error(`Simulação travou (build ${build.id}, semente ${seed}).`);
    if (run.phase === 'result') {
      while (run.pendingChoices.length) run = botReward(run);
      run = continueFromResult(run);
      continue;
    }
    if (run.phase === 'camp') {
      run = restAtCamp(run);
      continue;
    }
    run = botLoadout(botShop(botAllocate(run, build), build));
    if (currentNode(run).enemyId === 'zabuza') out.reachedZabuza = true;
    run = startEncounter(run).run;
    let justDefended = false;
    while (run.phase === 'battle' && run.battle) {
      const action = botAction(run.battle, justDefended);
      justDefended = action.type === 'defend';
      run = battleAction(run, action, { inPlace: true }).run;
    }
    const res = run.lastResult;
    if (!res) continue;
    if (res.enemyId === 'zabuza') {
      out.zabuzaRounds = res.rounds;
      out.beatZabuza = res.won;
    } else if (res.enemyId === 'haku') {
      out.hakuRounds = res.rounds;
    } else if (res.won) {
      out.commonRounds.push(res.rounds);
      out.commonHpEnd.push(res.hpPctEnd);
    }
  }
  const c = run.character;
  out.completed = run.phase === 'victory';
  out.encountersWon = run.stats.encountersWon;
  const main = mostUsedJutsu(run.stats);
  out.mainJutsuMastery = main && JUTSUS[main] ? masteryLevelFromUses(c.masteryUses[main] ?? 0, JUTSUS[main], c.clan, c.affinity) : 0;
  return out;
}
